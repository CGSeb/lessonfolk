/**
 * Audience analytics with a self-hosted Umami (docs/privacy.md, "Audience measurement").
 *
 * The tag is off unless UMAMI_WEBSITE_ID is set, so a LessonFolk you run yourself and the
 * development server never measure anything. Where it is on, the script and the collect
 * request go to this site's own address under `/u` (Caddy forwards only those two paths to
 * Umami, see deploy/Caddyfile), which the CSP (`'self'` only) requires.
 */

/** Where the reverse proxy serves Umami's tracker and collect endpoint, under the site's address. */
export const ANALYTICS_PATH = '/u';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AnalyticsTag {
  /** Address of the tracker script. */
  src: string;
  /** Address the tracker sends its events to (it adds `/api/send`). */
  hostUrl: string;
  websiteId: string;
}

/**
 * The tag for a page, or nothing: when UMAMI_WEBSITE_ID is not set (or is not an id), and for the
 * pages that must never be measured. Those are the private pages (`noindex`: sign-in, account,
 * consent), "not found" pages, and every page while a learner is signed in.
 */
export function analyticsTag(
  origin: string,
  page: { noindex: boolean; notFound: boolean; signedIn: boolean },
  env: Record<string, string | undefined> = process.env,
): AnalyticsTag | null {
  const websiteId = env.UMAMI_WEBSITE_ID?.trim();
  if (!websiteId || !UUID.test(websiteId)) return null;
  if (page.noindex || page.notFound || page.signedIn) return null;
  return { src: `${origin}${ANALYTICS_PATH}/script.js`, hostUrl: `${origin}${ANALYTICS_PATH}`, websiteId };
}
