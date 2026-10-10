/**
 * The Postgres `ProgressStore` (see packages/core/src/store.ts).
 *
 * Every write runs in one transaction: lock the learner row, read the progress, apply the
 * core tutor rule, write what changed and append a `progress_event`. A rule that fails throws
 * a `ProgressStoreError`, which rolls the transaction back, so nothing changes.
 *
 * A learner belongs to a `user` row (created at sign-in by Better Auth, or the local user in
 * `LESSONFOLK_AUTH=none`). The store never creates users: a write for an unknown user id
 * fails with `unknown_user`. It creates the `learner` row on the first write if sign-in has
 * not already done it.
 */
import {
  type CompleteLessonInput,
  type Progress,
  type ProgressStore,
  type TutorCourseRef,
  type WriteOptions,
  MAX_IMPORT_BYTES,
  ProgressStoreError,
  completeLesson,
  emptyProgress,
  formatProgress,
  isFinished,
  parseImportedProgress,
  placementSkip,
  recordReviewScore,
  resetCourse,
  saveNotes,
  setPath,
  skipLesson,
  startLesson,
  unwrapTutorResult,
  updateProfile,
} from '@lessonfolk/core';
import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from './connection.ts';
import { type LearnerProfile, type NewLessonProgress, learner, lessonProgress, progressEvent, user } from './schema.ts';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type Executor = Database | Transaction;

export interface PostgresProgressStoreOptions {
  /**
   * The courses the rules check against, in `index.yaml` order (e.g. `loadCatalog()`). A
   * function is called on every write, so a reloaded catalog is picked up.
   */
  courses: readonly TutorCourseRef[] | (() => readonly TutorCourseRef[]);
  /**
   * Called with the user id after a write has been committed (never for a write that rolled
   * back, never for a read). The dashboard uses it to refresh that learner's open pages.
   * A throwing callback is ignored: it cannot fail a write that is already saved.
   */
  onChange?: (userId: string) => void;
}

// ---------------------------------------------------------------------------
// Dates: progress.json holds ISO dates (`2026-10-04`), the tables hold timestamps.
// A date is stored at midnight UTC and read back as a date; any other time is kept and
// read back as a full ISO timestamp.
// ---------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toTimestamp(value: string | undefined | null, field: string): Date | null {
  if (value === undefined || value === null) return null;
  const date = new Date(ISO_DATE.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) {
    throw new ProgressStoreError('invalid_progress', `${field} is not a date: "${value}".`, {
      problems: [`${field}: not an ISO date ("YYYY-MM-DD")`],
    });
  }
  return date;
}

export function fromTimestamp(date: Date | null): string | undefined {
  if (!date) return undefined;
  const iso = date.toISOString();
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
}

// ---------------------------------------------------------------------------
// Rows <-> progress.json v1
// ---------------------------------------------------------------------------

async function readProgress(db: Executor, userId: string, lock = false): Promise<Progress | null> {
  const query = db.select().from(learner).where(eq(learner.userId, userId));
  const [row] = lock ? await query.for('update') : await query;
  if (!row) return null;
  const rows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId))
    .orderBy(lessonProgress.lessonId);

  const progress: Progress = { version: 1, profile: row.profile ?? {}, current: row.currentLessonId, lessons: {} };
  if (row.path !== null) progress.path = row.path;
  if (row.pathReason !== null) progress.pathReason = row.pathReason;
  const pathUpdatedAt = fromTimestamp(row.pathUpdatedAt);
  if (pathUpdatedAt !== undefined) progress.pathUpdatedAt = pathUpdatedAt;
  for (const lesson of rows) {
    const startedAt = fromTimestamp(lesson.startedAt);
    const completedAt = fromTimestamp(lesson.completedAt);
    progress.lessons[lesson.lessonId] = {
      status: lesson.status,
      ...(startedAt !== undefined && { startedAt }),
      ...(completedAt !== undefined && { completedAt }),
      ...(lesson.score !== null && { score: lesson.score }),
      ...(lesson.notes !== null && { notes: lesson.notes }),
    };
  }
  return progress;
}

function lessonRow(userId: string, lessonId: string, entry: Progress['lessons'][string]): NewLessonProgress {
  return {
    userId,
    lessonId,
    status: entry.status,
    startedAt: toTimestamp(entry.startedAt, `lessons.${lessonId}.startedAt`),
    completedAt: toTimestamp(entry.completedAt, `lessons.${lessonId}.completedAt`),
    score: entry.score ?? null,
    notes: entry.notes ?? null,
  };
}

const sameEntry = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Write the difference between `before` and `after`: the learner row, then changed, new and removed lessons. */
async function writeProgress(tx: Transaction, userId: string, before: Progress, after: Progress): Promise<void> {
  // Build every row first, so an invalid date fails before anything is written.
  const changed = Object.entries(after.lessons)
    .filter(([id, entry]) => !sameEntry(before.lessons[id], entry))
    .map(([id, entry]) => lessonRow(userId, id, entry));
  const removed = Object.keys(before.lessons).filter((id) => !(id in after.lessons));
  const now = new Date();

  await tx
    .update(learner)
    .set({
      profile: after.profile as LearnerProfile,
      path: after.path ? [...after.path] : null,
      pathReason: after.pathReason ?? null,
      pathUpdatedAt: toTimestamp(after.pathUpdatedAt, 'pathUpdatedAt'),
      currentLessonId: after.current ?? null,
      updatedAt: now,
    })
    .where(eq(learner.userId, userId));
  if (removed.length) {
    await tx.delete(lessonProgress).where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, removed)));
  }
  for (const row of changed) {
    const { userId: _user, lessonId: _lesson, ...values } = row;
    await tx
      .insert(lessonProgress)
      .values(row)
      .onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: { ...values, updatedAt: now } });
  }
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

interface Change {
  progress: Progress;
  /** The `progress_event` action and payload. */
  action: string;
  payload: Record<string, unknown>;
}

export function createPostgresProgressStore(db: Database, options: PostgresProgressStoreOptions): ProgressStore {
  const catalog = () => (typeof options.courses === 'function' ? options.courses() : options.courses);
  const notify = (userId: string) => {
    try {
      options.onChange?.(userId);
    } catch {
      // The write is saved: a broken listener must not turn it into an error.
    }
  };
  const dates = (opts?: WriteOptions) => (opts?.today ? { today: opts.today } : {});

  /** Run one write: lock the learner, apply `change` to the saved progress, save it and log it. */
  async function write(
    userId: string,
    opts: WriteOptions | undefined,
    change: (progress: Progress, courses: readonly TutorCourseRef[]) => Change,
  ): Promise<Progress> {
    const saved = await db.transaction(async (tx) => {
      const [found] = await tx.select({ id: user.id }).from(user).where(eq(user.id, userId));
      if (!found) throw new ProgressStoreError('unknown_user', `No user with id "${userId}".`, { userId });
      await tx.insert(learner).values({ userId }).onConflictDoNothing();
      const before = (await readProgress(tx, userId, true)) ?? emptyProgress();

      let result: Change;
      try {
        result = change(before, catalog());
      } catch (error) {
        if (error instanceof ProgressStoreError && error.details.userId === undefined) error.details.userId = userId;
        throw error;
      }
      // Every write reads and rewrites the whole progress: keep it under the import limit.
      if (JSON.stringify(result.progress).length > MAX_IMPORT_BYTES) {
        throw new ProgressStoreError('invalid_progress', `Saved progress is full (more than ${MAX_IMPORT_BYTES / 1024 / 1024} MB). Nothing was saved.`, {
          problems: [`size: more than ${MAX_IMPORT_BYTES / 1024 / 1024} MB`],
          userId,
        });
      }
      await writeProgress(tx, userId, before, result.progress);
      await tx.insert(progressEvent).values({ userId, action: result.action, payload: result.payload, client: opts?.client ?? null });
      // Read back what was stored (e.g. without fields progress.json allows but the tables do not keep).
      return (await readProgress(tx, userId))!;
    });
    notify(userId);
    return saved;
  }

  const unwrap = unwrapTutorResult;

  async function getProgress(userId: string): Promise<Progress> {
    return (await db.transaction((tx) => readProgress(tx, userId))) ?? emptyProgress();
  }

  return {
    getProgress,

    setProfile(userId, update, opts) {
      return write(userId, opts, (progress) => ({
        progress: updateProfile(progress, update),
        action: 'profile.updated',
        payload: { update },
      }));
    },

    setPath(userId, path, reason, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = unwrap(setPath(progress, courses, path, reason, dates(opts)), userId);
        return { progress: next, action: 'path.updated', payload: { path: next.path, reason: next.pathReason } };
      });
    },

    startLesson(userId, lessonId, opts) {
      return write(userId, opts, (progress, courses) => ({
        progress: unwrap(startLesson(progress, courses, lessonId, dates(opts)), userId),
        action: 'lesson.started',
        payload: { lessonId },
      }));
    },

    completeLesson(userId, lessonId, input: Omit<CompleteLessonInput, 'today'>, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = unwrap(completeLesson(progress, courses, lessonId, { ...input, ...dates(opts) }), userId);
        const entry = next.lessons[lessonId];
        return { progress: next, action: 'lesson.completed', payload: { lessonId, score: entry.score, notes: entry.notes } };
      });
    },

    skipLesson(userId, lessonId, notes, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = unwrap(skipLesson(progress, courses, lessonId, notes, dates(opts)), userId);
        return { progress: next, action: 'lesson.skipped', payload: { lessonId, notes: next.lessons[lessonId].notes } };
      });
    },

    placementSkip(userId, courseId, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = unwrap(placementSkip(progress, courses, courseId, dates(opts)), userId);
        const course = courses.find((c) => c.id === courseId)!;
        const lessonIds = course.lessons.map((l) => l.id).filter((id) => !isFinished(progress, id));
        return { progress: next, action: 'course.placement_skipped', payload: { courseId, lessonIds } };
      });
    },

    resetCourse(userId, courseId, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = unwrap(resetCourse(progress, courses, courseId), userId);
        const course = courses.find((c) => c.id === courseId)!;
        const lessonIds = course.lessons.map((l) => l.id).filter((id) => progress.lessons[id] !== undefined);
        const previous = Object.fromEntries(lessonIds.map((id) => [id, progress.lessons[id]]));
        return { progress: next, action: 'course.reset', payload: { courseId, lessonIds, previous } };
      });
    },

    saveNotes(userId, lessonId, notes, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = saveNotes(progress, courses, lessonId, notes);
        return { progress: next, action: 'lesson.notes_saved', payload: { lessonId, notes: next.lessons[lessonId].notes } };
      });
    },

    recordReviewScore(userId, lessonId, score, opts) {
      return write(userId, opts, (progress, courses) => {
        const next = recordReviewScore(progress, courses, lessonId, score);
        const previousScore = progress.lessons[lessonId]?.score ?? null;
        return {
          progress: next,
          action: 'lesson.reviewed',
          payload: { lessonId, score, previousScore, savedScore: next.lessons[lessonId].score },
        };
      });
    },

    async importProgress(userId, json, opts) {
      // Validate before opening the transaction: a bad file never touches the database.
      const imported = parseImportedProgress(json);
      return write(userId, opts, (previous) => ({
        progress: { ...imported, version: 1 },
        action: 'progress.imported',
        payload: {
          mode: 'replace',
          lessons: Object.keys(imported.lessons).length,
          replacedLessons: Object.keys(previous.lessons).length,
        },
      }));
    },

    async exportProgress(userId) {
      return formatProgress(await getProgress(userId));
    },

    async deleteLearner(userId) {
      const deleted = await db.delete(learner).where(eq(learner.userId, userId)).returning({ userId: learner.userId });
      if (deleted.length > 0) notify(userId);
      return deleted.length > 0;
    },
  };
}
