import { Router, type IRouter } from "express";
import { eq, sql, ilike, or } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
  RecordDocumentViewParams,
  RecordDocumentDownloadParams,
  RecordDocumentDownloadBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, q } = parsed.data;

  let query = db.select().from(documentsTable).$dynamic();

  if (category && q) {
    query = query.where(
      sql`${documentsTable.category} = ${category} AND (${ilike(documentsTable.title, `%${q}%`)} OR ${ilike(documentsTable.description, `%${q}%`)})`
    );
  } else if (category) {
    query = query.where(eq(documentsTable.category, category));
  } else if (q) {
    query = query.where(
      or(
        ilike(documentsTable.title, `%${q}%`),
        ilike(documentsTable.description, `%${q}%`)
      )
    );
  }

  const docs = await query.orderBy(documentsTable.createdAt);
  res.json(docs);
});

router.post("/documents", async (req, res): Promise<void> => {
  console.log("Document upload request body:", JSON.stringify(req.body, null, 2));
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    console.log("Document validation error:", parsed.error);
    res.status(400).json({ error: parsed.error.message, details: parsed.error });
    return;
  }

  try {
    const [doc] = await db.insert(documentsTable).values(parsed.data).returning();
    console.log("Document created successfully:", doc);
    res.status(201).json(doc);
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ error: "Failed to create document", details: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db
    .update(documentsTable)
    .set(parsed.data)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/documents/:id/view", async (req, res): Promise<void> => {
  const params = RecordDocumentViewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .update(documentsTable)
    .set({ viewCount: sql`${documentsTable.viewCount} + 1` })
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

router.get("/documents/:id/download", async (req, res): Promise<void> => {
  try {
    const params = GetDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const fileType = typeof req.query.type === "string" ? req.query.type : "pdf";

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    let fileUrl: string | null = null;
    let contentType = "application/octet-stream";

    switch (fileType) {
      case "word":
        fileUrl = doc.wordFileUrl;
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case "thumbnail":
        fileUrl = doc.thumbnailUrl;
        contentType = "image/jpeg";
        break;
      case "pdf":
      default:
        fileUrl = doc.fileUrl;
        contentType = "application/pdf";
        break;
    }

    if (!fileUrl) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch file from storage" });
      return;
    }

    const upstreamContentType = response.headers.get("content-type");
    if (upstreamContentType) {
      contentType = upstreamContentType;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.removeHeader("X-Frame-Options");

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Length", String(arrayBuffer.byteLength));
    res.send(Buffer.from(arrayBuffer));
    } catch (err) {
    console.error("Error serving document file:", err);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

router.post("/documents/:id/download", async (req, res): Promise<void> => {
  const params = RecordDocumentDownloadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RecordDocumentDownloadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const field = body.data.fileType === "word" ? documentsTable.wordDownloads : documentsTable.pdfDownloads;

  const [doc] = await db
    .update(documentsTable)
    .set({ [body.data.fileType === "word" ? "wordDownloads" : "pdfDownloads"]: sql`${field} + 1` })
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  res.json(doc);
});

export default router;
