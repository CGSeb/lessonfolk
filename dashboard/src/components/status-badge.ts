import type { UiKey } from '../i18n/en';
import type { LessonStatus } from '../lib/progress';
import { courseStatusDisplay, type BadgeVariant, type CourseStatus } from './course-status';

/** Where the learner stands in one lesson. */
export type LessonDisplayStatus = LessonStatus | 'not_started';

/** Any status a StatusBadge can show: a course status or a lesson status. */
export type DisplayStatus = CourseStatus | LessonDisplayStatus;

const lessonDisplay: Record<LessonDisplayStatus, { key: UiKey; variant: BadgeVariant }> = {
  not_started: { key: 'status.notStarted', variant: undefined },
  in_progress: { key: 'status.inProgress', variant: 'info' },
  done: { key: 'status.done', variant: 'success' },
  skipped: { key: 'status.skipped', variant: undefined },
};

/** i18n key and badge variant for a course or lesson status. */
export function statusDisplay(status: DisplayStatus): { key: UiKey; variant: BadgeVariant } {
  return status === 'completed' ? courseStatusDisplay(status) : lessonDisplay[status];
}
