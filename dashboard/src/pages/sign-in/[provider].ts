import type { APIRoute } from 'astro';
import { getAuth } from '../../lib/auth/auth';
import { getAuthSettings } from '../../lib/auth/current-user';
import { redirectWithCookies, safeReturnPath } from '../../lib/auth/redirect';
import { enabledProviders, type ProviderId } from '../../lib/auth/settings';

export const prerender = false;

/**
 * Start signing in with a provider: the sign-in page posts its form here (no
 * JavaScript needed). Better Auth stores the OAuth state, then we send the
 * browser to the provider. It comes back to /api/auth/callback/<provider>.
 */
export const POST: APIRoute = async ({ params, request }) => {
  const settings = getAuthSettings();
  if (settings.mode !== 'oauth') return redirectWithCookies('/');

  const provider = params.provider as ProviderId;
  if (!enabledProviders(settings).includes(provider)) {
    return new Response(`Sign-in with "${params.provider}" is not set up on this server.`, { status: 404 });
  }

  const form = await request.formData().catch(() => undefined);
  const next = safeReturnPath(form?.get('next')?.toString());
  const response = await getAuth().api.signInSocial({
    body: { provider, callbackURL: next, errorCallbackURL: '/sign-in', disableRedirect: true },
    headers: request.headers,
    asResponse: true,
  });
  const body = (await response.json().catch(() => ({}))) as { url?: string };
  if (!response.ok || !body.url) return redirectWithCookies('/sign-in?error=sign_in_failed');
  return redirectWithCookies(body.url, response);
};
