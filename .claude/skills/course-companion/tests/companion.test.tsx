import { describe, expect, test } from 'claude-code/testing'

import {
  type Caller,
  changes,
  instanceUrl,
  keyIdeas,
  load,
  markIdea,
  parseChoices,
  replyOf,
  togglePick,
} from '../hooks/companion'
import { answer, progress, type Saved } from './server'

const caller = (saved: Saved | undefined, isUp = true): Caller => async (tool, args) =>
  isUp && saved ? answer(() => saved, tool, args) : undefined

const lessonText = (id: string) => answer(() => progress(null, {}), 'get_lesson', { lessonId: id }) ?? ''

describe('parsing', () => {
  test('key ideas keep their bold lead or their text, and stop at the next section', () => {
    expect(keyIdeas(lessonText('basics/01-one'))).toEqual(['What AI is', 'Narrow vs general'])
    expect(keyIdeas(lessonText('basics/02-two'))).toEqual(['Plain idea without bold'])
  })
})

describe('load', () => {
  test('a new learner is invited to start', async () => {
    const { view } = await load(caller({ lessons: {}, current: null }))
    expect(view.state).toBe('no-progress')
  })

  test('a server that cannot be reached is reported', async () => {
    const { view } = await load(caller(progress(null, {}), false))
    expect(view.state).toBe('offline')
  })

  test('the current lesson shows its course, key ideas and the next lesson', async () => {
    const saved = progress('basics/01-one', { 'basics/01-one': 'in_progress' })
    const { view } = await load(caller(saved))

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
    const saved = progress(null, { 'basics/01-one': 'done', 'basics/02-two': 'skipped' })
    const { view } = await load(caller(saved))

    expect(view.state).toBe('between')
    expect(view.courseTitle).toBe('Next Steps')
    expect(view.next).toEqual({ id: 'next-steps/01-three', title: 'Lesson three', courseTitle: undefined })
  })

  test('the next lesson outside the current course carries the course title', async () => {
    const saved = progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' })
    const { view } = await load(caller(saved))

    expect(view.lessons?.map(l => l.status)).toEqual(['done', 'current'])
    expect(view.next).toEqual({ id: 'next-steps/01-three', title: 'Lesson three', courseTitle: 'Next Steps' })
  })

  test('the learner path comes first', async () => {
    const saved = progress(null, {}, ['next-steps'])
    // next-steps/01-three needs basics/02-two, so the first available lesson is still basics/01-one.
    const { view } = await load(caller(saved))
    expect(view.next?.id).toBe('basics/01-one')
  })

  test('lessons skipped after the level check count as finished', async () => {
    const { view } = await load(caller(progress(null, {
      'basics/01-one': 'skipped_after_level_check',
      'basics/02-two': 'skipped_after_level_check',
    })))
    expect(view.courseTitle).toBe('Next Steps')
  })

  test('everything finished', async () => {
    const saved = progress(null, {
        'basics/01-one': 'done',
        'basics/02-two': 'done',
        'next-steps/01-three': 'skipped',
      })
    const { view } = await load(caller(saved))
    expect(view.state).toBe('all-done')
  })
})

describe('changes', () => {
  test('a finished lesson and a new course each make a toast', async () => {
    const before = await load(caller(progress('basics/02-two', { 'basics/01-one': 'done', 'basics/02-two': 'in_progress' })))
    const after = await load(caller(progress('next-steps/01-three', {
        'basics/01-one': 'done',
        'basics/02-two': 'done',
        'next-steps/01-three': 'in_progress',
      })))

    expect(changes(before, after)).toEqual([
      'Lesson complete: Lesson two',
      'New course: Next Steps (Using AI tools)',
    ])
  })

  test('the first read and an unchanged save say nothing', async () => {
    const loaded = await load(caller(progress('basics/01-one', { 'basics/01-one': 'in_progress' })))

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

describe('instanceUrl', () => {
  test('the dashboard is the origin of the lessonfolk url in .mcp.json, local by default', () => {
    const config = (url: string) => JSON.stringify({ mcpServers: { lessonfolk: { type: 'http', url } } })
    expect(instanceUrl(config('http://localhost:4321/mcp'))).toBe('http://localhost:4321/')
    expect(instanceUrl(config('https://learn.example.org/mcp'))).toBe('https://learn.example.org/')
    expect(instanceUrl(config('not a url'))).toBe('http://localhost:4321/')
    expect(instanceUrl('{ nope')).toBe('http://localhost:4321/')
    expect(instanceUrl(undefined)).toBe('http://localhost:4321/')
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
