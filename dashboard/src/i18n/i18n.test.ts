import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { LOCALES, LOCALE_NAMES, OG_LOCALES, pickLocale, translator } from './index';

/** Every dotted key of a strings object, with its value. */
function entries(node: object, prefix = ''): [string, string][] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value] as [string, string]] : entries(value, `${prefix}${key}.`),
  );
}

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('French strings', () => {
  const english = new Map(entries(en));

  it('only use keys that exist in English', () => {
    expect(entries(fr).map(([key]) => key).filter((key) => !english.has(key))).toEqual([]);
  });

  it('keep the placeholders of the English strings', () => {
    const mismatched = entries(fr).filter(([key, value]) => placeholders(value).join() !== placeholders(english.get(key)!).join());
    expect(mismatched).toEqual([]);
  });

  it('contain no control characters, and a no-break space before : ; ! ?', () => {
    for (const [key, value] of entries(fr)) {
      expect(value, key).not.toMatch(/[\u0000-\u001f]/);
      expect(value, key).not.toMatch(/ [:;!?](?: |$)/);
    }
  });

  it('translate every string meant for people (commands may stay English)', () => {
    const missing = [...english.keys()].filter((key) => !entries(fr).some(([k]) => k === key));
    expect(missing.every((key) => key.endsWith('Command'))).toBe(true);
  });
});

describe('translator', () => {
  it('speaks the language and fills placeholders', () => {
    expect(translator('fr')('nav.home')).toBe('Accueil');
    expect(translator('fr')('course.minutes', { minutes: 15 })).toBe('Environ 15 min');
    expect(translator('en')('nav.home')).toBe('Home');
  });

  it('falls back to English for a string the translation lacks', () => {
    expect(translator('fr')('course.issuesCommand')).toBe('npm run check:courses');
  });

  it('has a name and an Open Graph locale for every language', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
      expect(OG_LOCALES[locale]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    }
  });
});

describe('pickLocale', () => {
  it('keeps the language chosen in the switcher', () => {
    expect(pickLocale('fr', 'en-US,en;q=0.9')).toBe('fr');
    expect(pickLocale('en', 'fr-FR')).toBe('en');
  });

  it('otherwise follows the browser languages, in order of preference', () => {
    expect(pickLocale(undefined, 'fr-CA,fr;q=0.9,en;q=0.8')).toBe('fr');
    expect(pickLocale(undefined, 'de-DE,de;q=0.9,fr;q=0.8,en;q=0.7')).toBe('fr');
    expect(pickLocale(undefined, 'en;q=0.5,fr;q=0.8')).toBe('fr');
    expect(pickLocale(undefined, 'fr;q=0,en')).toBe('en');
  });

  it('falls back to English', () => {
    expect(pickLocale(undefined, null)).toBe('en');
    expect(pickLocale('xx', 'de-DE')).toBe('en');
    expect(pickLocale(undefined, 'garbage;;;,')).toBe('en');
  });
});
