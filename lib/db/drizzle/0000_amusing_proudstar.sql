CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"file_type" text DEFAULT 'pdf' NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"price" integer,
	"file_url" text,
	"word_file_url" text,
	"thumbnail_url" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"pdf_downloads" integer DEFAULT 0 NOT NULL,
	"word_downloads" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "amazon_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"affiliate_url" text NOT NULL,
	"image_url" text,
	"price" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"subject" text NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mock_test_id" integer NOT NULL,
	"question" text NOT NULL,
	"question_image" text,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" text NOT NULL,
	"solution" text
);
--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_mock_test_id_mock_tests_id_fk" FOREIGN KEY ("mock_test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;