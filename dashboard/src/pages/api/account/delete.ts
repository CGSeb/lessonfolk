import type { APIRoute } from 'astro';
import { deleteLearnerData } from '../../../lib/account';
import { getAuth } from '../../../lib/auth/auth';
import { reauthHref, redirectWithCookies } from '../../../lib/auth/redirect';
import { isRecentSignIn } from '../../../lib/personal-data';
import { getDatabase, getProgressStore } from '../../../lib/store';

export const prerender = false;

/**
 * Delete the learner's data, once they typed "delete" (see deleteLearnerData):
 * `oauth` deletes the account and everything in it, then signs out; `none` erases the local
 * learner's progress. Cross-site posts are refused by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { user, authMode } = locals;
  if (!user) return redirectWithCookies('/sign-in?next=%2Faccount');
  // Hosted: deleting needs a recent sign-in; nothing is deleted until the learner signed in again.
  if (!isRecentSignIn(authMode, user.signedInAt)) return redirectWithCookies(reauthHref('/account'));
  const form = await request.formData().catch(() => undefined);
  if (form?.get('confirm')?.toString().trim().toLowerCase() !== 'delete') return redirectWithCookies('/account?error=confirm');

  if (authMode === 'oauth') {
    // Sign out first, for the headers that clear the session cookie; then delete the user.
    const signedOut = await getAuth().api.signOut({ headers: request.headers, asResponse: true });
    await deleteLearnerData('oauth', user.id, getDatabase(), getProgressStore());
    return redirectWithCookies('/account?deleted=1', signedOut);
  }
  await deleteLearnerData('none', user.id, getDatabase(), getProgressStore());
  return redirectWithCookies('/account?erased=1');
};
