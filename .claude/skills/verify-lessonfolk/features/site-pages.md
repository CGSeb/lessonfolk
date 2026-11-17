# Crawler files, legal pages, analytics and 404

Public support pages: robots, sitemap and the llms files for crawlers (courses, projects and authors), the description of project pages for search engines, the privacy notice and terms for people, and a custom page for unknown addresses. Audience measurement is off unless configured.

## Sub-features

- `site-robots` serves robots rules that keep private pages out of search.
- `site-sitemap` lists the public pages, courses, projects and authors.
- `site-llms` serves the llms files, with a `Projects` section.
- `site-structured-data` describes a project page to search engines (learning resource and breadcrumb) and keeps an unknown project out of search.
- `site-legal` shows the privacy notice and the terms of use.
- `site-404` shows the custom not-found page with a 404 status.
- `site-analytics-off` includes no measurement tag when it is not configured.

## How to get to it (user POV)

- The footer links `Privacy notice` and `Terms of use`.
- Any wrong address, for the 404 page.
- Crawlers fetch `/robots.txt`, `/sitemap.xml`, `/llms.txt` and `/llms-full.txt`, and read the head of each project page.

## Driving it with verify

Preconditions:

- Baseline state; `launch` does not set `UMAMI_WEBSITE_ID`, so analytics is off.

States to exercise:

- Existing page, missing page, files for crawlers.

- **Sitemap.** Run `verify http GET /sitemap.xml --body 8000 --feature site-pages --path sitemap.json`. Status `200`, XML, `bodyStart` contains `/courses/ai-foundations`, `/projects`, `/projects/reusable-prompt` and `/authors/lessonfolk`, and no `/account`.
- **llms files.** Run `verify http GET /llms.txt --body 20000 --feature site-pages --path llms.json`. Status `200`, text, `bodyStart` contains `## Courses`, `## Projects` and `/projects/reusable-prompt`. Then `verify http GET /llms-full.txt --body 40000 --feature site-pages --path llms-full.json`: the project lines also give their milestones.
- **Project page for search engines.** Run `verify http GET /projects/reusable-prompt --body 200000 --feature site-pages --path project-html.json`. `bodyStart` contains `"learningResourceType":"Project"` and `BreadcrumbList`. Run `verify http GET /projects/nope --header "Accept: text/html" --body 100000 --feature site-pages --path project-404.json`: status `404` and `noindex` in `bodyStart`.
- **Robots.** Run `verify http GET /robots.txt --feature site-pages --path robots.json`. Status `200`, text with `Allow: /` and `Disallow` lines for `/account`, `/api`, `/mcp`, `/oauth`, `/sign-in` and `/sign-out`.
- **Legal pages.** Run `verify browser goto --url / --feature site-pages`, then `verify browser click --role link --name "Privacy notice" --feature site-pages` and `verify browser expect-url --url /privacy --feature site-pages`; repeat with `Terms of use` and `/terms`.
- **Custom 404.** Run `verify http GET /no-such-page --header "Accept: text/html" --feature site-pages --path not-found.json`. Status `404`.
- **No analytics tag.** `verify http GET / --body 100000 --feature site-pages --path home-html.json`: `bodyStart` has no `umami` reference.
- **Proof.** `verify browser goto --url /privacy --feature site-pages`, `verify browser snapshot --path privacy.aria.txt --feature site-pages`, `verify browser screenshot --path privacy.png --feature site-pages`, with the JSON files. Read-only feature: the second view is the status and body of the files.

## Gotchas

- `GET /404` also exists as a route; the real unknown-address behavior is checked with an address that has no page.
- Privacy and terms wording change: assert the URL and headings, not paragraphs.
- Measurement on (with `UMAMI_WEBSITE_ID`) needs a launch with that variable: not part of the baseline, unverified here.
- `--body` cuts the response: keep it large enough for the sitemap, the llms files and the project page head (the structured data sits in `<head>`).
- The sitemap and llms files list the English projects only.
