import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable, mockTestsTable } from "@workspace/db";

const router: IRouter = Router();

const SITE = "https://okschool-s.onrender.com";

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slugify = (v: unknown): string =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

/**
 * Fetch the built SPA shell so prerendered pages keep their CSS/JS assets
 * and React hydration. Cached briefly to avoid a request per page load.
 */
let shellCache: { html: string; at: number } | null = null;
const SHELL_TTL = 5 * 60 * 1000;

async function getShell(): Promise<string> {
  if (shellCache && Date.now() - shellCache.at < SHELL_TTL) return shellCache.html;
  try {
    const res = await fetch(`${SITE}/`, { headers: { "User-Agent": "prerender" } });
    const html = await res.text();
    shellCache = { html, at: Date.now() };
    return html;
  } catch {
    // Fall back to a minimal shell so SEO output still works.
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body><div id="root"></div></body></html>`;
  }
}

function render(shell: string, opts: {
  title: string;
  description: string;
  canonical: string;
  jsonLd?: Record<string, unknown>;
  body: string;
}) {
  let html = shell;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(opts.title)} | OkSchool</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(opts.description)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${esc(opts.title)} | OkSchool" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${esc(opts.description)}" />`,
  );

  html = /<link rel="canonical"/.test(html)
    ? html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(opts.canonical)}" />`)
    : html.replace("</head>", `  <link rel="canonical" href="${esc(opts.canonical)}" />\n  </head>`);

  if (opts.jsonLd) {
    html = html.replace(
      "</head>",
      `  <script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>\n  </head>`,
    );
  }

  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${opts.body}</div>`);
  return html;
}

const wrapBody = (inner: string) => `
  <header style="padding:16px 24px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif">
    <a href="${SITE}/" style="font-weight:700;font-size:18px;color:#c2410c;text-decoration:none">OkSchool</a>
    <a href="${SITE}/mock-tests" style="font-size:14px;color:#555;text-decoration:none">Mock Tests</a>
  </header>
  <main style="max-width:960px;margin:0 auto;padding:32px 24px 64px;font-family:sans-serif;line-height:1.65;color:#1f2937">
    ${inner}
    <p style="font-size:14px;color:#6b7280;margin-top:24px">Free notes, investigatory projects, question papers and mock tests for students on OkSchool.</p>
  </main>`;

function sendHtml(res: any, html: string) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.send(html);
}

/** GET /api/prerender/study-material/:id/:slug? — dynamic HTML for a document. */
router.get("/api/prerender/study-material/:id/:slug?", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(404);
      sendHtml(res, await getShell());
      return;
    }

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) {
      res.status(404);
      sendHtml(res, await getShell());
      return;
    }

    const slug = slugify(doc.title);
    const canonical = `${SITE}/study-material/${id}/${slug}`;
    const category = String(doc.category).replace(/-/g, " ");
    const price = doc.isFree ? "Free PDF download" : `Rs. ${doc.price ?? ""}`;

    const html = render(await getShell(), {
      title: doc.title,
      description: `${doc.description || doc.title} - free PDF download for students on OkSchool. Category: ${category}.`,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: doc.title,
        description: doc.description || doc.title,
        educationalLevel: "Class 10-12",
        learningResourceType: category,
        isAccessibleForFree: !!doc.isFree,
        inLanguage: "en",
        url: canonical,
        provider: { "@type": "Organization", name: "OkSchool", url: SITE },
      },
      body: wrapBody(`
        <p style="margin:0 0 12px"><a href="${SITE}/" style="color:#c2410c;text-decoration:none">&larr; Back to Home</a></p>
        <h1 style="font-size:32px;margin:0 0 8px">${esc(doc.title)}</h1>
        <p style="font-size:17px;color:#4b5563;margin:0 0 20px">${esc(doc.description || doc.title)}</p>
        <p style="margin:0 0 8px"><strong>Category:</strong> ${esc(category)} &middot; <strong>File type:</strong> ${esc(doc.fileType)}</p>
        <p style="margin:0 0 24px"><strong>Access:</strong> ${esc(price)}</p>
        <p style="margin:0 0 24px"><a href="${SITE}${canonical.replace(SITE, "")}" style="background:#c2410c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Open ${esc(doc.title)}</a></p>
        <p><a href="${SITE}/${category.replace(/\s+/g, "-")}" style="color:#c2410c;text-decoration:none">Browse more ${esc(category)}</a></p>
      `),
    });

    sendHtml(res, html);
  } catch (err) {
    console.error("Prerender document failed:", err);
    res.status(500).json({ error: "Prerender failed" });
  }
});

/** GET /api/prerender/mock-test/:id/:slug? — dynamic HTML for an admin mock. */
router.get("/api/prerender/mock-test/:id/:slug?", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(404);
      sendHtml(res, await getShell());
      return;
    }

    const [mock] = await db.select().from(mockTestsTable).where(eq(mockTestsTable.id, id));
    if (!mock || Number(mock.isUserGenerated) !== 0) {
      res.status(404);
      sendHtml(res, await getShell());
      return;
    }

    const slug = slugify(mock.title);
    const canonical = `${SITE}/mock-test/${id}/${slug}`;

    const html = render(await getShell(), {
      title: `${mock.title} Mock Test - ${mock.subject}`,
      description: `Attempt the ${mock.title} mock test: ${mock.questionCount} questions in ${mock.duration} minutes. ${mock.description}`,
      canonical,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: mock.title,
        description: mock.description || mock.title,
        educationalLevel: "Class 10-12",
        about: mock.subject,
        numberOfQuestions: mock.questionCount,
        timeRequired: `PT${mock.duration}M`,
        url: canonical,
        provider: { "@type": "Organization", name: "OkSchool", url: SITE },
      },
      body: wrapBody(`
        <p style="margin:0 0 12px"><a href="${SITE}/mock-tests" style="color:#c2410c;text-decoration:none">&larr; Back to Mock Tests</a></p>
        <h1 style="font-size:32px;margin:0 0 8px">${esc(mock.title)}</h1>
        <p style="font-size:17px;color:#4b5563;margin:0 0 20px">${esc(mock.description || "")}</p>
        <p style="margin:0 0 8px"><strong>Section:</strong> ${esc(mock.section)} &middot; <strong>Subject:</strong> ${esc(mock.subject)}</p>
        <p style="margin:0 0 24px"><strong>Questions:</strong> ${esc(mock.questionCount)} &middot; <strong>Duration:</strong> ${esc(mock.duration)} minutes</p>
        <p style="margin:0"><a href="${SITE}${canonical.replace(SITE, "")}" style="background:#c2410c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Start Mock Test</a></p>
      `),
    });

    sendHtml(res, html);
  } catch (err) {
    console.error("Prerender mock failed:", err);
    res.status(500).json({ error: "Prerender failed" });
  }
});

export default router;
