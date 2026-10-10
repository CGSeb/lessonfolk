/**
 * Security headers sent with every response (set in src/middleware.ts).
 *
 * The CSP allows inline scripts and styles because Astro inlines its small page scripts and the
 * theme script runs before first paint; everything else is limited to this site. There is no
 * `form-action` on purpose: browsers also apply it to the redirects after a form post, which
 * would block the sign-in redirect to the provider (cross-site form posts are refused by
 * src/lib/auth/origin-check.ts instead).
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
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
