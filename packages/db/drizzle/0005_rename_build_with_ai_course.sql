-- The course `build-with-ai` is now `how-ai-apps-work`: lesson ids start with the course id.
UPDATE "lesson_progress" SET "lesson_id" = 'how-ai-apps-work/' || substr("lesson_id", length('build-with-ai/') + 1) WHERE "lesson_id" LIKE 'build-with-ai/%';--> statement-breakpoint
UPDATE "learner" SET "current_lesson_id" = 'how-ai-apps-work/' || substr("current_lesson_id", length('build-with-ai/') + 1) WHERE "current_lesson_id" LIKE 'build-with-ai/%';--> statement-breakpoint
UPDATE "learner" SET "path" = array_replace("path", 'build-with-ai', 'how-ai-apps-work') WHERE 'build-with-ai' = ANY("path");
