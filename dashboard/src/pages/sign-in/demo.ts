import type { APIRoute } from 'astro';
import { getAuth } from '../../lib/auth/auth';
import { ensureDemoAccount } from '../../lib/auth/demo';
import { getAuthSettings } from '../../lib/auth/current-user';
import { redirectWithCookies, safeReturnPath } from '../../lib/auth/redirect';
import { getDatabase } from '../../lib/store';

export const prerender = false;

/**
 * Sign in to the demo account with its email and password (the plugin directory's reviewers
 * cannot use GitHub or Google). Only when LESSONFOLK_DEMO_EMAIL and LESSONFOLK_DEMO_PASSWORD are
 * set, and only for that one email. Rate limited like the other /sign-in routes.
 */
export const POST: APIRoute = async ({ request }) => {
  const settings = getAuthSettings();
  if (settings.mode !== 'oauth' || !settings.demo) return new Response('Not found', { status: 404 });

  const form = await request.formData().catch(() => undefined);
  const next = safeReturnPath(form?.get('next')?.toString());
  const email = form?.get('email')?.toString().trim().toLowerCase() ?? '';
  const password = form?.get('password')?.toString() ?? '';
  const failed = redirectWithCookies(`/sign-in?error=sign_in_failed&next=${encodeURIComponent(next)}`);
  if (email !== settings.demo.email || !password) return failed;

  const auth = getAuth();
  await ensureDemoAccount(auth, getDatabase(), settings.demo);
  const response = await auth.api.signInEmail({ body: { email, password }, headers: request.headers, asResponse: true });
  if (!response.ok) return failed;
  return redirectWithCookies(next, response);
};
