/**
 * Structural checks on a lesson's Markdown body, matching the fixed section
 * headings of docs/course-format.md. The tutor relies on these headings, so
 * structural problems are errors; drift from the writing guidelines is a warning.
 */

interface SectionSpec {
  title: string;
  required: boolean;
}

/** Sections in the order they must appear. */
export const LESSON_SECTIONS: readonly SectionSpec[] = [
  { title: 'Key ideas', required: true },
  { title: 'Teaching notes', required: true },
  { title: 'Check your understanding', required: true },
  { title: 'Exercise', required: false },
  { title: 'Completion criteria', required: true },
  { title: 'Going further', required: false },
];

/** Writing guidelines from docs/course-format.md. */
export const KEY_IDEAS_RANGE = { min: 3, max: 6 };
export const MINUTES_RANGE = { min: 10, max: 25 };

export interface LessonBodyReport {
  errors: string[];
  warnings: string[];
}

const HEADING = /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE = /^[ \t]*(```|~~~)/;
const NUMBERED_ITEM = /^\d+[.)][ \t]/;
const GOOD_ANSWER = /good answer:/i;

const heading = (title: string) => `"## ${title}"`;
/** Loose form used to suggest the intended heading for a typo (case, plural). */
const loose = (title: string) => title.toLowerCase().replace(/\s+/g, ' ').replace(/s$/, '');

/** Split the body into `##` sections, ignoring headings inside fenced code blocks. */
function splitSections(body: string): { title: string; lines: string[] }[] {
  const sections: { title: string; lines: string[] }[] = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;
    const match = inFence ? null : HEADING.exec(line);
    if (match) sections.push({ title: match[1], lines: [] });
    else sections.at(-1)?.lines.push(line);
  }
  return sections;
}

/** Top-level numbered items (`1. …`), each with the lines that follow it. */
function numberedItems(lines: string[]): string[][] {
  const items: string[][] = [];
  for (const line of lines) {
    if (NUMBERED_ITEM.test(line)) items.push([line]);
    else items.at(-1)?.push(line);
  }
  return items;
}

export function checkLessonBody(body: string, estimatedMinutes: number): LessonBodyReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = splitSections(body);
  const known = new Map(LESSON_SECTIONS.map((s, i) => [s.title, i]));

  // Unknown and duplicate headings.
  const seen = new Set<string>();
  const ordered: { title: string; rank: number }[] = [];
  for (const { title } of sections) {
    const rank = known.get(title);
    if (rank === undefined) {
      const near = LESSON_SECTIONS.find((s) => loose(s.title) === loose(title));
      const hint = near
        ? `did you mean ${heading(near.title)}?`
        : `expected one of ${LESSON_SECTIONS.map((s) => heading(s.title)).join(', ')}`;
      errors.push(`unknown section ${heading(title)}; ${hint}`);
    } else if (seen.has(title)) {
      errors.push(`section ${heading(title)} appears more than once`);
    } else {
      seen.add(title);
      ordered.push({ title, rank });
    }
  }

  for (const spec of LESSON_SECTIONS) {
    if (spec.required && !seen.has(spec.title)) {
      errors.push(`missing section ${heading(spec.title)}`);
    }
  }

  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].rank < ordered[i - 1].rank) {
      errors.push(
        `section ${heading(ordered[i].title)} must come before ${heading(ordered[i - 1].title)}`,
      );
    }
  }

  const linesOf = (title: string) => sections.find((s) => s.title === title)?.lines;

  const checks = linesOf('Check your understanding');
  if (checks) {
    const questions = numberedItems(checks);
    if (!questions.length) {
      errors.push(`${heading('Check your understanding')} has no numbered questions`);
    }
    questions.forEach((lines, i) => {
      if (!lines.some((line) => GOOD_ANSWER.test(line))) {
        errors.push(
          `question ${i + 1} in ${heading('Check your understanding')} has no "Good answer:" line`,
        );
      }
    });
  }

  const ideas = linesOf('Key ideas');
  if (ideas) {
    const count = numberedItems(ideas).length;
    if (count < KEY_IDEAS_RANGE.min || count > KEY_IDEAS_RANGE.max) {
      warnings.push(
        `${heading('Key ideas')} has ${count} numbered idea${count === 1 ? '' : 's'}; ` +
          `guidelines suggest ${KEY_IDEAS_RANGE.min}–${KEY_IDEAS_RANGE.max}`,
      );
    }
  }

  if (estimatedMinutes < MINUTES_RANGE.min || estimatedMinutes > MINUTES_RANGE.max) {
    warnings.push(
      `estimatedMinutes is ${estimatedMinutes}; ` +
        `guidelines suggest ${MINUTES_RANGE.min}–${MINUTES_RANGE.max} minutes`,
    );
  }

  return { errors, warnings };
}
