/**
 * Simulates a first tutoring session against the built dashboard: the tutor saves
 * onboarding, a path and a finished lesson through the progress store (Postgres),
 * and each page shows the new state on the next load. Progress is not pushed to
 * open pages; /api/events only announces course file changes.
 */
import type { ProgressStore } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPage, startDashboard, testProgressStore, type DashboardServer } from './server';

const LOCAL = 'local';
const options = { client: 'test', today: '2026-10-04' };

describe('progress saved during a tutoring session', () => {
  let testDb: TestDatabase;
  let server: DashboardServer;
  let store: ProgressStore;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    // Creates the local learner (with nothing saved yet).
    server = await startDashboard({ DATABASE_URL: testDb.url });
    store = testProgressStore(testDb.db);
  });

  afterAll(async () => {
    await server?.stop();
    await testDb?.drop();
  });

  it('starts as a first visit', async () => {
    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome to LessonFolk');
  });

  it('shows onboarding and lesson 1 in progress on the next load', async () => {
    await store.setProfile(LOCAL, { name: 'Robin', experience: 'none', goal: 'curiosity', language: 'en', level: 'beginner' }, options);
    await store.startLesson(LOCAL, 'ai-foundations/01-what-is-ai', options);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome back, Robin!');
    expect(home.text).toContain('Pick up where you left off');
    expect(home.text).toContain('What is AI?');
    expect(home.text).toContain('0 of 3 lessons finished');

    const catalog = await getPage(server, '/courses');
    expect(catalog.text).toContain('In progress');
    expect(catalog.text).toContain('0 of 3 lessons');
  });

  it('shows the completed lesson and lesson 2 next', async () => {
    await store.completeLesson(LOCAL, 'ai-foundations/01-what-is-ai', { score: 0.75, notes: 'Liked the spam filter example.' }, options);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Next up');
    expect(home.text).toContain('How do machines learn?');
    expect(home.text).toContain('1 of 3 lessons finished');

    const course = await getPage(server, '/courses/ai-foundations');
    expect(course.text).toContain('1 of 3 lessons');
    expect(course.text).toContain('Score: 75%');
    expect(course.text).toContain('Liked the spam filter example.');
  });

  it('shows a new path from the tutor', async () => {
    await store.setPath(LOCAL, ['ai-foundations'], 'Start with the foundations.', options);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Your path');
    expect(home.text).toContain('Start with the foundations.');
    expect(home.text).not.toContain('recommend a path');

    const catalog = await getPage(server, '/courses');
    expect(catalog.text).toContain('Recommended for you');
  });

  it('shows a first visit again after a reset', async () => {
    await store.deleteLearner(LOCAL);
    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome to LessonFolk');
  });

  it('keeps the course change stream open', async () => {
    const abort = new AbortController();
    const response = await fetch(`${server.url}/api/events`, { headers: { Accept: 'text/event-stream' }, signal: abort.signal });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
    let text = '';
    while (!text.includes(': connected')) {
      const chunk = await reader.read();
      if (chunk.done) break;
      text += chunk.value;
    }
    expect(text).toContain(': connected');
    abort.abort();
    await reader.cancel().catch(() => {});
  });
});
