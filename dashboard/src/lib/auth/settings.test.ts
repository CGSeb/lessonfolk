import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './redirect';
import {
  AuthConfigError,
  checkStartup,
  enabledProviders,
  exposedHost,
  isLoopback,
  readAuthSettings,
  type OAuthSettings,
} from './settings';

const SECRET = 'x'.repeat(32);
const oauth = (env: Record<string, string>) =>
  readAuthSettings({ LESSONFOLK_AUTH: 'oauth', LESSONFOLK_BASE_URL: 'http://localhost:4321', BETTER_AUTH_SECRET: SECRET, ...env });
const github = { GITHUB_CLIENT_ID: 'gh-id', GITHUB_CLIENT_SECRET: 'gh-secret' };
const google = { GOOGLE_CLIENT_ID: 'g-id', GOOGLE_CLIENT_SECRET: 'g-secret' };

describe('readAuthSettings', () => {
  it('defaults to none', () => {
    expect(readAuthSettings({})).toEqual({ mode: 'none' });
    expect(readAuthSettings({ LESSONFOLK_AUTH: ' NONE ' })).toEqual({ mode: 'none' });
  });

  it('rejects an unknown mode', () => {
    expect(() => readAuthSettings({ LESSONFOLK_AUTH: 'github' })).toThrow(/Use "none".*or "oauth"/);
  });

  it('enables only the providers whose credentials are set', () => {
    expect(enabledProviders(oauth(github) as OAuthSettings)).toEqual(['github']);
    expect(enabledProviders(oauth(google) as OAuthSettings)).toEqual(['google']);
    expect(enabledProviders(oauth({ ...google, ...github }) as OAuthSettings)).toEqual(['github', 'google']);
    expect(oauth(github)).toMatchObject({
      mode: 'oauth',
      baseURL: 'http://localhost:4321',
      providers: { github: { clientId: 'gh-id', clientSecret: 'gh-secret' } },
    });
  });

  it('refuses oauth with no provider', () => {
    expect(() => oauth({})).toThrow(AuthConfigError);
    expect(() => oauth({})).toThrow(/needs at least one sign-in provider/);
  });

  it('refuses half a pair of credentials', () => {
    expect(() => oauth({ GITHUB_CLIENT_ID: 'gh-id' })).toThrow(/GITHUB_CLIENT_SECRET is missing/);
    expect(() => oauth({ ...github, GOOGLE_CLIENT_SECRET: 'g-secret' })).toThrow(/GOOGLE_CLIENT_ID is missing/);
  });

  it('needs a usable LESSONFOLK_BASE_URL', () => {
    const env = { LESSONFOLK_AUTH: 'oauth', BETTER_AUTH_SECRET: SECRET, ...github };
    expect(() => readAuthSettings(env)).toThrow(/needs LESSONFOLK_BASE_URL/);
    expect(() => readAuthSettings({ ...env, LESSONFOLK_BASE_URL: 'localhost:4321' })).toThrow(/http:\/\/ or https:\/\//);
    expect(() => readAuthSettings({ ...env, LESSONFOLK_BASE_URL: 'http://learn.example.com' })).toThrow(/https:\/\//);
    expect(() => readAuthSettings({ ...env, LESSONFOLK_BASE_URL: 'https://example.com/app' })).toThrow(/without a path/);
    expect(readAuthSettings({ ...env, LESSONFOLK_BASE_URL: 'https://learn.example.com/' })).toMatchObject({
      baseURL: 'https://learn.example.com',
    });
  });

  it('needs a long enough BETTER_AUTH_SECRET', () => {
    expect(() => oauth({ ...github, BETTER_AUTH_SECRET: 'short' })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('accepts the fake provider only in tests, on 127.0.0.1', () => {
    const fake = { LESSONFOLK_TEST_OAUTH_URL: 'http://127.0.0.1:9999' };
    expect(enabledProviders(oauth({ ...fake, NODE_ENV: 'test' }) as OAuthSettings)).toEqual(['fake']);
    expect(() => oauth({ ...fake, NODE_ENV: 'production' })).toThrow(/automated tests only/);
    expect(() => oauth({ ...github, ...fake })).toThrow(/automated tests only/);
    expect(() => oauth({ LESSONFOLK_TEST_OAUTH_URL: 'http://example.com', NODE_ENV: 'test' })).toThrow(/127\.0\.0\.1/);
  });
});

describe('checkStartup', () => {
  it('runs none mode on loopback addresses only', () => {
    for (const host of ['127.0.0.1', 'localhost', '::1', '[::1]']) {
      expect(() => checkStartup({ mode: 'none' }, { host, from: 'HOST' })).not.toThrow();
    }
    for (const host of ['0.0.0.0', '::', '192.168.1.20']) {
      expect(() => checkStartup({ mode: 'none' }, { host, from: 'HOST' })).toThrow(/only runs on 127\.0\.0\.1/);
    }
  });

  it('lets oauth mode listen anywhere', () => {
    expect(() => checkStartup(oauth(github), { host: '0.0.0.0', from: 'HOST' })).not.toThrow();
  });
});

describe('checkStartup and a public address', () => {
  const local = { host: '127.0.0.1', from: 'HOST' };
  it('refuses no sign-in when LESSONFOLK_BASE_URL is a public address (behind a reverse proxy)', () => {
    expect(() => checkStartup({ mode: 'none' }, local, { LESSONFOLK_BASE_URL: 'https://lessonfolk.example' })).toThrow(/LESSONFOLK_BASE_URL/);
  });
  it('allows no sign-in with a local or missing LESSONFOLK_BASE_URL', () => {
    expect(() => checkStartup({ mode: 'none' }, local, { LESSONFOLK_BASE_URL: 'http://localhost:4321' })).not.toThrow();
    expect(() => checkStartup({ mode: 'none' }, local, {})).not.toThrow();
  });
});

describe('exposedHost', () => {
  it('uses the published address (docker compose) before the listening address', () => {
    expect(exposedHost({})).toEqual({ host: '127.0.0.1', from: 'HOST' });
    expect(exposedHost({ HOST: '0.0.0.0' })).toEqual({ host: '0.0.0.0', from: 'HOST' });
    expect(exposedHost({ HOST: '0.0.0.0', LESSONFOLK_BIND: '127.0.0.1' })).toEqual({ host: '127.0.0.1', from: 'LESSONFOLK_BIND' });
    expect(exposedHost({ HOST: '0.0.0.0', LESSONFOLK_BIND: '0.0.0.0' })).toEqual({ host: '0.0.0.0', from: 'LESSONFOLK_BIND' });
  });
});

describe('isLoopback', () => {
  it('recognises this computer only', () => {
    expect(isLoopback('127.0.0.1')).toBe(true);
    expect(isLoopback('127.1.2.3')).toBe(true);
    expect(isLoopback('LOCALHOST')).toBe(true);
    expect(isLoopback('0.0.0.0')).toBe(false);
    expect(isLoopback('localhost.example.com')).toBe(false);
    expect(isLoopback('127.0.0.1.example.com')).toBe(false);
  });
});

describe('safeReturnPath', () => {
  it('keeps same-site paths and drops everything else', () => {
    expect(safeReturnPath('/courses?theme=x')).toBe('/courses?theme=x');
    for (const next of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'courses', '/\t/evil.example', '/\n/evil.example', '/\r\n/evil.example', '/\u0000']) {
      expect(safeReturnPath(next)).toBe('/');
    }
  });
});
