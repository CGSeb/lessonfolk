/**
 * Everything LessonFolk holds about one learner, as a JSON document (GDPR access and
 * portability, "Download all my data"). The data map in docs/privacy.md lists the same
 * tables; keep both in step when the schema changes.
 *
 * Secrets are never exported: no password hash, no provider or OAuth token value, no client
 * secret, no session token. Where one exists, a `has…` flag says so.
 */
import { asc, eq, inArray } from 'drizzle-orm';
import {
  account,
  learner,
  lessonProgress,
  oauthAccessToken,
  oauthClient,
  oauthConsent,
  oauthRefreshToken,
  progressEvent,
  session,
  user,
  type Database,
} from '@lessonfolk/db';

/** Version of the shape of the export, raised when a field is renamed or removed. */
export const PERSONAL_DATA_VERSION = 1;

const iso = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

/** The export of `userId`, or `undefined` when there is no such user. */
export async function buildPersonalDataExport(db: Database, userId: string, now: Date = new Date()) {
  const [profile] = await db.select().from(user).where(eq(user.id, userId));
  if (!profile) return undefined;

  const accounts = await db.select().from(account).where(eq(account.userId, userId)).orderBy(asc(account.createdAt));
  const sessions = await db.select().from(session).where(eq(session.userId, userId)).orderBy(asc(session.createdAt));
  const clients = await db.select().from(oauthClient).where(eq(oauthClient.userId, userId)).orderBy(asc(oauthClient.createdAt));
  const consents = await db.select().from(oauthConsent).where(eq(oauthConsent.userId, userId)).orderBy(asc(oauthConsent.createdAt));
  const accessTokens = await db.select().from(oauthAccessToken).where(eq(oauthAccessToken.userId, userId));
  const refreshTokens = await db.select().from(oauthRefreshToken).where(eq(oauthRefreshToken.userId, userId));
  const [learnerRow] = await db.select().from(learner).where(eq(learner.userId, userId));
  const lessons = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)).orderBy(asc(lessonProgress.lessonId));
  const events = await db.select().from(progressEvent).where(eq(progressEvent.userId, userId)).orderBy(asc(progressEvent.id));

  // Names of the apps behind the consents and tokens (they may belong to another user's registration).
  const clientIds = [...new Set([...consents, ...accessTokens, ...refreshTokens].map((row) => row.clientId))];
  const clientNames = new Map<string, string | null>();
  if (clientIds.length > 0) {
    for (const row of await db.select({ clientId: oauthClient.clientId, name: oauthClient.name }).from(oauthClient).where(inArray(oauthClient.clientId, clientIds))) {
      clientNames.set(row.clientId, row.name);
    }
  }
  const appName = (clientId: string) => clientNames.get(clientId) ?? null;

  return {
    format: 'lessonfolk-personal-data',
    version: PERSONAL_DATA_VERSION,
    exportedAt: now.toISOString(),
    notice:
      'All the personal data this LessonFolk holds about you. Secrets (tokens, keys, password hashes) are never included: where one exists, a has… field says so. The tutor’s progress.json is a separate download on the Account page.',
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      emailVerified: profile.emailVerified,
      createdAt: iso(profile.createdAt),
      updatedAt: iso(profile.updatedAt),
    },
    signInAccounts: accounts.map((row) => ({
      id: row.id,
      provider: row.providerId,
      providerAccountId: row.accountId,
      scope: row.scope,
      hasAccessToken: row.accessToken !== null,
      hasRefreshToken: row.refreshToken !== null,
      hasIdToken: row.idToken !== null,
      hasPassword: row.password !== null,
      accessTokenExpiresAt: iso(row.accessTokenExpiresAt),
      refreshTokenExpiresAt: iso(row.refreshTokenExpiresAt),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    sessions: sessions.map((row) => ({
      id: row.id,
      userAgent: row.userAgent,
      expiresAt: iso(row.expiresAt),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    mcp: {
      clientsRegisteredByYou: clients.map((row) => ({
        clientId: row.clientId,
        name: row.name,
        uri: row.uri,
        contacts: row.contacts,
        redirectUris: row.redirectUris,
        scopes: row.scopes,
        hasClientSecret: row.clientSecret !== null,
        createdAt: iso(row.createdAt),
        updatedAt: iso(row.updatedAt),
      })),
      consents: consents.map((row) => ({
        id: row.id,
        clientId: row.clientId,
        appName: appName(row.clientId),
        scopes: row.scopes,
        resources: row.resources,
        createdAt: iso(row.createdAt),
        updatedAt: iso(row.updatedAt),
      })),
      accessTokens: accessTokens.map((row) => ({
        id: row.id,
        clientId: row.clientId,
        appName: appName(row.clientId),
        scopes: row.scopes,
        resources: row.resources,
        createdAt: iso(row.createdAt),
        expiresAt: iso(row.expiresAt),
        revokedAt: iso(row.revoked),
      })),
      refreshTokens: refreshTokens.map((row) => ({
        id: row.id,
        clientId: row.clientId,
        appName: appName(row.clientId),
        scopes: row.scopes,
        resources: row.resources,
        createdAt: iso(row.createdAt),
        expiresAt: iso(row.expiresAt),
        revokedAt: iso(row.revoked),
      })),
    },
    learner: learnerRow
      ? {
          profile: learnerRow.profile,
          path: learnerRow.path,
          pathReason: learnerRow.pathReason,
          pathUpdatedAt: iso(learnerRow.pathUpdatedAt),
          currentLessonId: learnerRow.currentLessonId,
          createdAt: iso(learnerRow.createdAt),
          updatedAt: iso(learnerRow.updatedAt),
        }
      : null,
    lessonProgress: lessons.map((row) => ({
      lessonId: row.lessonId,
      status: row.status,
      startedAt: iso(row.startedAt),
      completedAt: iso(row.completedAt),
      score: row.score,
      notes: row.notes,
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
    })),
    progressEvents: events.map((row) => ({
      id: row.id,
      action: row.action,
      payload: row.payload,
      client: row.client,
      createdAt: iso(row.createdAt),
    })),
  };
}

export type PersonalDataExport = NonNullable<Awaited<ReturnType<typeof buildPersonalDataExport>>>;

/** How recently the learner must have signed in to export or delete everything (hosted version). */
export const RECENT_SIGN_IN_MS = 10 * 60 * 1000;

/**
 * Whether a sign-in is recent enough for a sensitive action. Without sign-in (`none` mode,
 * `signedInAt` null) there is nothing to prove: the dashboard only listens on this computer.
 */
export function isRecentSignIn(mode: 'none' | 'oauth', signedInAt: Date | null, now: Date = new Date()): boolean {
  if (mode === 'none') return true;
  return signedInAt !== null && now.getTime() - signedInAt.getTime() <= RECENT_SIGN_IN_MS;
}
