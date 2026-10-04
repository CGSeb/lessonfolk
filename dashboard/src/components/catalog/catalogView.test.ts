import { describe, expect, it } from 'vitest';
import { emptyProgress, type CourseRef, type LessonStatus, type Progress } from '../../lib/progress';
import { getCatalogSections, OTHER_ANCHOR, type ThemeRef } from './catalogView';

const course = (id: string, lessonCount: number): CourseRef => ({
  id,
  lessons: Array.from({ length: lessonCount }, (_, i) => ({ id: `${id}/0${i + 1}`, prerequisites: [] })),
});

const a = course('a', 2);
const b = course('b', 1);
const c = course('c', 3);
const courses = [a, b, c]; // index.yaml order

const theme = (id: string, members: CourseRef[]): ThemeRef<CourseRef> => ({
  id,
  title: `Title ${id}`,
  description: `About ${id}.`,
  courses: members,
});

function progress(lessons: Record<string, LessonStatus>): Progress {
  return {
    ...emptyProgress(),
    lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
  };
}

const summary = (sections: ReturnType<typeof getCatalogSections>) =>
  sections.map((s) => [s.anchor, s.courses.map((x) => x.course.id)]);

describe('getCatalogSections', () => {
  it('groups courses by theme in themes.yaml order, keeping index.yaml order inside', () => {
    const themes = [theme('second', [c, a]), theme('first', [b])];
    expect(summary(getCatalogSections(courses, themes, emptyProgress()))).toEqual([
      ['theme-second', ['a', 'c']],
      ['theme-first', ['b']],
    ]);
  });

  it('hides empty themes', () => {
    const themes = [theme('empty', []), theme('all', courses)];
    expect(summary(getCatalogSections(courses, themes, emptyProgress()))).toEqual([
      ['theme-all', ['a', 'b', 'c']],
    ]);
  });

  it('keeps theme title and description on the section', () => {
    const [section] = getCatalogSections(courses, [theme('all', courses)], emptyProgress());
    expect(section.theme).toEqual({ id: 'all', title: 'Title all', description: 'About all.' });
  });

  it('puts courses with no known theme in a last section', () => {
    const sections = getCatalogSections(courses, [theme('t', [b])], emptyProgress());
    expect(summary(sections)).toEqual([
      ['theme-t', ['b']],
      [OTHER_ANCHOR, ['a', 'c']],
    ]);
    expect(sections[1].theme).toBeUndefined();
  });

  it('shows every course in the fallback section when there are no themes', () => {
    expect(summary(getCatalogSections(courses, [], emptyProgress()))).toEqual([
      [OTHER_ANCHOR, ['a', 'b', 'c']],
    ]);
  });

  it('ignores theme members that are not in the loaded catalog', () => {
    const ghost = course('ghost', 1);
    expect(summary(getCatalogSections([a], [theme('t', [a, ghost])], emptyProgress()))).toEqual([
      ['theme-t', ['a']],
    ]);
  });

  it('counts finished lessons and completed courses per theme', () => {
    const themes = [theme('one', [a, b]), theme('two', [c])];
    const sections = getCatalogSections(
      courses,
      themes,
      progress({ 'a/01': 'done', 'a/02': 'skipped', 'b/01': 'in_progress', 'c/01': 'done' }),
    );
    expect(sections.map((s) => [s.coursesCompleted, s.courses.length, s.lessons])).toEqual([
      [1, 2, { finished: 2, total: 3 }],
      [0, 1, { finished: 1, total: 3 }],
    ]);
  });
});
