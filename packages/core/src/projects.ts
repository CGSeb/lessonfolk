import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isDir, readMarkdownFile, readYaml, validate, type ContentIssue } from './content-files.ts';
import {
  CourseValidationError,
  DEFAULT_LANG,
  inspectCatalog,
  PROJECTS_DIR,
  type Catalog,
} from './courses.ts';
import { getCoursesDir } from './paths.ts';
import { checkProjectBody, parseProjectContent, type ProjectContent } from './project-body.ts';
import {
  projectFrontmatterSchema,
  projectIndexSchema,
  projectTranslationSchema,
  type Level,
} from './schemas.ts';

/**
 * Practice projects: a real result for the learner to reach, in milestones, with the tutor as
 * a coach. They live in `<coursesDir>/projects/<lang>/<project-id>.md`, ordered by
 * `projects/en/index.yaml`, and use the themes, authors and courses of the course catalog.
 * See docs/project-format.md.
 */
export interface Project {
  id: string;
  title: string;
  level: Level;
  /** Theme id from `themes.yaml`. */
  theme: string;
  /** Author slugs from `courses/authors.yaml`. */
  authors: string[];
  description: string;
  estimatedHours: number;
  /** Course ids whose ideas the project puts to work; `[]` when it needs none. */
  buildsOn: string[];
  /** What the learner needs to do the project. */
  needs: string[];
  /** Number of milestones in "## Milestones": the tutor records each one by its number. */
  milestones: number;
  /** Number of numbered criteria in "## Review". */
  reviewCriteria: number;
  /** Absolute path of the project Markdown file. */
  file: string;
  /** Language of `file`, title, description and needs: the requested one, or `DEFAULT_LANG` when not translated. */
  lang: string;
}

type ProjectInspection = { projects: Project[]; issues: ContentIssue[]; warnings: ContentIssue[] };

/** `<coursesDir>/projects/`. */
export function projectsDirPath(coursesDir: string = getCoursesDir()): string {
  return join(coursesDir, PROJECTS_DIR);
}

/** Language folder names: an ISO 639-1 code, optionally with a region (`pt-br`). */
const LANG_FOLDER = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/;

/**
 * The English projects, checked against `catalog` (the English course catalog) for their
 * theme, authors and the courses they build on. No `projects/` folder means no projects.
 */
export function inspectBaseProjects(catalog: Catalog, coursesDir: string): ProjectInspection {
  const issues: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const projects: Project[] = [];
  const projectsDir = projectsDirPath(coursesDir);
  if (!isDir(projectsDir)) return { projects, issues, warnings };

  const langDir = join(projectsDir, DEFAULT_LANG);
  const indexFile = join(langDir, 'index.yaml');
  if (!existsSync(indexFile)) {
    issues.push({ file: indexFile, message: `index.yaml not found: projects are listed in ${PROJECTS_DIR}/${DEFAULT_LANG}/index.yaml` });
    return { projects, issues, warnings };
  }
  const index = validate(projectIndexSchema, readYaml(indexFile, issues), indexFile, issues);
  if (!index) return { projects, issues, warnings };

  const themes = new Set(catalog.themes.map((theme) => theme.id));
  const authors = new Set(catalog.authors.map((author) => author.slug));
  const courses = new Set(catalog.courses.map((course) => course.id));

  const seen = new Set<string>();
  for (const id of index.projects) {
    if (seen.has(id)) {
      issues.push({ file: indexFile, message: `project "${id}" is listed more than once` });
      continue;
    }
    seen.add(id);
    const file = join(langDir, `${id}.md`);
    if (!existsSync(file)) {
      issues.push({ file: indexFile, message: `project "${id}" is listed but ${id}.md does not exist` });
      continue;
    }
    const text = readMarkdownFile(file, issues);
    const front = validate(projectFrontmatterSchema, text.front, file, issues);
    if (!front) continue;
    if (front.id !== id) {
      issues.push({ file, message: `id "${front.id}" does not match its file name "${id}"` });
      continue;
    }
    // An empty set means themes.yaml or authors.yaml failed to load: that file is already reported.
    if (themes.size && !themes.has(front.theme)) {
      issues.push({ file, message: `theme "${front.theme}" is not listed in themes.yaml` });
    }
    for (const [i, slug] of front.authors.entries()) {
      if (front.authors.indexOf(slug) !== i) {
        issues.push({ file, message: `author "${slug}" is listed more than once` });
      } else if (authors.size && !authors.has(slug)) {
        issues.push({ file, message: `author "${slug}" is not listed in authors.yaml` });
      }
    }
    for (const course of front.buildsOn) {
      if (!courses.has(course)) {
        issues.push({ file, message: `buildsOn course "${course}" is not listed in index.yaml` });
      }
    }
    const body = checkProjectBody(text.body, front.estimatedHours);
    for (const message of body.errors) issues.push({ file, message });
    for (const message of body.warnings) warnings.push({ file, message });
    if (body.errors.length) continue;
    projects.push({
      ...front,
      milestones: body.milestones,
      reviewCriteria: body.reviewCriteria,
      file,
      lang: DEFAULT_LANG,
    });
  }

  for (const name of readdirSync(langDir)) {
    if (name.endsWith('.md') && !seen.has(name.slice(0, -3))) {
      issues.push({ file: join(langDir, name), message: `project file is not listed in ${PROJECTS_DIR}/${DEFAULT_LANG}/index.yaml` });
    }
  }
  return { projects, issues, warnings };
}

/**
 * Replace the text of `base` with what `projects/<lang>/` translates. Only reports problems of
 * the translation's own files; a file that cannot be used keeps the English text.
 */
export function translateProjects(base: Project[], lang: string, coursesDir: string): ProjectInspection {
  const issues: ContentIssue[] = [];
  const warnings: ContentIssue[] = [];
  const langDir = join(projectsDirPath(coursesDir), lang);
  if (!isDir(langDir)) return { projects: base, issues, warnings };
  if (!LANG_FOLDER.test(lang)) {
    issues.push({ file: langDir, message: `"${lang}" is not a language code: ${PROJECTS_DIR}/ holds one folder per language` });
    return { projects: base, issues, warnings };
  }

  const indexFile = join(langDir, 'index.yaml');
  if (existsSync(indexFile)) {
    warnings.push({
      file: indexFile,
      message: `not used: the projects and their order come from ${PROJECTS_DIR}/${DEFAULT_LANG}/index.yaml`,
    });
  }

  const known = new Set(base.map((project) => project.id));
  for (const name of readdirSync(langDir)) {
    if (name.endsWith('.md') && !known.has(name.slice(0, -3))) {
      issues.push({
        file: join(langDir, name),
        message: `project "${name.slice(0, -3)}" is not in ${PROJECTS_DIR}/${DEFAULT_LANG}/index.yaml: translate an existing project`,
      });
    }
  }

  const projects = base.map((project) => {
    const file = join(langDir, `${project.id}.md`);
    if (!existsSync(file)) return project;
    const text = readMarkdownFile(file, issues);
    const front = validate(projectTranslationSchema, text.front, file, issues);
    if (!front) return project;
    if (front.id !== project.id) {
      issues.push({ file, message: `id "${front.id}" does not match its file name "${project.id}"` });
      return project;
    }
    const body = checkProjectBody(text.body, project.estimatedHours);
    for (const message of body.errors) issues.push({ file, message });
    if (body.errors.length) return project;
    const mismatch = [
      ['"## Milestones"', 'milestone', 'milestones', body.milestones, project.milestones],
      ['"## Review"', 'criterion', 'criteria', body.reviewCriteria, project.reviewCriteria],
    ] as const;
    let same = true;
    for (const [section, one, many, translated, english] of mismatch) {
      if (translated !== english) {
        same = false;
        issues.push({
          file,
          message: `${section} has ${translated} ${translated === 1 ? one : many}, but the ${DEFAULT_LANG} project has ${english}: keep the same ${many} in the same order`,
        });
      }
    }
    if (!same) return project;
    return {
      ...project,
      title: front.title,
      description: front.description,
      needs: front.needs ?? project.needs,
      file,
      lang,
    };
  });
  return { projects, issues, warnings };
}

/**
 * Load and check the projects in one language. Never throws for content problems: they are
 * returned in `issues` (with the course catalog's own) and `projects` holds what could be loaded.
 */
export function inspectProjects(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): ProjectInspection {
  const catalog = inspectCatalog(DEFAULT_LANG, coursesDir);
  const base = inspectBaseProjects(catalog.catalog, coursesDir);
  if (lang === DEFAULT_LANG) return base;
  const translation = translateProjects(base.projects, lang, coursesDir);
  return {
    projects: translation.projects,
    issues: [...base.issues, ...translation.issues],
    warnings: [...base.warnings, ...translation.warnings],
  };
}

/**
 * Load the projects of a language in `projects/en/index.yaml` order. Files are read on every
 * call, like the courses. Throws CourseValidationError naming each faulty file.
 */
export function loadProjects(lang = DEFAULT_LANG, coursesDir: string = getCoursesDir()): Project[] {
  const { projects, issues } = inspectProjects(lang, coursesDir);
  if (issues.length) throw new CourseValidationError(issues, coursesDir);
  return projects;
}

/** Load one project by id, or `undefined` if there is none. */
export function findProject(
  projectId: string,
  lang = DEFAULT_LANG,
  coursesDir: string = getCoursesDir(),
): Project | undefined {
  return loadProjects(lang, coursesDir).find((project) => project.id === projectId);
}

/** The learner-facing content of a project file (brief, milestones, review, going further). */
export function readProjectContent(project: Pick<Project, 'file'>): ProjectContent {
  return parseProjectContent(readMarkdownFile(project.file, []).body);
}
