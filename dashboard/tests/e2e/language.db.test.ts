/**
 * The interface language: picked from the browser or the footer switcher, French pages, and a
 * partly translated course whose missing parts are shown in English.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { COURSES_DIR, startDashboard, visibleText, type DashboardServer } from './server';

let testDb: TestDatabase;
let server: DashboardServer;
let coursesDir: string;

beforeAll(async () => {
  // The pinned course, with its title and first lesson translated into French.
  coursesDir = mkdtempSync(join(tmpdir(), 'lessonfolk-courses-'));
  cpSync(COURSES_DIR, coursesDir, { recursive: true });
  const fr = join(coursesDir, 'fr', 'ai-foundations');
  mkdirSync(fr, { recursive: true });
  writeFileSync(join(fr, 'course.yaml'), 'id: ai-foundations\ntitle: Les bases de l’IA\ndescription: Partir de zéro.\n');
  const lesson = readFileSync(join(coursesDir, 'en', 'ai-foundations', '01-what-is-ai.md'), 'utf8');
  writeFileSync(join(fr, '01-what-is-ai.md'), lesson.replace(/^title: .*$/m, 'title: Qu’est-ce que l’IA ?'));

  testDb = await createTestDatabase();
  server = await startDashboard({ DATABASE_URL: testDb.url, LESSONFOLK_COURSES_DIR: coursesDir });
});
afterAll(async () => {
  await server?.stop();
  await testDb?.drop();
  rmSync(coursesDir, { recursive: true, force: true });
});

const get = async (path: string, headers: Record<string, string> = {}) => {
  const response = await fetch(server.url + path, { headers: { Accept: 'text/html', ...headers } });
  const html = await response.text();
  return { response, html, text: visibleText(html) };
};

/** The footer switcher's form post. */
const choose = (lang: string, next: string) =>
  fetch(`${server.url}/api/language`, {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: server.url, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ lang, next }).toString(),
  });

describe('interface language', () => {
  it('is English by default', async () => {
    const page = await get('/');
    expect(page.html).toContain('<html lang="en"');
    expect(page.response.headers.get('content-language')).toBe('en');
    expect(page.response.headers.get('vary')).toContain('Accept-Language');
    expect(page.text).toContain('Welcome to LessonFolk');
  });

  it('follows the browser language', async () => {
    const page = await get('/', { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' });
    expect(page.html).toContain('<html lang="fr"');
    expect(page.html).toContain('content="fr_FR"');
    expect(page.response.headers.get('content-language')).toBe('fr');
    expect(page.text).toContain('Bienvenue sur LessonFolk');
    expect(page.text).toContain('Qu’est-ce que l’IA ?');
  });

  it('saves the language chosen in the switcher and goes back to the page', async () => {
    const response = await choose('fr', '/courses?q=ia');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/courses?q=ia');
    const cookie = response.headers.getSetCookie().find((c) => c.startsWith('lessonfolk-lang=fr'));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    // The chosen language wins over the browser's.
    const page = await get('/courses', { Cookie: 'lessonfolk-lang=fr', 'Accept-Language': 'en' });
    expect(page.text).toContain('Les bases de l’IA');
    expect(page.html).toMatch(/aria-pressed="true"[^>]*>\s*Français/);
    const english = await get('/courses', { Cookie: 'lessonfolk-lang=en', 'Accept-Language': 'fr' });
    expect(english.text).toContain('AI Foundations');
  });

  it('ignores an unknown language and a return address on another site', async () => {
    const response = await choose('xx', '//evil.example/');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/');
    expect(response.headers.getSetCookie().some((c) => c.startsWith('lessonfolk-lang='))).toBe(false);
  });

  it('shows the untranslated lessons of a course in English, and says so', async () => {
    const page = await get('/courses/ai-foundations', { Cookie: 'lessonfolk-lang=fr' });
    expect(page.response.status).toBe(200);
    expect(page.text).toContain('Les bases de l’IA');
    expect(page.text).toContain('Qu’est-ce que l’IA ?');
    expect(page.text).toContain('Certaines leçons de ce cours ne sont pas encore traduites');
    // English titles are marked as English for screen readers.
    expect(page.html).toMatch(/<h3 class="lesson__title"[^>]*lang="en"[^>]*>How do machines learn\?/);
    expect(page.text).not.toContain('Some files of this course have problems');
  });
});
