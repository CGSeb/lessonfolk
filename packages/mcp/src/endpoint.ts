/**
 * The HTTP face of the MCP server (Streamable HTTP, mounted at `/mcp`): an auth gate finds
 * the user, then the official SDK handler serves the request with a server bound to them.
 *
 * Serving is stateless (one server per request): the 2026-07-28 protocol needs nothing more,
 * and 2025-era clients (`initialize` handshake, which most AI chats still use) are served by
 * the SDK's stateless fallback.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { ProgressStore } from '@lessonfolk/core';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { DEFAULT_WRITE_LIMIT, createRateLimiter, type RateLimitOptions } from './rate-limit.ts';
import { createLessonfolkServer } from './server.ts';

/** Who is calling: from the access token (oauth) or the auth mode (none). Never from a tool argument. */
export interface McpIdentity {
  userId: string;
  /** Kept in the progress change log. */
  client?: string;
}

/**
 * Checks a request and either answers it (401, 403…) or calls `next` with the caller's identity.
 */
export type McpGate = (request: Request, next: (identity: McpIdentity) => Promise<Response>) => Promise<Response>;

export interface McpEndpointOptions {
  store: ProgressStore;
  gate: McpGate;
  /** The courses folder (`getCoursesDir()`). */
  coursesDir: string;
  writeLimit?: RateLimitOptions;
}

export type McpEndpoint = (request: Request) => Promise<Response>;

export function createMcpEndpoint({ store, gate, coursesDir, writeLimit = DEFAULT_WRITE_LIMIT }: McpEndpointOptions): McpEndpoint {
  const writeLimiter = createRateLimiter(writeLimit);
  const handler = createMcpHandler(
    ({ authInfo }) => {
      const identity = authInfo?.extra?.identity as McpIdentity | undefined;
      // Unreachable through the endpoint: every request passes the gate first.
      if (!identity) throw new Error('MCP request without an identity.');
      return createLessonfolkServer({ userId: identity.userId, client: identity.client, store, coursesDir, writeLimiter });
    },
    { onerror: (error) => console.error('LessonFolk MCP:', error.message) },
  );
  return (request) =>
    gate(request, (identity) =>
      handler.fetch(request, { authInfo: { token: '', clientId: identity.client ?? 'mcp', scopes: [], extra: { identity } } }),
    );
}

// ---------------------------------------------------------------------------
// LESSONFOLK_AUTH=none: the local learner, on this computer only
// ---------------------------------------------------------------------------

const isLoopbackHost = (host: string) => {
  const h = host.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
  return h === 'localhost' || h === '::1' || /^127(\.\d{1,3}){3}$/.test(h);
};

function hostname(value: string): string | undefined {
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).hostname;
  } catch {
    return undefined;
  }
}

const digest = (text: string) => createHash('sha256').update(text).digest();

const jsonError = (status: number, message: string, headers: Record<string, string> = {}) =>
  Response.json({ error: message }, { status, headers });

export interface LocalGateOptions {
  /** The single learner's user id (`local`). */
  userId: string;
  /** LESSONFOLK_MCP_TOKEN: when set, requests need `Authorization: Bearer <token>`. */
  token?: string;
}

/**
 * The gate of `LESSONFOLK_AUTH=none`. The server itself only runs on 127.0.0.1 (startup
 * check); this gate also refuses requests whose Host or Origin is not this computer, so a web
 * page cannot reach the endpoint through DNS rebinding. With a token set, it is required.
 */
export function localGate({ userId, token }: LocalGateOptions): McpGate {
  const expected = token ? digest(token) : undefined;
  return async (request, next) => {
    const host = hostname(request.headers.get('host') ?? new URL(request.url).host);
    if (!host || !isLoopbackHost(host)) return jsonError(403, 'This MCP server only accepts requests to localhost or 127.0.0.1.');
    const origin = request.headers.get('origin');
    if (origin && origin !== 'null' && !isLoopbackHost(hostname(origin) ?? '')) {
      return jsonError(403, 'Requests from web pages on other sites are refused.');
    }
    if (expected) {
      const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '');
      if (!match || !timingSafeEqual(digest(match[1].trim()), expected)) {
        return jsonError(401, 'This MCP server needs the token set in LESSONFOLK_MCP_TOKEN: send it as "Authorization: Bearer <token>".', {
          'WWW-Authenticate': 'Bearer realm="lessonfolk"',
        });
      }
    }
    return next({ userId, client: 'mcp' });
  };
}
