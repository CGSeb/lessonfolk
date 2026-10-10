/**
 * Refuse cross-site form posts (CSRF), like Astro's `security.checkOrigin`, which is turned off
 * in astro.config.mjs because it cannot spare a route: MCP clients (Claude Code, Codex…) post
 * forms to the OAuth token endpoints without an Origin header. Those endpoints do not use the
 * session cookie (the client proves itself with PKCE or its credentials), so CSRF does not apply.
 */
import { AUTH_BASE_PATH } from './auth';
import { isLoopback } from './settings';

/** OAuth endpoints that apps call directly (not browsers), with form bodies. */
const APP_FORM_ENDPOINTS = new Set(['token', 'revoke', 'introspect'].map((name) => `${AUTH_BASE_PATH}/oauth2/${name}`));

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const FORM_CONTENT_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];

/**
 * A 403 for a cross-site form post, or `undefined` when the request may go on. Same rules as
 * Astro's check, plus `publicOrigin`: the address people open in their browser
 * (LESSONFOLK_BASE_URL). Behind a reverse proxy that ends HTTPS, the server sees `http://`
 * while the browser sends `Origin: https://…`, so `url.origin` alone would refuse every form.
 */
export function crossSiteFormResponse(request: Request, url: URL, publicOrigin?: string): Response | undefined {
  if (SAFE_METHODS.has(request.method) || APP_FORM_ENDPOINTS.has(url.pathname)) return undefined;
  const origin = request.headers.get('origin');
  const sameOrigin = origin === url.origin || (publicOrigin !== undefined && origin === publicOrigin);
  const contentType = request.headers.get('content-type')?.toLowerCase();
  const forbidden = contentType ? FORM_CONTENT_TYPES.some((type) => contentType.includes(type)) && !sameOrigin : !sameOrigin;
  return forbidden ? new Response(`Cross-site ${request.method} form submissions are forbidden`, { status: 403 }) : undefined;
}

/**
 * Without sign-in (`LESSONFOLK_AUTH=none`) the dashboard is protected only by listening on this
 * computer. A web page could still reach it through DNS rebinding (its own domain made to resolve
 * to 127.0.0.1) and read the learner's data, or a reverse proxy could expose it. Both send a
 * `Host` that is not this computer: refuse it with a 403.
 */
export function foreignHostResponse(request: Request): Response | undefined {
  const host = request.headers.get('host');
  if (host) {
    try {
      const { hostname } = new URL(`http://${host}`);
      if (isLoopback(hostname) || hostname.endsWith('.localhost')) return undefined;
    } catch {
      // not a valid host: refused below
    }
  }
  return new Response('LESSONFOLK_AUTH=none only answers on 127.0.0.1 or localhost.', { status: 403 });
}
