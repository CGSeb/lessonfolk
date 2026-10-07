/**
 * Read-only views of the courses for the MCP tools and resources. Course files are read on
 * every call (like the dashboard), so edits show up without a restart.
 */
import { readFileSync } from 'node:fs';
import {
  type Catalog,
  type Course,
  type Lesson,
  type Progress,
  CourseValidationError,
  getLessonStatus,
  inspectCatalog,
  isPlacementSkip,
  listLanguages,
} from '@lessonfolk/core';

export const DEFAULT_LANG = 'en';

/** The catalog of `lang`, or of `en` when there is no translation. Throws on broken course files. */
export function readCatalog(coursesDir: string, lang = DEFAULT_LANG): Catalog {
  const chosen = listLanguages(coursesDir).includes(lang) ? lang : DEFAULT_LANG;
  const { catalog, issues } = inspectCatalog(chosen, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog;
}

/** Courses in `index.yaml` order of the default language: the catalog the progress rules use. */
export function readCourses(coursesDir: string): Course[] {
  return readCatalog(coursesDir).courses;
}

export function findLesson(catalog: Catalog, lessonId: string): { course: Course; lesson: Lesson } | undefined {
  for (const course of catalog.courses) {
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

export type LearnerStatus = 'not_started' | 'in_progress' | 'done' | 'skipped' | 'skipped_after_level_check';

export function lessonStatus(progress: Progress, lessonId: string): LearnerStatus {
  const status = getLessonStatus(progress, lessonId);
  if (status === 'skipped' && isPlacementSkip(progress, lessonId)) return 'skipped_after_level_check';
  return status;
}

/** A course's status for the learner, as the dashboard shows it. */
export function courseStatus(progress: Progress, course: Course): LearnerStatus {
  const statuses = course.lessons.map((lesson) => lessonStatus(progress, lesson.id));
  if (statuses.length && statuses.every((s) => s === 'skipped_after_level_check')) return 'skipped_after_level_check';
  const finished = statuses.filter((s) => s === 'done' || s === 'skipped' || s === 'skipped_after_level_check').length;
  if (statuses.length && finished === statuses.length) return 'done';
  if (statuses.some((s) => s !== 'not_started')) return 'in_progress';
  return 'not_started';
}

/** A course as the tools return it: metadata, lessons and the learner's status. */
export function courseSummary(catalog: Catalog, course: Course, progress?: Progress) {
  return {
    id: course.id,
    title: course.title,
    level: course.level,
    theme: course.theme,
    themeTitle: catalog.themes.find((t) => t.id === course.theme)?.title,
    description: course.description,
    estimatedHours: course.estimatedHours,
    prerequisites: course.prerequisites,
    authors: course.authors,
    ...(progress && { status: courseStatus(progress, course) }),
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      estimatedMinutes: lesson.estimatedMinutes,
      prerequisites: lesson.prerequisites,
      ...(progress && { status: lessonStatus(progress, lesson.id) }),
    })),
  };
}

/** The lesson file (frontmatter and Markdown: content, teaching notes, checks). */
export function readLessonText(lesson: Lesson): string {
  return readFileSync(lesson.file, 'utf8').replace(/^﻿/, '');
}
