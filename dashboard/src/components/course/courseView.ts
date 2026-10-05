import { relative, isAbsolute } from 'node:path';
import type { Course, CourseIssue, Lesson } from '../../lib/courses';
import { getNextLesson, getStats, type CourseStats, type Progress } from '../../lib/progress';
import { finishedLessons, getCourseStatus, type CourseStatus } from '../course-status';
import { lessonDisplayStatus, type LessonDisplayStatus } from '../status-badge';

export interface LessonRow {
  lesson: Lesson;
  status: LessonDisplayStatus;
  /** Score as a whole percentage (0–100), or null when the tutor gave none. */
  scorePercent: number | null;
  /** Completion date, formatted for display, or null when absent. */
  completedOn: string | null;
  /** Tutor's notes, or null when absent, blank or just the placement marker. */
  notes: string | null;
  /** The lesson the tutor would teach next ("Start or resume" in AGENTS.md). */
  isNext: boolean;
}

export interface CourseView {
  course: Course;
  stats: CourseStats<Course>;
  status: CourseStatus;
  /** Done or skipped lessons. */
  finished: number;
  /** Prerequisite courses; `course` is undefined when the id is not in the catalog. */
  prerequisites: { id: string; course: Course | undefined }[];
  lessons: LessonRow[];
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Format an ISO date ("2026-10-04" or a full timestamp) as e.g. "Oct 4, 2026".
 * Date-only values are formatted in UTC so they never shift by a day.
 * Unparseable values are returned unchanged.
 */
export function formatDate(value: string, locale = 'en'): string {
  const dateOnly = DATE_ONLY.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  }).format(date);
}

/**
 * Everything the course page shows, or undefined when `courseId` is not in the catalog.
 * `courses` is the whole catalog in index.yaml order (needed to find the next lesson
 * and the prerequisite courses).
 */
export function getCourseView(courses: Course[], courseId: string, progress: Progress): CourseView | undefined {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return undefined;

  const [stats] = getStats([course], progress).courses;
  const next = getNextLesson(courses, progress);
  const nextId = next?.course.id === course.id ? next.lesson.id : undefined;

  const lessons = course.lessons.map((lesson): LessonRow => {
    const entry = progress.lessons[lesson.id];
    const status = lessonDisplayStatus(progress, lesson.id);
    return {
      lesson,
      status,
      scorePercent: typeof entry?.score === 'number' ? Math.round(entry.score * 100) : null,
      completedOn: entry?.completedAt ? formatDate(entry.completedAt) : null,
      // The "placement" note is a marker for the badge, not a message for the learner.
      notes: status === 'skipped_placement' ? null : entry?.notes?.trim() || null,
      isNext: lesson.id === nextId,
    };
  });

  return {
    course,
    stats,
    status: getCourseStatus(stats),
    finished: finishedLessons(stats),
    prerequisites: course.prerequisites.map((id) => ({ id, course: courses.find((c) => c.id === id) })),
    lessons,
  };
}

/** Content issues found in the folder of one course (`<coursesDir>/<lang>/<courseId>/`). */
export function issuesForCourse(issues: CourseIssue[], courseDir: string): CourseIssue[] {
  return issues.filter(({ file }) => {
    const rel = relative(courseDir, file);
    return !rel.startsWith('..') && !isAbsolute(rel);
  });
}
