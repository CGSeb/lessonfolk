import { defineMiddleware } from 'astro:middleware';
import { AUTH_BASE_PATH } from './lib/auth/auth';
import { getAuthSettings, getCurrentUser } from './lib/auth/current-user';
import { crossSiteFormResponse } from './lib/auth/origin-check';
import { isPrivatePath } from './lib/seo';

// Crawler files: no session needed.
const CRAWLER_FILES = new Set(['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']);

/**
 * Sets `locals.authMode` and `locals.user` (the current user, `null` when signed
 * out) for every page and API route. Better Auth's own routes read the session
 * themselves.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // MCP: cross-site form posts are refused here (lib/auth/origin-check.ts), and /mcp and
  // OAuth discovery authenticate with tokens, not the session.
  const settings = getAuthSettings();
  const publicOrigin = settings.mode === 'oauth' ? new URL(settings.baseURL).origin : undefined;
  const forbidden = crossSiteFormResponse(context.request, context.url, publicOrigin);
  if (forbidden) return forbidden;
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
});
