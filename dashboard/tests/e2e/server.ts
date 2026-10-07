import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inject } from 'vitest';

/** Pinned copy of the catalog (AI Foundations only), so new courses do not change test expectations. */
export const COURSES_DIR = fileURLToPath(new URL('../fixtures/courses-valid', import.meta.url));
/** Progress fixtures, one folder per learner state. */
export const PROGRESS_FIXTURES = fileURLToPath(new URL('../fixtures/progress', import.meta.url));

export interface DashboardServer {
  url: string;
  stop(): Promise<void>;
}

const STARTUP_TIMEOUT_MS = 15_000;
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * Start the built dashboard on a free port (PORT=0, read back from its startup
 * log) with the given progress folder. `progressDir` must be absolute.
 */
export function startDashboard(progressDir: string): Promise<DashboardServer> {
  const child: ChildProcess = spawn(process.execPath, [inject('e2eServerEntry')], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      PORT: '0',
      LESSONFOLK_COURSES_DIR: COURSES_DIR,
      LESSONFOLK_PROGRESS_DIR: progressDir,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

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
      const match = /listening on (http:\/\/\S+)/i.exec(output.replace(ANSI, ''));
      if (match && !started) {
        started = true;
        clearTimeout(timer);
        child.stdout?.off('data', onData);
        child.stdout?.resume(); // Keep draining so the child never blocks on a full pipe.
        resolve({ url: match[1].replace(/\/$/, ''), stop });
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
