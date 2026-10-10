/** A 303 redirect to `location` that keeps the cookies Better Auth set on `from`. */
export function redirectWithCookies(location: string, from?: Response): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const cookie of from?.headers.getSetCookie() ?? []) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

/**
 * A same-site path to go back to after signing in. Anything else (absolute URLs,
 * `//host`, missing) becomes `/`, so the sign-in flow cannot redirect elsewhere.
 */
export function safeReturnPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  // Browsers drop tabs and line breaks inside a URL, so "/<tab>/evil.example" would become "//evil.example".
  // Control characters have no place in a path anyway.
  if (/[\u0000-\u001f\u007f]/.test(next)) return '/';
  return next;
}

/** The sign-in page, coming back to `url` (path and query) afterwards. */
export function signInHref(url: URL): string {
  return `/sign-in?next=${encodeURIComponent(url.pathname + url.search)}`;
}

/** The sign-in page for someone already signed in, to prove it is them again before `next`. */
export function reauthHref(next: string): string {
  return `/sign-in?reauth=1&next=${encodeURIComponent(safeReturnPath(next))}`;
}
