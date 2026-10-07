/**
 * Start the built dashboard server (dist/server/entry.mjs) after the sign-in
 * startup checks, so a misconfigured server never starts:
 *
 * - LESSONFOLK_AUTH=none only on 127.0.0.1 (see exposedHost in src/lib/auth/settings.ts),
 *   with Postgres reachable: pending migrations are applied and the local learner created;
 * - LESSONFOLK_AUTH=oauth only with a provider, LESSONFOLK_BASE_URL and BETTER_AUTH_SECRET.
 *
 *   npm run start -w dashboard          # or: node scripts/serve.ts [path/to/entry.mjs]
 */
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { databaseUrl } from '@lessonfolk/db';
import { prepareLocalDatabase } from '../src/lib/auth/local-learner.ts';
import { AuthConfigError, checkStartup, readAuthSettings, type AuthSettings } from '../src/lib/auth/settings.ts';

// Listen on this computer only unless HOST says otherwise (checked below in `none` mode).
process.env.HOST ||= '127.0.0.1';

const entry = resolve(process.argv[2] ?? fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url)));

let settings: AuthSettings;
try {
  settings = readAuthSettings();
  checkStartup(settings);
  if (settings.mode === 'none') await prepareLocalDatabase(databaseUrl());
} catch (error) {
  if (!(error instanceof AuthConfigError)) throw error;
  console.error(`LessonFolk cannot start: ${error.message}`);
  process.exit(1);
}

if (settings.mode === 'none') {
  console.log('Sign-in is off (LESSONFOLK_AUTH=none): one local learner, on this computer only.');
} else {
  console.log(`Sign-in with OAuth (LESSONFOLK_AUTH=oauth) at ${settings.baseURL}`);
}

await import(pathToFileURL(entry).href);
