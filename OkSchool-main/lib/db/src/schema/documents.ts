import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  fileType: text("file_type").notNull().default("pdf"),
  isFree: boolean("is_free").notNull().default(true),
  price: integer("price"),
  fileUrl: text("file_url"),
  wordFileUrl: text("word_file_url"),
  thumbnailUrl: text("thumbnail_url"),
  viewCount: integer("view_count").notNull().default(0),
  pdfDownloads: integer("pdf_downloads").notNull().default(0),
  wordDownloads: integer("word_downloads").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, viewCount: true, pdfDownloads: true, wordDownloads: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
