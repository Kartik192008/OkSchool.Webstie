import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mockTestResultsTable = pgTable("mock_test_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mockTestId: integer("mock_test_id").notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  correct: integer("correct").notNull(),
  incorrect: integer("incorrect").notNull(),
  unattempted: integer("unattempted").notNull(),
  timeTaken: integer("time_taken").notNull(),
  answers: jsonb("answers").$type<Record<number, string | null>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMockTestResultSchema = createInsertSchema(mockTestResultsTable).omit({ id: true, createdAt: true });
export type InsertMockTestResult = z.infer<typeof insertMockTestResultSchema>;
export type MockTestResult = typeof mockTestResultsTable.$inferSelect;
