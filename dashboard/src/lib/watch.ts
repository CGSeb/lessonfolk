import { existsSync, readdirSync, statSync, watch, type FSWatcher } from 'node:fs';
import { join } from 'node:path';

/** Which part of the learner's files changed. */
export type ChangeArea = 'progress' | 'courses';

export interface WatchDirOptions {
  /** Watch subdirectories too. */
  recursive?: boolean;
  /** Quiet period after the last event before `onChange` fires (ms). */
  debounceMs?: number;
  /** How often to check for the directory when it does not exist, or to poll when fs.watch is unavailable (ms). */
  pollMs?: number;
  /** Force polling instead of fs.watch (used by tests and as a fallback). */
  forcePolling?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_POLL_MS = 1000;

/**
 * A cheap fingerprint of a directory's contents (names, sizes, mtimes), used when
 * fs.watch cannot be used. Missing or unreadable entries are skipped.
 */
export function directorySignature(dir: string, recursive: boolean): string {
  const parts: string[] = [];
  const walk = (current: string, prefix: string) => {
    let names: string[];
    try {
      names = readdirSync(current).sort();
    } catch {
      return;
    }
    for (const name of names) {
      const full = join(current, name);
      try {
        const stats = statSync(full);
        parts.push(`${prefix}${name}:${stats.size}:${stats.mtimeMs}`);
        if (recursive && stats.isDirectory()) walk(full, `${prefix}${name}/`);
      } catch {
        // Removed between readdir and stat: ignore.
      }
    }
  };
  walk(dir, '');
  return parts.join('|');
}

/**
 * Watch a directory and call `onChange` once per burst of changes.
 *
 * - The directory may not exist yet: it is polled for, and its appearance counts
 *   as a change (so a first-time `progress.json` is noticed).
 * - If the directory disappears or fs.watch fails, it falls back to polling.
 * - Never throws after start; returns a function that stops everything.
 */
export function watchDirectory(dir: string, onChange: () => void, options: WatchDirOptions = {}): () => void {
  const { recursive = false, debounceMs = DEFAULT_DEBOUNCE_MS, pollMs = DEFAULT_POLL_MS, forcePolling = false } = options;

  let closed = false;
  let watcher: FSWatcher | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if (closed) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      if (closed) return;
      try {
        onChange();
      } catch {
        // A failing listener must not break the watcher.
      }
    }, debounceMs);
  };

  const stopWatcher = () => {
    try {
      watcher?.close();
    } catch {
      // Already closed.
    }
    watcher = undefined;
  };

  const stopPolling = () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = undefined;
  };

  /** Poll for changes by comparing fingerprints (also detects the directory appearing or vanishing). */
  const startPolling = (waitForDirOnly: boolean) => {
    stopPolling();
    let exists = existsSync(dir);
    let signature = exists ? directorySignature(dir, recursive) : '';
    pollTimer = setInterval(() => {
      if (closed) return;
      const nowExists = existsSync(dir);
      if (waitForDirOnly) {
        if (nowExists) {
          schedule();
          start();
        }
        return;
      }
      const nowSignature = nowExists ? directorySignature(dir, recursive) : '';
      if (nowExists !== exists || nowSignature !== signature) {
        exists = nowExists;
        signature = nowSignature;
        schedule();
      }
    }, pollMs);
    pollTimer.unref?.();
  };

  const start = () => {
    if (closed) return;
    stopWatcher();
    stopPolling();
    if (forcePolling) {
      startPolling(false);
      return;
    }
    if (!existsSync(dir)) {
      startPolling(true);
      return;
    }
    try {
      const restart = () => {
        stopWatcher();
        schedule();
        start();
      };
      watcher = watch(dir, { recursive, persistent: false }, () => {
        // When the watched directory itself is deleted, Windows keeps emitting
        // "rename" events for it in a tight loop: drop that watcher and wait
        // for the directory to come back.
        if (!existsSync(dir)) restart();
        else schedule();
      });
      // Typically the directory was removed (EPERM on Windows). Start over.
      watcher.on('error', restart);
    } catch {
      // fs.watch unsupported here (or the directory vanished): poll instead.
      startPolling(!existsSync(dir));
    }
  };

  start();

  return () => {
    closed = true;
    stopWatcher();
    stopPolling();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = undefined;
  };
}

export interface LessonFolkWatchOptions extends Pick<WatchDirOptions, 'debounceMs' | 'pollMs' | 'forcePolling'> {
  progressDir: string;
  coursesDir: string;
}

/** Watch the progress directory and the courses tree; `onChange` gets the area that changed. */
export function watchLessonFolk(
  options: LessonFolkWatchOptions,
  onChange: (area: ChangeArea) => void,
): () => void {
  const { progressDir, coursesDir, ...rest } = options;
  const stopProgress = watchDirectory(progressDir, () => onChange('progress'), { ...rest, recursive: false });
  const stopCourses = watchDirectory(coursesDir, () => onChange('courses'), { ...rest, recursive: true });
  return () => {
    stopProgress();
    stopCourses();
  };
}

type Listener = (area: ChangeArea) => void;

/**
 * Shares one set of file watchers between every connected page. Watchers start
 * with the first subscriber and stop when the last one leaves.
 */
export function createChangeHub(getOptions: () => LessonFolkWatchOptions) {
  const listeners = new Set<Listener>();
  let stop: (() => void) | undefined;

  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      if (!stop) {
        stop = watchLessonFolk(getOptions(), (area) => {
          for (const l of [...listeners]) {
            try {
              l(area);
            } catch {
              // One broken connection must not affect the others.
            }
          }
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && stop) {
          stop();
          stop = undefined;
        }
      };
    },
    get size() {
      return listeners.size;
    },
  };
}
