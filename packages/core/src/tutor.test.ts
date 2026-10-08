import { describe, expect, it } from 'vitest';
import { type LessonStatus, type Progress, emptyProgress, isPlacementSkip } from './progress.ts';
import type { Level } from './schemas.ts';
import {
  type TutorCourseRef,
  type TutorResult,
  EXPERIENCE_LEVELS,
  completeLesson,
  isCourseFinished,
  isoDate,
  levelFromExperience,
  nextLesson,
  placementSkip,
  recommendPath,
  resetCourse,
  setPath,
  skipLesson,
  startLesson,
  validatePath,
} from './tutor.ts';

// A small catalog in index.yaml order:
//   basics (beginner, understanding)            2 lessons
//   safety (beginner, using, needs basics)      1 lesson
//   prompting (intermediate, using, needs basics) 2 lessons
//   agents (advanced, building, needs prompting)  1 lesson
//   research (advanced, understanding)            1 lesson
interface Course extends TutorCourseRef {
  title: string;
}

function course(id: string, level: Level, theme: string, lessonCount: number, prerequisites: string[] = []): Course {
  const lessons = Array.from({ length: lessonCount }, (_, i) => ({
    id: `${id}/0${i + 1}-lesson`,
    prerequisites: i === 0 ? [] : [`${id}/0${i}-lesson`],
  }));
  return { id, title: id, level, theme, prerequisites, lessons };
}

const courses: Course[] = [
  course('basics', 'beginner', 'understanding', 2),
  course('safety', 'beginner', 'using', 1, ['basics']),
  course('prompting', 'intermediate', 'using', 2, ['basics']),
  course('agents', 'advanced', 'building', 1, ['prompting']),
  course('research', 'advanced', 'understanding', 1),
];
// Cross-course lesson prerequisite, as in the real catalog.
courses[2].lessons[0].prerequisites = ['basics/02-lesson'];

const lessonIds = (courseId: string) => courses.find((c) => c.id === courseId)!.lessons.map((l) => l.id);
const TODAY = '2026-10-07';

function progressWith(
  lessons: Record<string, LessonStatus> = {},
  extra: Partial<Progress> = {},
  profile: Progress['profile'] = {},
): Progress {
  return {
    ...emptyProgress(),
    ...extra,
    profile,
    lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
  };
}

/** Every lesson of the given courses with one status. */
const all = (status: LessonStatus, ...courseIds: string[]) =>
  Object.fromEntries(courseIds.flatMap(lessonIds).map((id) => [id, status]));

const okProgress = (result: TutorResult): Progress => {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`);
  return result.progress;
};
const errorCode = (result: TutorResult) => (result.ok ? 'ok' : result.error.code);

/** Deep-freeze so any mutation of the input throws. */
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) frozen(v);
    Object.freeze(value);
  }
  return value;
}

describe('levelFromExperience', () => {
  it('maps each onboarding answer to its level', () => {
    expect(levelFromExperience('none')).toBe('beginner');
    expect(levelFromExperience('used ChatGPT-like tools')).toBe('beginner');
    expect(levelFromExperience('some technical')).toBe('intermediate');
    expect(levelFromExperience('developer')).toBe('intermediate');
    expect(levelFromExperience('ML practitioner')).toBe('advanced');
  });

  it('covers every listed answer', () => {
    for (const { experience, level } of EXPERIENCE_LEVELS) expect(levelFromExperience(experience)).toBe(level);
  });

  it('ignores case, punctuation and extra spaces', () => {
    expect(levelFromExperience('  Used chatgpt like tools ')).toBe('beginner');
    expect(levelFromExperience('ml-practitioner')).toBe('advanced');
    expect(levelFromExperience('Developer.')).toBe('intermediate');
  });

  it('accepts a level name', () => {
    expect(levelFromExperience('Intermediate')).toBe('intermediate');
    expect(levelFromExperience('advanced')).toBe('advanced');
  });

  it('returns undefined for anything else, rather than guessing', () => {
    expect(levelFromExperience('')).toBeUndefined();
    expect(levelFromExperience('   ')).toBeUndefined();
    expect(levelFromExperience('a bit')).toBeUndefined();
    expect(levelFromExperience('expert')).toBeUndefined();
  });
});

describe('nextLesson', () => {
  const pick = (progress: Progress | null) => {
    const r = nextLesson(progress, courses);
    return 'lesson' in r ? { kind: r.kind, lesson: r.lesson.id, unknownPathIds: r.unknownPathIds } : r;
  };

  it('starts at the first lesson of the catalog without progress', () => {
    expect(pick(null)).toEqual({ kind: 'next', lesson: 'basics/01-lesson', unknownPathIds: [] });
    expect(pick(emptyProgress())).toEqual(pick(null));
  });

  it('resumes `current` first when it is not finished', () => {
    const p = progressWith({ 'research/01-lesson': 'in_progress' }, { current: 'research/01-lesson' });
    expect(pick(p)).toMatchObject({ kind: 'resume', lesson: 'research/01-lesson' });
  });

  it('ignores `current` when it is done, skipped or unknown', () => {
    for (const p of [
      progressWith({ 'basics/01-lesson': 'done' }, { current: 'basics/01-lesson' }),
      progressWith({ 'basics/01-lesson': 'skipped' }, { current: 'basics/01-lesson' }),
      progressWith({ 'basics/01-lesson': 'done' }, { current: 'gone/01-lesson' }),
    ]) {
      expect(pick(p)).toMatchObject({ kind: 'next', lesson: 'basics/02-lesson' });
    }
  });

  it('walks `path` first, then the other courses in index.yaml order', () => {
    const p = progressWith({}, { path: ['research', 'basics'] });
    expect(pick(p)).toMatchObject({ kind: 'next', lesson: 'research/01-lesson' });
    const p2 = progressWith(all('done', 'research', 'basics'), { path: ['research', 'basics'] });
    expect(pick(p2)).toMatchObject({ kind: 'next', lesson: 'safety/01-lesson' });
  });

  it('uses index.yaml order with an empty path', () => {
    expect(pick(progressWith({}, { path: [] }))).toMatchObject({ kind: 'next', lesson: 'basics/01-lesson' });
  });

  it('skips lessons whose prerequisites are not done or skipped', () => {
    // prompting/01 needs basics/02: with the path on prompting, the walk falls back to basics.
    const p = progressWith({}, { path: ['prompting'] });
    expect(pick(p)).toMatchObject({ kind: 'next', lesson: 'basics/01-lesson' });
    const p2 = progressWith({ 'basics/01-lesson': 'done', 'basics/02-lesson': 'skipped' }, { path: ['prompting'] });
    expect(pick(p2)).toMatchObject({ kind: 'next', lesson: 'prompting/01-lesson' });
  });

  it('reports unknown course ids of the path (once each) and ignores them', () => {
    const p = progressWith({}, { path: ['nope', 'research', 'nope', 'gone'] });
    expect(pick(p)).toEqual({ kind: 'next', lesson: 'research/01-lesson', unknownPathIds: ['nope', 'gone'] });
  });

  it('says all_done when every lesson is done or skipped', () => {
    const ids = courses.map((c) => c.id);
    const p = progressWith({ ...all('done', ...ids), 'research/01-lesson': 'skipped' }, { path: ['gone'] });
    expect(nextLesson(p, courses)).toEqual({ kind: 'all_done', unknownPathIds: ['gone'] });
  });

  it('says blocked when lessons remain but none is reachable', () => {
    const blocked = [{ ...course('x', 'beginner', 't', 1), lessons: [{ id: 'x/01-lesson', prerequisites: ['missing/01-lesson'] }] }];
    expect(nextLesson(null, blocked)).toEqual({ kind: 'blocked', unknownPathIds: [] });
  });

  it('says all_done for an empty catalog', () => {
    expect(nextLesson(null, [])).toEqual({ kind: 'all_done', unknownPathIds: [] });
  });
});

describe('isCourseFinished', () => {
  it('needs every lesson done or skipped', () => {
    const basics = courses[0];
    expect(isCourseFinished(null, basics)).toBe(false);
    expect(isCourseFinished(progressWith({ 'basics/01-lesson': 'done' }), basics)).toBe(false);
    expect(isCourseFinished(progressWith({ 'basics/01-lesson': 'done', 'basics/02-lesson': 'in_progress' }), basics)).toBe(false);
    expect(isCourseFinished(progressWith({ 'basics/01-lesson': 'done', 'basics/02-lesson': 'skipped' }), basics)).toBe(true);
  });
});

describe('validatePath', () => {
  it('accepts a path with every course after its prerequisites', () => {
    expect(validatePath(['basics', 'prompting', 'agents'], courses)).toEqual({ ok: true });
    expect(validatePath(['research'], courses)).toEqual({ ok: true });
    expect(validatePath([], courses)).toEqual({ ok: true });
  });

  it('rejects a course placed before its prerequisite', () => {
    expect(validatePath(['prompting', 'basics'], courses)).toEqual({
      ok: false,
      issues: [{ code: 'prerequisite_after_course', courseId: 'prompting', prerequisiteId: 'basics' }],
    });
  });

  it('rejects a dropped prerequisite', () => {
    expect(validatePath(['basics', 'agents'], courses)).toEqual({
      ok: false,
      issues: [{ code: 'missing_prerequisite', courseId: 'agents', prerequisiteId: 'prompting' }],
    });
  });

  it('lets a finished prerequisite out of the path when progress is given', () => {
    const p = progressWith(all('skipped', 'basics'));
    expect(validatePath(['prompting'], courses, p)).toEqual({ ok: true });
    expect(validatePath(['prompting'], courses)).toMatchObject({ ok: false });
    // An unfinished prerequisite is still required.
    expect(validatePath(['prompting'], courses, progressWith({ 'basics/01-lesson': 'done' }))).toMatchObject({ ok: false });
  });

  it('still orders a finished prerequisite that is in the path', () => {
    const p = progressWith(all('done', 'basics'));
    expect(validatePath(['prompting', 'basics'], courses, p)).toMatchObject({
      ok: false,
      issues: [{ code: 'prerequisite_after_course' }],
    });
  });

  it('rejects unknown and repeated course ids', () => {
    expect(validatePath(['basics', 'nope', 'basics'], courses)).toEqual({
      ok: false,
      issues: [
        { code: 'unknown_course', courseId: 'nope' },
        { code: 'duplicate_course', courseId: 'basics' },
      ],
    });
  });

  it('ignores prerequisite ids that are not in the catalog', () => {
    const odd = [course('solo', 'beginner', 't', 1, ['ghost'])];
    expect(validatePath(['solo'], odd)).toEqual({ ok: true });
  });
});

describe('recommendPath', () => {
  const recommend = (progress: Progress | null) => {
    const r = recommendPath(progress, courses);
    if (!r.ok) throw new Error(r.error.code);
    return r.recommendation;
  };
  const learner = (level: string | undefined, interests?: string[], lessons: Record<string, LessonStatus> = {}) =>
    progressWith(lessons, {}, { level, ...(interests ? { interests } : {}) });

  it('needs a known level', () => {
    expect(recommendPath(null, courses)).toMatchObject({ ok: false, error: { code: 'no_level' } });
    expect(recommendPath(learner('expert'), courses)).toMatchObject({ ok: false, error: { code: 'no_level' } });
  });

  it('keeps unfinished courses at or below the level, in index.yaml order', () => {
    expect(recommend(learner('beginner'))).toEqual({
      kind: 'path',
      path: ['basics', 'safety'],
      basis: 'all_themes',
      interestsUnmatched: false,
      addedPrerequisites: [],
    });
    expect(recommend(learner('intermediate'))).toMatchObject({ path: ['basics', 'safety', 'prompting'] });
    expect(recommend(learner('advanced'))).toMatchObject({ path: ['basics', 'safety', 'prompting', 'agents', 'research'] });
  });

  it('leaves out finished courses (done or skipped)', () => {
    expect(recommend(learner('intermediate', undefined, all('skipped', 'basics')))).toMatchObject({ path: ['safety', 'prompting'] });
  });

  it('keeps a partly done course', () => {
    expect(recommend(learner('beginner', undefined, { 'basics/01-lesson': 'done' }))).toMatchObject({ path: ['basics', 'safety'] });
  });

  it('filters by interests and adds unfinished prerequisites of any theme', () => {
    expect(recommend(learner('intermediate', ['using']))).toEqual({
      kind: 'path',
      path: ['basics', 'safety', 'prompting'],
      basis: 'interests',
      interestsUnmatched: false,
      addedPrerequisites: ['basics'],
    });
  });

  it('adds prerequisites recursively', () => {
    // agents needs prompting, which needs basics.
    expect(recommend(learner('advanced', ['building']))).toMatchObject({
      path: ['basics', 'prompting', 'agents'],
      addedPrerequisites: ['basics', 'prompting'],
    });
  });

  it('does not add finished prerequisites (nor walk through them)', () => {
    const p = learner('advanced', ['building'], all('done', 'basics', 'prompting'));
    expect(recommend(p)).toMatchObject({ path: ['agents'], addedPrerequisites: [] });
  });

  it('falls back to every theme when the interests match nothing, and says so', () => {
    expect(recommend(learner('beginner', ['building']))).toEqual({
      kind: 'path',
      path: ['basics', 'safety'],
      basis: 'all_themes',
      interestsUnmatched: true,
      addedPrerequisites: [],
    });
    // Unknown theme ids behave the same.
    expect(recommend(learner('beginner', ['not-a-theme']))).toMatchObject({ interestsUnmatched: true });
  });

  it('treats empty interests as no interests', () => {
    expect(recommend(learner('beginner', []))).toMatchObject({ basis: 'all_themes', interestsUnmatched: false });
  });

  it('goes one level up when everything at or below the level is finished', () => {
    const p = learner('beginner', ['understanding'], all('done', 'basics', 'safety'));
    expect(recommend(p)).toEqual({
      kind: 'path',
      path: ['prompting'],
      basis: 'level_up',
      interestsUnmatched: true,
      addedPrerequisites: [],
    });
  });

  it('goes only one level up, never two', () => {
    const p = learner('beginner', undefined, all('done', 'basics', 'safety', 'prompting'));
    expect(recommend(p)).toEqual({ kind: 'catalog_covered' });
  });

  it('says the catalog is covered when nothing is left', () => {
    const everything = all('done', ...courses.map((c) => c.id));
    expect(recommend(learner('advanced', undefined, everything))).toEqual({ kind: 'catalog_covered' });
    expect(recommendPath(learner('beginner'), [])).toEqual({ ok: true, recommendation: { kind: 'catalog_covered' } });
  });

  it('always recommends a valid path', () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      for (const interests of [undefined, ['using'], ['building'], ['understanding']]) {
        const p = learner(level, interests);
        const r = recommend(p);
        if (r.kind === 'path') expect(validatePath(r.path, courses, p)).toEqual({ ok: true });
      }
    }
  });

  it('does not change the progress', () => {
    const p = frozen(learner('advanced', ['building']));
    expect(() => recommendPath(p, courses)).not.toThrow();
  });
});

describe('setPath', () => {
  it('saves path, pathReason and pathUpdatedAt together', () => {
    const p = progressWith({}, { current: 'basics/01-lesson' });
    const next = okProgress(setPath(p, courses, ['basics', 'prompting'], '  Because.  ', { today: TODAY }));
    expect(next).toMatchObject({
      path: ['basics', 'prompting'],
      pathReason: 'Because.',
      pathUpdatedAt: TODAY,
      current: 'basics/01-lesson',
    });
  });

  it('rejects an invalid path with its issues', () => {
    expect(setPath(null, courses, ['agents'], 'Because.')).toMatchObject({
      ok: false,
      error: { code: 'invalid_path', issues: [{ code: 'missing_prerequisite', courseId: 'agents', prerequisiteId: 'prompting' }] },
    });
  });

  it('needs a reason', () => {
    expect(errorCode(setPath(null, courses, ['basics'], ' '))).toBe('invalid_notes');
  });

  it('defaults the date to today and accepts an empty path', () => {
    expect(okProgress(setPath(null, courses, [], 'Catalog order.')).pathUpdatedAt).toBe(isoDate());
  });

  it('does not mutate its input', () => {
    const path = frozen(['basics']);
    const p = frozen(progressWith({}, { path: ['research'] }));
    const next = okProgress(setPath(p, courses, path, 'Because.'));
    expect(next.path).toEqual(['basics']);
    expect(next.path).not.toBe(path);
    expect(p.path).toEqual(['research']);
  });
});

describe('startLesson', () => {
  it('sets in_progress, startedAt and current', () => {
    const next = okProgress(startLesson(null, courses, 'basics/01-lesson', { today: TODAY }));
    expect(next.current).toBe('basics/01-lesson');
    expect(next.lessons['basics/01-lesson']).toEqual({ status: 'in_progress', startedAt: TODAY });
  });

  it('resumes an in_progress lesson, keeping startedAt and notes', () => {
    const p: Progress = {
      ...emptyProgress(),
      lessons: { 'basics/01-lesson': { status: 'in_progress', startedAt: '2026-01-01', notes: 'Stopped after idea 2.' } },
    };
    expect(okProgress(startLesson(p, courses, 'basics/01-lesson', { today: TODAY })).lessons['basics/01-lesson']).toEqual({
      status: 'in_progress',
      startedAt: '2026-01-01',
      notes: 'Stopped after idea 2.',
    });
  });

  it('fails for an unknown lesson', () => {
    expect(startLesson(null, courses, 'nope/01-lesson')).toMatchObject({
      ok: false,
      error: { code: 'unknown_lesson', lessonId: 'nope/01-lesson' },
    });
  });

  it('fails when prerequisites are not done or skipped, listing them', () => {
    expect(startLesson(null, courses, 'basics/02-lesson')).toMatchObject({
      ok: false,
      error: { code: 'prerequisites_not_met', missing: ['basics/01-lesson'] },
    });
    const p = progressWith({ 'basics/01-lesson': 'done', 'basics/02-lesson': 'in_progress' });
    expect(errorCode(startLesson(p, courses, 'prompting/01-lesson'))).toBe('prerequisites_not_met');
  });

  it('accepts skipped prerequisites', () => {
    const p = progressWith(all('skipped', 'basics'));
    expect(errorCode(startLesson(p, courses, 'prompting/01-lesson'))).toBe('ok');
  });

  it('fails for a lesson already done or skipped', () => {
    for (const status of ['done', 'skipped'] as const) {
      expect(errorCode(startLesson(progressWith({ 'basics/01-lesson': status }), courses, 'basics/01-lesson'))).toBe('already_finished');
    }
  });

  it('does not mutate its input', () => {
    const p = frozen(progressWith({ 'basics/01-lesson': 'done' }));
    const next = okProgress(startLesson(p, courses, 'basics/02-lesson'));
    expect(next).not.toBe(p);
    expect(p.lessons['basics/02-lesson']).toBeUndefined();
    expect(p.current).toBeNull();
  });
});

describe('completeLesson', () => {
  const started = () => okProgress(startLesson(null, courses, 'basics/01-lesson', { today: '2026-10-01' }));
  const done = { score: 0.8, notes: 'Easy on examples; unsure about training data.', today: TODAY };

  it('sets done, completedAt, score and notes, and clears current', () => {
    const next = okProgress(completeLesson(started(), courses, 'basics/01-lesson', done));
    expect(next.current).toBeNull();
    expect(next.lessons['basics/01-lesson']).toEqual({
      status: 'done',
      startedAt: '2026-10-01',
      completedAt: TODAY,
      score: 0.8,
      notes: 'Easy on examples; unsure about training data.',
    });
  });

  it('accepts the bounds 0 and 1', () => {
    expect(errorCode(completeLesson(started(), courses, 'basics/01-lesson', { ...done, score: 0 }))).toBe('ok');
    expect(errorCode(completeLesson(started(), courses, 'basics/01-lesson', { ...done, score: 1 }))).toBe('ok');
  });

  it('rejects a score outside 0–1 or not a number', () => {
    for (const score of [-0.1, 1.01, 80, Number.NaN, Number.POSITIVE_INFINITY, '0.5' as unknown as number]) {
      expect(errorCode(completeLesson(started(), courses, 'basics/01-lesson', { ...done, score }))).toBe('invalid_score');
    }
  });

  it('needs notes', () => {
    expect(errorCode(completeLesson(started(), courses, 'basics/01-lesson', { ...done, notes: '  ' }))).toBe('invalid_notes');
  });

  it('keeps `current` when it points to another lesson', () => {
    const p = { ...started(), current: 'research/01-lesson' };
    expect(okProgress(completeLesson(p, courses, 'basics/01-lesson', done)).current).toBe('research/01-lesson');
  });

  it('fails for unknown, finished or not-yet-reachable lessons', () => {
    expect(errorCode(completeLesson(null, courses, 'nope/01-lesson', done))).toBe('unknown_lesson');
    expect(errorCode(completeLesson(progressWith({ 'basics/01-lesson': 'done' }), courses, 'basics/01-lesson', done))).toBe('already_finished');
    expect(errorCode(completeLesson(progressWith({ 'basics/01-lesson': 'skipped' }), courses, 'basics/01-lesson', done))).toBe('already_finished');
    expect(errorCode(completeLesson(null, courses, 'basics/02-lesson', done))).toBe('prerequisites_not_met');
  });

  it('does not mutate its input', () => {
    const p = frozen(started());
    okProgress(completeLesson(p, courses, 'basics/01-lesson', done));
    expect(p.lessons['basics/01-lesson'].status).toBe('in_progress');
    expect(p.current).toBe('basics/01-lesson');
  });
});

describe('skipLesson', () => {
  it('sets skipped, notes and completedAt, and clears current when it was this lesson', () => {
    const p = okProgress(startLesson(null, courses, 'basics/01-lesson', { today: '2026-10-01' }));
    const next = okProgress(skipLesson(p, courses, 'basics/01-lesson', ' Knew it already. ', { today: TODAY }));
    expect(next.current).toBeNull();
    expect(next.lessons['basics/01-lesson']).toEqual({
      status: 'skipped',
      startedAt: '2026-10-01',
      completedAt: TODAY,
      notes: 'Knew it already.',
    });
    expect(isPlacementSkip(next, 'basics/01-lesson')).toBe(false);
  });

  it('does not need prerequisites', () => {
    expect(errorCode(skipLesson(null, courses, 'agents/01-lesson', 'Builds agents at work.'))).toBe('ok');
  });

  it('needs notes and refuses the reserved placement note', () => {
    expect(errorCode(skipLesson(null, courses, 'basics/01-lesson', ''))).toBe('invalid_notes');
    expect(errorCode(skipLesson(null, courses, 'basics/01-lesson', ' Placement '))).toBe('invalid_notes');
  });

  it('fails for unknown or finished lessons', () => {
    expect(errorCode(skipLesson(null, courses, 'nope/01-lesson', 'x'))).toBe('unknown_lesson');
    expect(errorCode(skipLesson(progressWith({ 'basics/01-lesson': 'done' }), courses, 'basics/01-lesson', 'x'))).toBe('already_finished');
    expect(errorCode(skipLesson(progressWith({ 'basics/01-lesson': 'skipped' }), courses, 'basics/01-lesson', 'x'))).toBe('already_finished');
  });

  it('does not mutate its input', () => {
    const p = frozen(progressWith());
    okProgress(skipLesson(p, courses, 'basics/01-lesson', 'Knew it.'));
    expect(p.lessons).toEqual({});
  });
});

describe('placementSkip', () => {
  const learner = (level: string | undefined, lessons: Record<string, LessonStatus> = {}, extra: Partial<Progress> = {}) =>
    progressWith(lessons, extra, level === undefined ? {} : { level });

  it('skips every lesson of the course that is not done, with notes "placement" and completedAt', () => {
    const p = learner('intermediate', { 'basics/01-lesson': 'done' });
    const next = okProgress(placementSkip(p, courses, 'basics', { today: TODAY }));
    expect(next.lessons['basics/01-lesson']).toEqual({ status: 'done' });
    expect(next.lessons['basics/02-lesson']).toEqual({ status: 'skipped', notes: 'placement', completedAt: TODAY });
    expect(isPlacementSkip(next, 'basics/02-lesson')).toBe(true);
    expect(isCourseFinished(next, courses[0])).toBe(true);
  });

  it('turns an in_progress lesson into a placement skip and clears current in that course', () => {
    const p: Progress = {
      ...learner('advanced'),
      current: 'prompting/01-lesson',
      lessons: { 'prompting/01-lesson': { status: 'in_progress', startedAt: '2026-10-01' } },
    };
    const next = okProgress(placementSkip(p, courses, 'prompting', { today: TODAY }));
    expect(next.current).toBeNull();
    expect(next.lessons['prompting/01-lesson']).toEqual({
      status: 'skipped',
      startedAt: '2026-10-01',
      notes: 'placement',
      completedAt: TODAY,
    });
  });

  it('keeps `current` when it is in another course', () => {
    const p = learner('advanced', {}, { current: 'research/01-lesson' });
    expect(okProgress(placementSkip(p, courses, 'basics')).current).toBe('research/01-lesson');
  });

  it('keeps earlier manual skips as they are', () => {
    const p: Progress = {
      ...learner('intermediate'),
      lessons: { 'basics/01-lesson': { status: 'skipped', notes: 'Knew it.', completedAt: '2026-09-01' } },
    };
    const next = okProgress(placementSkip(p, courses, 'basics', { today: TODAY }));
    expect(next.lessons['basics/01-lesson']).toEqual({ status: 'skipped', notes: 'Knew it.', completedAt: '2026-09-01' });
    expect(next.lessons['basics/02-lesson']).toMatchObject({ notes: 'placement' });
  });

  it('only covers courses below the learner level', () => {
    expect(errorCode(placementSkip(learner('beginner'), courses, 'basics'))).toBe('not_below_level');
    expect(errorCode(placementSkip(learner('intermediate'), courses, 'prompting'))).toBe('not_below_level');
    expect(errorCode(placementSkip(learner('intermediate'), courses, 'agents'))).toBe('not_below_level');
    expect(errorCode(placementSkip(learner('advanced'), courses, 'prompting'))).toBe('ok');
  });

  it('needs a known level and a known course', () => {
    expect(errorCode(placementSkip(learner(undefined), courses, 'basics'))).toBe('no_level');
    expect(errorCode(placementSkip(learner('guru'), courses, 'basics'))).toBe('no_level');
    expect(placementSkip(learner('advanced'), courses, 'nope')).toMatchObject({
      ok: false,
      error: { code: 'unknown_course', courseId: 'nope' },
    });
  });

  it('changes nothing for a course already finished', () => {
    const p = learner('intermediate', all('done', 'basics'));
    expect(okProgress(placementSkip(p, courses, 'basics')).lessons).toEqual(p.lessons);
  });

  it('does not mutate its input', () => {
    const p = frozen(learner('intermediate'));
    okProgress(placementSkip(p, courses, 'safety'));
    expect(p.lessons).toEqual({});
  });
});

describe('a full tutoring session', () => {
  it('goes from onboarding to the next course with the rules alone', () => {
    let p: Progress = { ...emptyProgress(), profile: { level: levelFromExperience('developer') } };

    // Level check: basics passed, safety failed.
    p = okProgress(placementSkip(p, courses, 'basics', { today: TODAY }));

    const rec = recommendPath(p, courses);
    if (!rec.ok || rec.recommendation.kind !== 'path') throw new Error('expected a path');
    expect(rec.recommendation.path).toEqual(['safety', 'prompting']);
    p = okProgress(setPath(p, courses, rec.recommendation.path, 'Practical first.', { today: TODAY }));

    const next = nextLesson(p, courses);
    expect(next).toMatchObject({ kind: 'next', lesson: { id: 'safety/01-lesson' } });
    p = okProgress(startLesson(p, courses, 'safety/01-lesson', { today: TODAY }));
    expect(nextLesson(p, courses)).toMatchObject({ kind: 'resume', lesson: { id: 'safety/01-lesson' } });
    p = okProgress(completeLesson(p, courses, 'safety/01-lesson', { score: 0.9, notes: 'Solid.', today: TODAY }));
    expect(nextLesson(p, courses)).toMatchObject({ kind: 'next', lesson: { id: 'prompting/01-lesson' } });
  });
});

describe('resetCourse', () => {
  it('removes every lesson of a finished course, scores and notes included', () => {
    const p: Progress = {
      ...progressWith(all('done', 'basics', 'safety')),
      path: ['basics', 'safety'],
      lessons: {
        'basics/01-lesson': { status: 'done', score: 0.4, notes: 'Hard.', completedAt: '2026-09-01' },
        'basics/02-lesson': { status: 'done', score: 0.9 },
        'safety/01-lesson': { status: 'done', score: 1 },
      },
    };
    const next = okProgress(resetCourse(frozen(p), courses, 'basics'));
    expect(Object.keys(next.lessons)).toEqual(['safety/01-lesson']);
    expect(next.lessons['safety/01-lesson']).toEqual({ status: 'done', score: 1 });
    expect(next.path).toEqual(['basics', 'safety']);
  });

  it('resets a partly finished course and clears current when it points into it', () => {
    const p = progressWith({ 'basics/01-lesson': 'done', 'basics/02-lesson': 'in_progress' }, { current: 'basics/02-lesson' });
    const next = okProgress(resetCourse(p, courses, 'basics'));
    expect(next.lessons).toEqual({});
    expect(next.current).toBeNull();
    expect(nextLesson(next, courses)).toMatchObject({ kind: 'next', lesson: { id: 'basics/01-lesson' } });
  });

  it('keeps current when it is in another course, and other courses untouched', () => {
    const p = progressWith({ ...all('done', 'basics'), 'research/01-lesson': 'in_progress' }, { current: 'research/01-lesson' });
    const next = okProgress(resetCourse(p, courses, 'basics'));
    expect(next.current).toBe('research/01-lesson');
    expect(next.lessons).toEqual({ 'research/01-lesson': { status: 'in_progress' } });
  });

  it('does not reset the courses that depend on it', () => {
    const p = progressWith(all('done', 'basics', 'safety', 'prompting'));
    const next = okProgress(resetCourse(p, courses, 'basics'));
    expect(Object.keys(next.lessons).sort()).toEqual([...lessonIds('safety'), ...lessonIds('prompting')].sort());
  });

  it('resets a course skipped after the level check', () => {
    const p = progressWith({}, {}, { level: 'intermediate' });
    const skipped = okProgress(placementSkip(p, courses, 'basics', { today: TODAY }));
    expect(isPlacementSkip(skipped, 'basics/01-lesson')).toBe(true);
    const next = okProgress(resetCourse(skipped, courses, 'basics'));
    expect(next.lessons).toEqual({});
    expect(isCourseFinished(next, courses[0])).toBe(false);
  });

  it('fails for an unknown course and for a course with nothing to reset', () => {
    const p = progressWith({ 'basics/01-lesson': 'done' });
    expect(resetCourse(p, courses, 'nope')).toMatchObject({ ok: false, error: { code: 'unknown_course', courseId: 'nope' } });
    expect(resetCourse(p, courses, 'safety')).toMatchObject({ ok: false, error: { code: 'nothing_to_reset', courseId: 'safety' } });
    expect(errorCode(resetCourse(null, courses, 'basics'))).toBe('nothing_to_reset');
  });
});
