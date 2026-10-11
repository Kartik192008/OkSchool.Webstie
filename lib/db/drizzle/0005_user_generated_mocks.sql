-- User-generated mock tests: adds ownership columns to mock_tests
-- Safe to run multiple times (idempotent).

ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "is_user_generated" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mock_tests_user_idx" ON "mock_tests" USING btree ("user_id","created_at");--> statement-breakpoint
UPDATE "mock_tests" SET "is_user_generated" = 0 WHERE "is_user_generated" IS NULL;
