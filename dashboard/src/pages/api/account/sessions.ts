import type { APIRoute } from 'astro';
import { getAuth } from '../../../lib/auth/auth';
import { redirectWithCookies } from '../../../lib/auth/redirect';
import { revokeBrowserSession, revokeBrowserSessions } from '../../../lib/auth/sessions';
import { getDatabase } from '../../../lib/store';

export const prerender = false;

/**
 * Browser sessions of the signed-in learner (the section of the Account page, see
 * src/components/account/BrowserSessions.astro). Form field `action`:
 *   revoke  with `id`  signs one other browser out (never another learner's session)
 *   others             signs out every browser but this one
 *   all                signs out everywhere, this browser included
 * Cross-site posts are refused by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user, authMode } = locals;
  if (authMode !== 'oauth') return redirectWithCookies('/account');
  if (!user) return redirectWithCookies('/sign-in?next=%2Faccount');
  const form = await request.formData().catch(() => undefined);
  const action = form?.get('action')?.toString();
  const db = getDatabase();

  if (action === 'revoke') {
    const id = form?.get('id')?.toString() ?? '';
    // This browser is signed out with the "Sign out" button; ending it here would leave the page without a session.
    if (!id || id === user.sessionId) return redirectWithCookies('/account?sessions=error');
    const revoked = await revokeBrowserSession(db, user.id, id);
    return redirectWithCookies(revoked ? '/account?sessions=revoked' : '/account?sessions=error');
  }
  if (action === 'others') {
    await revokeBrowserSessions(db, user.id, user.sessionId);
    return redirectWithCookies('/account?sessions=others');
  }
  if (action === 'all') {
    // Delete every row, then sign out for the headers that clear this browser's cookie.
    await revokeBrowserSessions(db, user.id);
    const signedOut = await getAuth().api.signOut({ headers: request.headers, asResponse: true }).catch(() => undefined);
    return redirectWithCookies('/', signedOut);
  }
  return redirectWithCookies('/account?sessions=error');
};
