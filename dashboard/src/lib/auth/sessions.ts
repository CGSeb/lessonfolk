/**
 * Browser sessions of a signed-in learner (oauth mode): the absolute lifetime, listing the active
 * ones (created time and browser only, never an IP address) and revoking them. Sessions are rows
 * of the `session` table that Better Auth checks on every request, so deleting a row ends it at once.
 */
import { and, desc, eq, gt, ne } from 'drizzle-orm';
import { session, type Database } from '@lessonfolk/db';

/** A session ends this long after it was created, however often it is used (it is also renewed while in use, see SESSION_POLICY). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/** True once a session created at `createdAt` is older than the absolute lifetime. */
export function isPastMaxAge(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() >= SESSION_MAX_AGE_MS;
}

export interface BrowserSession {
  id: string;
  createdAt: Date;
  /** "Firefox on Windows", or `null` when the browser is unknown. */
  browser: string | null;
  /** The session making this request. */
  current: boolean;
}

/** A short, readable name from a User-Agent header ("Chrome on Windows"), `null` when unknown. Only the name is shown, not the header. */
export function describeBrowser(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const ua = userAgent;
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Firefox\/|FxiOS\//.test(ua)
        ? 'Firefox'
        : /Chrome\/|CriOS\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;
  const system = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Linux|X11/.test(ua)
              ? 'Linux'
              : null;
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system;
}

/** The learner's active sessions, newest first. `currentId` marks the one making this request. */
export async function listBrowserSessions(db: Database, userId: string, currentId: string | null, now: Date = new Date()): Promise<BrowserSession[]> {
  const rows = await db
    .select({ id: session.id, createdAt: session.createdAt, userAgent: session.userAgent })
    .from(session)
    .where(and(eq(session.userId, userId), gt(session.expiresAt, now)))
    .orderBy(desc(session.createdAt));
  return rows
    .filter((row) => !isPastMaxAge(row.createdAt, now))
    .map((row) => ({ id: row.id, createdAt: row.createdAt, browser: describeBrowser(row.userAgent), current: row.id === currentId }));
}

/** End one of the learner's sessions. Returns false when it is not theirs (or no longer exists). */
export async function revokeBrowserSession(db: Database, userId: string, sessionId: string): Promise<boolean> {
  const deleted = await db.delete(session).where(and(eq(session.id, sessionId), eq(session.userId, userId))).returning({ id: session.id });
  return deleted.length > 0;
}

/** End all the learner's sessions, or all but `keepId`. Returns how many ended. */
export async function revokeBrowserSessions(db: Database, userId: string, keepId: string | null = null): Promise<number> {
  const where = keepId ? and(eq(session.userId, userId), ne(session.id, keepId)) : eq(session.userId, userId);
  return (await db.delete(session).where(where).returning({ id: session.id })).length;
}

/** Remove a session row, for one found past its absolute lifetime. */
export async function deleteSessionRow(db: Database, sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId));
}
