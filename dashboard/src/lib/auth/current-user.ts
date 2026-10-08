import { getAuth } from './auth.ts';
import { checkStartup, LOCAL_USER, readAuthSettings, type AuthSettings } from './settings.ts';

/** The person using the dashboard, exposed to pages and API routes as `Astro.locals.user`. */
export interface CurrentUser {
  /** Stable user id: progress belongs to it. `local` in LESSONFOLK_AUTH=none. */
  id: string;
  name: string;
  email: string;
  image: string | null;
  /** When this session started, i.e. the last sign-in (`null` without sign-in). */
  signedInAt: Date | null;
}

export const LOCAL_CURRENT_USER: CurrentUser = { ...LOCAL_USER, image: null, signedInAt: null };

let settings: AuthSettings | undefined;

/**
 * The sign-in settings, read once. Also repeats the startup checks, in case the
 * built server was started without scripts/serve.ts: then every request fails
 * with the same message instead of serving an unprotected dashboard.
 */
export function getAuthSettings(): AuthSettings {
  if (!settings) {
    const read = readAuthSettings();
    // In `astro dev` the address comes from the dev server, checked in astro.config.mjs.
    if (import.meta.env.PROD) checkStartup(read);
    settings = read;
  }
  return settings;
}

/** The signed-in user for this request (always the local learner in `none` mode). */
export async function getCurrentUser(request: Request, auth: AuthSettings = getAuthSettings()): Promise<CurrentUser | null> {
  if (auth.mode === 'none') return LOCAL_CURRENT_USER;
  const result = await getAuth().api.getSession({ headers: request.headers });
  if (!result) return null;
  const { id, name, email, image } = result.user;
  return { id, name, email, image: image ?? null, signedInAt: new Date(result.session.createdAt) };
}

