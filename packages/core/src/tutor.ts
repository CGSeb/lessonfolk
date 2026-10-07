import { levelSchema, type Level } from './schemas.ts';
import {
  type CourseRef,
  type LessonProgress,
  type NextLesson,
  type Progress,
  PLACEMENT_NOTE,
  emptyProgress,
  getLessonStatus,
  getLevel,
  getNextLesson,
  isFinished,
} from './progress.ts';

/**
 * The tutor rules (the procedures of packages/mcp/prompts/learn.md) as pure functions, so
 * a server can enforce them instead of trusting the AI to follow the prose.
 *
 * Every function takes the courses in `index.yaml` order (e.g. `Catalog.courses`) and never
 * mutates its arguments: status changes return a new progress object or a typed error.
 */

// ---------------------------------------------------------------------------
// Shapes and errors
// ---------------------------------------------------------------------------

/** What the tutor rules need from a course (`Course` from courses.ts satisfies it). */
export interface TutorCourseRef extends CourseRef {
  level: Level;
  /** Theme id from themes.yaml. */
  theme: string;
  /** Course ids; `[]` when absent. */
  prerequisites: string[];
}

type MaybeProgress = Progress | null | undefined;

export type TutorErrorCode =
  /** The lesson id is not in the catalog. */
  | 'unknown_lesson'
  /** The course id is not in the catalog. */
  | 'unknown_course'
  /** Some lesson prerequisites are neither done nor skipped (listed in `missing`). */
  | 'prerequisites_not_met'
  /** The lesson is already done or skipped. */
  | 'already_finished'
  /** `score` is not a number between 0 and 1. */
  | 'invalid_score'
  /** `notes` is empty, or a manual skip uses the reserved "placement" note. */
  | 'invalid_notes'
  /** `profile.level` is missing or not a known level. */
  | 'no_level'
  /** A level check may only skip courses below the learner's level. */
  | 'not_below_level'
  /** The path breaks the path rules (listed in `issues`). */
  | 'invalid_path';

export interface TutorError {
  code: TutorErrorCode;
  /** One sentence for logs and for the AI tutor. */
  message: string;
  lessonId?: string;
  courseId?: string;
  /** For `prerequisites_not_met`: the unfinished prerequisite lesson ids, in order. */
  missing?: string[];
  /** For `invalid_path`: every problem found. */
  issues?: PathIssue[];
}

export type TutorResult = { ok: true; progress: Progress } | { ok: false; error: TutorError };

const fail = (error: TutorError): { ok: false; error: TutorError } => ({ ok: false, error });

/** Today as an ISO date (`YYYY-MM-DD`), the format of `startedAt`, `completedAt` and `pathUpdatedAt`. */
export function isoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface DateOptions {
  /** ISO date written to the progress; defaults to today (UTC). */
  today?: string;
}

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const LEVELS = levelSchema.options;

function findLesson<C extends CourseRef>(courses: readonly C[], lessonId: string) {
  for (const course of courses) {
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

/** A course counts as finished when every lesson is done or skipped. */
export function isCourseFinished(progress: MaybeProgress, course: CourseRef): boolean {
  return course.lessons.every((lesson) => isFinished(progress, lesson.id));
}

// ---------------------------------------------------------------------------
// Level from the experience answer ("Onboarding" step 2)
// ---------------------------------------------------------------------------

/** The onboarding experience answers and the level each one maps to, in question order. */
export const EXPERIENCE_LEVELS: readonly { experience: string; level: Level }[] = [
  { experience: 'none', level: 'beginner' },
  { experience: 'used ChatGPT-like tools', level: 'beginner' },
  { experience: 'some technical', level: 'intermediate' },
  { experience: 'developer', level: 'intermediate' },
  { experience: 'ML practitioner', level: 'advanced' },
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * The level for an onboarding experience answer: none / used ChatGPT-like tools → beginner;
 * some technical / developer → intermediate; ML practitioner → advanced. A level name
 * ("intermediate") is accepted too. Case, punctuation and extra spaces are ignored. Returns
 * undefined for anything else: the tutor should ask again rather than guess.
 */
export function levelFromExperience(experience: string): Level | undefined {
  const answer = normalize(experience);
  if (!answer) return undefined;
  const match = EXPERIENCE_LEVELS.find((e) => normalize(e.experience) === answer);
  if (match) return match.level;
  return LEVELS.find((level) => level === answer);
}

// ---------------------------------------------------------------------------
// Next lesson ("Start or resume" steps 2–5)
// ---------------------------------------------------------------------------

export type NextLessonResult<C extends CourseRef> =
  | (NextLesson<C> & { unknownPathIds: string[] })
  /** Every lesson of the catalog is done or skipped: congratulate the learner. */
  | { kind: 'all_done'; unknownPathIds: string[] }
  /** Lessons remain, but none has all its prerequisites done or skipped. */
  | { kind: 'blocked'; unknownPathIds: string[] };

/**
 * The "Start or resume" walk: `current` first if it is not done or skipped, then the courses
 * of `path` (in path order), then the remaining courses in `index.yaml` order, picking the
 * first lesson that is not finished and whose prerequisites are all done or skipped.
 * `unknownPathIds` lists the course ids of `path` that are not in the catalog (ignored, but
 * the tutor tells the learner about them). Missing progress behaves as empty progress.
 */
export function nextLesson<C extends CourseRef>(progress: MaybeProgress, courses: readonly C[]): NextLessonResult<C> {
  const known = new Set(courses.map((c) => c.id));
  const unknownPathIds = [...new Set(progress?.path ?? [])].filter((id) => !known.has(id));
  const next = getNextLesson([...courses], progress);
  if (next) return { ...next, unknownPathIds };
  const allDone = courses.every((course) => isCourseFinished(progress, course));
  return { kind: allDone ? 'all_done' : 'blocked', unknownPathIds };
}

// ---------------------------------------------------------------------------
// Paths ("Recommend a path" and the path rules)
// ---------------------------------------------------------------------------

export type PathIssue =
  | { code: 'unknown_course'; courseId: string }
  | { code: 'duplicate_course'; courseId: string }
  /** `prerequisiteId` is unfinished but not in the path. */
  | { code: 'missing_prerequisite'; courseId: string; prerequisiteId: string }
  /** `prerequisiteId` is in the path, but after `courseId`. */
  | { code: 'prerequisite_after_course'; courseId: string; prerequisiteId: string };

export type PathValidation = { ok: true } | { ok: false; issues: PathIssue[] };

/**
 * Check a path against the rules: every id is a known course, listed once, and comes after
 * its prerequisites; a prerequisite is never dropped. With `progress`, a finished
 * prerequisite (every lesson done or skipped) may be left out of the path; without it,
 * every prerequisite must be in the path. Prerequisite ids that are not in the catalog are
 * ignored (`check:courses` reports them).
 */
export function validatePath<C extends TutorCourseRef>(
  path: readonly string[],
  courses: readonly C[],
  progress?: MaybeProgress,
): PathValidation {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const position = new Map<string, number>();
  const issues: PathIssue[] = [];
  path.forEach((courseId, i) => {
    if (!byId.has(courseId)) issues.push({ code: 'unknown_course', courseId });
    else if (position.has(courseId)) issues.push({ code: 'duplicate_course', courseId });
    else position.set(courseId, i);
  });
  for (const [courseId, index] of position) {
    for (const prerequisiteId of byId.get(courseId)!.prerequisites) {
      const prerequisite = byId.get(prerequisiteId);
      if (!prerequisite) continue;
      const prerequisiteIndex = position.get(prerequisiteId);
      if (prerequisiteIndex === undefined) {
        if (!progress || !isCourseFinished(progress, prerequisite)) {
          issues.push({ code: 'missing_prerequisite', courseId, prerequisiteId });
        }
      } else if (prerequisiteIndex > index) {
        issues.push({ code: 'prerequisite_after_course', courseId, prerequisiteId });
      }
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

export type PathRecommendation =
  | {
      kind: 'path';
      /** Course ids in `index.yaml` order. */
      path: string[];
      /**
       * Which rule picked the courses: 'interests' (unfinished courses at or below the
       * level, in the learner's themes), 'all_themes' (same, every theme: no interests, or
       * none matched), 'level_up' (nothing left at or below the level: unfinished courses one
       * level up, every theme).
       */
      basis: 'interests' | 'all_themes' | 'level_up';
      /** True when `profile.interests` is set but matched no course: tell the learner. */
      interestsUnmatched: boolean;
      /** Course ids added because another course of the path needs them. */
      addedPrerequisites: string[];
    }
  /** Nothing left at or below the level, nor one level up: save nothing. */
  | { kind: 'catalog_covered' };

export type RecommendResult = { ok: true; recommendation: PathRecommendation } | { ok: false; error: TutorError };

/**
 * The "Recommend a path" rules:
 * 1. Unfinished courses whose level is at or below `profile.level`, kept to the themes of
 *    `profile.interests` when set (falling back to every theme if that leaves nothing),
 *    else the unfinished courses one level up; else the catalog is covered.
 * 2. Plus every unfinished prerequisite course, recursively, whatever its theme.
 * 3. In `index.yaml` order.
 * Needs a known `profile.level` (`no_level` error otherwise). Saves nothing: once the
 * learner agrees, save the path with `setPath`.
 */
export function recommendPath<C extends TutorCourseRef>(progress: MaybeProgress, courses: readonly C[]): RecommendResult {
  const level = getLevel(progress);
  if (!level) {
    return { ok: false, error: { code: 'no_level', message: 'profile.level is missing or unknown: ask the experience question first.' } };
  }
  const rank = LEVEL_RANK[level];
  const unfinished = courses.filter((c) => !isCourseFinished(progress, c));
  const atOrBelow = unfinished.filter((c) => LEVEL_RANK[c.level] <= rank);

  const interests = new Set(progress?.profile.interests ?? []);
  let picked: C[] = atOrBelow;
  let basis: 'interests' | 'all_themes' | 'level_up' = 'all_themes';
  let interestsUnmatched = false;
  if (interests.size) {
    const inThemes = atOrBelow.filter((c) => interests.has(c.theme));
    if (inThemes.length) {
      picked = inThemes;
      basis = 'interests';
    } else {
      interestsUnmatched = true;
    }
  }
  if (!picked.length) {
    picked = unfinished.filter((c) => LEVEL_RANK[c.level] === rank + 1);
    basis = 'level_up';
  }
  if (!picked.length) return { ok: true, recommendation: { kind: 'catalog_covered' } };

  const byId = new Map(courses.map((c) => [c.id, c]));
  const chosen = new Set(picked.map((c) => c.id));
  const added: string[] = [];
  const queue = [...picked];
  while (queue.length) {
    const course = queue.shift()!;
    for (const id of course.prerequisites) {
      const prerequisite = byId.get(id);
      if (!prerequisite || chosen.has(id) || isCourseFinished(progress, prerequisite)) continue;
      chosen.add(id);
      added.push(id);
      queue.push(prerequisite);
    }
  }
  const path = courses.filter((c) => chosen.has(c.id)).map((c) => c.id);
  const addedPrerequisites = path.filter((id) => added.includes(id));
  return { ok: true, recommendation: { kind: 'path', path, basis, interestsUnmatched, addedPrerequisites } };
}

/**
 * Save an agreed path: `path`, `pathReason` and `pathUpdatedAt` always change together.
 * The path must pass `validatePath` (finished prerequisites may be left out) and the reason
 * must not be empty.
 */
export function setPath<C extends TutorCourseRef>(
  progress: MaybeProgress,
  courses: readonly C[],
  path: readonly string[],
  reason: string,
  options: DateOptions = {},
): TutorResult {
  const base = progress ?? emptyProgress();
  const validation = validatePath(path, courses, base);
  if (!validation.ok) {
    return fail({ code: 'invalid_path', message: 'The path breaks the path rules.', issues: validation.issues });
  }
  if (!reason.trim()) return fail({ code: 'invalid_notes', message: 'pathReason must explain the path to the learner.' });
  return {
    ok: true,
    progress: { ...base, path: [...path], pathReason: reason.trim(), pathUpdatedAt: options.today ?? isoDate() },
  };
}

// ---------------------------------------------------------------------------
// Status changes ("Start or resume" step 4, "Complete a lesson", "Skip", "Level check")
// ---------------------------------------------------------------------------

function withLesson(progress: Progress, lessonId: string, entry: LessonProgress, current: string | null | undefined): Progress {
  return { ...progress, current, lessons: { ...progress.lessons, [lessonId]: entry } };
}

/** Shared checks: the lesson exists and is not finished yet; `missing` lists its unfinished prerequisites. */
function checkOpenLesson<C extends CourseRef>(progress: Progress, courses: readonly C[], lessonId: string) {
  const found = findLesson(courses, lessonId);
  if (!found) return fail({ code: 'unknown_lesson', message: `Unknown lesson "${lessonId}".`, lessonId });
  const status = getLessonStatus(progress, lessonId);
  if (status === 'done' || status === 'skipped') {
    return fail({ code: 'already_finished', message: `Lesson "${lessonId}" is already ${status}.`, lessonId });
  }
  const missing = found.lesson.prerequisites.filter((id) => !isFinished(progress, id));
  return { ok: true as const, found, missing };
}

function prerequisitesNotMet(lessonId: string, missing: string[]): TutorResult {
  return fail({
    code: 'prerequisites_not_met',
    message: `Lesson "${lessonId}" needs ${missing.map((id) => `"${id}"`).join(', ')} first.`,
    lessonId,
    missing,
  });
}

/**
 * Start (or resume) a lesson: status `in_progress`, `startedAt` (kept if already set) and
 * `current` set to it. Fails if the lesson is unknown, already done or skipped, or if one of
 * its prerequisites is neither done nor skipped.
 */
export function startLesson<C extends CourseRef>(
  progress: MaybeProgress,
  courses: readonly C[],
  lessonId: string,
  options: DateOptions = {},
): TutorResult {
  const base = progress ?? emptyProgress();
  const checked = checkOpenLesson(base, courses, lessonId);
  if (!checked.ok) return checked;
  if (checked.missing.length) return prerequisitesNotMet(lessonId, checked.missing);
  const previous = base.lessons[lessonId];
  const entry: LessonProgress = {
    ...previous,
    status: 'in_progress',
    startedAt: previous?.startedAt ?? options.today ?? isoDate(),
  };
  return { ok: true, progress: withLesson(base, lessonId, entry, lessonId) };
}

export interface CompleteLessonInput extends DateOptions {
  /** Honest estimate from the checks, 0 to 1. */
  score: number;
  /** One or two sentences on what the learner found easy or hard. */
  notes: string;
}

/**
 * Complete a lesson: status `done`, `completedAt`, `score` (0–1) and `notes`; `current` is
 * cleared if it pointed to this lesson. Fails if the lesson is unknown, already finished,
 * its prerequisites are not met, the score is outside 0–1 or the notes are empty.
 */
export function completeLesson<C extends CourseRef>(
  progress: MaybeProgress,
  courses: readonly C[],
  lessonId: string,
  input: CompleteLessonInput,
): TutorResult {
  const base = progress ?? emptyProgress();
  const checked = checkOpenLesson(base, courses, lessonId);
  if (!checked.ok) return checked;
  if (checked.missing.length) return prerequisitesNotMet(lessonId, checked.missing);
  const { score } = input;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    return fail({ code: 'invalid_score', message: `Score must be between 0 and 1 (got ${String(score)}).`, lessonId });
  }
  const notes = input.notes?.trim();
  if (!notes) return fail({ code: 'invalid_notes', message: 'Notes must say what the learner found easy or hard.', lessonId });

  const entry: LessonProgress = {
    ...base.lessons[lessonId],
    status: 'done',
    completedAt: input.today ?? isoDate(),
    score,
    notes,
  };
  const current = base.current === lessonId ? null : base.current;
  return { ok: true, progress: withLesson(base, lessonId, entry, current) };
}

/**
 * Skip one lesson the learner already knows ("Skip"): status `skipped`, `notes` and
 * `completedAt`; `current` is cleared if it pointed to this lesson. Prerequisites are not
 * required (the learner showed they know the lesson). Fails if the lesson is unknown or
 * already finished, or the notes are empty or the reserved "placement" note (use
 * `placementSkip` for the level check).
 */
export function skipLesson<C extends CourseRef>(
  progress: MaybeProgress,
  courses: readonly C[],
  lessonId: string,
  notes: string,
  options: DateOptions = {},
): TutorResult {
  const base = progress ?? emptyProgress();
  const checked = checkOpenLesson(base, courses, lessonId);
  if (!checked.ok) return checked;
  const note = notes?.trim();
  if (!note) return fail({ code: 'invalid_notes', message: 'A skipped lesson needs a note.', lessonId });
  if (note.toLowerCase() === PLACEMENT_NOTE) {
    return fail({
      code: 'invalid_notes',
      message: `"${PLACEMENT_NOTE}" is reserved for the level check: use placementSkip.`,
      lessonId,
    });
  }
  const entry: LessonProgress = {
    ...base.lessons[lessonId],
    status: 'skipped',
    completedAt: options.today ?? isoDate(),
    notes: note,
  };
  const current = base.current === lessonId ? null : base.current;
  return { ok: true, progress: withLesson(base, lessonId, entry, current) };
}

/**
 * A course passed in the level check: each of its lessons that is not done or skipped
 * becomes `skipped` with `notes: "placement"` and `completedAt` (done lessons and earlier
 * skips are kept as they are). `current` is cleared if it pointed into the course. Fails if
 * the course is unknown, `profile.level` is unknown, or the course is not below the
 * learner's level (the level check only covers courses below it).
 */
export function placementSkip<C extends TutorCourseRef>(
  progress: MaybeProgress,
  courses: readonly C[],
  courseId: string,
  options: DateOptions = {},
): TutorResult {
  const base = progress ?? emptyProgress();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return fail({ code: 'unknown_course', message: `Unknown course "${courseId}".`, courseId });
  const level = getLevel(base);
  if (!level) {
    return fail({ code: 'no_level', message: 'profile.level is missing or unknown: no level check without a level.', courseId });
  }
  if (LEVEL_RANK[course.level] >= LEVEL_RANK[level]) {
    return fail({
      code: 'not_below_level',
      message: `Course "${courseId}" (${course.level}) is not below the learner's level (${level}).`,
      courseId,
    });
  }
  const completedAt = options.today ?? isoDate();
  const lessons = { ...base.lessons };
  for (const lesson of course.lessons) {
    if (isFinished(base, lesson.id)) continue;
    lessons[lesson.id] = { ...lessons[lesson.id], status: 'skipped', completedAt, notes: PLACEMENT_NOTE };
  }
  const inCourse = course.lessons.some((l) => l.id === base.current);
  return { ok: true, progress: { ...base, current: inCourse ? null : base.current, lessons } };
}
