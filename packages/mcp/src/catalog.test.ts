import { emptyProgress } from '@lessonfolk/core';
import { describe, expect, it } from 'vitest';
import { learnerLang } from './catalog.ts';

const withLanguage = (language: string) => ({ ...emptyProgress(), profile: { language } });

describe('learnerLang', () => {
  it('uses the language asked for first', () => {
    expect(learnerLang(withLanguage('fr'), 'en')).toBe('en');
  });

  it("otherwise uses the learner's profile language, as a code or a name", () => {
    expect(learnerLang(withLanguage('fr'))).toBe('fr');
    expect(learnerLang(withLanguage('Français'))).toBe('fr');
  });

  it('falls back to English', () => {
    expect(learnerLang(emptyProgress())).toBe('en');
    expect(learnerLang(withLanguage('Klingon please'))).toBe('en');
  });
});
