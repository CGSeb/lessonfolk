/**
 * The LessonFolk MCP server: course and progress tools and course resources for one user.
 *
 * A fresh server is built for every request (stateless serving), bound to the user id the
 * endpoint got from the access token or the auth mode. No tool takes a user id: a client can
 * only ever read and change the progress of the user it signed in as.
 */
import {
  type Progress,
  type ProgressStore,
  type WriteOptions,
  CourseValidationError,
  ProgressStoreError,
  formatCourseIssues,
  nextLesson,
} from '@lessonfolk/core';
import { McpServer, ResourceTemplate, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { DEFAULT_LANG, courseSummary, findLesson, lessonStatus, readCatalog, readCourses, readLessonText } from './catalog.ts';
import type { RateLimiter } from './rate-limit.ts';

export const SERVER_INFO = { name: 'lessonfolk', version: '0.1.0' } as const;

export interface LessonfolkServerOptions {
  /** The user whose progress the tools read and write (from the token or the auth mode). */
  userId: string;
  store: ProgressStore;
  coursesDir: string;
  /** Limits the write tools per user. */
  writeLimiter: RateLimiter;
  /** Kept in the progress change log, e.g. `mcp` or `mcp:<oauth client id>`. */
  client?: string;
}

const INSTRUCTIONS = [
  'LessonFolk teaches AI through a conversation: you are the tutor.',
  'Call get_progress first. If the learner has no profile yet, onboard them (name, experience, goal, interests, language) and save it with set_profile.',
  'To teach: get_next_lesson, then start_lesson, then get_lesson and teach it in small chunks in your own words (never paste the lesson; its "Teaching notes" are for you).',
  'Finish with complete_lesson (score 0-1 and notes on what was easy or hard). Progress is saved only through these tools.',
].join(' ');

const lessonId = z.string().min(1).describe('Lesson id: "<course-id>/<lesson file name>", e.g. "ai-foundations/01-what-is-ai".');
const lang = z.string().min(2).optional().describe('Course language code (default "en"); falls back to "en" when there is no translation.');

const json = (value: unknown) => JSON.stringify(value, null, 2);
const ok = (text: string): CallToolResult => ({ content: [{ type: 'text', text }] });
const fail = (text: string): CallToolResult => ({ content: [{ type: 'text', text }], isError: true });

/** A store or course error as a sentence the AI can act on. */
export function describeError(error: unknown): string {
  if (error instanceof ProgressStoreError) {
    const lines = [`${error.message} (${error.code})`];
    const { missing, issues, problems } = error.details;
    if (missing?.length) lines.push(`Unfinished prerequisites: ${missing.join(', ')}.`);
    for (const issue of issues ?? []) {
      lines.push(
        'prerequisiteId' in issue
          ? `${issue.code}: ${issue.courseId} needs ${issue.prerequisiteId}`
          : `${issue.code}: ${issue.courseId}`,
      );
    }
    for (const problem of problems ?? []) lines.push(problem);
    return lines.join('\n');
  }
  if (error instanceof CourseValidationError) {
    return `The course files on the server have problems, so this cannot be done right now:\n${formatCourseIssues(error.issues)}`;
  }
  return 'Something went wrong on the LessonFolk server. Try again later.';
}

function report(error: unknown): CallToolResult {
  if (!(error instanceof ProgressStoreError) && !(error instanceof CourseValidationError)) {
    console.error('LessonFolk MCP tool failed:', error);
  }
  return fail(describeError(error));
}

export function createLessonfolkServer({ userId, store, coursesDir, writeLimiter, client = 'mcp' }: LessonfolkServerOptions): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  const writeOptions: WriteOptions = { client };

  const read = async (run: () => Promise<unknown> | unknown): Promise<CallToolResult> => {
    try {
      const value = await run();
      return ok(typeof value === 'string' ? value : json(value));
    } catch (error) {
      return report(error);
    }
  };

  /** A write: rate-limited, then the store applies the tutor rules and returns the new progress. */
  const write = async (done: string, run: () => Promise<Progress>): Promise<CallToolResult> => {
    const wait = writeLimiter.take(userId);
    if (wait) return fail(`Too many changes in a short time: wait ${wait} seconds, then try again. Nothing was saved.`);
    try {
      const progress = await run();
      return ok(`${done}\n\nProgress now:\n${json(progress)}`);
    } catch (error) {
      return report(error);
    }
  };

  const readOnly = { readOnlyHint: true, openWorldHint: false } as const;
  const writes = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;

  // --- Read tools ---------------------------------------------------------------

  server.registerTool(
    'get_progress',
    {
      title: 'Get progress',
      description:
        "The learner's saved progress (progress.json v1 shape): profile (name, experience, goal, language, level, interests), " +
        'path with its reason, current lesson, and every started lesson with status, dates, score and notes. ' +
        'Empty profile and lessons mean a new learner: start with onboarding. Call this first in every session.',
      annotations: readOnly,
    },
    () => read(() => store.getProgress(userId)),
  );

  server.registerTool(
    'get_next_lesson',
    {
      title: 'Get next lesson',
      description:
        'The lesson to teach now, by the LessonFolk rules: the current lesson if unfinished ("resume"), otherwise the first unfinished lesson ' +
        'whose prerequisites are done or skipped, following the learner\'s path first ("next"). "all_done" means every lesson is finished; ' +
        '"blocked" means none is available. unknownPathIds lists path courses that no longer exist (tell the learner). ' +
        'Does not change anything: call start_lesson to begin it.',
      annotations: readOnly,
    },
    () =>
      read(async () => {
        const progress = await store.getProgress(userId);
        const courses = readCourses(coursesDir);
        const next = nextLesson(progress, courses);
        if (next.kind === 'all_done' || next.kind === 'blocked') return next;
        return {
          kind: next.kind,
          lessonId: next.lesson.id,
          lessonTitle: next.lesson.title,
          courseId: next.course.id,
          courseTitle: next.course.title,
          status: lessonStatus(progress, next.lesson.id),
          unknownPathIds: next.unknownPathIds,
        };
      }),
  );

  server.registerTool(
    'get_lesson',
    {
      title: 'Get lesson',
      description:
        'The full lesson file: frontmatter, content, key ideas, teaching notes (for you, the tutor, never to paste), ' +
        '"Check your understanding" questions with good-answer hints, exercise and completion criteria. ' +
        "Starts with a short header giving the course and the learner's status for this lesson. Read it in full before teaching.",
      inputSchema: z.object({ lessonId, lang }),
      annotations: readOnly,
    },
    ({ lessonId: id, lang: language }) =>
      read(async () => {
        const catalog = readCatalog(coursesDir, language);
        const found = findLesson(catalog, id);
        if (!found) throw new ProgressStoreError('unknown_lesson', `Unknown lesson "${id}". Use list_courses to see the lesson ids.`, { lessonId: id });
        const progress = await store.getProgress(userId);
        const header = `<!-- LessonFolk: lesson ${found.lesson.id} of course "${found.course.title}" (${found.course.id}), language ${catalog.lang}; learner status: ${lessonStatus(progress, id)} -->`;
        return `${header}\n${readLessonText(found.lesson)}`;
      }),
  );

  server.registerTool(
    'list_courses',
    {
      title: 'List courses',
      description:
        'The courses in the recommended order (index.yaml), each with level, theme, description, prerequisites and lessons (ids, titles, minutes), ' +
        "plus the learner's status for each course and lesson (not_started, in_progress, done, skipped, skipped_after_level_check). " +
        'Give a theme id to list only that theme (see list_themes).',
      inputSchema: z.object({ theme: z.string().min(1).optional().describe('Theme id, e.g. "foundations".'), lang }),
      annotations: readOnly,
    },
    ({ theme, lang: language }) =>
      read(async () => {
        const catalog = readCatalog(coursesDir, language);
        const progress = await store.getProgress(userId);
        if (theme && !catalog.themes.some((t) => t.id === theme)) {
          throw new ProgressStoreError('unknown_course', `Unknown theme "${theme}". Themes: ${catalog.themes.map((t) => t.id).join(', ')}.`);
        }
        return catalog.courses.filter((c) => !theme || c.theme === theme).map((course) => courseSummary(catalog, course, progress));
      }),
  );

  server.registerTool(
    'list_themes',
    {
      title: 'List themes',
      description:
        'The themes that group courses, in order (themes.yaml): id, title, description and their course ids. ' +
        'A theme with no course yet is "coming soon". Use the ids for the profile interests and list_courses.',
      inputSchema: z.object({ lang }),
      annotations: readOnly,
    },
    ({ lang: language }) =>
      read(() =>
        readCatalog(coursesDir, language).themes.map((theme) => ({
          id: theme.id,
          title: theme.title,
          description: theme.description,
          courseIds: theme.courses.map((c) => c.id),
          comingSoon: theme.courses.length === 0,
        })),
      ),
  );

  // --- Write tools --------------------------------------------------------------

  const nullableText = z.string().min(1).nullable().optional();
  server.registerTool(
    'set_profile',
    {
      title: 'Set profile',
      description:
        "Change the learner's profile. Each field given replaces the saved one, null removes it, fields left out are kept. " +
        'level must be beginner, intermediate or advanced (from the experience answer: none / used ChatGPT-like tools -> beginner; ' +
        'some technical / developer -> intermediate; ML practitioner -> advanced). interests are theme ids from list_themes.',
      inputSchema: z.object({
        name: nullableText,
        experience: nullableText,
        goal: nullableText,
        language: nullableText.describe('Preferred language for the sessions, e.g. "English".'),
        level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
        interests: z.array(z.string().min(1)).nullable().optional().describe('Theme ids.'),
      }),
      annotations: writes,
    },
    (profile) => write('Profile saved.', () => store.setProfile(userId, profile, writeOptions)),
  );

  server.registerTool(
    'set_path',
    {
      title: 'Set path',
      description:
        'Save the learning path the learner agreed to: course ids in order, with the reason (2-3 sentences for the learner). ' +
        'Only call it after the learner agrees. Every course must come after its prerequisites, and an unfinished prerequisite may not be dropped.',
      inputSchema: z.object({
        path: z.array(z.string().min(1)).describe('Course ids, in order.'),
        reason: z.string().min(1).describe('Why this path, in 2-3 sentences for the learner.'),
      }),
      annotations: writes,
    },
    ({ path, reason }) => write('Path saved.', () => store.setPath(userId, path, reason, writeOptions)),
  );

  server.registerTool(
    'start_lesson',
    {
      title: 'Start lesson',
      description:
        'Start (or resume) a lesson: it becomes the current lesson, status in_progress. Fails if its prerequisites are not done or skipped, ' +
        'or if it is already done or skipped. Usually the lesson from get_next_lesson.',
      inputSchema: z.object({ lessonId }),
      annotations: writes,
    },
    ({ lessonId: id }) => write(`Lesson ${id} started.`, () => store.startLesson(userId, id, writeOptions)),
  );

  server.registerTool(
    'complete_lesson',
    {
      title: 'Complete lesson',
      description:
        'Mark a lesson done once its completion criteria are met: score is your honest estimate from the checks (0 to 1), ' +
        'notes are one or two sentences on what the learner found easy or hard (used for later review). Clears the current lesson.',
      inputSchema: z.object({
        lessonId,
        score: z.number().min(0).max(1).describe('0 to 1.'),
        notes: z.string().min(1).describe('What the learner found easy or hard.'),
      }),
      annotations: writes,
    },
    ({ lessonId: id, score, notes }) => write(`Lesson ${id} completed.`, () => store.completeLesson(userId, id, { score, notes }, writeOptions)),
  );

  server.registerTool(
    'skip_lesson',
    {
      title: 'Skip lesson',
      description:
        'Skip one lesson the learner already knows, after they answered 1-2 of its check questions well. reason is saved as the lesson notes. ' +
        'For the level check use level_check_skip_course instead.',
      inputSchema: z.object({ lessonId, reason: z.string().min(1).describe('Why it was skipped, saved as the notes.') }),
      annotations: writes,
    },
    ({ lessonId: id, reason }) => write(`Lesson ${id} skipped.`, () => store.skipLesson(userId, id, reason, writeOptions)),
  );

  server.registerTool(
    'level_check_skip_course',
    {
      title: 'Skip a course after the level check',
      description:
        'After the level check (intermediate and advanced learners only), mark every unfinished lesson of a course the learner clearly passed ' +
        'as skipped after the level check. Only courses below the learner\'s level can be skipped this way.',
      inputSchema: z.object({ courseId: z.string().min(1).describe('Course id, e.g. "ai-foundations".') }),
      annotations: writes,
    },
    ({ courseId }) => write(`Course ${courseId} skipped after the level check.`, () => store.placementSkip(userId, courseId, writeOptions)),
  );

  server.registerTool(
    'save_lesson_notes',
    {
      title: 'Save lesson notes',
      description:
        'Save short notes on a started lesson, e.g. where you stopped when the session ends mid-lesson. Replaces the previous notes.',
      inputSchema: z.object({ lessonId, notes: z.string().min(1) }),
      annotations: writes,
    },
    ({ lessonId: id, notes }) => write(`Notes saved on ${id}.`, () => store.saveNotes(userId, id, notes, writeOptions)),
  );

  server.registerTool(
    'record_review_score',
    {
      title: 'Record review score',
      description:
        'After a review quiz on a done lesson, record the new score (0 to 1). The saved score only goes up: a lower score is ignored.',
      inputSchema: z.object({ lessonId, score: z.number().min(0).max(1) }),
      annotations: writes,
    },
    ({ lessonId: id, score }) => write(`Review score recorded for ${id}.`, () => store.recordReviewScore(userId, id, score, writeOptions)),
  );

  server.registerTool(
    'import_progress',
    {
      title: 'Import progress',
      description:
        "Replace the learner's whole saved progress with a progress.json file (version 1), e.g. to move local progress to this server. " +
        'Everything saved before is replaced. Ask the learner to confirm first.',
      inputSchema: z.object({
        progress: z
          .union([z.string().min(1), z.record(z.string(), z.unknown())])
          .describe('The progress.json content, as JSON text or as an object.'),
      }),
      annotations: { ...writes, destructiveHint: true },
    },
    ({ progress }) => write('Progress imported.', () => store.importProgress(userId, progress, writeOptions)),
  );

  // --- Resources ----------------------------------------------------------------

  server.registerResource(
    'course',
    new ResourceTemplate('lessonfolk://courses/{lang}/{course}', {
      list: () => {
        const catalog = readCatalog(coursesDir);
        return {
          resources: catalog.courses.map((course) => ({
            uri: `lessonfolk://courses/${catalog.lang}/${course.id}`,
            name: course.title,
            description: course.description,
            mimeType: 'application/json',
          })),
        };
      },
    }),
    { title: 'Course', description: 'A course: metadata and its lessons, in order.', mimeType: 'application/json' },
    (uri, variables) => {
      const catalog = readCatalog(coursesDir, String(variables.lang ?? DEFAULT_LANG));
      const course = catalog.courses.find((c) => c.id === String(variables.course));
      if (!course) throw new Error(`Unknown course "${String(variables.course)}".`);
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: json(courseSummary(catalog, course)) }] };
    },
  );

  server.registerResource(
    'lesson',
    new ResourceTemplate('lessonfolk://courses/{lang}/{course}/{lesson}', { list: undefined }),
    { title: 'Lesson', description: 'A lesson file (Markdown with frontmatter). {lesson} is the file name, e.g. 01-what-is-ai.', mimeType: 'text/markdown' },
    (uri, variables) => {
      const catalog = readCatalog(coursesDir, String(variables.lang ?? DEFAULT_LANG));
      const found = findLesson(catalog, `${String(variables.course)}/${String(variables.lesson)}`);
      if (!found) throw new Error(`Unknown lesson "${String(variables.course)}/${String(variables.lesson)}".`);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: readLessonText(found.lesson) }] };
    },
  );

  return server;
}
