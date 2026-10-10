import { z } from 'zod';
import { levelSchema } from './schemas.ts';
import { type CourseRef, type Profile, type Progress, PLACEMENT_NOTE, emptyProgress, progressSchema } from './progress.ts';
import type { CompleteLessonInput, TutorError, TutorErrorCode, TutorResult } from './tutor.ts';

/**
 * The storage contract for a learner's progress, shared by every backend (Postgres in
 * `@lessonfolk/db`). A store reads and writes progress in the progress.json v1 shape and
 * enforces the tutor rules of `tutor.ts` on every write: a write either applies completely
 * (and is logged) or fails with a `ProgressStoreError` and changes nothing.
 *
 * Learners are identified by their user id (the `user` row created at sign-in). The catalog
 * the rules check against is given to the store when it is created, so methods only take the
 * user id and the change.
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ProgressStoreErrorCode =
  | TutorErrorCode
  /** There is no `user` row with this id: progress belongs to a signed-in (or local) user. */
  | 'unknown_user'
  /** The lesson has no progress entry yet (start it first). */
  | 'not_started'
  /** A review score needs a lesson that is done. */
  | 'not_done'
  /** The profile change is not valid (listed in `issues`). */
  | 'invalid_profile'
  /** The imported progress is not valid progress.json v1 (listed in `issues`). */
  | 'invalid_progress';

export interface ProgressStoreErrorDetails extends Omit<TutorError, 'code' | 'message'> {
  userId?: string;
  /** For `invalid_profile` and `invalid_progress`: one `field: problem` line per issue. */
  problems?: string[];
}

/** A rejected write. Nothing was changed. */
export class ProgressStoreError extends Error {
  readonly code: ProgressStoreErrorCode;
  readonly details: ProgressStoreErrorDetails;

  constructor(code: ProgressStoreErrorCode, message: string, details: ProgressStoreErrorDetails = {}) {
    super(message);
    this.name = 'ProgressStoreError';
    this.code = code;
    this.details = details;
  }

  static fromTutor(error: TutorError, userId?: string): ProgressStoreError {
    const { code, message, ...details } = error;
    return new ProgressStoreError(code, message, { ...details, userId });
  }
}

/** The progress of a successful tutor rule, or throw its error as a `ProgressStoreError`. */
export function unwrapTutorResult(result: TutorResult, userId?: string): Progress {
  if (!result.ok) throw ProgressStoreError.fromTutor(result.error, userId);
  return result.progress;
}

// ---------------------------------------------------------------------------
// Rules the tutor functions do not cover: profile, notes, review scores, import
// ---------------------------------------------------------------------------

/**
 * A profile change: each field given replaces the saved one, `null` removes it, fields left
 * out are kept. Extra fields are stored as they are, like in progress.json.
 */
export type ProfileUpdate = { [K in keyof Profile]?: Profile[K] | null } & Record<string, unknown>;

const profileUpdateSchema = z.looseObject({
  name: z.string().trim().min(1).nullable().optional(),
  experience: z.string().trim().min(1).nullable().optional(),
  goal: z.string().trim().min(1).nullable().optional(),
  language: z.string().trim().min(1).nullable().optional(),
  // Unlike progress.json (which accepts any string so a typo never breaks the file), a write
  // through the store must use a known level.
  level: levelSchema.nullable().optional(),
  interests: z.array(z.string().trim().min(1)).nullable().optional(),
});

function issueLines(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.length ? issue.path.join('.') : '(root)'}: ${issue.message}`);
}

/** Apply a `ProfileUpdate`. Fails with `invalid_profile` for an unknown level or empty values. */
export function updateProfile(progress: Progress | null | undefined, update: ProfileUpdate): Progress {
  const parsed = profileUpdateSchema.safeParse(update);
  if (!parsed.success) {
    throw new ProgressStoreError('invalid_profile', 'The profile change is not valid.', { problems: issueLines(parsed.error) });
  }
  const base = progress ?? emptyProgress();
  const profile: Record<string, unknown> = { ...base.profile };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (value === null) delete profile[key];
    else profile[key] = value;
  }
  return { ...base, profile: profile as Profile };
}

const inCatalog = (courses: readonly CourseRef[], lessonId: string) =>
  courses.some((course) => course.lessons.some((lesson) => lesson.id === lessonId));

/**
 * Save the tutor's notes on a lesson that has an entry (in progress, done or skipped), e.g.
 * where the learner stopped mid-lesson. Notes must not be empty, and the "placement" note
 * stays reserved: a level-check skip keeps it, and no other lesson may take it.
 */
export function saveNotes<C extends CourseRef>(
  progress: Progress | null | undefined,
  courses: readonly C[],
  lessonId: string,
  notes: string,
): Progress {
  const base = progress ?? emptyProgress();
  if (!inCatalog(courses, lessonId)) {
    throw new ProgressStoreError('unknown_lesson', `Unknown lesson "${lessonId}".`, { lessonId });
  }
  const entry = base.lessons[lessonId];
  if (!entry) throw new ProgressStoreError('not_started', `Lesson "${lessonId}" has not been started.`, { lessonId });
  const note = notes?.trim();
  if (!note) throw new ProgressStoreError('invalid_notes', 'Notes must not be empty.', { lessonId });
  const reserved = (text: string | undefined) => text?.trim().toLowerCase() === PLACEMENT_NOTE;
  if (reserved(note) || (entry.status === 'skipped' && reserved(entry.notes))) {
    throw new ProgressStoreError('invalid_notes', `The "${PLACEMENT_NOTE}" note is reserved for the level check.`, { lessonId });
  }
  return { ...base, lessons: { ...base.lessons, [lessonId]: { ...entry, notes: note } } };
}

/**
 * Record a review score ("Review": update `score` if improved). The lesson must be done and
 * the score between 0 and 1. The saved score only goes up: a lower one is ignored.
 */
export function recordReviewScore<C extends CourseRef>(
  progress: Progress | null | undefined,
  courses: readonly C[],
  lessonId: string,
  score: number,
): Progress {
  const base = progress ?? emptyProgress();
  if (!inCatalog(courses, lessonId)) {
    throw new ProgressStoreError('unknown_lesson', `Unknown lesson "${lessonId}".`, { lessonId });
  }
  const entry = base.lessons[lessonId];
  if (entry?.status !== 'done') {
    throw new ProgressStoreError('not_done', `Lesson "${lessonId}" is not done: only done lessons are reviewed.`, { lessonId });
  }
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    throw new ProgressStoreError('invalid_score', `Score must be between 0 and 1 (got ${String(score)}).`, { lessonId });
  }
  if (typeof entry.score === 'number' && entry.score >= score) return base;
  return { ...base, lessons: { ...base.lessons, [lessonId]: { ...entry, score } } };
}

function tryJsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return Number.POSITIVE_INFINITY; // Cyclic or not serializable: not a JSON document.
  }
}

/** Largest progress.json an import accepts, in characters of its JSON (real files are a few kilobytes). */
export const MAX_IMPORT_BYTES = 1024 * 1024;

/**
 * Validate an imported progress.json (the parsed JSON, or its text) with the v1 schema.
 * Fails with `invalid_progress`. Catalog rules are not checked: the file may come from an
 * older catalog, and an import restores it as it is.
 */
export function parseImportedProgress(input: unknown): Progress {
  let json = input;
  const size = typeof input === 'string' ? input.length : tryJsonLength(input);
  if (size > MAX_IMPORT_BYTES) {
    throw new ProgressStoreError('invalid_progress', `This progress.json is too large (more than ${MAX_IMPORT_BYTES / 1024 / 1024} MB).`, {
      problems: [`size: more than ${MAX_IMPORT_BYTES / 1024 / 1024} MB`],
    });
  }
  if (typeof input === 'string') {
    try {
      json = JSON.parse(input.replace(/^\uFEFF/, ''));
    } catch (err) {
      throw new ProgressStoreError('invalid_progress', `Invalid JSON: ${(err as Error).message}`, {
        problems: [(err as Error).message],
      });
    }
  }
  const parsed = progressSchema.safeParse(json);
  if (!parsed.success) {
    throw new ProgressStoreError('invalid_progress', 'This is not a valid progress.json (v1).', {
      problems: issueLines(parsed.error),
    });
  }
  if (parsed.data.version !== 1) {
    throw new ProgressStoreError('invalid_progress', `Unsupported progress.json version ${parsed.data.version}.`, {
      problems: [`version: only version 1 is supported`],
    });
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

export interface WriteOptions {
  /** Which client made the change (e.g. `claude-code`, `codex`, `dashboard`), kept in the log. */
  client?: string;
  /** ISO date (`YYYY-MM-DD`) written as `startedAt`, `completedAt` or `pathUpdatedAt`; defaults to today (UTC). */
  today?: string;
}

/**
 * A learner's progress, stored somewhere other than a local progress.json. Every write
 * applies the tutor rules to the saved progress inside one transaction and appends an entry
 * to the learner's change log; a rejected write throws `ProgressStoreError` and changes
 * nothing. Every method returns the progress after the change, in the progress.json v1 shape.
 */
export interface ProgressStore {
  /** The learner's progress; empty progress (as for a missing progress.json) if none is saved yet. */
  getProgress(userId: string): Promise<Progress>;

  /** Change profile fields (see `ProfileUpdate`). */
  setProfile(userId: string, update: ProfileUpdate, options?: WriteOptions): Promise<Progress>;
  /** Save an agreed path with its reason (`setPath` rules). */
  setPath(userId: string, path: readonly string[], reason: string, options?: WriteOptions): Promise<Progress>;
  /** Start or resume a lesson and make it `current` (`startLesson` rules). */
  startLesson(userId: string, lessonId: string, options?: WriteOptions): Promise<Progress>;
  /** Mark a lesson done with its score and notes (`completeLesson` rules). */
  completeLesson(userId: string, lessonId: string, input: Omit<CompleteLessonInput, 'today'>, options?: WriteOptions): Promise<Progress>;
  /** Skip a lesson the learner already knows (`skipLesson` rules). */
  skipLesson(userId: string, lessonId: string, notes: string, options?: WriteOptions): Promise<Progress>;
  /** Skip every unfinished lesson of a course passed in the level check (`placementSkip` rules). */
  placementSkip(userId: string, courseId: string, options?: WriteOptions): Promise<Progress>;
  /** Reset a course: remove all its lesson entries so it can be taken again (`resetCourse` rules). */
  resetCourse(userId: string, courseId: string, options?: WriteOptions): Promise<Progress>;
  /** Save notes on a started lesson (`saveNotes` rules). */
  saveNotes(userId: string, lessonId: string, notes: string, options?: WriteOptions): Promise<Progress>;
  /** Record a review score on a done lesson; the score only goes up (`recordReviewScore` rules). */
  recordReviewScore(userId: string, lessonId: string, score: number, options?: WriteOptions): Promise<Progress>;

  /**
   * Replace the learner's whole progress with a progress.json v1 (parsed JSON or text),
   * validated with the v1 schema. The change log is kept.
   */
  importProgress(userId: string, json: unknown, options?: Pick<WriteOptions, 'client'>): Promise<Progress>;
  /** The learner's progress as progress.json text (v1, two-space indent, final newline). */
  exportProgress(userId: string): Promise<string>;
  /** Delete the learner's progress and change log (the user account itself is kept). True if there was one. */
  deleteLearner(userId: string): Promise<boolean>;
}

const PROFILE_KEYS = ['name', 'experience', 'goal', 'language', 'level', 'interests'] as const;

/** Progress as progress.json text, keys in the order of progress.example.json (extra keys last). */
export function formatProgress(progress: Progress): string {
  const { version, profile: savedProfile, path, pathReason, pathUpdatedAt, current, lessons, ...rest } = progress;
  const profile: Record<string, unknown> = {};
  for (const key of PROFILE_KEYS) if (savedProfile[key] !== undefined) profile[key] = savedProfile[key];
  Object.assign(profile, savedProfile);
  const ordered = {
    version,
    profile,
    ...(path !== undefined && { path }),
    ...(pathReason !== undefined && { pathReason }),
    ...(pathUpdatedAt !== undefined && { pathUpdatedAt }),
    current: current ?? null,
    lessons,
    ...rest,
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}
