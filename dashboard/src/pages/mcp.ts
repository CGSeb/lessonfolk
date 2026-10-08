import type { APIRoute } from 'astro';
import { getAppMcpEndpoint } from '@lessonfolk/mcp';
import { getAuth } from '../lib/auth/auth';
import { getAuthSettings } from '../lib/auth/current-user';
import { LOCAL_USER } from '../lib/auth/settings';
import { eq } from 'drizzle-orm';
import { user } from '@lessonfolk/db';
import { getDatabase, getProgressStore } from '../lib/store';

export const prerender = false;

/** Whether the account still exists: tokens of a deleted account stop working at once. */
async function userExists(userId: string): Promise<boolean> {
  const rows = await getDatabase().select({ id: user.id }).from(user).where(eq(user.id, userId)).limit(1);
  return rows.length > 0;
}

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
      : getAppMcpEndpoint({ mode: 'oauth', auth: getAuth(), baseURL: settings.baseURL, store, userExists });
  return endpoint(request);
};
