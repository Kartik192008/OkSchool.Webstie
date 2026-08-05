CREATE TABLE IF NOT EXISTS "mock_test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mock_test_id" integer NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"correct" integer NOT NULL,
	"incorrect" integer NOT NULL,
	"unattempted" integer NOT NULL,
	"time_taken" integer NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mock_test_results_user_idx" ON "mock_test_results" USING btree ("user_id","created_at");
