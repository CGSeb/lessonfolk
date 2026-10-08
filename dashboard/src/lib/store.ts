/**
 * The dashboard's database connection and progress store, shared by every page,
 * API route and Better Auth. Created on first use from DATABASE_URL.
 *
 * The dashboard mostly reads progress (getProgress); the tutor writes it (through MCP, in this
 * same server). Every committed write publishes a per-user change event for live refresh.
 */
import { inspectCatalog, type Progress, type ProgressResult, type ProgressStore } from '@lessonfolk/core';
import { connect, createPostgresProgressStore, databaseUrl, type Database } from '@lessonfolk/db';
import type { CurrentUser } from './auth/current-user';
import { getProgressHub } from './watch';

let database: Database | undefined;
let store: ProgressStore | undefined;

/** The shared Drizzle client (one connection pool per server). */
export function getDatabase(): Database {
  database ??= connect(databaseUrl()).db;
  return database;
}

/** The shared progress store. */
export function getProgressStore(): ProgressStore {
  store ??= createPostgresProgressStore(getDatabase(), {
    courses: () => inspectCatalog('en').catalog.courses,
    // Open dashboard pages of this learner refresh (see pages/api/events.ts).
    onChange: (userId) => getProgressHub().publish(userId),
  });
  return store;
}

/**
 * Nothing saved yet: no profile, lesson, current lesson or path. A new learner has a
 * learner row from sign-in but nothing in it, like a missing progress.json before.
 */
export function isBlankProgress(progress: Progress): boolean {
  return (
    Object.keys(progress.profile ?? {}).length === 0 &&
    Object.keys(progress.lessons ?? {}).length === 0 &&
    !progress.current &&
    !progress.path?.length
  );
}

/**
 * The progress of `userId`, read on every call so pages show the latest writes.
 * `missing` for a learner who has not started; `invalid` (with the reason) when the
 * database cannot be read, so pages still render. Never throws.
 */
export async function loadProgress(userId: string, progressStore?: ProgressStore): Promise<ProgressResult> {
  try {
    const progress = await (progressStore ?? getProgressStore()).getProgress(userId);
    return isBlankProgress(progress) ? { state: 'missing' } : { state: 'ok', progress };
  } catch (error) {
    console.error(`Could not read the progress of user ${userId}:`, error);
    // Only the error code is shown on the page; the full error goes to the server log.
    const code = (error as { code?: unknown }).code ?? (error as Error).name;
    return { state: 'invalid', error: `Could not read your progress from the database (${String(code)}).` };
  }
}

/** The current user's progress, or `null` when signed out (pages then show no progress). */
export function loadProgressFor(user: CurrentUser | null): Promise<ProgressResult | null> {
  return user ? loadProgress(user.id) : Promise.resolve(null);
}
