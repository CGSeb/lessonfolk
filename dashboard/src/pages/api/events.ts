import type { APIRoute } from 'astro';
import { getPaths } from '../../lib/paths';
import { createChangeHub, type ChangeArea } from '../../lib/watch';

export const prerender = false;

/** Keeps idle connections open through proxies and lets us notice closed ones. */
const HEARTBEAT_MS = 25_000;
/** How long the browser waits before reconnecting after the stream drops. */
const RETRY_MS = 2_000;

const hub = createChangeHub(() => {
  const { progress, courses } = getPaths();
  return { progressDir: progress, coursesDir: courses };
});

/**
 * Server-Sent Events stream: sends `event: change` with `data: progress|courses`
 * whenever the learner's progress or the course files change on disk.
 */
export const GET: APIRoute = ({ request }) => {
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
      const heartbeat = setInterval(() => send(': heartbeat\n\n'), HEARTBEAT_MS);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
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
