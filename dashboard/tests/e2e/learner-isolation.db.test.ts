/**
 * Learner isolation with LESSONFOLK_AUTH=oauth (hosted): two signed-in learners with their own
 * progress. Whatever one does through the dashboard (read, export, import, delete, follow live
 * changes) never reaches the other's data, even when the request names the other's user id.
 * Security pass of ticket #107.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseImportedProgress } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { leftovers, rowCounts } from './account-helpers';
import { startFakeOAuth, type FakeOAuthServer, type FakeProfile } from './fake-oauth';
import { Browser, location } from './mcp-client';
import { freePort, readProgressFixture, seedProgress, startDashboard, testProgressStore, visibleText, type DashboardServer } from './server';

let testDb: TestDatabase;
let fake: FakeOAuthServer;
let server: DashboardServer;

beforeAll(async () => {
  testDb = await createTestDatabase();
  fake = await startFakeOAuth();
  const port = await freePort();
  server = await startDashboard({
    PORT: String(port),
    DATABASE_URL: testDb.url,
    LESSONFOLK_AUTH: 'oauth',
    LESSONFOLK_BASE_URL: `http://127.0.0.1:${port}`,
    BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234567890',
    LESSONFOLK_TEST_OAUTH_URL: fake.url,
  });
});
afterAll(async () => {
  await server?.stop();
  await fake?.stop();
  await testDb?.drop();
});

interface Learner {
  browser: Browser;
  id: string;
  email: string;
}

async function signIn(profile: FakeProfile): Promise<Learner> {
  const browser = new Browser(server.url);
  fake.signInAs(profile);
  const start = await browser.post('/sign-in/fake', { next: '/account' });
  const approved = await fetch(location(start), { redirect: 'manual' });
  await browser.request(location(approved));
  const me = (await (await browser.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: { id: string } };
  return { browser, id: me.user.id, email: profile.email };
}

const ROBIN_NOTE = 'confused AI with robots at first';
const SAM_NOTE = 'Gave clear everyday examples of AI straight away';

let robin: Learner;
let sam: Learner;

beforeAll(async () => {
  robin = await signIn({ sub: 'iso-robin', name: 'Robin Tester', email: 'robin-iso@example.test' });
  sam = await signIn({ sub: 'iso-sam', name: 'Sam Other', email: 'sam-iso@example.test' });
  await seedProgress(testDb.db, robin.id, 'mid-course');
  await seedProgress(testDb.db, sam.id, 'all-done');
});

const samProgress = () => testProgressStore(testDb.db).getProgress(sam.id);

describe('reading', () => {
  it('shows and exports each learner’s own data only', async () => {
    const robinExport = await (await robin.browser.request('/api/account/export')).text();
    expect(parseImportedProgress(robinExport).profile.name).toBe('Alex');
    expect(robinExport).toContain(ROBIN_NOTE);
    expect(robinExport).not.toContain(SAM_NOTE);

    const robinAll = await (await robin.browser.request('/api/account/export-all')).text();
    for (const theirs of [sam.id, sam.email, 'Sam Other', SAM_NOTE]) expect(robinAll, theirs).not.toContain(theirs);
    expect(robinAll).toContain(robin.id);

    const robinPage = visibleText(await (await robin.browser.request('/courses/ai-foundations')).text());
    expect(robinPage).toContain(ROBIN_NOTE);
    expect(robinPage).not.toContain(SAM_NOTE);
    const samPage = visibleText(await (await sam.browser.request('/courses/ai-foundations')).text());
    expect(samPage).toContain(SAM_NOTE);
    expect(samPage).not.toContain(ROBIN_NOTE);

    const robinMe = await (await robin.browser.request('/api/me', { headers: { Accept: 'application/json' } })).text();
    expect(robinMe).not.toContain(sam.id);
    expect(robinMe).not.toContain(sam.email);
  });

  it('ignores a user id in the query string, the form or a header', async () => {
    for (const path of ['/api/account/export', '/api/account/export-all', '/api/me']) {
      const response = await robin.browser.request(`${path}?userId=${sam.id}&user=${sam.id}&id=${sam.id}`, {
        headers: { Accept: 'application/json', 'X-User-Id': sam.id, 'X-Forwarded-User': sam.id },
      });
      expect(response.status, path).toBe(200);
      const body = await response.text();
      expect(body, path).not.toContain(sam.id);
      expect(body, path).not.toContain(SAM_NOTE);
    }
  });

  it('gives nothing to a signed-out visitor, or to a forged or stale session cookie', async () => {
    const stranger = new Browser(server.url);
    for (const path of ['/api/account/export', '/api/account/export-all', '/api/events']) {
      expect((await stranger.request(path)).status, path).toBe(401);
    }
    const forged = await stranger.request('/api/account/export', { headers: { Cookie: 'better-auth.session_token=not-a-session' } });
    expect(forged.status).toBe(401);
    const me = (await (await stranger.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: unknown };
    expect(me.user).toBeNull();
    expect(visibleText(await (await stranger.request('/courses/ai-foundations')).text())).not.toContain(SAM_NOTE);
  });
});

describe('live changes', () => {
  /** Opens /api/events as `who` and collects what it receives. */
  async function follow(who: Learner) {
    const abort = new AbortController();
    const response = await fetch(`${server.url}/api/events`, {
      headers: { Accept: 'text/event-stream', Cookie: who.browser.cookieHeader() },
      signal: abort.signal,
    });
    expect(response.status).toBe(200);
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
    const stream = { text: '' };
    void (async () => {
      for (;;) {
        const chunk = await reader.read().catch(() => ({ done: true, value: undefined }));
        if (chunk.done) return;
        stream.text += chunk.value;
      }
    })();
    const until = async (text: string) => {
      for (let waited = 0; !stream.text.includes(text); waited += 25) {
        if (waited > 5000) throw new Error(`Never received "${text}"; got: ${stream.text}`);
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    };
    return { stream, until, close: () => abort.abort() };
  }

  it('sends a learner’s changes to that learner’s stream only', async () => {
    const robinStream = await follow(robin);
    const samStream = await follow(sam);
    await robinStream.until(': connected');
    await samStream.until(': connected');
    try {
      // Sam saves a change: Sam's stream hears it, Robin's does not.
      const imported = await sam.browser.post('/api/account/import', { progress: readProgressFixture('all-done') });
      expect(location(imported)).toMatch(/^\/account\?imported=/);
      await samStream.until('event: change');
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(robinStream.stream.text).not.toContain('event: change');

      // And the other way round.
      await robin.browser.post('/api/account/import', { progress: readProgressFixture('mid-course') });
      await robinStream.until('event: change');
    } finally {
      robinStream.close();
      samStream.close();
    }
  });
});

describe('writing', () => {
  it('imports into the signed-in learner, whatever user id the form names', async () => {
    const before = await samProgress();
    const mallory = JSON.stringify({ version: 1, profile: { name: 'Mallory' }, current: null, lessons: {} });
    const response = await robin.browser.post('/api/account/import', { progress: mallory, userId: sam.id, user: sam.id });
    expect(location(response)).toBe('/account?imported=0');
    expect((await testProgressStore(testDb.db).getProgress(robin.id)).profile.name).toBe('Mallory');
    expect(await samProgress()).toEqual(before);

    const viaQuery = await robin.browser.request(`/api/account/import?userId=${sam.id}`, {
      method: 'POST',
      headers: { Origin: server.url, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ progress: mallory }).toString(),
    });
    expect(viaQuery.status).toBe(303);
    expect(await samProgress()).toEqual(before);
    await seedProgress(testDb.db, robin.id, 'mid-course');
  });

  it('refuses a cross-site post that would import or delete', async () => {
    const before = await samProgress();
    for (const path of ['/api/account/import', '/api/account/delete']) {
      const response = await sam.browser.request(path, {
        method: 'POST',
        headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ progress: '{}', confirm: 'delete' }).toString(),
      });
      expect(response.status, path).toBe(403);
    }
    expect(await samProgress()).toEqual(before);
    expect((await rowCounts(testDb.db, sam.id)).user).toBe(1);
  });

  it('deletes the signed-in learner only, whatever user id the form names, and leaves no trace of them', async () => {
    const samBefore = await rowCounts(testDb.db, sam.id);
    const samProgressBefore = await samProgress();

    const response = await robin.browser.post('/api/account/delete', { confirm: 'delete', userId: sam.id, user: sam.id });
    expect(location(response)).toBe('/account?deleted=1');

    expect(await rowCounts(testDb.db, robin.id)).toEqual({ user: 0, account: 0, session: 0, learner: 0, lessonProgress: 0, progressEvent: 0 });
    expect(await leftovers(testDb.sql, [robin.id, robin.email, ROBIN_NOTE])).toEqual({});

    // Sam still has everything, including the session that keeps them signed in.
    expect(await rowCounts(testDb.db, sam.id)).toEqual(samBefore);
    expect(await samProgress()).toEqual(samProgressBefore);
    expect((await sam.browser.request('/api/account/export')).status).toBe(200);
    expect(visibleText(await (await sam.browser.request('/account')).text())).toContain('Signed in as Sam Other');

    // Robin's old cookie is worth nothing now.
    expect((await robin.browser.request('/api/account/export')).status).toBe(401);
  });
});
