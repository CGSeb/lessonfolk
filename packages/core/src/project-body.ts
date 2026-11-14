/**
 * Structural checks on a project's Markdown body, matching the fixed section headings of
 * docs/project-format.md. The tutor coaches from these headings, so structural problems are
 * errors; drift from the writing guidelines is a warning.
 */
import { checkSectionLayout, numberedItems, splitSections, type SectionSpec } from './lesson-body.ts';

/** Sections in the order they must appear. */
export const PROJECT_SECTIONS: readonly SectionSpec[] = [
  { title: 'Brief', required: true },
  { title: 'Milestones', required: true },
  { title: 'Coaching notes', required: true },
  { title: 'Review', required: true },
  { title: 'Going further', required: false },
];

/** Writing guidelines from docs/project-format.md. */
export const MILESTONES_RANGE = { min: 3, max: 6 };
export const PROJECT_HOURS_RANGE = { min: 1, max: 10 };

export interface ProjectBodyReport {
  errors: string[];
  warnings: string[];
  /** Number of numbered milestones in "## Milestones". */
  milestones: number;
  /** Number of numbered criteria in "## Review". */
  reviewCriteria: number;
}

const DONE_WHEN = /done when:/i;
const heading = (title: string) => `"## ${title}"`;

export function checkProjectBody(body: string, estimatedHours: number): ProjectBodyReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = splitSections(body);
  checkSectionLayout(sections, PROJECT_SECTIONS, errors);
  const linesOf = (title: string) => sections.find((s) => s.title === title)?.lines;

  const brief = linesOf('Brief');
  if (brief && !brief.some((line) => line.trim())) {
    errors.push(`${heading('Brief')} is empty`);
  }

  const milestoneLines = linesOf('Milestones');
  const milestones = milestoneLines ? numberedItems(milestoneLines) : [];
  if (milestoneLines) {
    if (!milestones.length) errors.push(`${heading('Milestones')} has no numbered milestones`);
    milestones.forEach((lines, i) => {
      if (!lines.some((line) => DONE_WHEN.test(line))) {
        errors.push(`milestone ${i + 1} in ${heading('Milestones')} has no "Done when:" line`);
      }
    });
    if (milestones.length && (milestones.length < MILESTONES_RANGE.min || milestones.length > MILESTONES_RANGE.max)) {
      warnings.push(
        `${heading('Milestones')} has ${milestones.length} milestone${milestones.length === 1 ? '' : 's'}; ` +
          `guidelines suggest ${MILESTONES_RANGE.min}–${MILESTONES_RANGE.max}`,
      );
    }
  }

  const reviewLines = linesOf('Review');
  const criteria = reviewLines ? numberedItems(reviewLines) : [];
  if (reviewLines && !criteria.length) {
    errors.push(`${heading('Review')} has no numbered criteria`);
  }

  if (estimatedHours < PROJECT_HOURS_RANGE.min || estimatedHours > PROJECT_HOURS_RANGE.max) {
    warnings.push(
      `estimatedHours is ${estimatedHours}; ` +
        `guidelines suggest ${PROJECT_HOURS_RANGE.min}–${PROJECT_HOURS_RANGE.max} hours`,
    );
  }

  return { errors, warnings, milestones: milestones.length, reviewCriteria: criteria.length };
}

/** One milestone as the learner sees it. */
export interface ProjectMilestone {
  /** The bold lead of the milestone (`**Choose the task.**`), without the stars and final dot; empty when there is none. */
  title: string;
  /** The rest of the milestone text, before its "Done when:" line. */
  body: string;
  /** What the "Done when:" line says (without the label). */
  doneWhen: string;
}

/**
 * The parts of a project a learner may read: the brief (paragraphs), the milestones, the review
 * criteria and the "Going further" items. The coaching notes are for the tutor only and are
 * never returned. Inline Markdown (`**bold**`, `` `code` ``) is kept as written.
 */
export interface ProjectContent {
  brief: string[];
  milestones: ProjectMilestone[];
  review: string[];
  goingFurther: string[];
}

const ITEM_START = /^\d+[.)][ \t]+/;
const BULLET = /^[ \t]*[-*][ \t]+/;
const LEAD = /^\*\*(.+?)\*\*[ \t]*/;

const joinLines = (lines: string[]) => lines.map((line) => line.trim()).filter(Boolean).join(' ');

/** Blank-line separated paragraphs, each joined into one line. */
function paragraphs(lines: string[]): string[] {
  const out: string[][] = [[]];
  for (const line of lines) {
    if (line.trim()) out.at(-1)!.push(line);
    else if (out.at(-1)!.length) out.push([]);
  }
  return out.filter((p) => p.length).map(joinLines);
}

function bullets(lines: string[]): string[] {
  const items: string[][] = [];
  for (const line of lines) {
    if (BULLET.test(line)) items.push([line.replace(BULLET, '')]);
    else if (line.trim()) items.at(-1)?.push(line);
  }
  return items.map(joinLines);
}

function milestone(lines: string[]): ProjectMilestone {
  const text = joinLines([lines[0].replace(ITEM_START, ''), ...lines.slice(1)]);
  const at = text.search(DONE_WHEN);
  const main = (at === -1 ? text : text.slice(0, at)).trim();
  const doneWhen = at === -1 ? '' : text.slice(at).replace(DONE_WHEN, '').trim();
  const lead = LEAD.exec(main);
  return {
    title: lead ? lead[1].trim().replace(/[.:]$/, '') : '',
    body: lead ? main.slice(lead[0].length).trim() : main,
    doneWhen,
  };
}

/** Read the learner-facing parts of a project body (see `ProjectContent`). */
export function parseProjectContent(body: string): ProjectContent {
  const sections = splitSections(body);
  const linesOf = (title: string) => sections.find((s) => s.title === title)?.lines ?? [];
  return {
    brief: paragraphs(linesOf('Brief')),
    milestones: numberedItems(linesOf('Milestones')).map(milestone),
    review: numberedItems(linesOf('Review')).map((lines) => joinLines([lines[0].replace(ITEM_START, ''), ...lines.slice(1)])),
    goingFurther: bullets(linesOf('Going further')),
  };
}
