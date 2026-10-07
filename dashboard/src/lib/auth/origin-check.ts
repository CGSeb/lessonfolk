/**
 * Refuse cross-site form posts (CSRF), like Astro's `security.checkOrigin`, which is turned off
 * in astro.config.mjs because it cannot spare a route: MCP clients (Claude Code, Codex…) post
 * forms to the OAuth token endpoints without an Origin header. Those endpoints do not use the
 * session cookie (the client proves itself with PKCE or its credentials), so CSRF does not apply.
 */
import { AUTH_BASE_PATH } from './auth';

/** OAuth endpoints that apps call directly (not browsers), with form bodies. */
const APP_FORM_ENDPOINTS = new Set(['token', 'revoke', 'introspect'].map((name) => `${AUTH_BASE_PATH}/oauth2/${name}`));

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORM_CONTENT_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];

/** A 403 for a cross-site form post, or `undefined` when the request may go on. Same rules as Astro's check. */
export function crossSiteFormResponse(request: Request, url: URL): Response | undefined {
  if (SAFE_METHODS.has(request.method) || APP_FORM_ENDPOINTS.has(url.pathname)) return undefined;
  const sameOrigin = request.headers.get('origin') === url.origin;
  const contentType = request.headers.get('content-type')?.toLowerCase();
  const forbidden = contentType ? FORM_CONTENT_TYPES.some((type) => contentType.includes(type)) && !sameOrigin : !sameOrigin;
  return forbidden ? new Response(`Cross-site ${request.method} form submissions are forbidden`, { status: 403 }) : undefined;
}
