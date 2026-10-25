/**
 * The LessonFolk MCP server: course and progress tools, course resources and the tutor
 * prompts (instructions, `learn`, `review`, `progress`) for one user.
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
  checkVerdictSchema,
  formatCourseIssues,
  missingChecks,
  nextLesson,
} from '@lessonfolk/core';
import { describeErrorForLog } from '@lessonfolk/db';
import { McpServer, ResourceTemplate, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { DEFAULT_LANG, courseSummary, findLesson, learnerLang, lessonStatus, readCatalog, readLessonText } from './catalog.ts';
import { compactProgress, progressReceipt } from './progress-view.ts';
import { INSTRUCTIONS, registerPrompts } from './prompts.ts';
import type { RateLimiter } from './rate-limit.ts';
import { SCOPE_READ, SCOPE_WRITE, accessFromScopes } from './scopes.ts';

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
  /** The token's scopes (see scopes.ts); left out means full access. Enforced per tool. */
  scopes?: string[];
}

/** Size caps on every free-text argument: the tutor never needs more, and a client must not store megabytes. */
export const LIMITS = { id: 200, lang: 35, short: 200, text: 4000, listItems: 100, json: 1_000_000 } as const;

const lessonId = z.string().min(1).max(LIMITS.id).describe('Lesson id: "<course-id>/<lesson file name>", e.g. "ai-foundations/01-what-is-ai".');
const lang = z
  .string()
  .min(2)
  .max(LIMITS.lang)
  .optional()
  .describe("Course language code, e.g. \"fr\". Defaults to the learner's profile language; English where there is no translation.");

const json = (value: unknown) => JSON.stringify(value, null, 2);
const ok = (text: string): CallToolResult => ({ content: [{ type: 'text', text }] });
const fail = (text: string): CallToolResult => ({ content: [{ type: 'text', text }], isError: true });

/** A store or course error as a sentence the AI can act on. */
export function describeError(error: unknown): string {
  if (error instanceof ProgressStoreError) {
    const lines = [`${error.message} (${error.code})`];
    const { missing, missingChecks: unchecked, issues, problems } = error.details;
    if (missing?.length) lines.push(`Unfinished prerequisites: ${missing.join(', ')}.`);
    if (unchecked?.length) lines.push(`Questions with no recorded verdict: ${unchecked.join(', ')}.`);
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
    // Name and code only: a failed query's message holds the learner's data (notes, profile).
    console.error(`LessonFolk MCP tool failed: ${describeErrorForLog(error)}`);
  }
  return fail(describeError(error));
}

export function createLessonfolkServer({ userId, store, coursesDir, writeLimiter, client = 'mcp', scopes }: LessonfolkServerOptions): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  const writeOptions: WriteOptions = { client };
  const access = accessFromScopes(scopes);
  const denied = (scope: string) =>
    fail(
      `This app was not allowed to ${scope === SCOPE_WRITE ? 'change' : 'read'} the learner's LessonFolk data (missing permission ${scope}). ` +
        'Nothing was done. Tell the learner, and ask them to connect LessonFolk again and allow it.',
    );

  const read = async (run: () => Promise<unknown> | unknown): Promise<CallToolResult> => {
    if (!access.read) return denied(SCOPE_READ);
    try {
      const value = await run();
      return ok(typeof value === 'string' ? value : json(value));
    } catch (error) {
      return report(error);
    }
  };

  /**
   * A write: rate-limited, then the store applies the tutor rules. The answer is a short receipt
   * (plus `echo`, what the call just set), not the whole progress: get_progress has the details.
   */
  const write = async (
    done: string | ((progress: Progress) => string),
    run: () => Promise<Progress>,
    echo?: (progress: Progress) => unknown,
  ): Promise<CallToolResult> => {
    if (!access.write) return denied(SCOPE_WRITE);
    const wait = writeLimiter.take(userId);
    if (wait) return fail(`Too many changes in a short time: wait ${wait} seconds, then try again. Nothing was saved.`);
    try {
      const progress = await run();
      const said = typeof done === 'string' ? done : done(progress);
      return ok(`${said}${echo ? ` ${json(echo(progress))}` : ''}\n\n${progressReceipt(progress)}`);
    } catch (error) {
      return report(error);
    }
  };

  // All four hints and the title are set on every tool (some directories reject tools that leave one out).
  // Every write sets the same end state when repeated, so all are idempotent.
  const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
  const writes = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;
  // A write that replaces or removes what was saved is destructive, even when it is repeatable: a
  // directory scan flags a tool whose description says it replaces data but is not marked so.
  const overwrites = { ...writes, destructiveHint: true } as const;

  // --- Read tools ---------------------------------------------------------------

  server.registerTool(
    'get_progress',
    {
      title: 'Get progress',
      description:
        "The learner's saved progress (progress.json v1 shape): profile (name, experience, goal, language, level, interests), " +
        'path with its reason, current lesson, and every started lesson with status, dates and score. ' +
        'To keep the answer small, notes are only given for the current lesson (to resume it) and, as a preview, for the latest finished lessons (recentNotes); ' +
        'other lessons are flagged hasNotes. Give courseId or lessonIds to read the notes of one course or of some lessons, or full: true for the whole progress.json. ' +
        'Empty profile and lessons mean a new learner who has not been onboarded yet: onboard them and save their profile with set_profile before teaching. ' +
        'Call this first in every session. Nothing the learner does is saved unless you call the write tools (set_profile, set_path, start_lesson, complete_lesson…).',
      inputSchema: z.object({
        courseId: z.string().min(1).max(LIMITS.id).optional().describe('Course id: also give the notes of all its lessons.'),
        lessonIds: z.array(lessonId).max(LIMITS.listItems).optional().describe('Lesson ids: also give their notes.'),
        full: z.boolean().optional().describe('The whole progress, notes of every lesson included. Large: only when needed.'),
      }),
      annotations: { ...readOnly, title: 'Get progress' },
    },
    ({ courseId, lessonIds, full }) =>
      read(async () => {
        const progress = await store.getProgress(userId);
        return full ? progress : compactProgress(progress, { courseId, lessonIds });
      }),
  );

  server.registerTool(
    'get_next_lesson',
    {
      title: 'Get next lesson',
      description:
        'The lesson to teach now, by the LessonFolk rules: the current lesson if unfinished ("resume"), otherwise the first unfinished lesson ' +
        'whose prerequisites are done or skipped, following the learner\'s path first ("next"). "all_done" means every lesson is finished; ' +
        '"blocked" means none is available. unknownPathIds lists path courses that no longer exist. ' +
        'Does not change anything; start_lesson begins the lesson. The answer ends with nextStep: the calls that save the learner\'s progress around this lesson.',
      inputSchema: z.object({}),
      annotations: { ...readOnly, title: 'Get next lesson' },
    },
    () =>
      read(async () => {
        const progress = await store.getProgress(userId);
        // Same courses and order in every language; the titles in the learner's.
        const courses = readCatalog(coursesDir, learnerLang(progress)).courses;
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
          nextStep:
            (next.kind === 'next' ? `Call start_lesson("${next.lesson.id}") now, then get_lesson to read it. ` : 'Call get_lesson to read it, and teach from where the notes say it stopped. ') +
            `Ask its ${next.lesson.checks} "Check your understanding" questions one at a time; after each answer, judge it, give your feedback and call record_check("${next.lesson.id}", question, verdict). ` +
            `Once every question has a verdict and the learner meets its completion criteria, call complete_lesson("${next.lesson.id}", score, notes) right away, before moving on: progress is saved only by these calls.`,
        };
      }),
  );

  server.registerTool(
    'get_lesson',
    {
      title: 'Get lesson',
      description:
        'The full lesson file: frontmatter, content, key ideas, teaching notes (written for the tutor, not the learner), ' +
        '"Check your understanding" questions with good-answer hints, and completion criteria. ' +
        "Starts with a short header giving the course and the learner's status for this lesson.",
      inputSchema: z.object({ lessonId, lang }),
      annotations: { ...readOnly, title: 'Get lesson' },
    },
    ({ lessonId: id, lang: language }) =>
      read(async () => {
        const progress = await store.getProgress(userId);
        const catalog = readCatalog(coursesDir, learnerLang(progress, language));
        const found = findLesson(catalog, id);
        if (!found) throw new ProgressStoreError('unknown_lesson', `Unknown lesson "${id}". Use list_courses to see the lesson ids.`, { lessonId: id });
        const entry = progress.lessons[found.lesson.id];
        const recorded = Object.entries(entry?.checks ?? {}).map(([question, verdict]) => `${question} ${verdict}`);
        const unchecked = missingChecks(entry, found.lesson.checks);
        const checks =
          `${found.lesson.checks} "Check your understanding" questions; ` +
          (recorded.length ? `verdicts recorded: ${recorded.join(', ')}` : 'no verdict recorded yet') +
          (unchecked.length ? `; next to ask: question ${unchecked[0]}` : '');
        const header = `<!-- LessonFolk: lesson ${found.lesson.id} of course "${found.course.title}" (${found.course.id}), language ${found.lesson.lang}${found.lesson.lang === catalog.lang ? '' : ` (not translated into "${catalog.lang}" yet)`}; learner status: ${lessonStatus(progress, id)}; ${checks}. Progress is saved only by the write tools: start_lesson before teaching a lesson that is not started; record_check after each check; complete_lesson once every check has a verdict and the completion criteria are met (it is refused before). Teach the key ideas first. Then ask each question of "Check your understanding" alone, in order, and wait for the learner's own answer: never give the answer, a list of answers to pick from or suggested replies, and never show the "Good answer" hints. Judge the answer against its hint, give your feedback, call record_check, and only then ask the next question -->`;
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
      inputSchema: z.object({ theme: z.string().min(1).max(LIMITS.id).optional().describe('Theme id, e.g. "foundations".'), lang }),
      annotations: { ...readOnly, title: 'List courses' },
    },
    ({ theme, lang: language }) =>
      read(async () => {
        const progress = await store.getProgress(userId);
        const catalog = readCatalog(coursesDir, learnerLang(progress, language));
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
        'A theme with no course yet is "coming soon". The ids are the values used for profile interests and by list_courses.',
      inputSchema: z.object({ lang }),
      annotations: { ...readOnly, title: 'List themes' },
    },
    ({ lang: language }) =>
      read(async () => {
        const progress = await store.getProgress(userId);
        return readCatalog(coursesDir, learnerLang(progress, language)).themes.map((theme) => ({
          id: theme.id,
          title: theme.title,
          description: theme.description,
          courseIds: theme.courses.map((c) => c.id),
          comingSoon: theme.courses.length === 0,
        }));
      }),
  );

  // --- Write tools --------------------------------------------------------------

  const nullableText = z.string().min(1).max(LIMITS.short).nullable().optional();
  server.registerTool(
    'set_profile',
    {
      title: 'Set profile',
      description:
        "Change the learner's profile. Each field given replaces the saved one, null removes it, fields left out are kept. " +
        'level must be beginner, intermediate or advanced. interests are theme ids from list_themes. ' +
        'Call it during onboarding of a new learner (empty profile in get_progress) as soon as you know their name, experience, goal, language, level or interests, ' +
        'and again whenever they change one. Without this call the profile stays empty.',
      inputSchema: z.object({
        name: nullableText,
        experience: nullableText,
        goal: nullableText,
        language: nullableText.describe('Preferred language for the sessions, as a language code, e.g. "en" or "fr". The course tools then use it by default.'),
        level: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
        interests: z.array(z.string().min(1).max(LIMITS.id)).max(LIMITS.listItems).nullable().optional().describe('Theme ids.'),
      }),
      annotations: { ...overwrites, title: 'Set profile' },
    },
    (profile) => write('Profile saved:', () => store.setProfile(userId, profile, writeOptions), (progress) => progress.profile),
  );

  server.registerTool(
    'set_path',
    {
      title: 'Set path',
      description:
        'Save the learning path the learner agreed to: course ids in order, with the reason (2-3 sentences for the learner). Call it at the end of onboarding, once they agreed. ' +
        'Replaces the previous path. Saved only once the learner has agreed to it. Every course must come after its prerequisites, and an unfinished prerequisite may not be dropped.',
      inputSchema: z.object({
        path: z.array(z.string().min(1).max(LIMITS.id)).max(LIMITS.listItems).describe('Course ids, in order.'),
        reason: z.string().min(1).max(LIMITS.text).describe('Why this path, in 2-3 sentences for the learner.'),
      }),
      annotations: { ...overwrites, title: 'Set path' },
    },
    ({ path, reason }) => write('Path saved:', () => store.setPath(userId, path, reason, writeOptions), (progress) => progress.path),
  );

  server.registerTool(
    'start_lesson',
    {
      title: 'Start lesson',
      description:
        'Start (or resume) a lesson: it becomes the current lesson, status in_progress. Call it before teaching a lesson that is not started yet. Fails if its prerequisites are not done or skipped, ' +
        'or if it is already done or skipped. Takes a lesson id such as the one get_next_lesson returns.',
      inputSchema: z.object({ lessonId }),
      annotations: { ...writes, title: 'Start lesson' },
    },
    ({ lessonId: id }) => write(`Lesson ${id} started.`, () => store.startLesson(userId, id, writeOptions)),
  );

  server.registerTool(
    'record_check',
    {
      title: 'Record a check',
      description:
        "Record your verdict on the learner's answer to one \"Check your understanding\" question of the lesson in progress (question numbers start at 1, in the lesson's order). " +
        "Ask the questions one at a time: ask one alone, wait for the learner's own answer, judge it against its \"Good answer\" hint, give the learner your feedback, then call this, before asking the next question. " +
        'verdict: correct, partial or incorrect. A question can only be recorded once every question before it has a verdict. ' +
        'After re-explaining, ask a question again and record it again: the new verdict replaces the old one. complete_lesson is refused until every question has a verdict.',
      inputSchema: z.object({
        lessonId,
        question: z.number().int().min(1).max(LIMITS.listItems).describe('Question number in "Check your understanding", from 1.'),
        verdict: checkVerdictSchema.describe("Your judgement of the learner's own answer against the \"Good answer\" hint."),
      }),
      annotations: { ...overwrites, title: 'Record a check' },
    },
    ({ lessonId: id, question, verdict }) =>
      write(
        (progress) => {
          const found = findLesson(readCatalog(coursesDir, learnerLang(progress)), id);
          const unchecked = found ? missingChecks(progress.lessons[id], found.lesson.checks) : [];
          const next = unchecked.length
            ? `Next: question ${unchecked[0]}, asked alone, once the learner has your feedback on this one.`
            : 'Every question has a verdict: if the completion criteria are met, call complete_lesson now; otherwise re-explain and ask the questions they missed again.';
          const retry = verdict === 'correct' ? '' : ' If the completion criteria need this question, re-explain differently, ask it again and record the new verdict.';
          return `Check ${question} of ${id} recorded: ${verdict}. ${next}${retry}`;
        },
        () => store.recordCheck(userId, id, question, verdict, writeOptions),
      ),
  );

  server.registerTool(
    'complete_lesson',
    {
      title: 'Complete lesson',
      description:
        'Mark a lesson done once its completion criteria are met: score is the estimate from the checks (0 to 1), ' +
        'notes are one or two sentences on what the learner found easy or hard (used for later review). Clears the current lesson. ' +
        'Refused until every "Check your understanding" question of the lesson has a verdict saved with record_check. ' +
        'Call it right when the learner meets the completion criteria, before moving on to anything else, not at the end of the session: a lesson that is not completed here does not count as done.',
      inputSchema: z.object({
        lessonId,
        score: z.number().min(0).max(1).describe('0 to 1.'),
        notes: z.string().min(1).max(LIMITS.text).describe('What the learner found easy or hard.'),
      }),
      annotations: { ...writes, title: 'Complete lesson' },
    },
    ({ lessonId: id, score, notes }) => write(`Lesson ${id} completed.`, () => store.completeLesson(userId, id, { score, notes }, writeOptions)),
  );

  server.registerTool(
    'skip_lesson',
    {
      title: 'Skip lesson',
      description:
        'Mark one lesson the learner already knows as skipped. reason is saved as the lesson notes. ' +
        'level_check_skip_course skips the lessons of a whole course after the level check.',
      inputSchema: z.object({ lessonId, reason: z.string().min(1).max(LIMITS.text).describe('Why it was skipped, saved as the notes.') }),
      annotations: { ...writes, title: 'Skip lesson' },
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
      inputSchema: z.object({ courseId: z.string().min(1).max(LIMITS.id).describe('Course id, e.g. "ai-foundations".') }),
      annotations: { ...writes, title: 'Skip a course after the level check' },
    },
    ({ courseId }) => write(`Course ${courseId} skipped after the level check.`, () => store.placementSkip(userId, courseId, writeOptions)),
  );

  server.registerTool(
    'reset_course',
    {
      title: 'Reset a course',
      description:
        'Reset a course so the learner can take it again from its first lesson: all its lessons go back to not started and their scores and notes are removed. ' +
        'Other courses and the path are not changed. Requires explicit confirmation from the learner of what will be reset.',
      inputSchema: z.object({ courseId: z.string().min(1).max(LIMITS.id).describe('Course id, e.g. "ai-foundations".') }),
      annotations: { ...overwrites, title: 'Reset a course' },
    },
    ({ courseId }) => write(`Course ${courseId} reset.`, () => store.resetCourse(userId, courseId, writeOptions)),
  );

  server.registerTool(
    'save_lesson_notes',
    {
      title: 'Save lesson notes',
      description:
        'Save short notes on a started lesson, e.g. where a session stopped mid-lesson. Replaces the previous notes.',
      inputSchema: z.object({ lessonId, notes: z.string().min(1).max(LIMITS.text) }),
      annotations: { ...overwrites, title: 'Save lesson notes' },
    },
    ({ lessonId: id, notes }) => write(`Notes saved on ${id}.`, () => store.saveNotes(userId, id, notes, writeOptions)),
  );

  server.registerTool(
    'record_review_score',
    {
      title: 'Record review score',
      description:
        'After a review quiz on a done lesson, record the new score (0 to 1). It replaces the saved score when it is higher, and the old score is lost; a lower score is ignored.',
      inputSchema: z.object({ lessonId, score: z.number().min(0).max(1) }),
      annotations: { ...overwrites, title: 'Record review score' },
    },
    ({ lessonId: id, score }) => write(`Review score recorded for ${id}.`, () => store.recordReviewScore(userId, id, score, writeOptions)),
  );

  server.registerTool(
    'import_progress',
    {
      title: 'Import progress',
      description:
        "Replace the learner's whole saved progress with a progress.json file (version 1), e.g. to move local progress to this server. " +
        'Everything saved before is replaced. Requires explicit confirmation from the learner.',
      inputSchema: z.object({
        progress: z
          .union([z.string().min(1).max(LIMITS.json), z.record(z.string(), z.unknown())])
          .describe('The progress.json content, as JSON text or as an object.'),
      }),
      annotations: { ...overwrites, title: 'Import progress' },
    },
    ({ progress }) => write('Progress imported.', () => store.importProgress(userId, progress, writeOptions)),
  );

  // --- Prompts: the tutor procedures (prompts/*.md) ---------------------------------

  registerPrompts(server);

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
