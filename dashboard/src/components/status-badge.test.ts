import { describe, expect, it } from 'vitest';
import { t } from '../i18n/en';
import { emptyProgress, type Progress } from '../lib/progress';
import { lessonDisplayStatus, statusDisplay } from './status-badge';

describe('statusDisplay', () => {
  it('maps lesson statuses to UI strings and badge variants', () => {
    expect(statusDisplay('not_started')).toEqual({ key: 'status.notStarted', variant: undefined });
    expect(statusDisplay('in_progress')).toEqual({ key: 'status.inProgress', variant: 'info' });
    expect(statusDisplay('done')).toEqual({ key: 'status.done', variant: 'success' });
    expect(statusDisplay('skipped')).toEqual({ key: 'status.skipped', variant: undefined });
    expect(statusDisplay('skipped_placement')).toEqual({ key: 'status.skippedPlacement', variant: 'placement' });
  });

  it('maps the course "completed" status like course cards do', () => {
    expect(statusDisplay('completed')).toEqual({ key: 'status.completed', variant: 'success' });
  });

  it('only uses keys that exist', () => {
    for (const s of ['not_started', 'in_progress', 'done', 'skipped', 'skipped_placement', 'completed'] as const) {
      expect(t(statusDisplay(s).key)).toBeTruthy();
    }
  });
});

describe('lessonDisplayStatus', () => {
  const progress: Progress = {
    ...emptyProgress(),
    lessons: {
      'a/01': { status: 'skipped', notes: 'placement' },
      'a/02': { status: 'skipped', notes: 'Already knew it' },
      'a/03': { status: 'done' },
    },
  };

  it('tells placement skips apart from manual skips', () => {
    expect(lessonDisplayStatus(progress, 'a/01')).toBe('skipped_placement');
    expect(lessonDisplayStatus(progress, 'a/02')).toBe('skipped');
    expect(lessonDisplayStatus(progress, 'a/03')).toBe('done');
    expect(lessonDisplayStatus(progress, 'a/04')).toBe('not_started');
  });
});
