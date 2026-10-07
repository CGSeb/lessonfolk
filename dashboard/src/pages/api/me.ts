import type { APIRoute } from 'astro';

export const prerender = false;

/** The current user, as the middleware sees it: `{ authMode, user }` (`user` is null when signed out). */
export const GET: APIRoute = ({ locals }) =>
  Response.json({ authMode: locals.authMode, user: locals.user }, { headers: { 'Cache-Control': 'no-store' } });
