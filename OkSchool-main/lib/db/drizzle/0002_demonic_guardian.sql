CREATE TABLE "payments" (
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
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"supabase_user_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_supabase_user_id_unique" UNIQUE("supabase_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"page" text NOT NULL,
	"action" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mock_tests" ADD COLUMN "correct_marks" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD COLUMN "incorrect_marks" integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD COLUMN "unattempted_marks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_visits" ADD CONSTRAINT "user_visits_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_user_document_idx" ON "payments" USING btree ("user_id","document_id");