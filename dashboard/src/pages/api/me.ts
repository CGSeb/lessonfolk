import type { APIRoute } from 'astro';

export const prerender = false;

/** The current user, as the middleware sees it: `{ authMode, user }` (`user` is null when signed out). */
export const GET: APIRoute = ({ locals }) => {
  const user = locals.user && { id: locals.user.id, name: locals.user.name, email: locals.user.email, image: locals.user.image };
  return Response.json({ authMode: locals.authMode, user }, { headers: { 'Cache-Control': 'no-store' } });
};
