/**
 * The Connect page and the account pages with LESSONFOLK_AUTH=oauth: signed-in users export,
 * import and delete their own data only; deleting an account removes every row of that user.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseImportedProgress } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { leftovers, multipartForm, previewedProgress, rowCounts } from './account-helpers';
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
  it('shows the Connect page with LESSONFOLK_BASE_URL', async () => {
    const page = await text(await new Browser(server.url).request('/connect'));
    expect(page).toContain(`${baseURL}/mcp`);
    expect(page).toContain('Everyone signs in as themselves');
    expect(page).not.toContain('Web chats cannot reach this address');
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
    // No "Account" link for nobody's data.
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
    // One progress block, a small link for all the data, the destructive group last.
    const order = ['Your progress', 'Download your progress', 'Import a progress.json', 'Download all my data', 'Delete your account'].map((t) =>
      page.indexOf(t),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
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

  /** Rows a user could have after using MCP apps: a client they registered, consent, tokens. */
  async function seedMcpApp(userId: string) {
    await testDb.sql`insert into oauth_client (id, client_id, client_secret, name, user_id, redirect_uris, created_at)
      values ('c-1', 'client-robin', 'SECRET-CLIENT-VALUE', 'Robin Chat App', ${userId}, array['http://localhost:1/cb'], now())`;
    await testDb.sql`insert into oauth_consent (id, client_id, user_id, scopes, created_at)
      values ('co-1', 'client-robin', ${userId}, array['openid'], now())`;
    await testDb.sql`insert into oauth_refresh_token (id, token, client_id, user_id, scopes, created_at)
      values ('rt-1', 'SECRET-REFRESH-VALUE', 'client-robin', ${userId}, array['openid'], now())`;
    await testDb.sql`insert into oauth_access_token (id, token, client_id, user_id, scopes, created_at)
      values ('at-1', 'SECRET-ACCESS-VALUE', 'client-robin', ${userId}, array['openid'], now())`;
  }

  it('exports every personal record of the learner and no secret', async () => {
    await seedMcpApp(robin.id);
    const [{ accessToken }] = await testDb.sql`select access_token as "accessToken" from account where user_id = ${robin.id}`;
    const [{ sessionToken }] = await testDb.sql`select token as "sessionToken" from session where user_id = ${robin.id} limit 1`;

    const response = await robin.browser.request('/api/account/export-all');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('lessonfolk-my-data.json');
    const raw = await response.text();
    const data = JSON.parse(raw);

    expect(data).toMatchObject({ format: 'lessonfolk-personal-data', version: 1 });
    expect(data.user).toMatchObject({ id: robin.id, name: 'Robin Tester', email: 'robin@example.test' });
    expect(data.signInAccounts).toHaveLength(1);
    expect(data.signInAccounts[0]).toMatchObject({ provider: 'fake', providerAccountId: 'fake-robin', hasPassword: false });
    expect(data.sessions.length).toBeGreaterThan(0);
    expect(data.mcp.clientsRegisteredByYou).toMatchObject([{ clientId: 'client-robin', name: 'Robin Chat App', hasClientSecret: true }]);
    expect(data.mcp.consents).toMatchObject([{ clientId: 'client-robin', appName: 'Robin Chat App', scopes: ['openid'] }]);
    expect(data.mcp.accessTokens).toHaveLength(1);
    expect(data.mcp.refreshTokens).toHaveLength(1);
    expect(data.learner.profile.name).toBe('Alex');
    expect(data.lessonProgress).toHaveLength(2);
    expect(data.progressEvents.length).toBeGreaterThan(0);

    // No secret, whatever the field: tokens, client secret, session token.
    for (const secret of ['SECRET-CLIENT-VALUE', 'SECRET-REFRESH-VALUE', 'SECRET-ACCESS-VALUE', sessionToken, ...(accessToken ? [accessToken] : [])]) {
      expect(raw).not.toContain(secret);
    }
    expect(raw).not.toMatch(/"(password|accessToken|refreshToken|idToken|token|clientSecret)"/);
  });

  it('gives the full export to the signed-in learner only', async () => {
    const anonymous = await new Browser(server.url).request('/api/account/export-all');
    expect(anonymous.status).toBe(401);
    const samData = JSON.parse(await (await sam.browser.request('/api/account/export-all')).text());
    expect(samData.user.email).toBe('sam@example.test');
    expect(JSON.stringify(samData)).not.toContain('robin@example.test');
    expect(JSON.stringify(samData)).not.toContain('client-robin');
    // The URL takes no user id: there is no way to ask for somebody else's data.
    expect((await sam.browser.request(`/api/account/export-all?userId=${robin.id}`)).status).toBe(200);
    expect(JSON.parse(await (await sam.browser.request(`/api/account/export-all?userId=${robin.id}`)).text()).user.id).toBe(sam.id);
  });

  it('asks for a recent sign-in before the full export and before deleting', async () => {
    const pat = await signIn({ sub: 'fake-pat', name: 'Pat Old', email: 'pat@example.test' });
    expect((await pat.browser.request('/api/account/export-all')).status).toBe(200);

    await testDb.sql`update session set created_at = now() - interval '1 hour' where user_id = ${pat.id}`;
    const reauth = '/sign-in?reauth=1&next=%2Faccount';
    const exported = await pat.browser.request('/api/account/export-all');
    expect(exported.status).toBe(303);
    expect(location(exported)).toBe(reauth);
    const deleted = await pat.browser.post('/api/account/delete', { confirm: 'delete' });
    expect(deleted.status).toBe(303);
    expect(location(deleted)).toBe(reauth);
    expect((await rowCounts(testDb.db, pat.id)).user).toBe(1);

    // The sign-in page lets a signed-in learner sign in again for this.
    expect(await text(await pat.browser.request(reauth))).toContain('Sign in again to continue');
    // Signing in again starts a fresh session, and both work.
    fake.signInAs({ sub: 'fake-pat', name: 'Pat Old', email: 'pat@example.test' });
    const start = await pat.browser.post('/sign-in/fake', { next: '/account' });
    const approved = await fetch(location(start), { redirect: 'manual' });
    await pat.browser.request(location(approved));
    expect((await pat.browser.request('/api/account/export-all')).status).toBe(200);
    expect(location(await pat.browser.post('/api/account/delete', { confirm: 'delete' }))).toBe('/account?deleted=1');
  });

  it('links the privacy notice from the footer and the account page', async () => {
    const privacy = await text(await new Browser(server.url).request('/privacy'));
    expect(privacy).toContain('What is collected');
    expect(privacy).toContain('How long');
    expect(privacy).toContain('Where it is stored');
    expect(privacy).toContain('IP address');
    const account = await (await robin.browser.request('/account')).text();
    expect(account).toContain('href="/privacy"');
    expect(account).toContain('href="/api/account/export-all"');
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

    // Nothing mentions the user any more, in any table, not even the MCP apps they registered or allowed.
    expect(await leftovers(testDb.sql, [robin.id, 'robin@example.test'])).toEqual({});
    expect(await testDb.sql`select 1 from oauth_client where client_id = 'client-robin'`).toHaveLength(0);

    const samRows = await rowCounts(testDb.db, sam.id);
    expect(samRows).toMatchObject({ user: 1, learner: 1, lessonProgress: 3 });
  });
});
