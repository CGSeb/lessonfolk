// A stand-in for the LessonFolk MCP server: the same tool results (`get_progress`,
// `list_courses`, `get_lesson`, `list_projects`, `get_project`) for a small catalog, one
// practice project and the progress of one learner.

export type Lesson = { id: string; title: string; prerequisites: string[]; ideas: string[] }
export type Course = { id: string; title: string; level: string; theme: string; themeTitle: string; lessons: Lesson[] }

const lesson = (id: string, title: string, prerequisites: string[], ideas: string[]): Lesson => ({
  id,
  title,
  prerequisites,
  ideas,
})

export const CATALOG: Course[] = [
  {
    id: 'basics',
    title: 'Basics',
    level: 'beginner',
    theme: 'understanding-ai',
    themeTitle: 'Understanding AI',
    lessons: [
      lesson('basics/01-one', 'Lesson one', [], ['**What AI is.** A first idea.', '**Narrow vs general**: a second idea.']),
      lesson('basics/02-two', 'Lesson two', ['basics/01-one'], ['Plain idea without bold']),
    ],
  },
  {
    id: 'next-steps',
    title: 'Next Steps',
    level: 'beginner',
    theme: 'using-ai',
    themeTitle: 'Using AI tools',
    lessons: [lesson('next-steps/01-three', 'Lesson three', ['basics/02-two'], ['**Prompts**. Words.'])],
  },
]

export type Saved = {
  profile?: { name?: string; level?: string; language?: string }
  path?: string[]
  current?: string | null
  lessons?: Record<string, { status: string }>
  projects?: Record<string, { status: string; startedAt?: string; milestones: number[]; review?: Record<string, string> }>
}

// The practice project of the catalog: three milestones and two review criteria.
export const PROJECT = {
  id: 'demo',
  title: 'Demo project',
  titleFr: 'Projet démo',
  level: 'beginner',
  themeTitle: 'Using AI tools',
  milestones: ['Pick the task', 'Write the prompt', 'Test it'],
  reviewCriteria: 2,
}

// The project `demo` saved in progress: these milestones reached, these review verdicts.
export const onProject = (saved: Saved, milestones: number[], status = 'in_progress', review?: Record<string, string>): Saved => ({
  ...saved,
  projects: { demo: { status, startedAt: '2026-11-01', milestones, ...(review ? { review } : {}) } },
})

// A learner's saved progress: `current` and a status for each started lesson.
export const progress = (
  current: string | null,
  lessons: Record<string, string>,
  path?: string[],
  language?: string,
): Saved => ({
  profile: { name: 'Alex', level: 'beginner', ...(language ? { language } : {}) },
  ...(path ? { path } : {}),
  current,
  lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
})

const lessonText = (l: Lesson) =>
  [
    '<!-- LessonFolk: lesson -->',
    '---',
    `id: ${l.id}`,
    `title: ${l.title}`,
    '---',
    '',
    '## Key ideas',
    ...l.ideas.map((idea, i) => `${i + 1}. ${idea}\n   More words on it.`),
    '',
    '## Teaching notes',
    '1. Not a key idea.',
  ].join('\n')

// What the server answers for `tool`, for the learner whose progress `saved` is.
export const answer = (saved: () => Saved, tool: string, args: Record<string, unknown> = {}): string | undefined => {
  if (tool === 'get_progress') return JSON.stringify(saved())
  if (tool === 'list_courses') {
    const statusOf = (id: string) => {
      const status = saved().lessons?.[id]?.status
      return status === undefined ? 'not_started' : status
    }

    return JSON.stringify(
      CATALOG.map(c => ({
        ...c,
        lessons: c.lessons.map(l => ({ id: l.id, title: l.title, prerequisites: l.prerequisites, status: statusOf(l.id) })),
      })),
    )
  }
  if (tool === 'list_projects') {
    const title = args.lang === 'fr' ? PROJECT.titleFr : PROJECT.title

    return JSON.stringify([
      { id: PROJECT.id, title, level: PROJECT.level, themeTitle: PROJECT.themeTitle, milestones: 3, reviewCriteria: PROJECT.reviewCriteria },
    ])
  }
  if (tool === 'get_project') {
    if (args.projectId !== PROJECT.id) return undefined

    return [
      '<!-- LessonFolk: project demo -->',
      '---',
      `id: ${PROJECT.id}`,
      `title: ${args.lang === 'fr' ? PROJECT.titleFr : PROJECT.title}`,
      '---',
      '',
      '## Brief',
      'Make something.',
      '',
      '## Milestones',
      ...PROJECT.milestones.map((m, i) => `${i + 1}. **${m}.** Reach it.\n   Done when: shown.`),
      '',
      '## Coaching notes',
      '1. Not a milestone.',
      '',
      '## Review',
      '1. Good.',
      '2. Clear.',
    ].join('\n')
  }
  if (tool === 'get_lesson') {
    const found = CATALOG.flatMap(c => c.lessons).find(l => l.id === args.lessonId)

    return found ? lessonText(found) : undefined
  }

  return undefined
}
