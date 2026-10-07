import { describe, expect, it } from 'vitest';
import { t } from '../../i18n/en';
import {
  emptyProgress,
  getNextLesson,
  type CourseRef,
  type LessonProgress,
  type Progress,
} from '@lessonfolk/core';
import { getInterestThemes, getPathView, pathStatusDisplay, type PathCourseStatus } from './pathView';

const courses: CourseRef[] = [
  {
    id: 'basics',
    lessons: [
      { id: 'basics/01', prerequisites: [] },
      { id: 'basics/02', prerequisites: ['basics/01'] },
    ],
  },
  { id: 'prompting', lessons: [{ id: 'prompting/01', prerequisites: ['basics/02'] }] },
  { id: 'agents', lessons: [{ id: 'agents/01', prerequisites: ['prompting/01'] }] },
  { id: 'ethics', lessons: [{ id: 'ethics/01', prerequisites: [] }] },
];

function progress(lessons: Record<string, LessonProgress> = {}, extra: Partial<Progress> = {}): Progress {
  return { ...emptyProgress(), lessons, ...extra };
}

const view = (p: Progress) => getPathView(courses, p, getNextLesson(courses, p));
const placement: LessonProgress = { status: 'skipped', notes: 'placement' };

describe('getPathView', () => {
  it('is none without a path, with an empty path or with only unknown ids', () => {
    expect(view(progress())).toEqual({ state: 'none' });
    expect(view(progress({}, { path: [] }))).toEqual({ state: 'none' });
    expect(view(progress({}, { path: ['gone', 'also-gone'] }))).toEqual({ state: 'none' });
  });

  it('lists known courses in path order, ignoring unknown and repeated ids', () => {
    const path = view(progress({}, { path: ['agents', 'gone', 'basics', 'agents'] }));
    expect(path.state === 'set' && path.courses.map((c) => c.course.id)).toEqual(['agents', 'basics']);
  });

  it('gives each course its status, with placement skips apart from manual skips', () => {
    const path = view(
      progress(
        {
          'basics/01': placement,
          'basics/02': { ...placement, notes: ' Placement ' },
          'prompting/01': { status: 'skipped', notes: 'Knew it already' },
          'ethics/01': { status: 'in_progress' },
        },
        { path: ['basics', 'prompting', 'agents', 'ethics'], current: 'ethics/01' },
      ),
    );
    if (path.state !== 'set') throw new Error('expected a path');
    expect(path.courses.map((c) => [c.course.id, c.status, c.placementSkipped])).toEqual([
      ['basics', 'skipped_placement', 2],
      ['prompting', 'done', 0],
      ['agents', 'not_started', 0],
      ['ethics', 'in_progress', 0],
    ]);
    // `current` wins, like the next-lesson card.
    expect(path.courses.map((c) => c.isNext)).toEqual([false, false, false, true]);
  });

  it('marks the course of the next lesson as up next, following the path order', () => {
    const path = view(progress({ 'basics/01': placement }, { path: ['basics', 'prompting'] }));
    if (path.state !== 'set') throw new Error('expected a path');
    // A course with only placement skips so far is not "in progress": the learner has not worked on it.
    expect(path.courses.map((c) => [c.course.id, c.status, c.isNext, c.finished, c.total])).toEqual([
      ['basics', 'up_next', true, 1, 2],
      ['prompting', 'not_started', false, 0, 1],
    ]);
  });

  it('counts a course mixing placement skips and done lessons as done', () => {
    const path = view(
      progress({ 'basics/01': placement, 'basics/02': { status: 'done' } }, { path: ['basics'] }),
    );
    expect(path.state === 'set' && path.courses[0]).toMatchObject({ status: 'done', placementSkipped: 1 });
  });

  it('keeps the reason and formats the update date, ignoring blank values', () => {
    const set = view(progress({}, { path: ['basics'], pathReason: '  Start simple. ', pathUpdatedAt: '2026-10-04' }));
    expect(set).toMatchObject({ state: 'set', reason: 'Start simple.', updatedOn: 'Oct 4, 2026' });
    const blank = view(progress({}, { path: ['basics'], pathReason: ' ', pathUpdatedAt: '' }));
    expect(blank).toMatchObject({ state: 'set', reason: undefined, updatedOn: undefined });
  });
});

describe('pathStatusDisplay', () => {
  it('maps every status to an existing UI string', () => {
    const statuses: PathCourseStatus[] = ['done', 'skipped_placement', 'in_progress', 'up_next', 'not_started'];
    for (const status of statuses) expect(t(pathStatusDisplay(status).key)).toBeTruthy();
    expect(pathStatusDisplay('skipped_placement').variant).toBe('placement');
  });
});

describe('getInterestThemes', () => {
  const themes = [
    { id: 'using-ai', title: 'Using AI', description: 'd' },
    { id: 'understanding-ai', title: 'Understanding AI', description: 'd' },
  ];

  it('resolves known theme ids in the learner order, ignoring unknown and repeated ids', () => {
    const p = progress({}, { profile: { interests: ['understanding-ai', 'nope', 'using-ai', 'understanding-ai'] } });
    expect(getInterestThemes(p, themes)).toEqual([
      { id: 'understanding-ai', title: 'Understanding AI' },
      { id: 'using-ai', title: 'Using AI' },
    ]);
  });

  it('is empty without interests', () => {
    expect(getInterestThemes(progress(), themes)).toEqual([]);
  });
});
