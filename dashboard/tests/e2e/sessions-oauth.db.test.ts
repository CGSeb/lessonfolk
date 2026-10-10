/**
 * Browser sessions with LESSONFOLK_AUTH=oauth: the Account page lists a learner's active sessions
 * (sign-in time and browser, no IP address), ends one, the others or all of them, never another
 * learner's, and a session ends 30 days after sign-in however often it is used.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { startFakeOAuth, type FakeOAuthServer, type FakeProfile } from './fake-oauth';
import { Browser, location } from './mcp-client';
import { freePort, startDashboard, visibleText, type DashboardServer } from './server';

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

async function signIn(profile: FakeProfile): Promise<{ browser: Browser; id: string }> {
  const browser = new Browser(server.url);
  fake.signInAs(profile);
  const start = await browser.post('/sign-in/fake', { next: '/account' });
  const approved = await fetch(location(start), { redirect: 'manual' });
  await browser.request(location(approved));
  const me = (await (await browser.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: { id: string } };
  return { browser, id: me.user.id };
}

const isSignedIn = async (browser: Browser) =>
  ((await (await browser.request('/api/me', { headers: { Accept: 'application/json' } })).json()) as { user: unknown }).user !== null;

const sessionIds = async (userId: string) =>
  (await testDb.sql<{ id: string }[]>`select id from session where user_id = ${userId} order by created_at`).map((row) => row.id);

/** The `revoke` forms of the page: the ids of the sessions it offers to end. */
const revocable = (html: string) => [...html.matchAll(/name="action" value="revoke"[^>]*>\s*<input type="hidden" name="id" value="([^"]+)"/g)].map((m) => m[1]);

describe('browser sessions', () => {
  it('lists the active sessions with their browser and sign-in time, never an IP address', async () => {
    const first = await signIn({ sub: 'fake-list', name: 'Lee List', email: 'lee@example.test' });
    const second = await signIn({ sub: 'fake-list', name: 'Lee List', email: 'lee@example.test' });
    const [firstId, secondId] = await sessionIds(first.id);
    await testDb.sql`update session set ip_address = '203.0.113.7', user_agent = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0' where id = ${firstId}`;

    const html = await (await second.browser.request('/account')).text();
    const page = visibleText(html);
    expect(page).toContain('Where you are signed in');
    expect(page).toContain('Firefox on Linux');
    expect(page).toContain('Signed in ');
    expect(page.match(/This browser/g)).toHaveLength(1);
    expect(html).not.toContain('203.0.113.7');
    // Only the other browser can be ended from here.
    expect(revocable(html)).toEqual([firstId]);
    expect(revocable(html)).not.toContain(secondId);
    expect(page).toContain('Sign out everywhere');
  });

  it('signs one other browser out, and refuses this one', async () => {
    const a = await signIn({ sub: 'fake-one', name: 'One', email: 'one@example.test' });
    const b = await signIn({ sub: 'fake-one', name: 'One', email: 'one@example.test' });
    const [aId, bId] = await sessionIds(a.id);

    const own = await b.browser.post('/api/account/sessions', { action: 'revoke', id: bId });
    expect(location(own)).toBe('/account?sessions=error');
    expect(await isSignedIn(b.browser)).toBe(true);

    const done = await b.browser.post('/api/account/sessions', { action: 'revoke', id: aId });
    expect(location(done)).toBe('/account?sessions=revoked');
    expect(await isSignedIn(a.browser)).toBe(false);
    expect(await isSignedIn(b.browser)).toBe(true);
    expect(visibleText(await (await b.browser.request('/account?sessions=revoked')).text())).toContain('That browser was signed out.');
  });

  it('never ends a session of another learner', async () => {
    const owner = await signIn({ sub: 'fake-owner', name: 'Owner', email: 'owner@example.test' });
    const intruder = await signIn({ sub: 'fake-intruder', name: 'Intruder', email: 'intruder@example.test' });
    const [ownerSession] = await sessionIds(owner.id);
    const response = await intruder.browser.post('/api/account/sessions', { action: 'revoke', id: ownerSession });
    expect(location(response)).toBe('/account?sessions=error');
    expect(await isSignedIn(owner.browser)).toBe(true);
    const html = await (await intruder.browser.request('/account')).text();
    expect(html).not.toContain(ownerSession);
  });

  it('signs the other browsers out and keeps this one', async () => {
    const a = await signIn({ sub: 'fake-others', name: 'Others', email: 'others@example.test' });
    const b = await signIn({ sub: 'fake-others', name: 'Others', email: 'others@example.test' });
    const c = await signIn({ sub: 'fake-others', name: 'Others', email: 'others@example.test' });
    const response = await c.browser.post('/api/account/sessions', { action: 'others' });
    expect(location(response)).toBe('/account?sessions=others');
    expect(await isSignedIn(a.browser)).toBe(false);
    expect(await isSignedIn(b.browser)).toBe(false);
    expect(await isSignedIn(c.browser)).toBe(true);
    expect(await sessionIds(c.id)).toHaveLength(1);
  });

  it('signs out everywhere, this browser included, and only that learner', async () => {
    const a = await signIn({ sub: 'fake-all', name: 'All', email: 'all@example.test' });
    const b = await signIn({ sub: 'fake-all', name: 'All', email: 'all@example.test' });
    const bystander = await signIn({ sub: 'fake-bystander', name: 'Bystander', email: 'bystander@example.test' });
    const response = await b.browser.post('/api/account/sessions', { action: 'all' });
    expect(location(response)).toBe('/');
    expect(await isSignedIn(a.browser)).toBe(false);
    expect(await isSignedIn(b.browser)).toBe(false);
    expect(await sessionIds(a.id)).toHaveLength(0);
    expect(await isSignedIn(bystander.browser)).toBe(true);
  });

  it('needs a signed-in learner and refuses cross-site posts', async () => {
    const signedOut = await new Browser(server.url).post('/api/account/sessions', { action: 'all' });
    expect(location(signedOut)).toMatch(/^\/sign-in/);
    const user = await signIn({ sub: 'fake-csrf', name: 'Csrf', email: 'csrf@example.test' });
    const cross = await user.browser.request('/api/account/sessions', {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'action=all',
    });
    expect(cross.status).toBe(403);
    expect(await isSignedIn(user.browser)).toBe(true);
  });

  it('ends a session 30 days after sign-in, even when it was used today', async () => {
    const user = await signIn({ sub: 'fake-old', name: 'Old', email: 'old@example.test' });
    const [id] = await sessionIds(user.id);
    // Used just now (renewed), but created 31 days ago.
    await testDb.sql`update session set created_at = now() - interval '31 days', expires_at = now() + interval '7 days' where id = ${id}`;
    expect(await isSignedIn(user.browser)).toBe(false);
    expect(await sessionIds(user.id)).toHaveLength(0);

    const recent = await signIn({ sub: 'fake-old', name: 'Old', email: 'old@example.test' });
    const [recentId] = await sessionIds(recent.id);
    await testDb.sql`update session set created_at = now() - interval '29 days' where id = ${recentId}`;
    expect(await isSignedIn(recent.browser)).toBe(true);
  });
});
