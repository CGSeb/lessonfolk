/**
 * Which dashboard routes are rate limited and how, plus the size cap on form bodies. The limiter,
 * the caller's address and the 429 answer are shared with the MCP and OAuth endpoints (`@lessonfolk/mcp`).
 */
import type { RateLimitOptions } from '@lessonfolk/mcp';

// ---------------------------------------------------------------------------
// Which routes are limited, and how
// ---------------------------------------------------------------------------

export interface RouteLimit extends RateLimitOptions {
  /** Requests to routes of the same group share one counter per client. */
  group: string;
}

const MINUTE = 60_000;

/**
 * The limit for a request, or `undefined` when it is not limited here. `/mcp` and the OAuth
 * endpoints (`/api/auth/oauth2/*`, `/api/auth/mcp/*`, `/oauth/*`, `/.well-known/*`) have their own limits.
 */
export function routeLimit(method: string, pathname: string): RouteLimit | undefined {
  if (pathname.startsWith('/api/auth/oauth2') || pathname.startsWith('/api/auth/mcp')) return undefined;
  if (pathname.startsWith('/sign-in/') && method === 'POST') return { group: 'sign-in', limit: 10, windowMs: MINUTE };
  if (pathname.startsWith('/api/auth/')) return { group: 'auth', limit: 30, windowMs: MINUTE };
  if (pathname === '/account/import' || pathname.startsWith('/api/account/')) return { group: 'account', limit: 10, windowMs: MINUTE };
  if (pathname.startsWith('/api/')) return { group: 'api', limit: 300, windowMs: MINUTE };
  return undefined;
}

/** Largest request body accepted by the form routes (a progress.json is at most 1 MB, and form encoding adds some). */
export const MAX_FORM_BODY_BYTES = 4 * 1024 * 1024;

/** Routes whose body is read in memory as a form: their size is checked before it is read. */
function hasFormBody(pathname: string): boolean {
  return pathname === '/account/import' || pathname.startsWith('/api/account/') || pathname.startsWith('/sign-in/');
}

/** A 411/413 for a form request that declares no length or too large a body, `undefined` when it may go on. */
export function bodySizeResponse(request: Request, pathname: string): Response | undefined {
  if (request.method !== 'POST' || !hasFormBody(pathname)) return undefined;
  const length = request.headers.get('content-length');
  if (length === null) {
    return request.headers.has('transfer-encoding') ? new Response('Length required', { status: 411 }) : undefined;
  }
  const bytes = Number(length);
  if (!Number.isFinite(bytes) || bytes > MAX_FORM_BODY_BYTES) return new Response('Request body too large', { status: 413 });
  return undefined;
}
