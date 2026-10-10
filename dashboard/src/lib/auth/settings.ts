/**
 * Sign-in settings, read from the environment (see .env.example and docs/auth-dev.md).
 *
 *   LESSONFOLK_AUTH=none   No sign-in: one local learner. Only on 127.0.0.1.
 *   LESSONFOLK_AUTH=oauth  Sign in with GitHub and/or Google, whichever has credentials.
 *
 * This file only uses Node built-ins and relative `.ts` imports, so the server
 * launcher (scripts/serve.ts) can run it with Node's type stripping before the
 * Astro server starts.
 */

export const AUTH_MODES = ['none', 'oauth'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

/** Real providers, in the order the sign-in page lists them. */
export const PROVIDERS = ['github', 'google'] as const;
export type RealProviderId = (typeof PROVIDERS)[number];
/** `fake` is the test-only OAuth provider (see FAKE_OAUTH_ENV). */
export type ProviderId = RealProviderId | 'fake';

export interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

export interface NoneSettings {
  mode: 'none';
}

export interface OAuthSettings {
  mode: 'oauth';
  /** Public URL of the app, without a trailing slash. Callbacks go to `${baseURL}/api/auth/callback/<provider>`. */
  baseURL: string;
  /** Signs session cookies and OAuth state (BETTER_AUTH_SECRET). */
  secret: string;
  /** Providers with credentials, in PROVIDERS order. */
  providers: Partial<Record<RealProviderId, ProviderCredentials>>;
  /** Base URL of the fake OAuth server, only in automated tests. */
  fakeOAuthURL?: string;
}

export type AuthSettings = NoneSettings | OAuthSettings;

/** Base URL of the fake OAuth server used by the automated tests. Ignored unless NODE_ENV=test. */
export const FAKE_OAUTH_ENV = 'LESSONFOLK_TEST_OAUTH_URL';

/** The single learner of `LESSONFOLK_AUTH=none`. */
export const LOCAL_USER = {
  id: 'local',
  name: 'Local learner',
  // Better Auth needs a unique email per user; this one never receives mail.
  email: 'local@lessonfolk.localhost',
} as const;

const MIN_SECRET_LENGTH = 32;

/** A setting that stops the server from starting. The message says how to fix it. */
export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigError';
  }
}

type Env = Record<string, string | undefined>;

const value = (env: Env, name: string) => env[name]?.trim() || undefined;

/** True for addresses only this computer can reach: 127.x.x.x, ::1 and localhost. */
export function isLoopback(host: string): boolean {
  const h = host.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
  return h === 'localhost' || h === '::1' || h === '::ffff:127.0.0.1' || /^127(\.\d{1,3}){3}$/.test(h);
}

/**
 * Read and validate the sign-in settings. Throws AuthConfigError with a message
 * for the person starting the server.
 */
export function readAuthSettings(env: Env = process.env): AuthSettings {
  const mode = (value(env, 'LESSONFOLK_AUTH') ?? 'none').toLowerCase();
  if (mode === 'none') return { mode: 'none' };
  if (mode !== 'oauth') {
    throw new AuthConfigError(`LESSONFOLK_AUTH is "${env.LESSONFOLK_AUTH}". Use "none" (no sign-in, one local learner) or "oauth".`);
  }

  const providers: OAuthSettings['providers'] = {};
  for (const id of PROVIDERS) {
    const prefix = id.toUpperCase();
    const clientId = value(env, `${prefix}_CLIENT_ID`);
    const clientSecret = value(env, `${prefix}_CLIENT_SECRET`);
    if (clientId && clientSecret) providers[id] = { clientId, clientSecret };
    else if (clientId || clientSecret) {
      const missing = clientId ? `${prefix}_CLIENT_SECRET` : `${prefix}_CLIENT_ID`;
      throw new AuthConfigError(`${missing} is missing: set both ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET, or neither. See docs/auth-dev.md.`);
    }
  }

  const fakeOAuthURL = readFakeOAuthURL(env);
  if (Object.keys(providers).length === 0 && !fakeOAuthURL) {
    throw new AuthConfigError(
      'LESSONFOLK_AUTH=oauth needs at least one sign-in provider. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, ' +
        'or GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (see docs/auth-dev.md), or use LESSONFOLK_AUTH=none.',
    );
  }

  return { mode: 'oauth', baseURL: readBaseURL(env), secret: readSecret(env), providers, fakeOAuthURL };
}

function readBaseURL(env: Env): string {
  const raw = value(env, 'LESSONFOLK_BASE_URL');
  if (!raw) {
    throw new AuthConfigError(
      'LESSONFOLK_AUTH=oauth needs LESSONFOLK_BASE_URL, the address people open in their browser ' +
        '(e.g. http://localhost:4321). Sign-in callbacks go to <LESSONFOLK_BASE_URL>/api/auth/callback/<provider>.',
    );
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AuthConfigError(`LESSONFOLK_BASE_URL "${raw}" is not a valid URL. Example: http://localhost:4321`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AuthConfigError(`LESSONFOLK_BASE_URL must start with http:// or https:// (got "${raw}").`);
  }
  if (url.protocol === 'http:' && !isLoopback(url.hostname)) {
    throw new AuthConfigError(`LESSONFOLK_BASE_URL must use https:// unless it is localhost (got "${raw}").`);
  }
  if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) {
    throw new AuthConfigError(`LESSONFOLK_BASE_URL must be an origin only, without a path (got "${raw}").`);
  }
  return url.origin;
}

function readSecret(env: Env): string {
  const secret = value(env, 'BETTER_AUTH_SECRET');
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new AuthConfigError(
      `LESSONFOLK_AUTH=oauth needs BETTER_AUTH_SECRET, a random value of at least ${MIN_SECRET_LENGTH} characters ` +
        'that signs session cookies. Generate one with: openssl rand -base64 32',
    );
  }
  return secret;
}

/** The fake provider exists only when NODE_ENV=test and it points at this computer. */
function readFakeOAuthURL(env: Env): string | undefined {
  const raw = value(env, FAKE_OAUTH_ENV);
  if (!raw) return undefined;
  if (env['NODE_ENV'] !== 'test') {
    throw new AuthConfigError(`${FAKE_OAUTH_ENV} is for the automated tests only (NODE_ENV=test). Remove it.`);
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AuthConfigError(`${FAKE_OAUTH_ENV} "${raw}" is not a valid URL.`);
  }
  if (!isLoopback(url.hostname)) throw new AuthConfigError(`${FAKE_OAUTH_ENV} must point at 127.0.0.1 (got "${raw}").`);
  return url.origin;
}

/**
 * The address the server is reachable on, for the `none` check:
 * - LESSONFOLK_BIND when set: the host address the port is published on. docker-compose.yml
 *   sets it from the same variable as its `ports:` mapping, because inside the container the
 *   server has to listen on 0.0.0.0 to be reachable through the mapping at all.
 * - otherwise HOST, the address the Node server listens on (default 127.0.0.1, astro.config.mjs).
 */
export function exposedHost(env: Env = process.env): { host: string; from: 'LESSONFOLK_BIND' | 'HOST' } {
  const bind = value(env, 'LESSONFOLK_BIND');
  if (bind) return { host: bind, from: 'LESSONFOLK_BIND' };
  return { host: value(env, 'HOST') ?? '127.0.0.1', from: 'HOST' };
}

/**
 * Startup safety checks. `none` has no sign-in, so anyone who can reach the server
 * would see and change the learner's data: it only runs on a loopback address.
 */
export function checkStartup(
  settings: AuthSettings,
  exposed: { host: string; from: string } = exposedHost(),
  env: Env = process.env,
): void {
  if (settings.mode === 'none' && !isLoopback(exposed.host)) {
    throw new AuthConfigError(
      `LESSONFOLK_AUTH=none has no sign-in, so it only runs on 127.0.0.1, but the server would be reachable on ` +
        `"${exposed.host}" (from ${exposed.from}). Use 127.0.0.1, or set LESSONFOLK_AUTH=oauth with a sign-in provider ` +
        '(see docs/auth-dev.md).',
    );
  }
  // A public address means a hosted setup (behind a reverse proxy, the listening address says nothing): never without sign-in.
  const baseURL = value(env, 'LESSONFOLK_BASE_URL');
  if (settings.mode === 'none' && baseURL && !isLoopbackURL(baseURL)) {
    throw new AuthConfigError(
      `LESSONFOLK_AUTH=none has no sign-in, but LESSONFOLK_BASE_URL is "${baseURL}", an address other than this computer. ` +
        'Set LESSONFOLK_AUTH=oauth, or remove LESSONFOLK_BASE_URL (see docs/auth-dev.md).',
    );
  }
}

function isLoopbackURL(raw: string): boolean {
  try {
    return isLoopback(new URL(raw).hostname);
  } catch {
    return false;
  }
}

/** Providers the sign-in page offers, in display order. */
export function enabledProviders(settings: OAuthSettings): ProviderId[] {
  const ids: ProviderId[] = PROVIDERS.filter((id) => settings.providers[id]);
  if (settings.fakeOAuthURL) ids.push('fake');
  return ids;
}
