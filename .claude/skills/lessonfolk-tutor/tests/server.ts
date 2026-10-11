// A stand-in for the LessonFolk MCP server: the same tool results (`get_progress`,
// `list_courses`, `get_lesson`) for a small catalog and the progress of one learner.

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
  profile?: { name?: string; level?: string }
  path?: string[]
  current?: string | null
  lessons?: Record<string, { status: string }>
}

// A learner's saved progress: `current` and a status for each started lesson.
export const progress = (current: string | null, lessons: Record<string, string>, path?: string[]): Saved => ({
  profile: { name: 'Alex', level: 'beginner' },
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
  if (tool === 'get_lesson') {
    const found = CATALOG.flatMap(c => c.lessons).find(l => l.id === args.lessonId)

    return found ? lessonText(found) : undefined
  }

  return undefined
}
