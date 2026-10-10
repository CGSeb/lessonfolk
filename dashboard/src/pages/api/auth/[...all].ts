import type { APIContext, APIRoute } from 'astro';
import { createOAuthLimits } from '@lessonfolk/mcp';
import { getAuth } from '../../../lib/auth/auth';

export const prerender = false;

// Rate limits and a size cap for the OAuth endpoints (registration, token…), packages/mcp.
const oauthLimits = createOAuthLimits();

/** Astro's `clientAddress` throws when the server cannot tell the caller's address. */
function socketAddress(context: APIContext): string | undefined {
  try {
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

/** Better Auth's routes: OAuth callbacks, session, sign-out… (LESSONFOLK_AUTH=oauth only). */
export const ALL: APIRoute = async (context) => {
  if (context.locals.authMode !== 'oauth') return Response.json({ error: 'Sign-in is off (LESSONFOLK_AUTH=none).' }, { status: 404 });
  const limited = await oauthLimits(context.request, { clientAddress: socketAddress(context) });
  if (limited instanceof Response) return limited;
  return getAuth().handler(limited);
};
