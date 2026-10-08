/**
 * End-to-end page checks: the built dashboard (LESSONFOLK_AUTH=none), served over
 * HTTP, against the pinned AI Foundations course, with the local learner's progress
 * seeded in Postgres from one progress fixture per learner state.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getNextLesson, loadCatalog, type Progress } from '@lessonfolk/core';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { COURSES_DIR, getPage, seedProgress, startDashboard, type DashboardServer } from './server';

const LESSONS = ['What is AI?', 'How do machines learn?', 'What is a large language model?'];

interface Expectations {
  /** Progress fixture imported for the local learner (`null`: nothing saved yet). */
  fixture: string | null;
  home: { include: string[]; exclude: string[] };
  catalog: { include: string[]; exclude: string[] };
  course: { include: string[]; exclude: string[] };
  /** Lessons the course page shows as "Skipped after level check" (default 0). */
  placementLessons?: number;
}

const INVALID_HOME = 'Your progress could not be loaded';
const PATH_WARNING = 'Some of your learning path was ignored';
const SUGGEST_PATH = ['Get a path made for you', 'recommend a path'];
const PLACEMENT = 'Skipped after level check';
const INVALID_CATALOG = 'Your progress could not be loaded, so every course is shown as not started.';
const COURSE_ISSUES = ['Some course files have problems', 'Some files of this course have problems'];

const fixtures: Record<string, Expectations> = {
  'new learner (nothing saved yet)': {
    fixture: null,
    home: {
      include: [
        'Welcome to LessonFolk',
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
    fixture: 'minimal',
    home: {
      include: [
        'Welcome back!',
        'Next up',
        LESSONS[0],
        '0 of 3 lessons finished',
        // Profile without a path: suggest asking the tutor for one.
        'Get a path made for you',
        'recommend a path',
      ],
      exclude: ['Welcome to LessonFolk', 'Your path', 'Level:', 'Your interests:', INVALID_HOME],
    },
    catalog: { include: ['Not started', '0 of 3 lessons'], exclude: [INVALID_CATALOG, 'Recommended for you'] },
    course: { include: ['Not started', '0 of 3 lessons', 'Next up', ...LESSONS], exclude: ['Status: Done', INVALID_HOME] },
  },
  // Scenario 3: an old progress file, written before levels and paths (no level, interests or
  // path). It loads without warnings, keeps every lesson, and suggests asking for a path.
  'mid-course (old progress file)': {
    fixture: 'mid-course',
    home: {
      include: [
        'Welcome back, Alex!',
        'Pick up where you left off',
        LESSONS[1],
        '1 of 3 lessons finished',
        '1 of 3 lessons',
        ...SUGGEST_PATH,
      ],
      exclude: ['Welcome to LessonFolk', 'Your path', 'Level:', 'Your interests:', PATH_WARNING, INVALID_HOME],
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
    fixture: 'all-done',
    home: {
      include: [
        'Welcome back, Sam!',
        'You finished every lesson. Congratulations!',
        'quiz me',
        '3 of 3 lessons finished',
      ],
      // Nothing left to recommend: the tutor would say the catalog is covered.
      exclude: ['Next up', 'Pick up where you left off', ...SUGGEST_PATH, INVALID_HOME],
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
  // Scenario 1: a beginner right after onboarding and accepting the recommended path.
  'beginner right after onboarding': {
    fixture: 'beginner-onboarded',
    home: {
      include: [
        'Welcome back, Robin!',
        'Level: Beginner',
        'Your interests:',
        'Theme: Understanding AI',
        'Your path',
        'Why this path',
        'so we start with the foundations',
        'Updated on Oct 4, 2026',
        '0 of 3 lessons',
        'Status: In progress',
        'Pick up where you left off',
        LESSONS[0],
        '0 of 3 lessons finished',
      ],
      exclude: ['Welcome to LessonFolk', 'after your level check', ...SUGGEST_PATH, PATH_WARNING, INVALID_HOME],
    },
    catalog: {
      include: ['Recommended for you', 'In progress', '0 of 3 lessons'],
      exclude: [INVALID_CATALOG, PLACEMENT, 'Completed'],
    },
    course: {
      include: ['In progress', '0 of 3 lessons', 'Status: In progress', 'Next up', ...LESSONS],
      exclude: ['Status: Done', 'Status: Skipped', INVALID_HOME],
    },
  },
  // Scenario 2: a developer who passed the level check for AI Foundations. Their path was set
  // before (e.g. before saying "change my level"), so home lists that course as skipped.
  'a developer who passed the level check': {
    fixture: 'level-check-passed',
    home: {
      include: [
        'Welcome back, Casey!',
        'Level: Intermediate',
        'Your path',
        `Status: ${PLACEMENT}`,
        '3 of 3 lessons',
        'You finished every lesson. Congratulations!',
        '3 of 3 lessons finished',
      ],
      // The badge already says it: no "3 lessons skipped after your level check" line.
      exclude: ['after your level check', 'Next up', 'Pick up where you left off', ...SUGGEST_PATH, PATH_WARNING, INVALID_HOME],
    },
    catalog: {
      // The course card says "Skipped after level check" (its theme section counts as completed).
      include: ['Recommended for you', `Status: ${PLACEMENT}`, '3 of 3 lessons'],
      exclude: [INVALID_CATALOG, 'In progress', 'Not started'],
    },
    course: {
      include: [`Status: ${PLACEMENT}`, 'Skipped on Oct 5, 2026', '3 of 3 lessons', ...LESSONS],
      // "placement" is a marker for the dashboard, never shown to the learner.
      exclude: ['Status: Done', 'Notes from your tutor', 'Next up', 'placement', INVALID_HOME],
    },
    placementLessons: 3,
  },
  // Scenario 2, partly: one lesson skipped by the level check, one skipped by hand.
  'a personal path with placement skips': {
    fixture: 'placement-path',
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
    // Only one lesson was skipped by the level check: the course card says "In progress".
    catalog: { include: ['Recommended for you', 'In progress', '2 of 3 lessons'], exclude: [INVALID_CATALOG, PLACEMENT] },
    course: {
      include: [
        'Status: Skipped after level check',
        'Status: Skipped',
        'Already knew training data and models.',
        'Skipped on Oct 4, 2026',
        'Next up',
      ],
      exclude: ['Status: Done', 'placement', INVALID_HOME],
    },
    placementLessons: 1,
  },
};

let testDb: TestDatabase;
let server: DashboardServer;

beforeAll(async () => {
  testDb = await createTestDatabase();
  // One server for every learner state: progress is read from the database on each request.
  server = await startDashboard({ DATABASE_URL: testDb.url });
});
afterAll(async () => {
  await server?.stop();
  await testDb?.drop();
});

describe.each(Object.entries(fixtures))('dashboard with %s', (_name, fixture) => {
  let progress: Progress;

  beforeAll(async () => {
    progress = await seedProgress(testDb.db, 'local', fixture.fixture);
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
    // One flat grid: no theme sections.
    expect(page.html).not.toContain('<details');
    // Theme filters: "All" (selected) first, then themes with courses only.
    expect(page.html).toMatch(/<a class="theme-filter[^"]*" href="\/courses" aria-current="true"[^>]*>\s*All/);
    expect(page.html).toMatch(/<a class="theme-filter[^"]*" href="\/courses\?theme=understanding-ai"(?![^>]*aria-current)/);
    expect(page.html).not.toContain('theme=ai-and-society');
    // Each card shows its theme in the theme's colour, linking to the catalog filtered to it.
    expect(page.html).toMatch(/<a class="badge theme-badge theme-tone-1[^"]*" href="\/courses\?theme=understanding-ai"/);
    expect(page.html).toMatch(/<a class="theme-filter theme-tone-1[^"]*" href="\/courses\?theme=understanding-ai"/);
    expect(page.html).toMatch(/<a class="theme-filter theme-filter--all[^"]*" href="\/courses"/);
    expect(page.html).toMatch(/<form class="catalog-search[^"]*" role="search"/);
    expect(page.text).toContain('1 course');
    // A single page needs no pager.
    expect(page.html).not.toContain('aria-label="Pages"');
    expectText(page.text, fixture.catalog);
  });

  it('filters the course catalog by theme and search from the URL', async () => {
    const theme = await getPage(server, '/courses?theme=understanding-ai');
    expect(theme.html).toMatch(/href="\/courses\?theme=understanding-ai" aria-current="true"/);
    expect(theme.html).toContain('href="/courses/ai-foundations"');
    // The search form keeps the selected theme.
    expect(theme.html).toMatch(/<input type="hidden" name="theme" value="understanding-ai"/);

    const found = await getPage(server, '/courses?q=foundations');
    expect(found.html).toContain('href="/courses/ai-foundations"');
    expect(found.html).toMatch(/<input[^>]*name="q" value="foundations"/);
    // Theme filters keep the search.
    expect(found.html).toContain('href="/courses?theme=understanding-ai&amp;q=foundations"');

    const none = await getPage(server, '/courses?theme=understanding-ai&q=zzz-no-such-course');
    expect(none.status).toBe(200);
    expect(none.html).not.toContain('href="/courses/ai-foundations"');
    expect(none.text).toContain('No course in Understanding AI matches your search.');
    expect(none.html).toMatch(/href="\/courses\?theme=understanding-ai"[^>]*>Clear the search/);
    expect(none.html).toMatch(/href="\/courses"[^>]*>See all courses/);
  });

  it('falls back to all courses and page 1 for an unknown theme or page', async () => {
    const page = await getPage(server, '/courses?theme=no-such-theme&page=99');
    expect(page.status).toBe(200);
    expect(page.html).toMatch(/href="\/courses" aria-current="true"/);
    expect(page.html).toContain('href="/courses/ai-foundations"');
  });

  it('renders the AI Foundations course page', async () => {
    const page = await getPage(server, '/courses/ai-foundations');
    expect(page.status).toBe(200);
    expect(page.text).toContain('AI Foundations');
    expect(page.html).toMatch(/<a class="badge theme-badge[^"]*" href="\/courses\?theme=understanding-ai"/);
    expect(page.text).toContain('Theme: Understanding AI');
    expectText(page.text, fixture.course);
  });

  it('shows the lesson getNextLesson picks, on home and on the course page', async () => {
    // Same rule as the tutor's "Start or resume" (AGENTS.md), computed from the seeded progress.
    const next = getNextLesson(loadCatalog('en', COURSES_DIR), progress);

    const home = await getPage(server, '/');
    const card = /id="next-lesson-heading"[^>]*>([^<]*)<\/h2>\s*<div[^>]*>\s*<h3[^>]*>([^<]*)<\/h3>/.exec(home.html);
    if (!next) {
      expect(card).toBeNull();
    } else {
      const label = fixture.fixture === null ? 'Where beginners start' : next.kind === 'resume' ? 'Pick up where you left off' : 'Next up';
      expect(card?.slice(1).map((text) => text.trim())).toEqual([label, next.lesson.title]);
    }

    const course = await getPage(server, '/courses/ai-foundations');
    const marked = [...course.html.matchAll(/class="[^"]*\blesson--next\b[^"]*"[\s\S]*?<h3 class="lesson__title"[^>]*>([^<]*)<\/h3>/g)];
    expect(marked.map((match) => match[1].trim())).toEqual(next?.course.id === 'ai-foundations' ? [next.lesson.title] : []);
  });

  it('marks the lessons skipped by the level check on the course page', async () => {
    const page = await getPage(server, '/courses/ai-foundations');
    // One chunk per lesson card (each is an <li> holding a lesson title).
    const lessons = page.html.split(/<li\b/).filter((chunk) => chunk.includes('class="lesson__title"'));
    expect(lessons).toHaveLength(LESSONS.length);
    expect(lessons.filter((lesson) => lesson.includes(PLACEMENT))).toHaveLength(fixture.placementLessons ?? 0);
  });

  it('credits AI Foundations to LessonFolk on the catalog and the course page', async () => {
    for (const path of ['/courses', '/courses/ai-foundations']) {
      const page = await getPage(server, path);
      expect(page.text).toContain('By LessonFolk');
      expect(page.html).toMatch(/<a href="\/authors\/lessonfolk"[^>]*>\s*LessonFolk\s*<\/a>/);
    }
  });

  it('renders the authors list', async () => {
    const page = await getPage(server, '/authors');
    expect(page.status).toBe(200);
    expect(page.html).toMatch(/<a href="\/authors\/lessonfolk"[^>]*>LessonFolk<\/a>/);
    expect(page.text).toContain('1 course');
    // Decorative avatar from courses/authors/: the name sits next to it.
    expect(page.html).toMatch(/<img class="author-avatar[^"]*" src="\/api\/authors\/lessonfolk\/avatar" alt=""/);
  });

  it('serves author avatars from courses/authors/', async () => {
    const avatar = await fetch(`${server.url}/api/authors/lessonfolk/avatar`);
    expect(avatar.status).toBe(200);
    expect(avatar.headers.get('content-type')).toBe('image/svg+xml');
    expect(avatar.headers.get('content-security-policy')).toContain('sandbox');
    expect(await avatar.text()).toContain('<svg');
    // Revalidation answers 304 while the file is unchanged.
    const again = await fetch(`${server.url}/api/authors/lessonfolk/avatar`, {
      headers: { 'If-None-Match': avatar.headers.get('etag') ?? '' },
    });
    expect(again.status).toBe(304);
    expect((await fetch(`${server.url}/api/authors/no-such-author/avatar`)).status).toBe(404);
  });

  it('renders the LessonFolk author page with its courses and progress', async () => {
    const page = await getPage(server, '/authors/lessonfolk');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Courses by LessonFolk');
    expect(page.html).toMatch(/<img class="author-avatar author-avatar--lg[^"]*" src="\/api\/authors\/lessonfolk\/avatar"/);
    expect(page.html).toContain('href="/courses/ai-foundations"');
    // No link is set in authors.yaml, so none is rendered.
    // (The footer's GitHub link opens in a new tab, so look at the page content only.)
    expect(page.html.split('<footer')[0]).not.toContain('target="_blank"');
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
