import type { APIContext, APIRoute } from 'astro';
import { getAppMcpEndpoint, type TokenCheck } from '@lessonfolk/mcp';
import { getAuth } from '../lib/auth/auth';
import { getAuthSettings } from '../lib/auth/current-user';
import { LOCAL_USER } from '../lib/auth/settings';
import { isTokenAllowed } from '../lib/connected-apps';
import { getDatabase, getProgressStore } from '../lib/store';

export const prerender = false;

/** Tokens of a deleted account or a disconnected app stop working at once (src/lib/connected-apps.ts). */
const tokenAllowed: TokenCheck = (token) => isTokenAllowed(getDatabase(), token);

/** Astro's `clientAddress` throws when the server cannot tell the caller's address. */
function socketAddress(context: APIContext): string | undefined {
  try {
    return context.clientAddress;
  } catch {
    return undefined;
  }
}

/**
 * The MCP server (Streamable HTTP), packages/mcp. `none`: the local learner, on this computer
 * only (optional LESSONFOLK_MCP_TOKEN). `oauth`: an OAuth access token issued by this app.
 */
export const ALL: APIRoute = (context) => {
  const settings = getAuthSettings();
  const store = getProgressStore();
  const endpoint =
    settings.mode === 'none'
      ? getAppMcpEndpoint({ mode: 'none', userId: LOCAL_USER.id, store })
      : getAppMcpEndpoint({ mode: 'oauth', auth: getAuth(), baseURL: settings.baseURL, store, tokenAllowed });
  return endpoint(context.request, { clientAddress: socketAddress(context) });
};
