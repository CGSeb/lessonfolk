/** Number of `.theme-tone-N` colour classes in tokens.css. */
export const THEME_TONES = 5;

/**
 * Colour class of a theme, from its 0-based position in `themes.yaml`: each
 * theme gets its own tone, cycling when there are more themes than tones.
 * `undefined` (unknown theme) keeps the default indigo.
 */
export function themeToneClass(position: number | undefined): string | undefined {
  if (position === undefined || !Number.isInteger(position) || position < 0) return undefined;
  return `theme-tone-${(position % THEME_TONES) + 1}`;
}
