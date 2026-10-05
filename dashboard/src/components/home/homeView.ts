import type { Level } from '../../lib/schemas';
import {
  getLevel,
  getNextLesson,
  getProgressWarnings,
  getStats,
  progressOrEmpty,
  type CourseRef,
  type NextLesson,
  type ProgressResult,
} from '../../lib/progress';
import { getCatalogSections, type ThemeRef } from '../catalog/catalogView';
import { getInterestThemes, getPathView, type PathView } from './pathView';

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
  /** Learner's level, or undefined when missing or unknown. */
  level: Level | undefined;
  /** Interests resolved to known themes, in the learner's order. */
  interests: { id: string; title: string }[];
  /** The personal path the tutor recommended, with each course's status. */
  path: PathView<C>;
  /**
   * Suggest saying "recommend a path": the learner has started, has no path, and still has
   * lessons left. Not once every lesson is finished: the tutor would have nothing to recommend.
   */
  suggestPath: boolean;
  /** Done or skipped lessons, out of all lessons in the catalog. */
  lessons: { finished: number; total: number };
  courses: { completed: number; total: number };
  /** Non-empty themes in `themes.yaml` order, with finished lessons out of the theme's lessons. */
  themes: ThemeProgress[];
  /** Error message when the progress file exists but cannot be used. */
  progressError: string | undefined;
  /** Ids in the progress file the catalog does not know (path courses, interest themes); they are ignored. */
  progressWarnings: string[];
}

export interface ThemeProgress {
  id: string;
  title: string;
  /** Anchor of the theme's section in the catalog. */
  anchor: string;
  finished: number;
  total: number;
  /** Every course of the theme is completed. */
  completed: boolean;
}

/** Pure computation of the home page content from the catalog and the progress read result. */
export function getHomeView<C extends CourseRef>(
  courses: C[],
  result: ProgressResult,
  themes: ThemeRef<C>[] = [],
): HomeView<C> {
  const progress = progressOrEmpty(result);
  const stats = getStats(courses, progress);
  const next = getNextLesson(courses, progress);

  let view: HomeState<C>;
  if (result.state !== 'ok') view = { state: 'new', first: next };
  else if (next) view = { state: 'in_progress', next };
  else if (stats.overall.total === 0) view = { state: 'empty' };
  else if (stats.overall.completed) view = { state: 'done' };
  else view = { state: 'blocked' };

  const path = getPathView(courses, progress, next);

  return {
    view,
    name: progress.profile.name?.trim() || undefined,
    level: getLevel(progress),
    interests: getInterestThemes(progress, themes),
    path,
    suggestPath: path.state === 'none' && (view.state === 'in_progress' || view.state === 'blocked'),
    lessons: {
      finished: stats.overall.done + stats.overall.skipped,
      total: stats.overall.total,
    },
    courses: {
      completed: stats.courses.filter((c) => c.completed).length,
      total: stats.courses.length,
    },
    // Courses with an unknown theme are reported as content issues, not shown here.
    themes: getCatalogSections(courses, themes, progress).flatMap(({ theme, anchor, lessons, completed }) =>
      theme ? [{ id: theme.id, title: theme.title, anchor, ...lessons, completed }] : [],
    ),
    progressError: result.state === 'invalid' ? result.error : undefined,
    progressWarnings: getProgressWarnings(
      progress,
      courses.map((c) => c.id),
      themes.map((th) => th.id),
    ),
  };
}
