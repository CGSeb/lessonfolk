import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/seo';
import { siteOrigin } from '../lib/site-url';

export const GET: APIRoute = ({ url }) =>
  new Response(buildRobotsTxt(siteOrigin(url)), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
