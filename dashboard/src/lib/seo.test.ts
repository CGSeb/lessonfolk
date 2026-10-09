import { describe, expect, it } from 'vitest';
import {
  AI_CRAWLERS,
  PRIVATE_PATHS,
  absoluteUrl,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemap,
  courseJsonLd,
  isPrivatePath,
  publicPaths,
  serializeJsonLd,
  websiteJsonLd,
  type SeoCourse,
} from './seo';

const origin = 'https://learn.example.com';
const course: SeoCourse = {
  id: 'ai-foundations',
  title: 'AI Foundations',
  level: 'beginner',
  description: 'What AI is.',
  estimatedHours: 1.5,
  prerequisites: ['intro'],
  lessons: [{}, {}, {}],
};

describe('absoluteUrl', () => {
  it('joins the origin and a path, ignoring a trailing slash on the origin', () => {
    expect(absoluteUrl(origin, '/courses')).toBe('https://learn.example.com/courses');
    expect(absoluteUrl(`${origin}/`, '/')).toBe('https://learn.example.com/');
  });
});

describe('isPrivatePath', () => {
  it('matches private paths and their children only', () => {
    expect(isPrivatePath('/account')).toBe(true);
    expect(isPrivatePath('/account/import')).toBe(true);
    expect(isPrivatePath('/api/me')).toBe(true);
    expect(isPrivatePath('/accounts')).toBe(false);
    expect(isPrivatePath('/courses/ai-foundations')).toBe(false);
  });
});

describe('buildRobotsTxt', () => {
  const robots = buildRobotsTxt(origin);

  it('allows public pages, disallows private ones and links the sitemap', () => {
    expect(robots).toContain('User-agent: *\nAllow: /');
    for (const path of PRIVATE_PATHS) expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });

  it('names every AI crawler with the same rules', () => {
    for (const bot of AI_CRAWLERS) expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
  });
});

describe('buildSitemap', () => {
  it('lists the public pages with absolute, escaped URLs', () => {
    const xml = buildSitemap(origin, publicPaths(['ai-foundations'], ['a&b']));
    expect(xml).toContain('<loc>https://learn.example.com/</loc>');
    expect(xml).toContain('<loc>https://learn.example.com/courses/ai-foundations</loc>');
    expect(xml).toContain('<loc>https://learn.example.com/authors/a%26b</loc>');
    expect(xml).not.toContain('/account');
  });
});

describe('buildLlmsTxt', () => {
  it('starts with the title and summary, then lists the courses', () => {
    const text = buildLlmsTxt(origin, [course], 'Learn AI.');
    expect(text.startsWith('# LessonFolk\n\n> Learn AI.')).toBe(true);
    expect(text).toContain('- [AI Foundations](https://learn.example.com/courses/ai-foundations): What AI is.');
    expect(text).toContain('MCP server: https://learn.example.com/mcp');
  });

  it('adds level, duration and prerequisites in the full version', () => {
    expect(buildLlmsTxt(origin, [course], 'x', true)).toContain('(beginner, about 1.5 h, 3 lessons; builds on intro)');
  });
});

describe('JSON-LD', () => {
  it('describes the website and the organization', () => {
    const [site, org] = websiteJsonLd(origin, 'Learn AI.') as Record<string, unknown>[];
    expect(site).toMatchObject({ '@type': 'WebSite', name: 'LessonFolk', url: 'https://learn.example.com/' });
    expect(org).toMatchObject({ '@type': 'Organization', sameAs: ['https://github.com/CGSeb/lessonfolk'] });
  });

  it('describes a course with its authors, duration and breadcrumb', () => {
    const [data, breadcrumb] = courseJsonLd(origin, course, [{ slug: 'lessonfolk', name: 'LessonFolk' }], 'Courses') as Record<
      string,
      any
    >[];
    expect(data).toMatchObject({
      '@type': 'Course',
      name: 'AI Foundations',
      isAccessibleForFree: true,
      educationalLevel: 'Beginner',
      url: 'https://learn.example.com/courses/ai-foundations',
    });
    expect(data.hasCourseInstance.courseWorkload).toBe('PT90M');
    expect(data.author[0].url).toBe('https://learn.example.com/authors/lessonfolk');
    expect(breadcrumb.itemListElement.map((item: { name: string }) => item.name)).toEqual(['Courses', 'AI Foundations']);
  });

  it('cannot close the script tag it is written in', () => {
    expect(serializeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('<');
  });
});
