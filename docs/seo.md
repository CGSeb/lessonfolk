# Search engines and AI search

How LessonFolk makes its public pages easy to find in search engines (Google, Bing) and easy to read and cite for AI assistants (ChatGPT search, Perplexity, Claude, Gemini). The code is in `dashboard/src/lib/seo.ts` and `dashboard/src/layouts/BaseLayout.astro`.

## What is public and what is private

- **Public** (open to every crawler, listed in the sitemap): `/` (the landing page), `/courses`, `/courses/<id>`, `/authors`, `/authors/<slug>`, `/connect`, `/privacy`.
- **Private** (`PRIVATE_PATHS` in `seo.ts`): `/account`, `/api`, `/mcp`, `/oauth`, `/sign-in`, `/sign-out`. They are disallowed in `robots.txt`, send an `X-Robots-Tag: noindex, nofollow` header (`src/middleware.ts`), and the pages also carry `<meta name="robots" content="noindex">` (`noindex` prop of `BaseLayout`). "Not found" pages are `noindex` too.

When you add a page, decide which one it is: a public page goes in `publicPaths()` (the sitemap); a private one goes in `PRIVATE_PATHS`.

## What every page gets

`BaseLayout` writes, from its `title`, `description`, `noindex`, `ogType` and `jsonLd` props:

- a unique `<title>` and meta description (pass `description`; the site description is only a fallback),
- a canonical URL (no query string, no trailing slash),
- Open Graph and Twitter card tags with the share image `public/og-image.png` (1200×630),
- the `robots` meta tag,
- a link to `/llms.txt`.

The site address comes from `LESSONFOLK_BASE_URL` when people sign in, and from the request otherwise (`src/lib/site-url.ts`). Set `LESSONFOLK_BASE_URL` on a hosted LessonFolk so canonical URLs and the sitemap use the public address.

## Files for crawlers

| URL | What it is |
|---|---|
| `/robots.txt` | Public pages open, private paths disallowed, link to the sitemap. |
| `/sitemap.xml` | The public pages, courses and authors read from `courses/` on every request. |
| `/llms.txt` | A plain Markdown summary of LessonFolk and its courses for AI assistants ([llms.txt format](https://llmstxt.org)). |
| `/llms-full.txt` | The same, with each course's level, duration, lesson count and prerequisites. |

## Policy for AI crawlers

LessonFolk is open source and wants to be recommended, so public pages are open to search and citation bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot…), to bots that fetch a page for a user (ChatGPT-User, Claude-User, Perplexity-User) and to training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot). The list is `AI_CRAWLERS` in `seo.ts`; to block one, remove it there and give it `Disallow: /` in `buildRobotsTxt`. The course texts are CC BY 4.0 licensed anyway. Private paths are closed to all of them.

## Structured data (JSON-LD)

- Landing page (signed out): `WebSite` and `Organization`.
- Course page: `Course` (provider, authors, level, free, workload) and `BreadcrumbList`.

## Content rules for crawlers

Pages are rendered on the server, so their text is in the HTML without JavaScript. Keep one `<h1>` per page and a clear heading order. Give images a descriptive `alt` (decorative images get `alt=""`). Write course descriptions as one or two plain sentences that say what you will learn and for whom: AI assistants quote them.

## Checking it

- Automated: `dashboard/tests/e2e/seo.db.test.ts` and `dashboard/src/lib/seo.test.ts` (part of `npm test`).
- By hand, on a running dashboard: open `/robots.txt`, `/sitemap.xml` and `/llms.txt`; run Lighthouse (Chrome DevTools) on `/` and a course page and check the SEO score is 100; paste a course page in the [Rich Results Test](https://search.google.com/test/rich-results) or the [Schema.org validator](https://validator.schema.org).

## For the site owner (needs your accounts)

Once the site is public: add it to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters), submit `/sitemap.xml`, and use the GitHub repository description and topics (for example `ai`, `education`, `mcp`, `ai-tutor`) with the same wording as the site.
