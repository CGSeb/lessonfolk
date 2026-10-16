/**
 * Database test: runs against a real Postgres (see docs/testing.md). Checks the data
 * migration that renamed the course `build-with-ai` to `how-ai-apps-work`.
 */
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { MIGRATIONS_DIR } from './connection.ts';
import { learner, lessonProgress, user } from './schema.ts';
import { createTestDatabase, type TestDatabase } from './testing.ts';

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb?.drop();
});

it('moves progress, current lesson and path of build-with-ai to how-ai-apps-work', async () => {
  const userId = 'renamed-course-learner';
  await testDb.db.insert(user).values({ id: userId, name: 'Alex', email: 'rename@example.com' });
  await testDb.db.insert(learner).values({
    userId,
    path: ['ai-foundations', 'build-with-ai', 'ai-agents-and-tools'],
    currentLessonId: 'build-with-ai/02-system-prompts',
  });
  await testDb.db.insert(lessonProgress).values([
    { userId, lessonId: 'build-with-ai/01-how-an-api-call-works', status: 'done' },
    { userId, lessonId: 'build-with-ai/02-system-prompts', status: 'in_progress' },
    { userId, lessonId: 'ai-foundations/01-what-is-ai', status: 'done' },
  ]);

  const migration = readFileSync(`${MIGRATIONS_DIR}/0005_rename_build_with_ai_course.sql`, 'utf8');
  for (const statement of migration.split('--> statement-breakpoint')) {
    await testDb.sql.unsafe(statement);
  }

  const [row] = await testDb.db.select().from(learner).where(eq(learner.userId, userId));
  expect(row.path).toEqual(['ai-foundations', 'how-ai-apps-work', 'ai-agents-and-tools']);
  expect(row.currentLessonId).toBe('how-ai-apps-work/02-system-prompts');

  const lessons = await testDb.db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId));
  expect(lessons.map((l) => l.lessonId).sort()).toEqual([
    'ai-foundations/01-what-is-ai',
    'how-ai-apps-work/01-how-an-api-call-works',
    'how-ai-apps-work/02-system-prompts',
  ]);
});
