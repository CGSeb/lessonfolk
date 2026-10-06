import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Choices, Dashboard, IdeaMarks, LessonState, View } from '../types'
import {
  changes,
  dashboardUrl,
  isProgressFile,
  PROGRESS,
  load,
  markIdea,
  parseChoices,
  replyOf,
  togglePick,
} from './companion'

const PANE = 'course-companion'
const TITLE = 'Course companion'
const TOOL = 'mcp__course-companion__key_idea'
const CHOICES_TOOL = 'mcp__course-companion__choices'

const NO_IDEAS: IdeaMarks = { covered: [] }

const isActive = atom({ plugin: 'course-companion', key: 'isActive' } as const, false)
const choices = atom({ plugin: 'course-companion', key: 'choices' } as const, null as Choices | null)
const view = atom({ plugin: 'course-companion', key: 'view' } as const, { state: 'no-progress' } as View)
const snapshot = atom({ plugin: 'course-companion', key: 'snapshot' } as const, null)
const ideas = atom({ plugin: 'course-companion', key: 'ideas' } as const, NO_IDEAS)
const dashboard = atom({ plugin: 'course-companion', key: 'dashboard' } as const, { status: 'off' } as Dashboard)

// The learner commands of AGENTS.md, offered as buttons above the prompt.
const COMMANDS = [
  { key: 'continue', label: 'Continue', text: 'continue' },
  { key: 'quiz', label: 'Quiz me', text: 'quiz me' },
  { key: 'skip', label: 'Skip', text: 'skip this' },
  { key: 'progress', label: 'My progress', text: 'show my progress' },
]

const isSkill = (name: string | undefined, skill: string) => name === skill || name?.endsWith(`:${skill}`)

// Re-reads progress.json and the course files; toasts what changed since the last read.
async function refresh($: EngineInterface, isQuiet = false) {
  // A relative path would resolve against the mod's own folder: read from the session's.
  const root = (await $.session.cwd()).replace(/\\/g, '/')
  const loaded = await load(path => $.fs.read(`${root}/${path}`).then(text => text, () => undefined))
  const before = await read($, snapshot)
  const previous = before ? { snapshot: before, view: await read($, view) } : undefined
  await update($, view, () => loaded.view)
  await update($, snapshot, () => loaded.snapshot)
  await update($, ideas, marks =>
    marks.lessonId && marks.lessonId === loaded.view.current?.id ? marks : NO_IDEAS,
  )
  if (!isQuiet) for (const text of changes(previous, loaded)) $.ui.toast(text)
}

// Whether this run of the app opened the pane yet. `isActive` is kept with the session and
// survives a restart, but the pane does not, so the pane opens once per run of the module.
let hasOpened = false

// Opens the pane; when the app keeps it waiting undrawn, says why instead of failing silently.
async function openPane($: EngineInterface) {
  hasOpened = true
  const opened = await $.ui.open({ id: PANE, title: TITLE }).catch((error: unknown) => ({
    isPlaced: false as const,
    reason: error instanceof Error ? error.message : String(error),
  }))
  if (!opened.isPlaced) $.ui.toast(`${TITLE} waits: ${opened.reason}`)

  return opened
}

// Learning has started: the commands band shows and the pane opens, once per run.
async function activate($: EngineInterface) {
  await update($, isActive, () => true)
  if (!hasOpened) void openPane($)
}

// Starts the dashboard (`astro dev` in dashboard/, what `npm run dashboard` runs) for the
// session's life: node runs Astro's CLI directly, since there is no shell to find npm with.
// The server stops with the app, or when the mod reloads.
async function startDashboard($: EngineInterface) {
  if ((await read($, dashboard)).status !== 'off') return
  await update($, dashboard, () => ({ status: 'starting' as const }))

  const root = (await $.session.cwd()).replace(/\\/g, '/')
  const astro = [`${root}/node_modules/astro/bin/astro.mjs`, `${root}/dashboard/node_modules/astro/bin/astro.mjs`]
  const cli = (await Promise.all(astro.map(path => $.fs.exists(path)))).findIndex(Boolean)
  if (cli < 0) {
    await update($, dashboard, () => ({ status: 'off' as const }))
    $.ui.toast('Dashboard: run npm install first, then press Dashboard again.')

    return
  }

  let output = ''
  try {
    const server = $.process.spawn({ argv: ['node', astro[cli] as string, 'dev'], cwd: `${root}/dashboard` })
    for await (const { text } of server) {
      if ((await read($, dashboard)).status === 'running') continue
      output = (output + text).slice(-4000)
      const url = dashboardUrl(output)
      if (url) {
        await update($, dashboard, () => ({ status: 'running' as const, url }))
        $.ui.toast(`Dashboard running at ${url}`)
      }
    }
    $.ui.toast('Dashboard stopped.')
  } catch (error) {
    $.ui.toast(`Dashboard could not start: ${error instanceof Error ? error.message : String(error)}`)
  }
  await update($, dashboard, () => ({ status: 'off' as const }))
}

async function onSaved($: EngineInterface, path: string) {
  if (!isProgressFile(path)) return
  await refresh($)
  await activate($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'course-companion',
      description: 'Show the Apprentice course companion pane',
    })
    await $.tool.register({
      name: 'key_idea',
      description:
        'Updates the Course companion pane while you teach an Apprentice lesson. Call it when ' +
        'you start teaching a key idea of the current lesson (status "active") and when the ' +
        'learner has understood it (status "done"). Key ideas are numbered from 1 in the ' +
        'order of the lesson\'s "## Key ideas" section. Lesson progress comes from ' +
        '.progress/progress.json on its own; this tool only marks key ideas.',
      inputSchema: {
        type: 'object',
        properties: {
          lesson: { type: 'string', description: 'Lesson id, e.g. ai-foundations/02-how-machines-learn' },
          keyIdea: { type: 'integer', minimum: 1, description: 'Key idea number, from 1' },
          status: {
            type: 'string',
            enum: ['active', 'done'],
            description: 'Started teaching it, or understood (default active)',
          },
        },
        required: ['lesson', 'keyIdea'],
      },
    })
    await $.tool.register({
      name: 'choices',
      description:
        'Shows the answers to the question you just asked the Apprentice learner as buttons ' +
        'above the prompt; a press sends that answer as the learner\'s reply. Call it after ' +
        'asking a question with a fixed set of answers you listed: onboarding (experience, ' +
        'goal, themes to explore), accepting a path, "continue now or stop here?", yes/no. ' +
        'Never call it for "Check your understanding", review or level check questions: the ' +
        'learner answers those in their own words. The learner can always type instead.',
      inputSchema: {
        type: 'object',
        properties: {
          options: {
            type: 'array',
            minItems: 2,
            maxItems: 8,
            description: 'The answers, in the order you listed them',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: 'Short button text (1-4 words)' },
                reply: { type: 'string', description: 'What a press sends, when not the label' },
              },
              required: ['label'],
            },
          },
          multiSelect: {
            type: 'boolean',
            description: 'True when the learner may pick several (then a Send button sends them)',
          },
        },
        required: ['options'],
      },
    })
    // A dashboard started before the app closed or the mod reloaded stopped with it.
    await update($, dashboard, () => ({ status: 'off' as const }))
    await refresh($, true)
    // A resumed session where the learner was already learning gets its pane back.
    if (await read($, isActive)) void openPane($)

    return next(e)
  })

  on('command.run', { command: 'course-companion' }, async $ => {
    await refresh($, true)
    const opened = await openPane($)

    return {
      text: opened.isPlaced
        ? 'Course companion pane opened.'
        : `Course companion pane could not be shown: ${opened.reason}`,
    }
  })

  // The learn skill starting is what opens the pane; review and progress keep it current.
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined || ran.isError) return ran
    if (!['learn', 'review', 'progress'].some(skill => isSkill(e.skill, skill))) return ran

    await refresh($, true)
    if (!isSkill(e.skill, 'learn')) return ran

    await activate($)

    return {
      ...ran,
      context: [
        ...(ran.context ?? []),
        `A "${TITLE}" pane shows the learner their course, lessons and the current lesson's ` +
          `key ideas. It follows .progress/progress.json on its own. While you teach, call ` +
          `the ${TOOL} tool as you start each key idea (status "active") and once the learner ` +
          `has it (status "done"). After asking a question with a fixed set of answers ` +
          `(onboarding, path, continue or stop), call ${CHOICES_TOOL} so the learner can ` +
          `answer with a button; never for check-your-understanding, review or level check questions.`,
      ],
    }
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    const input = (e as unknown as { input?: Record<string, unknown> }).input ??
      (e as unknown as Record<string, unknown>)
    const lesson = typeof input.lesson === 'string' ? input.lesson : undefined
    const keyIdea = Number(input.keyIdea)
    const status = input.status === 'done' ? 'done' : 'active'
    if (!lesson || !Number.isInteger(keyIdea) || keyIdea < 1) {
      return { result: 'Nothing updated: give the lesson id and a key idea number from 1.' }
    }

    const current = (await read($, view)).current
    if (current?.id !== lesson) await refresh($, true)
    await update($, ideas, marks => markIdea(marks, lesson, keyIdea, status))
    await activate($)

    return { result: 'Course companion pane updated.' }
  })

  on('tool.call', { tool: CHOICES_TOOL }, async ($, e) => {
    const input = (e as unknown as { input?: Record<string, unknown> }).input ??
      (e as unknown as Record<string, unknown>)
    const offered = parseChoices(input)
    if (!offered) return { result: 'Nothing shown: give 2 to 8 options, each with a label.' }

    await update($, choices, () => offered)
    // The tutor asking the learner something means a learning session: the band stays once
    // the question is answered, even before progress.json exists (onboarding).
    await update($, isActive, () => true)

    return { result: 'The answers are shown as buttons above the prompt.' }
  })

  // Any reply, pressed or typed, answers the question: its buttons go.
  on('prompt.submit', async ($, e, next) => {
    await update($, choices, () => null)

    return next(e)
  })

  // The tutor saving progress.json is the source of truth for lessons and courses.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) await onSaved($, e.file_path)

    return ran
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && !ran.isError) await onSaved($, e.file_path)

    return ran
  })

  // The tutor sometimes saves progress from a shell command (node -e, jq…): re-read after any
  // command that names the progress file. Reading it only changes nothing, so no toast follows.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny === undefined && /\.progress|progress\.json/.test(e.command)) {
      await onSaved($, PROGRESS)
    }

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const offered = await read($, choices)
    if (!offered && !(await read($, isActive))) return next(e)

    const { Box, Button, Link, Text } = $.ui.resolve(e)

    // Always last: the pane, and the dashboard (a button to start it, a link once it runs).
    const server = await read($, dashboard)
    const tools = [
      <Text key="sep" dimColor>·</Text>,
      <Button key="pane" label="Companion" onPress={() => void openPane($)} />,
      server.status === 'running' && server.url
        ? <Link key="dashboard" href={server.url} label="Dashboard ↗" />
        : server.status === 'starting'
          ? <Text key="dashboard" dimColor>Dashboard starting…</Text>
          : <Button key="dashboard" label="Dashboard" onPress={() => void startDashboard($)} />,
    ]

    // The tutor's question takes the band until it is answered; then the commands come back.
    if (offered) {
      const send = (text: string) => {
        void update($, choices, () => null)
        void $.prompt.submit({ text, asUser: true })
      }

      return (
        <Box flexWrap="wrap" gap={1}>
          <Text dimColor>Answer:</Text>
          {offered.options.map((o, i) => (
            <Button
              key={`choice-${i}`}
              label={offered.isMulti && offered.picked.includes(i) ? `✓ ${o.label}` : o.label}
              onPress={() =>
                offered.isMulti ? void update($, choices, c => (c ? togglePick(c, i) : c)) : send(o.reply)
              }
            />
          ))}
          {offered.isMulti && offered.picked.length > 0 && (
            <Button key="send" label="Send" onPress={() => send(replyOf(offered))} />
          )}
          {tools}
        </Box>
      )
    }

    return (
      <Box gap={1}>
        <Text dimColor>Say:</Text>
        {COMMANDS.map(c => (
          <Button key={c.key} label={c.label} onPress={() => void $.prompt.submit({ text: c.text, asUser: true })} />
        ))}
        {tools}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const v = await read($, view)
    const marks = await read($, ideas)

    if (v.state === 'no-progress' || v.state === 'invalid' || v.state === 'all-done') {
      const lines = {
        'no-progress': ['No course started yet.', 'Say "start" to begin.'],
        invalid: ['Your progress file could not be read.', 'Ask the tutor to check .progress/progress.json.'],
        'all-done': ['You have finished every course. Well done!', 'Ask the tutor what to explore next.'],
      }[v.state]

      return (
        <Box flexDirection="column">
          {lines.map(line => (
            <Text dimColor>{line}</Text>
          ))}
        </Box>
      )
    }

    const lessons = v.lessons ?? []
    const finished = lessons.filter(l => l.status === 'done' || l.status === 'skipped').length
    const mark = (s: LessonState['status']) =>
      ({ done: '✓', skipped: '↷', current: '●', todo: '○' })[s]
    const ideaMark = (i: number) =>
      marks.covered.includes(i) ? '✓' : marks.active === i ? '●' : '○'

    return (
      <Box flexDirection="column">
        <Text bold>{v.courseTitle}</Text>
        {(v.themeTitle || v.level) && (
          <Text dimColor>{[v.themeTitle, v.level].filter(Boolean).join(' · ')}</Text>
        )}
        <Text> </Text>
        <Text bold>
          Lessons {finished}/{lessons.length}
        </Text>
        {lessons.map(l => (
          <Text dimColor={l.status !== 'current'} bold={l.status === 'current'}>
            {mark(l.status)} {l.title}
            {l.status === 'skipped' ? ' (skipped)' : ''}
          </Text>
        ))}
        {v.current && v.current.ideas.length > 0 && <Text> </Text>}
        {v.current && v.current.ideas.length > 0 && <Text bold>Key ideas</Text>}
        {v.current?.ideas.map((idea, i) => (
          <Text dimColor={ideaMark(i + 1) === '✓'} bold={ideaMark(i + 1) === '●'}>
            {ideaMark(i + 1)} {i + 1}. {idea}
          </Text>
        ))}
        {v.next && <Text> </Text>}
        {v.next && (
          <Text>
            Next: {v.next.title}
            {v.next.courseTitle ? ` (${v.next.courseTitle})` : ''}
          </Text>
        )}
      </Box>
    )
  })
}
