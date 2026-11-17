import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findRepoRoot, getCoursesDir, getProjectsDir } from './paths.ts';

describe('paths', () => {
  afterEach(() => {
    delete process.env.LESSONFOLK_ROOT;
    delete process.env.LESSONFOLK_COURSES_DIR;
    delete process.env.LESSONFOLK_PROJECTS_DIR;
  });

  it('finds the repo root by walking up to AGENTS.md', () => {
    const root = mkdtempSync(join(tmpdir(), 'lessonfolk-'));
    writeFileSync(join(root, 'AGENTS.md'), '');
    const nested = join(root, 'packages', 'core', 'src');
    mkdirSync(nested, { recursive: true });
    expect(findRepoRoot(nested)).toBe(root);
  });

  it('resolves the courses directory from the root, with an env override', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    expect(getCoursesDir()).toBe(resolve('/repo', 'courses'));
    expect(getCoursesDir('/elsewhere')).toBe(resolve('/elsewhere', 'courses'));
    process.env.LESSONFOLK_COURSES_DIR = '/fixtures/courses';
    expect(getCoursesDir()).toBe(resolve('/fixtures/courses'));
  });

  it('resolves the projects directory next to the courses, with its own env override', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    process.env.LESSONFOLK_COURSES_DIR = '/fixtures/courses';
    expect(getProjectsDir()).toBe(resolve('/repo', 'projects'));
    expect(getProjectsDir('/elsewhere')).toBe(resolve('/elsewhere', 'projects'));
    process.env.LESSONFOLK_PROJECTS_DIR = '/fixtures/projects';
    expect(getProjectsDir()).toBe(resolve('/fixtures/projects'));
  });
});
