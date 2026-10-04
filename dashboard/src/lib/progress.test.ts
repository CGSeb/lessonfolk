import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type CourseRef,
  type LessonStatus,
  type Progress,
  emptyProgress,
  getNextLesson,
  getStats,
  progressOrEmpty,
  readProgress,
} from './progress';

const fixtures = fileURLToPath(new URL('../../tests/fixtures/progress', import.meta.url));
const fixture = (name: string) => join(fixtures, name, 'progress.json');

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
    delete process.env.APPRENTICE_PROGRESS_DIR;
  });

  it('returns missing when there is no file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apprentice-progress-'));
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

  it('fills defaults for a minimal file', () => {
    const result = readProgress(fixture('minimal'));
    expect(result).toEqual({ state: 'ok', progress: { version: 1, profile: {}, lessons: {} } });
  });

  it('uses the default path from getPaths and reads at call time', () => {
    const dir = mkdtempSync(join(tmpdir(), 'apprentice-progress-'));
    process.env.APPRENTICE_PROGRESS_DIR = dir;
    expect(readProgress().state).toBe('missing');
    writeFileSync(join(dir, 'progress.json'), JSON.stringify({ version: 1, lessons: {} }));
    expect(readProgress().state).toBe('ok');
    writeFileSync(join(dir, 'progress.json'), '﻿{"version":1,"current":"x","lessons":{}}');
    const again = readProgress();
    expect(again.state === 'ok' && again.progress.current).toBe('x');
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

describe('getStats', () => {
  it('reports zeros with no progress', () => {
    const stats = getStats(courses, null);
    expect(stats.overall).toEqual({
      done: 0,
      skipped: 0,
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
