/**
 * Print the brief a coding agent follows to review lessons against the rubric of
 * @lessonfolk/core (REVIEW_CRITERIA): the rubric, the lessons to read and the catalog
 * outline. It calls no AI service: the agent that runs it does the review (the
 * "Review a course" procedure of AGENTS.md, `/review-course` in Claude Code).
 * Usage: npm run review:courses [-- <course-id | lesson-id>… --lang en]
 */
import { relative } from 'node:path';
import { parseArgs } from 'node:util';
import { findRepoRoot, getCoursesDir, loadCatalog, reviewBrief, selectLessons } from '@lessonfolk/core';

const { values: options, positionals: filters } = parseArgs({
  allowPositionals: true,
  options: { lang: { type: 'string', default: 'en' } },
});

const courses = loadCatalog(options.lang, getCoursesDir());
const { selected, unknown } = selectLessons(courses, filters);
if (unknown.length) {
  console.error(`✖ No course or lesson with the id ${unknown.map((f) => `"${f}"`).join(', ')}`);
  process.exit(1);
}

const root = findRepoRoot();
console.log(reviewBrief(courses, selected, (lesson) => relative(root, lesson.file).replaceAll('\\', '/')));
