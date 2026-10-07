/**
 * What the "Connect your AI chat" page (/connect) shows: this instance's MCP URL and whether
 * web chats (claude.ai, ChatGPT), which connect from their provider's servers, can reach it.
 */
import { isLoopback, type AuthSettings } from './auth/settings.ts';

export interface McpConnection {
  /** The MCP endpoint, e.g. `http://127.0.0.1:4321/mcp`. */
  url: string;
  mode: AuthSettings['mode'];
  /** `none` mode with LESSONFOLK_MCP_TOKEN set: chats must send `Authorization: Bearer <token>`. */
  tokenRequired: boolean;
  /**
   * Web chats connect from their provider's cloud, not from this computer: they need a public
   * `https://` address. False for localhost, and always false in `none` mode.
   */
  reachableFromWeb: boolean;
}

/**
 * - `oauth`: `<LESSONFOLK_BASE_URL>/mcp`, the address the OAuth tokens are bound to.
 * - `none`: the address this page was opened on (127.0.0.1 or localhost and the port), since
 *   `/mcp` only answers this computer anyway.
 */
export function mcpConnection(settings: AuthSettings, pageUrl: URL, env: Record<string, string | undefined> = process.env): McpConnection {
  if (settings.mode === 'oauth') {
    const url = new URL('/mcp', settings.baseURL);
    return { url: url.href, mode: 'oauth', tokenRequired: false, reachableFromWeb: url.protocol === 'https:' && !isLoopback(url.hostname) };
  }
  return {
    url: new URL('/mcp', pageUrl.origin).href,
    mode: 'none',
    tokenRequired: Boolean(env.LESSONFOLK_MCP_TOKEN?.trim()),
    reachableFromWeb: false,
  };
}
