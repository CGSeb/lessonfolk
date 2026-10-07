import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    /** Absolute path of the built server entry (dist/server/entry.mjs) used by the e2e tests. */
    e2eServerEntry: string;
  }
}

const dashboardDir = fileURLToPath(new URL('../..', import.meta.url));
// Inside node_modules so the built server resolves its dependencies, and so it
// never overwrites the learner's own dashboard/dist build.
const cacheDir = join(dashboardDir, 'node_modules', '.cache', 'lessonfolk-e2e');
const outDir = join(cacheDir, 'dist');

/**
 * Build the production server once per test run. Each e2e test file then starts
 * it (as a real Node process, over HTTP) against the progress fixture it needs.
 */
export default function setup(project: TestProject) {
  rmSync(cacheDir, { recursive: true, force: true });
  const astroBin = join(dirname(createRequire(import.meta.url).resolve('astro/package.json')), 'bin', 'astro.mjs');
  const result = spawnSync(process.execPath, [astroBin, 'build', '--outDir', outDir], {
    cwd: dashboardDir,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const entry = join(outDir, 'server', 'entry.mjs');
  if (result.status !== 0 || !existsSync(entry)) {
    throw new Error(`Dashboard build for e2e tests failed:\n${result.stdout}\n${result.stderr}`);
  }
  project.provide('e2eServerEntry', entry);

  return () => rmSync(cacheDir, { recursive: true, force: true });
}
