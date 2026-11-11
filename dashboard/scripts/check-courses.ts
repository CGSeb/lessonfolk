/**
 * Validate every language under courses/ (or the directory given as argument), and the
 * practice projects in its projects/ folder.
 * Usage: npm run check:courses [-- <courses-dir>]
 * Exits with code 1 and one line per problem when content is invalid.
 * Drift from the writing guidelines is printed as warnings and does not fail.
 */
import { resolve } from 'node:path';
import {
  formatCourseIssues,
  getCoursesDir,
  inspectAllCourses,
  listLanguages,
  listProjectLanguages,
} from '@lessonfolk/core';

const arg = process.argv[2];
const coursesDir = arg ? resolve(process.env.INIT_CWD ?? process.cwd(), arg) : getCoursesDir();
const { issues, warnings } = inspectAllCourses(coursesDir);

if (warnings.length) {
  console.warn(
    `⚠ ${warnings.length} warning${warnings.length === 1 ? '' : 's'} in ${coursesDir}:\n` +
      formatCourseIssues(warnings, coursesDir),
  );
}

if (issues.length) {
  console.error(
    `✖ ${issues.length} problem${issues.length === 1 ? '' : 's'} in ${coursesDir}:\n` +
      formatCourseIssues(issues, coursesDir),
  );
  process.exit(1);
}
const projectLangs = listProjectLanguages(coursesDir);
const projects = projectLangs.length ? `, projects (${projectLangs.join(', ')})` : '';
console.log(`✔ Courses (${listLanguages(coursesDir).join(', ')})${projects} are valid in ${coursesDir}`);
