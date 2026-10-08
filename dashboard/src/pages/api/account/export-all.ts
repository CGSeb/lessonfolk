import type { APIRoute } from 'astro';
import { reauthHref, redirectWithCookies } from '../../../lib/auth/redirect';
import { buildPersonalDataExport, isRecentSignIn } from '../../../lib/personal-data';
import { getDatabase } from '../../../lib/store';

export const prerender = false;

/**
 * Everything LessonFolk holds about the signed-in learner, as one JSON download (GDPR access
 * and portability): profile, sign-in accounts, sessions, MCP apps and consents, progress and
 * its history, never any secret. Only for the learner themselves, and with a recent sign-in
 * on the hosted version (otherwise they are sent to sign in again).
 */
export const GET: APIRoute = async ({ locals }) => {
  const { user, authMode } = locals;
  if (!user) return new Response('Sign in to download your data.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  if (!isRecentSignIn(authMode, user.signedInAt)) return redirectWithCookies(reauthHref('/account'));
  const data = await buildPersonalDataExport(getDatabase(), user.id);
  if (!data) return new Response('No data found for this account.', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lessonfolk-my-data.json"',
      'Cache-Control': 'no-store',
    },
  });
};
