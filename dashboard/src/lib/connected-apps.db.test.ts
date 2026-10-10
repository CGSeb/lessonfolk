import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken, user } from '@lessonfolk/db';
import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';
import { disconnectApp, isTokenAllowed, listConnectedApps } from './connected-apps';

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
  const { db } = testDb;
  await db.insert(user).values([
    { id: 'ann', name: 'Ann', email: 'ann@example.test' },
    { id: 'bob', name: 'Bob', email: 'bob@example.test' },
  ]);
  await db.insert(oauthClient).values([
    { id: 'c1', clientId: 'client-a', name: 'Chat A', redirectUris: ['http://localhost/cb'] },
    { id: 'c2', clientId: 'client-b', name: null, redirectUris: ['http://localhost/cb'] },
  ]);
  const at = new Date('2026-01-01T10:00:00Z');
  await db.insert(oauthConsent).values([
    { id: 'ann-a', clientId: 'client-a', userId: 'ann', scopes: ['openid'], createdAt: at },
    { id: 'ann-b', clientId: 'client-b', userId: 'ann', scopes: ['openid'], createdAt: at },
    { id: 'bob-a', clientId: 'client-a', userId: 'bob', scopes: ['openid'], createdAt: at },
  ]);
  for (const [id, userId, clientId] of [
    ['r-ann-a', 'ann', 'client-a'],
    ['r-bob-a', 'bob', 'client-a'],
  ] as const) {
    await db.insert(oauthRefreshToken).values({ id, token: id, userId, clientId, scopes: ['openid'] });
    await db.insert(oauthAccessToken).values({ id: `a-${id}`, token: `a-${id}`, userId, clientId, scopes: ['openid'] });
  }
});
afterAll(() => testDb?.drop());

describe('listConnectedApps', () => {
  it("lists only the user's own apps", async () => {
    const ann = await listConnectedApps(testDb.db, 'ann');
    expect(ann.map((app) => app.clientId).sort()).toEqual(['client-a', 'client-b']);
    expect(ann.find((app) => app.clientId === 'client-a')).toMatchObject({ id: 'ann-a', name: 'Chat A' });
    expect((await listConnectedApps(testDb.db, 'bob')).map((app) => app.id)).toEqual(['bob-a']);
    expect(await listConnectedApps(testDb.db, 'nobody')).toEqual([]);
  });
});

describe('disconnectApp', () => {
  it("never revokes another user's app", async () => {
    // Bob tries Ann's consent id: nothing changes.
    expect(await disconnectApp(testDb.db, 'bob', 'ann-b')).toBe(false);
    expect(await disconnectApp(testDb.db, 'bob', 'ann-a')).toBe(false);
    expect(await listConnectedApps(testDb.db, 'ann')).toHaveLength(2);
    expect(await testDb.db.select().from(oauthRefreshToken).where(eq(oauthRefreshToken.userId, 'ann'))).toHaveLength(1);
    expect(await testDb.db.select().from(oauthAccessToken).where(eq(oauthAccessToken.userId, 'ann'))).toHaveLength(1);
  });

  it("removes the consent and that user's tokens for that app only", async () => {
    expect(await disconnectApp(testDb.db, 'ann', 'ann-a')).toBe(true);
    expect((await listConnectedApps(testDb.db, 'ann')).map((app) => app.id)).toEqual(['ann-b']);
    expect(await testDb.db.select().from(oauthRefreshToken).where(eq(oauthRefreshToken.userId, 'ann'))).toHaveLength(0);
    expect(await testDb.db.select().from(oauthAccessToken).where(eq(oauthAccessToken.userId, 'ann'))).toHaveLength(0);
    // Bob, same app: untouched.
    expect((await listConnectedApps(testDb.db, 'bob')).map((app) => app.id)).toEqual(['bob-a']);
    expect(await testDb.db.select().from(oauthRefreshToken).where(eq(oauthRefreshToken.userId, 'bob'))).toHaveLength(1);
    expect(await testDb.db.select().from(oauthAccessToken).where(eq(oauthAccessToken.userId, 'bob'))).toHaveLength(1);
    // Already gone.
    expect(await disconnectApp(testDb.db, 'ann', 'ann-a')).toBe(false);
  });
});

describe('isTokenAllowed', () => {
  const issued = Math.floor(new Date('2026-01-01T11:00:00Z').getTime() / 1000);

  it('accepts a token whose user holds the consent, and refuses it once disconnected', async () => {
    expect(await isTokenAllowed(testDb.db, { userId: 'bob', clientId: 'client-a', issuedAt: issued })).toBe(true);
    expect(await isTokenAllowed(testDb.db, { userId: 'ann', clientId: 'client-a', issuedAt: issued })).toBe(false); // disconnected above
    expect(await isTokenAllowed(testDb.db, { userId: 'ann', clientId: 'client-b', issuedAt: issued })).toBe(true);
  });

  it('refuses tokens of another user, another client, or without client or issue time', async () => {
    expect(await isTokenAllowed(testDb.db, { userId: 'bob', clientId: 'client-b', issuedAt: issued })).toBe(false);
    expect(await isTokenAllowed(testDb.db, { userId: 'nobody', clientId: 'client-a', issuedAt: issued })).toBe(false);
    expect(await isTokenAllowed(testDb.db, { userId: 'bob', clientId: undefined, issuedAt: issued })).toBe(false);
    expect(await isTokenAllowed(testDb.db, { userId: 'bob', clientId: 'client-a', issuedAt: undefined })).toBe(false);
  });

  it('refuses a token issued before the current consent, so consenting again does not revive it', async () => {
    const before = Math.floor(new Date('2026-01-01T09:00:00Z').getTime() / 1000);
    expect(await isTokenAllowed(testDb.db, { userId: 'bob', clientId: 'client-a', issuedAt: before })).toBe(false);
  });
});
