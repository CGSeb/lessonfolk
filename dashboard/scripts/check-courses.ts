/**
 * Validate every language under courses/ and the practice projects under projects/ (or the
 * directories given as arguments; without a projects directory, the `projects/` folder next to
 * the courses directory).
 * Usage: npm run check:courses [-- <courses-dir> [<projects-dir>]]
 * Exits with code 1 and one line per problem when content is invalid.
 * Drift from the writing guidelines is printed as warnings and does not fail.
 */
import { dirname, join, resolve } from 'node:path';
import {
  formatCourseIssues,
  getCoursesDir,
  getProjectsDir,
  inspectAllCourses,
  listLanguages,
  listProjectLanguages,
} from '@lessonfolk/core';

const at = (arg: string) => resolve(process.env.INIT_CWD ?? process.cwd(), arg);
const [coursesArg, projectsArg] = process.argv.slice(2);
const coursesDir = coursesArg ? at(coursesArg) : getCoursesDir();
const projectsDir = projectsArg ? at(projectsArg) : coursesArg ? join(dirname(coursesDir), 'projects') : getProjectsDir();
// Paths are shown from the folder that holds courses/ (the repository root by default).
const shownFrom = dirname(coursesDir);
const { issues, warnings } = inspectAllCourses(coursesDir, projectsDir);

if (warnings.length) {
  console.warn(
    `⚠ ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:\n` + formatCourseIssues(warnings, shownFrom),
  );
}

if (issues.length) {
  console.error(
    `✖ ${issues.length} problem${issues.length === 1 ? '' : 's'}:\n` + formatCourseIssues(issues, shownFrom),
  );
  process.exit(1);
}
const projectLangs = listProjectLanguages(projectsDir);
const projects = projectLangs.length ? ` and projects (${projectLangs.join(', ')}) in ${projectsDir}` : '';
console.log(`✔ Valid: courses (${listLanguages(coursesDir).join(', ')}) in ${coursesDir}${projects}`);
