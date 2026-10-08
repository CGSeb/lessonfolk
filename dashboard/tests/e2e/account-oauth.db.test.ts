/**
 * The Connect page and the account pages with LESSONFOLK_AUTH=oauth: signed-in users export,
 * import and delete their own data only; deleting an account removes every row of that user.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseImportedProgress } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { multipartForm, previewedProgress, rowCounts } from './account-helpers';
import { startFakeOAuth, type FakeOAuthServer, type FakeProfile } from './fake-oauth';
import { Browser, location } from './mcp-client';
import { freePort, readProgressFixture, seedProgress, startDashboard, testProgressStore, visibleText, type DashboardServer } from './server';

let testDb: TestDatabase;
let fake: FakeOAuthServer;
let server: DashboardServer;
let baseURL: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  fake = await startFakeOAuth();
  const port = await freePort();
  baseURL = `http://127.0.0.1:${port}`;
  server = await startDashboard({
    PORT: String(port),
    DATABASE_URL: testDb.url,
    LESSONFOLK_AUTH: 'oauth',
    LESSONFOLK_BASE_URL: baseURL,
    BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234567890',
    LESSONFOLK_TEST_OAUTH_URL: fake.url,
  });
});
afterAll(async () => {
  await server?.stop();
  await fake?.stop();
  await testDb?.drop();
});

/** Sign in through the fake provider; returns the browser and the user id. */
async function signIn(profile: FakeProfile): Promise<{ browser: Browser; id: string }> {
  const browser = new Browser(server.url);
  fake.signInAs(profile);
  const start = await browser.post('/sign-in/fake', { next: '/account' });
  const approved = await fetch(location(start), { redirect: 'manual' });
  await browser.request(location(approved));
  const me = (await (await browser.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: { id: string } };
  return { browser, id: me.user.id };
}

const text = async (response: Response) => visibleText(await response.text());

describe('signed out', () => {
  it('shows the Connect page with LESSONFOLK_BASE_URL, and that web chats need a public address', async () => {
    const page = await text(await new Browser(server.url).request('/connect'));
    expect(page).toContain(`${baseURL}/mcp`);
    expect(page).toContain('Everyone signs in as themselves');
    expect(page).toContain('Web chats cannot reach this address');
    expect(page).toContain('codex mcp login lessonfolk');
    expect(page).not.toContain('LESSONFOLK_MCP_TOKEN');
  });

  it('keeps the six app tabs, with the web chats unavailable on a non-public address', async () => {
    const html = await (await new Browser(server.url).request('/connect')).text();
    expect(html.match(/<a [^>]*role="tab"/g)).toHaveLength(6);
    expect(html.match(/<section [^>]*role="tabpanel"/g)).toHaveLength(6);
    expect(html).toMatch(/id="tab-claude-code"[^>]*aria-selected="true"/);
    expect(html.match(/Not available here/g)).toHaveLength(2);
  });

  it('keeps the account pages and data routes for signed-in users', async () => {
    const browser = new Browser(server.url);
    const account = await browser.request('/account');
    expect(account.status).toBe(303);
    expect(location(account)).toBe('/sign-in?next=%2Faccount');
    expect((await browser.request('/api/account/export')).status).toBe(401);
    for (const path of ['/api/account/import', '/api/account/delete', '/account/import']) {
      const response = await browser.post(path, { confirm: 'delete', progress: '{}' });
      expect(response.status, path).toBe(303);
      expect(location(response), path).toMatch(/^\/sign-in/);
    }
    // No "Your data" link for nobody's data.
    expect(await (await browser.request('/connect')).text()).not.toContain('href="/account"');
  });
});

describe('signed in', () => {
  let robin: { browser: Browser; id: string };
  let sam: { browser: Browser; id: string };

  beforeAll(async () => {
    robin = await signIn({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });
    sam = await signIn({ sub: 'fake-sam', name: 'Sam Other', email: 'sam@example.test' });
    await seedProgress(testDb.db, sam.id, 'all-done');
  });

  it('shows the account page, without the first-run import (oauth)', async () => {
    const page = await text(await robin.browser.request('/account'));
    expect(page).toContain('Signed in as Robin Tester (robin@example.test)');
    expect(page).toContain('Delete your account');
    expect(page).not.toContain('We found your progress file');
  });

  it('imports into the signed-in user only, and exports it back (round trip)', async () => {
    const file = readProgressFixture('mid-course');
    const { body, contentType } = multipartForm({ file: { filename: 'progress.json', content: file } });
    const preview = await robin.browser.request('/account/import', {
      method: 'POST',
      headers: { Origin: server.url, 'Content-Type': contentType },
      body,
    });
    expect(preview.status).toBe(200);
    const html = await preview.text();
    expect(visibleText(html)).toContain('Nothing saved yet');

    const confirmed = await robin.browser.post('/api/account/import', { progress: previewedProgress(html) });
    expect(location(confirmed)).toBe('/account?imported=2');

    const exported = parseImportedProgress(await (await robin.browser.request('/api/account/export')).text());
    expect(exported.profile.name).toBe('Alex');
    expect(exported.lessons).toEqual(parseImportedProgress(file).lessons);
    // Sam's progress is untouched, and Sam's export is Sam's.
    expect((await testProgressStore(testDb.db).getProgress(sam.id)).profile.name).toBe('Sam');
    expect(parseImportedProgress(await (await sam.browser.request('/api/account/export')).text()).profile.name).toBe('Sam');
  });

  it('deletes the account and every row of that user, and nobody else’s', async () => {
    const before = await rowCounts(testDb.db, robin.id);
    expect(before).toMatchObject({ user: 1, account: 1, learner: 1, lessonProgress: 2 });
    expect(before.session).toBeGreaterThan(0);
    expect(before.progressEvent).toBeGreaterThan(0);

    const refused = await robin.browser.post('/api/account/delete', { confirm: 'please' });
    expect(location(refused)).toBe('/account?error=confirm');
    expect((await rowCounts(testDb.db, robin.id)).user).toBe(1);

    const response = await robin.browser.post('/api/account/delete', { confirm: 'delete' });
    expect(response.status).toBe(303);
    expect(location(response)).toBe('/account?deleted=1');
    expect(await rowCounts(testDb.db, robin.id)).toEqual({
      user: 0,
      account: 0,
      session: 0,
      learner: 0,
      lessonProgress: 0,
      progressEvent: 0,
    });
    // Signed out, with a confirmation.
    const me = (await (await robin.browser.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: unknown };
    expect(me.user).toBeNull();
    expect(await text(await robin.browser.request('/account?deleted=1'))).toContain('Your account and all your data were deleted.');

    const samRows = await rowCounts(testDb.db, sam.id);
    expect(samRows).toMatchObject({ user: 1, learner: 1, lessonProgress: 3 });
  });
});
