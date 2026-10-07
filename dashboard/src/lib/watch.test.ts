import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createChangeHub, directorySignature, watchLessonFolk, watchDirectory, type ChangeArea } from './watch';

const DEBOUNCE = 100;
const POLL = 50;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const temps: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lessonfolk-watch-'));
  temps.push(dir);
  return dir;
}

const stops: Array<() => void> = [];
afterEach(() => {
  while (stops.length) stops.pop()!();
  while (temps.length) rmSync(temps.pop()!, { recursive: true, force: true });
});

describe.each([
  ['fs.watch', false],
  ['polling', true],
])('watchDirectory (%s)', (_label, forcePolling) => {
  const opts = { debounceMs: DEBOUNCE, pollMs: POLL, forcePolling };

  it('calls back once after a burst of writes', async () => {
    const dir = tempDir();
    const onChange = vi.fn();
    stops.push(watchDirectory(dir, onChange, opts));
    await sleep(POLL * 2);

    const file = join(dir, 'progress.json');
    writeFileSync(file, '{"a":');
    writeFileSync(file, '{"a":1}');
    writeFileSync(file, '{"a":2}');

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1), { timeout: 3000 });
    await sleep(DEBOUNCE * 3);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('notices a directory and file created for the first time', async () => {
    const parent = tempDir();
    const dir = join(parent, '.progress');
    const onChange = vi.fn();
    stops.push(watchDirectory(dir, onChange, opts));
    await sleep(POLL * 2);

    mkdirSync(dir);
    writeFileSync(join(dir, 'progress.json'), '{}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });

    // Keeps watching after the directory appeared.
    await sleep(DEBOUNCE * 3);
    onChange.mockClear();
    writeFileSync(join(dir, 'progress.json'), '{"x":1}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('survives the directory being deleted and created again', async () => {
    const parent = tempDir();
    const dir = join(parent, '.progress');
    mkdirSync(dir);
    writeFileSync(join(dir, 'progress.json'), '{}');
    const onChange = vi.fn();
    stops.push(watchDirectory(dir, onChange, opts));
    await sleep(POLL * 2);

    rmSync(dir, { recursive: true, force: true });
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });
    await sleep(DEBOUNCE * 3);
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);

    onChange.mockClear();
    mkdirSync(dir);
    writeFileSync(join(dir, 'progress.json'), '{"x":1}');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('watches subdirectories when recursive', async () => {
    const dir = tempDir();
    mkdirSync(join(dir, 'en', 'course'), { recursive: true });
    const onChange = vi.fn();
    stops.push(watchDirectory(dir, onChange, { ...opts, recursive: true }));
    await sleep(POLL * 2);

    writeFileSync(join(dir, 'en', 'course', '01-lesson.md'), '# Lesson');
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('stops calling back once closed', async () => {
    const dir = tempDir();
    const onChange = vi.fn();
    const stop = watchDirectory(dir, onChange, opts);
    await sleep(POLL * 2);
    writeFileSync(join(dir, 'progress.json'), '{}');
    stop(); // Also cancels the pending debounce.
    writeFileSync(join(dir, 'progress.json'), '{"x":1}');
    await sleep(DEBOUNCE * 4);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('watchLessonFolk', () => {
  it('reports which area changed', async () => {
    const progressDir = tempDir();
    const coursesDir = tempDir();
    const areas: ChangeArea[] = [];
    stops.push(watchLessonFolk({ progressDir, coursesDir, debounceMs: DEBOUNCE, pollMs: POLL }, (a) => areas.push(a)));
    await sleep(POLL * 2);

    writeFileSync(join(progressDir, 'progress.json'), '{}');
    await vi.waitFor(() => expect(areas).toEqual(['progress']), { timeout: 3000 });
    writeFileSync(join(coursesDir, 'index.yaml'), 'courses: []');
    await vi.waitFor(() => expect(areas).toEqual(['progress', 'courses']), { timeout: 3000 });
  });
});

describe('createChangeHub', () => {
  it('shares watchers and stops them when the last subscriber leaves', async () => {
    const progressDir = tempDir();
    const coursesDir = tempDir();
    const getOptions = vi.fn(() => ({ progressDir, coursesDir, debounceMs: DEBOUNCE, pollMs: POLL }));
    const hub = createChangeHub(getOptions);

    const a = vi.fn();
    const b = vi.fn();
    const offA = hub.subscribe(a);
    const offB = hub.subscribe(b);
    expect(getOptions).toHaveBeenCalledTimes(1);
    expect(hub.size).toBe(2);
    await sleep(POLL * 2);

    writeFileSync(join(progressDir, 'progress.json'), '{}');
    await vi.waitFor(() => {
      expect(a).toHaveBeenCalledWith('progress');
      expect(b).toHaveBeenCalledWith('progress');
    }, { timeout: 3000 });

    offA();
    offB();
    expect(hub.size).toBe(0);
    a.mockClear();
    writeFileSync(join(progressDir, 'progress.json'), '{"x":1}');
    await sleep(DEBOUNCE * 4);
    expect(a).not.toHaveBeenCalled();

    // Subscribing again restarts the watchers.
    stops.push(hub.subscribe(a));
    expect(getOptions).toHaveBeenCalledTimes(2);
  });
});

describe('directorySignature', () => {
  it('changes when a file changes and is empty for a missing directory', () => {
    const dir = tempDir();
    const before = directorySignature(dir, false);
    writeFileSync(join(dir, 'progress.json'), '{}');
    expect(directorySignature(dir, false)).not.toBe(before);
    expect(directorySignature(join(dir, 'missing'), false)).toBe('');
  });
});
