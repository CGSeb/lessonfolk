import type { APIRoute } from 'astro';
import { AUTH_BASE_PATH } from '../../lib/auth/auth';
import { getAuthSettings } from '../../lib/auth/current-user';

export const prerender = false;

/** Parameters Better Auth adds when it signs the authorization request; the authorize endpoint does not want them back. */
const SIGNATURE_PARAMS = ['sig', 'exp', 'ba_iat', 'ba_pl', 'ba_param'];

/**
 * The login page of the MCP authorization flow: an AI chat sent someone who is not signed in
 * here. Send them through the normal sign-in page, then back to the authorization request,
 * which continues to the consent page.
 */
export const GET: APIRoute = ({ url, redirect }) => {
  if (getAuthSettings().mode !== 'oauth') return redirect('/', 303);
  const query = new URLSearchParams(url.search);
  for (const name of SIGNATURE_PARAMS) query.delete(name);
  // They are about to sign in: do not ask the authorize endpoint for another login.
  const prompt = query.get('prompt')?.split(' ').filter((p) => p && p !== 'login');
  if (prompt?.length) query.set('prompt', prompt.join(' '));
  else query.delete('prompt');
  const next = `${AUTH_BASE_PATH}/oauth2/authorize?${query}`;
  return redirect(`/sign-in?next=${encodeURIComponent(next)}`, 303);
};
