/**
 * Database test: runs against a real Postgres (see docs/testing.md). This file
 * gets its own fresh database with every migration applied.
 */
import { asc, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from './connection.ts';
import { learner, lessonProgress, progressEvent } from './schema.ts';
import { createTestDatabase, type TestDatabase } from './testing.ts';

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb?.drop();
});

describe('migrations', () => {
  it('create the progress tables', async () => {
    const rows = await testDb.sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`;
    expect(rows.map((r) => r.table_name)).toEqual(['learner', 'lesson_progress', 'progress_event']);
  });

  it('are recorded, so running them again changes nothing', async () => {
    const before = await testDb.sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    expect(before[0].n).toBeGreaterThan(0);
    await runMigrations(testDb.url);
    const after = await testDb.sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    expect(after[0].n).toBe(before[0].n);
  });
});

describe('progress tables', () => {
  const userId = 'learner-1';

  it('store a learner with a profile and a path', async () => {
    await testDb.db.insert(learner).values({
      userId,
      profile: { name: 'Alex', level: 'beginner', interests: ['understanding-ai'] },
      path: ['ai-foundations'],
      pathReason: 'Start with how AI works.',
      pathUpdatedAt: new Date('2026-10-04T00:00:00Z'),
      currentLessonId: 'ai-foundations/02-how-machines-learn',
    });

    const [row] = await testDb.db.select().from(learner).where(eq(learner.userId, userId));
    expect(row.profile).toEqual({ name: 'Alex', level: 'beginner', interests: ['understanding-ai'] });
    expect(row.path).toEqual(['ai-foundations']);
    expect(row.currentLessonId).toBe('ai-foundations/02-how-machines-learn');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('key lesson progress by learner and lesson', async () => {
    await testDb.db.insert(lessonProgress).values({
      userId,
      lessonId: 'ai-foundations/01-what-is-ai',
      status: 'done',
      startedAt: new Date('2026-10-04T09:00:00Z'),
      completedAt: new Date('2026-10-04T09:20:00Z'),
      score: 0.8,
      notes: 'Understood narrow vs general AI quickly.',
    });

    await expect(
      testDb.db.insert(lessonProgress).values({ userId, lessonId: 'ai-foundations/01-what-is-ai', status: 'in_progress' }),
    ).rejects.toMatchObject({ cause: { code: '23505' } }); // unique_violation

    const rows = await testDb.db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBeCloseTo(0.8);
  });

  it('reject unknown statuses, scores outside 0–1 and unknown learners', async () => {
    const insert = (values: Partial<typeof lessonProgress.$inferInsert>) =>
      testDb.db.insert(lessonProgress).values({ userId, lessonId: 'x/01', status: 'in_progress', ...values } as never);

    await expect(insert({ status: 'finished' as never })).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(insert({ score: 1.5 })).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(insert({ userId: 'nobody' })).rejects.toMatchObject({ cause: { code: '23503' } });
  });

  it('log progress events in order', async () => {
    await testDb.db.insert(progressEvent).values([
      { userId, action: 'lesson.started', payload: { lessonId: 'ai-foundations/02-how-machines-learn' }, client: 'claude-code' },
      { userId, action: 'lesson.completed', payload: { lessonId: 'ai-foundations/01-what-is-ai', score: 0.8 } },
    ]);

    const events = await testDb.db
      .select()
      .from(progressEvent)
      .where(eq(progressEvent.userId, userId))
      .orderBy(asc(progressEvent.id));
    expect(events.map((e) => e.action)).toEqual(['lesson.started', 'lesson.completed']);
    expect(events[0].client).toBe('claude-code');
    expect(events[1].payload).toEqual({ lessonId: 'ai-foundations/01-what-is-ai', score: 0.8 });
  });

  it('delete a learner with all their progress', async () => {
    await testDb.db.delete(learner).where(eq(learner.userId, userId));
    const [{ lessons }] = await testDb.db.select({ lessons: sql<number>`count(*)::int` }).from(lessonProgress);
    const [{ events }] = await testDb.db.select({ events: sql<number>`count(*)::int` }).from(progressEvent);
    expect({ lessons, events }).toEqual({ lessons: 0, events: 0 });
  });
});
