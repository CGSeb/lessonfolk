/**
 * Simulates a first tutoring session against the built dashboard: the tutor
 * creates .progress/progress.json during onboarding, then marks lesson 1 done.
 * Checks that /api/events announces each write and that the pages reflect it.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPage, startDashboard, type DashboardServer } from './server';

const EVENT_TIMEOUT_MS = 8_000;

/** Reads a Server-Sent Events stream and waits for specific events. */
async function openEvents(server: DashboardServer) {
  const abort = new AbortController();
  const response = await fetch(`${server.url}/api/events`, {
    headers: { Accept: 'text/event-stream' },
    signal: abort.signal,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/event-stream');
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  /** Resolve with the text of the next block matching `pattern`, consuming everything before it. */
  async function waitFor(pattern: RegExp): Promise<string> {
    const deadline = Date.now() + EVENT_TIMEOUT_MS;
    for (;;) {
      const blocks = buffer.split('\n\n');
      for (let i = 0; i < blocks.length - 1; i++) {
        if (pattern.test(blocks[i])) {
          buffer = blocks.slice(i + 1).join('\n\n');
          return blocks[i];
        }
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`No SSE block matching ${pattern} within ${EVENT_TIMEOUT_MS} ms; got:\n${buffer}`);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const chunk = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Timed out waiting for ${pattern}; got:\n${buffer}`)), remaining);
        }),
      ]).finally(() => clearTimeout(timer));
      if (chunk.done) throw new Error(`Event stream closed while waiting for ${pattern}`);
      buffer += chunk.value;
    }
  }

  return {
    waitFor,
    close() {
      abort.abort();
      void reader.cancel().catch(() => {});
    },
  };
}

const progressFile = (lessons: Record<string, unknown>, current: string | null) =>
  JSON.stringify(
    {
      version: 1,
      profile: { name: 'Robin', experience: 'none', goal: 'curiosity', language: 'en' },
      current,
      lessons,
    },
    null,
    2,
  );

describe('live updates during a tutoring session', () => {
  let tempRoot: string;
  let progressDir: string;
  let server: DashboardServer;
  let events: Awaited<ReturnType<typeof openEvents>>;

  beforeAll(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'apprentice-e2e-'));
    // Like a fresh clone: .progress/ has no progress.json yet.
    progressDir = join(tempRoot, '.progress');
    mkdirSync(progressDir);
    server = await startDashboard(progressDir);
    events = await openEvents(server);
    // The server starts its file watchers before announcing the connection.
    await events.waitFor(/^: connected/m);
  });

  afterAll(async () => {
    events?.close();
    await server?.stop();
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  it('starts as a first visit', async () => {
    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome to Apprentice');
  });

  it('announces onboarding and shows lesson 1 in progress', async () => {
    writeFileSync(
      join(progressDir, 'progress.json'),
      progressFile({ 'ai-foundations/01-what-is-ai': { status: 'in_progress', startedAt: '2026-10-04' } }, 'ai-foundations/01-what-is-ai'),
    );
    expect(await events.waitFor(/^event: change$/m)).toMatch(/^data: progress$/m);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome back, Robin!');
    expect(home.text).toContain('Pick up where you left off');
    expect(home.text).toContain('What is AI?');
    expect(home.text).toContain('0 of 3 lessons finished');

    const catalog = await getPage(server, '/courses');
    expect(catalog.text).toContain('In progress');
    expect(catalog.text).toContain('0 of 3 lessons');
  });

  it('announces the completed lesson and shows lesson 2 next', async () => {
    writeFileSync(
      join(progressDir, 'progress.json'),
      progressFile(
        {
          'ai-foundations/01-what-is-ai': {
            status: 'done',
            startedAt: '2026-10-04',
            completedAt: '2026-10-04',
            score: 0.75,
            notes: 'Liked the spam filter example.',
          },
        },
        null,
      ),
    );
    expect(await events.waitFor(/^event: change$/m)).toMatch(/^data: progress$/m);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Next up');
    expect(home.text).toContain('How do machines learn?');
    expect(home.text).toContain('1 of 3 lessons finished');

    const course = await getPage(server, '/courses/ai-foundations');
    expect(course.text).toContain('1 of 3 lessons');
    expect(course.text).toContain('Score: 75%');
    expect(course.text).toContain('Liked the spam filter example.');
  });

  it('announces a new path from the tutor and shows it', async () => {
    const progress = JSON.parse(progressFile({ 'ai-foundations/01-what-is-ai': { status: 'skipped', notes: 'placement' } }, null));
    writeFileSync(
      join(progressDir, 'progress.json'),
      JSON.stringify({ ...progress, path: ['ai-foundations'], pathReason: 'Start with the foundations.', pathUpdatedAt: '2026-10-05' }),
    );
    expect(await events.waitFor(/^event: change$/m)).toMatch(/^data: progress$/m);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Your path');
    expect(home.text).toContain('Start with the foundations.');
    expect(home.text).not.toContain('recommend a path');

    const catalog = await getPage(server, '/courses');
    expect(catalog.text).toContain('Recommended for you');
  });

  it('announces a reset (progress.json deleted)', async () => {
    rmSync(join(progressDir, 'progress.json'));
    expect(await events.waitFor(/^event: change$/m)).toMatch(/^data: progress$/m);

    const home = await getPage(server, '/');
    expect(home.text).toContain('Welcome to Apprentice');
  });
});
