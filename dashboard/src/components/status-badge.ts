import type { UiKey } from '../i18n/en';
import { getLessonStatus, isPlacementSkip, type LessonStatus, type Progress } from '../lib/progress';
import { courseStatusDisplay, type BadgeVariant, type CourseStatus } from './course-status';

/**
 * Where the learner stands in one lesson. `skipped_placement` is a lesson the tutor skipped
 * during a placement check (see `isPlacementSkip`), shown apart from manual skips.
 */
export type LessonDisplayStatus = LessonStatus | 'not_started' | 'skipped_placement';

/** Any status a StatusBadge can show: a course status or a lesson status. */
export type DisplayStatus = CourseStatus | LessonDisplayStatus;

const lessonDisplay: Record<LessonDisplayStatus, { key: UiKey; variant: BadgeVariant }> = {
  not_started: { key: 'status.notStarted', variant: undefined },
  in_progress: { key: 'status.inProgress', variant: 'info' },
  done: { key: 'status.done', variant: 'success' },
  skipped: { key: 'status.skipped', variant: undefined },
  skipped_placement: { key: 'status.skippedPlacement', variant: 'placement' },
};

/** i18n key and badge variant for a course or lesson status. */
export function statusDisplay(status: DisplayStatus): { key: UiKey; variant: BadgeVariant } {
  return status === 'completed' ? courseStatusDisplay(status) : lessonDisplay[status];
}

/** Display status of a lesson, telling placement skips apart from manual skips. */
export function lessonDisplayStatus(progress: Progress | null | undefined, lessonId: string): LessonDisplayStatus {
  return isPlacementSkip(progress, lessonId) ? 'skipped_placement' : getLessonStatus(progress, lessonId);
}
