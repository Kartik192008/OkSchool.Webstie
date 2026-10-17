import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, documentsTable, mockTestsTable, questionsTable } from "@workspace/db";
import { GetDocumentParams, GetMockTestParams } from "@workspace/api-zod";

const router: IRouter = Router();

const SITE = "https://okschool-s.onrender.com";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(v: string): string {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function htmlPage(opts: {
  title: string;
  description: string;
  url: string;
  image?: string;
  body: string;
  jsonLd?: object;
}): string {
  const fullTitle = `${esc(opts.title)} | OkSchool`;
  const ogUrl = esc(opts.url);
  const twitterTitle = esc(fullTitle);
  const twitterDesc = esc(opts.description);
  const ogTitle = esc(fullTitle);
  const ogDesc = esc(opts.description);
  const jsonLdScript = opts.jsonLd ? `\n  <script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : "";
  const ogImageTag = opts.image
    ? `\n  <meta property="og:image" content="${esc(opts.image)}">\n  <meta name="twitter:image" content="${esc(opts.image)}">`
    : "";
  const twitterCard = opts.image ? "summary_large_image" : "summary";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${twitterDesc}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${ogUrl}">
  <meta property="og:site_name" content="OkSchool">${ogImageTag}
  <meta name="twitter:card" content="${twitterCard}">
  <meta name="twitter:title" content="${twitterTitle}">
  <meta name="twitter:description" content="${twitterDesc}">
  <link rel="canonical" href="${ogUrl}">
  ${jsonLdScript}
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #ffffff; }
    a { color: #c2410c; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .container { max-width: 960px; margin: 0 auto; padding: 32px 20px 80px; }
    header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .logo { font-weight: 800; font-size: 18px; color: #c2410c; text-decoration: none; font-family: 'Georgia', serif; letter-spacing: 0.5px; }
    .nav-link { color: #374151; font-size: 14px; margin-left: 24px; font-weight: 500; }
    h1 { font-size: 32px; margin: 0 0 12px; color: #111827; font-weight: 700; }
    p { margin: 0 0 16px; color: #4b5563; }
    .meta { display: flex; gap: 20px; font-size: 14px; color: #6b7280; margin: 24px 0; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .meta span { font-weight: 600; color: #111827; }
    .btn { display: inline-block; background: #c2410c; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 8px; }
    .btn:hover { background: #a3360a; }
    .btn-outline { display: inline-block; border: 2px solid #c2410c; color: #c2410c; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 8px; margin-left: 12px; }
    .btn-outline:hover { background: #c2410c; color: #fff; }
    .question { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #ffffff; }
    .question h3 { margin: 0 0 12px; font-size: 17px; color: #111827; font-weight: 600; line-height: 1.5; }
    .options { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
    .option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; background: #fafafa; cursor: pointer; font-size: 15px; color: #374151; }
    .option:hover { background: #f3f4f6; border-color: #c2410c; }
    .option input { width: 18px; height: 18px; accent-color: #c2410c; }
    .option-label { flex: 1; }
    .exam-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; }
    .exam-meta { display: flex; gap: 16px; font-size: 14px; color: #6b7280; margin-top: 8px; }
    .exam-meta span { font-weight: 600; color: #111827; }
    .timer-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fef2f2; color: #991b1b; border-radius: 6px; font-weight: 700; font-size: 14px; margin-bottom: 16px; }
    .footer-note { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; }
  </style>
</head>
<body>
  <div id="root">${opts.body}</div>
</body>
</html>`;
}

function documentBody(doc: any, url: string): string {
  const price = doc.isFree ? "Free PDF download" : `Rs. ${doc.price ?? 0}`;
  const categoryLabel = String(doc.category).replace(/-/g, " ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: doc.title,
    description: doc.description || doc.title,
    educationalLevel: "Class 10-12",
    learningResourceType: categoryLabel,
    isAccessibleForFree: !!doc.isFree,
    inLanguage: "en",
    url: `${SITE}${url}`,
    provider: { "@type": "Organization", name: "OkSchool", url: SITE },
  };

  const body = `
    <header>
      <a href="${SITE}/" class="logo">OkSchool</a>
      <a href="${SITE}/mock-tests" class="nav-link">Mock Tests</a>
      <a href="${SITE}/amazon-store" class="nav-link">Amazon Store</a>
    </header>
    <div class="container">
      <p><a href="${SITE}/" class="nav-link">&larr; Back to Home</a></p>
      <h1>${esc(doc.title)}</h1>
      <p style="font-size: 17px; color: #4b5563;">${esc(doc.description || doc.title)}</p>
      <div class="meta">
        <span>Category:</span> ${esc(categoryLabel)}
        <span>File type:</span> ${esc(doc.fileType)}
        <span>Access:</span> ${esc(price)}
      </div>
      <p style="margin-top: 24px;"><a href="${SITE}${url}" class="btn">Open ${esc(doc.title)}</a></p>
      <p class="footer-note">Free notes, investigatory projects, question papers and mock tests for students on OkSchool.</p>
    </div>`;

  return { body, jsonLd };
}

function mockTestBody(test: any, questions: any[], url: string): string {
  const section = test.section || "General";
  const subject = test.subject || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${test.title} Mock Test`,
    description: test.description || "",
    educationalLevel: "Class 10-12",
    learningResourceType: section,
    isAccessibleForFree: test.isUserGenerated === 0,
    inLanguage: "en",
    url: `${SITE}${url}`,
    provider: { "@type": "Organization", name: "OkSchool", url: SITE },
  };

  const questionsHtml = questions.map((q, idx) => {
    const options = [
      { label: "A", value: q.optionA },
      { label: "B", value: q.optionB },
      { label: "C", value: q.optionC },
      { label: "D", value: q.optionD },
    ];
    const optionsHtml = options.map(o =>
      `<label class="option"><input type="radio" name="q-${q.id}" value="${esc(o.value)}" /> <span class="option-label">${esc(o.label)}. ${esc(o.value)}</span></label>`
    ).join("");
    return `
      <div class="question">
        <h3>Q${idx + 1}. ${esc(q.question)}</h3>
        <div class="options">${optionsHtml}</div>
      </div>`;
  }).join("");

  const body = `
    <header>
      <a href="${SITE}/" class="logo">OkSchool</a>
      <a href="${SITE}/mock-tests" class="nav-link">Mock Tests</a>
    </header>
    <div class="container">
      <p><a href="${SITE}/mock-tests" class="nav-link">&larr; Back to Mock Tests</a></p>
      <div class="exam-header">
        <div>
          <h1>${esc(test.title)} Mock Test</h1>
          <p style="font-size: 17px; color: #4b5563; margin-top: 8px;">${esc(test.description || "")}</p>
        </div>
        <div class="timer-badge">⏱ ${test.duration} minutes</div>
      </div>
      <div class="exam-meta">
        <span>Section:</span> ${esc(section)}
        <span>Subject:</span> ${esc(subject)}
        <span>Questions:</span> ${esc(test.questionCount)}
      </div>
      <p style="margin-top: 20px;"><a href="${SITE}${url}" class="btn">Start Mock Test</a></p>
      <div class="questions">
        <h3 style="margin-bottom: 16px; font-size: 18px; color: #111827;">Sample Questions</h3>
        ${questionsHtml}
      </div>
      <p class="footer-note">Attempt free mock tests and track your progress on OkSchool.</p>
    </div>`;

  return { body, jsonLd };
}

/** GET /study-material/:id/:slug — server-rendered document page */
router.get("/study-material/:id/:slug", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
    if (!doc) {
      res.status(404).send("<h1>Document not found</h1><p><a href='" + SITE + "/'>Back to Home</a></p>");
      return;
    }

    const url = `/study-material/${doc.id}/${slugify(doc.title)}`;
    const { body, jsonLd } = documentBody(doc, url);
    const description = `${doc.description || doc.title} - free PDF download for students on OkSchool. Category: ${String(doc.category).replace(/-/g, " ")}.`;

    const html = htmlPage({
      title: doc.title,
      description,
      url: `${SITE}${url}`,
      image: doc.thumbnailUrl || undefined,
      body,
      jsonLd,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(html);
  } catch (err) {
    console.error("SSR document failed:", err);
    res.status(500).send("<h1>Server error</h1>");
  }
});

/** GET /mock-test/:id/:slug — server-rendered mock test page */
router.get("/mock-test/:id/:slug", async (req, res): Promise<void> => {
  const params = GetMockTestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [test] = await db.select().from(mockTestsTable).where(eq(mockTestsTable.id, params.data.id));
    if (!test) {
      res.status(404).send("<h1>Mock test not found</h1><p><a href='" + SITE + "/mock-tests'>Back to Mock Tests</a></p>");
      return;
    }

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.mockTestId, params.data.id));

    const url = `/mock-test/${test.id}/${slugify(test.title)}`;
    const { body, jsonLd } = mockTestBody(test, questions, url);
    const description = `Attempt the ${test.title} mock test: ${test.questionCount} questions in ${test.duration} minutes. ${test.description || ""}`;

    const html = htmlPage({
      title: `${test.title} Mock Test`,
      description,
      url: `${SITE}${url}`,
      body,
      jsonLd,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(html);
  } catch (err) {
    console.error("SSR mock test failed:", err);
    res.status(500).send("<h1>Server error</h1>");
  }
});

export default router;
