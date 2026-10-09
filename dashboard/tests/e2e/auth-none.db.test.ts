/**
 * LESSONFOLK_AUTH=none: the single local learner is created in Postgres on first
 * start (once), and every page gets it without signing in.
 */
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { learner, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { getPage, seedProgress, startDashboard, type DashboardServer } from './server';

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb?.drop();
});

describe('LESSONFOLK_AUTH=none', () => {
  it('creates the local learner on first start, and keeps it on the next ones', async () => {
    expect(await testDb.db.select().from(user)).toHaveLength(0);

    for (let start = 1; start <= 2; start++) {
      const server = await startDashboard({ DATABASE_URL: testDb.url });
      try {
        const me = await fetch(`${server.url}/api/me`).then((r) => r.json());
        expect(me.user.id).toBe('local');
      } finally {
        await server.stop();
      }
      const users = await testDb.db.select().from(user);
      expect(users.map((u) => [u.id, u.name])).toEqual([['local', 'Local learner']]);
      expect(await testDb.db.select().from(learner).where(eq(learner.userId, 'local'))).toHaveLength(1);
    }
  });

  describe('a running server', () => {
    let server: DashboardServer;

    beforeAll(async () => {
      server = await startDashboard({ DATABASE_URL: testDb.url });
      await seedProgress(testDb.db, 'local', 'mid-course');
    });
    afterAll(async () => {
      await server?.stop();
    });

    it('gives pages and API routes the local learner, without signing in', async () => {
      const me = await fetch(`${server.url}/api/me`).then((r) => r.json());
      expect(me).toEqual({
        authMode: 'none',
        user: { id: 'local', name: 'Local learner', email: 'local@lessonfolk.localhost' },
      });
    });

    it("shows the local learner's progress, with no sign-in or sign-out", async () => {
      const home = await getPage(server, '/');
      expect(home.status).toBe(200);
      expect(home.text).toContain('Welcome back, Alex!');
      expect(home.text).not.toContain('Sign in');
      expect(home.text).not.toContain('Sign out');
      const course = await getPage(server, '/courses/ai-foundations');
      expect(course.text).toContain('1 of 3 lessons');
      expect(course.text).not.toContain('Sign in');
    });

    it('has no sign-in page or auth routes', async () => {
      const signIn = await fetch(`${server.url}/sign-in`, { redirect: 'manual' });
      expect(signIn.status).toBe(303);
      expect(new URL(signIn.headers.get('location')!, server.url).pathname).toBe('/');
      expect((await fetch(`${server.url}/api/auth/get-session`)).status).toBe(404);
    });
  });

  describe('inside docker compose', () => {
    let server: DashboardServer;

    beforeAll(async () => {
      // What the Docker image does: listen on 0.0.0.0, published on 127.0.0.1 only.
      server = await startDashboard({ DATABASE_URL: testDb.url, HOST: '0.0.0.0', LESSONFOLK_BIND: '127.0.0.1' });
    });
    afterAll(async () => {
      await server?.stop();
    });

    it('starts', async () => {
      const page = await getPage(server, '/');
      expect(page.status).toBe(200);
    });
  });
});
