// Pure logic of the Course companion: reads the learner's progress and the courses from the
// LessonFolk MCP server through a `call` function, so it runs the same in the mod and in its
// tests, with a local or a hosted instance.

import type { Choices, IdeaMarks, LessonState, Snapshot, View } from '../types'

// Calls a tool of the LessonFolk MCP server: the tool's text result, or undefined when it
// failed or the server could not be reached.
export type Caller = (tool: string, args?: Record<string, unknown>) => Promise<string | undefined>

// The name of the server in `.mcp.json` (what `claude mcp add lessonfolk …` registers).
export const SERVER = 'lessonfolk'
export const TOOL_PREFIX = `mcp__${SERVER}__`

type Progress = {
  profile?: { level?: string }
  path?: string[]
  current?: string | null
  lessons?: Record<string, { status?: string }>
}

type CourseSummary = {
  id: string
  title: string
  level?: string
  themeTitle?: string
  lessons: { id: string; title: string; prerequisites?: string[]; status?: string }[]
}

// The `## Key ideas` items: their bold lead when they have one, else their first words.
export const keyIdeas = (lesson: string): string[] => {
  const section = /^## Key ideas\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(lesson)?.[1] ?? ''

  return [...section.matchAll(/^\d+\.\s+(.+)$/gm)].map(m => {
    const text = m[1] ?? ''
    const bold = /^\*\*(.+?)\*\*/.exec(text)?.[1]
    const label = (bold ?? text).replace(/\*\*|\*|`/g, '').replace(/[.:]\s*$/, '').trim()

    return label.length > 70 ? `${label.slice(0, 67).trimEnd()}…` : label
  })
}

// `list_courses` statuses: not_started, in_progress, done, skipped, skipped_after_level_check.
const isFinished = (status?: string) =>
  status === 'done' || status === 'skipped' || status === 'skipped_after_level_check'

const courseOf = (lessonId: string) => lessonId.split('/')[0] ?? lessonId

const parseJson = <T>(text?: string): T | undefined => {
  if (text === undefined) return undefined
  try {
    const parsed = JSON.parse(text) as T

    return parsed && typeof parsed === 'object' ? parsed : undefined
  } catch {
    return undefined
  }
}

export const statusesOf = (progress?: Progress): Snapshot['statuses'] =>
  Object.fromEntries(
    Object.entries(progress?.lessons ?? {}).map(([id, l]) => [id, l?.status ?? 'in_progress']),
  )

export type Loaded = { view: View; snapshot: Snapshot }

// Builds the pane's view: the course in focus (the current lesson's, else the next lesson's),
// its lessons, the current lesson's key ideas and the next lesson, following the order of
// "Start or resume" (the learner's path first, then the catalog order of list_courses).
export const load = async (call: Caller): Promise<Loaded> => {
  const progress = parseJson<Progress>(await call('get_progress'))
  const catalog = parseJson<CourseSummary[]>(await call('list_courses'))
  const statuses = statusesOf(progress)
  const snapshot: Snapshot = { current: progress?.current ?? undefined, statuses }

  if (!progress || !Array.isArray(catalog)) return { view: { state: 'offline' }, snapshot }
  if (!progress.profile?.level && Object.keys(statuses).length === 0) {
    return { view: { state: 'no-progress' }, snapshot }
  }

  const byId = new Map(catalog.map(course => [course.id, course]))
  const order = [...(progress.path ?? []).filter(id => byId.has(id))]
  for (const course of catalog) if (!order.includes(course.id)) order.push(course.id)

  const lessonTitle = (id: string) =>
    catalog.flatMap(course => course.lessons).find(lesson => lesson.id === id)?.title ?? id

  // The first unfinished lesson whose prerequisites are finished; `current` counts as finished.
  const done = (id: string) => isFinished(statuses[id]) || id === progress.current
  const next = order
    .flatMap(id => byId.get(id)?.lessons ?? [])
    .find(lesson => !done(lesson.id) && (lesson.prerequisites ?? []).every(done))?.id

  const current = progress.current && statuses[progress.current] !== undefined &&
    !isFinished(statuses[progress.current])
    ? progress.current
    : undefined
  const focus = current ?? next
  if (!focus) return { view: { state: 'all-done' }, snapshot }

  const courseId = courseOf(focus)
  const course = byId.get(courseId)
  const lessons: LessonState[] = (course?.lessons ?? []).map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    status: lesson.id === current
      ? 'current'
      : isFinished(statuses[lesson.id]) ? (statuses[lesson.id] === 'done' ? 'done' : 'skipped') : 'todo',
  }))
  const ideas = current ? keyIdeas((await call('get_lesson', { lessonId: current })) ?? '') : []

  return {
    view: {
      state: current ? 'lesson' : 'between',
      courseId,
      courseTitle: course?.title ?? courseId,
      themeTitle: course?.themeTitle,
      level: course?.level,
      lessons,
      current: current ? { id: current, title: lessonTitle(current), ideas } : undefined,
      next: next
        ? {
            id: next,
            title: lessonTitle(next),
            courseTitle: courseOf(next) === courseId ? undefined : byId.get(courseOf(next))?.title ?? courseOf(next),
          }
        : undefined,
    },
    snapshot,
  }
}

// The LessonFolk instance the Dashboard button opens: the origin of the `lessonfolk` url in the
// project's `.mcp.json` (the MCP endpoint is `<instance>/mcp`), the local default otherwise.
export const DEFAULT_INSTANCE = 'http://localhost:4321/'

export const instanceUrl = (mcpJson?: string): string => {
  try {
    const config = JSON.parse(mcpJson ?? '{}') as { mcpServers?: Record<string, { url?: string }> }
    const url = new URL(config.mcpServers?.[SERVER]?.url ?? '')

    return url.protocol === 'http:' || url.protocol === 'https:' ? `${url.origin}/` : DEFAULT_INSTANCE
  } catch {
    return DEFAULT_INSTANCE
  }
}

// What changed between two reads of the progress, worth a toast.
export const changes = (previous: Loaded | undefined, loaded: Loaded): string[] => {
  if (!previous) return []
  const { snapshot: before } = previous
  const { snapshot: after, view } = loaded
  const toasts: string[] = []
  const titleOf = (id: string) =>
    [...(view.lessons ?? []), ...(previous.view.lessons ?? [])].find(l => l.id === id)?.title ?? id

  for (const [id, status] of Object.entries(after.statuses)) {
    if (status === 'done' && before.statuses[id] !== 'done') toasts.push(`Lesson complete: ${titleOf(id)}`)
  }

  const course = after.current ? courseOf(after.current) : undefined
  const hadStarted = Object.entries(before.statuses).some(
    ([id, status]) => courseOf(id) === course && (isFinished(status) || id === before.current),
  )
  if (course && after.current !== before.current && !hadStarted && view.courseId === course) {
    toasts.push(`New course: ${view.courseTitle}${view.themeTitle ? ` (${view.themeTitle})` : ''}`)
  }

  return toasts
}

// The tutor's report on a key idea: `active` starts it, `done` finishes it; earlier ones are covered.
export const markIdea = (marks: IdeaMarks, lessonId: string, keyIdea: number, status: 'active' | 'done'): IdeaMarks => {
  const covered = marks.lessonId === lessonId ? marks.covered : []
  const upTo = status === 'done' ? keyIdea : keyIdea - 1
  const all = new Set(covered)
  for (let i = 1; i <= upTo; i++) all.add(i)

  return {
    lessonId,
    covered: [...all].sort((a, b) => a - b),
    active: status === 'active' ? keyIdea : undefined,
  }
}

// The tutor's offered answers, from the choices tool's input: 2 to 8 options with a label.
export const parseChoices = (input: Record<string, unknown>): Choices | undefined => {
  const raw = Array.isArray(input.options) ? (input.options as unknown[]) : []
  const options = raw.flatMap(option => {
    const o = (typeof option === 'string' ? { label: option } : option ?? {}) as Record<string, unknown>
    const label = typeof o.label === 'string' ? o.label.trim() : ''
    const reply = typeof o.reply === 'string' && o.reply.trim() ? o.reply.trim() : label

    return label ? [{ label, reply }] : []
  })
  if (options.length < 2 || options.length > 8) return undefined

  return { options, isMulti: input.multiSelect === true, picked: [] }
}

// What the learner sends: the picked options' replies, in the order the tutor listed them.
export const replyOf = (choices: Choices) =>
  choices.options.filter((_, i) => choices.picked.includes(i)).map(o => o.reply).join(', ')

export const togglePick =(choices: Choices, index: number): Choices => ({
  ...choices,
  picked: choices.picked.includes(index)
    ? choices.picked.filter(i => i !== index)
    : [...choices.picked, index].sort((a, b) => a - b),
})
