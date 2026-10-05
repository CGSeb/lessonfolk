import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import type { APIRoute } from 'astro';
import { authorAvatarPath, inspectCatalog } from '../../../../lib/courses';

export const prerender = false;

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * An author's avatar image from `courses/authors/`. Only files named in a valid
 * `authors.yaml` entry are served (the loader has checked the name, the file and
 * its size). Revalidated on every use so a replaced image shows up at once.
 */
export const GET: APIRoute = ({ params, request }) => {
  const author = inspectCatalog('en').catalog.authors.find((a) => a.slug === params.slug);
  const type = author?.avatar && TYPES[extname(author.avatar).toLowerCase()];
  if (!author?.avatar || !type) return new Response(null, { status: 404 });

  const file = authorAvatarPath(author.avatar);
  let etag: string;
  try {
    const { mtimeMs, size } = statSync(file);
    etag = `"${Math.round(mtimeMs).toString(36)}-${size.toString(36)}"`;
  } catch {
    return new Response(null, { status: 404 }); // Removed since the catalog was read.
  }
  const headers = {
    'Content-Type': type,
    'Cache-Control': 'no-cache',
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    // An SVG opened on its own must not run scripts or load anything.
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  };
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers });
  return new Response(readFileSync(file), { headers });
};
