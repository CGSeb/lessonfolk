import {
  getNextLesson,
  getStats,
  progressOrEmpty,
  type CourseRef,
  type NextLesson,
  type ProgressResult,
} from '../../lib/progress';

/**
 * What the home page shows:
 * - `new`: no usable progress file yet (missing or invalid); `first` is the lesson they will begin with.
 * - `in_progress`: the learner has started; `next` is the lesson the tutor would pick.
 * - `done`: every lesson is done or skipped.
 * - `blocked`: lessons remain but none has its prerequisites met.
 * - `empty`: the learner has started but no course could be loaded.
 */
export type HomeState<C extends CourseRef> =
  | { state: 'new'; first: NextLesson<C> | null }
  | { state: 'in_progress'; next: NextLesson<C> }
  | { state: 'done' }
  | { state: 'blocked' }
  | { state: 'empty' };

export interface HomeView<C extends CourseRef> {
  view: HomeState<C>;
  /** Learner's name from the profile, or undefined when absent or blank. */
  name: string | undefined;
  /** Done or skipped lessons, out of all lessons in the catalog. */
  lessons: { finished: number; total: number };
  courses: { completed: number; total: number };
  /** Error message when the progress file exists but cannot be used. */
  progressError: string | undefined;
}

/** Pure computation of the home page content from the catalog and the progress read result. */
export function getHomeView<C extends CourseRef>(courses: C[], result: ProgressResult): HomeView<C> {
  const progress = progressOrEmpty(result);
  const stats = getStats(courses, progress);
  const next = getNextLesson(courses, progress);

  let view: HomeState<C>;
  if (result.state !== 'ok') view = { state: 'new', first: next };
  else if (next) view = { state: 'in_progress', next };
  else if (stats.overall.total === 0) view = { state: 'empty' };
  else if (stats.overall.completed) view = { state: 'done' };
  else view = { state: 'blocked' };

  return {
    view,
    name: progress.profile.name?.trim() || undefined,
    lessons: {
      finished: stats.overall.done + stats.overall.skipped,
      total: stats.overall.total,
    },
    courses: {
      completed: stats.courses.filter((c) => c.completed).length,
      total: stats.courses.length,
    },
    progressError: result.state === 'invalid' ? result.error : undefined,
  };
}
