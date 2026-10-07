/**
 * Database schema for learner progress. It mirrors .progress/progress.json
 * (see .progress/progress.example.json): one `learner` row per user, one
 * `lesson_progress` row per lesson they started, and an append-only
 * `progress_event` log of every change.
 *
 * After changing this file, run `npm run generate -w @lessonfolk/db` and commit
 * the new SQL migration in drizzle/.
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/** Lesson statuses, as in progress.json. */
export const LESSON_STATUSES = ['in_progress', 'done', 'skipped'] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

/** The learner profile, stored as-is (name, experience, goal, language, level, interests…). */
export type LearnerProfile = Record<string, unknown>;

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const learner = pgTable('learner', {
  /** Who the progress belongs to. Auth tables come later; until then any stable id. */
  userId: text('user_id').primaryKey(),
  profile: jsonb('profile').$type<LearnerProfile>().notNull().default({}),
  /** Recommended course ids, in order. */
  path: text('path').array(),
  pathReason: text('path_reason'),
  pathUpdatedAt: timestamp('path_updated_at', { withTimezone: true }),
  /** Lesson id (`<course-id>/<lesson file name>`) the learner is working on. */
  currentLessonId: text('current_lesson_id'),
  ...timestamps,
});

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => learner.userId, { onDelete: 'cascade' }),
    lessonId: text('lesson_id').notNull(),
    status: text('status').$type<LessonStatus>().notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    /** 0–1, the tutor's estimate from the checks. */
    score: real('score'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    check('lesson_progress_status_check', sql`${table.status} in ('in_progress', 'done', 'skipped')`),
    check('lesson_progress_score_check', sql`${table.score} is null or (${table.score} >= 0 and ${table.score} <= 1)`),
  ],
);

/** Append-only: rows are inserted, never updated or deleted (except with their learner). */
export const progressEvent = pgTable(
  'progress_event',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => learner.userId, { onDelete: 'cascade' }),
    /** What happened, e.g. `lesson.started`, `lesson.completed`, `path.updated`. */
    action: text('action').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    /** Which client made the change (e.g. `claude-code`, `codex`, `dashboard`). */
    client: text('client'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('progress_event_user_created_idx').on(table.userId, table.createdAt)],
);

export type Learner = typeof learner.$inferSelect;
export type NewLearner = typeof learner.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
export type ProgressEvent = typeof progressEvent.$inferSelect;
export type NewProgressEvent = typeof progressEvent.$inferInsert;
