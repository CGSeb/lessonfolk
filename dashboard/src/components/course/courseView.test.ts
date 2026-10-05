import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Course, Lesson } from '../../lib/courses';
import { emptyProgress, type Progress } from '../../lib/progress';
import { formatDate, getCourseView, issuesForCourse } from './courseView';

const lesson = (id: string, prerequisites: string[] = []): Lesson => ({
  id,
  title: id,
  level: 'beginner',
  estimatedMinutes: 15,
  objectives: ['x'],
  prerequisites,
  file: `/courses/en/${id}.md`,
});

const course = (id: string, lessonIds: string[], prerequisites: string[] = []): Course => ({
  id,
  title: `Title ${id}`,
  level: 'beginner',
  description: 'd',
  theme: 't',
  authors: ['x'],
  estimatedHours: 1,
  prerequisites,
  lessons: lessonIds.map((l) => lesson(`${id}/${l}`)),
});

const catalog = [course('a', ['01', '02', '03']), course('b', ['01', '02'], ['a', 'gone'])];

const progress = (over: Partial<Progress> = {}): Progress => ({ ...emptyProgress(), ...over });

describe('getCourseView', () => {
  it('returns undefined for an unknown course', () => {
    expect(getCourseView(catalog, 'nope', progress())).toBeUndefined();
  });

  it('lists lessons in order with no progress', () => {
    const view = getCourseView(catalog, 'a', progress())!;
    expect(view.lessons.map((r) => r.lesson.id)).toEqual(['a/01', 'a/02', 'a/03']);
    expect(view.lessons.map((r) => r.status)).toEqual(['not_started', 'not_started', 'not_started']);
    expect(view.lessons.map((r) => r.isNext)).toEqual([true, false, false]);
    expect(view.lessons[0]).toMatchObject({ scorePercent: null, completedOn: null, notes: null });
    expect(view.status).toBe('not_started');
    expect(view.finished).toBe(0);
  });

  it('shows statuses, scores, dates and notes when present', () => {
    const view = getCourseView(
      catalog,
      'a',
      progress({
        current: 'a/02',
        lessons: {
          'a/01': { status: 'done', completedAt: '2026-10-04', score: 0.834, notes: '  Easy.  ' },
          'a/02': { status: 'in_progress', notes: '   ' },
          'a/03': { status: 'skipped' },
        },
      }),
    )!;
    expect(view.lessons.map((r) => r.status)).toEqual(['done', 'in_progress', 'skipped']);
    expect(view.lessons[0]).toMatchObject({ scorePercent: 83, completedOn: 'Oct 4, 2026', notes: 'Easy.' });
    expect(view.lessons[1].notes).toBeNull();
    expect(view.lessons.map((r) => r.isNext)).toEqual([false, true, false]);
    expect(view.finished).toBe(2);
    expect(view.status).toBe('in_progress');
  });

  it('marks no lesson as next when the next lesson is in another course', () => {
    const lessons = Object.fromEntries(catalog[0].lessons.map((l) => [l.id, { status: 'done' as const }]));
    const a = getCourseView(catalog, 'a', progress({ lessons }))!;
    expect(a.lessons.some((r) => r.isNext)).toBe(false);
    expect(a.status).toBe('completed');
    const b = getCourseView(catalog, 'b', progress({ lessons }))!;
    expect(b.lessons[0].isNext).toBe(true);
  });

  it('resolves prerequisite courses, keeping unknown ids', () => {
    const view = getCourseView(catalog, 'b', progress())!;
    expect(view.prerequisites.map((p) => [p.id, p.course?.title])).toEqual([
      ['a', 'Title a'],
      ['gone', undefined],
    ]);
  });
});

describe('formatDate', () => {
  it('formats date-only values without shifting the day', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
  });

  it('formats full timestamps', () => {
    expect(formatDate('2026-06-15T12:00:00Z')).toBe('Jun 15, 2026');
  });

  it('returns unparseable values unchanged', () => {
    expect(formatDate('last Tuesday')).toBe('last Tuesday');
  });
});

describe('issuesForCourse', () => {
  it('keeps only issues inside the course folder', () => {
    const dir = join('/repo', 'courses', 'en', 'a');
    const issues = [
      { file: join(dir, 'course.yaml'), message: '1' },
      { file: join(dir, '01.md'), message: '2' },
      { file: join('/repo', 'courses', 'en', 'ab', 'course.yaml'), message: '3' },
      { file: join('/repo', 'courses', 'en', 'index.yaml'), message: '4' },
    ];
    expect(issuesForCourse(issues, dir).map((i) => i.message)).toEqual(['1', '2']);
  });
});
