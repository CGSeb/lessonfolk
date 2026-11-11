import { describe, expect, it } from 'vitest';
import { emptyProgress, progressSchema, type Progress } from './progress.ts';
import {
  completeProject,
  getProjectStatus,
  missingCriteria,
  recordMilestone,
  recordProjectReview,
  resetProject,
  saveProjectNotes,
  startProject,
} from './project-progress.ts';
import { ProgressStoreError, formatProgress } from './store.ts';

const projects = [{ id: 'demo', milestones: 3, reviewCriteria: 2 }];
const today = '2026-11-11';

function code(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof ProgressStoreError) return error.code;
    throw error;
  }
  return undefined;
}

const started = () => startProject(emptyProgress(), projects, 'demo', { today });
const allMilestones = () => [1, 2, 3].reduce<Progress>((p, n) => recordMilestone(p, projects, 'demo', n), started());
const reviewed = () =>
  recordProjectReview(recordProjectReview(allMilestones(), projects, 'demo', 1, 'met'), projects, 'demo', 2, 'partly');

describe('project progress rules', () => {
  it('starts a project, and resumes it without change', () => {
    const progress = started();
    expect(progress.projects).toEqual({ demo: { status: 'in_progress', startedAt: today, milestones: [] } });
    expect(startProject(progress, projects, 'demo', { today: '2027-01-01' })).toBe(progress);
    expect(getProjectStatus(progress, 'demo')).toBe('in_progress');
    expect(getProjectStatus(progress, 'other')).toBe('not_started');
    expect(code(() => startProject(null, projects, 'ghost'))).toBe('unknown_project');
  });

  it('records milestones in order, once', () => {
    const one = recordMilestone(started(), projects, 'demo', 1);
    expect(one.projects?.demo.milestones).toEqual([1]);
    expect(recordMilestone(one, projects, 'demo', 1)).toBe(one);
    expect(code(() => recordMilestone(one, projects, 'demo', 3))).toBe('milestones_out_of_order');
    expect(code(() => recordMilestone(one, projects, 'demo', 4))).toBe('invalid_milestone');
    expect(code(() => recordMilestone(one, projects, 'demo', 1.5))).toBe('invalid_milestone');
    expect(code(() => recordMilestone(emptyProgress(), projects, 'demo', 1))).toBe('project_not_started');
  });

  it('reviews only once every milestone is reached', () => {
    const partial = recordMilestone(started(), projects, 'demo', 1);
    expect(code(() => recordProjectReview(partial, projects, 'demo', 1, 'met'))).toBe('milestones_incomplete');
    const progress = reviewed();
    expect(progress.projects?.demo.review).toEqual({ 1: 'met', 2: 'partly' });
    expect(recordProjectReview(progress, projects, 'demo', 2, 'met').projects?.demo.review).toEqual({ 1: 'met', 2: 'met' });
    expect(code(() => recordProjectReview(progress, projects, 'demo', 3, 'met'))).toBe('invalid_review');
    expect(code(() => recordProjectReview(progress, projects, 'demo', 1, 'great' as never))).toBe('invalid_review');
  });

  it('completes a reviewed project with notes', () => {
    const half = recordProjectReview(allMilestones(), projects, 'demo', 1, 'met');
    expect(missingCriteria(half.projects?.demo, 2)).toEqual([2]);
    expect(code(() => completeProject(half, projects, 'demo', 'Good.'))).toBe('review_incomplete');
    expect(code(() => completeProject(started(), projects, 'demo', 'Good.'))).toBe('milestones_incomplete');
    expect(code(() => completeProject(reviewed(), projects, 'demo', '  '))).toBe('invalid_notes');
    const done = completeProject(reviewed(), projects, 'demo', ' Clear prompt; test more cases. ', { today });
    expect(done.projects?.demo).toMatchObject({ status: 'done', completedAt: today, notes: 'Clear prompt; test more cases.' });
    expect(code(() => recordMilestone(done, projects, 'demo', 1))).toBe('project_already_done');
    expect(code(() => startProject(done, projects, 'demo'))).toBe('project_already_done');
  });

  it('saves notes on a started project', () => {
    expect(saveProjectNotes(started(), projects, 'demo', 'Stopped at milestone 2.').projects?.demo.notes).toBe('Stopped at milestone 2.');
    expect(code(() => saveProjectNotes(emptyProgress(), projects, 'demo', 'x'))).toBe('project_not_started');
    expect(code(() => saveProjectNotes(started(), projects, 'demo', ' '))).toBe('invalid_notes');
  });

  it('resets a project, even one that left the catalog', () => {
    expect(resetProject(started(), 'demo')).toEqual(emptyProgress());
    const orphan: Progress = { ...emptyProgress(), projects: { old: { status: 'done', milestones: [1] }, demo: { status: 'in_progress', milestones: [] } } };
    expect(resetProject(orphan, 'old').projects).toEqual({ demo: { status: 'in_progress', milestones: [] } });
    expect(code(() => resetProject(emptyProgress(), 'demo'))).toBe('nothing_to_reset');
  });

  it('round-trips through progress.json', () => {
    const text = formatProgress(reviewed());
    expect(Object.keys(JSON.parse(text))).toEqual(['version', 'profile', 'current', 'lessons', 'projects']);
    expect(progressSchema.parse(JSON.parse(text))).toEqual(reviewed());
    expect(progressSchema.safeParse({ projects: { demo: { status: 'started' } } }).success).toBe(false);
  });
});
