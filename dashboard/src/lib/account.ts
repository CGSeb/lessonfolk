/**
 * The learner's own data: import a progress.json (checked and previewed first), export it,
 * delete it. Used by the account pages and by `npm run progress:import`
 * (scripts/import-progress.ts), so this file only uses packages and relative `.ts` imports.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import {
  findRepoRoot,
  getLevel,
  getStats,
  parseImportedProgress,
  ProgressStoreError,
  type Course,
  type Level,
  type Progress,
  type ProgressStore,
} from '@lessonfolk/core';
import { user, type Database } from '@lessonfolk/db';
import { ensureLocalLearner } from './auth/local-learner.ts';
import type { AuthMode } from './auth/settings.ts';

/** Largest progress.json the account page accepts (real files are a few kilobytes). */
export const MAX_IMPORT_BYTES = 1024 * 1024;

/** The tutor's progress file in a LessonFolk folder: `<root>/.progress/progress.json`. */
export function localProgressFile(root: string = findRepoRoot()): string {
  return join(root, '.progress', 'progress.json');
}

/** The local progress file, when it exists (offered for import on a first run in `none` mode). */
export function findLocalProgressFile(root?: string): string | undefined {
  try {
    const file = localProgressFile(root);
    return existsSync(file) ? file : undefined;
  } catch {
    return undefined;
  }
}

/**
 * First run in `none` mode: offer to import the tutor's progress file when the database
 * holds no progress for the local learner yet (`missing`) and the file exists.
 */
export function offerLocalImport(mode: AuthMode, progressState: string | undefined, root?: string): boolean {
  return mode === 'none' && progressState === 'missing' && findLocalProgressFile(root) !== undefined;
}

/** Why a file cannot be imported: one sentence and the list of problems, for people. */
export interface ImportProblem {
  message: string;
  problems: string[];
}

/** The readable reason behind an import error, or `undefined` if it is not an import error. */
export function importProblem(error: unknown): ImportProblem | undefined {
  if (!(error instanceof ProgressStoreError)) return undefined;
  const problems = (error.details?.problems ?? []).map(String);
  return { message: error.message, problems };
}

/** A short picture of a progress, to compare before and after an import. */
export interface ProgressSummary {
  name: string | undefined;
  level: Level | undefined;
  /** Done or skipped lessons of the courses here. */
  finished: number;
  inProgress: number;
  /** Lessons of the courses here. */
  total: number;
  /** Title of the current lesson (or its id when it is not in the courses here). */
  current: string | undefined;
  /** Titles of the path's courses (ids when unknown here). */
  path: string[];
  /** Saved lessons that are not in the courses here: kept, but not shown. */
  unknownLessons: number;
  /** Nothing saved at all. */
  empty: boolean;
}

export function summarizeProgress(progress: Progress, courses: readonly Course[]): ProgressSummary {
  const lessons = new Map(courses.flatMap((course) => course.lessons.map((lesson) => [lesson.id, lesson.title] as const)));
  const titles = new Map(courses.map((course) => [course.id, course.title] as const));
  const { overall } = getStats([...courses], progress);
  const saved = Object.keys(progress.lessons ?? {});
  return {
    name: progress.profile?.name?.trim() || undefined,
    level: getLevel(progress) ?? undefined,
    finished: overall.done + overall.skipped,
    inProgress: overall.inProgress,
    total: overall.total,
    current: progress.current ? (lessons.get(progress.current) ?? progress.current) : undefined,
    path: (progress.path ?? []).map((id) => titles.get(id) ?? id),
    unknownLessons: saved.filter((id) => !lessons.has(id)).length,
    empty:
      Object.keys(progress.profile ?? {}).length === 0 && saved.length === 0 && !progress.current && !progress.path?.length,
  };
}

export type ImportPreview =
  | { ok: true; text: string; before: ProgressSummary; after: ProgressSummary }
  | ({ ok: false } & ImportProblem);

/**
 * Check a progress.json (its text) with the same rules as the import, and say what would
 * change. Nothing is written.
 */
export function previewImport(text: string, current: Progress, courses: readonly Course[]): ImportPreview {
  let imported: Progress;
  try {
    imported = parseImportedProgress(text);
  } catch (error) {
    const problem = importProblem(error);
    if (!problem) throw error;
    return { ok: false, ...problem };
  }
  return { ok: true, text, before: summarizeProgress(current, courses), after: summarizeProgress(imported, courses) };
}

/**
 * Delete the learner's data.
 *
 * - `oauth`: the user and everything that hangs off it (sign-in accounts, sessions, learner,
 *   lesson progress, change log, MCP apps and tokens), through the `on delete cascade` keys.
 * - `none`: there is no account, only the local learner. Its progress and change log are
 *   deleted and an empty learner is created again, so the dashboard starts fresh. The
 *   `.progress/progress.json` file is never touched.
 */
export async function deleteLearnerData(mode: AuthMode, userId: string, db: Database, store: ProgressStore): Promise<void> {
  if (mode === 'oauth') {
    await db.delete(user).where(eq(user.id, userId));
    return;
  }
  await store.deleteLearner(userId);
  await ensureLocalLearner(db);
}
