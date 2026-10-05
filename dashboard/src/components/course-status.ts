import type { UiKey } from '../i18n/en';
import type { ProgressCounts } from '../lib/progress';

/** Where the learner stands in a course, as shown on course cards. */
export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped_placement';

/** Badge modifier from global.css (`badge--success`, `badge--info`, `badge--placement`), or none. */
export type BadgeVariant = 'success' | 'info' | 'placement' | undefined;

type Counts = Pick<ProgressCounts, 'done' | 'skipped' | 'placementSkipped' | 'inProgress' | 'total' | 'completed'>;

/** Lessons finished in a course: done or skipped. */
export function finishedLessons(counts: Counts): number {
  return counts.done + counts.skipped;
}

/**
 * Skipped by placement when the tutor's level check skipped every lesson; completed when every
 * lesson is done or skipped; in progress as soon as any lesson has an entry in the progress
 * file other than a level-check skip; not started otherwise.
 */
export function getCourseStatus(counts: Counts): CourseStatus {
  if (counts.completed) return counts.placementSkipped === counts.total ? 'skipped_placement' : 'completed';
  if (finishedLessons(counts) - counts.placementSkipped + counts.inProgress > 0) return 'in_progress';
  return 'not_started';
}

const display: Record<CourseStatus, { key: UiKey; variant: BadgeVariant }> = {
  not_started: { key: 'status.notStarted', variant: undefined },
  in_progress: { key: 'status.inProgress', variant: 'info' },
  completed: { key: 'status.completed', variant: 'success' },
  skipped_placement: { key: 'status.skippedPlacement', variant: 'placement' },
};

/** i18n key and badge variant for a course status. */
export function courseStatusDisplay(status: CourseStatus): { key: UiKey; variant: BadgeVariant } {
  return display[status];
}
