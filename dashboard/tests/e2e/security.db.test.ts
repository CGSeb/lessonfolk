/**
 * Web hardening end to end (LESSONFOLK_AUTH=none; rate limits are off in the test suite except in the last block): security headers, no CORS,
 * path traversal on the avatar route, malformed and oversized imports, and rate limits.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MAX_IMPORT_BYTES } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { multipartForm } from './account-helpers';
import { getPage, seedProgress, startDashboard, testProgressStore, visibleText, type DashboardServer } from './server';

let testDb: TestDatabase;
let server: DashboardServer;
let limited: DashboardServer;

beforeAll(async () => {
  testDb = await createTestDatabase();
  server = await startDashboard({ DATABASE_URL: testDb.url });
  await seedProgress(testDb.db, 'local', 'mid-course');
  limited = await startDashboard({ DATABASE_URL: testDb.url, LESSONFOLK_RATE_LIMIT: 'on' });
});
afterAll(async () => {
  await server?.stop();
  await limited?.stop();
  await testDb?.drop();
});

const upload = (content: string, target: DashboardServer = server) => {
  const { body, contentType } = multipartForm({ file: { filename: 'progress.json', content } });
  return fetch(`${target.url}/account/import`, {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: target.url, 'Content-Type': contentType },
    body,
  });
};

describe('security headers', () => {
  it('are sent on pages, API routes, errors and the avatar', async () => {
    for (const path of ['/', '/courses', '/courses/ai-foundations', '/connect', '/api/me', '/no-such-page', '/robots.txt']) {
      const response = await fetch(server.url + path);
      await response.arrayBuffer();
      expect(response.headers.get('content-security-policy'), path).toContain("frame-ancestors 'none'");
      expect(response.headers.get('x-content-type-options'), path).toBe('nosniff');
      expect(response.headers.get('x-frame-options'), path).toBe('DENY');
      expect(response.headers.get('referrer-policy'), path).toBe('strict-origin-when-cross-origin');
      // Plain HTTP (local run): the browser must not be pinned to HTTPS.
      expect(response.headers.get('strict-transport-security'), path).toBeNull();
    }
    const avatar = await fetch(`${server.url}/api/authors/lessonfolk/avatar`);
    expect(avatar.headers.get('content-security-policy')).toContain('sandbox');
    expect(avatar.headers.get('x-frame-options')).toBe('DENY');
  });

  it('keep the page working: its scripts and styles are inline or from the same site', async () => {
    const page = await getPage(server, '/courses');
    expect(page.status).toBe(200);
    expect(page.html).not.toMatch(/<script[^>]+src="https?:\/\//);
    expect(page.html).not.toMatch(/<link[^>]+rel="stylesheet"[^>]+href="https?:\/\//);
  });
});

describe('CORS', () => {
  it('is never granted: no Access-Control headers, and preflights are not answered', async () => {
    for (const path of ['/api/me', '/api/events', '/api/account/export', '/courses']) {
      const response = await fetch(server.url + path, { headers: { Origin: 'https://evil.example' } });
      await response.body?.cancel();
      expect(response.headers.get('access-control-allow-origin'), path).toBeNull();
      const preflight = await fetch(server.url + path, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil.example',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      });
      await preflight.body?.cancel();
      expect(preflight.headers.get('access-control-allow-origin'), path).toBeNull();
    }
  });
});

describe('path traversal', () => {
  it('serves only the avatars named in authors.yaml', async () => {
    const slugs = ['..%2F..%2Fpackage.json', '..%2Fauthors.yaml', '%2e%2e%2f%2e%2e%2f.env', '..\\..\\package.json', 'lessonfolk%00.svg'];
    for (const slug of slugs) {
      const response = await fetch(`${server.url}/api/authors/${slug}/avatar`);
      const body = await response.text();
      expect(response.status, slug).toBe(404);
      expect(body, slug).not.toContain('lessonfolk');
    }
    for (const path of ['/..%2f..%2fpackage.json', '/%2e%2e/%2e%2e/package.json', '/.well-known/..%2f..%2fpackage.json']) {
      const response = await fetch(server.url + path);
      expect(await response.text(), path).not.toContain('"workspaces"');
    }
  });
});

describe('importing a progress.json', () => {
  const savedName = async () => (await testProgressStore(testDb.db).getProgress('local')).profile.name;

  it('refuses a file over 1 MB with a readable message, and changes nothing', async () => {
    const big = JSON.stringify({ version: 1, profile: { goal: 'x'.repeat(MAX_IMPORT_BYTES) } });
    const response = await upload(big);
    expect(response.status).toBe(400);
    expect(visibleText(await response.text())).toContain('too large');
    expect(await savedName()).toBe('Alex');
  });

  it('refuses a request body far over the limit before reading it (413)', async () => {
    const response = await upload('x'.repeat(5 * 1024 * 1024));
    expect(response.status).toBe(413);
    expect(await savedName()).toBe('Alex');
  });

  it('refuses an oversized confirmation without writing anything', async () => {
    const response = await fetch(`${server.url}/api/account/import`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Origin: server.url, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ progress: JSON.stringify({ profile: { goal: 'x'.repeat(MAX_IMPORT_BYTES) } }) }).toString(),
    });
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/account?error=expired');
    expect(await savedName()).toBe('Alex');
  });

  it('rejects JSON that is not a progress object, without a server error', async () => {
    for (const content of ['null', '[]', '"text"', '42', '{"lessons":[]}', '{"profile":{"interests":"ai"}}', '\u0000\u0001garbage']) {
      const response = await upload(content);
      expect(response.status, content).toBe(422);
      expect(visibleText(await response.text()), content).toContain('This file cannot be imported');
    }
    expect(await savedName()).toBe('Alex');
  });

  it('escapes a hostile file in the preview instead of running it', async () => {
    const response = await upload(JSON.stringify({ version: 1, profile: { name: '<script>alert(1)</script><img src=x onerror=alert(2)>' } }));
    // The checked file also travels in a hidden field: inside a quoted attribute, `<` is harmless.
    const html = (await response.text()).replace(/<input type="hidden" name="progress" value="[^"]*"/g, '');
    expect(html).not.toContain('<script>alert(1)');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;alert(1)');
  });
});

describe('rate limits', () => {
  it('slow down repeated imports (429 with Retry-After) and leave pages alone', async () => {
    const statuses: number[] = [];
    let retryAfter: string | null = null;
    for (let i = 0; i < 15; i++) {
      const response = await upload('{', limited);
      await response.arrayBuffer();
      statuses.push(response.status);
      retryAfter ??= response.headers.get('retry-after');
    }
    expect(statuses).toContain(429);
    expect(statuses[statuses.length - 1]).toBe(429);
    expect(Number(retryAfter)).toBeGreaterThan(0);
    // Rate-limited responses still carry the security headers.
    const blocked = await upload('{', limited);
    expect(blocked.headers.get('x-frame-options')).toBe('DENY');
    expect((await getPage(limited, '/courses')).status).toBe(200);
  });
});
