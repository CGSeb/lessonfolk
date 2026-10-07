import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { loadCatalog, loadThemes } from './courses';
import {
  type CourseRef,
  type LessonStatus,
  type Progress,
  emptyProgress,
  getNextLesson,
  getLevel,
  getPathCourseIds,
  getProgressWarnings,
  getStats,
  isPlacementSkip,
  orderCourses,
  progressOrEmpty,
  readProgress,
} from './progress';

const fixtures = fileURLToPath(new URL('../../tests/fixtures/progress', import.meta.url));
const fixture = (name: string) => join(fixtures, name, 'progress.json');
const exampleFile = fileURLToPath(new URL('../../../.progress/progress.example.json', import.meta.url));

interface Lesson {
  id: string;
  title: string;
  prerequisites: string[];
}
interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

const lesson = (id: string, prerequisites: string[] = []): Lesson => ({ id, title: id, prerequisites });

const courses: Course[] = [
  {
    id: 'ai-foundations',
    title: 'AI Foundations',
    lessons: [
      lesson('ai-foundations/01-what-is-ai'),
      lesson('ai-foundations/02-how-machines-learn', ['ai-foundations/01-what-is-ai']),
      lesson('ai-foundations/03-what-is-an-llm', ['ai-foundations/02-how-machines-learn']),
    ],
  },
  {
    id: 'prompting',
    title: 'Prompting',
    lessons: [lesson('prompting/01-basics', ['ai-foundations/03-what-is-an-llm']), lesson('prompting/02-advanced')],
  },
];
const allIds = courses.flatMap((c) => c.lessons.map((l) => l.id));

function progressWith(
  lessons: Record<string, LessonStatus | { status: LessonStatus; score?: number }>,
  current: string | null = null,
): Progress {
  return {
    ...emptyProgress(),
    current,
    lessons: Object.fromEntries(
      Object.entries(lessons).map(([id, v]) => [id, typeof v === 'string' ? { status: v } : v]),
    ),
  };
}

describe('readProgress', () => {
  afterEach(() => {
    delete process.env.LESSONFOLK_PROGRESS_DIR;
  });

  it('returns missing when there is no file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    const result = readProgress(join(dir, 'progress.json'));
    expect(result).toEqual({ state: 'missing' });
    expect(progressOrEmpty(result)).toEqual(emptyProgress());
  });

  it('returns invalid (does not throw) for malformed JSON', () => {
    const result = readProgress(fixture('invalid-json'));
    expect(result.state).toBe('invalid');
    if (result.state === 'invalid') expect(result.error).toMatch(/Invalid JSON/);
    expect(progressOrEmpty(result)).toEqual(emptyProgress());
  });

  it('returns invalid for JSON that does not match the schema', () => {
    const result = readProgress(fixture('invalid-shape'));
    expect(result.state).toBe('invalid');
    if (result.state === 'invalid') expect(result.error).toMatch(/Unexpected shape/);
  });

  it('parses the example progress file', () => {
    const result = readProgress(fixture('mid-course'));
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.progress.profile.name).toBe('Alex');
    expect(result.progress.current).toBe('ai-foundations/02-how-machines-learn');
    expect(result.progress.lessons['ai-foundations/01-what-is-ai']).toMatchObject({ status: 'done', score: 0.8 });
  });

  it('parses the level, interests and personal path of the shipped example', () => {
    const result = readProgress(exampleFile);
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.progress.profile.level).toBe('beginner');
    expect(result.progress.profile.interests).toEqual(expect.any(Array));
    expect(result.progress.path).toEqual(expect.any(Array));
    expect(result.progress.pathReason).toEqual(expect.any(String));
    expect(result.progress.pathUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('reads a file without level, interests or path as before', () => {
    const result = readProgress(fixture('mid-course'));
    expect(result.state === 'ok' && result.progress.path).toBeUndefined();
    expect(result.state === 'ok' && result.progress.profile.level).toBeUndefined();
    expect(result.state === 'ok' && result.progress.profile.interests).toBeUndefined();
  });

  it('keeps a file with an unknown level valid and ignores the level', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    const file = join(dir, 'progress.json');
    writeFileSync(file, JSON.stringify({ version: 1, profile: { level: 'expert' }, lessons: {} }));
    const result = readProgress(file);
    expect(result.state).toBe('ok');
    expect(getLevel(result.state === 'ok' ? result.progress : null)).toBeUndefined();
  });

  it('fills defaults for a minimal file', () => {
    const result = readProgress(fixture('minimal'));
    expect(result).toEqual({ state: 'ok', progress: { version: 1, profile: {}, lessons: {} } });
  });

  it('uses the default path from getPaths and reads at call time', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    process.env.LESSONFOLK_PROGRESS_DIR = dir;
    expect(readProgress().state).toBe('missing');
    writeFileSync(join(dir, 'progress.json'), JSON.stringify({ version: 1, lessons: {} }));
    expect(readProgress().state).toBe('ok');
    writeFileSync(join(dir, 'progress.json'), '﻿{"version":1,"current":"x","lessons":{}}');
    const again = readProgress();
    expect(again.state === 'ok' && again.progress.current).toBe('x');
  });
});

describe('personalization scenario fixtures (docs/testing.md)', () => {
  const coursesDir = fileURLToPath(new URL('../../tests/fixtures/courses-valid', import.meta.url));
  const catalog = loadCatalog('en', coursesDir);
  const themeIds = loadThemes('en', coursesDir).map((th) => th.id);
  const read = (name: string) => {
    const result = readProgress(fixture(name));
    expect(result.state).toBe('ok');
    return progressOrEmpty(result);
  };

  it.each(['beginner-onboarded', 'level-check-passed', 'mid-course'])('%s uses only known ids (no warning)', (name) => {
    expect(getProgressWarnings(read(name), catalog.map((c) => c.id), themeIds)).toEqual([]);
  });

  it('beginner right after onboarding: beginner level, a path, and lesson 1 resumed', () => {
    const progress = read('beginner-onboarded');
    expect(getLevel(progress)).toBe('beginner');
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual(['ai-foundations']);
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/01-what-is-ai' } });
  });

  it('developer after a passed level check: every lesson is a placement skip, nothing left', () => {
    const progress = read('level-check-passed');
    expect(getLevel(progress)).toBe('intermediate');
    expect(getStats(catalog, progress).overall).toMatchObject({ skipped: 3, placementSkipped: 3, completed: true });
    expect(getNextLesson(catalog, progress)).toBeNull();
  });

  it('old progress file: no level or path, lessons kept, lesson 2 resumed', () => {
    const progress = read('mid-course');
    expect(getLevel(progress)).toBeUndefined();
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual([]);
    expect(getStats(catalog, progress).overall).toMatchObject({ done: 1, inProgress: 1, skipped: 0 });
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/02-how-machines-learn' } });
  });
});

describe('getNextLesson', () => {
  const next = (progress: Progress | null) => {
    const r = getNextLesson(courses, progress);
    return r && { kind: r.kind, course: r.course.id, lesson: r.lesson.id };
  };

  it('starts at the first lesson with no progress', () => {
    expect(next(null)).toEqual({ kind: 'next', course: 'ai-foundations', lesson: 'ai-foundations/01-what-is-ai' });
    expect(next(emptyProgress())).toEqual(next(null));
  });

  it('returns the rich course and lesson objects', () => {
    const r = getNextLesson(courses, null);
    expect(r?.lesson.title).toBe('ai-foundations/01-what-is-ai');
    expect(r?.course.title).toBe('AI Foundations');
  });

  it('picks the next lesson mid-course', () => {
    const p = progressWith({ 'ai-foundations/01-what-is-ai': 'done' });
    expect(next(p)).toEqual({ kind: 'next', course: 'ai-foundations', lesson: 'ai-foundations/02-how-machines-learn' });
  });

  it('resumes `current` when it is not done', () => {
    const p = progressWith(
      { 'ai-foundations/01-what-is-ai': 'done', 'prompting/02-advanced': 'in_progress' },
      'prompting/02-advanced',
    );
    expect(next(p)).toEqual({ kind: 'resume', course: 'prompting', lesson: 'prompting/02-advanced' });
  });

  it('resumes `current` even if it has no progress entry yet', () => {
    const p = progressWith({}, 'ai-foundations/03-what-is-an-llm');
    expect(next(p)?.kind).toBe('resume');
  });

  it('ignores `current` when it points to a done lesson', () => {
    const p = progressWith({ 'ai-foundations/01-what-is-ai': 'done' }, 'ai-foundations/01-what-is-ai');
    expect(next(p)).toEqual({ kind: 'next', course: 'ai-foundations', lesson: 'ai-foundations/02-how-machines-learn' });
  });

  it('ignores `current` when it points to a skipped lesson', () => {
    const p = progressWith({ 'ai-foundations/01-what-is-ai': 'skipped' }, 'ai-foundations/01-what-is-ai');
    expect(next(p)?.lesson).toBe('ai-foundations/02-how-machines-learn');
  });

  it('ignores `current` when it is not in the catalog', () => {
    const p = progressWith({}, 'unknown/01-lesson');
    expect(next(p)).toEqual({ kind: 'next', course: 'ai-foundations', lesson: 'ai-foundations/01-what-is-ai' });
  });

  it('treats skipped lessons as finished, including as prerequisites', () => {
    const p = progressWith({
      'ai-foundations/01-what-is-ai': 'skipped',
      'ai-foundations/02-how-machines-learn': 'done',
      'ai-foundations/03-what-is-an-llm': 'skipped',
    });
    expect(next(p)).toEqual({ kind: 'next', course: 'prompting', lesson: 'prompting/01-basics' });
  });

  it('skips lessons whose prerequisites are not met', () => {
    // 03 is in progress (not current), so prompting/01 is blocked; prompting/02 has no prerequisites.
    const p = progressWith({
      'ai-foundations/01-what-is-ai': 'done',
      'ai-foundations/02-how-machines-learn': 'done',
      'ai-foundations/03-what-is-an-llm': 'in_progress',
    });
    expect(next(p)?.lesson).toBe('ai-foundations/03-what-is-an-llm');

    const custom: CourseRef[] = [
      { id: 'a', lessons: [{ id: 'a/1', prerequisites: ['b/1'] }, { id: 'a/2', prerequisites: [] }] },
      { id: 'b', lessons: [{ id: 'b/1', prerequisites: [] }] },
    ];
    expect(getNextLesson(custom, null)?.lesson.id).toBe('a/2');
  });

  it('returns null when remaining lessons are blocked by unmet prerequisites', () => {
    const blocked: CourseRef[] = [{ id: 'a', lessons: [{ id: 'a/1', prerequisites: ['missing/1'] }] }];
    expect(getNextLesson(blocked, null)).toBeNull();
    expect(getStats(blocked, null).overall.completed).toBe(false);
  });

  it('returns null when everything is done or skipped', () => {
    const p = progressWith(
      Object.fromEntries(allIds.map((id, i) => [id, i % 2 ? 'skipped' : 'done'])),
      'prompting/02-advanced',
    );
    expect(next(p)).toBeNull();
    expect(getStats(courses, p).overall.completed).toBe(true);
  });
});

describe('getNextLesson with a personal path', () => {
  const next = (progress: Progress | null) => getNextLesson(courses, progress)?.lesson.id;
  const withPath = (path: string[] | undefined, lessons: Parameters<typeof progressWith>[0] = {}, current: string | null = null) => ({
    ...progressWith(lessons, current),
    path,
  });

  it('walks the path first', () => {
    expect(next(withPath(['prompting']))).toBe('prompting/02-advanced');
  });

  it('still honours prerequisites inside the path', () => {
    // prompting/01 needs ai-foundations/03, so the walk moves on to ai-foundations.
    const p = withPath(['prompting'], { 'prompting/02-advanced': 'done' });
    expect(next(p)).toBe('ai-foundations/01-what-is-ai');
  });

  it('moves on to the remaining courses in catalog order once the path is done', () => {
    const p = withPath(['prompting'], {
      'prompting/01-basics': 'skipped',
      'prompting/02-advanced': 'done',
    });
    expect(next(p)).toBe('ai-foundations/01-what-is-ai');
  });

  it('continues a partly done path', () => {
    const custom: CourseRef[] = [
      { id: 'a', lessons: [{ id: 'a/1', prerequisites: [] }] },
      { id: 'b', lessons: [{ id: 'b/1', prerequisites: [] }, { id: 'b/2', prerequisites: ['b/1'] }] },
      { id: 'c', lessons: [{ id: 'c/1', prerequisites: [] }] },
    ];
    const p = { ...progressWith({ 'c/1': 'done', 'b/1': 'done' }), path: ['c', 'b'] };
    expect(getNextLesson(custom, p)?.lesson.id).toBe('b/2');
    const done = { ...progressWith({ 'c/1': 'done', 'b/1': 'done', 'b/2': 'done' }), path: ['c', 'b'] };
    expect(getNextLesson(custom, done)?.lesson.id).toBe('a/1');
  });

  it('ignores unknown and repeated course ids in the path', () => {
    const p = withPath(['nope', 'prompting', 'prompting', 'also-missing']);
    expect(next(p)).toBe('prompting/02-advanced');
    expect(orderCourses(courses, p).map((c) => c.id)).toEqual(['prompting', 'ai-foundations']);
  });

  it('keeps the catalog order with an empty path or no path', () => {
    expect(orderCourses(courses, withPath([]))).toBe(courses);
    expect(orderCourses(courses, withPath(undefined))).toBe(courses);
    expect(orderCourses(courses, null)).toBe(courses);
    expect(next(withPath([]))).toBe('ai-foundations/01-what-is-ai');
    expect(next(withPath(undefined))).toBe('ai-foundations/01-what-is-ai');
  });

  it('still resumes `current` before walking the path', () => {
    const p = withPath(['prompting'], { 'ai-foundations/01-what-is-ai': 'in_progress' }, 'ai-foundations/01-what-is-ai');
    expect(getNextLesson(courses, p)?.kind).toBe('resume');
    expect(next(p)).toBe('ai-foundations/01-what-is-ai');
  });
});

describe('getProgressWarnings', () => {
  const courseIds = courses.map((c) => c.id);
  const themeIds = ['understanding-ai', 'using-ai'];

  it('has no warnings without path or interests, or with known ids', () => {
    expect(getProgressWarnings(null, courseIds, themeIds)).toEqual([]);
    expect(getProgressWarnings(emptyProgress(), courseIds, themeIds)).toEqual([]);
    const p: Progress = { ...emptyProgress(), path: ['prompting'], profile: { interests: ['using-ai'] } };
    expect(getProgressWarnings(p, courseIds, themeIds)).toEqual([]);
  });

  it('reports unknown course ids in the path and unknown theme ids in interests', () => {
    const p: Progress = {
      ...emptyProgress(),
      path: ['nope', 'prompting', 'nope'],
      profile: { interests: ['using-ai', 'cooking', 'gardening'] },
    };
    expect(getProgressWarnings(p, courseIds, themeIds)).toEqual([
      'path: unknown course id "nope" ignored',
      'profile.interests: unknown theme ids "cooking", "gardening" ignored',
    ]);
  });

  it('reports an unknown level, not a known one', () => {
    const known: Progress = { ...emptyProgress(), profile: { level: 'advanced' } };
    expect(getProgressWarnings(known, courseIds, themeIds)).toEqual([]);
    const unknown: Progress = { ...emptyProgress(), profile: { level: 'expert' } };
    expect(getProgressWarnings(unknown, courseIds, themeIds)).toEqual(['profile.level: unknown level "expert" ignored']);
  });
});

describe('getLevel', () => {
  it('returns a known level and ignores a missing or unknown one', () => {
    expect(getLevel({ ...emptyProgress(), profile: { level: 'intermediate' } })).toBe('intermediate');
    expect(getLevel(emptyProgress())).toBeUndefined();
    expect(getLevel(null)).toBeUndefined();
    expect(getLevel({ ...emptyProgress(), profile: { level: 'Beginner' } })).toBeUndefined();
  });
});

describe('isPlacementSkip', () => {
  const withEntry = (status: LessonStatus, notes?: string): Progress => ({
    ...emptyProgress(),
    lessons: { 'a/01': notes === undefined ? { status } : { status, notes } },
  });

  it('is true for a skipped lesson whose note is "placement", ignoring spaces and case', () => {
    expect(isPlacementSkip(withEntry('skipped', 'placement'), 'a/01')).toBe(true);
    expect(isPlacementSkip(withEntry('skipped', '  Placement 	'), 'a/01')).toBe(true);
  });

  it('is false for manual skips, other statuses and unknown lessons', () => {
    expect(isPlacementSkip(withEntry('skipped'), 'a/01')).toBe(false);
    expect(isPlacementSkip(withEntry('skipped', 'Knew it already'), 'a/01')).toBe(false);
    expect(isPlacementSkip(withEntry('skipped', 'placement check passed'), 'a/01')).toBe(false);
    expect(isPlacementSkip(withEntry('done', 'placement'), 'a/01')).toBe(false);
    expect(isPlacementSkip(withEntry('skipped', 'placement'), 'a/02')).toBe(false);
    expect(isPlacementSkip(null, 'a/01')).toBe(false);
  });
});

describe('getPathCourseIds', () => {
  const ids = courses.map((c) => c.id);

  it('keeps known ids in path order, without repeats', () => {
    const progress = { ...emptyProgress(), path: ['prompting', 'gone', 'ai-foundations', 'prompting'] };
    expect(getPathCourseIds(ids, progress)).toEqual(['prompting', 'ai-foundations']);
  });

  it('is empty without a path, with an empty path or with only unknown ids', () => {
    expect(getPathCourseIds(ids, emptyProgress())).toEqual([]);
    expect(getPathCourseIds(ids, { ...emptyProgress(), path: [] })).toEqual([]);
    expect(getPathCourseIds(ids, { ...emptyProgress(), path: ['gone'] })).toEqual([]);
    expect(getPathCourseIds(ids, undefined)).toEqual([]);
  });
});

describe('getStats', () => {
  it('reports zeros with no progress', () => {
    const stats = getStats(courses, null);
    expect(stats.overall).toEqual({
      done: 0,
      skipped: 0,
      placementSkipped: 0,
      inProgress: 0,
      total: 5,
      averageScore: null,
      completed: false,
    });
    expect(stats.courses.map((c) => [c.course.id, c.total])).toEqual([
      ['ai-foundations', 3],
      ['prompting', 2],
    ]);
  });

  it('computes per-course and overall counts and averages', () => {
    const p = progressWith({
      'ai-foundations/01-what-is-ai': { status: 'done', score: 0.8 },
      'ai-foundations/02-how-machines-learn': { status: 'done', score: 0.6 },
      'ai-foundations/03-what-is-an-llm': 'skipped',
      'prompting/01-basics': 'in_progress',
      'other/01-unknown': { status: 'done', score: 0 },
    });
    const stats = getStats(courses, p);
    const [foundations, prompting] = stats.courses;
    expect(foundations).toMatchObject({ done: 2, skipped: 1, inProgress: 0, total: 3, completed: true });
    expect(foundations.averageScore).toBeCloseTo(0.7);
    expect(prompting).toMatchObject({ done: 0, skipped: 0, inProgress: 1, total: 2, averageScore: null, completed: false });
    expect(stats.overall).toMatchObject({ done: 2, skipped: 1, inProgress: 1, total: 5, completed: false });
    expect(stats.overall.averageScore).toBeCloseTo(0.7);
  });

  it('does not mark an empty course as completed', () => {
    expect(getStats([{ id: 'empty', lessons: [] }], null).courses[0].completed).toBe(false);
  });
});
