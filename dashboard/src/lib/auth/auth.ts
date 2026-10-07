/**
 * Better Auth, used when LESSONFOLK_AUTH=oauth. Sessions, accounts and users live
 * in Postgres (the tables of packages/db/src/schema.ts).
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins';
import { account, session, user, verification, type Database } from '@lessonfolk/db';
import { getDatabase } from '../store.ts';
import { ensureLearner } from './local-learner.ts';
import { readAuthSettings, type OAuthSettings } from './settings.ts';

/** Where Better Auth's routes live (src/pages/api/auth/[...all].ts). */
export const AUTH_BASE_PATH = '/api/auth';

export function createAuth(settings: OAuthSettings, db: Database) {
  const { github, google } = settings.providers;
  return betterAuth({
    appName: 'LessonFolk',
    baseURL: settings.baseURL,
    basePath: AUTH_BASE_PATH,
    secret: settings.secret,
    database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
    socialProviders: {
      ...(github && { github: { clientId: github.clientId, clientSecret: github.clientSecret } }),
      ...(google && { google: { clientId: google.clientId, clientSecret: google.clientSecret } }),
    },
    plugins: settings.fakeOAuthURL ? [fakeOAuthProvider(settings.fakeOAuthURL)] : [],
    databaseHooks: {
      user: {
        create: {
          // Every user gets a learner row, where their progress will go.
          after: async (created) => ensureLearner(db, created.id),
        },
      },
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
