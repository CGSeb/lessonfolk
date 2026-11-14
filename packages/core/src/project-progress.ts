/**
 * The rules for a learner's practice projects (see docs/project-format.md): start a project,
 * reach its milestones in order, review the result against its criteria, then complete it.
 * Each rule returns the new progress or throws a `ProgressStoreError` and changes nothing,
 * like the lesson rules the store applies.
 */
import {
  type Progress,
  type ProjectProgress,
  type ReviewVerdict,
  emptyProgress,
  reviewVerdictSchema,
} from './progress.ts';
import { ProgressStoreError } from './store.ts';
import { isoDate, type DateOptions } from './tutor.ts';

/** What the rules need to know about a project (`Project` from projects.ts fits). */
export interface ProjectRef {
  id: string;
  /** Number of milestones in "## Milestones". */
  milestones: number;
  /** Number of criteria in "## Review". */
  reviewCriteria: number;
}

type MaybeProgress = Progress | null | undefined;

const range = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

/** Milestone numbers (from 1 to `count`) the entry has not reached yet, in order. */
export function missingMilestones(entry: ProjectProgress | undefined, count: number): number[] {
  return range(count).filter((n) => !entry?.milestones.includes(n));
}

/** Review criterion numbers (from 1 to `count`) with no verdict yet, in order. */
export function missingCriteria(entry: ProjectProgress | undefined, count: number): number[] {
  return range(count).filter((n) => !entry?.review?.[String(n)]);
}

/** The learner's status for a project. */
export function getProjectStatus(progress: MaybeProgress, projectId: string): ProjectProgress['status'] | 'not_started' {
  return progress?.projects?.[projectId]?.status ?? 'not_started';
}

function find<P extends ProjectRef>(projects: readonly P[], projectId: string): P {
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    throw new ProgressStoreError('unknown_project', `Unknown project "${projectId}". Use list_projects to see the project ids.`, { projectId });
  }
  return project;
}

/** The entry of a project in progress, or the error for a project not started or already done. */
function inProgress(base: Progress, projectId: string): ProjectProgress {
  const entry = base.projects?.[projectId];
  if (!entry) {
    throw new ProgressStoreError('project_not_started', `Project "${projectId}" has not been started: start it first.`, { projectId });
  }
  if (entry.status === 'done') {
    throw new ProgressStoreError('project_already_done', `Project "${projectId}" is already done.`, { projectId });
  }
  return entry;
}

function withProject(base: Progress, projectId: string, entry: ProjectProgress): Progress {
  return { ...base, projects: { ...base.projects, [projectId]: entry } };
}

function requireMilestones(entry: ProjectProgress, project: ProjectRef, what: string): void {
  const missing = missingMilestones(entry, project.milestones);
  if (missing.length) {
    throw new ProgressStoreError(
      'milestones_incomplete',
      `${what} comes once every milestone of "${project.id}" is reached: milestone ${missing.join(', ')} is not reached yet.`,
      { projectId: project.id, missingMilestones: missing },
    );
  }
}

/**
 * Start a project, or resume it when it is in progress (nothing changes). A done project is
 * refused: reset it first to do it again.
 */
export function startProject<P extends ProjectRef>(
  progress: MaybeProgress,
  projects: readonly P[],
  projectId: string,
  options: DateOptions = {},
): Progress {
  const base = progress ?? emptyProgress();
  find(projects, projectId);
  const entry = base.projects?.[projectId];
  if (entry?.status === 'done') {
    throw new ProgressStoreError('project_already_done', `Project "${projectId}" is already done: reset it to do it again.`, { projectId });
  }
  if (entry) return base;
  return withProject(base, projectId, { status: 'in_progress', startedAt: options.today ?? isoDate(), milestones: [] });
}

/**
 * Record that the learner reached a milestone of a project in progress. Milestones are reached
 * in order: every one before it must be reached already. Recording it again changes nothing.
 */
export function recordMilestone<P extends ProjectRef>(
  progress: MaybeProgress,
  projects: readonly P[],
  projectId: string,
  milestone: number,
): Progress {
  const base = progress ?? emptyProgress();
  const project = find(projects, projectId);
  const entry = inProgress(base, projectId);
  if (!Number.isInteger(milestone) || milestone < 1 || milestone > project.milestones) {
    throw new ProgressStoreError('invalid_milestone', `Milestone must be 1 to ${project.milestones} (got ${String(milestone)}).`, { projectId });
  }
  if (entry.milestones.includes(milestone)) return base;
  const before = missingMilestones(entry, milestone - 1);
  if (before.length) {
    throw new ProgressStoreError(
      'milestones_out_of_order',
      `Milestones are reached in order: milestone ${before.join(', ')} of "${projectId}" is not reached yet.`,
      { projectId, missingMilestones: before },
    );
  }
  return withProject(base, projectId, { ...entry, milestones: [...entry.milestones, milestone].sort((a, b) => a - b) });
}

/**
 * Record the verdict on one "## Review" criterion, once every milestone is reached. A new
 * verdict on the same criterion replaces the old one (after the learner improved the result).
 */
export function recordProjectReview<P extends ProjectRef>(
  progress: MaybeProgress,
  projects: readonly P[],
  projectId: string,
  criterion: number,
  verdict: ReviewVerdict,
): Progress {
  const base = progress ?? emptyProgress();
  const project = find(projects, projectId);
  const entry = inProgress(base, projectId);
  requireMilestones(entry, project, 'The review');
  if (!Number.isInteger(criterion) || criterion < 1 || criterion > project.reviewCriteria) {
    throw new ProgressStoreError('invalid_review', `Criterion must be 1 to ${project.reviewCriteria} (got ${String(criterion)}).`, { projectId });
  }
  if (!reviewVerdictSchema.safeParse(verdict).success) {
    throw new ProgressStoreError('invalid_review', `Verdict must be met, partly or not_met (got ${String(verdict)}).`, { projectId });
  }
  return withProject(base, projectId, { ...entry, review: { ...entry.review, [String(criterion)]: verdict } });
}

/**
 * Mark a project done, once every milestone is reached and every review criterion has a
 * verdict. `notes` say what went well and what to work on.
 */
export function completeProject<P extends ProjectRef>(
  progress: MaybeProgress,
  projects: readonly P[],
  projectId: string,
  notes: string,
  options: DateOptions = {},
): Progress {
  const base = progress ?? emptyProgress();
  const project = find(projects, projectId);
  const entry = inProgress(base, projectId);
  requireMilestones(entry, project, 'Completing a project');
  const unreviewed = missingCriteria(entry, project.reviewCriteria);
  if (unreviewed.length) {
    throw new ProgressStoreError(
      'review_incomplete',
      `Review the result first: criterion ${unreviewed.join(', ')} of "${projectId}" has no verdict yet.`,
      { projectId, missingCriteria: unreviewed },
    );
  }
  const note = notes?.trim();
  if (!note) throw new ProgressStoreError('invalid_notes', 'Notes must say what went well and what to work on.', { projectId });
  return withProject(base, projectId, { ...entry, status: 'done', completedAt: options.today ?? isoDate(), notes: note });
}

/** Save the tutor's notes on a started project (e.g. where a session stopped). Replaces the previous notes. */
export function saveProjectNotes<P extends ProjectRef>(
  progress: MaybeProgress,
  projects: readonly P[],
  projectId: string,
  notes: string,
): Progress {
  const base = progress ?? emptyProgress();
  find(projects, projectId);
  const entry = base.projects?.[projectId];
  if (!entry) {
    throw new ProgressStoreError('project_not_started', `Project "${projectId}" has not been started: start it first.`, { projectId });
  }
  const note = notes?.trim();
  if (!note) throw new ProgressStoreError('invalid_notes', 'Notes must not be empty.', { projectId });
  return withProject(base, projectId, { ...entry, notes: note });
}

/**
 * Remove a project's progress so the learner can do it again. Works on a project that left the
 * catalog too, so an orphaned entry can be cleared.
 */
export function resetProject(progress: MaybeProgress, projectId: string): Progress {
  const base = progress ?? emptyProgress();
  if (!base.projects?.[projectId]) {
    throw new ProgressStoreError('nothing_to_reset', `Project "${projectId}" has no progress to reset.`, { projectId });
  }
  const { [projectId]: _removed, ...rest } = base.projects;
  const { projects: _projects, ...others } = base;
  return Object.keys(rest).length ? { ...others, projects: rest } : others;
}
