import type { APIRoute } from 'astro';
import { redirectWithCookies } from '../../../lib/auth/redirect';
import { disconnectApp } from '../../../lib/connected-apps';
import { getDatabase } from '../../../lib/store';

export const prerender = false;

/**
 * Disconnect an AI app from the signed-in learner's account: its consent, refresh tokens and
 * access tokens go (see disconnectApp), so /mcp refuses it at once. Only the learner's own
 * apps can be disconnected. Cross-site posts are refused by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user, authMode } = locals;
  if (!user || authMode !== 'oauth') return redirectWithCookies('/sign-in?next=%2Faccount');
  const form = await request.formData().catch(() => undefined);
  const consentId = form?.get('consent')?.toString() ?? '';
  const done = consentId !== '' && (await disconnectApp(getDatabase(), user.id, consentId));
  return redirectWithCookies(done ? '/account?disconnected=1' : '/account?error=app');
};
