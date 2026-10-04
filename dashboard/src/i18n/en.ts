/**
 * English UI strings for the dashboard.
 *
 * Every piece of interface text lives here so components never hard-code copy
 * and the interface can be translated later by adding a sibling file
 * (e.g. `fr.ts`) with the same `UiStrings` shape.
 *
 * Placeholders use `{name}` and are filled by `t()`.
 */
export const en = {
  site: {
    name: 'Apprentice',
    title: 'Apprentice',
    description: 'Learn AI from zero to advanced, with an AI tutor in your chat. See your courses and progress.',
    titleTemplate: '{page} · Apprentice',
  },
  a11y: {
    skipToContent: 'Skip to main content',
    mainNav: 'Main',
    homeLink: 'Apprentice, home',
  },
  nav: {
    home: 'Home',
    courses: 'Courses',
  },
  courses: {
    title: 'Courses',
    heading: 'Courses',
    intro: 'Your learning path, from first steps to advanced topics. Courses are listed in the recommended order.',
    listLabel: 'Courses in recommended order',
    empty: 'No courses to show yet.',
    hoursOne: 'About {hours} hour',
    hoursOther: 'About {hours} hours',
    lessonCountOne: '{count} lesson',
    lessonCountOther: '{count} lessons',
    lessonsProgress: '{done} of {total} lessons',
    progressInvalid:
      'Your progress file could not be read, so every course is shown as not started. Ask your tutor to check .progress/progress.json.',
    contentIssues: 'Some course files have problems, so parts of the catalog may be missing:',
    contentIssuesMore: '…and {count} more.',
    contentIssuesHint: 'Run {command} in the project folder for details.',
  },
  status: {
    label: 'Status',
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
    done: 'Done',
    skipped: 'Skipped',
  },
  level: {
    label: 'Level',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  },
  course: {
    breadcrumbLabel: 'Breadcrumb',
    prerequisitesTitle: 'Before this course',
    prerequisitesIntro: 'This course builds on:',
    prerequisitesNone: 'None. You can start this course right away.',
    progressTitle: 'Your progress',
    completedMessage: 'You finished this course. Well done!',
    lessonsHeading: 'Lessons',
    minutes: 'About {minutes} min',
    score: 'Score: {score}%',
    completedOn: 'Finished on {date}',
    skippedOn: 'Skipped on {date}',
    tutorNotes: 'Notes from your tutor',
    nextUp: 'Next up',
    continueHint: 'To work on it with your tutor, open Claude Code or Codex in this folder and say:',
    continuePhrase: 'continue',
    invalidProgressTitle: 'Your progress file could not be read',
    invalidProgressBody: 'Lessons are shown as not started. Your progress is not lost: ask your tutor to fix the file .progress/progress.json.',
    technicalDetails: 'Technical details',
    issuesTitle: 'Some files of this course have problems',
    issuesBody: 'Some lessons may be missing from this page. To see every problem, run this command in a terminal, in this folder:',
    issuesCommand: 'npm run check:courses',
    issuesMore: '…and {count} more',
    notFoundTitle: 'Course not found',
    notFoundHeading: 'We could not find this course',
    notFoundBody: 'There is no course with the id “{id}”. It may have been renamed or removed.',
    backToCourses: 'See all courses',
  },
  footer: {
    about: 'Apprentice is an open-source app developed by CG Seb. It teaches AI to anyone, through a conversation with an AI tutor.',
    privacy: 'Your progress is saved only on this computer.',
    license: 'Code under the MIT license, courses under CC BY 4.0.',
  },
  home: {
    title: 'Home',
    heading: 'Welcome to Apprentice',
    intro: 'Learn AI from zero, one short lesson at a time, with an AI tutor that chats with you.',
    startTitle: 'How to start',
    startStepOpen: 'Open Claude Code or Codex in this folder (the Apprentice folder on your computer).',
    startStepSay: 'Type this message and send it:',
    startPhrase: "Let's start learning AI",
    startStepTutor: 'Your tutor asks you a few quick questions, then starts your first lesson. This page follows your progress as you go.',
    greeting: 'Welcome back, {name}!',
    greetingAnonymous: 'Welcome back!',
    greetingIntro: 'Here is where you are in your learning.',
    progressTitle: 'Your progress',
    progressLessons: '{finished} of {total} lessons finished',
    progressCourses: 'Courses completed: {completed} of {total}',
    nextUp: 'Next up',
    resume: 'Pick up where you left off',
    firstLesson: 'Your first lesson',
    inCourse: 'Course: {course}',
    minutes: 'About {minutes} min',
    objectives: "What you'll learn",
    continueHint: 'Open Claude Code or Codex in this folder and say:',
    continuePhrase: 'continue',
    viewCourse: 'See all lessons in {course}',
    doneTitle: 'You finished every lesson. Congratulations!',
    doneBody: 'That is a real achievement. New courses will show up here when they are added.',
    doneReview: 'To keep what you learned fresh, open Claude Code or Codex in this folder and say:',
    reviewPhrase: 'quiz me',
    blockedTitle: 'No lesson is ready to start',
    blockedBody: 'The lessons you have left need other lessons to be finished first. Your tutor can help you sort this out. Open Claude Code or Codex in this folder and say:',
    emptyTitle: 'No courses to show',
    emptyBody: 'No course could be loaded, so there is no lesson to suggest yet.',
    invalidProgressTitle: 'Your progress file could not be read',
    invalidProgressBody: 'This page is shown as if you were just starting. Your progress is not lost: ask your tutor to fix the file .progress/progress.json.',
    technicalDetails: 'Technical details',
    courseIssuesTitle: 'Some course files have problems',
    courseIssuesBody: 'Courses with problems may be missing from this page. To see every problem, run this command in a terminal, in this folder:',
    courseIssuesCommand: 'npm run check:courses',
    courseIssuesMore: '…and {count} more',
  },
  live: {
    progressUpdated: 'Your progress was updated.',
    coursesUpdated: 'The courses were updated.',
  },
} as const;

/** Shape every UI translation must follow (same keys, any string values). */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type UiStrings = Widen<typeof en>;

/** Dotted key paths into the strings, e.g. `'nav.home'`. */
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type UiKey = Paths<UiStrings>;

const strings: UiStrings = en;

/**
 * Look up a UI string by dotted key and fill `{placeholders}`.
 *
 * @example t('nav.home') // "Home"
 * @example t('site.titleTemplate', { page: 'Courses' }) // "Courses · Apprentice"
 */
export function t(key: UiKey, params?: Record<string, string | number>): string {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], strings);
  if (typeof value !== 'string') {
    throw new Error(`Missing UI string: ${key}`);
  }
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
