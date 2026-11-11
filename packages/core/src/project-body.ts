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
