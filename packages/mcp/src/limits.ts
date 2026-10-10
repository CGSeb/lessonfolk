/**
 * Abuse limits shared by the MCP endpoint and the OAuth endpoints: who is calling (for the
 * rate limits), a cap on request bodies, and the 413 / 429 answers.
 */
import type { RateLimiter } from './rate-limit.ts';

/** Where the request comes from, as the app can tell. */
export interface RequestInfo {
  /** The socket address of the caller (Astro's `clientAddress`), used when no proxy header is present. */
  clientAddress?: string;
}

/**
 * The caller's IP address. Behind the reverse proxy of a hosted LessonFolk (Caddy sets
 * `X-Forwarded-For` from the real connection and drops any value the caller sent), the last
 * `X-Forwarded-For` entry is the one the proxy added, so it is the caller (earlier ones can be forged). Without a proxy it falls back to the socket address.
 * An app exposed directly to the internet should not rely on this for security: put it behind
 * the proxy of `deploy/`.
 */
export function callerAddress(request: Request, info?: RequestInfo): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  return (forwarded || info?.clientAddress || 'unknown').slice(0, 64);
}

export const tooManyRequests = (seconds: number) =>
  Response.json(
    { error: 'rate_limited', error_description: `Too many requests: wait ${seconds} seconds, then try again.` },
    { status: 429, headers: { 'Retry-After': String(seconds) } },
  );

export const payloadTooLarge = (maxBytes: number) =>
  Response.json(
    { error: 'payload_too_large', error_description: `The request is larger than ${maxBytes} bytes.` },
    { status: 413 },
  );

/** Takes one request from `limiter` for `key`: a 429 when over the limit, else `undefined`. */
export function limitRequest(limiter: RateLimiter, key: string): Response | undefined {
  const wait = limiter.take(key);
  return wait ? tooManyRequests(wait) : undefined;
}

/**
 * Caps the size of a request body. Refuses at once (413) when `Content-Length` is over the
 * limit, and reads a body without one (chunked) only up to the limit. Returns the request to
 * serve (its body read once, so it can be read again) or the 413 response.
 */
export async function limitBodySize(request: Request, maxBytes: number): Promise<Request | Response> {
  if (!request.body) return request;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return payloadTooLarge(maxBytes);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return payloadTooLarge(maxBytes);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request, { body, duplex: 'half' } as RequestInit);
}
