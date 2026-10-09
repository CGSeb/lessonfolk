import type { APIRoute } from 'astro';
import { inspectCatalog } from '@lessonfolk/core';
import { buildSitemap, publicPaths } from '../lib/seo';
import { siteOrigin } from '../lib/site-url';

// Read on every request so new courses show up without a restart.
export const GET: APIRoute = ({ url }) => {
  const { catalog } = inspectCatalog('en');
  const paths = publicPaths(
    catalog.courses.map((course) => course.id),
    catalog.authors.map((author) => author.slug),
  );
  return new Response(buildSitemap(siteOrigin(url), paths), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
