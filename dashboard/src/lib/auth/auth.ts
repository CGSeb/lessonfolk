/**
 * Better Auth, used when LESSONFOLK_AUTH=oauth. Sessions, accounts and users live
 * in Postgres (the tables of packages/db/src/schema.ts).
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins';
import { account, session, user, verification, type Database } from '@lessonfolk/db';
// The MCP authorization server (/mcp, packages/mcp): its Better Auth plugins and tables.
import { mcpAuthPlugins, mcpAuthSchema } from '@lessonfolk/mcp';
import { getDatabase } from '../store.ts';
import { ensureLearner } from './local-learner.ts';
import { readAuthSettings, type OAuthSettings } from './settings.ts';

/** Where Better Auth's routes live (src/pages/api/auth/[...all].ts). */
export const AUTH_BASE_PATH = '/api/auth';

/** Sessions last 7 days from the last use (the cookie is renewed at most once a day), and 30 days at most (SESSION_MAX_AGE_SECONDS, lib/auth/sessions.ts), then the learner signs in again. */
export const SESSION_POLICY = { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 } as const;

export function createAuth(settings: OAuthSettings, db: Database) {
  const { github, google } = settings.providers;
  return betterAuth({
    appName: 'LessonFolk',
    baseURL: settings.baseURL,
    basePath: AUTH_BASE_PATH,
    secret: settings.secret,
    database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification, ...mcpAuthSchema } }),
    socialProviders: {
      ...(github && { github: { clientId: github.clientId, clientSecret: github.clientSecret } }),
      ...(google && { google: { clientId: google.clientId, clientSecret: google.clientSecret } }),
    },
    plugins: [...mcpAuthPlugins(settings.baseURL), ...(settings.fakeOAuthURL ? [fakeOAuthProvider(settings.fakeOAuthURL)] : [])],
    databaseHooks: {
      session: {
        // The IP address is not needed: do not keep it (the column stays because Better Auth requires it).
        create: { before: async (created) => ({ data: { ...created, ipAddress: null } }) },
      },
      user: {
        // The profile picture is not needed: do not keep it (the column stays because Better Auth requires it).
        update: { before: async (changes) => ({ data: { ...changes, image: null } }) },
        create: {
          before: async (created) => ({ data: { ...created, image: null } }),
          // Every user gets a learner row, where their progress will go.
          after: async (created) => ensureLearner(db, created.id),
        },
      },
    },
    session: SESSION_POLICY,
    account: {
      // One person, one account: a provider joins an existing account only when it reports the
      // same verified email as an email already verified here. No provider is trusted blindly.
      accountLinking: { enabled: true, trustedProviders: [], allowDifferentEmails: false, requireLocalEmailVerified: true },
    },
    advanced: {
      // Secure cookies whenever the public address is https (Better Auth already does this for the
      // `__Secure-` cookie prefix; stated here so a change of default cannot weaken it).
      useSecureCookies: settings.baseURL.startsWith('https://'),
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax' },
    },
    telemetry: { enabled: false },
  });
}

/**
 * Test-only OAuth 2.0 provider (tests/e2e/fake-oauth.ts). It goes through the same
 * sign-in, callback and session code as GitHub and Google. readAuthSettings only
 * accepts it when NODE_ENV=test and it points at 127.0.0.1.
 */
function fakeOAuthProvider(origin: string) {
  return genericOAuth({
    config: [
      {
        providerId: 'fake',
        name: 'Test provider',
        clientId: 'lessonfolk-test',
        clientSecret: 'lessonfolk-test-secret',
        authorizationUrl: `${origin}/authorize`,
        tokenUrl: `${origin}/token`,
        userInfoUrl: `${origin}/userinfo`,
        scopes: ['openid', 'email', 'profile'],
        pkce: true,
      },
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/** The app's Better Auth instance (oauth mode only), created on first use. */
export function getAuth(): Auth {
  if (!instance) {
    const settings = readAuthSettings();
    if (settings.mode !== 'oauth') throw new Error('Better Auth is only used with LESSONFOLK_AUTH=oauth.');
    instance = createAuth(settings, getDatabase());
  }
  return instance;
}
