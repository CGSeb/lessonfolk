import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getPaths } from './paths';

describe('paths', () => {
  afterEach(() => {
    delete process.env.LESSONFOLK_ROOT;
    delete process.env.LESSONFOLK_COURSES_DIR;
  });

  it('resolves the courses from the root', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    const paths = getPaths();
    expect(paths.root).toBe(resolve('/repo'));
    expect(paths.courses).toBe(resolve('/repo', 'courses'));
  });

  it('honours LESSONFOLK_COURSES_DIR', () => {
    process.env.LESSONFOLK_ROOT = '/repo';
    process.env.LESSONFOLK_COURSES_DIR = '/fixtures/courses';
    expect(getPaths().courses).toBe(resolve('/fixtures/courses'));
  });
});
