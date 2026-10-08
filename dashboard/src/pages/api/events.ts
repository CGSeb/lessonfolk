import type { APIRoute } from 'astro';
import { getPaths } from '../../lib/paths';
import { createChangeHub, getProgressHub, type ChangeArea } from '../../lib/watch';

export const prerender = false;

/** Keeps idle connections open through proxies and lets us notice closed ones. */
const HEARTBEAT_MS = 25_000;
/** How long the browser waits before reconnecting after the stream drops. */
const RETRY_MS = 2_000;

const hub = createChangeHub(() => ({ coursesDir: getPaths().courses }));

/**
 * Server-Sent Events stream for the signed-in user (401 when signed out). Sends
 * `event: change` with `data: progress` whenever a write is saved for this user (for
 * example by the tutor through MCP; other users' writes never reach this stream), and
 * `data: courses` when the course files change on disk (development).
 */
export const GET: APIRoute = ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response('Sign in to follow your progress.', { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      const unsubscribe = hub.subscribe((area: ChangeArea) => send(`event: change\ndata: ${area}\n\n`));
      const unsubscribeProgress = getProgressHub().subscribe(user.id, () => send('event: change\ndata: progress\n\n'));
      const heartbeat = setInterval(() => send(': heartbeat\n\n'), HEARTBEAT_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        unsubscribeProgress();
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {
          // Already closed or cancelled.
        }
      };
      request.signal.addEventListener('abort', cleanup);
      if (request.signal.aborted) cleanup();

      send(`retry: ${RETRY_MS}\n: connected\n\n`);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
