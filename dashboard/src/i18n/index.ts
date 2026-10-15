/**
 * The languages of the dashboard interface. The visitor's language is picked by the
 * middleware (`pickLocale`) and pages read it from `Astro.locals.lang`, with a translator
 * in `Astro.locals.t`. A string a translation lacks is shown in English.
 *
 * To add a language: a `<code>.ts` file shaped like `fr.ts`, then an entry in `LOCALES`,
 * `STRINGS`, `LOCALE_NAMES` and `OG_LOCALES`.
 */
import { en, fill, lookup, type PartialUiStrings, type UiKey, type UiParams } from './en';
import { fr } from './fr';

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const STRINGS: Record<Locale, PartialUiStrings> = { en, fr };

/** Each language's name in that language, for the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', fr: 'Français' };

/** Open Graph locale of each language. */
export const OG_LOCALES: Record<Locale, string> = { en: 'en_US', fr: 'fr_FR' };

/** Cookie that keeps the language the visitor chose in the switcher. */
export const LOCALE_COOKIE = 'lessonfolk-lang';

export type Translate = (key: UiKey, params?: UiParams) => string;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Look up UI strings in `locale`, falling back to English for a string it lacks. */
export function translator(locale: Locale): Translate {
  return (key, params) => {
    const value = lookup(STRINGS[locale], key) ?? lookup(en, key);
    if (value === undefined) throw new Error(`Missing UI string: ${key}`);
    return fill(value, params);
  };
}

/**
 * The visitor's language: the one chosen in the switcher (cookie), else the first language
 * of the browser's `Accept-Language` that the dashboard speaks, else English.
 */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const ranked = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter(({ q }) => Number.isFinite(q) && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked.map(({ lang }) => lang).find(isLocale) ?? DEFAULT_LOCALE;
}
