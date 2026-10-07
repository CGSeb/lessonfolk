/**
 * Start the built dashboard server (dist/server/entry.mjs) after the sign-in
 * startup checks, so a misconfigured server never starts:
 *
 * - LESSONFOLK_AUTH=none only on 127.0.0.1 (see exposedHost in src/lib/auth/settings.ts),
 *   and the local learner is created in Postgres when DATABASE_URL is set;
 * - LESSONFOLK_AUTH=oauth only with a provider, LESSONFOLK_BASE_URL and BETTER_AUTH_SECRET.
 *
 *   npm run start -w dashboard          # or: node scripts/serve.ts [path/to/entry.mjs]
 */
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { connect, redactUrl } from '@lessonfolk/db';
import { ensureLocalLearner } from '../src/lib/auth/local-learner.ts';
import { AuthConfigError, checkStartup, readAuthSettings, type AuthSettings } from '../src/lib/auth/settings.ts';

const entry = resolve(process.argv[2] ?? fileURLToPath(new URL('../dist/server/entry.mjs', import.meta.url)));

let settings: AuthSettings;
try {
  settings = readAuthSettings();
  checkStartup(settings);
} catch (error) {
  if (!(error instanceof AuthConfigError)) throw error;
  console.error(`LessonFolk cannot start: ${error.message}`);
  process.exit(1);
}

if (settings.mode === 'none') {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { db, close } = connect(url, { max: 1 });
    try {
      await ensureLocalLearner(db);
    } catch (error) {
      console.error(`LessonFolk cannot start: could not create the local learner in ${redactUrl(url)}:`, error);
      process.exit(1);
    } finally {
      await close();
    }
  } else {
    // Until progress moves to Postgres, the dashboard still reads .progress/progress.json.
    console.log('No DATABASE_URL: running without a database (progress is read from .progress/).');
  }
  console.log('Sign-in is off (LESSONFOLK_AUTH=none): one local learner, on this computer only.');
} else {
  console.log(`Sign-in with OAuth (LESSONFOLK_AUTH=oauth) at ${settings.baseURL}`);
}

await import(pathToFileURL(entry).href);
