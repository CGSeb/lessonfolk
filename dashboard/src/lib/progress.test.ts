import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  emptyProgress,
  getLevel,
  getNextLesson,
  getPathCourseIds,
  getProgressWarnings,
  getStats,
  loadCatalog,
  loadThemes,
  progressOrEmpty,
} from '@lessonfolk/core';
import { afterEach, describe, expect, it } from 'vitest';
import { readProgress } from './progress';

const fixtures = fileURLToPath(new URL('../../tests/fixtures/progress', import.meta.url));
const fixture = (name: string) => join(fixtures, name, 'progress.json');
const exampleFile = fileURLToPath(new URL('../../../.progress/progress.example.json', import.meta.url));

describe('readProgress', () => {
  afterEach(() => {
    delete process.env.LESSONFOLK_PROGRESS_DIR;
  });

  it('returns missing when there is no file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    const result = readProgress(join(dir, 'progress.json'));
    expect(result).toEqual({ state: 'missing' });
    expect(progressOrEmpty(result)).toEqual(emptyProgress());
  });

  it('returns invalid (does not throw) for malformed JSON', () => {
    const result = readProgress(fixture('invalid-json'));
    expect(result.state).toBe('invalid');
    if (result.state === 'invalid') expect(result.error).toMatch(/Invalid JSON/);
    expect(progressOrEmpty(result)).toEqual(emptyProgress());
  });

  it('returns invalid for JSON that does not match the schema', () => {
    const result = readProgress(fixture('invalid-shape'));
    expect(result.state).toBe('invalid');
    if (result.state === 'invalid') expect(result.error).toMatch(/Unexpected shape/);
  });

  it('parses the example progress file', () => {
    const result = readProgress(fixture('mid-course'));
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.progress.profile.name).toBe('Alex');
    expect(result.progress.current).toBe('ai-foundations/02-how-machines-learn');
    expect(result.progress.lessons['ai-foundations/01-what-is-ai']).toMatchObject({ status: 'done', score: 0.8 });
  });

  it('parses the level, interests and personal path of the shipped example', () => {
    const result = readProgress(exampleFile);
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.progress.profile.level).toBe('beginner');
    expect(result.progress.profile.interests).toEqual(expect.any(Array));
    expect(result.progress.path).toEqual(expect.any(Array));
    expect(result.progress.pathReason).toEqual(expect.any(String));
    expect(result.progress.pathUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('reads a file without level, interests or path as before', () => {
    const result = readProgress(fixture('mid-course'));
    expect(result.state === 'ok' && result.progress.path).toBeUndefined();
    expect(result.state === 'ok' && result.progress.profile.level).toBeUndefined();
    expect(result.state === 'ok' && result.progress.profile.interests).toBeUndefined();
  });

  it('keeps a file with an unknown level valid and ignores the level', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    const file = join(dir, 'progress.json');
    writeFileSync(file, JSON.stringify({ version: 1, profile: { level: 'expert' }, lessons: {} }));
    const result = readProgress(file);
    expect(result.state).toBe('ok');
    expect(getLevel(result.state === 'ok' ? result.progress : null)).toBeUndefined();
  });

  it('fills defaults for a minimal file', () => {
    const result = readProgress(fixture('minimal'));
    expect(result).toEqual({ state: 'ok', progress: { version: 1, profile: {}, lessons: {} } });
  });

  it('uses the default path from getPaths and reads at call time', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-progress-'));
    process.env.LESSONFOLK_PROGRESS_DIR = dir;
    expect(readProgress().state).toBe('missing');
    writeFileSync(join(dir, 'progress.json'), JSON.stringify({ version: 1, lessons: {} }));
    expect(readProgress().state).toBe('ok');
    writeFileSync(join(dir, 'progress.json'), '﻿{"version":1,"current":"x","lessons":{}}');
    const again = readProgress();
    expect(again.state === 'ok' && again.progress.current).toBe('x');
  });
});

describe('personalization scenario fixtures (docs/testing.md)', () => {
  const coursesDir = fileURLToPath(new URL('../../../packages/core/tests/fixtures/courses-valid', import.meta.url));
  const catalog = loadCatalog('en', coursesDir);
  const themeIds = loadThemes('en', coursesDir).map((th) => th.id);
  const read = (name: string) => {
    const result = readProgress(fixture(name));
    expect(result.state).toBe('ok');
    return progressOrEmpty(result);
  };

  it.each(['beginner-onboarded', 'level-check-passed', 'mid-course'])('%s uses only known ids (no warning)', (name) => {
    expect(getProgressWarnings(read(name), catalog.map((c) => c.id), themeIds)).toEqual([]);
  });

  it('beginner right after onboarding: beginner level, a path, and lesson 1 resumed', () => {
    const progress = read('beginner-onboarded');
    expect(getLevel(progress)).toBe('beginner');
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual(['ai-foundations']);
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/01-what-is-ai' } });
  });

  it('developer after a passed level check: every lesson is a placement skip, nothing left', () => {
    const progress = read('level-check-passed');
    expect(getLevel(progress)).toBe('intermediate');
    expect(getStats(catalog, progress).overall).toMatchObject({ skipped: 3, placementSkipped: 3, completed: true });
    expect(getNextLesson(catalog, progress)).toBeNull();
  });

  it('old progress file: no level or path, lessons kept, lesson 2 resumed', () => {
    const progress = read('mid-course');
    expect(getLevel(progress)).toBeUndefined();
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual([]);
    expect(getStats(catalog, progress).overall).toMatchObject({ done: 1, inProgress: 1, skipped: 0 });
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/02-how-machines-learn' } });
  });
});

