import { fileURLToPath } from 'node:url';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema.ts';

/** The `db` service of docker-compose.yml, as seen from the host. */
export const DEFAULT_DATABASE_URL = 'postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk';

/** Generated SQL migrations, versioned in git (packages/db/drizzle). */
export const MIGRATIONS_DIR = fileURLToPath(new URL('../drizzle', import.meta.url));

export type Database = PostgresJsDatabase<typeof schema>;

export interface Connection {
  db: Database;
  sql: Sql;
  close(): Promise<void>;
}

/** `DATABASE_URL`, or the docker compose default. */
export function databaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;
}

/** The URL with its password hidden, safe to print in logs and error messages. */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '(invalid DATABASE_URL)';
  }
}

export function connect(url: string = databaseUrl(), options: postgres.Options<{}> = {}): Connection {
  const sql = postgres(url, { onnotice: () => {}, ...options });
  return { db: drizzle(sql, { schema }), sql, close: () => sql.end({ timeout: 5 }) };
}

/** Apply every migration of drizzle/ not applied yet. Safe to run on every start. */
export async function runMigrations(url: string = databaseUrl()): Promise<void> {
  const { db, close } = connect(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  } finally {
    await close();
  }
}

const UNREACHABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'CONNECT_TIMEOUT',
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  'CONNECTION_DESTROYED',
  '57P03', // the database system is starting up
]);

/** True when the error means Postgres could not be reached (as opposed to a query error). */
export function isUnreachableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && UNREACHABLE_CODES.has(code)) return true;
  if (error instanceof AggregateError && error.errors.some(isUnreachableError)) return true;
  // Drizzle wraps driver errors in a DrizzleQueryError whose `cause` is the real one.
  return isUnreachableError(error.cause);
}
