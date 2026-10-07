import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { inspectCatalog, type Progress, type ProgressStore } from '@lessonfolk/core';
import { createPostgresProgressStore, type Database } from '@lessonfolk/db';
import { inject } from 'vitest';

/** Pinned copy of the catalog (AI Foundations only), so new courses do not change test expectations. */
export const COURSES_DIR = fileURLToPath(new URL('../../../packages/core/tests/fixtures/courses-valid', import.meta.url));
/** Progress fixtures (progress.json files), one folder per learner state, imported into Postgres by the tests. */
export const PROGRESS_FIXTURES = fileURLToPath(new URL('../fixtures/progress', import.meta.url));
/**
 * LESSONFOLK_ROOT of the test servers: a folder with no `.progress/progress.json`, so a
 * learner's real progress file never shows up in the tests (the first-run import offer).
 */
export const ROOT_WITHOUT_PROGRESS = fileURLToPath(new URL('../fixtures', import.meta.url));
/** The launcher that runs the sign-in startup checks, then the built server (like `npm run start`). */
const SERVE_SCRIPT = fileURLToPath(new URL('../../scripts/serve.ts', import.meta.url));

/** Settings the tests control themselves: never inherited from the shell, CI or a local .env. */
const CONTROLLED_ENV = [
  'DATABASE_URL',
  'HOST',
  'PORT',
  'LESSONFOLK_AUTH',
  'LESSONFOLK_BIND',
  'LESSONFOLK_BASE_URL',
  'LESSONFOLK_TEST_OAUTH_URL',
  'LESSONFOLK_MCP_TOKEN',
  'LESSONFOLK_ROOT',
  'BETTER_AUTH_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

export type ServerEnv = Record<string, string | undefined>;

function serverProcess(env: ServerEnv): ChildProcess {
  const base: ServerEnv = { ...process.env };
  for (const name of CONTROLLED_ENV) delete base[name];
  return spawn(
    process.execPath,
    ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', SERVE_SCRIPT, inject('e2eServerEntry')],
    {
      env: {
        ...base,
        HOST: '127.0.0.1',
        PORT: '0',
        NODE_ENV: 'test',
        LESSONFOLK_COURSES_DIR: COURSES_DIR,
        LESSONFOLK_ROOT: ROOT_WITHOUT_PROGRESS,
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        ...env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

/** A TCP port free right now on 127.0.0.1 (for servers whose URL must be known before they start). */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

/** Start the server with settings it must refuse: resolves with its exit code and output. */
export function expectStartupFailure(env: ServerEnv): Promise<{ code: number | null; output: string }> {
  const child = serverProcess(env);
  let output = '';
  child.stdout?.on('data', (chunk: Buffer) => (output += chunk.toString()));
  child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`The server did not stop by itself:
${output}`));
    }, STARTUP_TIMEOUT_MS);
    child.once('exit', (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
  });
}

export interface DashboardServer {
  url: string;
  stop(): Promise<void>;
}

const STARTUP_TIMEOUT_MS = 15_000;
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * Start the built dashboard on a free port (PORT=0, read back from its startup
 * log). Without other settings it runs with LESSONFOLK_AUTH=none, which needs
 * Postgres: pass the test database as DATABASE_URL.
 */
export function startDashboard(env: ServerEnv = {}): Promise<DashboardServer> {
  const child = serverProcess(env);

  const stop = () =>
    new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) return resolve();
      child.once('exit', () => resolve());
      child.kill();
    });

  return new Promise((resolve, reject) => {
    let output = '';
    let started = false;
    const fail = (message: string) => {
      if (started) return;
      clearTimeout(timer);
      void stop().then(() => reject(new Error(`${message}\n${output}`)));
    };
    const timer = setTimeout(() => fail('Dashboard did not start in time'), STARTUP_TIMEOUT_MS);
    const onData = (chunk: Buffer) => {
      output += chunk.toString();
      // "listening on http://127.0.0.1:1234", or on 0.0.0.0 a list of addresses ("local: http://localhost:1234").
      const match = /listening on (http:\/\/\S+)|local: (http:\/\/\S+)/i.exec(output.replace(ANSI, ''));
      if (match && !started) {
        started = true;
        clearTimeout(timer);
        child.stdout?.off('data', onData);
        child.stdout?.resume(); // Keep draining so the child never blocks on a full pipe.
        const url = new URL(match[1] ?? match[2]);
        if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
        resolve({ url: url.origin, stop });
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.once('exit', (code) => fail(`Dashboard exited early (code ${code})`));
    child.once('error', (err) => fail(`Dashboard failed to start: ${err.message}`));
  });
}

export interface Page {
  status: number;
  /** Visible text: tags removed, entities decoded, whitespace collapsed. */
  text: string;
  html: string;
}

export async function getPage(server: DashboardServer, path: string): Promise<Page> {
  const response = await fetch(server.url + path, { headers: { Accept: 'text/html' } });
  const html = await response.text();
  return { status: response.status, html, text: visibleText(html) };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function visibleText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code: string) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return String.fromCodePoint(n);
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** The progress store on a test database, with the pinned courses (writes as the tutor would). */
export function testProgressStore(db: Database): ProgressStore {
  return createPostgresProgressStore(db, { courses: () => inspectCatalog('en', COURSES_DIR).catalog.courses });
}

/** The text of a progress fixture's progress.json. */
export function readProgressFixture(name: string): string {
  return readFileSync(`${PROGRESS_FIXTURES}/${name}/progress.json`, 'utf8');
}

/**
 * Give `userId` the progress of a fixture, as the tutor would have saved it (import
 * replaces everything), or no progress at all with `null`. The user row must exist.
 */
export async function seedProgress(db: Database, userId: string, fixture: string | null): Promise<Progress> {
  const store = testProgressStore(db);
  if (fixture === null) {
    await store.deleteLearner(userId);
    return store.getProgress(userId);
  }
  return store.importProgress(userId, readProgressFixture(fixture), { client: 'test' });
}
