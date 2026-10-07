import type { APIRoute } from 'astro';
import { importProblem, MAX_IMPORT_BYTES } from '../../../lib/account';
import { redirectWithCookies } from '../../../lib/auth/redirect';
import { getProgressStore } from '../../../lib/store';

export const prerender = false;

/**
 * Step 2 of an import: the preview page (/account/import) posts the checked progress.json
 * here. It is checked again and replaces the learner's progress. Cross-site posts are refused
 * by the origin check (src/lib/auth/origin-check.ts).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) return redirectWithCookies('/sign-in?next=%2Faccount');
  const form = await request.formData().catch(() => undefined);
  const text = form?.get('progress');
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_IMPORT_BYTES) {
    return redirectWithCookies('/account?error=expired');
  }
  try {
    const progress = await getProgressStore().importProgress(locals.user.id, text, { client: 'dashboard' });
    return redirectWithCookies(`/account?imported=${Object.keys(progress.lessons).length}`);
  } catch (error) {
    if (!importProblem(error)) throw error;
    return redirectWithCookies('/account?error=expired');
  }
};
