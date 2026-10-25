import type { Progress } from '@lessonfolk/core';
import { describe, expect, it } from 'vitest';
import { compactProgress, progressReceipt } from './progress-view.ts';

const long = (text: string) => `${text} ${'x'.repeat(1500)}`;

const progress: Progress = {
  version: 1,
  profile: { name: 'Ada', level: 'beginner' },
  current: 'a/03',
  path: ['a', 'b'],
  lessons: {
    'a/01': { status: 'done', score: 0.9, completedAt: '2026-01-01', notes: long('old') },
    'a/02': { status: 'skipped', notes: 'placement' },
    'a/03': { status: 'in_progress', notes: long('stopped here') },
    'b/01': { status: 'done', score: 0.5, completedAt: '2026-02-01', notes: long('hard') },
    'b/02': { status: 'done', score: 0.7, completedAt: '2026-03-01', notes: long('ok') },
    'b/03': { status: 'done', score: 0.8, completedAt: '2026-04-01', notes: long('easy') },
    'b/04': { status: 'done', score: 0.6, completedAt: '2026-05-01' },
  },
};

type Lessons = Record<string, { notes?: string; hasNotes?: boolean; score?: number }>;
const lessonsOf = (view: Record<string, unknown>) => view.lessons as Lessons;

describe('compactProgress', () => {
  it('keeps profile, path, statuses and scores, and drops the notes of other lessons', () => {
    const view = compactProgress(progress);
    expect(view).toMatchObject({ profile: progress.profile, path: ['a', 'b'], current: 'a/03' });
    expect(Object.keys(lessonsOf(view))).toEqual(Object.keys(progress.lessons));
    expect(lessonsOf(view)['b/01']).toEqual({ status: 'done', score: 0.5, completedAt: '2026-02-01', hasNotes: true });
    expect(view.detail).toContain('courseId');
  });

  it('keeps the notes of the current lesson and short ones such as "placement"', () => {
    const view = compactProgress(progress);
    expect(lessonsOf(view)['a/03'].notes).toContain('stopped here');
    expect(lessonsOf(view)['a/02'].notes).toBe('placement');
  });

  it('previews the notes of the latest finished lessons only', () => {
    const recent = compactProgress(progress).recentNotes as { lessonId: string; notes: string }[];
    expect(recent.map((r) => r.lessonId)).toEqual(['b/03', 'b/02', 'b/01']);
    expect(recent[0].notes.length).toBeLessThan(310);
  });

  it('gives the notes of a course or of some lessons when asked', () => {
    expect(lessonsOf(compactProgress(progress, { courseId: 'a' }))['a/01'].notes).toContain('old');
    expect(lessonsOf(compactProgress(progress, { courseId: 'a' }))['b/01'].hasNotes).toBe(true);
    const some = lessonsOf(compactProgress(progress, { lessonIds: ['b/01'] }));
    expect(some['b/01'].notes).toContain('hard');
    expect(some['a/01'].hasNotes).toBe(true);
  });

  it('is smaller than the whole progress, and unchanged for a learner without notes', () => {
    expect(JSON.stringify(compactProgress(progress)).length).toBeLessThan(JSON.stringify(progress).length / 2);
    const bare: Progress = { version: 1, profile: {}, current: null, lessons: { 'a/01': { status: 'done', score: 1 } } };
    expect(compactProgress(bare)).toEqual(bare);
  });
});

describe('progressReceipt', () => {
  it('says where the learner stands, without the lessons', () => {
    const receipt = progressReceipt(progress);
    expect(receipt).toContain('Current lesson: a/03.');
    expect(receipt).toContain('5 done, 1 skipped, 1 in progress');
    expect(receipt).not.toContain('notes');
    expect(progressReceipt({ version: 1, profile: {}, current: null, lessons: {} })).toContain('Current lesson: none.');
  });
});
