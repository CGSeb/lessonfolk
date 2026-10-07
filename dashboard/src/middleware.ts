import { defineMiddleware } from 'astro:middleware';
import { AUTH_BASE_PATH } from './lib/auth/auth';
import { getAuthSettings, getCurrentUser } from './lib/auth/current-user';

/**
 * Sets `locals.authMode` and `locals.user` (the current user, `null` when signed
 * out) for every page and API route. Better Auth's own routes read the session
 * themselves.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const settings = getAuthSettings();
  context.locals.authMode = settings.mode;
  const path = context.url.pathname;
  context.locals.user = path.startsWith(`${AUTH_BASE_PATH}/`) ? null : await getCurrentUser(context.request, settings);
  return next();
});
