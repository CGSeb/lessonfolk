/**
 * The demo account (LESSONFOLK_DEMO_EMAIL / LESSONFOLK_DEMO_PASSWORD): the one account that signs in
 * with a password, for the plugin directory's reviewers. The built server and a fresh database.
 */
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { account, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { freePort, startDashboard, visibleText, type DashboardServer } from './server';

const EMAIL = 'reviewer@demo.example';
const PASSWORD = 'a-long-demo-password-1234';

let testDb: TestDatabase;
let server: DashboardServer;
let withoutDemo: DashboardServer;

const env = (port: number, extra: Record<string, string> = {}) => ({
  PORT: String(port),
  DATABASE_URL: testDb.url,
  LESSONFOLK_AUTH: 'oauth',
  LESSONFOLK_BASE_URL: `http://127.0.0.1:${port}`,
  BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234567890',
  GITHUB_CLIENT_ID: 'test-github-client-id',
  GITHUB_CLIENT_SECRET: 'test-github-client-secret',
  ...extra,
});

beforeAll(async () => {
  testDb = await createTestDatabase();
  server = await startDashboard(env(await freePort(), { LESSONFOLK_DEMO_EMAIL: EMAIL, LESSONFOLK_DEMO_PASSWORD: PASSWORD }));
  withoutDemo = await startDashboard(env(await freePort()));
});

afterAll(async () => {
  await server?.stop();
  await withoutDemo?.stop();
  await testDb?.drop();
});

const post = (base: string, path: string, fields: Record<string, string>) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { Origin: new URL(base).origin, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
  });

const cookies = (response: Response) => response.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

describe('the demo account', () => {
  it('has a form on the sign-in page only when it is set', async () => {
    const text = visibleText(await (await fetch(`${server.url}/sign-in`)).text());
    expect(text).toContain('Demo account');
    expect(visibleText(await (await fetch(`${withoutDemo.url}/sign-in`)).text())).not.toContain('Demo account');
  });

  it('signs in with the right email and password and goes where it was asked', async () => {
    const response = await post(server.url, '/sign-in/demo', { email: EMAIL, password: PASSWORD, next: '/courses' });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/courses');
    const me = await (await fetch(`${server.url}/api/me`, { headers: { Cookie: cookies(response) } })).json();
    expect(me.user).toMatchObject({ email: EMAIL, name: 'Demo reviewer' });
  });

  it('stores a hash of the password, never the password', async () => {
    const [row] = await testDb.db.select({ password: account.password }).from(account).where(eq(account.providerId, 'credential'));
    expect(row.password).toBeTruthy();
    expect(row.password).not.toContain(PASSWORD);
  });

  it('refuses a wrong password, another email and an empty form', async () => {
    for (const fields of [
      { email: EMAIL, password: 'not-the-right-password-12' },
      { email: 'someone@else.example', password: PASSWORD },
      { email: EMAIL, password: '' },
    ]) {
      const response = await post(server.url, '/sign-in/demo', fields);
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toContain('/sign-in?error=sign_in_failed');
      expect(response.headers.getSetCookie().join()).not.toContain('session_token');
    }
  });

  it('lets nobody sign up with a password, and nobody else sign in with one', async () => {
    const body = JSON.stringify({ email: 'new@example.test', password: 'another-long-password-123', name: 'New' });
    const headers = { Origin: server.url, 'Content-Type': 'application/json' };
    const signUp = await fetch(`${server.url}/api/auth/sign-up/email`, { method: 'POST', headers, body });
    expect(signUp.ok).toBe(false);
    expect(await testDb.db.select().from(user).where(eq(user.email, 'new@example.test'))).toHaveLength(0);
  });

  it('does not exist when no demo account is set', async () => {
    const response = await post(withoutDemo.url, '/sign-in/demo', { email: EMAIL, password: PASSWORD });
    expect(response.status).toBe(404);
    const signIn = await fetch(`${withoutDemo.url}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { Origin: withoutDemo.url, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(signIn.ok).toBe(false);
  });
});
