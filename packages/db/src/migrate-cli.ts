/**
 * Apply pending migrations to DATABASE_URL, retrying while Postgres starts up.
 * The Docker image runs this before starting the dashboard server.
 *
 *   npm run migrate -w @lessonfolk/db
 */
import { setTimeout as sleep } from 'node:timers/promises';
import { ensureAppRole, isUnreachableError, migrationUrl, redactUrl, runMigrations } from './connection.ts';

const ATTEMPTS = Number(process.env.LESSONFOLK_MIGRATE_ATTEMPTS ?? 30);
const DELAY_MS = 1_000;

// Runs as the database owner (DATABASE_MIGRATION_URL, or DATABASE_URL). When
// LESSONFOLK_APP_DB_PASSWORD is set, it also creates the least-privilege `lessonfolk_app` role
// the app connects as (DATABASE_URL), see docs/self-hosting.md.
const url = migrationUrl();
const appPassword = process.env.LESSONFOLK_APP_DB_PASSWORD?.trim();
for (let attempt = 1; ; attempt++) {
  try {
    await runMigrations(url);
    console.log(`Database migrations applied to ${redactUrl(url)}`);
    if (appPassword) {
      await ensureAppRole(url, { password: appPassword });
      console.log('Database role lessonfolk_app is ready (no schema changes, no superuser).');
    }
    break;
  } catch (error) {
    if (isUnreachableError(error) && attempt < ATTEMPTS) {
      console.log(`Waiting for Postgres at ${redactUrl(url)} (attempt ${attempt}/${ATTEMPTS})…`);
      await sleep(DELAY_MS);
      continue;
    }
    console.error(`Database migrations failed on ${redactUrl(url)}:`, error);
    process.exit(1);
  }
}
