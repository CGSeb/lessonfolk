import { findRepoRoot, getCoursesDir, getProjectsDir } from '@lessonfolk/core';

export interface LessonFolkPaths {
  root: string;
  /** Directory containing one folder per language (courses/en, …). */
  courses: string;
  /** Practice projects, one folder per language (projects/en, …). */
  projects: string;
}

/**
 * Paths used by the dashboard. LESSONFOLK_COURSES_DIR and LESSONFOLK_PROJECTS_DIR override the
 * courses and projects folders (useful for tests and fixtures). Progress is in Postgres, not on disk.
 */
export function getPaths(): LessonFolkPaths {
  const root = findRepoRoot();
  return { root, courses: getCoursesDir(root), projects: getProjectsDir(root) };
}
