import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { getPaths } from './paths';
import { levelSchema, type Level } from './schemas';

// ---------------------------------------------------------------------------
// Schema (mirrors .progress/progress.example.json)
// ---------------------------------------------------------------------------

export const lessonStatusSchema = z.enum(['in_progress', 'done', 'skipped']);
export type LessonStatus = z.infer<typeof lessonStatusSchema>;

export const lessonProgressSchema = z.looseObject({
  status: lessonStatusSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  score: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});
export type LessonProgress = z.infer<typeof lessonProgressSchema>;

export const profileSchema = z.looseObject({
  name: z.string().optional(),
  experience: z.string().optional(),
  goal: z.string().optional(),
  language: z.string().optional(),
  /**
   * Learner level, derived from `experience` at onboarding; the tutor may adjust it after placement.
   * Any string is accepted so a typo never invalidates the file: read it with `getLevel`, which
   * ignores unknown values (reported by `getProgressWarnings`).
   */
  level: z.string().optional(),
  /** Theme ids from themes.yaml the learner cares about. Unknown ids are ignored with a warning. */
  interests: z.array(z.string()).optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export const progressSchema = z.looseObject({
  version: z.number().int().positive().default(1),
  profile: profileSchema.default({}),
  current: z.string().nullable().optional(),
  lessons: z.record(z.string(), lessonProgressSchema).default({}),
  /** Course ids recommended for this learner, in order. Unknown ids are ignored with a warning. */
  path: z.array(z.string()).optional(),
  /** Two or three sentences explaining the path to the learner. */
  pathReason: z.string().optional(),
  /** ISO date of the last change to `path`. */
  pathUpdatedAt: z.string().optional(),
});
export type Progress = z.infer<typeof progressSchema>;

/** Progress of a learner who has not started yet (no progress file). */
export function emptyProgress(): Progress {
  return { version: 1, profile: {}, current: null, lessons: {} };
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export type ProgressResult =
  | { state: 'missing' }
  | { state: 'invalid'; error: string }
  | { state: 'ok'; progress: Progress };

/**
 * Read and validate progress.json. Reads the file on every call (no caching)
 * so the dashboard always reflects the tutor's latest writes. Never throws for
 * a missing or invalid file.
 */
export function readProgress(progressFile: string = getPaths().progressFile): ProgressResult {
  let raw: string;
  try {
    raw = readFileSync(progressFile, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { state: 'missing' };
    return { state: 'invalid', error: `Cannot read ${progressFile}: ${(err as Error).message}` };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw.replace(/^﻿/, ''));
  } catch (err) {
    return { state: 'invalid', error: `Invalid JSON in ${progressFile}: ${(err as Error).message}` };
  }

  const parsed = progressSchema.safeParse(json);
  if (!parsed.success) {
    return { state: 'invalid', error: `Unexpected shape in ${progressFile}: ${z.prettifyError(parsed.error)}` };
  }
  return { state: 'ok', progress: parsed.data };
}

/** The usable progress for a read result: missing or invalid files count as empty progress. */
export function progressOrEmpty(result: ProgressResult): Progress {
  return result.state === 'ok' ? result.progress : emptyProgress();
}

// ---------------------------------------------------------------------------
// Course shapes (minimal contract; richer Course/Lesson types flow through)
// ---------------------------------------------------------------------------

export interface LessonRef {
  id: string;
  prerequisites: string[];
}

/** Courses in index.yaml order, lessons in course.yaml order. */
export interface CourseRef {
  id: string;
  lessons: LessonRef[];
}

type MaybeProgress = Progress | null | undefined;

export function getLessonStatus(progress: MaybeProgress, lessonId: string): LessonStatus | 'not_started' {
  return progress?.lessons[lessonId]?.status ?? 'not_started';
}

/** A lesson counts as finished when it is done or skipped. */
export function isFinished(progress: MaybeProgress, lessonId: string): boolean {
  const status = getLessonStatus(progress, lessonId);
  return status === 'done' || status === 'skipped';
}

/** The `notes` value the tutor writes on lessons it marks `skipped` during a placement check. */
export const PLACEMENT_NOTE = 'placement';

/**
 * A lesson skipped by the tutor's placement check (shared contract with the tutor): status
 * `skipped` and `notes` equal to "placement" (surrounding spaces and case are ignored).
 * Any other skipped lesson is a manual skip.
 */
export function isPlacementSkip(progress: MaybeProgress, lessonId: string): boolean {
  const entry = progress?.lessons[lessonId];
  return entry?.status === 'skipped' && entry.notes?.trim().toLowerCase() === PLACEMENT_NOTE;
}

// ---------------------------------------------------------------------------
// Personal path
// ---------------------------------------------------------------------------

/** Course ids of `path` that exist in the catalog, in path order, without repeats. */
export function getPathCourseIds(courseIds: Iterable<string>, progress: MaybeProgress): string[] {
  const known = new Set(courseIds);
  return [...new Set(progress?.path ?? [])].filter((id) => known.has(id));
}

/**
 * Courses in the order the learner walks them: courses listed in `path` first (in path
 * order), then the remaining courses in catalog (index.yaml) order. Unknown or repeated
 * ids in `path` are ignored. Without a path (or with an empty one) the catalog order is kept.
 */
export function orderCourses<C extends CourseRef>(courses: C[], progress: MaybeProgress): C[] {
  const path = progress?.path;
  if (!path?.length) return courses;
  const byId = new Map(courses.map((c) => [c.id, c]));
  const ordered = new Set<C>();
  for (const id of path) {
    const course = byId.get(id);
    if (course) ordered.add(course);
  }
  for (const course of courses) ordered.add(course);
  return [...ordered];
}

/** The learner's level, or undefined when it is missing or not a known level. */
export function getLevel(progress: MaybeProgress): Level | undefined {
  const parsed = levelSchema.safeParse(progress?.profile.level);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Human-readable warnings for values in the progress file that the dashboard does not know:
 * `profile.level`, course ids in `path` and theme ids in `profile.interests`. These values are
 * ignored, never fatal.
 */
export function getProgressWarnings(
  progress: MaybeProgress,
  courseIds: Iterable<string>,
  themeIds: Iterable<string>,
): string[] {
  const knownCourses = new Set(courseIds);
  const knownThemes = new Set(themeIds);
  const unknownCourses = [...new Set(progress?.path ?? [])].filter((id) => !knownCourses.has(id));
  const unknownThemes = [...new Set(progress?.profile.interests ?? [])].filter((id) => !knownThemes.has(id));
  const quote = (ids: string[]) => ids.map((id) => `"${id}"`).join(', ');
  const warnings: string[] = [];
  const level = progress?.profile.level;
  if (level !== undefined && !getLevel(progress)) warnings.push(`profile.level: unknown level ${quote([level])} ignored`);
  if (unknownCourses.length) warnings.push(`path: unknown course id${unknownCourses.length > 1 ? 's' : ''} ${quote(unknownCourses)} ignored`);
  if (unknownThemes.length) warnings.push(`profile.interests: unknown theme id${unknownThemes.length > 1 ? 's' : ''} ${quote(unknownThemes)} ignored`);
  return warnings;
}

// ---------------------------------------------------------------------------
// Next lesson ("Start or resume" in AGENTS.md)
// ---------------------------------------------------------------------------

export interface NextLesson<C extends CourseRef> {
  /** 'resume': `current` points to an unfinished lesson. 'next': first eligible lesson in order. */
  kind: 'resume' | 'next';
  course: C;
  lesson: C['lessons'][number];
}

/**
 * Implements "Start or resume" from AGENTS.md:
 * 1. If `current` is set and that lesson is not done (or skipped), resume it.
 * 2. Otherwise walk courses in order (see `orderCourses`: `path` first, then the rest in
 *    catalog order), then lessons in order, and pick the first lesson that is not
 *    done/skipped and whose prerequisites are all done/skipped.
 *
 * Returns null when no lesson is eligible: either everything is finished, or the
 * remaining lessons are blocked by unmet prerequisites (use `getStats().overall.completed`
 * to tell the two apart). Missing progress behaves as empty progress.
 */
export function getNextLesson<C extends CourseRef>(courses: C[], progress: MaybeProgress): NextLesson<C> | null {
  const current = progress?.current;
  if (current && !isFinished(progress, current)) {
    for (const course of courses) {
      const lesson = course.lessons.find((l) => l.id === current);
      if (lesson) return { kind: 'resume', course, lesson };
    }
    // `current` refers to a lesson not in the catalog: fall through to the walk.
  }

  for (const course of orderCourses(courses, progress)) {
    for (const lesson of course.lessons) {
      if (isFinished(progress, lesson.id)) continue;
      if (lesson.prerequisites.every((id) => isFinished(progress, id))) {
        return { kind: 'next', course, lesson };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface ProgressCounts {
  done: number;
  skipped: number;
  /** Lessons among `skipped` that the tutor skipped during a level check (`isPlacementSkip`). */
  placementSkipped: number;
  inProgress: number;
  total: number;
  /** Mean `score` of the scored lessons, or null if none is scored. */
  averageScore: number | null;
  /** Every lesson is done or skipped (false for an empty course). */
  completed: boolean;
}

export interface CourseStats<C extends CourseRef> extends ProgressCounts {
  course: C;
}

export interface ProgressStats<C extends CourseRef> {
  courses: CourseStats<C>[];
  overall: ProgressCounts;
}

function countLessons(lessons: LessonRef[], progress: MaybeProgress): ProgressCounts {
  let done = 0;
  let skipped = 0;
  let placementSkipped = 0;
  let inProgress = 0;
  const scores: number[] = [];
  for (const lesson of lessons) {
    const entry = progress?.lessons[lesson.id];
    if (!entry) continue;
    if (entry.status === 'done') done++;
    else if (entry.status === 'skipped') {
      skipped++;
      if (isPlacementSkip(progress, lesson.id)) placementSkipped++;
    }
    else inProgress++;
    if (typeof entry.score === 'number') scores.push(entry.score);
  }
  const total = lessons.length;
  return {
    done,
    skipped,
    placementSkipped,
    inProgress,
    total,
    averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    completed: total > 0 && done + skipped === total,
  };
}

/** Per-course and overall stats. Progress entries for lessons not in `courses` are ignored. */
export function getStats<C extends CourseRef>(courses: C[], progress: MaybeProgress): ProgressStats<C> {
  return {
    courses: courses.map((course) => ({ course, ...countLessons(course.lessons, progress) })),
    overall: countLessons(
      courses.flatMap((c) => c.lessons),
      progress,
    ),
  };
}
