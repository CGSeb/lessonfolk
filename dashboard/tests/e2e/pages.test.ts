/**
 * End-to-end page checks: the built dashboard, served over HTTP, against the real
 * AI Foundations course and one progress fixture per learner state.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPage, PROGRESS_FIXTURES, startDashboard, type DashboardServer } from './server';

const LESSONS = ['What is AI?', 'How do machines learn?', 'What is a large language model?'];

interface Expectations {
  /** Folder passed as APPRENTICE_PROGRESS_DIR. */
  progressDir: string;
  home: { include: string[]; exclude: string[] };
  catalog: { include: string[]; exclude: string[] };
  course: { include: string[]; exclude: string[] };
}

const INVALID_HOME = 'Your progress file could not be read';
const INVALID_CATALOG = 'Your progress file could not be read, so every course is shown as not started.';
const COURSE_ISSUES = ['Some course files have problems', 'Some files of this course have problems'];

const fixtures: Record<string, Expectations> = {
  'new learner (no progress file)': {
    // Never created: the tutor writes progress.json during onboarding.
    progressDir: join(PROGRESS_FIXTURES, 'new-learner-does-not-exist'),
    home: {
      include: [
        'Welcome to Apprentice',
        'How to start',
        "Let's start learning AI",
        'questions about you and what you already know',
        'Where beginners start',
        LESSONS[0],
      ],
      exclude: ['Welcome back', 'Your path', 'recommend a path', INVALID_HOME],
    },
    catalog: { include: ['AI Foundations', 'Not started', '0 of 3 lessons'], exclude: [INVALID_CATALOG] },
    course: {
      include: ['Not started', '0 of 3 lessons', 'Next up', ...LESSONS],
      exclude: ['Status: Done', 'Notes from your tutor', INVALID_HOME],
    },
  },
  'onboarded, no lesson yet (minimal)': {
    progressDir: join(PROGRESS_FIXTURES, 'minimal'),
    home: {
      include: [
        'Welcome back!',
        'Next up',
        LESSONS[0],
        '0 of 3 lessons finished',
        'Courses completed: 0 of 1',
        'Your progress by theme',
        // Profile without a path: suggest asking the tutor for one.
        'Get a path made for you',
        'recommend a path',
      ],
      exclude: ['Welcome to Apprentice', 'Your path', 'Level:', 'Your interests:', INVALID_HOME],
    },
    catalog: { include: ['Not started', '0 of 3 lessons'], exclude: [INVALID_CATALOG, 'Recommended for you'] },
    course: { include: ['Not started', '0 of 3 lessons', 'Next up', ...LESSONS], exclude: ['Status: Done', INVALID_HOME] },
  },
  'mid-course': {
    progressDir: join(PROGRESS_FIXTURES, 'mid-course'),
    home: {
      include: [
        'Welcome back, Alex!',
        'Pick up where you left off',
        LESSONS[1],
        '1 of 3 lessons finished',
        'Courses completed: 0 of 1',
        'Your progress by theme',
        '1 of 3 lessons',
      ],
      exclude: ['Welcome to Apprentice', INVALID_HOME],
    },
    catalog: { include: ['In progress', '1 of 3 lessons'], exclude: [INVALID_CATALOG] },
    course: {
      include: [
        'In progress',
        '1 of 3 lessons',
        'Status: Done',
        'Score: 80%',
        'Finished on Oct 4, 2026',
        'Notes from your tutor',
        'confused AI with robots at first',
        "Stopped after the 'training data' key idea.",
        'Next up',
        ...LESSONS,
      ],
      exclude: ['You finished this course', INVALID_HOME],
    },
  },
  'all done (done and skipped)': {
    progressDir: join(PROGRESS_FIXTURES, 'all-done'),
    home: {
      include: [
        'Welcome back, Sam!',
        'You finished every lesson. Congratulations!',
        'quiz me',
        '3 of 3 lessons finished',
        'Courses completed: 1 of 1',
      ],
      exclude: ['Next up', 'Pick up where you left off', INVALID_HOME],
    },
    catalog: { include: ['Completed', '3 of 3 lessons'], exclude: [INVALID_CATALOG, 'Not started'] },
    course: {
      include: [
        'Completed',
        '3 of 3 lessons',
        'You finished this course. Well done!',
        'Status: Done',
        'Status: Skipped',
        'Score: 90%',
        'Score: 70%',
        'Skipped on Oct 5, 2026',
        'Finished on Oct 6, 2026',
        'Needed a second analogy',
        ...LESSONS,
      ],
      exclude: ['Next up', 'Not started', INVALID_HOME],
    },
  },
  'a personal path with placement skips': {
    progressDir: join(PROGRESS_FIXTURES, 'placement-path'),
    home: {
      include: [
        'Welcome back, Jordan!',
        'Level: Intermediate',
        'Your interests:',
        'Theme: Building with AI',
        'Theme: Understanding AI',
        'Your path',
        'Why this path',
        'we skip the basics you know',
        'Updated on Oct 4, 2026',
        '2 of 3 lessons',
        '1 lesson skipped after your level check',
        'Status: In progress',
        'Next up',
        LESSONS[2],
        // Unknown course and theme ids are ignored, with a warning.
        'Some of your learning path was ignored',
      ],
      exclude: ['Get a path made for you', INVALID_HOME],
    },
    catalog: { include: ['Recommended for you', 'In progress', '2 of 3 lessons'], exclude: [INVALID_CATALOG] },
    course: {
      include: [
        'Status: Skipped after level check',
        'Status: Skipped',
        'Already knew training data and models.',
        'Skipped on Oct 4, 2026',
        'Next up',
      ],
      exclude: ['Status: Done', INVALID_HOME],
    },
  },
  'invalid JSON': {
    progressDir: join(PROGRESS_FIXTURES, 'invalid-json'),
    home: {
      // Shown as a first visit, with a warning and the parse error.
      include: [INVALID_HOME, 'Invalid JSON in', 'Welcome to Apprentice', 'Where beginners start', LESSONS[0]],
      exclude: ['Welcome back'],
    },
    catalog: { include: [INVALID_CATALOG, 'Not started', '0 of 3 lessons'], exclude: [] },
    course: { include: [INVALID_HOME, 'Invalid JSON in', 'Not started', '0 of 3 lessons', ...LESSONS], exclude: ['Status: Done'] },
  },
  'invalid shape': {
    progressDir: join(PROGRESS_FIXTURES, 'invalid-shape'),
    home: { include: [INVALID_HOME, 'Unexpected shape in', 'Welcome to Apprentice'], exclude: ['Welcome back'] },
    catalog: { include: [INVALID_CATALOG, 'Not started', '0 of 3 lessons'], exclude: [] },
    course: { include: [INVALID_HOME, 'Unexpected shape in', '0 of 3 lessons'], exclude: ['Status: Done'] },
  },
};

it('the new-learner fixture folder does not exist', () => {
  expect(existsSync(fixtures['new learner (no progress file)'].progressDir)).toBe(false);
});

describe.each(Object.entries(fixtures))('dashboard with %s', (_name, fixture) => {
  let server: DashboardServer;

  beforeAll(async () => {
    server = await startDashboard(fixture.progressDir);
  });
  afterAll(async () => {
    await server?.stop();
  });

  function expectText(text: string, { include, exclude }: { include: string[]; exclude: string[] }) {
    for (const expected of include) expect(text).toContain(expected);
    for (const unexpected of exclude) expect(text).not.toContain(unexpected);
    // The real course content is valid: no page reports course file problems.
    for (const issue of COURSE_ISSUES) expect(text).not.toContain(issue);
  }

  it('renders the home page', async () => {
    const page = await getPage(server, '/');
    expect(page.status).toBe(200);
    expectText(page.text, fixture.home);
  });

  it('renders the course catalog', async () => {
    const page = await getPage(server, '/courses');
    expect(page.status).toBe(200);
    expect(page.html).toContain('href="/courses/ai-foundations"');
    // Courses are grouped by theme; themes with no course yet are hidden.
    expect(page.html).toMatch(/<h2 id="theme-understanding-ai-title"[^>]*>Understanding AI<\/h2>/);
    expect(page.html).not.toContain('id="theme-ai-and-society"');
    // Each card shows its theme, linking to the theme's section.
    expect(page.html).toMatch(/<a class="badge theme-badge[^"]*" href="\/courses#theme-understanding-ai"/);
    // Themes are folded by default.
    expect(page.html).toMatch(/<details class="theme-details"(?![^>]*\bopen\b)[^>]*>/);
    expectText(page.text, fixture.catalog);
  });

  it('renders the AI Foundations course page', async () => {
    const page = await getPage(server, '/courses/ai-foundations');
    expect(page.status).toBe(200);
    expect(page.text).toContain('AI Foundations');
    expect(page.html).toMatch(/<a class="badge theme-badge[^"]*" href="\/courses#theme-understanding-ai"/);
    expect(page.text).toContain('Theme: Understanding AI');
    expectText(page.text, fixture.course);
  });

  it('credits AI Foundations to Apprentice on the catalog and the course page', async () => {
    for (const path of ['/courses', '/courses/ai-foundations']) {
      const page = await getPage(server, path);
      expect(page.text).toContain('By Apprentice');
      expect(page.html).toMatch(/<a href="\/authors\/apprentice"[^>]*>\s*Apprentice\s*<\/a>/);
    }
  });

  it('renders the authors list', async () => {
    const page = await getPage(server, '/authors');
    expect(page.status).toBe(200);
    expect(page.html).toMatch(/<a href="\/authors\/apprentice"[^>]*>Apprentice<\/a>/);
    expect(page.text).toContain('1 course');
  });

  it('renders the Apprentice author page with its courses and progress', async () => {
    const page = await getPage(server, '/authors/apprentice');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Courses by Apprentice');
    expect(page.html).toContain('href="/courses/ai-foundations"');
    // No link is set in authors.yaml, so none is rendered.
    expect(page.html).not.toContain('target="_blank"');
    expectText(page.text, { include: fixture.catalog.include, exclude: [] });
  });

  it('answers 404 for an unknown author', async () => {
    const page = await getPage(server, '/authors/no-such-author');
    expect(page.status).toBe(404);
    expect(page.text).toContain('We could not find this author');
    expect(page.text).toContain('no-such-author');
  });

  it('answers 404 for an unknown course', async () => {
    const page = await getPage(server, '/courses/no-such-course');
    expect(page.status).toBe(404);
    expect(page.text).toContain('We could not find this course');
    expect(page.text).toContain('no-such-course');
    // The progress warning belongs to real course pages only.
    expect(page.text).not.toContain(INVALID_HOME);
  });
});
