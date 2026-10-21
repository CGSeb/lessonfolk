import type { On, RenderPropsOf } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { describe, expect, test } from 'claude-code/testing'

import { answer, progress, type Saved } from './server'

const PLUGIN = 'lessonfolk-tutor'
const PANE_ID = 'course-companion'
const TOOL = 'mcp__lessonfolk-tutor__key_idea'
const CHOICES = 'mcp__lessonfolk-tutor__choices'
const LESSONFOLK = 'mcp__lessonfolk__start_lesson'

const PANE = {
  component: 'Pane',
  requestId: PANE_ID,
  props: { title: 'Course companion', isFocused: false } as unknown as RenderPropsOf['Pane'],
} as const
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as unknown as RenderPropsOf['AbovePrompt'],
} as const

// The LessonFolk server as the mod sees it: the learner's saved progress, whether it answers,
// who asked it, the project's .mcp.json, if any, and the only names it is connected under
// (any name when absent), and the refusal it answers every call with, if any.
type Server = { saved: Saved; isUp: boolean; asked: string[]; mcpJson?: string; names?: string[]; refusal?: string }

const newServer = (saved: Saved = { lessons: {}, current: null }): Server => ({ saved, isUp: true, asked: [] })

// The engine beneath the mod: the server from memory, every tool call succeeding, what the
// mod shows (toasts, panes, prompts) recorded.
const engine = (on: On, server: Server, unplaced?: string) => {
  const seen = { copied: [] as string[], toasts: [] as string[], opened: [] as string[], prompts: [] as string[], framed: [] as string[] }
  // The session runs in D:\repo (a relative path would land in the mod's own folder).
  on('session.cwd', async () => ({ value: 'D:\\repo' }) as never)
  on('fs.read', async (_$, e) => {
    if (e.path.replace(/\\/g, '/') !== 'D:/repo/.mcp.json' || server.mcpJson === undefined) {
      throw new Error(`ENOENT: ${e.path}`)
    }

    return { value: server.mcpJson } as never
  })
  on('mcp.call', async (_$, e) => {
    if (server.refusal) return { value: { content: [{ type: 'text', text: server.refusal }], isError: true } } as never
    if (server.names && !server.names.includes(e.server)) throw new Error(`No MCP server named ${e.server}`)
    server.asked.push(`${e.server}:${e.tool}`)
    const text = server.isUp ? answer(() => server.saved, e.tool, e.args) : undefined

    return {
      value: text === undefined
        ? { content: [{ type: 'text', text: 'unavailable' }], isError: true }
        : { content: [{ type: 'text', text }], isError: false },
    } as never
  })
  on('tool.call', async () => ({ result: 'ok' }) as never)
  on('ui.copy', async (_$, e) => {
    seen.copied.push(e.text)

    return { value: { isCopied: true } } as never
  })
  on('ui.toast', async (_$, e) => {
    seen.toasts.push(e.text)

    return { value: undefined } as never
  })
  on('ui.open', async (_$, e) => {
    seen.opened.push(e.id)

    return { value: unplaced ? { isPlaced: false, reason: unplaced } : { isPlaced: true } } as never
  })
  on('prompt.submit', async (_$, e) => {
    seen.prompts.push(e.text)
    // A press is the learner's reply: read bare, not as "The course-companion plugin sent a message".
    if (e.origin?.kind === 'plugin' && !e.origin.asUser) seen.framed.push(e.text)

    return { text: e.text }
  })
  on('command.run', async () => ({ value: { text: '' } }) as never)
  on('ui.render', { component: 'AbovePrompt' }, async ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })

  return seen
}

// The tutor saves through the LessonFolk server; its tool call ends and the mod reads again.
const save = ($: Engine, server: Server, saved: Saved, id: string, tool = LESSONFOLK) => {
  server.saved = saved

  return $.tool.call({ tool, tool_use_id: id } as never)
}

const STARTED = progress('basics/01-one', { 'basics/01-one': 'in_progress' })

describe('course companion', () => {
  test('saving progress opens the pane on the current lesson', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)
    await save($, server, STARTED, 't1')

    expect(seen.opened).toEqual([PANE_ID])
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...PANE })
      expect(await ui.find({ type: 'Text', text: 'Basics' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Understanding AI · beginner' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Lessons 0/2' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '○ 1. What AI is' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Next: Lesson two' })).toBeDefined()
      await ui.unmount()
    }
    expect(server.asked).toContain('lessonfolk:get_progress')
    expect(server.asked).toContain('lessonfolk:list_courses')
    expect(server.asked).toContain('lessonfolk:get_lesson')
  })

  test('the server the installed plugin brought is asked by its plugin name', async ($, on) => {
    const server = { ...newServer(STARTED), names: ['plugin:lessonfolk-tutor:lessonfolk'] }
    engine(on, server)
    await $.command.run({ command: 'course-companion', args: '' } as never)

    expect(server.asked).toContain('plugin:lessonfolk-tutor:lessonfolk:get_progress')
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
    await ui.unmount()
  })

  test('a save through the plugin\'s tools keeps the pane current under the plugin name', async ($, on) => {
    const server = { ...newServer(), names: ['plugin:lessonfolk-tutor:lessonfolk'] }
    engine(on, server)
    await save($, server, STARTED, 't1', 'mcp__plugin_lessonfolk-tutor_lessonfolk__start_lesson')
    await save(
      $,
      server,
      progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }),
      't2',
      'mcp__plugin_lessonfolk-tutor_lessonfolk__complete_lesson',
    )

    expect(server.asked.every(call => call.startsWith('plugin:lessonfolk-tutor:lessonfolk:'))).toBe(true)
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '● Lesson two' })).toBeDefined()
    await ui.unmount()
  })

  test('a connector named by an id is recognised by the tutor\'s tool names', async ($, on) => {
    const id = 'c7d0b443-30eb-4e13-9b06-6e6e2aae9b8d'
    const server = { ...newServer(), names: [id] }
    engine(on, server)
    await save($, server, STARTED, 't1', `mcp__${id}__start_lesson`)

    expect(server.asked.every(call => call.startsWith(`${id}:`))).toBe(true)
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
    await ui.unmount()
  })

  test('a hosted server added under another name is asked by that name', async ($, on) => {
    const server = newServer()
    engine(on, server)
    await save($, server, STARTED, 't1', 'mcp__claude_ai_LessonFolk__get_progress')

    expect(server.asked.every(call => call.startsWith('claude_ai_LessonFolk:'))).toBe(true)
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...PANE })
    expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
    await ui.unmount()
  })

  test('the key idea tool marks where the tutor is', async ($, on) => {
    const server = newServer()
    engine(on, server)
    await save($, server, STARTED, 't1')
    const ran = await $.tool.call({ tool: TOOL, tool_use_id: 't2', lesson: 'basics/01-one', keyIdea: 2, status: 'active' } as never)
    expect(ran.deny).toBeUndefined()

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '✓ 1. What AI is' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '● 2. Narrow vs general' })).toBeDefined()
    await ui.unmount()
  })

  test('finishing a lesson toasts it and moves the pane on', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)
    await save($, server, STARTED, 't1')
    await save($, server, progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }), 't2')

    expect(seen.toasts).toContain('Lesson complete: Lesson one')
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '✓ Lesson one' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '● Lesson two' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Lessons 1/2' })).toBeDefined()
    await ui.unmount()
  })

  test('a French learner gets the pane, the commands band and the toasts in French', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)
    await save($, server, progress('basics/01-one', { 'basics/01-one': 'in_progress' }, undefined, 'fr'), 't1')
    await save($, server, progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }, undefined, 'fr'), 't2')

    expect(seen.toasts).toContain('Leçon terminée : Lesson one')
    const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await pane.find({ type: 'Text', text: 'Understanding AI · débutant' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'Leçons 1/2' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'Suivante : Lesson three (Next Steps)' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'Idées clés' })).toBeDefined()
    await pane.unmount()

    const band = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await band.find({ type: 'Button', text: 'Interroge-moi' })).toBeDefined()
    expect(await band.find({ type: 'Button', text: 'Quiz me' })).toBeUndefined()
    await band.press({ key: 'quiz' })
    await band.unmount()
    expect(seen.prompts).toEqual(['interroge-moi'])
  })

  test('a server that does not answer says so in the pane', async ($, on) => {
    const server = newServer(STARTED)
    server.isUp = false
    engine(on, server)
    await save($, server, STARTED, 't1')

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: 'Your progress could not be read.' })).toBeDefined()
    await ui.unmount()
  })

  test('a server that cannot be reached says why in the pane', async ($, on) => {
    const server = newServer(STARTED)
    server.names = []
    engine(on, server)
    await save($, server, STARTED, 't1')

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: 'Your progress could not be read.' })).toBeDefined()
    const lines = (await ui.findAll({ type: 'Text' })).map(node => node.text)
    expect(lines.some(line => line?.startsWith('lessonfolk get_progress: '))).toBe(true)
    await ui.unmount()
  })

  test('a refused read lists the permission rules that allow it, and a button copies them', async ($, on) => {
    const server = newServer(STARTED)
    const seen = engine(on, server)
    server.refusal = '$.mcp.call(refused: auto mode'
    await save($, server, STARTED, 't1', 'mcp__plugin_lessonfolk-tutor_lessonfolk__start_lesson')

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    const lines = (await ui.findAll({ type: 'Text' })).map(node => node.text ?? '')
    expect(lines.some(line => line === 'mcp__plugin_lessonfolk-tutor_lessonfolk__get_progress')).toBe(true)

    await ui.press({ key: 'copy-rules' })
    expect(JSON.parse(seen.copied[0] ?? '{}').permissions.allow).toContain('mcp__plugin_lessonfolk-tutor_lessonfolk__list_courses')
    expect(seen.toasts.at(-1)).toContain('Copied')
    await ui.unmount()
  })

  test('the commands band appears once learning starts and sends the command',async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)

    const before = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await before.find({ type: 'Button' })).toBeUndefined()
    await before.unmount()

    await save($, server, STARTED, 't1')
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...BAND })
      expect(await ui.find({ type: 'Button', text: 'Quiz me' })).toBeDefined()
      await ui.press({ key: 'quiz' })
      await ui.unmount()
    }
    expect(seen.prompts).toEqual(['quiz me', 'quiz me'])
    expect(seen.framed).toEqual([])
  })

  test('the answers to the tutor\'s question show as buttons, even during onboarding', async ($, on) => {
    const seen = engine(on, newServer())
    await $.tool.call({
      tool: CHOICES,
      tool_use_id: 'c1',
      options: [{ label: 'None' }, { label: 'Used ChatGPT', reply: 'used ChatGPT-like tools' }],
    } as never)

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...BAND })
      expect(await ui.find({ type: 'Text', text: 'Answer:' })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: 'None' })).toBeDefined()
      expect(await ui.find({ type: 'Button', text: 'Continue' })).toBeUndefined()
      expect(await ui.find({ type: 'Button', text: 'Companion' })).toBeDefined()
      await ui.unmount()
    }

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    await ui.press({ key: 'choice-1' })
    expect(seen.prompts).toEqual(['used ChatGPT-like tools'])
    expect(seen.framed).toEqual([])
    // The answers go; the commands band stays, without opening the pane unasked.
    expect(await ui.find({ type: 'Button', text: 'None' })).toBeUndefined()
    expect(await ui.find({ type: 'Button', text: 'Continue' })).toBeDefined()
    expect(await ui.find({ type: 'Button', text: 'Companion' })).toBeDefined()
    expect(seen.opened).toEqual([])
    await ui.unmount()
  })

  test('several answers are picked, then sent together; the commands come back', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)
    await save($, server, STARTED, 't1')
    await $.tool.call({
      tool: CHOICES,
      tool_use_id: 'c1',
      options: [{ label: 'Understanding AI' }, { label: 'Using AI tools' }, { label: 'Building with AI' }],
      multiSelect: true,
    } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...BAND })
    expect(await ui.find({ type: 'Button', text: 'Send' })).toBeUndefined()
    await ui.press({ key: 'choice-2' })
    await ui.press({ key: 'choice-1' })
    expect(await ui.find({ type: 'Button', text: '✓ Using AI tools' })).toBeDefined()
    await ui.press({ key: 'send' })

    expect(seen.prompts).toEqual(['Using AI tools, Building with AI'])
    expect(seen.framed).toEqual([])
    expect(await ui.find({ type: 'Button', text: 'Continue' })).toBeDefined()
    await ui.unmount()
  })

  test('a typed reply also takes the buttons away', async ($, on) => {
    engine(on, newServer())
    await $.tool.call({ tool: CHOICES, tool_use_id: 'c1', options: ['Yes', 'No'] } as never)
    await $.prompt.submit({ text: 'maybe later' } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await ui.find({ type: 'Button', text: 'Yes' })).toBeUndefined()
    expect(await ui.find({ type: 'Button', text: 'Continue' })).toBeDefined()
    await ui.unmount()
  })

  test('after the app restarts, resuming opens the pane again', async ($, on) => {
    const server = newServer(STARTED)
    const seen = engine(on, server)
    // The session kept its state from before the restart: learning had started.
    on('state.get', { plugin: PLUGIN, key: 'isActive' }, async () => ({ value: true, version: 1 }) as never)

    await $.tool.call({ tool: 'Skill', tool_use_id: 's1', skill: 'learn' } as never)
    expect(seen.opened).toEqual([PANE_ID])

    // Later saves in the same run leave a pane the learner closed alone.
    await save($, server, STARTED, 't1')
    expect(seen.opened).toEqual([PANE_ID])
  })

  test('the Companion button above the prompt reopens a closed pane', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server)
    await save($, server, STARTED, 't1')
    expect(seen.opened).toEqual([PANE_ID])

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...BAND })
      await ui.press({ key: 'pane' })
      await ui.unmount()
    }
    expect(seen.opened).toEqual([PANE_ID, PANE_ID, PANE_ID])
  })

  test('the Dashboard link opens the instance of .mcp.json, the hosted one by default', async ($, on) => {
    const server = newServer()
    engine(on, server)
    await save($, server, STARTED, 't1')

    const byDefault = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...BAND })
    expect(await byDefault.find({ type: 'Link', href: 'https://lessonfolk.com/' })).toBeDefined()
    await byDefault.unmount()

    server.mcpJson = JSON.stringify({ mcpServers: { lessonfolk: { type: 'http', url: 'https://learn.example.org/mcp' } } })
    await save($, server, STARTED, 't2')
    const hosted = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await hosted.find({ type: 'Link', href: 'https://learn.example.org/' })).toBeDefined()
    await hosted.unmount()
  })

  test('a pane the app keeps undrawn says why, in a toast and from the command', async ($, on) => {
    const server = newServer()
    const seen = engine(on, server, 'the attached surfaces place no panes')
    await save($, server, STARTED, 't1')
    expect(seen.toasts).toContain('Course companion waits: the attached surfaces place no panes')

    const ran = await $.command.run({ command: 'course-companion', args: '' } as never)
    expect((ran as { text?: string }).text).toBe(
      'Course companion pane could not be shown: the attached surfaces place no panes',
    )
  })

  test('without progress the pane invites to start', async ($, on) => {
    engine(on, newServer())
    await $.command.run({ command: 'course-companion', args: '' } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: 'No course started yet.' })).toBeDefined()
    await ui.unmount()
  })
})
