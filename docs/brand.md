# LessonFolk brand

LessonFolk should feel friendly, calm and trustworthy: a patient tutor, not a developer tool.
The dashboard's look is called **Bright Thread**: the site reads as a chat thread made of
coloured bubbles, because a conversation is how LessonFolk teaches. The dashboard implements it
as CSS design tokens in [`dashboard/src/styles/tokens.css`](../dashboard/src/styles/tokens.css);
use the tokens, never raw values.

## Logo

| File | Use |
|---|---|
| [`assets/brand/icon.svg`](../assets/brand/icon.svg) | The mark alone: favicons, app icons, avatars, small spaces |
| [`assets/brand/logo.svg`](../assets/brand/logo.svg) | Mark + wordmark, dark text, for light backgrounds |
| [`assets/brand/logo-dark.svg`](../assets/brand/logo-dark.svg) | Mark + wordmark, light text, for dark backgrounds |
| [`dashboard/public/favicon.svg`](../dashboard/public/favicon.svg), `favicon-32.png` | Browser tab icon |

The mark is an indigo rounded square (corner radius 16 on 64, so 25%) with a heavy white,
round-capped "L" and a large amber four-point sparkle in its corner: the spark of understanding. The wordmark is **LessonFolk**, with a capital L and a capital F,
in Inter Medium. The mark looks the same in light and dark themes; only the wordmark colour changes.

- **Minimum size:** mark 16 px (favicon); full logo 120 px wide. Below that, use the mark alone.
- **Clear space:** keep at least a quarter of the mark's height (16 units of 64) free on every side.
- **Light or dark:** pick `logo.svg` or `logo-dark.svg` by background; in HTML use a
  `<picture>` with `prefers-color-scheme` (see the README).
- In the dashboard header the mark is inline SVG coloured with the brand tokens
  `--brand-indigo`, `--brand-white` and `--brand-amber`, and the wordmark uses `--font-brand` (Inter).

**Don't** recolour the mark, swap the sparkle for another colour or shape, stretch or rotate it, add shadows
or outlines, put it on a busy photo, or set the wordmark in another font, in all capitals or in all lowercase.

## The thread

Every block is a chat bubble, and its shape says who is speaking:

| Bubble | Shape | Colour | Use |
|---|---|---|---|
| The tutor's (`.card`) | Tail top left | Neutral grey, or a tint: `.card--indigo`, `--sky`, `--rose`, `--teal`, `--violet` | Everything the site says: cards, panels, nav links, notices |
| The learner's (`.bubble-you`, `.button--primary`) | Tail bottom right | Indigo `--color-accent` | Everything the learner says or does: the phrase to say to the tutor, the main button, sign in |
| The spark (`.card--spark`) | Tail top left | Amber `--color-spark`, dark text | The next lesson and achievements, and only those |
| The ink bubble (`.card--ink`) | Tail top left | The text colour as a fill | The strong, inverted bubble: overall progress, the current nav item |

A group of bubbles from one speaker is a `.turn` (`.turn--you` on the right), opened by a small
`.speaker` label ("Your tutor", "You say"). Bubbles are flat fills: no border, no shadow. A course's
bubble takes the colour of its theme (see below).

## Colour

| Role | Light | Dark | Notes |
|---|---|---|---|
| Brand indigo (logo) | `#4F46E5` | `#4F46E5` | Fixed. `--brand-indigo` |
| Brand amber, the spark (logo) | `#FBBF24` | `#FBBF24` | Fixed. `--brand-amber` |
| Page background `--color-bg` | `#FFFFFF` | `#1A1C33` | |
| Neutral bubble `--color-surface` | `#F1F1F8` | white at 10% | See-through in dark |
| Panel inside a bubble `--color-surface-sunken` | `#FFFFFF` | black at 28% | Tutor notes, code, badges in a bubble |
| Text `--color-text` | `#1A1C33` | `#F1F1F8` | |
| Muted text `--color-text-muted` | `#50536E` | `#BDBFD3` | Meta, captions |
| Accent `--color-accent` | `#4F46E5` | `#A5B4FC` | The learner's bubble, links |
| Accent hover `--color-accent-strong` | `#3730A3` | `#C7D2FE` | Also links inside a coloured bubble |
| Bubble tints `--color-tint-*` | the hue's `100` (indigo `50`) | the hue's `400` at 28% | indigo, sky, rose, teal, violet |
| Spark `--color-spark` / text on it | `#FBBF24` / `#1A1C33` | amber mixed 88% with the page colour / `#1A1C33` | Dark text in both themes; a deeper gold in dark |
| Ink bubble `--color-ink` / text on it | `#1A1C33` / `#FFFFFF` | `#F1F1F8` / `#1A1C33` | |
| Progress fill / track | `#4F46E5` / `#E6E7F1` | `#818CF8` / `#3B3D57` | |
| Success text / background | `#166534` / `#D3F5E0` | `#86EFAC` / green `500` at 24% | "Done", finished lessons and courses |
| Info text / background | `#4338CA` / `#E0E7FF` | `#C7D2FE` / `#312E81` | "In progress" |
| Warning text / background | `#78350F` / `#FEF3C7` | `#FCD34D` / `#3B2508` | Notices |
| Focus ring / halo | `#4F46E5` / `#FCD34D` | `#FBBF24` / `#3730A3` | Every focusable element |

`tokens.css` also holds the full ramps these roles map onto.

### Course theme colours

Each course theme has its own tone, in `themes.yaml` order: **indigo, sky, violet, rose, teal**
(a sixth theme starts again at indigo). The classes `.theme-tone-1` to `.theme-tone-5` in
`tokens.css` set three things: the theme badge (a `50` tint with `800` text in light, a `950`
tint with `200` text in dark), the selected filter of the catalog (a `700` / `300` fill), and
`--color-theme-bubble`, the colour of the course's own bubble on course cards and on the course
page (the hue's `200` in light, its `400` at 38% in dark). Badge text is at least 7:1 and filled text at
least 5.4:1; the "All" filter stays neutral. Amber and green stay reserved for the spark and for
success.

### Light and dark themes

Each semantic colour is written once as `light-dark(<light>, <dark>)`, so a single token serves
both themes. The theme follows the system setting until the learner uses the sun/moon switch in
the header; the choice is saved in the browser (`localStorage`, key `lessonfolk-theme`) and sets
`data-theme="light"` or `"dark"` on `<html>`, which pins `color-scheme`. Without JavaScript the
switch is hidden and the system setting applies. In the dark theme the bubbles are see-through
washes of colour over the page, which keeps them light. The spark bubble sets `color-scheme: light` on
its content, so everything inside it keeps its light colours on amber in the dark theme too.

### Where the spark goes

Amber marks the moments that matter, and only those: the **next lesson** bubble (and the course it
comes from in the path), **achievements** (finished every lesson, finished a course), the
"Recommended for you" badge and the **focus ring** (amber ring in dark, amber halo in light). On
the landing page it also closes the thread, on the last call to sign in. If everything sparkles,
nothing does.

### Contrast

Every text colour reaches WCAG AA (at least 4.5:1, or 3:1 for large text) on the page, on every
bubble and on every tint, in both themes. The focus ring, progress fill and strong borders reach
at least 3:1 against what surrounds them.

**Amber is never text on a light background** (it is only 1.7:1 on white). It is a fill, with the
dark text colour on it. Warning text uses dark brown `#78350F` instead.

## Typography

Three typefaces, all self-hosted through `@fontsource` packages: bundled with the dashboard, no
request to Google or any CDN, works offline.

| Token | Typeface | Use |
|---|---|---|
| `--font-sans` | [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) (variable) | All text. Headings are extra bold (800) with tight tracking |
| `--font-mono` | [DM Mono](https://github.com/googlefonts/dm-mono) | What is typed or labelled: the phrases to say to the tutor, speaker labels, overlines, code |
| `--font-brand` | [Inter](https://rsms.me/inter/) (variable) | The wordmark only |

| Token | Size | Use |
|---|---|---|
| `--text-hero` | 42 to 92 px (fluid) | The landing headline |
| `--text-3xl` | 36 to 64 px (fluid) | h1, the next lesson's title, line-height 1, tracking -0.045em |
| `--text-2xl` | 24 to 30 px (fluid) | h2 |
| `--text-xl` | 21 px | h3, card titles, key numbers |
| `--text-lg` | 18 px | Lead paragraphs, the learner's bubbles |
| `--text-base` | 16 px | Body, line-height 1.6 |
| `--text-sm` | 14 px | Meta, captions, badges, nav links, overlines |
| `--text-xs` | 12 px | Speaker labels ("YOUR TUTOR"), mono, uppercase, tracking 0.08em |

Weights: 400 body, 500 mono, 700 links and badges, 800 headings and buttons.
Keep lines under about 70 characters.

## Shape and spacing

- A bubble is round on three corners, with one small **tail** corner (`--radius-tail`, 8 px). Use the
  ready-made shapes: `--bubble-sm` (badges), `--bubble-md` (nav links, buttons, notices),
  `--bubble-lg` (cards) and `--bubble-xl` (the hero, the next lesson, a course's header), and
  `--bubble-you-md` / `--bubble-you-lg` for the learner's side.
- `--radius-md` (16 px) is for panels inside a bubble, `--radius-pill` for progress bars and round
  icon buttons.
- Spacing: a 4 px based scale, `--space-1` (4 px) to `--space-8` (64 px). Bubbles in a group sit
  `--space-3` apart; turns of the thread `--space-5`.

## Do / don't

| Do | Don't |
|---|---|
| Use tokens from `tokens.css` for every colour, size, radius and space | Hard-code hex or `rgb()` values in components |
| Give what the site says the tutor's bubble, and what the learner does theirs | Use the indigo "you" bubble for the site's own content |
| Save amber for the next step and achievements | Use amber for body text, links or anything on a light background |
| Pair colour with text ("Done", "In progress") | Rely on colour alone to convey status |
| Write warm, plain sentences | Use developer jargon or shouty capitals in body copy |
| Check both themes and a 375 px wide screen | Ship a change seen only in light mode on desktop |
