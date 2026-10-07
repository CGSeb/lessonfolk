/**
 * LESSONFOLK_AUTH=none with Postgres: the single local learner is created on
 * first start, and only once.
 */
import { eq } from 'drizzle-orm';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { learner, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { PROGRESS_FIXTURES, startDashboard } from './server';

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb?.drop();
});

describe('LESSONFOLK_AUTH=none with a database', () => {
  it('creates the local learner on first start, and keeps it on the next ones', async () => {
    expect(await testDb.db.select().from(user)).toHaveLength(0);

    for (let start = 1; start <= 2; start++) {
      const server = await startDashboard(join(PROGRESS_FIXTURES, 'minimal'), { DATABASE_URL: testDb.url });
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
});
