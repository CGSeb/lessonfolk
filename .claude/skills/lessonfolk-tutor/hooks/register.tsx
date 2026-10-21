import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Choices, IdeaMarks, LessonState, View } from '../types'
import {
  changes,
  DEFAULT_INSTANCE,
  instanceUrl,
  load,
  markIdea,
  parseChoices,
  PLUGIN_SERVER,
  replyOf,
  SERVER,
  TOOL_PREFIX,
  togglePick,
} from './companion'
import { type Lang, words } from './i18n'

const PANE = 'course-companion'
// The tools this mod registers: `mcp__<plugin>__<tool>`.
const OWN_PREFIX = 'mcp__lessonfolk-tutor__'
const TOOL = 'mcp__lessonfolk-tutor__key_idea'
const CHOICES_TOOL = 'mcp__lessonfolk-tutor__choices'

const NO_IDEAS: IdeaMarks = { covered: [] }

const isActive = atom({ plugin: 'lessonfolk-tutor', key: 'isActive' } as const, false)
const choices = atom({ plugin: 'lessonfolk-tutor', key: 'choices' } as const, null as Choices | null)
const view = atom({ plugin: 'lessonfolk-tutor', key: 'view' } as const, { state: 'no-progress' } as View)
const snapshot = atom({ plugin: 'lessonfolk-tutor', key: 'snapshot' } as const, null)
const ideas = atom({ plugin: 'lessonfolk-tutor', key: 'ideas' } as const, NO_IDEAS)
// The LessonFolk instance the Dashboard button opens (local or hosted).
const instance = atom({ plugin: 'lessonfolk-tutor', key: 'instance' } as const, DEFAULT_INSTANCE)

const isSkill = (name: string | undefined, skill: string) => name === skill || name?.endsWith(`:${skill}`)

// The server's name as this session knows it: `lessonfolk` from `.mcp.json` or added by hand,
// the installed plugin's own, or the name of the connector a hosted instance was added under,
// learned from the tutor's first call to it. Until one answers, both known names are tried.
let server: string | undefined

// The server's own tools: a connector added in the desktop app is named by an id, not "lessonfolk",
// so the tool's name, not the server's, tells it is the tutor's.
const SERVER_TOOLS = new Set([
  'get_progress', 'list_courses', 'list_themes', 'get_next_lesson', 'get_lesson', 'start_lesson',
  'complete_lesson', 'skip_lesson', 'save_lesson_notes', 'set_path', 'set_profile', 'reset_course',
  'level_check_skip_course', 'record_review_score', 'import_progress',
])

const isLessonfolkTool = (tool: string) =>
  tool.startsWith(TOOL_PREFIX) ||
  (/^mcp__[^_].*lessonfolk.*?__/i.test(tool) && !tool.startsWith(OWN_PREFIX) && !tool.startsWith('mcp__course-')) ||
  (tool.startsWith('mcp__') && !tool.startsWith(OWN_PREFIX) && SERVER_TOOLS.has(tool.split('__')[2] ?? ''))

// Calls a tool of the LessonFolk MCP server with the session's own connection (and sign-in),
// so it reads the same progress as the tutor, from a local or a hosted instance.
const callServer = ($: EngineInterface, failures: string[] = []) => async (tool: string, args?: Record<string, unknown>) => {
  // The name learned from the tutor first, then the two known ones: a wrong guess never blinds the pane.
  for (const name of [...new Set([server, SERVER, PLUGIN_SERVER])]) {
    if (!name) continue
    try {
      const { content, isError } = await $.mcp.call(name, tool, args)
      const text = content.flatMap(block => (block.type === 'text' ? [block.text] : [])).join('\n')
      if (isError) {
        failures.push(`${name} ${tool}: ${text.slice(0, 120)}`)
        continue
      }
      server = name

      return text
    } catch (error) {
      // Not connected under this name: try the next one.
      failures.push(`${name} ${tool}: ${error instanceof Error ? error.message : String(error)}`.slice(0, 160))
    }
  }

  return undefined
}

// When the app refused the pane's own reads (auto permission mode, typically), the rules that
// allow them, spelled for the server name each refusal came from.
const refusedRules = (reason: string[] = []) => {
  const names = [...new Set(reason.filter(line => /refused/i.test(line)).map(line => line.split(' ')[0] ?? ''))]

  return names.flatMap(name =>
    ['get_progress', 'list_courses'].map(tool => `mcp__${name.replace(/[:.]/g, '_')}__${tool}`),
  )
}

// The settings.json fragment to paste: the pane's text cannot be selected, so it is copied.
const rulesSnippet = (rules: string[]) => JSON.stringify({ permissions: { allow: rules } }, null, 2)

// Re-reads the progress and the courses from the server; toasts what changed since the last read.
async function refresh($: EngineInterface, isQuiet = false) {
  // A relative path would resolve against the mod's own folder: read from the session's.
  const root = (await $.session.cwd()).replace(/\\/g, '/')
  const config = await $.fs.read(`${root}/.mcp.json`).then(text => text, () => undefined)
  await update($, instance, () => instanceUrl(config))

  const failures: string[] = []
  const loaded = await load(callServer($, failures))
  if (loaded.view.state === 'offline') loaded.view = { ...loaded.view, reason: [...new Set(failures)].slice(0, 3) }
  const before = await read($, snapshot)
  // Offline, the language of the last read is kept.
  loaded.view.lang ??= lastLang
  lastLang = loaded.view.lang
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

// The learner's language as of the last read, for words shown outside a render.
let lastLang: Lang | undefined

// Opens the pane; when the app keeps it waiting undrawn, says why instead of failing silently.
async function openPane($: EngineInterface) {
  hasOpened = true
  const text = words(lastLang)
  const opened = await $.ui.open({ id: PANE, title: text.title }).catch((error: unknown) => ({
    isPlaced: false as const,
    reason: error instanceof Error ? error.message : String(error),
  }))
  if (!opened.isPlaced) $.ui.toast(text.waits(opened.reason))

  return opened
}

// Learning has started: the commands band shows and the pane opens, once per run.
async function activate($: EngineInterface) {
  await update($, isActive, () => true)
  if (!hasOpened) void openPane($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'course-companion',
      description: 'Show the LessonFolk course companion pane',
    })
    await $.tool.register({
      name: 'key_idea',
      description:
        'Updates the Course companion pane while you teach a LessonFolk lesson. Call it when ' +
        'you start teaching a key idea of the current lesson (status "active") and when the ' +
        'learner has understood it (status "done"). Key ideas are numbered from 1 in the ' +
        'order of the lesson\'s "## Key ideas" section. Lesson progress comes from ' +
        'the LessonFolk server on its own; this tool only marks key ideas.',
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
        'Shows the answers to the question you just asked the LessonFolk learner as buttons ' +
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
        `A "Course companion" pane shows the learner their course, lessons and the current lesson's ` +
          `key ideas. It follows the LessonFolk server on its own. While you teach, call ` +
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
    // the question is answered, even before any progress exists (onboarding).
    await update($, isActive, () => true)

    return { result: 'The answers are shown as buttons above the prompt.' }
  })

  // Any reply, pressed or typed, answers the question: its buttons go.
  on('prompt.submit', async ($, e, next) => {
    await update($, choices, () => null)

    return next(e)
  })

  // Any call of the tutor to the LessonFolk server (a save, or reading the progress) is the
  // moment to re-read it: that is the source of truth for lessons and courses.
  let isRefreshing = false
  on('tool.call', async ($, e, next) => {
    if (!isLessonfolkTool(e.tool)) return next(e)
    const ran = await next(e)
    if (isRefreshing || ran.deny !== undefined || ran.isError) return ran

    // A tool's name spells the server with `:` and `.` replaced by `_`: the plugin's real name has colons.
    const spelled = e.tool.split('__')[1]
    server = spelled === PLUGIN_SERVER.replace(/[:.]/g, '_') ? PLUGIN_SERVER : spelled ?? server
    isRefreshing = true
    try {
      await refresh($)
      await activate($)
    } finally {
      isRefreshing = false
    }

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const offered = await read($, choices)
    if (!offered && !(await read($, isActive))) return next(e)

    const { Box, Button, Link, Text } = $.ui.resolve(e)
    const text = words((await read($, view)).lang)

    // Always last: the pane, and the dashboard of the instance the tutor works with.
    const tools = [
      <Text key="sep" dimColor>·</Text>,
      <Button key="pane" label={text.companion} onPress={() => void openPane($)} />,
      <Link key="dashboard" href={await read($, instance)} label={text.dashboard} />,
    ]

    // The tutor's question takes the band until it is answered; then the commands come back.
    if (offered) {
      const send = (reply: string) => {
        void update($, choices, () => null)
        void $.prompt.submit({ text: reply, asUser: true })
      }

      return (
        <Box flexWrap="wrap" gap={1}>
          <Text dimColor>{text.answer}</Text>
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
            <Button key="send" label={text.send} onPress={() => send(replyOf(offered))} />
          )}
          {tools}
        </Box>
      )
    }

    return (
      <Box gap={1}>
        <Text dimColor>{text.say}</Text>
        {text.commands.map(c => (
          <Button key={c.key} label={c.label} onPress={() => void $.prompt.submit({ text: c.text, asUser: true })} />
        ))}
        {tools}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const v = await read($, view)
    const marks = await read($, ideas)
    const text = words(v.lang)

    if (v.state === 'no-progress' || v.state === 'offline' || v.state === 'all-done') {
      const lines = {
        'no-progress': text.noProgress,
        offline: text.offline,
        'all-done': text.allDone,
      }[v.state]

      const rules = refusedRules(v.reason)
      const hint = rules.length > 0 ? text.refused : (v.reason ?? [])

      return (
        <Box flexDirection="column">
          {[...lines, ...hint, ...rules].map(line => (
            <Text dimColor>{line}</Text>
          ))}
          {rules.length > 0 && (
            <Button
              key="copy-rules"
              label={text.copyRules}
              onPress={async press => {
                const { isCopied } = await $.ui.copy({ text: rulesSnippet(rules), surface: press.surface })
                $.ui.toast(isCopied ? text.copied : text.copyFailed)
              }}
            />
          )}
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
          <Text dimColor>{[v.themeTitle, v.level && (text.levels[v.level] ?? v.level)].filter(Boolean).join(' · ')}</Text>
        )}
        <Text> </Text>
        <Text bold>
          {text.lessons} {finished}/{lessons.length}
        </Text>
        {lessons.map(l => (
          <Text dimColor={l.status !== 'current'} bold={l.status === 'current'}>
            {mark(l.status)} {l.title}
            {l.status === 'skipped' ? ` ${text.skipped}` : ''}
          </Text>
        ))}
        {v.current && v.current.ideas.length > 0 && <Text> </Text>}
        {v.current && v.current.ideas.length > 0 && <Text bold>{text.keyIdeas}</Text>}
        {v.current?.ideas.map((idea, i) => (
          <Text dimColor={ideaMark(i + 1) === '✓'} bold={ideaMark(i + 1) === '●'}>
            {ideaMark(i + 1)} {i + 1}. {idea}
          </Text>
        ))}
        {v.next && <Text> </Text>}
        {v.next && (
          <Text>
            {text.next} {v.next.title}
            {v.next.courseTitle ? ` (${v.next.courseTitle})` : ''}
          </Text>
        )}
      </Box>
    )
  })
}
