import { describe, expect, it } from 'vitest';
import { THEME_TONES, themeToneClass } from './theme-tone';

describe('themeToneClass', () => {
  it('gives each position its own tone', () => {
    expect(Array.from({ length: THEME_TONES }, (_, i) => themeToneClass(i))).toEqual([
      'theme-tone-1',
      'theme-tone-2',
      'theme-tone-3',
      'theme-tone-4',
      'theme-tone-5',
    ]);
  });

  it('cycles when there are more themes than tones', () => {
    expect(themeToneClass(THEME_TONES)).toBe('theme-tone-1');
    expect(themeToneClass(THEME_TONES + 2)).toBe('theme-tone-3');
  });

  it('keeps the default colour for an unknown position', () => {
    expect(themeToneClass(undefined)).toBeUndefined();
    expect(themeToneClass(-1)).toBeUndefined();
  });
});
