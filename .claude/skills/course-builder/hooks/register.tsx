import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Build, Lesson, StepId, StepStatus } from '../types'

const PANE = 'course-builder'
const TITLE = 'Course builder'
const TOOL = 'mcp__course-builder__progress'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'prepare', label: 'Prepare (read format, catalog)' },
  { id: 'interview', label: 'Interview the author' },
  { id: 'outline', label: 'Outline approved' },
  { id: 'write', label: 'Write course.yaml and lessons' },
  { id: 'register', label: 'Register in index.yaml' },
  { id: 'validate', label: 'Validate (check:courses)' },
  { id: 'handback', label: 'Hand back' },
]

const IDLE: Build = {
  isActive: false,
  steps: {
    prepare: 'todo',
    interview: 'todo',
    outline: 'todo',
    write: 'todo',
    register: 'todo',
    validate: 'todo',
    handback: 'todo',
  },
  lessons: [],
}

const build = atom({ plugin: 'course-builder', key: 'build' } as const, IDLE)

const slash = (path: string) => path.replace(/\\/g, '/')

// courses/<lang>/<course>/<file>, wherever the repository sits.
const coursePath = (path: string) => {
  const match = /(?:^|\/)courses\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(slash(path))

  return match ? { lang: match[1], course: match[2], file: match[3] } : undefined
}

const isIndex = (path: string) => /(?:^|\/)courses\/[^/]+\/index\.yaml$/.test(slash(path))

const yamlField = (text: string, key: string) =>
  new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(text)?.[1]?.trim().replace(/^["']|["']$/g, '')

// Marks `step` and moves every earlier unfinished step to done: steps run in order.
const reach = (b: Build, step: StepId, status: StepStatus): Build => {
  const at = STEPS.findIndex(s => s.id === step)
  const steps = { ...b.steps }
  STEPS.forEach((s, i) => {
    if (i < at && steps[s.id] !== 'done') steps[s.id] = 'done'
  })
  if (steps[step] !== 'done' || status === 'done') steps[step] = status

  return { ...b, steps }
}

const mergeLessons = (known: Lesson[], files: string[]): Lesson[] =>
  files.map(file => known.find(l => l.file === file) ?? { file, isWritten: false })

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'course-builder',
      description: 'Show the course creation summary pane',
    })
    await $.tool.register({
      name: 'progress',
      description:
        'Updates the Course builder pane while you run the create-course skill of LessonFolk. ' +
        'Call it whenever a step of the "Create a course" procedure starts or finishes ' +
        '(prepare, interview, outline, write, register, validate, handback), and as soon as ' +
        'the course title, id, level, theme or lesson list is known or changes (for example ' +
        'once the outline is proposed). Files you write under courses/ are tracked on their own.',
      inputSchema: {
        type: 'object',
        properties: {
          step: {
            type: 'string',
            enum: STEPS.map(s => s.id),
            description: 'The workflow step this update is about',
          },
          status: {
            type: 'string',
            enum: ['active', 'done'],
            description: 'Whether the step has started or is finished (default active)',
          },
          title: { type: 'string', description: 'Course title' },
          courseId: { type: 'string', description: 'Course id (kebab-case)' },
          level: { type: 'string' },
          theme: { type: 'string' },
          lessons: {
            type: 'array',
            description: 'Planned lessons in order',
            items: {
              type: 'object',
              properties: {
                file: { type: 'string', description: 'NN-slug' },
                title: { type: 'string' },
              },
              required: ['file'],
            },
          },
          note: { type: 'string', description: 'One short line on where things stand' },
        },
      },
    })

    return next(e)
  })

  on('command.run', { command: 'course-builder' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Course builder pane opened.' }
  })

  // The skill starting is what opens the pane and starts a fresh summary.
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const ran = await next(e)
    if (e.skill !== 'create-course' || ran.deny !== undefined || ran.isError) return ran

    await update($, build, () => reach({ ...IDLE, isActive: true }, 'prepare', 'active'))
    void $.ui.open({ id: PANE, title: TITLE })

    return {
      ...ran,
      context: [
        ...(ran.context ?? []),
        `A "${TITLE}" pane now shows the person this course creation. Keep it current with ` +
          `the ${TOOL} tool: call it as each step starts or finishes and when the course ` +
          `title, id or lesson list is settled.`,
      ],
    }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const input = (e as unknown as { input?: Record<string, unknown> }).input ??
      (e as unknown as Record<string, unknown>)
    const step = input.step as StepId | undefined
    const status = (input.status as 'active' | 'done' | undefined) ?? 'active'
    const lessons = input.lessons as { file: string; title?: string }[] | undefined

    await update($, build, b => {
      let next: Build = { ...b, isActive: true }
      if (step && STEPS.some(s => s.id === step)) next = reach(next, step, status)
      for (const key of ['title', 'courseId', 'level', 'theme', 'note'] as const) {
        if (typeof input[key] === 'string') next = { ...next, [key]: input[key] as string }
      }
      if (lessons) {
        next = {
          ...next,
          lessons: lessons.map(l => {
            const known = b.lessons.find(k => k.file === l.file)

            return { file: l.file, title: l.title ?? known?.title, isWritten: known?.isWritten ?? false }
          }),
        }
      }

      return next
    })
    void $.ui.open({ id: PANE, title: TITLE })

    return { result: 'Course builder pane updated.' }
  })

  // Files written under courses/ fill in the write step without the model's help.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError || !(await read($, build)).isActive) return ran

    const where = coursePath(e.file_path)
    if (where?.file === 'course.yaml') {
      const lessonIds = [...e.content.matchAll(/^\s*-\s*([^\s#]+\/[^\s#]+)\s*$/gm)].map(m => m[1])
      await update($, build, b => ({
        ...reach(b, 'write', 'active'),
        title: yamlField(e.content, 'title') ?? b.title,
        courseId: yamlField(e.content, 'id') ?? where.course,
        level: yamlField(e.content, 'level') ?? b.level,
        theme: yamlField(e.content, 'theme') ?? b.theme,
        lessons: lessonIds.length
          ? mergeLessons(b.lessons, lessonIds.map(id => id.split('/').pop() as string))
          : b.lessons,
      }))
    } else if (where && /^\d+-.+\.md$/.test(where.file)) {
      const file = where.file.replace(/\.md$/, '')
      const title = yamlField(e.content, 'title')
      await update($, build, b => {
        const has = b.lessons.some(l => l.file === file)
        const lessons = has
          ? b.lessons.map(l => (l.file === file ? { ...l, title: title ?? l.title, isWritten: true } : l))
          : [...b.lessons, { file, title, isWritten: true }]
        const isAllWritten = lessons.every(l => l.isWritten)

        return { ...reach(b, 'write', isAllWritten ? 'done' : 'active'), lessons }
      })
    } else if (isIndex(e.file_path)) {
      await update($, build, b => reach(b, 'register', 'done'))
    }

    return ran
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError || !(await read($, build)).isActive) return ran
    if (isIndex(e.file_path)) await update($, build, b => reach(b, 'register', 'done'))

    return ran
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (!/check:courses/.test(e.command) || ran.deny !== undefined) return ran
    if (!(await read($, build)).isActive) return ran

    const isPassed = !ran.isError
    await update($, build, b => ({
      ...reach(b, 'validate', isPassed ? 'done' : 'active'),
      validation: isPassed ? 'pass' : 'fail',
    }))

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const b = await read($, build)

    if (!b.isActive) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No course in progress.</Text>
          <Text dimColor>Run the create-course skill to start one.</Text>
        </Box>
      )
    }

    const mark = (s: StepStatus) => (s === 'done' ? '✓' : s === 'active' ? '●' : '○')
    const written = b.lessons.filter(l => l.isWritten).length

    return (
      <Box flexDirection="column">
        <Text bold>{b.title ?? 'Untitled course'}</Text>
        {b.courseId && <Text dimColor>{b.courseId}</Text>}
        {(b.level || b.theme) && (
          <Text dimColor>{[b.level, b.theme].filter(Boolean).join(' · ')}</Text>
        )}
        <Text> </Text>
        <Text bold>Steps</Text>
        {STEPS.map(s => (
          <Text dimColor={b.steps[s.id] === 'todo'} bold={b.steps[s.id] === 'active'}>
            {mark(b.steps[s.id])} {s.label}
            {s.id === 'validate' && b.validation ? ` (${b.validation === 'pass' ? 'passed' : 'failed'})` : ''}
          </Text>
        ))}
        {b.lessons.length > 0 && <Text> </Text>}
        {b.lessons.length > 0 && (
          <Text bold>
            Lessons {written}/{b.lessons.length}
          </Text>
        )}
        {b.lessons.map(l => (
          <Text dimColor={!l.isWritten}>
            {l.isWritten ? '✓' : '○'} {l.file}
            {l.title ? ` · ${l.title}` : ''}
          </Text>
        ))}
        {b.note && <Text> </Text>}
        {b.note && <Text dimColor>{b.note}</Text>}
      </Box>
    )
  })
}
