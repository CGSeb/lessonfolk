import { readFileSync } from 'node:fs';
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
  parseImportedProgress,
  type Progress,
  type ProgressStore,
} from '@lessonfolk/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBlankProgress, loadProgress, loadProgressFor } from './store';

const fixtureFile = (name: string) => fileURLToPath(new URL(`../../tests/fixtures/progress/${name}/progress.json`, import.meta.url));
/** A progress fixture, as the tests import it into Postgres. */
const fixture = (name: string): Progress => parseImportedProgress(readFileSync(fixtureFile(name), 'utf8'));

/** A store that only answers getProgress (the only method the dashboard calls). */
const storeReturning = (getProgress: ProgressStore['getProgress']) => ({ getProgress }) as unknown as ProgressStore;

describe('loadProgress', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the progress of the given user', async () => {
    const getProgress = vi.fn(async () => fixture('mid-course'));
    const result = await loadProgress('user-1', storeReturning(getProgress));
    expect(getProgress).toHaveBeenCalledWith('user-1');
    expect(result.state).toBe('ok');
    if (result.state === 'ok') expect(result.progress.profile.name).toBe('Alex');
  });

  it('treats a learner with nothing saved as not started (missing)', async () => {
    expect(await loadProgress('user-1', storeReturning(async () => emptyProgress()))).toEqual({ state: 'missing' });
  });

  it('returns invalid with the error code only, and never throws, when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = Object.assign(new Error('connect ECONNREFUSED 10.0.0.5:5432 (secret details)'), { code: 'ECONNREFUSED' });
    const result = await loadProgress('user-1', storeReturning(async () => Promise.reject(failure)));
    expect(result).toEqual({ state: 'invalid', error: 'Could not read your progress from the database (ECONNREFUSED).' });
    expect(console.error).toHaveBeenCalled();
  });

  it('reads nothing when signed out', async () => {
    expect(await loadProgressFor(null)).toBeNull();
  });
});

describe('isBlankProgress', () => {
  it('is true only when nothing was saved', () => {
    expect(isBlankProgress(emptyProgress())).toBe(true);
    expect(isBlankProgress({ ...emptyProgress(), path: [] })).toBe(true);
    expect(isBlankProgress({ ...emptyProgress(), profile: { language: 'en' } })).toBe(false);
    expect(isBlankProgress({ ...emptyProgress(), path: ['ai-foundations'] })).toBe(false);
    expect(isBlankProgress({ ...emptyProgress(), current: 'ai-foundations/01-what-is-ai' })).toBe(false);
    expect(isBlankProgress(fixture('minimal'))).toBe(false);
  });
});

describe('progress fixtures (docs/testing.md)', () => {
  it.each(['all-done', 'beginner-onboarded', 'level-check-passed', 'mid-course', 'minimal', 'placement-path'])(
    '%s is a valid progress.json the store can import',
    (name) => {
      expect(() => fixture(name)).not.toThrow();
    },
  );
});

describe('personalization scenario fixtures (docs/testing.md)', () => {
  const coursesDir = fileURLToPath(new URL('../../../packages/core/tests/fixtures/courses-valid', import.meta.url));
  const catalog = loadCatalog('en', coursesDir);
  const themeIds = loadThemes('en', coursesDir).map((th) => th.id);

  it.each(['beginner-onboarded', 'level-check-passed', 'mid-course'])('%s uses only known ids (no warning)', (name) => {
    expect(getProgressWarnings(fixture(name), catalog.map((c) => c.id), themeIds)).toEqual([]);
  });

  it('beginner right after onboarding: beginner level, a path, and lesson 1 resumed', () => {
    const progress = fixture('beginner-onboarded');
    expect(getLevel(progress)).toBe('beginner');
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual(['ai-foundations']);
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/01-what-is-ai' } });
  });

  it('developer after a passed level check: every lesson is a placement skip, nothing left', () => {
    const progress = fixture('level-check-passed');
    expect(getLevel(progress)).toBe('intermediate');
    expect(getStats(catalog, progress).overall).toMatchObject({ skipped: 3, placementSkipped: 3, completed: true });
    expect(getNextLesson(catalog, progress)).toBeNull();
  });

  it('old progress file: no level or path, lessons kept, lesson 2 resumed', () => {
    const progress = fixture('mid-course');
    expect(getLevel(progress)).toBeUndefined();
    expect(getPathCourseIds(catalog.map((c) => c.id), progress)).toEqual([]);
    expect(getStats(catalog, progress).overall).toMatchObject({ done: 1, inProgress: 1, skipped: 0 });
    expect(getNextLesson(catalog, progress)).toMatchObject({ kind: 'resume', lesson: { id: 'ai-foundations/02-how-machines-learn' } });
  });
});
