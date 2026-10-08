/**
 * The MCP endpoint with LESSONFOLK_AUTH=none: the built server, Postgres and the official MCP
 * client. Open on 127.0.0.1 for the local learner, or with the LESSONFOLK_MCP_TOKEN token.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { callJson, connectMcp } from './mcp-client';
import { startDashboard, type DashboardServer } from './server';

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb?.drop();
});

const jsonRpc = (origin: string, headers: Record<string, string> = {}) =>
  fetch(`${origin}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });

describe('MCP with LESSONFOLK_AUTH=none, no token', () => {
  let server: DashboardServer;
  beforeAll(async () => {
    server = await startDashboard({ DATABASE_URL: testDb.url });
  });
  afterAll(() => server?.stop());

  it('serves the tools to the local learner', async () => {
    const client = await connectMcp(server.url);
    try {
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name)).toEqual(expect.arrayContaining(['get_progress', 'start_lesson', 'complete_lesson']));
      expect(await callJson(client, 'get_progress')).toMatchObject({ profile: {}, lessons: {} });
      const started = await callJson(client, 'start_lesson', { lessonId: 'ai-foundations/01-what-is-ai' });
      expect(started.current).toBe('ai-foundations/01-what-is-ai');
      const rows = await testDb.sql`select user_id, lesson_id, status from lesson_progress`;
      expect([...rows]).toEqual([{ user_id: 'local', lesson_id: 'ai-foundations/01-what-is-ai', status: 'in_progress' }]);
    } finally {
      await client.close();
    }
  });

  it('pushes a progress event to the open dashboard when the tutor saves progress', async () => {
    const abort = new AbortController();
    const response = await fetch(`${server.url}/api/events`, { headers: { Accept: 'text/event-stream' }, signal: abort.signal });
    expect(response.status).toBe(200);
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
    let text = '';
    const readUntil = async (needle: string) => {
      while (!text.includes(needle)) {
        const chunk = await reader.read();
        if (chunk.done) break;
        text += chunk.value;
      }
    };
    await readUntil(': connected');

    const client = await connectMcp(server.url);
    try {
      await callJson(client, 'complete_lesson', { lessonId: 'ai-foundations/01-what-is-ai', score: 0.9, notes: 'Easy.' });
    } finally {
      await client.close();
    }
    await readUntil('data: progress');
    expect(text).toContain('event: change\ndata: progress');
    abort.abort();
    await reader.cancel().catch(() => {});
  });

  it('refuses requests from web pages on other sites', async () => {
    expect((await jsonRpc(server.url, { Origin: 'https://evil.example' })).status).toBe(403);
  });

  it('serves no OAuth discovery', async () => {
    expect((await fetch(`${server.url}/.well-known/oauth-protected-resource/mcp`)).status).toBe(404);
  });
});

describe('MCP with LESSONFOLK_AUTH=none and LESSONFOLK_MCP_TOKEN', () => {
  let server: DashboardServer;
  beforeAll(async () => {
    server = await startDashboard({
      DATABASE_URL: testDb.url,
      LESSONFOLK_MCP_TOKEN: 'local-test-token-123',
    });
  });
  afterAll(() => server?.stop());

  it('needs the token', async () => {
    const refused = await jsonRpc(server.url);
    expect(refused.status).toBe(401);
    expect(refused.headers.get('www-authenticate')).toContain('Bearer');
    expect((await jsonRpc(server.url, { Authorization: 'Bearer nope' })).status).toBe(401);

    const client = await connectMcp(server.url, 'local-test-token-123');
    try {
      expect((await client.listTools()).tools.length).toBeGreaterThan(10);
    } finally {
      await client.close();
    }
  });
});
