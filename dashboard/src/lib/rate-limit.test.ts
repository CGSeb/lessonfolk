import { describe, expect, it } from 'vitest';
import { bodySizeResponse, MAX_FORM_BODY_BYTES, routeLimit } from './rate-limit';

describe('routeLimit', () => {
  it('limits sign-in, account and API routes, and leaves pages, MCP and OAuth endpoints to others', () => {
    expect(routeLimit('POST', '/sign-in/github')?.group).toBe('sign-in');
    expect(routeLimit('GET', '/sign-in')).toBeUndefined();
    expect(routeLimit('POST', '/account/import')?.group).toBe('account');
    expect(routeLimit('POST', '/api/account/delete')?.group).toBe('account');
    expect(routeLimit('GET', '/api/auth/callback/github')?.group).toBe('auth');
    expect(routeLimit('GET', '/api/events')?.group).toBe('api');
    for (const path of ['/', '/courses', '/mcp', '/api/auth/oauth2/token', '/api/auth/mcp/jwks', '/oauth/consent', '/.well-known/x']) {
      expect(routeLimit('GET', path), path).toBeUndefined();
    }
  });
});

describe('bodySizeResponse', () => {
  const post = (headers: Record<string, string>) => new Request('http://x/account/import', { method: 'POST', headers });

  it('refuses a form body declared too large, or without a length but chunked', () => {
    expect(bodySizeResponse(post({ 'content-length': String(MAX_FORM_BODY_BYTES + 1) }), '/account/import')?.status).toBe(413);
    expect(bodySizeResponse(post({ 'transfer-encoding': 'chunked' }), '/account/import')?.status).toBe(411);
  });

  it('lets small bodies, other routes and other methods through', () => {
    expect(bodySizeResponse(post({ 'content-length': '100' }), '/account/import')).toBeUndefined();
    expect(bodySizeResponse(post({ 'content-length': '999999999' }), '/mcp')).toBeUndefined();
    expect(bodySizeResponse(new Request('http://x/account/import'), '/account/import')).toBeUndefined();
  });
});
