import type { APIRoute } from 'astro';
import { inspectCatalog } from '@lessonfolk/core';
import { t } from '../i18n/en';
import { buildLlmsTxt } from '../lib/seo';
import { siteOrigin } from '../lib/site-url';

export const GET: APIRoute = ({ url }) => {
  const { catalog } = inspectCatalog('en');
  return new Response(buildLlmsTxt(siteOrigin(url), catalog.courses, t('site.description')), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
