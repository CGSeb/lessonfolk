/**
 * The Projects pages: the catalog, one project page (signed-in learner with progress), the
 * "Practise with a project" section of a course page, the French text and the sitemap.
 */
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyProgress, formatProgress } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COURSES_DIR, startDashboard, testProgressStore, visibleText, type DashboardServer } from './server';

const PROJECT = `---
id: demo-project
title: Demo project
level: beginner
theme: understanding-ai
authors: [lessonfolk]
description: Put AI Foundations to work.
estimatedHours: 2
buildsOn: [ai-foundations]
needs:
  - An AI chat app
---

## Brief
Explain AI to a **friend**, in your own words.

## Milestones
1. **Pick the friend.** Choose who you explain it to.
   Done when: the learner names the person.
2. **Write the explanation.** Write it for them.
   Done when: the explanation is shared.
3. **Test it.** Ask them what they understood.
   Done when: the learner reports what landed.

## Coaching notes
- SECRET-COACHING: never write the explanation for them.

## Review
1. The explanation fits the friend.
2. It avoids jargon.

## Going further
- Explain it to a second person.
`;

const FRENCH = `---
id: demo-project
title: Projet démo
description: Mettez les bases de l’IA en pratique.
---

## Brief
Expliquez l’IA à un **ami**.

## Milestones
1. **Choisir l’ami.** Choisissez à qui l’expliquer.
   Done when: l’apprenant nomme la personne.
2. **Écrire l’explication.** Écrivez-la.
   Done when: l’explication est partagée.
3. **La tester.** Demandez ce qu’il a compris.
   Done when: l’apprenant dit ce qui a été compris.

## Coaching notes
- SECRET-COACHING.

## Review
1. L’explication convient à l’ami.
2. Elle évite le jargon.
`;

let testDb: TestDatabase;
let server: DashboardServer;
let root: string;

beforeAll(async () => {
  // A content root like the repository's: the pinned courses, and projects/ next to them.
  root = mkdtempSync(join(tmpdir(), 'lessonfolk-projects-'));
  const coursesDir = join(root, 'courses');
  const projectsDir = join(root, 'projects');
  cpSync(COURSES_DIR, coursesDir, { recursive: true });
  for (const lang of ['en', 'fr']) mkdirSync(join(projectsDir, lang), { recursive: true });
  writeFileSync(join(projectsDir, 'en', 'index.yaml'), 'projects:\n  - demo-project\n');
  writeFileSync(join(projectsDir, 'en', 'demo-project.md'), PROJECT);
  writeFileSync(join(projectsDir, 'fr', 'demo-project.md'), FRENCH);

  testDb = await createTestDatabase();
  server = await startDashboard({ DATABASE_URL: testDb.url, LESSONFOLK_COURSES_DIR: coursesDir, LESSONFOLK_PROJECTS_DIR: projectsDir });
});
afterAll(async () => {
  await server?.stop();
  await testDb?.drop();
  rmSync(root, { recursive: true, force: true });
});

const get = async (path: string, headers: Record<string, string> = {}) => {
  const response = await fetch(server.url + path, { headers: { Accept: 'text/html', ...headers } });
  const html = await response.text();
  return { status: response.status, html, text: visibleText(html) };
};

/** The local learner (LESSONFOLK_AUTH=none) with the project in progress, milestone 1 reached. */
async function seedInProgress() {
  await get('/'); // The first request creates the local user.
  const progress = {
    ...emptyProgress(),
    projects: { 'demo-project': { status: 'in_progress' as const, startedAt: '2026-11-01', milestones: [1], notes: 'Chose a neighbour.' } },
  };
  await testProgressStore(testDb.db).importProgress('local', formatProgress(progress), { client: 'test' });
}

describe('projects pages', () => {
  it('list the projects in the catalog, with the courses they build on', async () => {
    const page = await get('/projects');
    expect(page.status).toBe(200);
    expect(page.html).toMatch(/<a href="\/projects\/demo-project"[^>]*>Demo project<\/a>/);
    expect(page.text).toContain('Builds on: AI Foundations');
    expect(page.text).toContain('3 milestones');
    expect(page.text).not.toContain('No project is open yet');
    expect(page.text).not.toContain('How projects work');
  });

  it('search and filter the projects like the courses', async () => {
    // The same listing as the course catalog: search form, theme badges with counts, result count.
    const page = await get('/projects');
    expect(page.html).toMatch(/<form class="catalog-search[^"]*" role="search" method="get" action="\/projects"/);
    expect(page.html).toMatch(/<a class="theme-filter theme-filter--all[^"]*" href="\/projects" aria-current="true"/);
    expect(page.html).toMatch(/href="\/projects\?theme=understanding-ai"/);
    expect(page.text).toContain('1 project');

    const found = await get('/projects?q=foundations');
    expect(found.text).toContain('1 project');
    expect(found.html).toContain('href="/projects/demo-project"');

    const none = await get('/projects?q=nothing-matches-this');
    expect(none.text).toContain('No project matches your search.');
    expect(none.html).not.toContain('href="/projects/demo-project"');

    // The theme badge of a project card filters the projects, not the courses.
    expect(page.html).toMatch(/class="badge theme-badge[^"]*"[^>]*href="\/projects\?theme=understanding-ai"/);
  });

  it('show a project page with its brief, milestones and review, never the coaching notes', async () => {
    const page = await get('/projects/demo-project');
    expect(page.status).toBe(200);
    expect(page.html).toMatch(/<h1[^>]*>Demo project<\/h1>/);
    expect(page.html).toContain('Explain AI to a <strong>friend</strong>, in your own words.');
    for (const text of ['What you need', 'An AI chat app', 'The brief', 'Pick the friend', 'Done when', 'the learner names the person', 'How your result is reviewed', 'It avoids jargon.', 'Explain it to a second person.']) {
      expect(page.text).toContain(text);
    }
    expect(page.html).toMatch(/<a href="\/courses\/ai-foundations"[^>]*>AI Foundations<\/a>/);
    expect(page.text).not.toContain('SECRET-COACHING');
    expect((await get('/projects/no-such-project')).status).toBe(404);
  });

  it('show the learner progress on the project page and the catalog', async () => {
    await seedInProgress();
    const page = await get('/projects/demo-project');
    expect(page.text).toContain('1 of 3 milestones reached');
    expect(page.text).toContain('Chose a neighbour.');
    expect(page.text).toContain('Continue my project “Demo project”');
    expect(page.html).toMatch(/class="[^"]*milestone--reached[^"]*"/);
    expect(page.html).toMatch(/class="[^"]*milestone--next[^"]*"[^>]*aria-current="step"/);
    expect((await get('/projects')).text).toContain('1 of 3 milestones reached');
  });

  it('suggest the project from the page of the course it builds on', async () => {
    const page = await get('/courses/ai-foundations');
    expect(page.text).toContain('Practise with a project');
    expect(page.html).toMatch(/<a href="\/projects\/demo-project"/);
  });

  it('show the French text of a translated project', async () => {
    const page = await get('/projects/demo-project', { 'Accept-Language': 'fr' });
    expect(page.html).toMatch(/<h1[^>]*>Projet démo<\/h1>/);
    expect(page.text).toContain('Choisir l’ami');
    expect(page.text).toContain('Les étapes');
    expect(page.text).not.toContain('SECRET-COACHING');
  });

  it('give a project page its title, canonical URL, one h1 and JSON-LD, and keep unknown projects out of search', async () => {
    const { html } = await get('/projects/demo-project?utm_source=x');
    expect(html).toContain('<title>Demo project · LessonFolk</title>');
    expect(html).toContain('<meta name="description" content="Put AI Foundations to work.">');
    expect(html).toContain(`<link rel="canonical" href="${server.url}/projects/demo-project"`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('index, follow');
    const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));
    expect(data.map((item) => item['@type'])).toEqual(['LearningResource', 'BreadcrumbList']);
    expect(data[0]).toMatchObject({ name: 'Demo project', learningResourceType: 'Project', isBasedOn: [{ name: 'AI Foundations' }] });

    const unknown = await get('/projects/does-not-exist');
    expect(unknown.status).toBe(404);
    expect(unknown.html).toContain('content="noindex, nofollow"');
    expect(unknown.html).not.toContain('application/ld+json');
  });

  it('list the project pages in the sitemap and llms.txt', async () => {
    const sitemap = await (await fetch(`${server.url}/sitemap.xml`)).text();
    expect(sitemap).toContain('/projects/demo-project</loc>');
    const llms = await (await fetch(`${server.url}/llms.txt`)).text();
    expect(llms).toContain('## Projects');
    expect(llms).toContain('/projects/demo-project): Put AI Foundations to work.');
  });
});
