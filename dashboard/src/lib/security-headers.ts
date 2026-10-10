/**
 * Security headers sent with every response (set in src/middleware.ts).
 *
 * The CSP has no `'unsafe-inline'` for scripts and none for `<style>` elements. Astro's CSP support
 * (`security.csp` in astro.config.mjs) hashes the scripts and styles it inlines and adds the
 * `script-src` and `style-src` directives to each page's own CSP header, together with the
 * directives below. The theme script is a file (public/theme-init.js), not an inline script.
 * Only inline `style="…"` attributes (layout variables such as `--stack-space`) stay allowed,
 * through `style-src-attr`: they cannot run code. There is no `form-action` on purpose: browsers
 * also apply it to the redirects after a form post, which would block the sign-in redirect to the
 * provider (cross-site form posts are refused by src/lib/auth/origin-check.ts instead).
 */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
] as const;

/** Inline `style` attributes, the only inline code the CSP allows. */
export const STYLE_ATTRIBUTE_SOURCE = "'unsafe-inline'";

/**
 * The CSP of responses Astro adds none to (API routes, redirects, errors). Pages get Astro's
 * CSP instead, which has the same directives plus the hashes of their scripts and styles.
 */
export const CONTENT_SECURITY_POLICY = [
  ...CSP_DIRECTIVES,
  "script-src 'self'",
  "style-src 'self'",
  `style-src-attr ${STYLE_ATTRIBUTE_SOURCE}`,
].join('; ');

/** One year; browsers only honour it over HTTPS. */
const HSTS = 'max-age=31536000; includeSubDomains';

/**
 * Headers for a response. `https` is true when people reach the site over HTTPS (the public
 * address starts with `https://`): HSTS is only sent then, so a local `http://` run is never pinned.
 */
export function securityHeaders(https: boolean): Record<string, string> {
  return {
    'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    ...(https ? { 'Strict-Transport-Security': HSTS } : {}),
  };
}

/** A copy of `response` with the security headers added; headers a route already set are kept. */
export function withSecurityHeaders(response: Response, https: boolean): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders(https))) if (!headers.has(name)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
