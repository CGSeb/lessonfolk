/**
 * Per-tool scope enforcement through the real MCP endpoint and client, against Postgres:
 * the gate maps bearer tokens to a user and the scopes of the access token.
 */
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport, type CallToolResult } from '@modelcontextprotocol/client';
import { createPostgresProgressStore, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { readCourses } from './catalog.ts';
import { createMcpEndpoint, type McpEndpoint, type McpGate } from './endpoint.ts';

const coursesDir = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));
const L1 = 'ai-foundations/01-what-is-ai';

let testDb: TestDatabase;
let endpoint: McpEndpoint;
/** token -> user and token scopes (undefined: the token has no scope claim). */
const tokens = new Map<string, { userId: string; scopes?: string[] }>();
const clients: Client[] = [];

const gate: McpGate = async (request, next) => {
  const token = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  const known = token && tokens.get(token);
  if (!known) return Response.json({ error: 'invalid_token' }, { status: 401 });
  return next({ ...known, client: 'test' });
};

async function connectAs(id: string, scopes?: string[]): Promise<Client> {
  await testDb.db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  tokens.set(`token-${id}`, { userId: id, scopes });
  const client = new Client({ name: 'lessonfolk-test', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://127.0.0.1/mcp'), {
      requestInit: { headers: { Authorization: `Bearer token-${id}` } },
      fetch: (url, init) => endpoint(new Request(url, init)),
    }),
  );
  clients.push(client);
  return client;
}

const call = async (client: Client, name: string, args: Record<string, unknown> = {}) =>
  (await client.callTool({ name, arguments: args })) as CallToolResult;
const text = (result: CallToolResult) => (result.content[0] as { text: string }).text;

beforeAll(async () => {
  testDb = await createTestDatabase();
  endpoint = createMcpEndpoint({
    store: createPostgresProgressStore(testDb.db, { courses: () => readCourses(coursesDir) }),
    gate,
    coursesDir,
    writeLimit: { limit: 1000, windowMs: 60_000 },
    addressLimit: { limit: 100_000, windowMs: 60_000 },
    userLimit: { limit: 100_000, windowMs: 60_000 },
  });
});

afterEach(async () => {
  await Promise.all(clients.splice(0).map((c) => c.close().catch(() => {})));
});

afterAll(() => testDb?.drop());

const READ_TOOLS: [string, Record<string, unknown>][] = [
  ['get_progress', {}],
  ['get_next_lesson', {}],
  ['get_lesson', { lessonId: L1 }],
  ['list_courses', {}],
  ['list_themes', {}],
];

const WRITE_TOOLS: [string, Record<string, unknown>][] = [
  ['set_profile', { level: 'beginner' }],
  ['set_path', { path: ['ai-foundations'], reason: 'Start here.' }],
  ['start_lesson', { lessonId: L1 }],
  ['complete_lesson', { lessonId: L1, score: 1, notes: 'Fine.' }],
  ['skip_lesson', { lessonId: L1, reason: 'Known.' }],
  ['level_check_skip_course', { courseId: 'ai-foundations' }],
  ['reset_course', { courseId: 'ai-foundations' }],
  ['save_lesson_notes', { lessonId: L1, notes: 'Stopped here.' }],
  ['record_review_score', { lessonId: L1, score: 0.5 }],
  ['import_progress', { progress: { version: 1 } }],
];

describe('MCP token scopes', () => {
  it('lets a lessonfolk:read token read, and refuses every write tool without changing anything', async () => {
    const client = await connectAs('reader', ['openid', 'lessonfolk:read']);
    for (const [name, args] of READ_TOOLS) {
      const result = await call(client, name, args);
      expect(result.isError, name).toBeFalsy();
    }
    for (const [name, args] of WRITE_TOOLS) {
      const result = await call(client, name, args);
      expect(result.isError, name).toBe(true);
      expect(text(result), name).toContain('lessonfolk:write');
    }
    const progress = JSON.parse(text(await call(client, 'get_progress')));
    expect(progress.profile?.level ?? null).toBeNull();
    expect(Object.keys(progress.lessons ?? {})).toEqual([]);
  });

  it('ignores unknown scopes: with no known lessonfolk scope the compatibility rule applies', async () => {
    const client = await connectAs('unknown', ['openid', 'lessonfolk:unknown']);
    expect((await call(client, 'get_progress')).isError).toBeFalsy();
  });

  it('lets a lessonfolk:write token read and write', async () => {
    const client = await connectAs('writer', ['openid', 'lessonfolk:write']);
    expect((await call(client, 'get_progress')).isError).toBeFalsy();
    const saved = await call(client, 'set_profile', { level: 'beginner' });
    expect(saved.isError).toBeFalsy();
    expect(text(saved)).toContain('Profile saved.');
  });

  it('keeps full access for a token without lessonfolk scopes (compatibility with clients that never request them)', async () => {
    const client = await connectAs('legacy', ['openid', 'profile', 'email', 'offline_access']);
    expect((await call(client, 'set_profile', { level: 'beginner' })).isError).toBeFalsy();
    const noScope = await connectAs('noscope');
    expect((await call(noScope, 'set_profile', { level: 'beginner' })).isError).toBeFalsy();
  });
});
