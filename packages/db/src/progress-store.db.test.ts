/**
 * Database test: the Postgres ProgressStore against a real Postgres (see docs/testing.md).
 * This file gets its own fresh database with every migration applied.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type ProgressStore, type TutorCourseRef, ProgressStoreError, loadCatalog } from '@lessonfolk/core';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createPostgresProgressStore, fromTimestamp, toTimestamp } from './progress-store.ts';
import { learner, lessonProgress, progressEvent, user } from './schema.ts';
import { createTestDatabase, type TestDatabase } from './testing.ts';

const fixtureCourses = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));
const exampleFile = fileURLToPath(new URL('../../../docs/progress.example.json', import.meta.url));

// The pinned AI Foundations fixture (beginner, 3 lessons in a chain), plus an intermediate
// course that needs it, to exercise paths and the level check.
const courses: TutorCourseRef[] = [
  ...loadCatalog('en', fixtureCourses),
  {
    id: 'prompting',
    level: 'intermediate',
    theme: 'using-ai',
    prerequisites: ['ai-foundations'],
    lessons: [{ id: 'prompting/01-basics', prerequisites: ['ai-foundations/03-what-is-an-llm'] }],
  },
];
const L1 = 'ai-foundations/01-what-is-ai';
const L2 = 'ai-foundations/02-how-machines-learn';
const L3 = 'ai-foundations/03-what-is-an-llm';
const TODAY = '2026-10-07';
const at = { today: TODAY, client: 'test' };

let testDb: TestDatabase;
let store: ProgressStore;
let userCount = 0;

beforeAll(async () => {
  testDb = await createTestDatabase();
  store = createPostgresProgressStore(testDb.db, { courses });
});

afterAll(async () => {
  await testDb?.drop();
});

/** A fresh user row (as sign-in creates it) for each test. */
async function newUser(): Promise<string> {
  const id = `user-${++userCount}`;
  await testDb.db.insert(user).values({ id, name: `User ${userCount}`, email: `${id}@example.com` });
  return id;
}

async function events(userId: string) {
  return testDb.db
    .select({ action: progressEvent.action, payload: progressEvent.payload, client: progressEvent.client })
    .from(progressEvent)
    .where(eq(progressEvent.userId, userId))
    .orderBy(asc(progressEvent.id));
}

/** Everything stored for a user, to check that a rejected write changed nothing. */
async function snapshot(userId: string) {
  const learners = await testDb.db.select().from(learner).where(eq(learner.userId, userId));
  const lessons = await testDb.db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)).orderBy(asc(lessonProgress.lessonId));
  return { learners, lessons, events: await events(userId) };
}

async function expectRejected(userId: string, write: () => Promise<unknown>, code: string) {
  const before = await snapshot(userId);
  const error = await write().then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ProgressStoreError);
  expect((error as ProgressStoreError).code).toBe(code);
  expect(await snapshot(userId)).toEqual(before);
  return error as ProgressStoreError;
}

describe('dates', () => {
  it('store ISO dates at midnight UTC and read them back as dates', () => {
    expect(toTimestamp('2026-10-04', 'f')).toEqual(new Date('2026-10-04T00:00:00Z'));
    expect(fromTimestamp(new Date('2026-10-04T00:00:00Z'))).toBe('2026-10-04');
    expect(fromTimestamp(new Date('2026-10-04T09:30:00Z'))).toBe('2026-10-04T09:30:00.000Z');
    expect(toTimestamp(undefined, 'f')).toBeNull();
    expect(() => toTimestamp('yesterday', 'f')).toThrow(ProgressStoreError);
  });
});

describe('getProgress', () => {
  it('returns empty progress for a learner with nothing saved', async () => {
    const userId = await newUser();
    expect(await store.getProgress(userId)).toEqual({ version: 1, profile: {}, current: null, lessons: {} });
  });
});

describe('writes', () => {
  let userId: string;
  beforeEach(async () => {
    userId = await newUser();
  });

  it('walk a learner through onboarding, a path and a lesson, logging every change', async () => {
    await store.setProfile(userId, { name: 'Alex', experience: 'none', level: 'beginner', interests: ['understanding-ai'] }, at);
    await store.setPath(userId, ['ai-foundations'], 'Start with how AI works.', at);
    await store.startLesson(userId, L1, at);
    await store.saveNotes(userId, L1, 'Stopped after the first key idea.', at);
    const progress = await store.completeLesson(userId, L1, { score: 0.8, notes: 'Easy.' }, at);

    expect(progress).toEqual({
      version: 1,
      profile: { name: 'Alex', experience: 'none', level: 'beginner', interests: ['understanding-ai'] },
      path: ['ai-foundations'],
      pathReason: 'Start with how AI works.',
      pathUpdatedAt: TODAY,
      current: null,
      lessons: { [L1]: { status: 'done', startedAt: TODAY, completedAt: TODAY, score: 0.8, notes: 'Easy.' } },
    });
    expect(await store.getProgress(userId)).toEqual(progress);
    expect((await events(userId)).map((e) => e.action)).toEqual([
      'profile.updated',
      'path.updated',
      'lesson.started',
      'lesson.notes_saved',
      'lesson.completed',
    ]);
    expect((await events(userId))[4]).toEqual({
      action: 'lesson.completed',
      payload: { lessonId: L1, score: 0.8, notes: 'Easy.' },
      client: 'test',
    });
  });

  it('create the learner row on the first write when sign-in has not', async () => {
    await store.startLesson(userId, L1, at);
    const [row] = await testDb.db.select().from(learner).where(eq(learner.userId, userId));
    expect(row.currentLessonId).toBe(L1);
  });

  it('update the profile field by field, removing fields set to null', async () => {
    await store.setProfile(userId, { name: 'Alex', level: 'beginner', interests: ['understanding-ai'] }, at);
    const progress = await store.setProfile(userId, { level: 'intermediate', interests: null }, at);
    expect(progress.profile).toEqual({ name: 'Alex', level: 'intermediate' });
  });

  it('skip lessons by hand and after a level check', async () => {
    await store.skipLesson(userId, L1, 'Knew it already.', at);
    await store.setProfile(userId, { level: 'intermediate' }, at);
    const progress = await store.placementSkip(userId, 'ai-foundations', at);
    expect(progress.lessons).toEqual({
      [L1]: { status: 'skipped', completedAt: TODAY, notes: 'Knew it already.' },
      [L2]: { status: 'skipped', completedAt: TODAY, notes: 'placement' },
      [L3]: { status: 'skipped', completedAt: TODAY, notes: 'placement' },
    });
    const log = await events(userId);
    expect(log.at(-1)).toMatchObject({ action: 'course.placement_skipped', payload: { courseId: 'ai-foundations', lessonIds: [L2, L3] } });
  });

  it('only raise the score in a review, logging every review', async () => {
    await store.startLesson(userId, L1, at);
    await store.completeLesson(userId, L1, { score: 0.6, notes: 'Hard.' }, at);
    expect((await store.recordReviewScore(userId, L1, 0.9, at)).lessons[L1].score).toBe(0.9);
    expect((await store.recordReviewScore(userId, L1, 0.5, at)).lessons[L1].score).toBe(0.9);
    const reviews = (await events(userId)).filter((e) => e.action === 'lesson.reviewed');
    expect(reviews.map((e) => e.payload)).toEqual([
      { lessonId: L1, score: 0.9, previousScore: 0.6, savedScore: 0.9 },
      { lessonId: L1, score: 0.5, previousScore: 0.9, savedScore: 0.9 },
    ]);
  });
});

describe('rejected writes leave the data unchanged', () => {
  let userId: string;
  beforeEach(async () => {
    userId = await newUser();
    await store.setProfile(userId, { name: 'Alex', level: 'beginner' }, at);
    await store.startLesson(userId, L1, at);
  });

  it('unknown user', async () => {
    const error = await store.startLesson('nobody', L1, at).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: 'unknown_user', details: { userId: 'nobody' } });
    expect(await testDb.db.select().from(learner).where(eq(learner.userId, 'nobody'))).toEqual([]);
  });

  it('unknown lesson or course', async () => {
    await expectRejected(userId, () => store.startLesson(userId, 'ai-foundations/99-nope', at), 'unknown_lesson');
    await expectRejected(userId, () => store.saveNotes(userId, 'ai-foundations/99-nope', 'x', at), 'unknown_lesson');
  });

  it('prerequisites not met', async () => {
    const error = await expectRejected(userId, () => store.startLesson(userId, L3, at), 'prerequisites_not_met');
    expect(error.details).toMatchObject({ lessonId: L3, missing: [L2], userId });
    await expectRejected(userId, () => store.completeLesson(userId, L2, { score: 1, notes: 'x' }, at), 'prerequisites_not_met');
  });

  it('finished lessons cannot be started, completed or skipped again', async () => {
    await store.completeLesson(userId, L1, { score: 0.8, notes: 'Easy.' }, at);
    await expectRejected(userId, () => store.startLesson(userId, L1, at), 'already_finished');
    await expectRejected(userId, () => store.completeLesson(userId, L1, { score: 1, notes: 'x' }, at), 'already_finished');
    await expectRejected(userId, () => store.skipLesson(userId, L1, 'x', at), 'already_finished');
  });

  it('bad scores and notes', async () => {
    await expectRejected(userId, () => store.completeLesson(userId, L1, { score: 1.5, notes: 'x' }, at), 'invalid_score');
    await expectRejected(userId, () => store.completeLesson(userId, L1, { score: 0.5, notes: '  ' }, at), 'invalid_notes');
    await expectRejected(userId, () => store.skipLesson(userId, L2, 'placement', at), 'invalid_notes');
    await expectRejected(userId, () => store.saveNotes(userId, L1, 'placement', at), 'invalid_notes');
    await expectRejected(userId, () => store.saveNotes(userId, L2, 'Not started yet.', at), 'not_started');
    await expectRejected(userId, () => store.recordReviewScore(userId, L1, 0.9, at), 'not_done');
  });

  it('invalid paths', async () => {
    const error = await expectRejected(userId, () => store.setPath(userId, ['prompting'], 'Go.', at), 'invalid_path');
    expect(error.details.issues).toEqual([{ code: 'missing_prerequisite', courseId: 'prompting', prerequisiteId: 'ai-foundations' }]);
    await expectRejected(userId, () => store.setPath(userId, ['ai-foundations'], ' ', at), 'invalid_notes');
  });

  it('level check outside the rules', async () => {
    await expectRejected(userId, () => store.placementSkip(userId, 'ai-foundations', at), 'not_below_level');
    await expectRejected(userId, () => store.placementSkip(userId, 'nope', at), 'unknown_course');
  });

  it('invalid profile changes', async () => {
    const error = await expectRejected(userId, () => store.setProfile(userId, { level: 'expert' }, at), 'invalid_profile');
    expect(error.details.problems?.[0]).toMatch(/^level:/);
  });

  it('invalid imports', async () => {
    await expectRejected(userId, () => store.importProgress(userId, '{ not json', at), 'invalid_progress');
    await expectRejected(userId, () => store.importProgress(userId, { lessons: { [L1]: { status: 'finished' } } }, at), 'invalid_progress');
    await expectRejected(userId, () => store.importProgress(userId, { version: 2 }, at), 'invalid_progress');
    await expectRejected(
      userId,
      () => store.importProgress(userId, { lessons: { [L1]: { status: 'done', completedAt: 'last week' } } }, at),
      'invalid_progress',
    );
  });
});

describe('import and export', () => {
  const exampleText = readFileSync(exampleFile, 'utf8');

  it('export of an imported progress.example.json matches the input', async () => {
    const userId = await newUser();
    const imported = await store.importProgress(userId, exampleText, { client: 'test' });
    const exported = await store.exportProgress(userId);
    expect(JSON.parse(exported)).toEqual(JSON.parse(exampleText));
    expect(imported).toEqual(JSON.parse(exampleText));
    expect(exported).toBe(`${JSON.stringify(JSON.parse(exampleText), null, 2)}\n`);
    expect(await events(userId)).toEqual([
      { action: 'progress.imported', payload: { mode: 'replace', lessons: 2, replacedLessons: 0 }, client: 'test' },
    ]);
  });

  it('replace the saved progress, keeping the change log', async () => {
    const userId = await newUser();
    await store.setProfile(userId, { name: 'Sam', level: 'advanced' }, at);
    await store.skipLesson(userId, L3, 'Knew it.', at);
    await store.importProgress(userId, JSON.parse(exampleText), at);
    expect(await store.getProgress(userId)).toEqual(JSON.parse(exampleText));
    expect((await events(userId)).map((e) => e.action)).toEqual(['profile.updated', 'lesson.skipped', 'progress.imported']);

    // Importing a progress without a path or current lesson clears them.
    const progress = await store.importProgress(userId, { profile: { name: 'Sam' } }, at);
    expect(progress).toEqual({ version: 1, profile: { name: 'Sam' }, current: null, lessons: {} });
  });

  it('keep full timestamps and drop fields the tables do not hold', async () => {
    const userId = await newUser();
    const progress = await store.importProgress(userId, {
      version: 1,
      profile: { name: 'Sam', favouriteColour: 'green' },
      current: L1,
      extra: 'dropped',
      lessons: { [L1]: { status: 'in_progress', startedAt: '2026-10-04T09:30:00.000Z', mood: 'dropped' } },
    });
    expect(progress).toEqual({
      version: 1,
      profile: { name: 'Sam', favouriteColour: 'green' },
      current: L1,
      lessons: { [L1]: { status: 'in_progress', startedAt: '2026-10-04T09:30:00.000Z' } },
    });
  });

  it('export empty progress for a learner with nothing saved', async () => {
    const userId = await newUser();
    expect(JSON.parse(await store.exportProgress(userId))).toEqual({ version: 1, profile: {}, current: null, lessons: {} });
  });
});

describe('deleteLearner', () => {
  it('deletes the progress and its log, and keeps the user', async () => {
    const userId = await newUser();
    await store.startLesson(userId, L1, at);
    expect(await store.deleteLearner(userId)).toBe(true);
    expect(await snapshot(userId)).toEqual({ learners: [], lessons: [], events: [] });
    expect(await testDb.db.select().from(user).where(eq(user.id, userId))).toHaveLength(1);
    expect(await store.getProgress(userId)).toEqual({ version: 1, profile: {}, current: null, lessons: {} });
    expect(await store.deleteLearner(userId)).toBe(false);
  });
});
