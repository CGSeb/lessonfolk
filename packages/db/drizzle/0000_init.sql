CREATE TABLE "learner" (
	"user_id" text PRIMARY KEY NOT NULL,
	"profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"path" text[],
	"path_reason" text,
	"path_updated_at" timestamp with time zone,
	"current_lesson_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"score" real,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id"),
	CONSTRAINT "lesson_progress_status_check" CHECK ("lesson_progress"."status" in ('in_progress', 'done', 'skipped')),
	CONSTRAINT "lesson_progress_score_check" CHECK ("lesson_progress"."score" is null or ("lesson_progress"."score" >= 0 and "lesson_progress"."score" <= 1))
);
--> statement-breakpoint
CREATE TABLE "progress_event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "progress_event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"client" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_learner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."learner"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_event" ADD CONSTRAINT "progress_event_user_id_learner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."learner"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "progress_event_user_created_idx" ON "progress_event" USING btree ("user_id","created_at");