/**
 * A small in-memory rate limit for the write tools: at most `limit` writes per user in any
 * window of `windowMs`. One process only (the app runs as a single Node server); a write the
 * store rejects still counts, so a looping client cannot hammer the database either.
 */
export interface RateLimiter {
  /** Count one write for `key`. Returns 0 when allowed, else the seconds to wait. */
  take(key: string): number;
}

export interface RateLimitOptions {
  /** Writes allowed per window. */
  limit: number;
  windowMs: number;
  now?: () => number;
}

/** Default for the write tools: 60 writes per minute per user, far above what a tutor needs. */
export const DEFAULT_WRITE_LIMIT: RateLimitOptions = { limit: 60, windowMs: 60_000 };

export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimitOptions): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    take(key) {
      const time = now();
      const recent = (hits.get(key) ?? []).filter((at) => time - at < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return Math.max(1, Math.ceil((recent[0] + windowMs - time) / 1000));
      }
      recent.push(time);
      hits.set(key, recent);
      // Forget idle users now and then so the map does not grow forever.
      if (hits.size > 10_000) {
        for (const [k, list] of hits) if (!list.some((at) => time - at < windowMs)) hits.delete(k);
      }
      return 0;
    },
  };
}
