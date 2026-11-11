/**
 * The project tools against a real Postgres, through the official MCP client: a learner picks
 * a project, reaches its milestones, gets it reviewed and completes it.
 */
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectProjects } from '@lessonfolk/core';
import { Client, StreamableHTTPClientTransport, type CallToolResult } from '@modelcontextprotocol/client';
import { createPostgresProgressStore, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { readCourses } from './catalog.ts';
import { createMcpEndpoint, type McpEndpoint } from './endpoint.ts';

const fixture = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));

const PROJECT = `---
id: demo
title: Demo project
level: beginner
theme: understanding-ai
authors: [lessonfolk]
description: A demo project.
estimatedHours: 2
buildsOn: [ai-foundations]
needs: [An AI chat app]
---

## Brief
Make something real.

## Milestones
1. First. Done when: one.
2. Second. Done when: two.
3. Third. Done when: three.

## Coaching notes
- Coach, do not write.

## Review
1. It works.
2. It is clear.
`;

const FRENCH = PROJECT.replace('title: Demo project', 'title: Projet démo').replace('description: A demo project.', 'description: Un projet démo.')
  .replace(/^level:.*\n|^theme:.*\n|^authors:.*\n|^estimatedHours:.*\n|^buildsOn:.*\n/gm, '');

let testDb: TestDatabase;
let endpoint: McpEndpoint;
let coursesDir: string;
const clients: Client[] = [];

beforeAll(async () => {
  coursesDir = mkdtempSync(join(tmpdir(), 'lessonfolk-mcp-projects-'));
  cpSync(fixture, coursesDir, { recursive: true });
  mkdirSync(join(coursesDir, 'projects', 'en'), { recursive: true });
  mkdirSync(join(coursesDir, 'projects', 'fr'), { recursive: true });
  writeFileSync(join(coursesDir, 'projects', 'en', 'index.yaml'), 'projects:\n  - demo\n');
  writeFileSync(join(coursesDir, 'projects', 'en', 'demo.md'), PROJECT);
  writeFileSync(join(coursesDir, 'projects', 'fr', 'demo.md'), FRENCH);

  testDb = await createTestDatabase();
  const store = createPostgresProgressStore(testDb.db, {
    courses: () => readCourses(coursesDir),
    projects: () => inspectProjects('en', coursesDir).projects,
  });
  endpoint = createMcpEndpoint({
    store,
    gate: (request, next) => {
      const userId = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
      return userId ? next({ userId, client: 'test' }) : Promise.resolve(Response.json({ error: 'invalid_token' }, { status: 401 }));
    },
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

async function connect(userId: string): Promise<Client> {
  await testDb.db.insert(user).values({ id: userId, name: userId, email: `${userId}@example.com` });
  const client = new Client({ name: 'lessonfolk-test', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL('http://127.0.0.1/mcp'), {
      requestInit: { headers: { Authorization: `Bearer ${userId}` } },
      fetch: (url, init) => endpoint(new Request(url, init)),
    }),
  );
  clients.push(client);
  return client;
}

const text = (result: CallToolResult) => (result.content[0] as { text: string }).text;
const call = async (client: Client, name: string, args: Record<string, unknown> = {}) =>
  (await client.callTool({ name, arguments: args })) as CallToolResult;

async function ok(client: Client, name: string, args: Record<string, unknown> = {}) {
  const result = await call(client, name, args);
  expect(result.isError, text(result)).toBeFalsy();
  return text(result);
}

describe('project tools', () => {
  it('coach a learner through a project, from choosing it to completing it', async () => {
    const client = await connect('learner-project');

    const [listed] = JSON.parse(await ok(client, 'list_projects'));
    expect(listed).toMatchObject({
      id: 'demo',
      status: 'not_started',
      milestones: 3,
      reviewCriteria: 2,
      needs: ['An AI chat app'],
      buildsOn: [{ id: 'ai-foundations', title: 'AI Foundations', status: 'not_started' }],
    });

    expect(await ok(client, 'get_project', { projectId: 'demo' })).toMatch(/^<!-- LessonFolk: project demo .*not started.*-->\n---\nid: demo/s);
    expect(await ok(client, 'start_project', { projectId: 'demo' })).toContain('Project demo started.');

    const refused = await call(client, 'record_milestone', { projectId: 'demo', milestone: 2 });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain('milestones_out_of_order');
    expect(text(refused)).toContain('Milestones not reached yet: 1.');

    expect(await ok(client, 'record_milestone', { projectId: 'demo', milestone: 1 })).toContain('Next: milestone 2.');
    await ok(client, 'save_project_notes', { projectId: 'demo', notes: 'Chose the weekly update.' });
    await ok(client, 'record_milestone', { projectId: 'demo', milestone: 2 });
    expect(await ok(client, 'get_project', { projectId: 'demo' })).toContain('working on milestone 3 of 3');
    const last = await ok(client, 'record_milestone', { projectId: 'demo', milestone: 3 });
    expect(last).toContain('Every milestone is reached');
    expect(last).toContain('Projects: 0 done, 1 in progress.');

    const early = await call(client, 'complete_project', { projectId: 'demo', notes: 'Done.' });
    expect(text(early)).toContain('Review criteria with no verdict yet: 1, 2.');
    expect(await ok(client, 'record_project_review', { projectId: 'demo', criterion: 1, verdict: 'met' })).toContain('Next: criterion 2.');
    await ok(client, 'record_project_review', { projectId: 'demo', criterion: 2, verdict: 'partly' });
    await ok(client, 'complete_project', { projectId: 'demo', notes: 'Clear result; test more cases next time.' });

    const progress = JSON.parse(await ok(client, 'get_progress'));
    expect(progress.projects.demo).toMatchObject({ status: 'done', milestones: [1, 2, 3], review: { 1: 'met', 2: 'partly' } });
    expect(JSON.parse(await ok(client, 'list_projects'))[0]).toMatchObject({ status: 'done', milestonesReached: [1, 2, 3] });

    expect(await ok(client, 'reset_project', { projectId: 'demo' })).toContain('Project demo reset.');
    expect(JSON.parse(await ok(client, 'get_progress')).projects).toBeUndefined();
  });

  it('serve the project in the learner language, and refuse unknown projects', async () => {
    const client = await connect('learner-fr');
    await ok(client, 'set_profile', { language: 'fr' });
    expect(JSON.parse(await ok(client, 'list_projects'))[0]).toMatchObject({ title: 'Projet démo' });
    expect(await ok(client, 'get_project', { projectId: 'demo' })).toContain('language fr');
    const unknown = await call(client, 'start_project', { projectId: 'ghost' });
    expect(unknown.isError).toBe(true);
    expect(text(unknown)).toContain('unknown_project');
    expect(text(await call(client, 'get_project', { projectId: 'ghost' }))).toContain('Unknown project "ghost"');
  });

  it('serve the project prompt', async () => {
    const client = await connect('learner-prompt');
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toContain('project');
    const prompt = await client.getPrompt({ name: 'project', arguments: {} });
    expect((prompt.messages[0].content as { text: string }).text).toContain('record_milestone');
  });
});
