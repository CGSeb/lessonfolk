import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findRepoRoot, getPaths } from './paths';

describe('paths', () => {
  afterEach(() => {
    delete process.env.APPRENTICE_ROOT;
    delete process.env.APPRENTICE_COURSES_DIR;
    delete process.env.APPRENTICE_PROGRESS_DIR;
  });

  it('finds the repo root by walking up to AGENTS.md', () => {
    const root = mkdtempSync(join(tmpdir(), 'apprentice-'));
    writeFileSync(join(root, 'AGENTS.md'), '');
    const nested = join(root, 'dashboard', 'src');
    mkdirSync(nested, { recursive: true });
    expect(findRepoRoot(nested)).toBe(root);
  });

  it('resolves courses and progress from the root, with env overrides', () => {
    process.env.APPRENTICE_ROOT = '/repo';
    process.env.APPRENTICE_PROGRESS_DIR = '/fixtures/mid-course';
    const paths = getPaths();
    expect(paths.courses).toBe(resolve('/repo', 'courses'));
    expect(paths.progressFile).toBe(resolve('/fixtures/mid-course', 'progress.json'));
  });
});
