/**
 * Search engine and AI search helpers: the site address, `robots.txt`, the sitemap,
 * `llms.txt` and the JSON-LD (Schema.org) data of the public pages. Pure functions, so
 * they are unit tested; the pages and endpoints only pass them the catalog.
 */

/** Share image used by Open Graph and Twitter cards (public/og-image.png, 1200×630). */
export const SHARE_IMAGE_PATH = '/og-image.png';
export const SHARE_IMAGE_ALT = 'LessonFolk: learn AI with an AI tutor in your chat';

/**
 * Pages that are only for the signed-in learner, or are not pages (API, MCP, sign-in flow).
 * Kept out of search engines in robots.txt and with a `noindex` header.
 */
export const PRIVATE_PATHS = ['/account', '/api', '/mcp', '/oauth', '/sign-in', '/sign-out'] as const;

/** True for a path under one of the PRIVATE_PATHS. */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Crawlers that fetch pages to answer people's questions or to cite sources (AI search),
 * or to train models. Public pages are open to all of them: LessonFolk is open source and
 * wants to be found and recommended. See docs/seo.md.
 */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;

/** Absolute URL of a site path (`/` for the home page). `origin` may end with a slash. */
export function absoluteUrl(origin: string, path = '/'): string {
  return `${origin.replace(/\/+$/, '')}${path}`;
}

/** The text of `robots.txt`: public pages open to everyone, private ones disallowed. */
export function buildRobotsTxt(origin: string): string {
  const rules = ['Allow: /', ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`)].join('\n');
  return [
    '# LessonFolk: public pages are open to search engines and AI crawlers.',
    `User-agent: *\n${rules}`,
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}\n${rules}`),
    `Sitemap: ${absoluteUrl(origin, '/sitemap.xml')}`,
    '',
  ].join('\n\n');
}

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Paths of the public pages: the fixed ones, then every course and author. */
export function publicPaths(courseIds: string[], authorSlugs: string[]): string[] {
  return [
    '/',
    '/courses',
    ...courseIds.map((id) => `/courses/${encodeURIComponent(id)}`),
    '/authors',
    ...authorSlugs.map((slug) => `/authors/${encodeURIComponent(slug)}`),
    '/connect',
    '/privacy',
  ];
}

/** The XML sitemap of the public pages. */
export function buildSitemap(origin: string, paths: string[]): string {
  const urls = paths.map((path) => `  <url><loc>${escapeXml(absoluteUrl(origin, path))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export interface SeoCourse {
  id: string;
  title: string;
  level: string;
  description: string;
  estimatedHours: number;
  prerequisites: string[];
  lessons: unknown[];
}

export interface SeoAuthor {
  slug: string;
  name: string;
}

/**
 * Plain-text description of the site for AI assistants, in the llms.txt format
 * (https://llmstxt.org). `full` adds each course's level, duration and prerequisites.
 */
export function buildLlmsTxt(origin: string, courses: SeoCourse[], siteDescription: string, full = false): string {
  const lines = [
    '# LessonFolk',
    '',
    `> ${siteDescription}`,
    '',
    'LessonFolk is an open-source project that teaches AI to anyone, from complete beginners to advanced practitioners. ' +
      'Learners talk to an AI tutor in their own chat (Claude, ChatGPT and other apps that support MCP); ' +
      'the tutor reads the courses and saves progress through the LessonFolk MCP server. The courses are free.',
    '',
    '## Main pages',
    '',
    `- [Courses](${absoluteUrl(origin, '/courses')}): every course, in the recommended learning order`,
    `- [Connect your AI chat](${absoluteUrl(origin, '/connect')}): how to connect a chat app to the LessonFolk tutor (MCP server: ${absoluteUrl(origin, '/mcp')})`,
    `- [Authors](${absoluteUrl(origin, '/authors')}): who writes the courses`,
    `- [Privacy](${absoluteUrl(origin, '/privacy')}): what is stored and how to delete it`,
    '- [Source code](https://github.com/CGSeb/lessonfolk): open source, MIT license',
    '',
    '## Courses',
    '',
    ...courses.map((course) => {
      const link = `[${course.title}](${absoluteUrl(origin, `/courses/${encodeURIComponent(course.id)}`)})`;
      if (!full) return `- ${link}: ${course.description}`;
      const needs = course.prerequisites.length ? `; builds on ${course.prerequisites.join(', ')}` : '';
      return `- ${link} (${course.level}, about ${course.estimatedHours} h, ${course.lessons.length} lessons${needs}): ${course.description}`;
    }),
    '',
  ];
  return lines.join('\n');
}

const SITE_NAME = 'LessonFolk';
const REPO = 'https://github.com/CGSeb/lessonfolk';

/** JSON-LD of the landing page: the website and the organization behind it. */
export function websiteJsonLd(origin: string, description: string): object[] {
  const home = absoluteUrl(origin, '/');
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: home, description, inLanguage: 'en' },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: home,
      logo: absoluteUrl(origin, '/favicon-32.png'),
      sameAs: [REPO],
    },
  ];
}

const LEVEL_LABEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/** JSON-LD of a course page: the course and its breadcrumb. */
export function courseJsonLd(origin: string, course: SeoCourse, authors: SeoAuthor[], coursesLabel: string): object[] {
  const url = absoluteUrl(origin, `/courses/${encodeURIComponent(course.id)}`);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.description,
      url,
      inLanguage: 'en',
      isAccessibleForFree: true,
      educationalLevel: LEVEL_LABEL[course.level] ?? course.level,
      provider: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl(origin, '/') },
      ...(authors.length
        ? {
            author: authors.map((a) => ({
              '@type': 'Person',
              name: a.name,
              url: absoluteUrl(origin, `/authors/${encodeURIComponent(a.slug)}`),
            })),
          }
        : {}),
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        courseWorkload: `PT${Math.round(course.estimatedHours * 60)}M`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: coursesLabel, item: absoluteUrl(origin, '/courses') },
        { '@type': 'ListItem', position: 2, name: course.title, item: url },
      ],
    },
  ];
}

/** Serialize JSON-LD for a `<script type="application/ld+json">`, safe against `</script>` in the data. */
export function serializeJsonLd(data: object | object[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
