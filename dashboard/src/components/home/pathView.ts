import type { UiKey } from '../../i18n/en';
import {
  getPathCourseIds,
  getStats,
  type CourseRef,
  type NextLesson,
  type Progress,
} from '../../lib/progress';
import { formatDate } from '../course/courseView';
import { finishedLessons, getCourseStatus, type BadgeVariant } from '../course-status';

/**
 * Where the learner stands in one course of their path:
 * - `done`: every lesson is done or skipped, at least one by the learner (not only by placement).
 * - `skipped_placement`: every lesson was skipped by the tutor's level check.
 * - `in_progress`: the learner has worked on at least one lesson (placement skips do not count).
 * - `up_next`: not started yet, and it holds the lesson the tutor would teach next.
 * - `not_started`: anything else.
 */
export type PathCourseStatus = 'done' | 'skipped_placement' | 'in_progress' | 'up_next' | 'not_started';

export interface PathCourse<C extends CourseRef> {
  course: C;
  status: PathCourseStatus;
  /** The course holds the lesson the tutor would teach next (same rule as the next-lesson card). */
  isNext: boolean;
  /** Done or skipped lessons, out of the course's lessons. */
  finished: number;
  total: number;
  /** Lessons skipped by the tutor's level check. */
  placementSkipped: number;
}

/**
 * The learner's personal path:
 * - `none`: no `path`, an empty one, or one with only unknown course ids (those are reported
 *   by `getProgressWarnings`).
 * - `set`: the known courses of `path`, in path order, with the tutor's reason and update date.
 */
export type PathView<C extends CourseRef> =
  | { state: 'none' }
  | { state: 'set'; courses: PathCourse<C>[]; reason: string | undefined; updatedOn: string | undefined };

/**
 * Pure computation of the "Your path" block. `next` is the lesson the tutor would teach next
 * (`getNextLesson`), so the highlighted course always matches the next-lesson card.
 */
export function getPathView<C extends CourseRef>(
  courses: C[],
  progress: Progress,
  next: NextLesson<C> | null,
): PathView<C> {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const pathCourses = getPathCourseIds(byId.keys(), progress).map((id) => byId.get(id)!);
  if (!pathCourses.length) return { state: 'none' };

  const stats = getStats(pathCourses, progress).courses;
  return {
    state: 'set',
    courses: stats.map((counts) => {
      const { course, total, placementSkipped } = counts;
      const isNext = next?.course.id === course.id;
      // Same rule as the catalog cards, plus "up next" for the course the tutor teaches next.
      const courseStatus = getCourseStatus(counts);
      let status: PathCourseStatus;
      if (courseStatus === 'completed') status = 'done';
      else if (courseStatus === 'not_started') status = isNext ? 'up_next' : 'not_started';
      else status = courseStatus;
      return { course, status, isNext, finished: finishedLessons(counts), total, placementSkipped };
    }),
    reason: progress.pathReason?.trim() || undefined,
    updatedOn: progress.pathUpdatedAt?.trim() ? formatDate(progress.pathUpdatedAt.trim()) : undefined,
  };
}

const display: Record<PathCourseStatus, { key: UiKey; variant: BadgeVariant }> = {
  done: { key: 'status.done', variant: 'success' },
  skipped_placement: { key: 'status.skippedPlacement', variant: 'placement' },
  in_progress: { key: 'status.inProgress', variant: 'info' },
  up_next: { key: 'status.upNext', variant: 'info' },
  not_started: { key: 'status.notStarted', variant: undefined },
};

/** i18n key and badge variant for a course status in the path. */
export function pathStatusDisplay(status: PathCourseStatus): { key: UiKey; variant: BadgeVariant } {
  return display[status];
}

/** Interest theme ids resolved to themes, in the learner's order; unknown and repeated ids are ignored. */
export function getInterestThemes<T extends { id: string; title: string }>(
  progress: Progress,
  themes: T[],
): { id: string; title: string }[] {
  const byId = new Map(themes.map((th) => [th.id, th]));
  return [...new Set(progress.profile.interests ?? [])].flatMap((id) => {
    const theme = byId.get(id);
    return theme ? [{ id: theme.id, title: theme.title }] : [];
  });
}
