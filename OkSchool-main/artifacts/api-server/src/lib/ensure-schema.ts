import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

/**
 * Ensures the columns/indexes required by the app exist.
 * The production database is managed manually (drizzle migrations are not
 * executed by the server), so this runs idempotent DDL on boot.
 */
const ensureStatements = [
  `ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "user_id" text`,
  `ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "is_user_generated" integer DEFAULT 0 NOT NULL`,
  `UPDATE "mock_tests" SET "is_user_generated" = 0 WHERE "is_user_generated" IS NULL`,
  `CREATE INDEX IF NOT EXISTS "mock_tests_user_idx" ON "mock_tests" USING btree ("user_id","created_at")`,

  `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "section" text`,
  `CREATE INDEX IF NOT EXISTS "questions_mock_test_id_idx" ON "questions" USING btree ("mock_test_id")`,

  `CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents" USING btree ("category")`,
  `CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "documents" USING btree ("created_at" DESC)`,

  `CREATE INDEX IF NOT EXISTS "user_visits_user_id_idx" ON "user_visits" USING btree ("user_id","created_at")`,

  `CREATE INDEX IF NOT EXISTS "mock_test_results_user_idx" ON "mock_test_results" USING btree ("user_id","created_at")`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpay_payment_id_uq" ON "payments" ("razorpay_payment_id")`,

  // full-text-ish search support (pg_trgm) for ILIKE '%q%' queries
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX IF NOT EXISTS "documents_title_trgm_idx" ON "documents" USING gin ("title" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "documents_description_trgm_idx" ON "documents" USING gin ("description" gin_trgm_ops)`,
];

export async function ensureUserMockSchema(): Promise<void> {
  for (const statement of ensureStatements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (err) {
      console.error("[schema-ensure] failed statement:", statement, err);
    }
  }
}
