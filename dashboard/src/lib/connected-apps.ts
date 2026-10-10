/**
 * The AI apps (MCP clients) a learner allowed on the consent page: list them, and disconnect
 * one. A consent row is what lets a client's tokens work, so disconnecting deletes it with the
 * client's refresh and access tokens for this user, and /mcp refuses any token without a
 * matching consent (see `isTokenAllowed`). Every query is scoped to the user id.
 */
import { and, asc, eq } from 'drizzle-orm';
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken, type Database } from '@lessonfolk/db';

export interface ConnectedApp {
  /** The consent row's id: what the Disconnect form sends. */
  id: string;
  clientId: string;
  name: string | null;
  since: Date | null;
}

/** The apps `userId` allowed, oldest first. */
export async function listConnectedApps(db: Database, userId: string): Promise<ConnectedApp[]> {
  return db
    .select({ id: oauthConsent.id, clientId: oauthConsent.clientId, name: oauthClient.name, since: oauthConsent.createdAt })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(asc(oauthConsent.createdAt));
}

/**
 * Cut `consentId` off, only if it belongs to `userId`: deletes the consent and that user's
 * refresh and access tokens for the same client. Returns false when there is no such consent.
 */
export async function disconnectApp(db: Database, userId: string, consentId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [consent] = await tx
      .select({ clientId: oauthConsent.clientId })
      .from(oauthConsent)
      .where(and(eq(oauthConsent.id, consentId), eq(oauthConsent.userId, userId)))
      .limit(1);
    if (!consent) return false;
    await tx
      .delete(oauthAccessToken)
      .where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, consent.clientId)));
    await tx
      .delete(oauthRefreshToken)
      .where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, consent.clientId)));
    await tx.delete(oauthConsent).where(and(eq(oauthConsent.id, consentId), eq(oauthConsent.userId, userId)));
    return true;
  });
}

/**
 * Whether an access token (a signed JWT, valid until it expires) may still be used: its user
 * must still hold a consent for its client, given no later than the token was issued. So
 * disconnecting an app, or deleting the account, stops its tokens at once, and consenting again
 * does not bring the old tokens back.
 */
export async function isTokenAllowed(
  db: Database,
  token: { userId: string; clientId: string | undefined; issuedAt: number | undefined },
): Promise<boolean> {
  if (!token.clientId || typeof token.issuedAt !== 'number') return false;
  const [consent] = await db
    .select({ createdAt: oauthConsent.createdAt })
    .from(oauthConsent)
    .where(and(eq(oauthConsent.userId, token.userId), eq(oauthConsent.clientId, token.clientId)))
    .limit(1);
  if (!consent) return false;
  return !consent.createdAt || Math.floor(consent.createdAt.getTime() / 1000) <= token.issuedAt;
}
