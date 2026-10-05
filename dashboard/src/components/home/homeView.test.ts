import { describe, expect, it } from 'vitest';
import type { CourseRef, LessonStatus, Progress, ProgressResult } from '../../lib/progress';
import { getHomeView } from './homeView';

const courses: CourseRef[] = [
  {
    id: 'basics',
    lessons: [
      { id: 'basics/01', prerequisites: [] },
      { id: 'basics/02', prerequisites: ['basics/01'] },
    ],
  },
  { id: 'more', lessons: [{ id: 'more/01', prerequisites: ['basics/02'] }] },
];

function ok(lessons: Record<string, LessonStatus>, extra: Partial<Progress> = {}): ProgressResult {
  return {
    state: 'ok',
    progress: {
      version: 1,
      profile: {},
      current: null,
      lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
      ...extra,
    },
  };
}

describe('getHomeView', () => {
  it('shows a new learner the first lesson when there is no progress file', () => {
    const home = getHomeView(courses, { state: 'missing' });
    expect(home.view).toMatchObject({ state: 'new', first: { kind: 'next', lesson: { id: 'basics/01' } } });
    expect(home.lessons).toEqual({ finished: 0, total: 3 });
    expect(home.courses).toEqual({ completed: 0, total: 2 });
    expect(home.progressError).toBeUndefined();
  });

  it('treats an invalid progress file as a new learner and keeps the error', () => {
    const home = getHomeView(courses, { state: 'invalid', error: 'Invalid JSON' });
    expect(home.view.state).toBe('new');
    expect(home.progressError).toBe('Invalid JSON');
  });

  it('resumes the current lesson and counts finished lessons and courses', () => {
    const home = getHomeView(
      courses,
      ok(
        { 'basics/01': 'done', 'basics/02': 'skipped', 'more/01': 'in_progress' },
        { current: 'more/01', profile: { name: '  Alex ' } },
      ),
    );
    expect(home.view).toMatchObject({ state: 'in_progress', next: { kind: 'resume', course: { id: 'more' } } });
    expect(home.name).toBe('Alex');
    expect(home.lessons).toEqual({ finished: 2, total: 3 });
    expect(home.courses).toEqual({ completed: 1, total: 2 });
  });

  it('treats a blank name as absent', () => {
    expect(getHomeView(courses, ok({}, { profile: { name: ' ' } })).name).toBeUndefined();
  });

  it('is done when every lesson is done or skipped', () => {
    const home = getHomeView(courses, ok({ 'basics/01': 'done', 'basics/02': 'done', 'more/01': 'skipped' }));
    expect(home.view.state).toBe('done');
    expect(home.courses).toEqual({ completed: 2, total: 2 });
  });

  it('is blocked when lessons remain but none has its prerequisites met', () => {
    const blocked: CourseRef[] = [{ id: 'x', lessons: [{ id: 'x/01', prerequisites: ['x/missing'] }] }];
    expect(getHomeView(blocked, ok({})).view.state).toBe('blocked');
  });

  it('is empty when no course could be loaded', () => {
    expect(getHomeView([], ok({})).view.state).toBe('empty');
    expect(getHomeView([], { state: 'missing' }).view).toEqual({ state: 'new', first: null });
  });

  it('follows the personal path and warns about unknown ids', () => {
    const home = getHomeView(
      courses,
      ok({ 'basics/01': 'done', 'basics/02': 'done' }, { path: ['gone', 'more'], profile: { interests: ['first', 'x'] } }),
      [{ id: 'first', title: 'T', description: 'd', courses }],
    );
    expect(home.view).toMatchObject({ state: 'in_progress', next: { lesson: { id: 'more/01' } } });
    expect(home.progressWarnings).toEqual([
      'path: unknown course id "gone" ignored',
      'profile.interests: unknown theme id "x" ignored',
    ]);
  });

  it('summarises the profile and the path, matching the next lesson', () => {
    const home = getHomeView(
      courses,
      ok(
        { 'basics/01': 'done' },
        {
          path: ['more', 'basics'],
          pathReason: 'Because.',
          profile: { level: 'intermediate', interests: ['first', 'x'] },
        },
      ),
      [{ id: 'first', title: 'T', description: 'd', courses }],
    );
    expect(home.level).toBe('intermediate');
    expect(home.interests).toEqual([{ id: 'first', title: 'T' }]);
    expect(home.view).toMatchObject({ state: 'in_progress', next: { lesson: { id: 'basics/02' } } });
    expect(home.path).toMatchObject({ state: 'set', reason: 'Because.' });
    expect(home.path.state === 'set' && home.path.courses.map((c) => [c.course.id, c.status, c.isNext])).toEqual([
      ['more', 'not_started', false],
      ['basics', 'in_progress', true],
    ]);
  });

  it('has no level, interests or path for a new learner or an unknown level', () => {
    const home = getHomeView(courses, { state: 'missing' });
    expect([home.level, home.interests, home.path]).toEqual([undefined, [], { state: 'none' }]);
    expect(getHomeView(courses, ok({}, { profile: { level: 'expert' } })).level).toBeUndefined();
  });

  it('has no progress warnings for a file without path or interests', () => {
    expect(getHomeView(courses, ok({})).progressWarnings).toEqual([]);
    expect(getHomeView(courses, { state: 'missing' }).progressWarnings).toEqual([]);
  });

  describe('progress by theme', () => {
    const theme = (id: string, members: CourseRef[]) => ({ id, title: `T ${id}`, description: 'd', courses: members });
    const [basics, more] = courses;

    it('lists non-empty themes in order with finished lessons', () => {
      const home = getHomeView(courses, ok({ 'basics/01': 'done', 'more/01': 'skipped' }), [
        theme('empty', []),
        theme('second', [more]),
        theme('first', [basics]),
      ]);
      expect(home.themes).toEqual([
        { id: 'second', title: 'T second', anchor: 'theme-second', finished: 1, total: 1, completed: true },
        { id: 'first', title: 'T first', anchor: 'theme-first', finished: 1, total: 2, completed: false },
      ]);
    });

    it('leaves out courses whose theme is unknown', () => {
      const home = getHomeView(courses, ok({}), [theme('first', [basics])]);
      expect(home.themes.map((th) => th.id)).toEqual(['first']);
    });

    it('is empty without themes', () => {
      expect(getHomeView(courses, ok({})).themes).toEqual([]);
    });
  });
});
