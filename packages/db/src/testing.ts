/**
 * Test helpers: every test file gets its own fresh, migrated database, so test
 * files run in parallel without seeing each other's rows.
 *
 *   let testDb: TestDatabase;
 *   beforeAll(async () => { testDb = await createTestDatabase(); });
 *   afterAll(() => testDb?.drop());
 *
 * The server comes from DATABASE_URL (default: the `db` service of
 * docker-compose.yml on 127.0.0.1:5432). Start it with `docker compose up -d db`.
 */
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { connect, databaseUrl, isUnreachableError, redactUrl, runMigrations, type Connection } from './connection.ts';

export interface TestDatabase extends Connection {
  /** Name of the database created for this test file. */
  name: string;
  /** Connection URL of that database. */
  url: string;
  /** Close the connection and drop the database. */
  drop(): Promise<void>;
}

export class PostgresUnreachableError extends Error {
  constructor(url: string, cause: unknown) {
    const reason = cause instanceof Error ? (cause as { code?: string }).code ?? cause.message : String(cause);
    super(
      [
        `Cannot reach Postgres at ${redactUrl(url)} (${reason}).`,
        'Database tests need a running Postgres. From the repository root, run:',
        '',
        '    docker compose up -d db',
        '',
        'or set DATABASE_URL to a Postgres server where this user may create databases.',
        'See docs/testing.md.',
      ].join('\n'),
      { cause },
    );
    this.name = 'PostgresUnreachableError';
  }
}

function withDatabase(url: string, name: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${name}`;
  return parsed.toString();
}

/**
 * Create an empty database next to the one in `url`, apply every migration and
 * connect to it. Throws PostgresUnreachableError when the server cannot be reached.
 */
export async function createTestDatabase(url: string = databaseUrl()): Promise<TestDatabase> {
  const name = `lessonfolk_test_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
  const admin = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
  try {
    await admin.unsafe(`create database "${name}"`);
  } catch (error) {
    throw isUnreachableError(error) ? new PostgresUnreachableError(url, error) : error;
  } finally {
    await admin.end({ timeout: 5 });
  }

  const testUrl = withDatabase(url, name);
  await runMigrations(testUrl);
  const connection = connect(testUrl);

  return {
    ...connection,
    name,
    url: testUrl,
    async drop() {
      await connection.close();
      const cleanup = postgres(url, { max: 1, connect_timeout: 5, onnotice: () => {} });
      try {
        await cleanup.unsafe(`drop database if exists "${name}" with (force)`);
      } finally {
        await cleanup.end({ timeout: 5 });
      }
    },
  };
}
