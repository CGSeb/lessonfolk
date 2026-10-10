/**
 * LESSONFOLK_AUTH=oauth: the app is the OAuth 2.1 authorization server of its own MCP
 * endpoint, with Better Auth (`jwt()` + `@better-auth/mcp`), as the MCP authorization spec
 * asks: protected resource metadata (RFC 9728), authorization server metadata (RFC 8414),
 * dynamic client registration (RFC 7591), PKCE, and access tokens bound to `<base URL>/mcp`
 * (RFC 8707) that the endpoint checks against the server's own signing keys.
 */
import { mcp, requireMcpAuth } from '@better-auth/mcp';
import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider';
import { createAuthMiddleware } from 'better-auth/api';
import { jwt } from 'better-auth/plugins';
import type { BetterAuthPlugin } from 'better-auth/types';
import type { McpGate } from './endpoint.ts';

export { mcpAuthSchema } from '@lessonfolk/db';
/** Checks the signature and expiry of the authorization request Better Auth hands to the consent page. */
export { verifyOAuthQueryParams } from '@better-auth/oauth-provider';

/**
 * The authorization server metadata at the root well-known paths too. The issuer is
 * `<base URL>/api/auth`, so RFC 8414 puts it at `/.well-known/oauth-authorization-server/api/auth`
 * (served by Better Auth), but some MCP clients only look at the root.
 */
export function rootDiscoveryHandler(auth: Parameters<typeof oauthProviderAuthServerMetadata>[0] & Parameters<typeof oauthProviderOpenIdConfigMetadata>[0]) {
  const authorizationServer = oauthProviderAuthServerMetadata(auth);
  const openIdConfiguration = oauthProviderOpenIdConfigMetadata(auth);
  return (request: Request): Promise<Response> | undefined => {
    const path = new URL(request.url).pathname.replace(/\/$/, '');
    if (path === '/.well-known/oauth-authorization-server') return authorizationServer(request);
    if (path === '/.well-known/openid-configuration') return openIdConfiguration(request);
    return undefined;
  };
}

/** Where the MCP endpoint is mounted. */
export const MCP_PATH = '/mcp';
/** Where the authorization flow sends people to sign in, and to approve a client (dashboard routes). */
export const OAUTH_SIGN_IN_PATH = '/oauth/sign-in';
export const OAUTH_CONSENT_PATH = '/oauth/consent';

/** The MCP endpoint URL, which is also the resource identifier tokens are bound to. */
export function mcpResource(baseURL: string): string {
  return `${baseURL.replace(/\/$/, '')}${MCP_PATH}`;
}

/**
 * The Better Auth plugins that make the app an MCP authorization server.
 *
 * Dynamic client registration is on, and open (no initial token): MCP clients such as Claude
 * Code and Codex register themselves the first time they connect, and do not support Client ID
 * Metadata Documents everywhere yet. Registering gives a client nothing by itself: every
 * authorization needs a signed-in user who approves that client on the consent page, PKCE is
 * required, redirect URIs must match what was registered, and tokens only work for this MCP
 * endpoint.
 */
export function mcpAuthPlugins(baseURL: string, options: { purgeUnusedClients?: () => Promise<unknown> } = {}) {
  return [
    nativeLoopbackClients(),
    ...(options.purgeUnusedClients ? [unusedClientCleanup(options.purgeUnusedClients)] : []),
    jwt(),
    mcp({
      resource: mcpResource(baseURL),
      loginPage: OAUTH_SIGN_IN_PATH,
      consentPage: OAUTH_CONSENT_PATH,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
    }),
  ];
}

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Open registration lets anyone add clients, so clean up as it is used: after a registration,
 * at most once an hour, `purge` deletes the clients nobody ever allowed (see
 * `purgeUnusedOAuthClients` in @lessonfolk/db). A failed cleanup never fails the registration.
 */
function unusedClientCleanup(purge: () => Promise<unknown>, intervalMs = CLEANUP_INTERVAL_MS) {
  let last = 0;
  return {
    id: 'lessonfolk-unused-client-cleanup',
    hooks: {
      after: [
        {
          matcher: (ctx: { path?: string }) => ctx.path === '/oauth2/register',
          handler: createAuthMiddleware(async () => {
            const now = Date.now();
            if (now - last < intervalMs) return;
            last = now;
            try {
              await purge();
            } catch {
              last = 0; // try again at the next registration
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}

/** True when the host is a loopback address, where CLI and desktop apps listen for their callback. */
export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
}

const LOOPBACK_HTTP = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//i;

/** True when every redirect URI is an http loopback address (RFC 8252 §7.3), as CLI and desktop apps register. */
export function isLoopbackRedirectOnly(uris: unknown): boolean {
  return Array.isArray(uris) && uris.length > 0 && uris.every((uri) => typeof uri === 'string' && LOOPBACK_HTTP.test(uri));
}

/**
 * Dynamic registration treats a client that does not say its `application_type` as a web app,
 * and web apps may not use http loopback redirect URIs. CLI and desktop MCP clients (Claude
 * Code, Codex) register `http://localhost:<port>/callback` without an application type: they
 * are native apps (RFC 8252), so register them as such. Nothing else changes.
 */
function nativeLoopbackClients() {
  return {
    id: 'lessonfolk-native-loopback-clients',
    hooks: {
      before: [
        {
          matcher: (ctx: { path?: string }) => ctx.path === '/oauth2/register',
          handler: createAuthMiddleware(async (ctx) => {
            const body = ctx.body as Record<string, unknown> | undefined;
            if (!body || body.application_type !== undefined || !isLoopbackRedirectOnly(body.redirect_uris)) return;
            return { context: { body: { ...body, application_type: 'native' } } };
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}

/** What `requireMcpAuth` needs from the Better Auth instance. */
export type McpAuthServer = Parameters<typeof requireMcpAuth>[0];

/**
 * The gate of `LESSONFOLK_AUTH=oauth`: a valid access token for this endpoint (signature,
 * issuer, audience, expiry), else a 401 whose `WWW-Authenticate` header points to the
 * protected resource metadata, so the client can start the OAuth flow. The user id is the
 * token's subject; with `userExists`, a token of a deleted account is refused at once.
 */
export function oauthGate(auth: McpAuthServer, baseURL: string, userExists?: (userId: string) => Promise<boolean>): McpGate {
  return (request, next) =>
    requireMcpAuth(
      auth,
      async (verified, claims) => {
        if (typeof claims.sub !== 'string' || !claims.sub) {
          return Response.json({ error: 'invalid_token', error_description: 'The token has no user.' }, { status: 401 });
        }
        // Access tokens are signed JWTs, valid until they expire: refuse those of a deleted account.
        if (userExists && !(await userExists(claims.sub))) {
          return Response.json({ error: 'invalid_token', error_description: 'This account no longer exists.' }, { status: 401 });
        }
        const clientId = typeof claims.azp === 'string' ? claims.azp : typeof claims.client_id === 'string' ? claims.client_id : undefined;
        return next({ userId: claims.sub, client: clientId ? `mcp:${clientId}` : 'mcp' });
      },
      { resource: mcpResource(baseURL) },
    )(request);
}
