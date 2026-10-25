/**
 * What the tools tell the AI about a learner's progress. The full progress.json grows with every
 * lesson (each one carries its notes, up to 4000 characters), and the AI reads it again after every
 * call, so the tools send a compact view and the details only when they are asked for.
 */
import type { Progress } from '@lessonfolk/core';

/** Notes at most this long (such as "placement") stay in the compact view: they cost nothing. */
const SHORT_NOTE = 40;
/** The latest finished lessons whose notes the compact view shows, cut to `NOTE_PREVIEW` characters. */
const RECENT_NOTES = 3;
const NOTE_PREVIEW = 300;

/** The lessons whose full entry (with notes) is wanted. */
export interface ProgressDetail {
  courseId?: string;
  lessonIds?: string[];
}

const preview = (text: string) => (text.length > NOTE_PREVIEW ? `${text.slice(0, NOTE_PREVIEW).trimEnd()}…` : text);

/**
 * The progress.json shape without the notes of the lessons that were not asked for: the current
 * lesson keeps its notes (to resume), the latest finished lessons show a preview of theirs
 * (`recentNotes`), and the others are flagged `hasNotes`. Profile, path, scores and statuses stay.
 */
export function compactProgress(progress: Progress, detail: ProgressDetail = {}): Record<string, unknown> {
  const wanted = (id: string) =>
    id === progress.current || Boolean(detail.lessonIds?.includes(id)) || (detail.courseId !== undefined && id.startsWith(`${detail.courseId}/`));

  const lessons: Progress['lessons'] = {};
  let left = false;
  for (const [id, lesson] of Object.entries(progress.lessons)) {
    const { notes, ...rest } = lesson;
    if (!notes || wanted(id) || notes.length <= SHORT_NOTE) {
      lessons[id] = lesson;
    } else {
      lessons[id] = { ...rest, hasNotes: true };
      left = true;
    }
  }

  const recentNotes = Object.entries(progress.lessons)
    .filter(([id, lesson]) => lesson.status === 'done' && lesson.notes && !wanted(id))
    .sort(([, a], [, b]) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, RECENT_NOTES)
    .map(([lessonId, lesson]) => ({ lessonId, notes: preview(lesson.notes ?? '') }));

  return {
    ...progress,
    lessons,
    ...(recentNotes.length && { recentNotes }),
    ...(left && {
      detail:
        'Notes of the lessons flagged hasNotes are left out. Call get_progress with courseId (a course) or lessonIds (some lessons) to read them, or full: true for everything.',
    }),
  };
}

/** The answer of a write tool: where the learner stands, not the whole progress. */
export function progressReceipt(progress: Progress): string {
  const count = { done: 0, skipped: 0, in_progress: 0 };
  for (const lesson of Object.values(progress.lessons)) count[lesson.status] += 1;
  return (
    `Current lesson: ${progress.current ?? 'none'}. Lessons: ${count.done} done, ${count.skipped} skipped, ${count.in_progress} in progress. ` +
    'Call get_progress to read the details.'
  );
}
