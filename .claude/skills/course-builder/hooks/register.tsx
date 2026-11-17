import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Build, BuildKind, Lesson, StepId, StepStatus } from '../types'

const PANE = 'course-builder'
const TOOL = 'mcp__course-builder__progress'

/** The pane follows the create-course and create-project skills, with the words of each. */
const KINDS: Record<BuildKind, { skill: string; title: string; noun: string; write: string; register: string }> = {
  course: {
    skill: 'create-course',
    title: 'Course builder',
    noun: 'course',
    write: 'Write course.yaml and lessons',
    register: 'Register in index.yaml',
  },
  project: {
    skill: 'create-project',
    title: 'Project builder',
    noun: 'project',
    write: 'Write the project (English, then French)',
    register: 'Register in projects/en/index.yaml',
  },
}

const STEP_IDS: StepId[] = ['prepare', 'interview', 'outline', 'write', 'register', 'validate', 'handback']

const stepLabel = (kind: BuildKind, id: StepId): string =>
  ({
    prepare: 'Prepare (read format, catalog)',
    interview: 'Interview the author',
    outline: 'Outline approved',
    write: KINDS[kind].write,
    register: KINDS[kind].register,
    validate: 'Validate (check:courses)',
    handback: 'Hand back',
  })[id]

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

const kindOf = (b: Build): BuildKind => b.kind ?? 'course'

const slash = (path: string) => path.replace(/\\/g, '/')

// courses/<lang>/<course>/<file>, wherever the repository sits.
const coursePath = (path: string) => {
  const match = /(?:^|\/)courses\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(slash(path))

  return match ? { lang: match[1], course: match[2], file: match[3] } : undefined
}

const isIndex = (path: string) => /(?:^|\/)courses\/[^/]+\/index\.yaml$/.test(slash(path))

// projects/<lang>/<project>.md, wherever the repository sits.
const projectPath = (path: string) => {
  const match = /(?:^|\/)projects\/([^/]+)\/([^/]+)\.md$/.exec(slash(path))

  return match ? { lang: match[1], project: match[2] } : undefined
}

const isProjectIndex = (path: string) => /(?:^|\/)projects\/en\/index\.yaml$/.test(slash(path))

const yamlField = (text: string, key: string) =>
  new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(text)?.[1]?.trim().replace(/^["']|["']$/g, '')

// The bold titles of the numbered items of "## Milestones" (`1. **Choose the task.** …`).
const milestoneTitles = (text: string): string[] => {
  const section = /^##[ \t]+Milestones[ \t]*\r?\n([\s\S]*?)(?=^##[ \t]|$(?![\s\S]))/m.exec(text)?.[1] ?? ''
  return [...section.matchAll(/^\d+[.)][ \t]+(?:\*\*(.+?)\*\*)?(.*)$/gm)].map(m =>
    (m[1] ?? m[2]).trim().replace(/[.:]$/, ''),
  )
}

// Marks `step` and moves every earlier unfinished step to done: steps run in order.
const reach = (b: Build, step: StepId, status: StepStatus): Build => {
  const at = STEP_IDS.indexOf(step)
  const steps = { ...b.steps }
  STEP_IDS.forEach((id, i) => {
    if (i < at && steps[id] !== 'done') steps[id] = 'done'
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
      description: 'Show the course or project creation summary pane',
    })
    await $.tool.register({
      name: 'progress',
      description:
        'Updates the builder pane while you run the create-course or create-project skill of LessonFolk. ' +
        'Call it whenever a step of the "Create a course" or "Create a project" procedure starts or finishes ' +
        '(prepare, interview, outline, write, register, validate, handback), and as soon as ' +
        'the title, id, level, theme, lesson list (course) or milestone titles (project) are known or ' +
        'change (for example once the outline is proposed). Files you write under courses/ and ' +
        'projects/ are tracked on their own.',
      inputSchema: {
        type: 'object',
        properties: {
          step: {
            type: 'string',
            enum: STEP_IDS,
            description: 'The workflow step this update is about',
          },
          status: {
            type: 'string',
            enum: ['active', 'done'],
            description: 'Whether the step has started or is finished (default active)',
          },
          title: { type: 'string', description: 'Course or project title' },
          courseId: { type: 'string', description: 'Course id or project id (kebab-case)' },
          level: { type: 'string' },
          theme: { type: 'string' },
          lessons: {
            type: 'array',
            description: 'A course: planned lessons in order',
            items: {
              type: 'object',
              properties: {
                file: { type: 'string', description: 'NN-slug' },
                title: { type: 'string' },
              },
              required: ['file'],
            },
          },
          milestones: {
            type: 'array',
            description: 'A project: planned milestone titles in order',
            items: { type: 'string' },
          },
          note: { type: 'string', description: 'One short line on where things stand' },
        },
      },
    })

    return next(e)
  })

  on('command.run', { command: 'course-builder' }, async $ => {
    const kind = kindOf(await read($, build))
    await $.ui.open({ id: PANE, title: KINDS[kind].title })

    return { text: `${KINDS[kind].title} pane opened.` }
  })

  // The skill starting is what opens the pane and starts a fresh summary.
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const ran = await next(e)
    const kind = (Object.keys(KINDS) as BuildKind[]).find(k => KINDS[k].skill === e.skill)
    if (!kind || ran.deny !== undefined || ran.isError) return ran

    const { title, noun } = KINDS[kind]
    await update($, build, () => reach({ ...IDLE, kind, isActive: true }, 'prepare', 'active'))
    void $.ui.open({ id: PANE, title })

    return {
      ...ran,
      context: [
        ...(ran.context ?? []),
        `A "${title}" pane now shows the person this ${noun} creation. Keep it current with ` +
          `the ${TOOL} tool: call it as each step starts or finishes and when the ${noun} ` +
          `title, id or ${kind === 'course' ? 'lesson list' : 'milestone titles'} are settled.`,
      ],
    }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const input = (e as unknown as { input?: Record<string, unknown> }).input ??
      (e as unknown as Record<string, unknown>)
    const step = input.step as StepId | undefined
    const status = (input.status as 'active' | 'done' | undefined) ?? 'active'
    const lessons = input.lessons as { file: string; title?: string }[] | undefined
    const milestones = input.milestones as unknown

    await update($, build, b => {
      let next: Build = { ...b, isActive: true }
      if (step && STEP_IDS.includes(step)) next = reach(next, step, status)
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
      if (Array.isArray(milestones)) {
        next = { ...next, milestones: milestones.filter((m): m is string => typeof m === 'string') }
      }

      return next
    })
    const title = KINDS[kindOf(await read($, build))].title
    void $.ui.open({ id: PANE, title })

    return { result: `${title} pane updated.` }
  })

  // Files written under courses/ and projects/ fill in the write step without the model's help.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    const current = await read($, build)
    if (ran.deny !== undefined || ran.isError || !current.isActive) return ran

    if (kindOf(current) === 'project') {
      const where = projectPath(e.file_path)
      if (where) {
        await update($, build, b => {
          const projectFiles = [...new Set([...(b.projectFiles ?? []), where.lang])]
          const isEnglish = where.lang === 'en'
          const titles = isEnglish ? milestoneTitles(e.content) : []
          return {
            // English first, then its translation: the step is done once a second language is written.
            ...reach(b, 'write', projectFiles.length > 1 ? 'done' : 'active'),
            projectFiles,
            ...(isEnglish && {
              title: yamlField(e.content, 'title') ?? b.title,
              courseId: yamlField(e.content, 'id') ?? where.project,
              level: yamlField(e.content, 'level') ?? b.level,
              theme: yamlField(e.content, 'theme') ?? b.theme,
              milestones: titles.length ? titles : b.milestones,
            }),
          }
        })
      } else if (isProjectIndex(e.file_path)) {
        await update($, build, b => reach(b, 'register', 'done'))
      }
      return ran
    }

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
    const current = await read($, build)
    if (ran.deny !== undefined || ran.isError || !current.isActive) return ran
    const isRegistered = kindOf(current) === 'project' ? isProjectIndex(e.file_path) : isIndex(e.file_path)
    if (isRegistered) await update($, build, b => reach(b, 'register', 'done'))

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
          <Text dimColor>No course or project in progress.</Text>
          <Text dimColor>Run the create-course or create-project skill to start one.</Text>
        </Box>
      )
    }

    const kind = kindOf(b)
    const mark = (s: StepStatus) => (s === 'done' ? '✓' : s === 'active' ? '●' : '○')
    const written = b.lessons.filter(l => l.isWritten).length
    const milestones = b.milestones ?? []
    const files = b.projectFiles ?? []

    return (
      <Box flexDirection="column">
        <Text bold>{b.title ?? `Untitled ${KINDS[kind].noun}`}</Text>
        {b.courseId && <Text dimColor>{b.courseId}</Text>}
        {(b.level || b.theme) && (
          <Text dimColor>{[b.level, b.theme].filter(Boolean).join(' · ')}</Text>
        )}
        <Text> </Text>
        <Text bold>Steps</Text>
        {STEP_IDS.map(id => (
          <Text dimColor={b.steps[id] === 'todo'} bold={b.steps[id] === 'active'}>
            {mark(b.steps[id])} {stepLabel(kind, id)}
            {id === 'validate' && b.validation ? ` (${b.validation === 'pass' ? 'passed' : 'failed'})` : ''}
          </Text>
        ))}
        {kind === 'course' && b.lessons.length > 0 && <Text> </Text>}
        {kind === 'course' && b.lessons.length > 0 && (
          <Text bold>
            Lessons {written}/{b.lessons.length}
          </Text>
        )}
        {kind === 'course' &&
          b.lessons.map(l => (
            <Text dimColor={!l.isWritten}>
              {l.isWritten ? '✓' : '○'} {l.file}
              {l.title ? ` · ${l.title}` : ''}
            </Text>
          ))}
        {kind === 'project' && milestones.length > 0 && <Text> </Text>}
        {kind === 'project' && milestones.length > 0 && <Text bold>Milestones {milestones.length}</Text>}
        {kind === 'project' &&
          milestones.map((title, i) => (
            <Text>
              {i + 1}. {title}
            </Text>
          ))}
        {kind === 'project' && <Text> </Text>}
        {kind === 'project' && (
          <Text dimColor={files.length === 0}>
            Files: {['en', 'fr'].map(lang => `${files.includes(lang) ? '✓' : '○'} ${lang}`).join('  ')}
          </Text>
        )}
        {b.note && <Text> </Text>}
        {b.note && <Text dimColor>{b.note}</Text>}
      </Box>
    )
  })
}
