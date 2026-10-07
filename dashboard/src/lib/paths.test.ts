import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getPaths } from './paths';

describe('paths', () => {
  afterEach(() => {
    delete process.env.LESSONFOLK_ROOT;
    delete process.env.LESSONFOLK_COURSES_DIR;
    delete process.env.LESSONFOLK_PROGRESS_DIR;
  });

  it('resolves courses and progress from the root, with env overrides', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    process.env.LESSONFOLK_PROGRESS_DIR = '/fixtures/mid-course';
    const paths = getPaths();
    expect(paths.root).toBe(resolve('/repo'));
    expect(paths.courses).toBe(resolve('/repo', 'courses'));
    expect(paths.progressFile).toBe(resolve('/fixtures/mid-course', 'progress.json'));
  });

  it('honours LESSONFOLK_COURSES_DIR', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    process.env.LESSONFOLK_COURSES_DIR = '/fixtures/courses';
    expect(getPaths().courses).toBe(resolve('/fixtures/courses'));
    expect(getPaths().progress).toBe(resolve('/repo', '.progress'));
  });
});
