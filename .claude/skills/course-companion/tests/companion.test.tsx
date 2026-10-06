import { describe, expect, test } from 'claude-code/testing'

import {
  changes,
  dashboardUrl,
  keyIdeas,
  load,
  markIdea,
  parseChoices,
  replyOf,
  togglePick,
  yamlList,
} from '../hooks/companion'

const lessonFile = (id: string, title: string, prerequisites: string[], ideas: string[]) =>
  [
    '---',
    `id: ${id}`,
    `title: ${title}`,
    prerequisites.length ? `prerequisites:\n${prerequisites.map(p => `  - ${p}`).join('\n')}` : 'prerequisites: []',
    '---',
    '',
    '## Key ideas',
    ...ideas.map((idea, i) => `${i + 1}. ${idea}\n   More words on it.`),
    '',
    '## Teaching notes',
    '1. Not a key idea.',
  ].join('\n')

const COURSES: Record<string, string> = {
  'courses/en/index.yaml': 'courses:\n  - basics\n  - next-steps\n',
  'courses/en/themes.yaml':
    'themes:\n  - id: understanding-ai\n    title: Understanding AI\n    description: What AI is.\n' +
    '  - id: using-ai\n    title: Using AI tools\n    description: Practical skills.\n',
  'courses/en/basics/course.yaml':
    'id: basics\ntitle: Basics\nlevel: beginner\ntheme: understanding-ai\nprerequisites: []\n' +
    'lessons:\n  - basics/01-one\n  - basics/02-two\n',
  'courses/en/next-steps/course.yaml':
    'id: next-steps\ntitle: Next Steps\nlevel: beginner\ntheme: using-ai\nprerequisites: [basics]\n' +
    'lessons:\n  - next-steps/01-three\n',
  'courses/en/basics/01-one.md': lessonFile('basics/01-one', 'Lesson one', [], [
    '**What AI is.** A first idea.',
    '**Narrow vs general**: a second idea.',
  ]),
  'courses/en/basics/02-two.md': lessonFile('basics/02-two', 'Lesson two', ['basics/01-one'], [
    'Plain idea without bold',
  ]),
  'courses/en/next-steps/01-three.md': lessonFile('next-steps/01-three', 'Lesson three', [
    'basics/02-two',
  ], ['**Prompts**. Words.']),
}

const progress = (current: string | null, lessons: Record<string, string>, path?: string[]) =>
  JSON.stringify({
    version: 1,
    profile: { name: 'Alex', language: 'en', level: 'beginner' },
    ...(path ? { path } : {}),
    current,
    lessons: Object.fromEntries(Object.entries(lessons).map(([id, status]) => [id, { status }])),
  })

const reader = (files: Record<string, string>) => async (path: string) => files[path]

describe('parsing', () => {
  test('lists read inline and block forms', () => {
    expect(yamlList('prerequisites: []\n', 'prerequisites')).toEqual([])
    expect(yamlList('prerequisites: [a, "b"]\n', 'prerequisites')).toEqual(['a', 'b'])
    expect(yamlList('lessons:\n  - x/1 # first\n\n  - x/2\nother: 1\n', 'lessons')).toEqual(['x/1', 'x/2'])
  })

  test('key ideas keep their bold lead or their text, and stop at the next section', () => {
    expect(keyIdeas(COURSES['courses/en/basics/01-one.md'] ?? '')).toEqual(['What AI is', 'Narrow vs general'])
    expect(keyIdeas(COURSES['courses/en/basics/02-two.md'] ?? '')).toEqual(['Plain idea without bold'])
  })
})

describe('load', () => {
  test('without progress.json the pane invites to start', async () => {
    const { view } = await load(reader(COURSES))
    expect(view.state).toBe('no-progress')
  })

  test('a broken progress.json is reported', async () => {
    const { view } = await load(reader({ ...COURSES, '.progress/progress.json': '{ nope' }))
    expect(view.state).toBe('invalid')
  })

  test('the current lesson shows its course, key ideas and the next lesson', async () => {
    const files = { ...COURSES, '.progress/progress.json': progress('basics/01-one', { 'basics/01-one': 'in_progress' }) }
    const { view } = await load(reader(files))

    expect(view.state).toBe('lesson')
    expect(view.courseTitle).toBe('Basics')
    expect(view.themeTitle).toBe('Understanding AI')
    expect(view.level).toBe('beginner')
    expect(view.lessons).toEqual([
      { id: 'basics/01-one', title: 'Lesson one', status: 'current' },
      { id: 'basics/02-two', title: 'Lesson two', status: 'todo' },
    ])
    expect(view.current?.ideas).toEqual(['What AI is', 'Narrow vs general'])
    expect(view.next).toEqual({ id: 'basics/02-two', title: 'Lesson two', courseTitle: undefined })
  })

  test('between lessons the focus is the next lesson, named with its course when it changes', async () => {
    const files = {
      ...COURSES,
      '.progress/progress.json': progress(null, { 'basics/01-one': 'done', 'basics/02-two': 'skipped' }),
    }
    const { view } = await load(reader(files))

    expect(view.state).toBe('between')
    expect(view.courseTitle).toBe('Next Steps')
    expect(view.next).toEqual({ id: 'next-steps/01-three', title: 'Lesson three', courseTitle: undefined })
  })

  test('the next lesson outside the current course carries the course title', async () => {
    const files = {
      ...COURSES,
      '.progress/progress.json': progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }),
    }
    const { view } = await load(reader(files))

    expect(view.lessons?.map(l => l.status)).toEqual(['done', 'current'])
    expect(view.next).toEqual({ id: 'next-steps/01-three', title: 'Lesson three', courseTitle: 'Next Steps' })
  })

  test('the learner path comes first', async () => {
    const files = {
      ...COURSES,
      '.progress/progress.json': progress(null, {}, ['next-steps']),
    }
    // next-steps/01-three needs basics/02-two, so the first available lesson is still basics/01-one.
    const { view } = await load(reader(files))
    expect(view.next?.id).toBe('basics/01-one')
  })

  test('everything finished', async () => {
    const files = {
      ...COURSES,
      '.progress/progress.json': progress(null, {
        'basics/01-one': 'done',
        'basics/02-two': 'done',
        'next-steps/01-three': 'skipped',
      }),
    }
    const { view } = await load(reader(files))
    expect(view.state).toBe('all-done')
  })
})

describe('changes', () => {
  test('a finished lesson and a new course each make a toast', async () => {
    const before = await load(reader({
      ...COURSES,
      '.progress/progress.json': progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' }),
    }))
    const after = await load(reader({
      ...COURSES,
      '.progress/progress.json': progress('next-steps/01-three', {
        'basics/01-one': 'done',
        'basics/02-two': 'done',
        'next-steps/01-three': 'in_progress',
      }),
    }))

    expect(changes(before, after)).toEqual([
      'Lesson complete: Lesson two',
      'New course: Next Steps (Using AI tools)',
    ])
  })

  test('the first read and an unchanged save say nothing', async () => {
    const loaded = await load(reader({
      ...COURSES,
      '.progress/progress.json': progress('basics/01-one', { 'basics/01-one': 'in_progress' }),
    }))

    expect(changes(undefined, loaded)).toEqual([])
    expect(changes(loaded, loaded)).toEqual([])
  })
})

describe('markIdea', () => {
  test('active marks the earlier ideas covered; done covers it; a new lesson starts over', () => {
    const one = markIdea({ covered: [] }, 'a/1', 2, 'active')
    expect(one).toEqual({ lessonId: 'a/1', covered: [1], active: 2 })

    const two = markIdea(one, 'a/1', 2, 'done')
    expect(two).toEqual({ lessonId: 'a/1', covered: [1, 2], active: undefined })

    expect(markIdea(two, 'a/2', 1, 'active')).toEqual({ lessonId: 'a/2', covered: [], active: 1 })
  })
})

describe('dashboardUrl', () => {
  test('reads the port the server prints, colours and all, as a localhost link', () => {
    expect(dashboardUrl('  \u001b[32m┃\u001b[39m Local    \u001b[36mhttp://127.0.0.1:4321/\u001b[39m\n')).toBe('http://localhost:4321/')
    expect(dashboardUrl('Local http://localhost:4322/')).toBe('http://localhost:4322/')
    expect(dashboardUrl('astro  v7 ready in 812 ms')).toBeUndefined()
  })
})

describe('choices', () => {
  test('options need a label; the reply defaults to it; 2 to 8 of them', () => {
    expect(parseChoices({ options: [{ label: 'Yes' }, { label: 'No', reply: 'No, stop here' }, { label: ' ' }] }))
      .toEqual({ options: [{ label: 'Yes', reply: 'Yes' }, { label: 'No', reply: 'No, stop here' }], isMulti: false, picked: [] })
    expect(parseChoices({ options: ['A', 'B'], multiSelect: true })?.isMulti).toBe(true)
    expect(parseChoices({ options: [{ label: 'Only one' }] })).toBeUndefined()
    expect(parseChoices({ options: 'nope' })).toBeUndefined()
  })

  test('picks toggle and reply in the listed order', () => {
    const offered = parseChoices({ options: ['Understanding AI', 'Using AI tools', 'Building with AI'], multiSelect: true })
    if (!offered) throw new Error('no choices')
    const picked = togglePick(togglePick(togglePick(offered, 2), 1), 0)
    expect(replyOf(picked)).toBe('Understanding AI, Using AI tools, Building with AI')
    expect(replyOf(togglePick(picked, 0))).toBe('Using AI tools, Building with AI')
  })
})
