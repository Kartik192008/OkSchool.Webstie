import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const amazonProductsTable = pgTable("amazon_products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  affiliateUrl: text("affiliate_url").notNull(),
  imageUrl: text("image_url"),
  price: text("price"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAmazonProductSchema = createInsertSchema(amazonProductsTable).omit({ id: true, createdAt: true });
export type InsertAmazonProduct = z.infer<typeof insertAmazonProductSchema>;
export type AmazonProduct = typeof amazonProductsTable.$inferSelect;
