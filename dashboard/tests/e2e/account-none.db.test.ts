/**
 * The Connect page and the account pages with LESSONFOLK_AUTH=none: the local learner's
 * export, import (checked, previewed, then confirmed), erase, and the first-run import of the
 * tutor's .progress/progress.json (a copy of a fixture in a temporary LESSONFOLK_ROOT).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseImportedProgress } from '@lessonfolk/core';
import { learner, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { multipartForm, previewedProgress, rowCounts } from './account-helpers';
import { getPage, readProgressFixture, seedProgress, startDashboard, testProgressStore, visibleText, type DashboardServer } from './server';

let testDb: TestDatabase;
let server: DashboardServer;
let root: string;
let localFile: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  root = mkdtempSync(join(tmpdir(), 'lessonfolk-account-'));
  mkdirSync(join(root, '.progress'));
  localFile = join(root, '.progress', 'progress.json');
  writeFileSync(localFile, readProgressFixture('mid-course'));
  server = await startDashboard({ DATABASE_URL: testDb.url, LESSONFOLK_ROOT: root });
});
afterAll(async () => {
  await server?.stop();
  await testDb?.drop();
  if (root) rmSync(root, { recursive: true, force: true });
});

/** A form post from the dashboard itself (same origin). */
const post = (path: string, fields: Record<string, string>) =>
  fetch(server.url + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: server.url, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });

/** Upload a file to the import preview, as the account page's form does. */
const upload = (content: string, origin = server.url) => {
  const { body, contentType } = multipartForm({ file: { filename: 'progress.json', content } });
  return fetch(`${server.url}/account/import`, { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': contentType }, body });
};

const exportText = async () => {
  const response = await fetch(`${server.url}/api/account/export`);
  expect(response.status).toBe(200);
  return response.text();
};

const savedProgress = () => testProgressStore(testDb.db).getProgress('local');

describe('the Connect page', () => {
  it("shows this computer's MCP address and the steps of each app, web chats excluded", async () => {
    const page = await getPage(server, '/connect');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Connect your AI chat');
    expect(page.text).toContain(`${server.url}/mcp`);
    expect(page.text).not.toContain('Your LessonFolk address');
    expect(page.text).not.toContain('Only apps on this computer can connect');
    for (const app of ['Claude Code', 'Codex', 'Cursor', 'Claude Desktop', 'claude.ai', 'ChatGPT']) expect(page.text).toContain(app);
    expect(page.text).toContain(`claude mcp add --transport http lessonfolk ${server.url}/mcp`);
    expect(page.text).toContain('Web chats cannot reach a LessonFolk that runs on this computer');
    expect(page.text).not.toContain('Optional: to make sure only your own apps connect');
    expect(page.text).toContain('How to install the Course companion');
    expect(page.html).toContain('docs/using-lessonfolk.md#the-course-companion-claude-code');
    expect(page.html).toContain('href="/connect"');
    expect(page.html).toContain('href="/account"');
  });

  it('has one tab and one panel per app, Claude Code first, web chats marked not available', async () => {
    const page = await getPage(server, '/connect');
    expect(page.html).toContain('role="tablist"');
    expect(page.html.match(/<a [^>]*role="tab"/g)).toHaveLength(6);
    expect(page.html.match(/<section [^>]*role="tabpanel"/g)).toHaveLength(6);
    for (const id of ['claude-code', 'codex', 'cursor', 'claude-desktop', 'claude-ai', 'chatgpt']) {
      expect(page.html, id).toContain(`href="#${id}"`);
      expect(page.html, id).toContain(`aria-controls="${id}"`);
    }
    expect(page.html).toMatch(/id="tab-claude-code"[^>]*aria-selected="true"/);
    expect(page.html).toMatch(/id="tab-chatgpt"[^>]*aria-selected="false"/);
    expect(page.html.match(/Not available here/g)).toHaveLength(2);
    expect(page.html.match(/class="badge badge--warning"[^>]*>Not available here/g)).toHaveLength(2);
  });

  it('says a token is needed when LESSONFOLK_MCP_TOKEN is set, without showing it', async () => {
    const withToken = await startDashboard({ DATABASE_URL: testDb.url, LESSONFOLK_ROOT: root, LESSONFOLK_MCP_TOKEN: 'super-secret-88' });
    try {
      const page = await getPage(withToken, '/connect');
      expect(page.text).toContain('This LessonFolk needs a token');
      expect(page.text).toContain('--header "Authorization: Bearer <your token>"');
      expect(page.html).not.toContain('super-secret-88');
    } finally {
      await withToken.stop();
    }
  });
});

describe('first run: importing the tutor’s progress file', () => {
  beforeAll(async () => {
    await seedProgress(testDb.db, 'local', null);
  });

  it('is offered on home and on the account page while the database holds no progress', async () => {
    for (const path of ['/', '/account']) {
      const page = await getPage(server, path);
      expect(page.text, path).toContain('We found your progress file');
      expect(page.html, path).toContain('name="source" value="local"');
    }
  });

  it('previews the file, then imports it once confirmed; the file is not changed', async () => {
    const before = readFileSync(localFile, 'utf8');
    const preview = await post('/account/import', { source: 'local' });
    expect(preview.status).toBe(200);
    const html = await preview.text();
    const text = visibleText(html);
    expect(text).toContain('Here is what changes');
    expect(text).toContain('Nothing saved yet');
    expect(text).toContain('Alex');
    expect(text).toContain('1 of 3');
    expect(text).toContain('How do machines learn?');
    // Nothing is written by the preview.
    expect((await rowCounts(testDb.db, 'local')).lessonProgress).toBe(0);

    const confirmed = await post('/api/account/import', { progress: previewedProgress(html) });
    expect(confirmed.status).toBe(303);
    expect(confirmed.headers.get('location')).toBe('/account?imported=2');
    expect((await savedProgress()).profile.name).toBe('Alex');
    expect(readFileSync(localFile, 'utf8')).toBe(before);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome back, Alex!');
    expect(home.text).not.toContain('We found your progress file');
    expect((await getPage(server, '/account?imported=2')).text).toContain('Your progress was imported: 2 lessons saved.');
  });
});

describe('export and import', () => {
  it('downloads the progress as progress.json', async () => {
    await seedProgress(testDb.db, 'local', 'mid-course');
    const response = await fetch(`${server.url}/api/account/export`);
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="progress.json"');
    expect(response.headers.get('content-type')).toContain('application/json');
    const exported = parseImportedProgress(await response.text());
    expect(exported.profile.name).toBe('Alex');
    expect(Object.keys(exported.lessons)).toEqual(['ai-foundations/01-what-is-ai', 'ai-foundations/02-how-machines-learn']);
  });

  it('downloads all the local learner’s data too, and links the privacy notice', async () => {
    await seedProgress(testDb.db, 'local', 'mid-course');
    const response = await fetch(`${server.url}/api/account/export-all`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.id).toBe('local');
    expect(data.learner.profile.name).toBe('Alex');
    expect(data.lessonProgress).toHaveLength(2);
    expect(data.signInAccounts).toEqual([]);
    const privacy = await getPage(server, '/privacy');
    expect(privacy.status).toBe(200);
    expect(privacy.text).toContain('nothing is sent to us');
    expect((await getPage(server, '/account')).html).toContain('href="/privacy"');
  });

  it('imports an uploaded file, and exports the same progress back (round trip)', async () => {
    await seedProgress(testDb.db, 'local', 'mid-course');
    const file = readProgressFixture('all-done');
    const preview = await upload(file);
    expect(preview.status).toBe(200);
    const html = await preview.text();
    const text = visibleText(html);
    expect(text).toContain('Saved now');
    expect(text).toContain('After the import');
    expect(text).toContain('Alex');
    expect(text).toContain('Sam');

    const confirmed = await post('/api/account/import', { progress: previewedProgress(html) });
    expect(confirmed.headers.get('location')).toBe('/account?imported=3');

    const exported = await exportText();
    const fixture = parseImportedProgress(file);
    const roundTrip = parseImportedProgress(exported);
    expect(roundTrip.profile).toEqual(fixture.profile);
    expect(roundTrip.lessons).toEqual(fixture.lessons);
    expect(roundTrip.current ?? null).toEqual(fixture.current ?? null);

    // Importing the export changes nothing.
    await post('/api/account/import', { progress: exported });
    expect(await exportText()).toBe(exported);
  });

  it('rejects a file that is not JSON with a readable message, and changes nothing', async () => {
    await seedProgress(testDb.db, 'local', 'mid-course');
    const response = await upload('{ "version": 1, "lessons": ');
    expect(response.status).toBe(422);
    const text = visibleText(await response.text());
    expect(text).toContain('This file cannot be imported');
    expect(text).toContain('Invalid JSON');
    expect(text).not.toContain('Replace my progress');
    expect((await savedProgress()).profile.name).toBe('Alex');
  });

  it('rejects a progress.json of the wrong shape, listing the problems', async () => {
    const response = await upload(JSON.stringify({ version: 1, profile: { name: 42 }, lessons: { x: { status: 'finished' } } }));
    expect(response.status).toBe(422);
    const text = visibleText(await response.text());
    expect(text).toContain('This is not a valid progress.json (v1).');
    expect(text).toContain('profile.name');
    expect(text).toContain('lessons.x.status');
    expect((await savedProgress()).profile.name).toBe('Alex');
  });

  it('asks for a file when none was chosen', async () => {
    const response = await upload('');
    expect(response.status).toBe(400);
    expect(visibleText(await response.text())).toContain('Choose a progress.json file first.');
  });

  it('refuses an invalid confirmation without writing anything', async () => {
    const response = await post('/api/account/import', { progress: '{"version":1,"lessons":{"x":{"status":"nope"}}}' });
    expect(response.headers.get('location')).toBe('/account?error=expired');
    expect((await savedProgress()).profile.name).toBe('Alex');
  });

  it('refuses imports and deletes posted from another site', async () => {
    expect((await upload(readProgressFixture('all-done'), 'https://evil.example')).status).toBe(403);
    for (const [path, fields] of [
      ['/api/account/import', { progress: readProgressFixture('all-done') }],
      ['/api/account/delete', { confirm: 'delete' }],
    ] as const) {
      const response = await fetch(server.url + path, {
        method: 'POST',
        redirect: 'manual',
        headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields).toString(),
      });
      expect(response.status, path).toBe(403);
    }
    expect((await savedProgress()).profile.name).toBe('Alex');
  });
});

describe('erasing the progress', () => {
  it('needs the word "delete"', async () => {
    await seedProgress(testDb.db, 'local', 'mid-course');
    const response = await post('/api/account/delete', { confirm: 'yes' });
    expect(response.headers.get('location')).toBe('/account?error=confirm');
    expect((await rowCounts(testDb.db, 'local')).lessonProgress).toBe(2);
    expect((await getPage(server, '/account?error=confirm')).text).toContain('Nothing was deleted');
  });

  it("removes all the local learner's progress rows and starts fresh; the file is kept", async () => {
    const page = await getPage(server, '/account');
    expect(page.text).toContain('Erase your progress');
    expect(page.text).not.toContain('Delete your account');

    const response = await post('/api/account/delete', { confirm: 'Delete' });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/account?erased=1');
    expect(await rowCounts(testDb.db, 'local')).toMatchObject({ user: 1, learner: 1, lessonProgress: 0, progressEvent: 0 });
    const [row] = await testDb.db.select().from(learner).where(eq(learner.userId, 'local'));
    expect(row).toMatchObject({ profile: {}, currentLessonId: null });
    expect(await testDb.db.select().from(user)).toHaveLength(1);
    expect(readFileSync(localFile, 'utf8')).toBe(readProgressFixture('mid-course'));

    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome to LessonFolk');
    // The tutor's file is still there: the first-run offer comes back.
    expect(home.text).toContain('We found your progress file');
  });
});
