import { readFileSync } from 'node:fs';
import { parseProgress, type ProgressResult } from '@lessonfolk/core';
import { getPaths } from './paths';

/**
 * Read and validate the local progress.json. Reads the file on every call (no caching)
 * so the dashboard always reflects the tutor's latest writes. Never throws for
 * a missing or invalid file. The schema and helpers live in `@lessonfolk/core`.
 */
export function readProgress(progressFile: string = getPaths().progressFile): ProgressResult {
  let raw: string;
  try {
    raw = readFileSync(progressFile, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { state: 'missing' };
    return { state: 'invalid', error: `Cannot read ${progressFile}: ${(err as Error).message}` };
  }
  return parseProgress(raw, progressFile);
}
