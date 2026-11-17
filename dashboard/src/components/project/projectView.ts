import {
  getProjectStatus,
  readProjectContent,
  type Course,
  type Progress,
  type Project,
  type Theme,
} from '@lessonfolk/core';
import { formatDate } from '../course/courseView';

/** Where the learner stands in a project (the lesson statuses StatusBadge already shows). */
export type ProjectDisplayStatus = 'not_started' | 'in_progress' | 'done';

export interface ProjectCardView {
  project: Project;
  theme: Theme | undefined;
  status: ProjectDisplayStatus;
  /** Number of milestones reached. */
  reached: number;
  /** The courses the project builds on; `course` is undefined when the id is not in the catalog. */
  buildsOn: { id: string; course: Course | undefined }[];
}

/** The state of one milestone on the project page. */
export type MilestoneState = 'reached' | 'next' | 'todo';

export interface ProjectPageView extends ProjectCardView {
  /** The brief, one entry per paragraph. */
  brief: string[];
  /** Each milestone's title and what to reach, without its "Done when:" line (for the tutor). */
  milestones: { title: string; body: string; state: MilestoneState }[];
  startedOn: string | null;
  completedOn: string | null;
  /** The tutor's notes, or null when there are none. */
  notes: string | null;
}

/** One project as a catalog card: theme, status, milestones reached and the courses it builds on. */
export function projectCard(project: Project, catalog: { courses: Course[]; themes: Theme[] }, progress: Progress): ProjectCardView {
  return {
    project,
    theme: catalog.themes.find((theme) => theme.id === project.theme),
    status: getProjectStatus(progress, project.id),
    reached: progress.projects?.[project.id]?.milestones.length ?? 0,
    buildsOn: project.buildsOn.map((id) => ({ id, course: catalog.courses.find((course) => course.id === id) })),
  };
}

/**
 * Everything the project page shows, or undefined when `projectId` is not a project. Only the
 * brief and the milestones are shown: the "Done when:" lines, the review criteria, "Going
 * further" and the coaching notes are instructions for the tutor.
 */
export function getProjectView(
  projects: Project[],
  projectId: string,
  catalog: { courses: Course[]; themes: Theme[] },
  progress: Progress,
  locale = 'en',
): ProjectPageView | undefined {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return undefined;
  const card = projectCard(project, catalog, progress);
  const entry = progress.projects?.[project.id];
  const content = readProjectContent(project);
  const reached = new Set(entry?.milestones ?? []);
  const next = entry?.status === 'in_progress' ? content.milestones.findIndex((_, i) => !reached.has(i + 1)) : -1;
  return {
    ...card,
    brief: content.brief,
    milestones: content.milestones.map((milestone, i) => ({
      title: milestone.title,
      body: milestone.body,
      state: reached.has(i + 1) ? 'reached' : i === next ? 'next' : 'todo',
    })),
    startedOn: entry?.startedAt ? formatDate(entry.startedAt, locale) : null,
    completedOn: entry?.completedAt ? formatDate(entry.completedAt, locale) : null,
    notes: entry?.notes?.trim() || null,
  };
}

/** The projects that build on a course, for "Practise with a project" on its page. */
export function projectsForCourse(projects: Project[], courseId: string): Project[] {
  return projects.filter((project) => project.buildsOn.includes(courseId));
}

export type InlineSegment = { kind: 'text' | 'strong' | 'code'; text: string };

/**
 * Split a line of project text into plain, bold (`**…**`) and code (`` `…` ``) segments, so a
 * page can render that inline Markdown with escaped text and no HTML from the file.
 */
export function inlineSegments(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) segments.push({ kind: 'text', text: text.slice(last, match.index) });
    segments.push(match[1] !== undefined ? { kind: 'strong', text: match[1] } : { kind: 'code', text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ kind: 'text', text: text.slice(last) });
  return segments;
}
