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
  type Project,
  CourseValidationError,
  DEFAULT_LANG,
  getLessonStatus,
  getProjectStatus,
  inspectCatalog,
  inspectProjects,
  missingCriteria,
  missingMilestones,
  isPlacementSkip,
  languageCode,
  listLanguages,
} from '@lessonfolk/core';

export { DEFAULT_LANG };

/**
 * The catalog of `lang`: translated text where `courses/<lang>/` has it, English for the rest
 * (all English when there is no translation). Throws on broken course files.
 */
export function readCatalog(coursesDir: string, lang = DEFAULT_LANG): Catalog {
  const chosen = listLanguages(coursesDir).includes(lang) ? lang : DEFAULT_LANG;
  const { catalog, issues } = inspectCatalog(chosen, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog;
}

/** The course language to use: the one asked for, else the learner's profile language, else English. */
export function learnerLang(progress: Progress, asked?: string): string {
  return asked ?? languageCode(progress.profile.language) ?? DEFAULT_LANG;
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

/** Where a lesson stands in its course, so the tutor never has to guess whether it is the last one. */
export function lessonPosition(course: Course, lesson: Lesson): { lessonNumber: number; totalLessons: number; isLastLesson: boolean } {
  const totalLessons = course.lessons.length;
  const lessonNumber = course.lessons.findIndex((l) => l.id === lesson.id) + 1;
  return { lessonNumber, totalLessons, isLastLesson: lessonNumber === totalLessons };
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

/**
 * The practice projects in `lang` (translated text where `projects/<lang>/` has it, English for
 * the rest), in `projects/en/index.yaml` order, checked against the courses of `coursesDir`.
 * No `projectsDir` means no projects. Throws on broken project files.
 */
export function readProjects(projectsDir: string | undefined, coursesDir: string, lang = DEFAULT_LANG): Project[] {
  if (!projectsDir) return [];
  const { projects, issues } = inspectProjects(lang, projectsDir, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, projectsDir);
  return projects;
}

/** Where the learner stands in a project: status, milestones reached, the next one, review verdicts. */
export function projectState(progress: Progress, project: Project) {
  const entry = progress.projects?.[project.id];
  const left = missingMilestones(entry, project.milestones);
  return {
    status: getProjectStatus(progress, project.id),
    milestonesReached: entry?.milestones ?? [],
    ...(entry?.status === 'in_progress' && left.length && { nextMilestone: left[0] }),
    ...(entry?.review && { review: entry.review }),
    ...(entry?.status === 'in_progress' && !left.length && { criteriaToReview: missingCriteria(entry, project.reviewCriteria) }),
  };
}

/** A project as the tools return it: metadata, the courses it builds on, and the learner's status. */
export function projectSummary(catalog: Catalog, project: Project, progress?: Progress) {
  return {
    id: project.id,
    title: project.title,
    level: project.level,
    theme: project.theme,
    themeTitle: catalog.themes.find((t) => t.id === project.theme)?.title,
    description: project.description,
    estimatedHours: project.estimatedHours,
    needs: project.needs,
    buildsOn: project.buildsOn.map((id) => {
      const course = catalog.courses.find((c) => c.id === id);
      return { id, title: course?.title ?? id, ...(progress && course && { status: courseStatus(progress, course) }) };
    }),
    milestones: project.milestones,
    reviewCriteria: project.reviewCriteria,
    authors: project.authors,
    ...(progress && projectState(progress, project)),
  };
}

/** The project file (frontmatter and Markdown: brief, milestones, coaching notes, review). */
export function readProjectText(project: Project): string {
  return readFileSync(project.file, 'utf8').replace(/^﻿/, '');
}
