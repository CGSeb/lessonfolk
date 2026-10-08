/**
 * The MCP endpoint of the running app, built once per process from the app's progress store,
 * the courses folder and the gate of the auth mode. The dashboard's `/mcp` route only calls
 * `getAppMcpEndpoint(...)` with its shared store.
 */
import { getCoursesDir, type ProgressStore } from '@lessonfolk/core';
import { createMcpEndpoint, localGate, type McpEndpoint } from './endpoint.ts';
import { oauthGate, type McpAuthServer } from './oauth.ts';

export type AppMcpSettings = { store: ProgressStore } & (
  | { mode: 'none'; userId: string }
  | { mode: 'oauth'; auth: McpAuthServer; baseURL: string; userExists?: (userId: string) => Promise<boolean> }
);

/** Optional static token for `LESSONFOLK_AUTH=none`. */
export const MCP_TOKEN_ENV = 'LESSONFOLK_MCP_TOKEN';

let endpoint: McpEndpoint | undefined;

/** The endpoint for this process, created on first use. */
export function getAppMcpEndpoint(settings: AppMcpSettings, env: NodeJS.ProcessEnv = process.env): McpEndpoint {
  if (endpoint) return endpoint;
  const gate =
    settings.mode === 'none'
      ? localGate({ userId: settings.userId, token: env[MCP_TOKEN_ENV]?.trim() || undefined })
      : oauthGate(settings.auth, settings.baseURL, settings.userExists);
  endpoint = createMcpEndpoint({ store: settings.store, gate, coursesDir: getCoursesDir() });
  return endpoint;
}
