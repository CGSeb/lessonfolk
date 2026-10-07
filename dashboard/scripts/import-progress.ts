/**
 * Copy a progress.json into the database, as the progress of the local learner
 * (LESSONFOLK_AUTH=none). It replaces what the database holds for that learner;
 * the file is left untouched. The dashboard's account page (/account) does the same, with a
 * preview first, for any learner.
 *
 *   npm run progress:import                      # .progress/progress.json
 *   npm run progress:import -- path/to/progress.json
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inspectCatalog } from '@lessonfolk/core';
import { connect, createPostgresProgressStore, databaseUrl, redactUrl } from '@lessonfolk/db';
import { importProblem, localProgressFile } from '../src/lib/account.ts';
import { prepareLocalDatabase } from '../src/lib/auth/local-learner.ts';
import { AuthConfigError, LOCAL_USER } from '../src/lib/auth/settings.ts';

const arg = process.argv[2];
// npm runs workspace scripts from dashboard/: resolve a given path from where the command was typed.
const file = arg ? resolve(process.env.INIT_CWD ?? process.cwd(), arg) : localProgressFile();
const url = databaseUrl();

const fail = (message: string): never => {
  console.error(`Import failed: ${message}`);
  process.exit(1);
};

let text = '';
try {
  text = readFileSync(file, 'utf8');
} catch (error) {
  fail(`cannot read ${file} (${(error as NodeJS.ErrnoException).code ?? (error as Error).message}).`);
}

try {
  await prepareLocalDatabase(url);
} catch (error) {
  if (error instanceof AuthConfigError) fail(error.message);
  throw error;
}

const { db, close } = connect(url, { max: 1 });
try {
  const store = createPostgresProgressStore(db, { courses: () => inspectCatalog('en').catalog.courses });
  const progress = await store.importProgress(LOCAL_USER.id, text, { client: 'progress-import' });
  const lessons = Object.keys(progress.lessons).length;
  console.log(`Imported ${file} into ${redactUrl(url)}: ${lessons} lesson${lessons === 1 ? '' : 's'} for the local learner.`);
} catch (error) {
  const problem = importProblem(error);
  if (!problem) throw error;
  fail(`${file}: ${problem.message}${problem.problems.map((line) => `\n  - ${line}`).join('')}`);
} finally {
  await close();
}
