import type { On, RenderPropsOf } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { describe, expect, test } from 'claude-code/testing'

const PLUGIN = 'course-companion'
const TOOL = 'mcp__course-companion__key_idea'
const CHOICES = 'mcp__course-companion__choices'
const PROGRESS = '.progress/progress.json'

const PANE = {
  component: 'Pane',
  requestId: PLUGIN,
  props: { title: 'Course companion', isFocused: false } as unknown as RenderPropsOf['Pane'],
} as const
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100 } as unknown as RenderPropsOf['AbovePrompt'],
} as const

const COURSES: Record<string, string> = {
  'courses/en/index.yaml': 'courses:\n  - basics\n',
  'courses/en/themes.yaml': 'themes:\n  - id: understanding-ai\n    title: Understanding AI\n',
  'courses/en/basics/course.yaml':
    'id: basics\ntitle: Basics\nlevel: beginner\ntheme: understanding-ai\n' +
    'lessons:\n  - basics/01-one\n  - basics/02-two\n',
  'courses/en/basics/01-one.md':
    '---\nid: basics/01-one\ntitle: Lesson one\nprerequisites: []\n---\n\n## Key ideas\n' +
    '1. **First idea.** Words.\n2. **Second idea.** Words.\n\n## Teaching notes\n- x\n',
  'courses/en/basics/02-two.md':
    '---\nid: basics/02-two\ntitle: Lesson two\nprerequisites:\n  - basics/01-one\n---\n\n## Key ideas\n1. Only idea\n',
}

const progress = (current: string | null, lessons: Record<string, string>) =>
  JSON.stringify({
    profile: { language: 'en', level: 'beginner' },
    current,
    lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
  })


// The engine beneath the mod: files from memory, every tool call succeeding, what the
// mod shows (toasts, panes, prompts) recorded.
const engine = (on: On, files: Record<string, string>, unplaced?: string) => {
  const seen = { toasts: [] as string[], opened: [] as string[], prompts: [] as string[], framed: [] as string[] }
  // The session runs in D:\repo; the files live there and nowhere else (a relative path would
  // land in the mod's own folder, as it does in a real session).
  on('session.cwd', async () => ({ value: 'D:\\repo' }) as never)
  on('fs.read', async (_$, e) => {
    const path = e.path.replace(/\\/g, '/')
    const key = Object.keys(files).find(k => path === `D:/repo/${k}`)
    if (key === undefined) throw new Error(`ENOENT: ${e.path}`)

    return { value: files[key] } as never
  })
  on('tool.call', async () => ({ result: 'ok' }) as never)
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

const save = ($: Engine, files: Record<string, string>, text: string, id: string) => {
  files[PROGRESS] = text

  return $.tool.call({ tool: 'Write', tool_use_id: id, file_path: PROGRESS, content: text } as never)
}

describe('course companion', () => {
  test('saving progress opens the pane on the current lesson', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')

    expect(seen.opened).toEqual([PLUGIN])
    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...PANE })
      expect(await ui.find({ type: 'Text', text: 'Basics' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Understanding AI · beginner' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Lessons 0/2' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '○ 1. First idea' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'Next: Lesson two' })).toBeDefined()
      await ui.unmount()
    }
  })

  test('a lesson started from a shell command shows up too', async ($, on) => {
    const files = { ...COURSES }
    engine(on, files)
    await save($, files, progress(null, {}), 't1')

    files[PROGRESS] = progress('basics/01-one', { 'basics/01-one': 'in_progress' })
    await $.tool.call({
      tool: 'Bash',
      tool_use_id: 't2',
      command: `cd .progress && node -e "/* sets current */ require('fs').writeFileSync('progress.json', '…')"`,
    } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...PANE })
    expect(await ui.find({ type: 'Text', text: '● Lesson one' })).toBeDefined()
    await ui.unmount()
  })

  test('the key idea tool marks where the tutor is', async ($, on) => {
    const files = { ...COURSES }
    engine(on, files)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
    const ran = await $.tool.call({ tool: TOOL, tool_use_id: 't2', lesson: 'basics/01-one', keyIdea: 2, status: 'active' } as never)
    expect(ran.deny).toBeUndefined()

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '✓ 1. First idea' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '● 2. Second idea' })).toBeDefined()
    await ui.unmount()
  })

  test('finishing a lesson toasts it and moves the pane on', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
    await save($, files, progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }), 't2')

    expect(seen.toasts).toContain('Lesson complete: Lesson one')
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: '✓ Lesson one' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '● Lesson two' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Lessons 1/2' })).toBeDefined()
    await ui.unmount()
  })

  test('the commands band appears once learning starts and sends the command', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)

    const before = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await before.find({ type: 'Button' })).toBeUndefined()
    await before.unmount()

    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
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
    const seen = engine(on, { ...COURSES })
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
    const files = { ...COURSES }
    const seen = engine(on, files)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
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
    engine(on, { ...COURSES })
    await $.tool.call({ tool: CHOICES, tool_use_id: 'c1', options: ['Yes', 'No'] } as never)
    await $.prompt.submit({ text: 'maybe later' } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    expect(await ui.find({ type: 'Button', text: 'Yes' })).toBeUndefined()
    expect(await ui.find({ type: 'Button', text: 'Continue' })).toBeDefined()
    await ui.unmount()
  })

  test('after the app restarts, resuming opens the pane again', async ($, on) => {
    const files = { ...COURSES, [PROGRESS]: progress('basics/01-one', { 'basics/01-one': 'in_progress' }) }
    const seen = engine(on, files)
    // The session kept its state from before the restart: learning had started.
    on('state.get', { plugin: 'course-companion', key: 'isActive' }, async () => ({ value: true, version: 1 }) as never)

    await $.tool.call({ tool: 'Skill', tool_use_id: 's1', skill: 'learn' } as never)
    expect(seen.opened).toEqual([PLUGIN])

    // Later saves in the same run leave a pane the learner closed alone.
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
    expect(seen.opened).toEqual([PLUGIN])
  })

  test('the Companion button above the prompt reopens a closed pane', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
    expect(seen.opened).toEqual([PLUGIN])

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, ...BAND })
      await ui.press({ key: 'pane' })
      await ui.unmount()
    }
    expect(seen.opened).toEqual([PLUGIN, PLUGIN, PLUGIN])
  })

  test('the Dashboard button starts the dashboard server and says where it runs', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)
    const spawned: { argv: readonly string[]; cwd?: string }[] = []
    // The engine hands paths over in the platform's spelling.
    on('fs.exists', async (_$, e) =>
      ({ value: e.path.replace(/\\/g, '/') === 'D:/repo/node_modules/astro/bin/astro.mjs' }) as never)
    on('process.spawn', async function* (_$: unknown, e: { argv: readonly string[]; cwd?: string }) {
      spawned.push({ argv: e.argv, cwd: e.cwd })
      yield { stream: 'stdout' as const, text: ' astro  v7 ready\n  ┃ Local    http://127.0.' }
      yield { stream: 'stdout' as const, text: '0.1:4321/\n' }

      return { value: { code: 0, signal: null } }
    } as never)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', ...BAND })
    await ui.press({ key: 'dashboard' })
    await ui.unmount()

    expect(spawned.map(s => ({ argv: s.argv.map(a => a.replace(/\\/g, '/')), cwd: s.cwd?.replace(/\\/g, '/') })))
      .toEqual([{ argv: ['node', 'D:/repo/node_modules/astro/bin/astro.mjs', 'dev'], cwd: 'D:/repo/dashboard' }])
    // The fake server exits right away, so it runs, then stops.
    expect(seen.toasts).toEqual(['Dashboard running at http://localhost:4321/', 'Dashboard stopped.'])
  })

  test('without dependencies the Dashboard button asks for npm install', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files)
    on('fs.exists', async () => ({ value: false }) as never)
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...BAND })
    await ui.press({ key: 'dashboard' })
    expect(seen.toasts).toEqual(['Dashboard: run npm install first, then press Dashboard again.'])
    expect(await ui.find({ type: 'Button', text: 'Dashboard' })).toBeDefined()
    await ui.unmount()
  })

  test('a pane the app keeps undrawn says why, in a toast and from the command', async ($, on) => {
    const files = { ...COURSES }
    const seen = engine(on, files, 'the attached surfaces place no panes')
    await save($, files, progress('basics/01-one', { 'basics/01-one': 'in_progress' }), 't1')
    expect(seen.toasts).toContain('Course companion waits: the attached surfaces place no panes')

    const ran = await $.command.run({ command: 'course-companion', args: '' } as never)
    expect((ran as { text?: string }).text).toBe(
      'Course companion pane could not be shown: the attached surfaces place no panes',
    )
  })

  test('without progress the pane invites to start', async ($, on) => {
    engine(on, { ...COURSES })
    await $.command.run({ command: 'course-companion', args: '' } as never)

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...PANE })
    expect(await ui.find({ type: 'Text', text: 'No course started yet.' })).toBeDefined()
    await ui.unmount()
  })
})
