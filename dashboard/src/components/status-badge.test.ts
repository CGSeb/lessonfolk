import { describe, expect, it } from 'vitest';
import { t } from '../i18n/en';
import { statusDisplay } from './status-badge';

describe('statusDisplay', () => {
  it('maps lesson statuses to UI strings and badge variants', () => {
    expect(statusDisplay('not_started')).toEqual({ key: 'status.notStarted', variant: undefined });
    expect(statusDisplay('in_progress')).toEqual({ key: 'status.inProgress', variant: 'info' });
    expect(statusDisplay('done')).toEqual({ key: 'status.done', variant: 'success' });
    expect(statusDisplay('skipped')).toEqual({ key: 'status.skipped', variant: undefined });
  });

  it('maps the course "completed" status like course cards do', () => {
    expect(statusDisplay('completed')).toEqual({ key: 'status.completed', variant: 'success' });
  });

  it('only uses keys that exist', () => {
    for (const s of ['not_started', 'in_progress', 'done', 'skipped', 'completed'] as const) {
      expect(t(statusDisplay(s).key)).toBeTruthy();
    }
  });
});
