import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyProgress, loadCatalog, parseImportedProgress } from '@lessonfolk/core';
import { afterAll, describe, expect, it } from 'vitest';
import { findLocalProgressFile, offerLocalImport, previewImport, summarizeProgress } from './account';

const COURSES_DIR = fileURLToPath(new URL('../../../packages/core/tests/fixtures/courses-valid', import.meta.url));
const fixtureText = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../../tests/fixtures/progress/${name}/progress.json`, import.meta.url)), 'utf8');
const courses = loadCatalog('en', COURSES_DIR);

describe('previewImport', () => {
  it('accepts a valid progress.json and says what changes', () => {
    const preview = previewImport(fixtureText('mid-course'), emptyProgress(), courses);
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.before).toMatchObject({ empty: true, finished: 0, total: 3 });
    expect(preview.after).toMatchObject({
      empty: false,
      name: 'Alex',
      finished: 1,
      inProgress: 1,
      total: 3,
      current: 'How do machines learn?',
      unknownLessons: 0,
    });
  });

  it('compares with the progress saved now', () => {
    const saved = parseImportedProgress(fixtureText('all-done'));
    const preview = previewImport(fixtureText('mid-course'), saved, courses);
    expect(preview.ok && preview.before).toMatchObject({ name: 'Sam', finished: 3, empty: false });
  });

  it('rejects a file that is not JSON, with a readable reason', () => {
    const preview = previewImport('{ "version": 1, ', emptyProgress(), courses);
    expect(preview.ok).toBe(false);
    if (preview.ok) return;
    expect(preview.message).toMatch(/^Invalid JSON/);
    expect(preview.problems.length).toBeGreaterThan(0);
  });

  it('rejects JSON of the wrong shape, listing the problems', () => {
    const preview = previewImport(JSON.stringify({ version: 1, lessons: { 'ai-foundations/01-what-is-ai': { status: 'finished' } } }), emptyProgress(), courses);
    expect(preview.ok).toBe(false);
    if (preview.ok) return;
    expect(preview.message).toBe('This is not a valid progress.json (v1).');
    expect(preview.problems.join('\n')).toContain('lessons.ai-foundations/01-what-is-ai.status');
  });

  it('rejects another version', () => {
    const preview = previewImport(JSON.stringify({ version: 2 }), emptyProgress(), courses);
    expect(!preview.ok && preview.message).toBe('Unsupported progress.json version 2.');
  });
});

describe('summarizeProgress', () => {
  it('counts lessons that are not in the courses here, and keeps unknown path ids', () => {
    const progress = parseImportedProgress({
      version: 1,
      profile: { level: 'beginner' },
      lessons: { 'gone-course/01-old': { status: 'done' } },
      path: ['ai-foundations', 'gone-course'],
    });
    expect(summarizeProgress(progress, courses)).toMatchObject({
      level: 'beginner',
      unknownLessons: 1,
      finished: 0,
      path: ['AI Foundations', 'gone-course'],
    });
  });
});

describe('the local progress file (first run without sign-in)', () => {
  const root = mkdtempSync(join(tmpdir(), 'lessonfolk-root-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('is offered only in none mode, with no progress saved, when the file exists', () => {
    expect(findLocalProgressFile(root)).toBeUndefined();
    expect(offerLocalImport('none', 'missing', root)).toBe(false);

    mkdirSync(join(root, '.progress'));
    writeFileSync(join(root, '.progress', 'progress.json'), fixtureText('mid-course'));
    expect(findLocalProgressFile(root)).toBe(join(root, '.progress', 'progress.json'));
    expect(offerLocalImport('none', 'missing', root)).toBe(true);
    expect(offerLocalImport('none', 'ok', root)).toBe(false);
    expect(offerLocalImport('oauth', 'missing', root)).toBe(false);
  });
});
