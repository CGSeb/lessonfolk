import { getStats, isFinished, type CourseRef, type CourseStats, type Progress } from '../../lib/progress';

/** A theme with its courses, as returned by the catalog loader (`Catalog.themes`). */
export interface ThemeRef<C extends CourseRef> {
  id: string;
  title: string;
  description: string;
  /** Courses in `index.yaml` order. */
  courses: C[];
}

export interface ThemeSection<C extends CourseRef> {
  /** `undefined` for the fallback section of courses with no known theme. */
  theme: Omit<ThemeRef<C>, 'courses'> | undefined;
  /** Anchor id of the section, unique on the page. */
  anchor: string;
  courses: CourseStats<C>[];
  coursesCompleted: number;
  /** Done or skipped lessons, out of all lessons of the theme. */
  lessons: { finished: number; total: number };
}

/** Anchor of the fallback section; theme ids are kebab-case so they cannot collide. */
export const OTHER_ANCHOR = 'theme--other';

/**
 * One section per non-empty theme, in `themes.yaml` order, with courses in
 * `index.yaml` order. Courses that belong to no listed theme (a content error,
 * already reported on the page) go to a last section so they never disappear.
 */
export function getCatalogSections<C extends CourseRef>(
  courses: C[],
  themes: ThemeRef<C>[],
  progress: Progress,
): ThemeSection<C>[] {
  const stats = new Map(getStats(courses, progress).courses.map((s) => [s.course.id, s]));
  const placed = new Set<string>();

  const section = (theme: ThemeSection<C>['theme'], anchor: string, members: C[]): ThemeSection<C> => {
    const courseStats = members.flatMap((c) => stats.get(c.id) ?? []);
    const lessons = members.flatMap((c) => c.lessons);
    return {
      theme,
      anchor,
      courses: courseStats,
      coursesCompleted: courseStats.filter((s) => s.completed).length,
      lessons: {
        finished: lessons.filter((l) => isFinished(progress, l.id)).length,
        total: lessons.length,
      },
    };
  };

  const sections: ThemeSection<C>[] = [];
  for (const { courses: members, ...theme } of themes) {
    // Keep index.yaml order and only courses that loaded.
    const ids = new Set(members.map((c) => c.id));
    const inTheme = courses.filter((c) => ids.has(c.id));
    if (!inTheme.length) continue;
    for (const c of inTheme) placed.add(c.id);
    sections.push(section(theme, `theme-${theme.id}`, inTheme));
  }
  const others = courses.filter((c) => !placed.has(c.id));
  if (others.length) sections.push(section(undefined, OTHER_ANCHOR, others));
  return sections;
}
