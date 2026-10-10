/**
 * The rubric a coding agent scores each lesson against, and the brief built from it
 * (`npm run review:courses`, the "Review a course" procedure of AGENTS.md). The review
 * is advice for the author, never a pass/fail gate like `check:courses`.
 */
import type { Course, Lesson } from './courses.ts';

interface ReviewCriterion {
  id: string;
  /** What the reviewer must decide; a "no" is a `fail`. */
  question: string;
}

export const REVIEW_CRITERIA: readonly ReviewCriterion[] = [
  {
    id: 'on-topic',
    question:
      'Does the lesson teach what its title promises, and does it belong in this course ' +
      '(it serves the course description and builds on the lessons before it)?',
  },
  {
    id: 'objectives-covered',
    question:
      'Is every objective of the frontmatter taught by at least one key idea and tested by at ' +
      'least one question of "Check your understanding" or by the exercise?',
  },
  {
    id: 'criteria-match-checks',
    question:
      'Can the tutor decide every completion criterion from the checks and the exercise alone, ' +
      'with no criterion about something the lesson never asks?',
  },
  {
    id: 'level-fit',
    question:
      'Is the lesson written for its stated level? Beginner: every technical term is explained ' +
      'when first used and there is no math. Intermediate and advanced: it assumes nothing ' +
      'beyond its prerequisites and does not re-teach basics at length.',
  },
  {
    id: 'no-fast-aging-claims',
    question:
      'Is the lesson free of claims that will soon be wrong: a model or product named as the ' +
      'best or latest, prices, version numbers, dates, "recently"?',
  },
  {
    id: 'no-overlap',
    question:
      'Is the lesson free of content that another lesson of the catalog already teaches? One ' +
      'sentence that restates an idea and names the other course is fine.',
  },
];

export interface LessonSelection {
  course: Course;
  lesson: Lesson;
}

/**
 * The lessons named by `filters` (course ids or lesson ids), in catalog order; every
 * lesson when there is no filter. `unknown` lists the filters that match nothing.
 */
export function selectLessons(
  courses: Course[],
  filters: string[] = [],
): { selected: LessonSelection[]; unknown: string[] } {
  const all = courses.flatMap((course) => course.lessons.map((lesson) => ({ course, lesson })));
  const matches = (filter: string, { course, lesson }: LessonSelection) =>
    filter === course.id || filter === lesson.id;
  return {
    selected: filters.length ? all.filter((entry) => filters.some((f) => matches(f, entry))) : all,
    unknown: filters.filter((f) => !all.some((entry) => matches(f, entry))),
  };
}

/**
 * What the reviewing agent needs: the rubric, the lessons to read (`fileOf` gives the
 * path to show for each) and an outline of the whole catalog for the overlap check.
 */
export function reviewBrief(
  courses: Course[],
  selected: LessonSelection[],
  fileOf: (lesson: Lesson) => string = (lesson) => lesson.file,
): string {
  const rubric = REVIEW_CRITERIA.map((c) => `- ${c.id}: ${c.question}`).join('\n');
  const toReview = selected
    .map(({ course, lesson }) => `- ${fileOf(lesson)} (${lesson.level}, ${lesson.estimatedMinutes} min, course "${course.title}")`)
    .join('\n');
  const outline = courses
    .map((course) => {
      const lessons = course.lessons
        .map((l) => `  - ${l.id}: ${l.title}\n${l.objectives.map((o) => `    - ${o}`).join('\n')}`)
        .join('\n');
      const prerequisites = course.prerequisites.length ? course.prerequisites.join(', ') : 'none';
      return (
        `${course.id} (${course.level}, prerequisites: ${prerequisites}): ${course.title}\n` +
        `  ${course.description}\n${lessons}`
      );
    })
    .join('\n\n');
  return `# Lesson review brief

A lesson is a script for an AI tutor, not a page the learner reads: "Key ideas" is the content, "Teaching notes" are for the tutor only, "Check your understanding" holds questions with a "Good answer:" hint, and "Completion criteria" say when the tutor may mark the lesson as done.

The author uses the review to decide which lessons to reread, so a wrong "fail" costs them time and a wrong "pass" hides a problem. Fail a criterion only for something you can point to in the lesson.

## Rubric

Answer every criterion for every lesson, pass or fail:

${rubric}

## Lessons to review (${selected.length})

Read each file in full before you answer.

${toReview}

## Report

One line per lesson: "✔ <file>" when every criterion passes, otherwise "✖ <file>" followed by one line per failed criterion: its id, the words of the lesson it is about in quotes (or what is missing), and what to change, in one or two sentences. End with the count of lessons reviewed, clean, and to look at.

## Catalog outline

In the recommended learning order (course id, level, prerequisites, title, description, then each lesson with its objectives). Open another lesson's file when you need its text to judge an overlap.

${outline}
`;
}
