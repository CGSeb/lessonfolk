import { describe, expect, it } from 'vitest';
import { type Progress, emptyProgress } from './progress.ts';
import {
  ProgressStoreError,
  formatProgress,
  MAX_IMPORT_BYTES,
  parseImportedProgress,
  recordReviewScore,
  saveNotes,
  unwrapTutorResult,
  updateProfile,
} from './store.ts';
import { startLesson } from './tutor.ts';

const courses = [
  {
    id: 'basics',
    lessons: [
      { id: 'basics/01-a', prerequisites: [] },
      { id: 'basics/02-b', prerequisites: ['basics/01-a'] },
    ],
  },
];

const progress = (lessons: Progress['lessons']): Progress => ({ ...emptyProgress(), lessons });

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof ProgressStoreError) return error.code;
    throw error;
  }
  return undefined;
}

describe('updateProfile', () => {
  it('sets given fields, removes null ones and keeps the rest', () => {
    const base = { ...emptyProgress(), profile: { name: 'Alex', goal: 'work', interests: ['a'] } };
    expect(updateProfile(base, { goal: 'fun', interests: null, level: 'beginner' }).profile).toEqual({
      name: 'Alex',
      goal: 'fun',
      level: 'beginner',
    });
  });

  it('rejects unknown levels and empty values', () => {
    expect(codeOf(() => updateProfile(null, { level: 'expert' }))).toBe('invalid_profile');
    expect(codeOf(() => updateProfile(null, { name: ' ' }))).toBe('invalid_profile');
  });
});

describe('saveNotes', () => {
  it('saves notes on a started lesson', () => {
    const next = saveNotes(progress({ 'basics/01-a': { status: 'in_progress' } }), courses, 'basics/01-a', ' Stopped here. ');
    expect(next.lessons['basics/01-a']).toEqual({ status: 'in_progress', notes: 'Stopped here.' });
  });

  it('rejects unknown and unstarted lessons, empty notes and the placement note', () => {
    const p = progress({ 'basics/01-a': { status: 'skipped', notes: 'placement' } });
    expect(codeOf(() => saveNotes(p, courses, 'basics/09-x', 'x'))).toBe('unknown_lesson');
    expect(codeOf(() => saveNotes(p, courses, 'basics/02-b', 'x'))).toBe('not_started');
    expect(codeOf(() => saveNotes(p, courses, 'basics/01-a', 'x'))).toBe('invalid_notes');
    expect(codeOf(() => saveNotes(progress({ 'basics/01-a': { status: 'done' } }), courses, 'basics/01-a', 'Placement'))).toBe(
      'invalid_notes',
    );
  });
});

describe('recordReviewScore', () => {
  const done = progress({ 'basics/01-a': { status: 'done', score: 0.5 } });

  it('keeps the higher score', () => {
    expect(recordReviewScore(done, courses, 'basics/01-a', 0.7).lessons['basics/01-a'].score).toBe(0.7);
    expect(recordReviewScore(done, courses, 'basics/01-a', 0.2)).toBe(done);
  });

  it('needs a done lesson and a score between 0 and 1', () => {
    expect(codeOf(() => recordReviewScore(done, courses, 'basics/02-b', 0.5))).toBe('not_done');
    expect(codeOf(() => recordReviewScore(done, courses, 'basics/01-a', 2))).toBe('invalid_score');
  });
});

describe('parseImportedProgress', () => {
  it('accepts text or parsed JSON and fills defaults', () => {
    expect(parseImportedProgress('\uFEFF{}')).toEqual({ version: 1, profile: {}, lessons: {} });
    expect(parseImportedProgress({ profile: { name: 'A' } }).profile).toEqual({ name: 'A' });
  });

  it('rejects invalid JSON, shapes and versions', () => {
    expect(codeOf(() => parseImportedProgress('{'))).toBe('invalid_progress');
    expect(codeOf(() => parseImportedProgress({ lessons: { x: { status: 'nope' } } }))).toBe('invalid_progress');
    expect(codeOf(() => parseImportedProgress({ version: 2 }))).toBe('invalid_progress');
  });

  it('rejects wrong types, non-objects and cyclic values without crashing', () => {
    for (const input of ['null', '[]', '"text"', '42', '{"lessons":[]}', '{"profile":{"interests":"ai"}}', '{"path":[1]}']) {
      expect(codeOf(() => parseImportedProgress(input)), input).toBe('invalid_progress');
    }
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(codeOf(() => parseImportedProgress(cyclic))).toBe('invalid_progress');
  });

  it('rejects an oversized file, as text or as an object, before parsing it', () => {
    const big = JSON.stringify({ version: 1, profile: { goal: 'x'.repeat(MAX_IMPORT_BYTES) } });
    expect(codeOf(() => parseImportedProgress(big))).toBe('invalid_progress');
    expect(codeOf(() => parseImportedProgress({ profile: { goal: 'x'.repeat(MAX_IMPORT_BYTES) } }))).toBe('invalid_progress');
    expect(parseImportedProgress({ profile: { goal: 'x'.repeat(1000) } }).profile.goal).toHaveLength(1000);
  });
});

describe('unwrapTutorResult', () => {
  it('throws the tutor error as a ProgressStoreError', () => {
    const error = (() => {
      try {
        return unwrapTutorResult(startLesson(null, courses, 'basics/02-b'), 'u1');
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(ProgressStoreError);
    expect(error).toMatchObject({ code: 'prerequisites_not_met', details: { lessonId: 'basics/02-b', missing: ['basics/01-a'], userId: 'u1' } });
  });
});

describe('formatProgress', () => {
  it('writes progress.json keys in the order of the example, with a final newline', () => {
    const text = formatProgress({
      lessons: {},
      current: undefined,
      profile: { level: 'beginner', name: 'A', extra: 1 },
      version: 1,
      pathReason: 'Why',
      path: ['x'],
    });
    expect(text).toBe(
      `${JSON.stringify({ version: 1, profile: { name: 'A', level: 'beginner', extra: 1 }, path: ['x'], pathReason: 'Why', current: null, lessons: {} }, null, 2)}\n`,
    );
  });
});
