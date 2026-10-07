import { join, resolve } from 'node:path';
import { findRepoRoot, getCoursesDir } from '@lessonfolk/core';

export interface LessonFolkPaths {
  root: string;
  /** Directory containing one folder per language (courses/en, …). */
  courses: string;
  /** Directory containing progress.json. */
  progress: string;
  progressFile: string;
}

/**
 * Paths used by the dashboard. LESSONFOLK_COURSES_DIR and LESSONFOLK_PROGRESS_DIR
 * override the defaults (useful for tests and fixtures).
 */
export function getPaths(): LessonFolkPaths {
  const root = findRepoRoot();
  const courses = getCoursesDir(root);
  const progress = resolve(process.env.LESSONFOLK_PROGRESS_DIR ?? join(root, '.progress'));
  return { root, courses, progress, progressFile: join(progress, 'progress.json') };
}
