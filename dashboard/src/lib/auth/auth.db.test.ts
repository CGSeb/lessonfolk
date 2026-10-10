import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { createAuth, SESSION_POLICY } from './auth';
import type { OAuthSettings } from './settings';

const settings = (baseURL: string): OAuthSettings => ({
  mode: 'oauth',
  baseURL,
  secret: 'test-secret-that-is-long-enough-1234567890',
  providers: { github: { clientId: 'id', clientSecret: 'secret' } },
});

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(() => testDb?.drop());

const configuration = async (baseURL: string) => {
  const context = await createAuth(settings(baseURL), testDb.db).$context;
  return { options: context.options, session: context.authCookies.sessionToken };
};

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax and Secure behind https', async () => {
    const { session } = await configuration('https://lessonfolk.example');
    expect(session.name.startsWith('__Secure-')).toBe(true);
    expect(session.attributes).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
  });

  it('is not Secure on plain http (localhost development), but still HttpOnly and SameSite=Lax', async () => {
    const { session } = await configuration('http://localhost:4321');
    expect(session.attributes).toMatchObject({ httpOnly: true, sameSite: 'lax' });
    expect(session.attributes.secure).toBeFalsy();
  });

  it('expires after 7 days without use', async () => {
    const { options } = await configuration('https://lessonfolk.example');
    expect(options.session).toMatchObject(SESSION_POLICY);
    expect(SESSION_POLICY.expiresIn).toBe(7 * 24 * 60 * 60);
  });
});

describe('account linking', () => {
  it('trusts no provider: a second provider joins an account only with a verified, identical email', async () => {
    const { options } = await configuration('https://lessonfolk.example');
    expect(options.account?.accountLinking).toMatchObject({
      enabled: true,
      trustedProviders: [],
      allowDifferentEmails: false,
      requireLocalEmailVerified: true,
    });
  });
});
