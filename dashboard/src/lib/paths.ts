import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Locate the LessonFolk repository root: the nearest ancestor of the working
 * directory that contains AGENTS.md. Override with LESSONFOLK_ROOT.
 */
export function findRepoRoot(start: string = process.cwd()): string {
  if (process.env.LESSONFOLK_ROOT) return resolve(process.env.LESSONFOLK_ROOT);
  let dir = resolve(start);
  while (!existsSync(join(dir, 'AGENTS.md'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`LessonFolk repository root not found from ${start}`);
    dir = parent;
  }
  return dir;
}

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
  const courses = resolve(process.env.LESSONFOLK_COURSES_DIR ?? join(root, 'courses'));
  const progress = resolve(process.env.LESSONFOLK_PROGRESS_DIR ?? join(root, '.progress'));
  return { root, courses, progress, progressFile: join(progress, 'progress.json') };
}
