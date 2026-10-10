/**
 * Abuse limits for the OAuth endpoints (`/api/auth/oauth2/*`: registration, authorize, token,
 * revoke…) of LESSONFOLK_AUTH=oauth. Better Auth has its own rate limits, but they only run
 * when NODE_ENV=production; these always run, per caller address, and also cap the size of
 * the body (registration is open to anyone).
 */
import { callerAddress, limitBodySize, limitRequest, type RequestInfo } from './limits.ts';
import { createRateLimiter, type RateLimitOptions, type RateLimiter } from './rate-limit.ts';

/** Largest body an OAuth endpoint accepts: registration metadata and token forms are tiny. */
export const OAUTH_MAX_BODY_BYTES = 64 * 1024;

export interface OAuthLimitOptions {
  /** Requests per window and caller for each OAuth endpoint (the last path segment of `/oauth2/<name>`). */
  limits?: Record<string, RateLimitOptions>;
  /** Used for any other endpoint under `/oauth2/`. */
  fallback?: RateLimitOptions;
  maxBodyBytes?: number;
}

const MINUTE = 60_000;

export const DEFAULT_OAUTH_LIMITS: Record<string, RateLimitOptions> = {
  register: { limit: 10, windowMs: MINUTE },
  token: { limit: 60, windowMs: MINUTE },
  authorize: { limit: 60, windowMs: MINUTE },
};
export const DEFAULT_OAUTH_FALLBACK: RateLimitOptions = { limit: 120, windowMs: MINUTE };

/**
 * Returns a function to call first on every request to Better Auth's routes. For
 * `/oauth2/*` it answers 429 (too many requests) or 413 (body too large); otherwise it
 * returns the request to hand to Better Auth. Other paths are not limited here.
 */
export function createOAuthLimits({
  limits = DEFAULT_OAUTH_LIMITS,
  fallback = DEFAULT_OAUTH_FALLBACK,
  maxBodyBytes = OAUTH_MAX_BODY_BYTES,
}: OAuthLimitOptions = {}) {
  const limiters = new Map<string, RateLimiter>();
  const limiterFor = (name: string) => {
    let limiter = limiters.get(name);
    if (!limiter) {
      limiter = createRateLimiter(limits[name] ?? fallback);
      limiters.set(name, limiter);
    }
    return limiter;
  };
  return async (request: Request, info?: RequestInfo): Promise<Request | Response> => {
    const match = /\/oauth2\/([^/?#]+)\/?$/.exec(new URL(request.url).pathname);
    if (!match) return request;
    const name = limits[match[1]] ? match[1] : 'other';
    const tooMany = limitRequest(limiterFor(name), callerAddress(request, info));
    if (tooMany) return tooMany;
    return limitBodySize(request, maxBodyBytes);
  };
}
