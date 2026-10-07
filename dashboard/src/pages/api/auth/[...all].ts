import type { APIRoute } from 'astro';
import { getAuth } from '../../../lib/auth/auth';

export const prerender = false;

/** Better Auth's routes: OAuth callbacks, session, sign-out… (LESSONFOLK_AUTH=oauth only). */
export const ALL: APIRoute = ({ request, locals }) => {
  if (locals.authMode !== 'oauth') return Response.json({ error: 'Sign-in is off (LESSONFOLK_AUTH=none).' }, { status: 404 });
  return getAuth().handler(request);
};
