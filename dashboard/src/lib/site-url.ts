import { getAuthSettings } from './auth/current-user';

/**
 * Public address of the site, without a trailing slash: LESSONFOLK_BASE_URL when people
 * sign in, otherwise the address of the request.
 */
export function siteOrigin(requestUrl: URL): string {
  const settings = getAuthSettings();
  return settings.mode === 'oauth' ? settings.baseURL : requestUrl.origin;
}
