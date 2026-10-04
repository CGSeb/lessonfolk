/**
 * Validate every language under courses/ (or the directory given as argument).
 * Usage: npm run check:courses [-- <courses-dir>]
 * Exits with code 1 and one line per problem when content is invalid.
 * Drift from the writing guidelines is printed as warnings and does not fail.
 */
import { resolve } from 'node:path';
import { formatCourseIssues, inspectAllCourses, listLanguages } from '../src/lib/courses.ts';
import { getPaths } from '../src/lib/paths.ts';

const arg = process.argv[2];
const coursesDir = arg ? resolve(process.env.INIT_CWD ?? process.cwd(), arg) : getPaths().courses;
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
console.log(`✔ Courses are valid (${listLanguages(coursesDir).join(', ')}) in ${coursesDir}`);
