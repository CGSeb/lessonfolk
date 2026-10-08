/**
 * The MCP endpoint against a real Postgres, through the official MCP client (both protocol
 * eras), with a test gate that maps bearer tokens to users.
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
const L2 = 'ai-foundations/02-how-machines-learn';
const L3 = 'ai-foundations/03-what-is-an-llm';
const BASE = 'http://127.0.0.1/mcp';

let testDb: TestDatabase;
let endpoint: McpEndpoint;
const tokens = new Map<string, string>();
const clients: Client[] = [];

/** Test gate: `Bearer <token>` of a known user, else 401. The real gates are in endpoint.test.ts and the dashboard e2e tests. */
const testGate: McpGate = async (request, next) => {
  const token = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  const userId = token && tokens.get(token);
  if (!userId) return Response.json({ error: 'invalid_token' }, { status: 401 });
  return next({ userId, client: 'test' });
};

async function addUser(id: string): Promise<string> {
  await testDb.db.insert(user).values({ id, name: id, email: `${id}@example.com` });
  tokens.set(`token-${id}`, id);
  return `token-${id}`;
}

type Era = 'legacy' | 'modern';

async function connect(token: string, era: Era = 'legacy'): Promise<Client> {
  const client = new Client(
    { name: 'lessonfolk-test', version: '1.0.0' },
    era === 'modern' ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : {},
  );
  const transport = new StreamableHTTPClientTransport(new URL(BASE), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
    fetch: (url, init) => endpoint(new Request(url, init)),
  });
  await client.connect(transport);
  clients.push(client);
  return client;
}

const text = (result: unknown) => ((result as CallToolResult).content[0] as { text: string }).text;
/** The progress JSON at the end of a write tool's answer. */
const progressOf = (result: unknown) => JSON.parse(text(result).split('Progress now:\n')[1]);

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  return (await client.callTool({ name, arguments: args })) as CallToolResult;
}

beforeAll(async () => {
  testDb = await createTestDatabase();
  const store = createPostgresProgressStore(testDb.db, { courses: () => readCourses(coursesDir) });
  endpoint = createMcpEndpoint({ store, gate: testGate, coursesDir, writeLimit: { limit: 1000, windowMs: 60_000 } });
});

afterEach(async () => {
  await Promise.all(clients.splice(0).map((c) => c.close().catch(() => {})));
});

afterAll(() => testDb?.drop());

describe.each<Era>(['legacy', 'modern'])('MCP endpoint (%s protocol)', (era) => {
  it('lists the tools with descriptions, and no tool takes a user id', async () => {
    const client = await connect(await addUser(`list-${era}`), era);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        'complete_lesson',
        'get_lesson',
        'get_next_lesson',
        'get_progress',
        'import_progress',
        'level_check_skip_course',
        'list_courses',
        'list_themes',
        'record_review_score',
        'reset_course',
        'save_lesson_notes',
        'set_path',
        'set_profile',
        'skip_lesson',
        'start_lesson',
      ].sort(),
    );
    for (const tool of tools) {
      expect(tool.description?.length).toBeGreaterThan(40);
      const properties = Object.keys((tool.inputSchema as { properties?: object }).properties ?? {});
      expect(properties.some((p) => /user/i.test(p))).toBe(false);
    }
  });

  it('runs a whole first session: profile, path, next lesson, lesson, complete', async () => {
    const client = await connect(await addUser(`session-${era}`), era);

    const empty = JSON.parse(text(await call(client, 'get_progress')));
    expect(empty).toMatchObject({ version: 1, profile: {}, lessons: {} });

    const themes = JSON.parse(text(await call(client, 'list_themes')));
    expect(themes[0]).toMatchObject({ id: 'understanding-ai', courseIds: ['ai-foundations'], comingSoon: false });
    expect(themes.find((t: { id: string }) => t.id === 'using-ai').comingSoon).toBe(true);

    const profile = progressOf(
      await call(client, 'set_profile', { name: 'Ada', experience: 'none', level: 'beginner', interests: ['understanding-ai'] }),
    );
    expect(profile.profile).toEqual({ name: 'Ada', experience: 'none', level: 'beginner', interests: ['understanding-ai'] });

    const path = progressOf(await call(client, 'set_path', { path: ['ai-foundations'], reason: 'Start with the basics.' }));
    expect(path).toMatchObject({ path: ['ai-foundations'], pathReason: 'Start with the basics.' });

    const next = JSON.parse(text(await call(client, 'get_next_lesson')));
    expect(next).toMatchObject({ kind: 'next', lessonId: L1, courseId: 'ai-foundations', status: 'not_started' });

    const started = progressOf(await call(client, 'start_lesson', { lessonId: L1 }));
    expect(started.current).toBe(L1);
    expect(started.lessons[L1].status).toBe('in_progress');

    const lesson = text(await call(client, 'get_lesson', { lessonId: L1 }));
    expect(lesson).toContain('learner status: in_progress');
    expect(lesson).toContain('## Teaching notes');

    const notes = progressOf(await call(client, 'save_lesson_notes', { lessonId: L1, notes: 'Stopped after key idea 2.' }));
    expect(notes.lessons[L1].notes).toBe('Stopped after key idea 2.');

    const done = progressOf(await call(client, 'complete_lesson', { lessonId: L1, score: 0.7, notes: 'Easy analogies, unsure about narrow AI.' }));
    expect(done.lessons[L1]).toMatchObject({ status: 'done', score: 0.7 });
    expect(done.current ?? null).toBeNull();

    const reviewed = progressOf(await call(client, 'record_review_score', { lessonId: L1, score: 0.9 }));
    expect(reviewed.lessons[L1].score).toBeCloseTo(0.9);

    const skipped = progressOf(await call(client, 'skip_lesson', { lessonId: L2, reason: 'Knew it: answered both checks.' }));
    expect(skipped.lessons[L2]).toMatchObject({ status: 'skipped', notes: 'Knew it: answered both checks.' });

    const courses = JSON.parse(text(await call(client, 'list_courses', { theme: 'understanding-ai' })));
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({ id: 'ai-foundations', status: 'in_progress', themeTitle: 'Understanding AI' });
    expect(courses[0].lessons.map((l: { status: string }) => l.status)).toEqual(['done', 'skipped', 'not_started']);

    const stored = JSON.parse(text(await call(client, 'get_progress')));
    expect(stored.lessons[L1].status).toBe('done');
  });

  it('returns store errors as readable tool errors, and changes nothing', async () => {
    const client = await connect(await addUser(`errors-${era}`), era);
    const blocked = await call(client, 'start_lesson', { lessonId: L3 });
    expect(blocked.isError).toBe(true);
    expect(text(blocked)).toContain('(prerequisites_not_met)');
    expect(text(blocked)).toContain(`Unfinished prerequisites: ${L2}`);

    const unknown = await call(client, 'get_lesson', { lessonId: 'nope/01-x' });
    expect(unknown.isError).toBe(true);
    expect(text(unknown)).toContain('Unknown lesson "nope/01-x"');

    const badPath = await call(client, 'set_path', { path: ['no-such-course'], reason: 'x' });
    expect(badPath.isError).toBe(true);
    expect(text(badPath)).toContain('unknown_course: no-such-course');

    const skipReserved = await call(client, 'level_check_skip_course', { courseId: 'ai-foundations' });
    expect(skipReserved.isError).toBe(true);
    expect(text(skipReserved)).toContain('(no_level)');

    const nothingToReset = await call(client, 'reset_course', { courseId: 'ai-foundations' });
    expect(nothingToReset.isError).toBe(true);
    expect(text(nothingToReset)).toContain('(nothing_to_reset)');

    const badImport = await call(client, 'import_progress', { progress: '{"version": 1, "lessons": {"x": {"status": "maybe"}}}' });
    expect(badImport.isError).toBe(true);
    expect(text(badImport)).toContain('(invalid_progress)');

    expect(JSON.parse(text(await call(client, 'get_progress')))).toMatchObject({ profile: {}, lessons: {} });
  });

  it('reads course and lesson resources', async () => {
    const client = await connect(await addUser(`resources-${era}`), era);
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toEqual(['lessonfolk://courses/en/ai-foundations']);
    const { resourceTemplates } = await client.listResourceTemplates();
    expect(resourceTemplates.map((t) => t.uriTemplate).sort()).toEqual([
      'lessonfolk://courses/{lang}/{course}',
      'lessonfolk://courses/{lang}/{course}/{lesson}',
    ]);

    const course = await client.readResource({ uri: 'lessonfolk://courses/en/ai-foundations' });
    const summary = JSON.parse((course.contents[0] as { text: string }).text);
    expect(summary.lessons.map((l: { id: string }) => l.id)).toEqual([L1, L2, L3]);

    const lesson = await client.readResource({ uri: 'lessonfolk://courses/en/ai-foundations/01-what-is-ai' });
    expect(lesson.contents[0]).toMatchObject({ mimeType: 'text/markdown' });
    expect((lesson.contents[0] as { text: string }).text).toContain(`id: ${L1}`);

    // A missing translation falls back to English.
    const french = await client.readResource({ uri: 'lessonfolk://courses/fr/ai-foundations' });
    expect(JSON.parse((french.contents[0] as { text: string }).text).id).toBe('ai-foundations');
  });
});

describe('users are kept apart', () => {
  it("a user can neither read nor write another user's progress", async () => {
    const alice = await connect(await addUser('alice'));
    const bob = await connect(await addUser('bob'));

    await call(alice, 'set_profile', { name: 'Alice', level: 'beginner' });
    await call(alice, 'start_lesson', { lessonId: L1 });

    // Bob sees only his own (empty) progress, whatever arguments he adds.
    const bobProgress = JSON.parse(text(await call(bob, 'get_progress', { userId: 'alice' })));
    expect(bobProgress).toMatchObject({ profile: {}, lessons: {} });
    const bobNext = JSON.parse(text(await call(bob, 'get_next_lesson', { userId: 'alice' })));
    expect(bobNext.status).toBe('not_started');

    // Bob's writes land on Bob, even with an extra user id argument.
    await call(bob, 'set_profile', { name: 'Bob', userId: 'alice' } as Record<string, unknown>);
    await call(bob, 'import_progress', { progress: { version: 1, profile: { name: 'Mallory' }, lessons: {} }, userId: 'alice' });

    const aliceProgress = JSON.parse(text(await call(alice, 'get_progress')));
    expect(aliceProgress.profile.name).toBe('Alice');
    expect(aliceProgress.lessons[L1].status).toBe('in_progress');
    expect(JSON.parse(text(await call(bob, 'get_progress'))).profile.name).toBe('Mallory');
  });

  it('refuses requests the gate does not accept', async () => {
    const response = await endpoint(
      new Request(BASE, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe('rate limiting', () => {
  it('limits write tools per user, not read tools', async () => {
    const store = createPostgresProgressStore(testDb.db, { courses: () => readCourses(coursesDir) });
    const limited = createMcpEndpoint({ store, gate: testGate, coursesDir, writeLimit: { limit: 2, windowMs: 60_000 } });
    const token = await addUser('busy');
    const client = new Client({ name: 'lessonfolk-test', version: '1.0.0' });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(BASE), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
        fetch: (url, init) => limited(new Request(url, init)),
      }),
    );
    clients.push(client);

    expect((await call(client, 'set_profile', { name: 'One' })).isError).toBeFalsy();
    expect((await call(client, 'set_profile', { name: 'Two' })).isError).toBeFalsy();
    const third = await call(client, 'set_profile', { name: 'Three' });
    expect(third.isError).toBe(true);
    expect(text(third)).toMatch(/Too many changes .* wait \d+ seconds/);
    expect(JSON.parse(text(await call(client, 'get_progress'))).profile.name).toBe('Two');
  });
});
