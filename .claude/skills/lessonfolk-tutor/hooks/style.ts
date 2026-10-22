// The look of the Course companion: the colours and drawings of the LessonFolk brand
// (docs/brand.md, "Bright Thread"), kept apart from the logic so the tests can read them.
// The pane cannot tell the light theme from the dark one, so the colours are mid tones that read on both.

export const BRAND = {
  indigo: '#4f46e5',
  // The accent: the learner's side (the current lesson, the key idea in progress).
  accent: '#818cf8',
  // The spark: the next lesson, and only that.
  amber: '#fbbf24',
  // Dark text on the amber bubble.
  ink: '#1a1c33',
}

// `assets/brand/icon.svg`: the mark, the same in light and dark.
export const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#4F46E5"/>
  <path d="M22 14 L22 46 L42 46" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M43 13Q44.6 22.4 54 24Q44.6 25.6 43 35Q41.4 25.6 32 24Q41.4 22.4 43 13Z" fill="#FBBF24"/>
</svg>`

export const PROGRESS_WIDTH = 220

// A rounded bar, filled in proportion to the lessons finished.
export const progressBar = (finished: number, total: number): string => {
  const fill = total > 0 ? Math.round((PROGRESS_WIDTH * Math.min(finished, total)) / total) : 0

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PROGRESS_WIDTH} 8">` +
    `<rect width="${PROGRESS_WIDTH}" height="8" rx="4" fill="#9496b0" fill-opacity="0.3"/>` +
    (fill > 0 ? `<rect width="${Math.max(fill, 8)}" height="8" rx="4" fill="${BRAND.accent}"/>` : '') +
    '</svg>'
}
