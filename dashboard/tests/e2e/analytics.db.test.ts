/**
 * Audience measurement (Umami): the tag is on public pages only, only when UMAMI_WEBSITE_ID is
 * set, and always points at this site's own address (the CSP allows nothing else).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { getPage, startDashboard, type DashboardServer } from './server';

const WEBSITE_ID = '3f0d6c1e-7a52-4c1b-9e0a-2d8f5b6a1c47';

let testDb: TestDatabase;
let measured: DashboardServer;
let unmeasured: DashboardServer;

beforeAll(async () => {
  testDb = await createTestDatabase();
  [measured, unmeasured] = await Promise.all([
    startDashboard({ DATABASE_URL: testDb.url, UMAMI_WEBSITE_ID: WEBSITE_ID }),
    startDashboard({ DATABASE_URL: testDb.url }),
  ]);
});
afterAll(async () => {
  await Promise.all([measured?.stop(), unmeasured?.stop()]);
  await testDb?.drop();
});

describe('with a website id', () => {
  it.each(['/', '/courses', '/courses/ai-foundations', '/privacy'])('measures the public page %s', async (path) => {
    const { html } = await getPage(measured, path);
    const tag = /<script[^>]*data-website-id[^>]*>/.exec(html)?.[0] ?? '';
    expect(tag).toContain(`src="${measured.url}/u/script.js"`);
    expect(tag).toContain(`data-host-url="${measured.url}/u"`);
    expect(tag).toContain(`data-website-id="${WEBSITE_ID}"`);
    expect(tag).toContain('data-do-not-track="true"');
  });

  // The private pages are noindex; sign-in redirects home without sign-in, so /account stands for them.
  it.each(['/account', '/courses/does-not-exist'])('measures nothing on %s', async (path) => {
    const { html } = await getPage(measured, path);
    expect(html).not.toContain('data-website-id');
  });
});

describe('without a website id', () => {
  it('measures nothing anywhere', async () => {
    for (const path of ['/', '/courses', '/privacy']) {
      const { html } = await getPage(unmeasured, path);
      expect(html, path).not.toContain('data-website-id');
      expect(html, path).not.toContain('/u/script.js');
    }
  });
});
