// Pure logic of the Course companion: reads the learner's progress and the course files
// through a `read` function, so it runs the same in the mod and in its tests.

import type { Choices, IdeaMarks, LessonState, Snapshot, View } from '../types'

export type Reader = (path: string) => Promise<string | undefined>

export const PROGRESS = '.progress/progress.json'

type Progress = {
  profile?: { language?: string }
  path?: string[]
  current?: string | null
  lessons?: Record<string, { status?: string }>
}

const slash = (path: string) => path.replace(/\\/g, '/')

export const isProgressFile = (path: string) => /(?:^|\/)\.progress\/progress\.json$/.test(slash(path))

const unquote = (value: string) => value.trim().replace(/^["']|["']$/g, '')

export const yamlField = (text: string, key: string) => {
  const value = new RegExp(`^${key}:[ \\t]*(.+)$`, 'm').exec(text)?.[1]

  return value === undefined ? undefined : unquote(value)
}

// A top-level list, inline (`key: [a, b]`) or as `- item` lines below the key.
export const yamlList = (text: string, key: string): string[] => {
  const lines = text.split(/\r?\n/)
  const at = lines.findIndex(line => new RegExp(`^${key}:`).test(line))
  if (at < 0) return []

  const inline = /\[(.*)\]/.exec(lines[at] ?? '')
  if (inline) return (inline[1] ?? '').split(',').map(unquote).filter(Boolean)

  const items: string[] = []
  for (const line of lines.slice(at + 1)) {
    const item = /^\s*-\s*([^#]+?)\s*(?:#.*)?$/.exec(line)
    if (item?.[1]) items.push(unquote(item[1]))
    else if (line.trim() !== '' && !line.trim().startsWith('#')) break
  }

  return items
}

export const frontmatter = (text: string) => /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? ''

export const themeTitle = (themes: string, id: string) => {
  const entries = themes.split(/^\s*-\s+id:/m).slice(1)
  const entry = entries.find(e => unquote(e.split(/\r?\n/)[0] ?? '') === id)

  return entry ? yamlField(entry.replace(/^\s+/gm, ''), 'title') : undefined
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

const isFinished = (status?: string) => status === 'done' || status === 'skipped'

const courseOf = (lessonId: string) => lessonId.split('/')[0] ?? lessonId

const parseProgress = (text?: string): Progress | undefined => {
  if (text === undefined) return undefined
  try {
    const parsed = JSON.parse(text) as Progress

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
// AGENTS.md "Start or resume" (the learner's path first, then index.yaml).
export const load = async (read: Reader): Promise<Loaded> => {
  const raw = await read(PROGRESS)
  const progress = parseProgress(raw)
  const statuses = statusesOf(progress)
  const snapshot: Snapshot = { current: progress?.current ?? undefined, statuses }

  if (!progress) return { view: { state: raw === undefined ? 'no-progress' : 'invalid' }, snapshot }

  const wanted = progress.profile?.language ?? 'en'
  const lang = wanted !== 'en' && (await read(`courses/${wanted}/index.yaml`)) !== undefined ? wanted : 'en'
  const base = `courses/${lang}`
  const index = yamlList((await read(`${base}/index.yaml`)) ?? '', 'courses')
  const order = [...(progress.path ?? []).filter(id => index.includes(id))]
  for (const id of index) if (!order.includes(id)) order.push(id)

  const courses = new Map<string, string>()
  const course = async (id: string) => {
    if (!courses.has(id)) courses.set(id, (await read(`${base}/${id}/course.yaml`)) ?? '')

    return courses.get(id) as string
  }
  const lessons = new Map<string, string>()
  const lesson = async (id: string) => {
    if (!lessons.has(id)) lessons.set(id, (await read(`${base}/${id}.md`)) ?? '')

    return lessons.get(id) as string
  }

  // The first unfinished lesson whose prerequisites are finished; `current` counts as finished.
  const findNext = async () => {
    const done = (id: string) => isFinished(statuses[id]) || id === progress.current
    for (const id of order) {
      for (const lessonId of yamlList(await course(id), 'lessons')) {
        if (done(lessonId)) continue
        const prerequisites = yamlList(frontmatter(await lesson(lessonId)), 'prerequisites')
        if (prerequisites.every(done)) return lessonId
      }
    }

    return undefined
  }

  const current = progress.current && statuses[progress.current] !== undefined &&
    !isFinished(statuses[progress.current])
    ? progress.current
    : undefined
  const next = await findNext()
  const focus = current ?? next
  if (!focus) return { view: { state: 'all-done' }, snapshot }

  const courseId = courseOf(focus)
  const courseText = await course(courseId)
  const themes = (await read(`${base}/themes.yaml`)) ?? ''
  const themeId = yamlField(courseText, 'theme')
  const lessonStates: LessonState[] = []
  for (const id of yamlList(courseText, 'lessons')) {
    const status = statuses[id]
    lessonStates.push({
      id,
      title: yamlField(frontmatter(await lesson(id)), 'title') ?? id.split('/').pop() ?? id,
      status: id === current ? 'current' : status === 'done' || status === 'skipped' ? status : 'todo',
    })
  }

  const titleOf = async (id: string) => yamlField(frontmatter(await lesson(id)), 'title') ?? id

  return {
    view: {
      state: current ? 'lesson' : 'between',
      courseId,
      courseTitle: yamlField(courseText, 'title') ?? courseId,
      themeTitle: themeId ? themeTitle(themes, themeId) ?? themeId : undefined,
      level: yamlField(courseText, 'level'),
      lessons: lessonStates,
      current: current
        ? { id: current, title: await titleOf(current), ideas: keyIdeas(await lesson(current)) }
        : undefined,
      next: next
        ? {
            id: next,
            title: await titleOf(next),
            courseTitle: courseOf(next) === courseId
              ? undefined
              : yamlField(await course(courseOf(next)), 'title') ?? courseOf(next),
          }
        : undefined,
    },
    snapshot,
  }
}

// What changed between two saves of progress.json, worth a toast.
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

// The address the dashboard server prints once it listens (Astro: "Local http://127.0.0.1:4321/"),
// as a link every surface accepts (http only for localhost). Colour codes are ignored.
export const dashboardUrl = (output: string) => {
  const port = /https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):(\d+)/.exec(
    output.replace(/\u001b\[[0-9;]*m/g, ''),
  )?.[1]

  return port ? `http://localhost:${port}/` : undefined
}

export const togglePick =(choices: Choices, index: number): Choices => ({
  ...choices,
  picked: choices.picked.includes(index)
    ? choices.picked.filter(i => i !== index)
    : [...choices.picked, index].sort((a, b) => a - b),
})
