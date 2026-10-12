import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(import.meta.dirname, "..", "dist");
const site = "https://okschool-s.onrender.com";
const apiBase = (process.env.PRERENDER_API_URL || "https://okschool-back.onrender.com").replace(/\/$/, "");

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Must stay in sync with slugify() in src/lib/seo.ts */
const slugify = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

async function fetchJson(url, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === attempts) throw err;
      // Render free-tier instances sleep; back off before retrying.
      await new Promise((r) => setTimeout(r, i * 4000));
    }
  }
}

async function buildPage(template, { title, description, url, jsonLd, body }) {
  let html = template;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${esc(title)} | OkSchool</title>`,
  );
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(description)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${esc(title)} | OkSchool" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${esc(description)}" />`,
  );

  // Replace an existing canonical link, or insert one before </head>.
  html = /<link rel="canonical"/.test(html)
    ? html.replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${esc(url)}" />`,
      )
    : html.replace("</head>", `  <link rel="canonical" href="${esc(url)}" />\n  </head>`);

  // Inject JSON-LD before </head>
  if (jsonLd) {
    html = html.replace(
      "</head>",
      `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`,
    );
  }

  // Replace the empty React mount point with crawlable static content.
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${body}</div>`,
  );

  return html;
}

function documentBody(doc, url) {
  const price = doc.isFree ? "Free PDF download" : `Rs. ${doc.price ?? ""}`;
  return `
    <header style="padding:16px 24px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif">
      <a href="${site}/" style="font-weight:700;font-size:18px;color:#c2410c;text-decoration:none">OkSchool</a>
      <a href="${site}/mock-tests" style="font-size:14px;color:#555;text-decoration:none">Mock Tests</a>
    </header>
    <main style="max-width:960px;margin:0 auto;padding:32px 24px 64px;font-family:sans-serif;line-height:1.6;color:#1f2937">
      <p style="margin:0 0 12px"><a href="${site}/" style="color:#c2410c;text-decoration:none">&larr; Back to Home</a></p>
      <h1 style="font-size:32px;margin:0 0 8px">${esc(doc.title)}</h1>
      <p style="font-size:17px;color:#4b5563;margin:0 0 20px">${esc(doc.description || doc.title)}</p>
      <p style="margin:0 0 8px"><strong>Category:</strong> ${esc(String(doc.category).replace(/-/g, " "))} &middot; <strong>File type:</strong> ${esc(doc.fileType)}</p>
      <p style="margin:0 0 24px"><strong>Access:</strong> ${esc(price)}</p>
      <p style="margin:0 0 24px"><a href="${site}${url}" style="background:#c2410c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Open ${esc(doc.title)}</a></p>
      <p style="font-size:14px;color:#6b7280">Free notes, investigatory projects, question papers and mock tests for students on OkSchool.</p>
    </main>`;
}

async function main() {
  console.log("[prerender] starting");

  let documents = [];
  let mocks = [];
  try {
    documents = await fetchJson(`${apiBase}/api/documents`);
    mocks = await fetchJson(`${apiBase}/api/mock-tests`);
  } catch (err) {
    console.warn(`[prerender] could not reach API (${err.message}); skipping prerender. Build still succeeds.`);
    return;
  }

  const template = await readFile(path.join(dist, "index.html"), "utf8");
  let count = 0;

  for (const doc of documents) {
    const slug = slugify(doc.title);
    if (!slug) continue;
    const url = `/study-material/${doc.id}/${slug}`;
    const title = doc.title;

    const html = await buildPage(template, {
      title,
      description: `${doc.description || doc.title} - free PDF download for students on OkSchool. Category: ${String(doc.category).replace(/-/g, " ")}.`,
      url: `${site}${url}`,
      body: documentBody(doc, url),
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: doc.title,
        description: doc.description || doc.title,
        educationalLevel: "Class 10-12",
        learningResourceType: String(doc.category).replace(/-/g, " "),
        isAccessibleForFree: !!doc.isFree,
        inLanguage: "en",
        url: `${site}${url}`,
        provider: { "@type": "Organization", name: "OkSchool", url: site },
      },
    });

    // Write to both layouts so the page resolves whether the host supports
    // directory index resolution or explicit .html paths. Both carry the same
    // canonical URL so search engines treat them as one page.
    const dirPath = path.join(dist, "study-material", slug);
    await mkdir(dirPath, { recursive: true });
    await writeFile(path.join(dirPath, "index.html"), html, "utf8");
    await writeFile(path.join(dist, "study-material", `${slug}.html`), html, "utf8");
    count++;
  }

  for (const mock of mocks) {
    if (Number(mock.isUserGenerated) !== 0) continue;
    const slug = slugify(mock.title);
    if (!slug) continue;
    const url = `/mock-test/${mock.id}/${slug}`;
    const title = `${mock.title} Mock Test - ${mock.subject}`;

    const html = await buildPage(template, {
      title,
      description: `Attempt the ${mock.title} mock test: ${mock.questionCount} questions in ${mock.duration} minutes. ${mock.description}`,
      url: `${site}${url}`,
      body: `
        <header style="padding:16px 24px;border-bottom:1px solid #eee;font-family:sans-serif">
          <a href="${site}/" style="font-weight:700;font-size:18px;color:#c2410c;text-decoration:none">OkSchool</a>
        </header>
        <main style="max-width:960px;margin:0 auto;padding:32px 24px 64px;font-family:sans-serif;line-height:1.6;color:#1f2937">
          <p style="margin:0 0 12px"><a href="${site}/mock-tests" style="color:#c2410c;text-decoration:none">&larr; Back to Mock Tests</a></p>
          <h1 style="font-size:32px;margin:0 0 8px">${esc(mock.title)}</h1>
          <p style="font-size:17px;color:#4b5563;margin:0 0 20px">${esc(mock.description || "")}</p>
          <p style="margin:0 0 8px"><strong>Section:</strong> ${esc(mock.section)} &middot; <strong>Subject:</strong> ${esc(mock.subject)}</p>
          <p style="margin:0 0 24px"><strong>Questions:</strong> ${esc(mock.questionCount)} &middot; <strong>Duration:</strong> ${esc(mock.duration)} minutes</p>
          <p style="margin:0"><a href="${site}${url}" style="background:#c2410c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Start Mock Test</a></p>
        </main>`,
    });

    const dirPath = path.join(dist, "mock-test", slug);
    await mkdir(dirPath, { recursive: true });
    await writeFile(path.join(dirPath, "index.html"), html, "utf8");
    await writeFile(path.join(dist, "mock-test", `${slug}.html`), html, "utf8");
    count++;
  }

  console.log(`[prerender] generated ${count} pages (${documents.length} documents, ${mocks.length} public mocks)`);
}

main().catch((err) => {
  console.warn(`[prerender] failed: ${err.message}`);
  // Never fail the build because of prerendering.
});
