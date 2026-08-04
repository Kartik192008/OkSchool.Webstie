CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text NOT NULL,
	"razorpay_signature" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'captured' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"page" text NOT NULL,
	"action" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'mock_tests'::regclass AND attname = 'correct_marks') THEN
    ALTER TABLE "mock_tests" ADD COLUMN "correct_marks" integer DEFAULT 4 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'mock_tests'::regclass AND attname = 'incorrect_marks') THEN
    ALTER TABLE "mock_tests" ADD COLUMN "incorrect_marks" integer DEFAULT -1 NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'mock_tests'::regclass AND attname = 'unattempted_marks') THEN
    ALTER TABLE "mock_tests" ADD COLUMN "unattempted_marks" integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payments_user_document_idx" ON "payments" USING btree ("user_id","document_id");
