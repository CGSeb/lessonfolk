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

/**
 * The URL used to apply migrations and set up the runtime role: the database owner.
 * `DATABASE_MIGRATION_URL`, or `DATABASE_URL` when unset (a single account does everything,
 * as in development). In production the app itself runs as a least-privilege role.
 */
export function migrationUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.DATABASE_MIGRATION_URL?.trim() || databaseUrl(env);
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

/** Name of the least-privilege role the app runs as (see `ensureAppRole`). */
export const APP_ROLE = 'lessonfolk_app';

const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;
const quoteLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`;

/**
 * Create (or update) the runtime role and grant it what the app needs, nothing more: it can
 * connect, use the `public` schema and read and write the tables and sequences, but cannot
 * create objects, databases or roles, change the schema or run as superuser.
 * Run as the database owner (a superuser or a role with CREATEROLE), after the migrations.
 * Idempotent: safe on every start, and on a database that already has data. It also sets the
 * role's password, and default privileges so that tables added by future migrations are covered.
 */
export async function ensureAppRole(
  url: string,
  options: { password: string; role?: string },
): Promise<void> {
  const role = quoteIdent(options.role ?? APP_ROLE);
  const name = quoteLiteral(options.role ?? APP_ROLE);
  const password = quoteLiteral(options.password);
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql.begin(async (tx) => {
      // Serialize concurrent starts (two app replicas) so they do not race on the role.
      await tx`select pg_advisory_xact_lock(hashtext('lessonfolk_app_role'))`;
      await tx.unsafe(`
        do $$ begin
          if not exists (select from pg_roles where rolname = ${name}) then
            create role ${role} login nosuperuser nocreatedb nocreaterole noinherit;
          end if;
        end $$`);
      await tx.unsafe(`alter role ${role} with login nosuperuser nocreatedb nocreaterole noreplication password ${password}`);
      const [{ db }] = await tx`select quote_ident(current_database()) as db`;
      await tx.unsafe(`revoke all on database ${db} from ${role}`);
      await tx.unsafe(`grant connect on database ${db} to ${role}`);
      await tx.unsafe(`revoke all on schema public from ${role}`);
      await tx.unsafe(`grant usage on schema public to ${role}`);
      await tx.unsafe(`grant select, insert, update, delete on all tables in schema public to ${role}`);
      await tx.unsafe(`grant usage, select, update on all sequences in schema public to ${role}`);
      await tx.unsafe(`alter default privileges in schema public grant select, insert, update, delete on tables to ${role}`);
      await tx.unsafe(`alter default privileges in schema public grant usage, select, update on sequences to ${role}`);
    });
  } finally {
    await sql.end({ timeout: 5 });
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
