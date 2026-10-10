/** Database test: runs against a real Postgres (see docs/testing.md). */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { purgeUnusedOAuthClients } from './oauth-clients.ts';
import { oauthClient, oauthConsent, user } from './schema.ts';
import { createTestDatabase, type TestDatabase } from './testing.ts';

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});

afterAll(async () => {
  await testDb?.drop();
});

const DAY = 24 * 60 * 60 * 1000;

describe('purgeUnusedOAuthClients', () => {
  it('deletes old clients nobody allowed, and keeps recent or consented ones', async () => {
    const { db } = testDb;
    const now = new Date();
    const old = new Date(now.getTime() - 30 * DAY);
    const recent = new Date(now.getTime() - 1 * DAY);
    const client = (id: string, createdAt: Date) => ({ id, clientId: id, redirectUris: ['http://localhost:1/cb'], createdAt });
    await db.insert(user).values({ id: 'u1', name: 'U', email: 'u@example.test', emailVerified: true, createdAt: now, updatedAt: now });
    await db.insert(oauthClient).values([client('old-unused', old), client('old-consented', old), client('recent-unused', recent)]);
    await db.insert(oauthConsent).values({ id: 'c1', clientId: 'old-consented', userId: 'u1', scopes: ['openid'], createdAt: now });

    expect(await purgeUnusedOAuthClients(db, 7, now)).toBe(1);
    const left = (await db.select({ id: oauthClient.clientId }).from(oauthClient)).map((r) => r.id).sort();
    expect(left).toEqual(['old-consented', 'recent-unused']);
  });
});
