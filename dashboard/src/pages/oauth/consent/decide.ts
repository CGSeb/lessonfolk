import type { APIRoute } from 'astro';
import { AUTH_BASE_PATH, getAuth } from '../../../lib/auth/auth';
import { getAuthSettings } from '../../../lib/auth/current-user';
import { redirectWithCookies } from '../../../lib/auth/redirect';

export const prerender = false;

/**
 * The consent page posts the learner's answer here. Better Auth checks the signed request and
 * the session, then gives the AI app's redirect URI (with a code if allowed, an error if not).
 * Cross-site posts are refused by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const settings = getAuthSettings();
  if (settings.mode !== 'oauth' || !locals.user) return redirectWithCookies('/');
  const form = await request.formData().catch(() => undefined);
  const oauthQuery = form?.get('oauth_query')?.toString();
  if (!oauthQuery) return new Response('Missing authorization request.', { status: 400 });

  // Better Auth's consent endpoint, through its HTTP handler (accepting runs the authorize step,
  // which needs a real request), asking for the redirect URI as JSON.
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
  for (const name of ['cookie', 'origin', 'user-agent']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = await getAuth().handler(
    new Request(`${settings.baseURL}${AUTH_BASE_PATH}/oauth2/consent`, {
      method: 'POST',
      headers,
      // All or nothing: allowing grants exactly what the app asked for.
      body: JSON.stringify({ accept: form?.get('accept') === 'true', oauth_query: oauthQuery }),
    }),
  );
  const result = (await response.json().catch(() => ({}))) as { redirect_uri?: string; url?: string };
  const location = result.redirect_uri ?? result.url;
  if (!response.ok || !location) {
    console.error(`OAuth consent failed (${response.status}):`, result);
    return new Response('This request has expired or is not valid. Go back to your AI app and connect again.', { status: 400 });
  }
  return redirectWithCookies(location, response);
};
