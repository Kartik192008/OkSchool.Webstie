import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mockTestsTable = pgTable("mock_tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  subject: text("subject").notNull(),
  section: text("section").notNull().default("General"),
  duration: integer("duration").notNull().default(30),
  questionCount: integer("question_count").notNull().default(0),
  correctMarks: integer("correct_marks").notNull().default(4),
  incorrectMarks: integer("incorrect_marks").notNull().default(-1),
  unattemptedMarks: integer("unattempted_marks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  mockTestId: integer("mock_test_id").notNull().references(() => mockTestsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionImage: text("question_image"),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  solution: text("solution"),
});

export const insertMockTestSchema = createInsertSchema(mockTestsTable).omit({ id: true, createdAt: true, questionCount: true });
export type InsertMockTest = z.infer<typeof insertMockTestSchema>;
export type MockTest = typeof mockTestsTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
