/**
 * Sign-in with LESSONFOLK_AUTH=oauth, end to end: the built server, a fresh
 * Postgres database and the fake OAuth provider (fake-oauth.ts). The browser is
 * played by fetch with a small cookie jar, following each redirect by hand.
 */
import { and, eq } from 'drizzle-orm';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { account, learner, session, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { startFakeOAuth, type FakeOAuthServer } from './fake-oauth';
import { freePort, PROGRESS_FIXTURES, startDashboard, visibleText, type DashboardServer } from './server';

/** Cookies the dashboard set, sent back to the dashboard only. */
class Browser {
  private cookies = new Map<string, string>();
  constructor(private readonly origin: string) {}

  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const sameOrigin = new URL(url, this.origin).origin === this.origin;
    if (sameOrigin && this.cookies.size > 0) {
      headers.set('Cookie', [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '));
    }
    const response = await fetch(new URL(url, this.origin), { ...init, headers, redirect: 'manual' });
    if (sameOrigin) {
      for (const cookie of response.headers.getSetCookie()) {
        const [pair, ...attributes] = cookie.split(';');
        const [name, ...rest] = pair.split('=');
        const value = rest.join('=');
        const expired = attributes.some((a) => /^\s*max-age=0\s*$/i.test(a)) || value === '';
        if (expired) this.cookies.delete(name.trim());
        else this.cookies.set(name.trim(), value);
      }
    }
    return response;
  }

  /** Submit a form of the dashboard, as a browser would (with its Origin header). */
  post(path: string, fields: Record<string, string> = {}): Promise<Response> {
    return this.request(path, {
      method: 'POST',
      headers: { Origin: this.origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
  }

  async me(): Promise<{ authMode: string; user: { id: string; name: string; email: string } | null }> {
    return (await this.request('/api/me')).json();
  }

  cookieNames(): string[] {
    return [...this.cookies.keys()];
  }
}

const location = (response: Response) => {
  const value = response.headers.get('location');
  if (!value) throw new Error(`Expected a redirect, got ${response.status}`);
  return value;
};

let testDb: TestDatabase;
let fake: FakeOAuthServer;
let server: DashboardServer;
let baseURL: string;

beforeAll(async () => {
  testDb = await createTestDatabase();
  fake = await startFakeOAuth();
  const port = await freePort();
  baseURL = `http://127.0.0.1:${port}`;
  server = await startDashboard(join(PROGRESS_FIXTURES, 'minimal'), {
    PORT: String(port),
    DATABASE_URL: testDb.url,
    LESSONFOLK_AUTH: 'oauth',
    LESSONFOLK_BASE_URL: baseURL,
    BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234567890',
    LESSONFOLK_TEST_OAUTH_URL: fake.url,
    // Fake GitHub credentials: enough to list GitHub and build its authorize URL.
    GITHUB_CLIENT_ID: 'test-github-client-id',
    GITHUB_CLIENT_SECRET: 'test-github-client-secret',
  });
});

afterAll(async () => {
  await server?.stop();
  await fake?.stop();
  await testDb?.drop();
});

/** Sign in through the fake provider, checking every hop. Returns where the app sent us at the end. */
async function signIn(browser: Browser, next: string): Promise<string> {
  const start = await browser.post('/sign-in/fake', { next });
  expect(start.status).toBe(303);
  const authorize = new URL(location(start));
  expect(authorize.origin).toBe(fake.url);
  expect(authorize.pathname).toBe('/authorize');
  expect(authorize.searchParams.get('redirect_uri')).toBe(`${baseURL}/api/auth/callback/fake`);
  expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');

  const approved = await fetch(authorize, { redirect: 'manual' });
  expect(approved.status).toBe(302);
  const callback = location(approved);
  expect(callback.startsWith(`${baseURL}/api/auth/callback/fake?`)).toBe(true);

  const done = await browser.request(callback);
  expect(done.status).toBe(302);
  return location(done);
}

describe('the sign-in page', () => {
  it('lists only the configured providers', async () => {
    const response = await new Browser(server.url).request('/sign-in');
    expect(response.status).toBe(200);
    const text = visibleText(await response.text());
    expect(text).toContain('Sign in to LessonFolk');
    expect(text).toContain('Sign in with GitHub');
    expect(text).toContain('Sign in with Test provider');
    expect(text).not.toContain('Google');
  });

  it('refuses a provider that is not configured', async () => {
    const response = await new Browser(server.url).post('/sign-in/google');
    expect(response.status).toBe(404);
  });

  it('sends GitHub sign-ins back to LESSONFOLK_BASE_URL', async () => {
    const response = await new Browser(server.url).post('/sign-in/github', { next: '/' });
    expect(response.status).toBe(303);
    const authorize = new URL(location(response));
    expect(authorize.origin).toBe('https://github.com');
    expect(authorize.searchParams.get('client_id')).toBe('test-github-client-id');
    expect(authorize.searchParams.get('redirect_uri')).toBe(`${baseURL}/api/auth/callback/github`);
  });

  it('refuses a form posted from another site', async () => {
    const response = await fetch(`${server.url}/sign-in/fake`, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'next=/',
      redirect: 'manual',
    });
    expect(response.status).toBe(403);
  });
});

describe('signing in and out', () => {
  const browser = () => new Browser(server.url);
  let robin: Browser;
  let robinId: string;

  it('keeps public pages open when signed out, with a sign-in link', async () => {
    robin = browser();
    expect(await robin.me()).toEqual({ authMode: 'oauth', user: null });
    const home = await robin.request('/');
    expect(home.status).toBe(200);
    const html = await home.text();
    expect(html).toContain('href="/sign-in?next=%2F"');
    expect(visibleText(html)).not.toContain('Sign out');
  });

  it('signs in through the provider and creates the user, account and learner', async () => {
    fake.signInAs({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });
    const landing = await signIn(robin, '/courses?theme=understanding-ai');
    expect(landing).toBe('/courses?theme=understanding-ai');
    expect(fake.requests).toEqual(expect.arrayContaining(['GET /authorize', 'POST /token', 'GET /userinfo']));

    const me = await robin.me();
    expect(me.user).toMatchObject({ name: 'Robin Tester', email: 'robin@example.test' });
    robinId = me.user!.id;
    expect(robinId).not.toBe('local');

    const [row] = await testDb.db.select().from(user).where(eq(user.id, robinId));
    expect(row).toMatchObject({ name: 'Robin Tester', email: 'robin@example.test', emailVerified: true });
    const accounts = await testDb.db.select().from(account).where(eq(account.userId, robinId));
    expect(accounts.map((a) => [a.providerId, a.accountId])).toEqual([['fake', 'fake-robin']]);
    expect(await testDb.db.select().from(learner).where(eq(learner.userId, robinId))).toHaveLength(1);
  });

  it('shows who is signed in on every page', async () => {
    const home = visibleText(await (await robin.request('/')).text());
    expect(home).toContain('Signed in as Robin Tester');
    expect(home).toContain('Sign out');
    // Signed in: the sign-in page sends you on.
    const signInPage = await robin.request('/sign-in?next=/courses');
    expect(signInPage.status).toBe(303);
    expect(location(signInPage)).toBe('/courses');
  });

  it('keeps users apart', async () => {
    const sam = browser();
    fake.signInAs({ sub: 'fake-sam', name: 'Sam Other', email: 'sam@example.test' });
    await signIn(sam, '/');
    const samMe = await sam.me();
    expect(samMe.user).toMatchObject({ name: 'Sam Other' });
    expect(samMe.user!.id).not.toBe(robinId);
    expect((await robin.me()).user!.id).toBe(robinId);
  });

  it('signs out', async () => {
    const response = await robin.post('/sign-out');
    expect(response.status).toBe(303);
    expect(location(response)).toBe('/');
    expect(await robin.me()).toEqual({ authMode: 'oauth', user: null });
    expect(await testDb.db.select().from(session).where(eq(session.userId, robinId))).toHaveLength(0);
  });

  it('finds the same user when they sign in again', async () => {
    fake.signInAs({ sub: 'fake-robin', name: 'Robin Tester', email: 'robin@example.test' });
    await signIn(robin, '/');
    expect((await robin.me()).user!.id).toBe(robinId);
    const accounts = await testDb.db
      .select()
      .from(account)
      .where(and(eq(account.providerId, 'fake'), eq(account.accountId, 'fake-robin')));
    expect(accounts).toHaveLength(1);
  });

  it('ignores a forged session cookie', async () => {
    const forged = new Browser(server.url);
    const response = await fetch(`${server.url}/api/me`, {
      headers: { Cookie: `${robin.cookieNames().find((n) => n.includes('session_token'))}=forged.value` },
    });
    expect((await response.json()).user).toBeNull();
    expect(await forged.me()).toEqual({ authMode: 'oauth', user: null });
  });
});
