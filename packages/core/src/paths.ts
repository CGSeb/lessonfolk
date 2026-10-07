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

/**
 * Default courses directory (one folder per language: courses/en, …): `courses/` at the
 * repository root, or LESSONFOLK_COURSES_DIR when set (useful for tests and fixtures).
 */
export function getCoursesDir(root?: string): string {
  return resolve(process.env.LESSONFOLK_COURSES_DIR ?? join(root ?? findRepoRoot(), 'courses'));
}
