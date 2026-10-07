import type { APIRoute } from 'astro';
import { getProgressStore } from '../../../lib/store';

export const prerender = false;

/** The current learner's progress as a progress.json download (the format the tutor writes). */
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return new Response('Sign in to download your progress.', { status: 401 });
  const text = await getProgressStore().exportProgress(locals.user.id);
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="progress.json"',
      'Cache-Control': 'no-store',
    },
  });
};
