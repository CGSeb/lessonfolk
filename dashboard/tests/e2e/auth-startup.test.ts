/**
 * Sign-in startup checks of the built server (scripts/serve.ts), and `none`
 * mode without a database. No Postgres needed.
 */
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expectStartupFailure, getPage, PROGRESS_FIXTURES, startDashboard, type DashboardServer } from './server';

const SECRET = 'test-secret-that-is-long-enough-1234567890';

describe('startup checks', () => {
  it('refuse LESSONFOLK_AUTH=none when the server listens on every address', async () => {
    const { code, output } = await expectStartupFailure({ LESSONFOLK_AUTH: 'none', HOST: '0.0.0.0' });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH=none has no sign-in, so it only runs on 127.0.0.1');
    expect(output).toContain('"0.0.0.0" (from HOST)');
    expect(output).not.toMatch(/listening on/i);
  });

  it('refuse LESSONFOLK_AUTH=none when docker compose publishes the port beyond 127.0.0.1', async () => {
    // Inside the container the server listens on 0.0.0.0; LESSONFOLK_BIND is the published address.
    const { code, output } = await expectStartupFailure({ HOST: '0.0.0.0', LESSONFOLK_BIND: '0.0.0.0' });
    expect(code).toBe(1);
    expect(output).toContain('"0.0.0.0" (from LESSONFOLK_BIND)');
  });

  it('refuse LESSONFOLK_AUTH=oauth without any provider', async () => {
    const { code, output } = await expectStartupFailure({
      LESSONFOLK_AUTH: 'oauth',
      LESSONFOLK_BASE_URL: 'http://localhost:4321',
      BETTER_AUTH_SECRET: SECRET,
    });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH=oauth needs at least one sign-in provider');
    expect(output).not.toMatch(/listening on/i);
  });

  it('refuse an unknown LESSONFOLK_AUTH', async () => {
    const { code, output } = await expectStartupFailure({ LESSONFOLK_AUTH: 'password' });
    expect(code).toBe(1);
    expect(output).toContain('LESSONFOLK_AUTH is "password"');
  });
});

describe('LESSONFOLK_AUTH=none, inside docker compose', () => {
  let server: DashboardServer;

  beforeAll(async () => {
    // What the Docker image does: listen on 0.0.0.0, published on 127.0.0.1 only.
    server = await startDashboard(join(PROGRESS_FIXTURES, 'minimal'), { HOST: '0.0.0.0', LESSONFOLK_BIND: '127.0.0.1' });
  });
  afterAll(async () => {
    await server?.stop();
  });

  it('starts', async () => {
    const page = await getPage(server, '/');
    expect(page.status).toBe(200);
  });
});

describe('LESSONFOLK_AUTH=none', () => {
  let server: DashboardServer;

  beforeAll(async () => {
    server = await startDashboard(join(PROGRESS_FIXTURES, 'minimal'));
  });
  afterAll(async () => {
    await server?.stop();
  });

  it('gives pages and API routes the local learner, without signing in', async () => {
    const me = await fetch(`${server.url}/api/me`).then((r) => r.json());
    expect(me).toEqual({
      authMode: 'none',
      user: { id: 'local', name: 'Local learner', email: 'local@lessonfolk.localhost', image: null },
    });
  });

  it('shows no sign-in or sign-out', async () => {
    const home = await getPage(server, '/');
    expect(home.status).toBe(200);
    expect(home.text).not.toContain('Sign in');
    expect(home.text).not.toContain('Sign out');
  });

  it('has no sign-in page or auth routes', async () => {
    const signIn = await fetch(`${server.url}/sign-in`, { redirect: 'manual' });
    expect(signIn.status).toBe(303);
    expect(new URL(signIn.headers.get('location')!, server.url).pathname).toBe('/');
    expect((await fetch(`${server.url}/api/auth/get-session`)).status).toBe(404);
  });
});
