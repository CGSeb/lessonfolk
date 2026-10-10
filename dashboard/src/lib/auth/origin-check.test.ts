import { describe, expect, it } from 'vitest';
import { crossSiteFormResponse, foreignHostResponse } from './origin-check';

const ORIGIN = 'http://localhost:4321';

function check(path: string, init: { method?: string; origin?: string; contentType?: string; publicOrigin?: string } = {}) {
  const headers = new Headers();
  if (init.origin) headers.set('origin', init.origin);
  if (init.contentType) headers.set('content-type', init.contentType);
  const url = new URL(path, ORIGIN);
  return crossSiteFormResponse(new Request(url, { method: init.method ?? 'POST', headers }), url, init.publicOrigin)?.status;
}

describe('crossSiteFormResponse', () => {
  it('refuses form posts from another site or without an Origin, like Astro', () => {
    expect(check('/sign-in/github', { origin: 'https://evil.example', contentType: 'application/x-www-form-urlencoded' })).toBe(403);
    expect(check('/oauth/consent/decide', { contentType: 'application/x-www-form-urlencoded' })).toBe(403);
    expect(check('/sign-out', { origin: 'https://evil.example' })).toBe(403);
  });

  it('lets same-site forms, reads and JSON requests through', () => {
    expect(check('/sign-in/github', { origin: ORIGIN, contentType: 'application/x-www-form-urlencoded' })).toBeUndefined();
    expect(check('/courses', { method: 'GET', origin: 'https://evil.example' })).toBeUndefined();
    expect(check('/mcp', { contentType: 'application/json' })).toBeUndefined();
  });

  it('accepts the public address behind a proxy that ends HTTPS, and still refuses other sites', () => {
    const behindProxy = { publicOrigin: 'https://lessonfolk.com', contentType: 'application/x-www-form-urlencoded' };
    expect(check('/sign-in/github', { ...behindProxy, origin: 'https://lessonfolk.com' })).toBeUndefined();
    expect(check('/sign-in/github', { ...behindProxy, origin: 'https://evil.example' })).toBe(403);
    expect(check('/sign-in/github', { ...behindProxy })).toBe(403);
    expect(check('/sign-in/github', { ...behindProxy, origin: ORIGIN })).toBe(403);
    expect(check('/sign-in/github', { contentType: behindProxy.contentType, origin: 'https://lessonfolk.com' })).toBe(403);
  });

  it('lets apps post forms to the OAuth token, revoke and introspect endpoints', () => {
    for (const name of ['token', 'revoke', 'introspect']) {
      expect(check(`/api/auth/oauth2/${name}`, { contentType: 'application/x-www-form-urlencoded' })).toBeUndefined();
    }
    expect(check('/api/auth/oauth2/consent', { contentType: 'application/x-www-form-urlencoded' })).toBe(403);
  });
});

describe('foreignHostResponse (LESSONFOLK_AUTH=none)', () => {
  const status = (host: string) => foreignHostResponse(new Request('http://localhost:4321/', { headers: { host } }))?.status;

  it('answers on this computer', () => {
    for (const host of ['127.0.0.1:4321', 'localhost:4321', 'localhost', '[::1]:4321', 'lessonfolk.localhost:4321']) {
      expect(status(host)).toBeUndefined();
    }
  });

  it('refuses other names, which is how DNS rebinding and reverse proxies arrive', () => {
    for (const host of ['evil.example', 'evil.example:4321', '127.0.0.1.evil.example', 'lessonfolk.com', '192.168.1.20:4321']) {
      expect(status(host)).toBe(403);
    }
  });
});
