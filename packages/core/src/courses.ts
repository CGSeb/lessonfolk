import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import { checkLessonBody } from './lesson-body.ts';
import { getCoursesDir } from './paths.ts';
import {
  authorsSchema,
  courseFileSchema,
  courseTranslationSchema,
  formatIssues,
  indexSchema,
  lessonFrontmatterSchema,
  lessonTranslationSchema,
  themesSchema,
  type Level,
} from './schemas.ts';

export type { Level } from './schemas.ts';

/**
 * The language courses are written in. A translation (`courses/<lang>/`) only holds the
 * translated files; anything it lacks is read from this language.
 */
export const DEFAULT_LANG = 'en';

/** Names a learner may give for a course language (lower case, without accents). */
const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  english: 'en',
  anglais: 'en',
  french: 'fr',
  francais: 'fr',
};

/**
 * The language code of a profile's `language`: a code ("fr", "fr-FR") or a language name
 * ("French", "Français"). `undefined` when it is empty or not recognised.
 */
export function languageCode(language: unknown): string | undefined {
  if (typeof language !== 'string') return undefined;
  const value = language.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const name = LANGUAGE_NAMES[value.split(/[^a-z]/)[0] ?? ''];
  if (name) return name;
  return /^([a-z]{2,3})(?:[-_][a-z0-9]{2,8})*$/.exec(value)?.[1];
}

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
  /** Language of `file`, title and objectives: the catalog's, or `DEFAULT_LANG` when not translated. */
  lang: string;
  /** Number of "Check your understanding" questions: the tutor records a verdict on each before completing. */
  checks: number;
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
  /** Language of the title and description: the catalog's, or `DEFAULT_LANG` when not translated. */
  lang: string;
}

export interface Theme {
  id: string;
  title: string;
  description: string;
  /** 0-based position in `themes.yaml` (duplicates left out); the dashboard picks the theme colour from it. */
  position: number;
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
  /** Avatar image file name in `courses/authors/`; left out when the file is missing or too large. */
  avatar?: string;
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

type Inspection = { catalog: Catalog; issues: CourseIssue[]; warnings: CourseIssue[] };

/**
 * Load and check the catalog in one language. Never throws for content problems: they are
 * returned in `issues` and the catalog contains whatever could be loaded.
 * `warnings` lists drift from the writing guidelines; it never blocks loading.
 *
 * The courses, their order and their lessons always come from `DEFAULT_LANG`. Another
 * language replaces the text of whatever `courses/<lang>/` translates (theme, course and
 * lesson files) and keeps the English text for the rest, so a partial translation works.
 */
export function inspectCatalog(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): Inspection {
  const base = inspectBaseCatalog(coursesDir);
  if (lang === DEFAULT_LANG) return base;
  const translation = translateCatalog(base.catalog, lang, coursesDir);
  return {
    catalog: translation.catalog,
    issues: [...base.issues, ...translation.issues],
    warnings: [...base.warnings, ...translation.warnings],
  };
}

/** The catalog of `DEFAULT_LANG`: the course structure every language shares. */
function inspectBaseCatalog(coursesDir: string): Inspection {
  const lang = DEFAULT_LANG;
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

/** Language folder names: an ISO 639-1 code, optionally with a region (`pt-br`). */
const LANG_FOLDER = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

/**
 * Replace the text of `base` with what `courses/<lang>/` translates. Only reports problems
 * of the translation's own files; a file that cannot be used keeps the English text.
 */
function translateCatalog(base: Catalog, lang: string, coursesDir: string): Inspection {
  const issues: CourseIssue[] = [];
  const warnings: CourseIssue[] = [];
  const langDir = join(coursesDir, lang);
  if (!LANG_FOLDER.test(lang) || !isDir(langDir)) {
    return { catalog: { ...base, lang }, issues, warnings };
  }

  const indexFile = join(langDir, 'index.yaml');
  if (existsSync(indexFile)) {
    warnings.push({
      file: indexFile,
      message: `not used: the courses and their order come from ${DEFAULT_LANG}/index.yaml`,
    });
  }

  const themeText = new Map<string, { title: string; description: string }>();
  const themesFile = join(langDir, 'themes.yaml');
  if (existsSync(themesFile)) {
    const file = validate(themesSchema, readYaml(themesFile, issues), themesFile, issues);
    for (const { id, title, description } of file?.themes ?? []) {
      if (base.themes.some((theme) => theme.id === id)) themeText.set(id, { title, description });
      else issues.push({ file: themesFile, message: `theme "${id}" is not in ${DEFAULT_LANG}/themes.yaml` });
    }
  }

  const known = new Set(base.courses.map((course) => course.id));
  for (const name of readdirSync(langDir)) {
    if (isDir(join(langDir, name)) && !known.has(name)) {
      issues.push({
        file: join(langDir, name),
        message: `course "${name}" is not in ${DEFAULT_LANG}/index.yaml: translate an existing course`,
      });
    }
  }

  const courses = base.courses.map((course) => translateCourse(course, langDir, lang, issues, warnings));
  const byId = new Map(courses.map((course) => [course.id, course]));
  const swap = (list: Course[]) => list.map((course) => byId.get(course.id) ?? course);
  return {
    catalog: {
      lang,
      courses,
      themes: base.themes.map((theme) => ({ ...theme, ...themeText.get(theme.id), courses: swap(theme.courses) })),
      authors: base.authors.map((author) => ({ ...author, courses: swap(author.courses) })),
    },
    issues,
    warnings,
  };
}

/** One course with the text of its translated `course.yaml` and lesson files, when present. */
function translateCourse(
  course: Course,
  langDir: string,
  lang: string,
  issues: CourseIssue[],
  warnings: CourseIssue[],
): Course {
  const courseDir = join(langDir, course.id);
  if (!isDir(courseDir)) return course;
  let translated: Course = course;

  const courseFile = join(courseDir, 'course.yaml');
  if (existsSync(courseFile)) {
    const meta = validate(courseTranslationSchema, readYaml(courseFile, issues), courseFile, issues);
    if (meta && meta.id !== course.id) {
      issues.push({ file: courseFile, message: `id "${meta.id}" does not match its folder name "${course.id}"` });
    } else if (meta) {
      translated = { ...course, title: meta.title, description: meta.description, lang };
    }
  }

  const slugs = new Set<string>();
  const lessons = course.lessons.map((lesson) => {
    const slug = lesson.id.slice(course.id.length + 1);
    slugs.add(slug);
    const file = join(courseDir, `${slug}.md`);
    if (!existsSync(file)) return lesson;
    const text = readLessonFile(file, issues);
    const front = validate(lessonTranslationSchema, text.front, file, issues);
    if (!front) return lesson;
    if (front.id !== lesson.id) {
      issues.push({ file, message: `id "${front.id}" does not match its path; expected "${lesson.id}"` });
      return lesson;
    }
    const body = checkLessonBody(text.body, lesson.estimatedMinutes);
    for (const message of body.errors) issues.push({ file, message });
    for (const message of body.warnings) warnings.push({ file, message });
    if (body.errors.length) return lesson;
    if (body.checks !== lesson.checks) {
      issues.push({
        file,
        message: `"## Check your understanding" has ${body.checks} questions, but the ${DEFAULT_LANG} lesson has ${lesson.checks}: keep the same questions in the same order`,
      });
      return lesson;
    }
    return { ...lesson, title: front.title, objectives: front.objectives ?? lesson.objectives, file, lang };
  });

  for (const name of readdirSync(courseDir)) {
    if (name.endsWith('.md') && !slugs.has(name.slice(0, -3))) {
      issues.push({
        file: join(courseDir, name),
        message: `lesson file is not listed in ${DEFAULT_LANG}/${course.id}/course.yaml`,
      });
    }
  }
  return { ...translated, lessons };
}

/** Folder of author avatar images, next to `authors.yaml`; never a language. */
export const AUTHORS_DIR = 'authors';
/** Largest avatar image accepted, so a huge file never slows the dashboard down. */
export const MAX_AVATAR_BYTES = 512 * 1024;

/** Absolute path of an author's avatar image (`avatar` from `authors.yaml`). */
export function authorAvatarPath(avatar: string, coursesDir: string = getCoursesDir()): string {
  return join(coursesDir, AUTHORS_DIR, avatar);
}

/** `courses/authors.yaml`: one file for every language. */
export function authorsFilePath(coursesDir: string = getCoursesDir()): string {
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
    const avatar = entry.avatar ? checkAvatar(entry.slug, entry.avatar, coursesDir, authorsFile, issues) : undefined;
    authors.set(entry.slug, { ...entry, avatar, courses: [] });
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

/** The avatar file name when its image exists and is small enough; otherwise reports it. */
function checkAvatar(
  slug: string,
  avatar: string,
  coursesDir: string,
  authorsFile: string,
  issues: CourseIssue[],
): string | undefined {
  const file = authorAvatarPath(avatar, coursesDir);
  const stats = existsSync(file) ? statSync(file) : undefined;
  if (!stats?.isFile()) {
    issues.push({ file: authorsFile, message: `author "${slug}": avatar "${avatar}" not found in ${AUTHORS_DIR}/` });
    return undefined;
  }
  if (stats.size > MAX_AVATAR_BYTES) {
    issues.push({
      file: authorsFile,
      message: `author "${slug}": avatar "${avatar}" is larger than ${MAX_AVATAR_BYTES / 1024} KB`,
    });
    return undefined;
  }
  return avatar;
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
    themes.set(id, { id, title, description, position: themes.size, courses: [] });
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

/**
 * How far `estimatedHours` may be from the sum of the lessons' `estimatedMinutes`:
 * a quarter of an hour, so a total rounded to the nearest half hour never warns.
 */
export const HOURS_TOLERANCE_MINUTES = 15;

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
    lessons.push({ ...front, file: lessonFile, lang: DEFAULT_LANG, checks: body.checks });
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

  // Only when every listed lesson loaded: a partial sum would be misleading.
  if (lessons.length === meta.lessons.length) {
    const minutes = lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);
    if (Math.abs(meta.estimatedHours * 60 - minutes) > HOURS_TOLERANCE_MINUTES) {
      const hours = Math.max(0.5, Math.round(minutes / 30) / 2);
      warnings.push({
        file: courseFile,
        message:
          `estimatedHours is ${meta.estimatedHours}, but its lessons add up to ${minutes} minutes ` +
          `(about ${hours} hour${hours === 1 ? '' : 's'})`,
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
    lang: DEFAULT_LANG,
  };
}

/**
 * Load the courses of a language in `index.yaml` order, with their lessons in
 * `course.yaml` order. Files are read on every call (no caching), so edits show
 * up without a restart. Throws CourseValidationError naming each faulty file.
 */
export function loadCatalog(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): Course[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.courses;
}

/**
 * Load the themes of a language in `themes.yaml` order, each with its courses in
 * `index.yaml` order. Empty themes are included. Throws like `loadCatalog`.
 */
export function loadThemes(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): Theme[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.themes;
}

/**
 * Load the authors in `authors.yaml` order, each with their courses of this
 * language in `index.yaml` order. Authors with no course are included. Throws like `loadCatalog`.
 */
export function loadAuthors(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): Author[] {
  const { catalog, issues } = inspectCatalog(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return catalog.authors;
}

/** Load one course by id, or `undefined` if it is not in the catalog. */
export function loadCourse(
  courseId: string,
  lang = DEFAULT_LANG,
  coursesDir: string = getCoursesDir(),
): Course | undefined {
  return loadCatalog(lang, coursesDir).find((c) => c.id === courseId);
}

/** Find a lesson by id across the catalog, with the course it belongs to. */
export function findLesson(
  lessonId: string,
  lang = DEFAULT_LANG,
  coursesDir: string = getCoursesDir(),
): { course: Course; lesson: Lesson } | undefined {
  for (const course of loadCatalog(lang, coursesDir)) {
    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, lesson };
  }
  return undefined;
}

/** Language codes that have a folder under the courses directory. */
export function listLanguages(coursesDir: string = getCoursesDir()): string[] {
  if (!isDir(coursesDir)) return [];
  return readdirSync(coursesDir)
    .filter((name) => name !== AUTHORS_DIR && isDir(join(coursesDir, name)))
    .sort();
}

/** Check every language; `issues` are errors, `warnings` are drift from the writing guidelines. */
export function inspectAllCourses(coursesDir: string = getCoursesDir()): {
  issues: CourseIssue[];
  warnings: CourseIssue[];
} {
  const langs = listLanguages(coursesDir);
  if (!langs.length) {
    return { issues: [{ file: coursesDir, message: 'no language folders found' }], warnings: [] };
  }
  if (!langs.includes(DEFAULT_LANG)) {
    return {
      issues: [{ file: join(coursesDir, DEFAULT_LANG), message: `the "${DEFAULT_LANG}" courses are missing: every translation is based on them` }],
      warnings: [],
    };
  }
  // Translations only report their own files: the English courses are checked once.
  const base = inspectBaseCatalog(coursesDir);
  const results = [
    base,
    ...langs
      .filter((lang) => lang !== DEFAULT_LANG)
      .map((lang) => translateCatalog(base.catalog, lang, coursesDir)),
  ];
  const warnings = results.flatMap((r) => r.warnings);

  // authors.yaml is shared: an author needs a course in at least one language.
  const authorsFile = authorsFilePath(coursesDir);
  const withCourses = new Set(
    results.flatMap((r) => r.catalog.authors.filter((a) => a.courses.length).map((a) => a.slug)),
  );
  for (const author of base.catalog.authors) {
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
export function validateAllCourses(coursesDir: string = getCoursesDir()): CourseIssue[] {
  return inspectAllCourses(coursesDir).issues;
}
