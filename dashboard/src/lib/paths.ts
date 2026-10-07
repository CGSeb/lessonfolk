import { findRepoRoot, getCoursesDir } from '@lessonfolk/core';

export interface LessonFolkPaths {
  root: string;
  /** Directory containing one folder per language (courses/en, …). */
  courses: string;
}

/**
 * Paths used by the dashboard. LESSONFOLK_COURSES_DIR overrides the courses folder
 * (useful for tests and fixtures). Progress is in Postgres, not on disk.
 */
export function getPaths(): LessonFolkPaths {
  const root = findRepoRoot();
  return { root, courses: getCoursesDir(root) };
}
