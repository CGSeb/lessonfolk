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
  footer: {
    about: 'Apprentice is an open-source project that teaches AI to anyone, through a conversation with an AI tutor.',
    privacy: 'Your progress is stored only on this computer, in the .progress folder.',
  },
  home: {
    title: 'Home',
    heading: 'Apprentice',
    placeholder: 'Dashboard is running. Pages are coming in the next tickets.',
    coursesPath: 'Courses:',
    progressPath: 'Progress:',
    progressFound: 'found',
    progressMissing: 'not created yet',
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
