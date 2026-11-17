CREATE TABLE "project_progress" (
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"review" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_progress_user_id_project_id_pk" PRIMARY KEY("user_id","project_id"),
	CONSTRAINT "project_progress_status_check" CHECK ("project_progress"."status" in ('in_progress', 'done'))
);
--> statement-breakpoint
ALTER TABLE "project_progress" ADD CONSTRAINT "project_progress_user_id_learner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."learner"("user_id") ON DELETE cascade ON UPDATE no action;