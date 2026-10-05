import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { checkLessonBody } from './lesson-body.ts';
import { getPaths } from './paths.ts';
import {
  authorsSchema,
  courseFileSchema,
  formatIssues,
  indexSchema,
  lessonFrontmatterSchema,
  themesSchema,
  type Level,
} from './schemas.ts';

export type { Level } from './schemas.ts';

export interface Lesson {
  /** `<course-id>/<file name without .md>` */
  id: string;
  title: string;
  level: Level;
  estimatedMinutes: number;
  objectives: string[];
  /** Lesson ids; `[]` when absent. */
  prerequisites: string[];
  /** Absolute path of the lesson Markdown file. */
  file: string;
}

export interface Course {
  id: string;
  title: string;
  level: Level;
  description: string;
  /** Theme id from `themes.yaml`. */
  theme: string;
  /** Author slugs from `courses/authors.yaml`, in `course.yaml` order. */
  authors: string[];
  estimatedHours: number;
  /** Course ids; `[]` when absent. */
  prerequisites: string[];
  /** Lessons in `course.yaml` order. */
  lessons: Lesson[];
}

export interface Theme {
  id: string;
  title: string;
  description: string;
  /** Courses of this theme in `index.yaml` order; may be empty. */
  courses: Course[];
}

export interface Author {
  /** Kebab-case id, used in `course.yaml` and in the author page URL. */
  slug: string;
  name: string;
  bio?: string;
  /** GitHub username. */
  github?: string;
  /** Personal website (http or https). */
  url?: string;
  /** Courses of this author in `index.yaml` order; may be empty. */
  courses: Course[];
}

export interface Catalog {
  lang: string;
  /** Courses in `index.yaml` order. */
  courses: Course[];
  /** Themes in `themes.yaml` order, each with its courses. */
  themes: Theme[];
  /** Authors in `authors.yaml` order, each with its courses in this language. */
  authors: Author[];
}

export interface CourseIssue {
  /** File the problem was found in. */
  file: string;
  message: string;
}

/** Thrown when course content is missing, malformed or inconsistent. */
export class CourseValidationError extends Error {
  readonly issues: CourseIssue[];
  constructor(issues: CourseIssue[], root?: string) {
    super(
      `Invalid course content (${issues.length} problem${issues.length === 1 ? '' : 's'}):\n` +
        formatCourseIssues(issues, root),
    );
    this.name = 'CourseValidationError';
    this.issues = issues;
  }
}

/** One `file: message` line per issue; paths shown relative to `root` when given. */
export function formatCourseIssues(issues: CourseIssue[], root?: string): string {
  return issues
    .map(({ file, message }) => {
      const shown = root ? (relative(root, file) || file).replaceAll('\\', '/') : file;
      return `  ${shown}: ${message}`;
    })
    .join('\n');
}

const FRONTMATTER = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

function readYaml(file: string, issues: CourseIssue[]): unknown {
  try {
    return parseYaml(readFileSync(file, 'utf8'));
  } catch (err) {
    issues.push({ file, message: `cannot parse YAML: ${(err as Error).message.split('\n')[0]}` });
    return undefined;
  }
}

/** Frontmatter data and the Markdown body that follows it. */
function readLessonFile(file: string, issues: CourseIssue[]): { front: unknown; body: string } {
  const text = readFileSync(file, 'utf8');
  const match = FRONTMATTER.exec(text);
  if (!match) {
    issues.push({ file, message: 'missing YAML frontmatter (--- … ---) at the top of the file' });
    return { front: undefined, body: text };
  }
  const body = text.slice(match[0].length);
  try {
    return { front: parseYaml(match[1]), body };
  } catch (err) {
    issues.push({
      file,
      message: `cannot parse frontmatter: ${(err as Error).message.split('\n')[0]}`,
    });
    return { front: undefined, body };
  }
}

function validate<S extends z.ZodType>(
  schema: S,
  data: unknown,
  file: string,
  issues: CourseIssue[],
): z.output<S> | undefined {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const message of formatIssues(result.error)) issues.push({ file, message });
  return undefined;
}

function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/**
 * Load and check one language. Never throws for content problems: they are
 * returned in `issues` and the catalog contains whatever could be loaded.
 * `warnings` lists drift from the writing guidelines; it never blocks loading.
 */
export function inspectCatalog(
  lang = 'en',
  coursesDir: string = getPaths().courses,
): { catalog: Catalog; issues: CourseIssue[]; warnings: CourseIssue[] } {
  const issues: CourseIssue[] = [];
  const warnings: CourseIssue[] = [];
  const catalog: Catalog = { lang, courses: [], themes: [], authors: [] };
  const langDir = join(coursesDir, lang);
  const indexFile = join(langDir, 'index.yaml');

  if (!existsSync(indexFile)) {
    issues.push({ file: indexFile, message: `index.yaml not found for language "${lang}"` });
    return { catalog, issues, warnings };
  }
  const index = validate(indexSchema, readYaml(indexFile, issues), indexFile, issues);
  if (!index) return { catalog, issues, warnings };

  const seenCourses = new Set<string>();
  for (const courseId of index.courses) {
    if (seenCourses.has(courseId)) {
      issues.push({ file: indexFile, message: `course "${courseId}" is listed more than once` });
      continue;
    }
    seenCourses.add(courseId);
    const course = loadCourseDir(langDir, courseId, indexFile, issues, warnings);
    if (course) catalog.courses.push(course);
  }

  // Cross-references need the whole catalog.
  const lessonIds = new Set(catalog.courses.flatMap((c) => c.lessons.map((l) => l.id)));
  for (const course of catalog.courses) {
    const courseFile = join(langDir, course.id, 'course.yaml');
    for (const prereq of course.prerequisites) {
      // A course listed in index.yaml that failed to load is already reported.
      if (!seenCourses.has(prereq)) {
        issues.push({
          file: courseFile,
          message: `prerequisite course "${prereq}" is not listed in index.yaml`,
        });
      }
    }
    for (const lesson of course.lessons) {
      for (const prereq of lesson.prerequisites) {
        if (!lessonIds.has(prereq)) {
          issues.push({
            file: lesson.file,
            message: `prerequisite lesson "${prereq}" does not exist`,
          });
        }
      }
    }
  }

  readThemes(langDir, catalog, issues, warnings);
  readAuthors(coursesDir, langDir, catalog, issues);
  return { catalog, issues, warnings };
}

/** `courses/authors.yaml`: one file for every language. */
export function authorsFilePath(coursesDir: string = getPaths().courses): string {
  return join(coursesDir, 'authors.yaml');
}

/** Read `authors.yaml`, check each course's authors and list each author's courses. */
function readAuthors(
  coursesDir: string,
  langDir: string,
  catalog: Catalog,
  issues: CourseIssue[],
): void {
  const authorsFile = authorsFilePath(coursesDir);
  if (!existsSync(authorsFile)) {
    issues.push({ file: authorsFile, message: 'authors.yaml not found' });
    return;
  }
  const file = validate(authorsSchema, readYaml(authorsFile, issues), authorsFile, issues);
  // Without a valid authors.yaml every course would be reported; the file error is enough.
  if (!file) return;

  const authors = new Map<string, Author>();
  for (const entry of file.authors) {
    if (authors.has(entry.slug)) {
      issues.push({ file: authorsFile, message: `author "${entry.slug}" is listed more than once` });
      continue;
    }
    authors.set(entry.slug, { ...entry, courses: [] });
  }
  for (const course of catalog.courses) {
    const courseFile = join(langDir, course.id, 'course.yaml');
    for (const [i, slug] of course.authors.entries()) {
      const author = authors.get(slug);
      if (course.authors.indexOf(slug) !== i) {
        issues.push({ file: courseFile, message: `author "${slug}" is listed more than once` });
      } else if (author) author.courses.push(course);
      else {
        issues.push({ file: courseFile, message: `author "${slug}" is not listed in authors.yaml` });
      }
    }
  }
  catalog.authors = [...authors.values()];
}

/** Read `themes.yaml`, check each course's theme and group the courses by theme. */
function readThemes(
  langDir: string,
  catalog: Catalog,
  issues: CourseIssue[],
  warnings: CourseIssue[],
): void {
  const themesFile = join(langDir, 'themes.yaml');
  if (!existsSync(themesFile)) {
    issues.push({ file: themesFile, message: 'themes.yaml not found' });
    return;
  }
  const file = validate(themesSchema, readYaml(themesFile, issues), themesFile, issues);
  // Without a valid themes.yaml every course would be reported; the file error is enough.
  if (!file) return;

  const themes = new Map<string, Theme>();
  for (const { id, title, description } of file.themes) {
    if (themes.has(id)) {
      issues.push({ file: themesFile, message: `theme "${id}" is listed more than once` });
      continue;
    }
    themes.set(id, { id, title, description, courses: [] });
  }
  for (const course of catalog.courses) {
    const theme = themes.get(course.theme);
    if (theme) theme.courses.push(course);
    else {
      issues.push({
        file: join(langDir, course.id, 'course.yaml'),
        message: `theme "${course.theme}" is not listed in themes.yaml`,
      });
    }
  }
  for (const theme of themes.values()) {
    if (!theme.courses.length) {
      warnings.push({ file: themesFile, message: `theme "${theme.id}" has no course yet` });
    }
  }
  catalog.themes = [...themes.values()];
}

function loadCourseDir(
  langDir: string,
  courseId: string,
  indexFile: string,
  issues: CourseIssue[],
  warnings: CourseIssue[],
): Course | undefined {
  const courseDir = join(langDir, courseId);
  const courseFile = join(courseDir, 'course.yaml');
  if (!existsSync(courseFile)) {
    issues.push({
      file: indexFile,
      message: `course "${courseId}" is listed but ${courseId}/course.yaml does not exist`,
    });
    return undefined;
  }
  const meta = validate(courseFileSchema, readYaml(courseFile, issues), courseFile, issues);
  if (!meta) return undefined;
  if (meta.id !== courseId) {
    issues.push({
      file: courseFile,
      message: `id "${meta.id}" does not match its folder name "${courseId}"`,
    });
  }

  const lessons: Lesson[] = [];
  const seenLessons = new Set<string>();
  for (const lessonId of meta.lessons) {
    if (seenLessons.has(lessonId)) {
      issues.push({ file: courseFile, message: `lesson "${lessonId}" is listed more than once` });
      continue;
    }
    seenLessons.add(lessonId);
    const [prefix, slug] = lessonId.split('/');
    if (prefix !== courseId) {
      issues.push({
        file: courseFile,
        message: `lesson "${lessonId}" must start with the course id "${courseId}/"`,
      });
      continue;
    }
    const lessonFile = join(courseDir, `${slug}.md`);
    if (!existsSync(lessonFile)) {
      issues.push({
        file: courseFile,
        message: `lesson "${lessonId}" is listed but ${slug}.md does not exist`,
      });
      continue;
    }
    const lessonText = readLessonFile(lessonFile, issues);
    const front = validate(lessonFrontmatterSchema, lessonText.front, lessonFile, issues);
    if (!front) continue;
    if (front.id !== lessonId) {
      issues.push({
        file: lessonFile,
        message: `id "${front.id}" does not match its path; expected "${lessonId}"`,
      });
      continue;
    }
    const body = checkLessonBody(lessonText.body, front.estimatedMinutes);
    for (const message of body.errors) issues.push({ file: lessonFile, message });
    for (const message of body.warnings) warnings.push({ file: lessonFile, message });
    lessons.push({ ...front, file: lessonFile });
  }

  // Lesson files present on disk but not listed in course.yaml are likely mistakes.
  for (const name of readdirSync(courseDir)) {
    if (name.endsWith('.md') && !seenLessons.has(`${courseId}/${name.slice(0, -3)}`)) {
      issues.push({
        file: join(courseDir, name),
        message: `lesson file is not listed in ${courseId}/course.yaml`,
      });
    }
  }

  return {
    id: meta.id,
    title: meta.title,
    level: meta.level,
    description: meta.description,
    theme: meta.theme,
    authors: meta.authors,
    estimatedHours: meta.estimatedHours,
    prerequisites: meta.prerequisites,
    lessons,
  };
}

/**
 * Load the courses of a language in `index.yaml` order, with their lessons in
 * `course.yaml` order. Files are read on every call (no caching), so edits show
 * up without a restart. Throws CourseValidationError naming each faulty file.
 */
export function loadCatalog(lang = 'en', coursesDir: string = getPaths().courses): Course[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.courses;
}

/**
 * Load the themes of a language in `themes.yaml` order, each with its courses in
 * `index.yaml` order. Empty themes are included. Throws like `loadCatalog`.
 */
export function loadThemes(lang = 'en', coursesDir: string = getPaths().courses): Theme[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.themes;
}

/**
 * Load the authors in `authors.yaml` order, each with their courses of this
 * language in `index.yaml` order. Authors with no course are included. Throws like `loadCatalog`.
 */
export function loadAuthors(lang = 'en', coursesDir: string = getPaths().courses): Author[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.authors;
}

/** Load one course by id, or `undefined` if it is not in the catalog. */
export function loadCourse(
  courseId: string,
  lang = 'en',
  coursesDir: string = getPaths().courses,
): Course | undefined {
  return loadCatalog(lang, coursesDir).find((c) => c.id === courseId);
}

/** Find a lesson by id across the catalog, with the course it belongs to. */
export function findLesson(
  lessonId: string,
  lang = 'en',
  coursesDir: string = getPaths().courses,
): { course: Course; lesson: Lesson } | undefined {
  for (const course of loadCatalog(lang, coursesDir)) {
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

/** Language codes that have a folder under the courses directory. */
export function listLanguages(coursesDir: string = getPaths().courses): string[] {
  if (!isDir(coursesDir)) return [];
  return readdirSync(coursesDir)
    .filter((name) => isDir(join(coursesDir, name)))
    .sort();
}

/** Check every language; `issues` are errors, `warnings` are drift from the writing guidelines. */
export function inspectAllCourses(coursesDir: string = getPaths().courses): {
  issues: CourseIssue[];
  warnings: CourseIssue[];
} {
  const langs = listLanguages(coursesDir);
  if (!langs.length) {
    return { issues: [{ file: coursesDir, message: 'no language folders found' }], warnings: [] };
  }
  const results = langs.map((lang) => inspectCatalog(lang, coursesDir));
  const warnings = results.flatMap((r) => r.warnings);

  // authors.yaml is shared: an author needs a course in at least one language.
  const authorsFile = authorsFilePath(coursesDir);
  const withCourses = new Set(
    results.flatMap((r) => r.catalog.authors.filter((a) => a.courses.length).map((a) => a.slug)),
  );
  for (const author of results[0].catalog.authors) {
    if (!withCourses.has(author.slug)) {
      warnings.push({ file: authorsFile, message: `author "${author.slug}" has no course yet` });
    }
  }

  return {
    // Each language reads the shared authors.yaml: report its problems once.
    issues: uniqueIssues(results.flatMap((r) => r.issues)),
    warnings,
  };
}

function uniqueIssues(issues: CourseIssue[]): CourseIssue[] {
  const seen = new Set<string>();
  return issues.filter(({ file, message }) => {
    const key = JSON.stringify([file, message]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Validate every language; returns all errors (empty when everything is valid). */
export function validateAllCourses(coursesDir: string = getPaths().courses): CourseIssue[] {
  return inspectAllCourses(coursesDir).issues;
}
