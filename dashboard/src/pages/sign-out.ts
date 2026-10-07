import type { APIRoute } from 'astro';
import { getAuth } from '../lib/auth/auth';
import { redirectWithCookies } from '../lib/auth/redirect';

export const prerender = false;

/** Sign out (the header's "Sign out" button posts here), then go home. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.authMode !== 'oauth' || !locals.user) return redirectWithCookies('/');
  const response = await getAuth().api.signOut({ headers: request.headers, asResponse: true });
  return redirectWithCookies('/', response);
};
