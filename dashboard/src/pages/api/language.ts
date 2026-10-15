import type { APIRoute } from 'astro';
import { getAuthSettings } from '../../lib/auth/current-user';
import { safeReturnPath } from '../../lib/auth/redirect';
import { LOCALE_COOKIE, isLocale } from '../../i18n';

export const prerender = false;

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * Save the interface language chosen in the footer switcher (a cookie the middleware reads),
 * then go back to the page it was chosen on. An unknown language changes nothing.
 * Cross-site posts are refused by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData().catch(() => undefined);
  const lang = form?.get('lang')?.toString();
  const next = safeReturnPath(form?.get('next')?.toString());
  if (isLocale(lang)) {
    const settings = getAuthSettings();
    cookies.set(LOCALE_COOKIE, lang, {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      sameSite: 'lax',
      httpOnly: true,
      secure: settings.mode === 'oauth' && new URL(settings.baseURL).protocol === 'https:',
    });
  }
  return redirect(next, 303);
};
