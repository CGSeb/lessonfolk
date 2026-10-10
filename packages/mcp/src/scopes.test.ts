import { describe, expect, it } from 'vitest';
import { accessFromScopes, parseScopeClaim, requestedAccess, withoutWrite } from './scopes.ts';

describe('accessFromScopes', () => {
  it('gives full access when there are no token scopes (none mode)', () => {
    expect(accessFromScopes(undefined)).toEqual({ read: true, write: true });
  });

  it('keeps full access for tokens with only OpenID scopes (clients and tokens that predate lessonfolk scopes)', () => {
    expect(accessFromScopes(['openid', 'profile', 'email', 'offline_access'])).toEqual({ read: true, write: true });
    expect(accessFromScopes([])).toEqual({ read: true, write: true });
  });

  it('limits a token that names lessonfolk scopes to them', () => {
    expect(accessFromScopes(['openid', 'lessonfolk:read'])).toEqual({ read: true, write: false });
    expect(accessFromScopes(['lessonfolk:write'])).toEqual({ read: true, write: true });
    expect(accessFromScopes(['openid', 'lessonfolk:read', 'lessonfolk:write'])).toEqual({ read: true, write: true });
  });
});

describe('parseScopeClaim', () => {
  it('reads a space-separated string or an array, and nothing else', () => {
    expect(parseScopeClaim('openid  lessonfolk:read')).toEqual(['openid', 'lessonfolk:read']);
    expect(parseScopeClaim(['a', 1, 'b'])).toEqual(['a', 'b']);
    expect(parseScopeClaim(undefined)).toBeUndefined();
  });
});

describe('consent helpers', () => {
  it('tells what a request asks for', () => {
    expect(requestedAccess('openid lessonfolk:read')).toEqual({ read: true, write: false, specific: true });
    expect(requestedAccess('openid lessonfolk:read lessonfolk:write')).toEqual({ read: true, write: true, specific: true });
    expect(requestedAccess('openid')).toEqual({ read: true, write: true, specific: false });
    expect(requestedAccess(null)).toEqual({ read: true, write: true, specific: false });
  });

  it('drops the write scope, keeps read, and does nothing without a write scope', () => {
    expect(withoutWrite('openid lessonfolk:read lessonfolk:write')).toBe('openid lessonfolk:read');
    expect(withoutWrite('openid lessonfolk:write')).toBe('openid lessonfolk:read');
    expect(withoutWrite('openid lessonfolk:read')).toBeUndefined();
    expect(withoutWrite('openid')).toBeUndefined();
  });
});
