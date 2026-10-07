import type { APIRoute } from 'astro';
import { getAppMcpEndpoint } from '@lessonfolk/mcp';
import { getAuth } from '../lib/auth/auth';
import { getAuthSettings } from '../lib/auth/current-user';
import { LOCAL_USER } from '../lib/auth/settings';
import { getProgressStore } from '../lib/store';

export const prerender = false;

/**
 * The MCP server (Streamable HTTP), packages/mcp. `none`: the local learner, on this computer
 * only (optional LESSONFOLK_MCP_TOKEN). `oauth`: an OAuth access token issued by this app.
 */
export const ALL: APIRoute = ({ request }) => {
  const settings = getAuthSettings();
  const store = getProgressStore();
  const endpoint =
    settings.mode === 'none'
      ? getAppMcpEndpoint({ mode: 'none', userId: LOCAL_USER.id, store })
      : getAppMcpEndpoint({ mode: 'oauth', auth: getAuth(), baseURL: settings.baseURL, store });
  return endpoint(request);
};
