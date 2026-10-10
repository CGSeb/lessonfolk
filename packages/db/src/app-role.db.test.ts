/**
 * Database test: the least-privilege role the app runs as (ensureAppRole) can run the progress
 * store, and nothing more. The test helper itself uses the owner role (it needs CREATEDB).
 */
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '@lessonfolk/core';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connect, databaseUrl, ensureAppRole } from './connection.ts';
import { createPostgresProgressStore } from './progress-store.ts';
import { user } from './schema.ts';
import { createTestDatabase, type TestDatabase } from './testing.ts';

const fixtureCourses = fileURLToPath(new URL('../../core/tests/fixtures/courses-valid', import.meta.url));
const courses = loadCatalog('en', fixtureCourses);
const role = `lessonfolk_app_test_${randomBytes(4).toString('hex')}`;
const password = randomBytes(8).toString('hex');
const at = { today: '2026-10-07', client: 'test' };

let testDb: TestDatabase;
let app: ReturnType<typeof connect>;

beforeAll(async () => {
  testDb = await createTestDatabase();
  await ensureAppRole(testDb.url, { role, password });
  await ensureAppRole(testDb.url, { role, password }); // idempotent
  const parsed = new URL(testDb.url);
  parsed.username = role;
  parsed.password = password;
  app = connect(parsed.toString(), { max: 1 });
});

afterAll(async () => {
  await app?.close();
  await testDb?.drop();
  const admin = postgres(databaseUrl(), { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`drop role if exists "${role}"`);
  } finally {
    await admin.end({ timeout: 5 });
  }
});

describe('least-privilege app role', () => {
  it('runs the progress store (reads, writes, the event identity sequence)', async () => {
    await app.db.insert(user).values({ id: 'u1', name: 'U', email: 'u1@example.com' });
    const store = createPostgresProgressStore(app.db, { courses });
    const lesson = 'ai-foundations/01-what-is-ai';
    await store.startLesson('u1', lesson, at);
    const progress = await store.getProgress('u1');
    expect(progress.lessons[lesson]?.status).toBe('in_progress');
  });

  it('covers tables created by later migrations (default privileges)', async () => {
    await testDb.sql`create table later_table (id int primary key)`;
    await expect(app.sql`select * from later_table`).resolves.toHaveLength(0);
  });

  it('cannot change the schema or create databases and roles', async () => {
    await expect(app.sql`create table nope (id int)`).rejects.toThrow(/permission denied/);
    await expect(app.sql`drop table "user" cascade`).rejects.toThrow(/must be owner/);
    await expect(app.sql`alter table "user" add column x int`).rejects.toThrow(/must be owner/);
    await expect(app.sql`create database nope_db`).rejects.toThrow(/permission denied/);
    await expect(app.sql`create role nope_role`).rejects.toThrow(/permission denied/);
  });

  it('is not a superuser', async () => {
    const [row] = await app.sql`select rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname = ${role}`;
    expect(row).toEqual({ rolsuper: false, rolcreatedb: false, rolcreaterole: false });
  });
});
