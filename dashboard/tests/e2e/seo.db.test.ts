/**
 * Search engine and AI search checks: robots.txt, the sitemap, llms.txt, the meta tags and
 * JSON-LD of the public pages, and noindex on the private ones. Runs against the built
 * dashboard (LESSONFOLK_AUTH=none) with the pinned AI Foundations course.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { getPage, startDashboard, type DashboardServer } from './server';

let testDb: TestDatabase;
let server: DashboardServer;

beforeAll(async () => {
  testDb = await createTestDatabase();
  server = await startDashboard({ DATABASE_URL: testDb.url });
});
afterAll(async () => {
  await server?.stop();
  await testDb?.drop();
});

const fetchText = async (path: string) => {
  const response = await fetch(server.url + path);
  return { response, body: await response.text() };
};

const jsonLd = (html: string): Record<string, unknown>[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));

describe('crawler files', () => {
  it('serves robots.txt with the sitemap and the private paths disallowed', async () => {
    const { response, body } = await fetchText('/robots.txt');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain(`Sitemap: ${server.url}/sitemap.xml`);
    expect(body).toContain('Disallow: /account');
    expect(body).toContain('User-agent: GPTBot');
  });

  it('serves a sitemap of the public pages only', async () => {
    const { response, body } = await fetchText('/sitemap.xml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('xml');
    for (const path of ['/', '/courses', '/courses/ai-foundations', '/authors', '/authors/lessonfolk', '/connect', '/privacy']) {
      expect(body).toContain(`<loc>${server.url}${path}</loc>`);
    }
    expect(body).not.toMatch(/\/(account|api|sign-in|oauth)/);
  });

  it('serves llms.txt and llms-full.txt with the courses', async () => {
    const short = await fetchText('/llms.txt');
    expect(short.response.status).toBe(200);
    expect(short.body).toMatch(/^# LessonFolk\n/);
    expect(short.body).toContain(`[AI Foundations](${server.url}/courses/ai-foundations)`);
    const full = await fetchText('/llms-full.txt');
    expect(full.body).toMatch(/AI Foundations\]\(.*\) \(beginner, about \d/);
  });
});

describe('meta tags', () => {
  it('gives the course page its own title, canonical URL and share image', async () => {
    const { html } = await getPage(server, '/courses/ai-foundations?utm_source=x');
    expect(html).toContain('<title>AI Foundations · LessonFolk</title>');
    expect(html).toContain(`<link rel="canonical" href="${server.url}/courses/ai-foundations"`);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain(`property="og:image" content="${server.url}/og-image.png"`);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('index, follow');
  });

  it('serves the share image as a PNG', async () => {
    const response = await fetch(`${server.url}/og-image.png`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
  });

  it('describes the course with JSON-LD and a breadcrumb', async () => {
    const data = jsonLd((await getPage(server, '/courses/ai-foundations')).html);
    expect(data.map((item) => item['@type'])).toEqual(['Course', 'BreadcrumbList']);
    expect(data[0]).toMatchObject({ name: 'AI Foundations', isAccessibleForFree: true });
  });

  it('keeps unknown courses out of search results', async () => {
    const page = await getPage(server, '/courses/does-not-exist');
    expect(page.status).toBe(404);
    expect(page.html).toContain('content="noindex, nofollow"');
  });

  it('has one h1 and a canonical URL on the public pages', async () => {
    for (const path of ['/courses', '/courses/ai-foundations', '/authors', '/connect', '/privacy']) {
      const { html } = await getPage(server, path);
      expect(html.match(/<h1[\s>]/g)?.length, path).toBe(1);
      expect(html, path).toContain('<link rel="canonical"');
    }
  });
});

describe('private pages', () => {
  it('are noindex in the page and in the header', async () => {
    const response = await fetch(`${server.url}/account`);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await response.text()).toContain('content="noindex, nofollow"');
    expect((await fetch(`${server.url}/api/me`)).headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});
