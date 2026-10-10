import { defineMiddleware } from 'astro:middleware';
import type { MiddlewareHandler } from 'astro';
import { AUTH_BASE_PATH } from './lib/auth/auth';
import { getAuthSettings, getCurrentUser } from './lib/auth/current-user';
import { crossSiteFormResponse, foreignHostResponse } from './lib/auth/origin-check';
import { createRateLimiter, limitRequest, callerAddress, type RateLimiter } from '@lessonfolk/mcp';
import { bodySizeResponse, routeLimit } from './lib/rate-limit';
import { isPrivatePath } from './lib/seo';
import { withSecurityHeaders } from './lib/security-headers';

// Crawler files: no session needed.
const CRAWLER_FILES = new Set(['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']);

// One limiter per route group (sign-in, account, auth, api), keyed by the caller's address.
const limiters = new Map<string, RateLimiter>();
function limiterFor(group: string, limit: number, windowMs: number): RateLimiter {
  let limiter = limiters.get(group);
  if (!limiter) limiters.set(group, (limiter = createRateLimiter({ limit, windowMs })));
  return limiter;
}
// Rate limits are off in the test suite (many requests from one address); a test turns them on with LESSONFOLK_RATE_LIMIT=on.
const rateLimitOn = () => (process.env.LESSONFOLK_RATE_LIMIT ?? (process.env.NODE_ENV === 'test' ? 'off' : 'on')) !== 'off';

function connectionAddress(context: { clientAddress: string }): string | undefined {
  try {
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

/** Security headers on every response, and the size and rate limits of the form and API routes. */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const tooLarge = bodySizeResponse(context.request, pathname);
  const rule = rateLimitOn() ? routeLimit(context.request.method, pathname) : undefined;
  const tooMany = rule && limitRequest(limiterFor(rule.group, rule.limit, rule.windowMs), callerAddress(context.request, { clientAddress: connectionAddress(context) }));
  const early = tooLarge ?? tooMany;
  const response = early ?? ((await handle(context, next)) as Response);
  const settings = getAuthSettings();
  const https = settings.mode === 'oauth' && new URL(settings.baseURL).protocol === 'https:';
  return withSecurityHeaders(response, https);
});

/**
 * Sets `locals.authMode` and `locals.user` (the current user, `null` when signed
 * out) for every page and API route. Better Auth's own routes read the session
 * themselves.
 */
const handle: MiddlewareHandler = async (context, next) => {
  // MCP: cross-site form posts are refused here (lib/auth/origin-check.ts), and /mcp and
  // OAuth discovery authenticate with tokens, not the session.
  const settings = getAuthSettings();
  const publicOrigin = settings.mode === 'oauth' ? new URL(settings.baseURL).origin : undefined;
  const forbidden = crossSiteFormResponse(context.request, context.url, publicOrigin);
  if (forbidden) return forbidden;
  // No sign-in: only answer as 127.0.0.1 or localhost (DNS rebinding, reverse proxies).
  if (settings.mode === 'none') {
    const foreign = foreignHostResponse(context.request);
    if (foreign) return foreign;
  }
  if (context.url.pathname === '/mcp' || context.url.pathname.startsWith('/.well-known/')) return next();
  if (CRAWLER_FILES.has(context.url.pathname)) return next();
  context.locals.authMode = settings.mode;
  const path = context.url.pathname;
  context.locals.user = path.startsWith(`${AUTH_BASE_PATH}/`) ? null : await getCurrentUser(context.request, settings);
  const response = await next();
  // Keep signed-in pages and API routes out of search results, even when linked from elsewhere.
  if (isPrivatePath(path)) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  return response;
};
