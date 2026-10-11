import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: text("user_id").notNull(),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id").notNull(),
  razorpaySignature: text("razorpay_signature").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull().default("captured"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userDocIdx: index("payments_user_document_idx").on(table.userId, table.documentId),
}));

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
