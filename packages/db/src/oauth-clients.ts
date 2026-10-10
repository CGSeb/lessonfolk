import { and, eq, isNull, lt, notExists } from 'drizzle-orm';
import type { Database } from './connection.ts';
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from './schema.ts';

/** Registered clients that nobody allowed are deleted after this many days. */
export const UNUSED_CLIENT_DAYS = 7;

/**
 * Deletes OAuth clients registered through open dynamic registration that were never used:
 * created before the cutoff, not owned by a user, and with no consent and no token. Returns
 * how many were deleted. Used clients are never touched.
 */
export async function purgeUnusedOAuthClients(db: Database, days = UNUSED_CLIENT_DAYS, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(oauthClient)
    .where(
      and(
        lt(oauthClient.createdAt, cutoff),
        isNull(oauthClient.userId),
        notExists(db.select({ x: oauthConsent.id }).from(oauthConsent).where(eq(oauthConsent.clientId, oauthClient.clientId))),
        notExists(db.select({ x: oauthAccessToken.id }).from(oauthAccessToken).where(eq(oauthAccessToken.clientId, oauthClient.clientId))),
        notExists(db.select({ x: oauthRefreshToken.id }).from(oauthRefreshToken).where(eq(oauthRefreshToken.clientId, oauthClient.clientId))),
      ),
    )
    .returning({ id: oauthClient.id });
  return deleted.length;
}
