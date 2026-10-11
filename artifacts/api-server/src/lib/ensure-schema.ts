import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

/**
 * Ensures the columns required by the user-generated mock feature exist.
 * The production database is managed manually (drizzle migrations are not
 * executed by the server), so this runs idempotent DDL on boot.
 */
const ensureStatements = [
  `ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "user_id" text`,
  `ALTER TABLE "mock_tests" ADD COLUMN IF NOT EXISTS "is_user_generated" integer DEFAULT 0 NOT NULL`,
  `UPDATE "mock_tests" SET "is_user_generated" = 0 WHERE "is_user_generated" IS NULL`,
  `CREATE INDEX IF NOT EXISTS "mock_tests_user_idx" ON "mock_tests" USING btree ("user_id","created_at")`,
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
