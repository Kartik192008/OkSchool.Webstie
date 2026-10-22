import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../lib/auth";
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
  const safe = docs.map((d: any) => {
    const { fileUrl, wordFileUrl, ...rest } = d;
    return rest;
  });
  res.json(safe);
});

router.post("/documents", requireAdmin, async (req, res): Promise<void> => {
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
  const { fileUrl, wordFileUrl, ...safe } = doc as any;
  res.json(safe);
});

router.patch("/documents/:id", requireAdmin, async (req, res): Promise<void> => {
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

router.delete("/documents/:id", requireAdmin, async (req, res): Promise<void> => {
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
      res.status(400).json({ error: params.success ? "" : params.error.message });
      return;
    }

    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const fileType = typeof req.query.type === "string" ? req.query.type : "pdf";

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

    // Paid material: require a verified, paying user.
    if (!doc.isFree && fileType !== "thumbnail") {
      const header = String(req.headers?.authorization || "");
      const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
      if (!token) {
        res.status(401).json({ error: "Login required to download paid material" });
        return;
      }
      const { verifySupabaseToken } = await import("../lib/auth");
      const user = await verifySupabaseToken(token);
      if (!user) {
        res.status(401).json({ error: "Invalid or expired session" });
        return;
      }
      const { paymentsTable } = await import("@workspace/db");
      const { and, eq: eqOp } = await import("drizzle-orm");
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(and(eqOp(paymentsTable.documentId, doc.id), eqOp(paymentsTable.userId, user.id)));
      if (!payment) {
        res.status(402).json({ error: "Payment required" });
        return;
      }
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch file from storage" });
      return;
    }

    const upstreamContentType = response.headers.get("content-type");
    if (upstreamContentType) contentType = upstreamContentType;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.removeHeader("X-Frame-Options");

    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    if (response.body) {
      const { Readable } = await import("node:stream");
      const stream = Readable.fromWeb(response.body as any);
      stream.on("error", (err: any) => {
        console.error("stream error:", err);
        if (!res.headersSent) res.status(500).end();
        else res.end();
      });
      stream.pipe(res);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error("Error serving document file:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to serve file" });
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
