import type { On, RenderPropsOf } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { describe, expect, test } from 'claude-code/testing'

const PLUGIN = 'course-builder'
const PANE_ID = 'course-builder'
const TOOL = 'mcp__course-builder__progress'

const pane = (title: string) =>
  ({
    component: 'Pane',
    requestId: PANE_ID,
    props: { title, isFocused: false } as unknown as RenderPropsOf['Pane'],
  }) as const

// The engine beneath the mod: every tool call succeeds, and the panes it opens are recorded.
const engine = (on: On) => {
  const seen = { opened: [] as string[] }
  on('tool.call', async () => ({ result: 'ok' }) as never)
  on('ui.open', async (_$, e) => {
    seen.opened.push(`${e.id}:${e.title}`)

    return { value: { isPlaced: true } } as never
  })
  on('command.run', async () => ({ value: { text: '' } }) as never)

  return seen
}

let calls = 0
const call = ($: Engine, input: Record<string, unknown>) => $.tool.call({ tool_use_id: `t${++calls}`, ...input } as never)

const PROJECT = `---
id: reusable-prompt
title: A prompt you can reuse every week
level: beginner
theme: using-ai
---

## Brief
Pick a task.

## Milestones
1. **Choose the task and what "good" means.** Pick one.
   Done when: named.
2. **Write the first version.** Write it.
   Done when: shared.

## Coaching notes
- Coach.

## Review
1. Good.
`

const texts = async ($: Engine, title: string) => {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', ...pane(title) })
  const lines = (await ui.findAll({ type: 'Text' })).map(node => node.text)
  await ui.unmount()

  return lines
}

describe('builder pane', () => {
  test('follows a course creation as before', async ($, on) => {
    const seen = engine(on)
    await call($, { tool: 'Skill', skill: 'create-course' })
    expect(seen.opened).toEqual([`${PANE_ID}:Course builder`])

    await call($, {
      tool: 'Write',
      file_path: 'D:\\repo\\courses\\en\\basics\\course.yaml',
      content: 'id: basics\ntitle: Basics\nlevel: beginner\ntheme: using-ai\nlessons:\n  - basics/01-one\n  - basics/02-two\n',
    })
    await call($, { tool: 'Write', file_path: 'D:\\repo\\courses\\en\\basics\\01-one.md', content: '---\ntitle: Lesson one\n---\n' })

    const lines = await texts($, 'Course builder')
    expect(lines).toContain('Basics')
    expect(lines).toContain('Lessons 1/2')
    expect(lines).toContain('● Write course.yaml and lessons')
    expect(lines.some(line => line?.startsWith('Milestones'))).toBe(false)
  })

  test('follows a project creation: milestones from the file, both languages, the project index', async ($, on) => {
    const seen = engine(on)
    await call($, { tool: 'Skill', skill: 'create-project' })
    expect(seen.opened).toEqual([`${PANE_ID}:Project builder`])

    await call($, { tool: 'Write', file_path: '/repo/projects/en/reusable-prompt.md', content: PROJECT })
    let lines = await texts($, 'Project builder')
    expect(lines).toContain('A prompt you can reuse every week')
    expect(lines).toContain('reusable-prompt')
    expect(lines).toContain('beginner · using-ai')
    expect(lines).toContain('Milestones 2')
    expect(lines).toContain('1. Choose the task and what "good" means')
    expect(lines).toContain('2. Write the first version')
    expect(lines).toContain('● Write the project (English, then French)')
    expect(lines).toContain('Files: ✓ en  ○ fr')

    await call($, { tool: 'Write', file_path: '/repo/projects/fr/reusable-prompt.md', content: '---\ntitle: Un prompt\n---\n' })
    await call($, { tool: 'Edit', file_path: '/repo/projects/en/index.yaml' })
    lines = await texts($, 'Project builder')
    // The French file does not replace the English title.
    expect(lines).toContain('A prompt you can reuse every week')
    expect(lines).toContain('Files: ✓ en  ✓ fr')
    expect(lines).toContain('✓ Write the project (English, then French)')
    expect(lines).toContain('✓ Register in projects/en/index.yaml')
    expect(lines.some(line => line?.startsWith('Lessons'))).toBe(false)
  })

  test('a course index or course file does not move a project build', async ($, on) => {
    engine(on)
    await call($, { tool: 'Skill', skill: 'create-project' })
    await call($, { tool: 'Edit', file_path: '/repo/courses/en/index.yaml' })
    await call($, { tool: 'Write', file_path: '/repo/courses/en/basics/01-one.md', content: '---\ntitle: One\n---\n' })
    const lines = await texts($, 'Project builder')
    expect(lines).toContain('○ Register in projects/en/index.yaml')
    expect(lines.some(line => line?.startsWith('Lessons'))).toBe(false)
  })

  test('the progress tool sets the planned milestones of a project', async ($, on) => {
    engine(on)
    await call($, { tool: 'Skill', skill: 'create-project' })
    const ran = await call($, { tool: TOOL, step: 'outline', status: 'done', title: 'Demo', milestones: ['Pick', 'Build', 'Test'] })
    expect(ran).toMatchObject({ result: 'Project builder pane updated.' })
    const lines = await texts($, 'Project builder')
    expect(lines).toContain('Milestones 3')
    expect(lines).toContain('3. Test')
    expect(lines).toContain('✓ Outline approved')
  })

  test('says what to run when nothing is in progress', async $ => {
    const lines = await texts($, 'Course builder')
    expect(lines).toContain('No course or project in progress.')
  })
})
