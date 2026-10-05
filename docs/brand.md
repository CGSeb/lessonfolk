# Apprentice brand

Apprentice should feel friendly, calm and trustworthy: a patient tutor, not a developer tool.
Everything here derives from the **Spark A** logo. The dashboard implements it as CSS design
tokens in [`dashboard/src/styles/tokens.css`](../dashboard/src/styles/tokens.css); use the
tokens, never raw values.

## Logo

| File | Use |
|---|---|
| [`assets/brand/icon.svg`](../assets/brand/icon.svg) | The mark alone: favicons, app icons, avatars, small spaces |
| [`assets/brand/logo.svg`](../assets/brand/logo.svg) | Mark + wordmark, dark text, for light backgrounds |
| [`assets/brand/logo-dark.svg`](../assets/brand/logo-dark.svg) | Mark + wordmark, light text, for dark backgrounds |
| [`dashboard/public/favicon.svg`](../dashboard/public/favicon.svg), `favicon-32.png` | Browser tab icon |

The mark is an indigo rounded square (corner radius 16 on 64, so 25%) with a white, round-capped
"A" and an amber dot: the spark of understanding. The wordmark is **apprentice** in lowercase,
Inter Medium. The mark looks the same in light and dark themes; only the wordmark colour changes.

- **Minimum size:** mark 16 px (favicon); full logo 120 px wide. Below that, use the mark alone.
- **Clear space:** keep at least a quarter of the mark's height (16 units of 64) free on every side.
- **Light or dark:** pick `logo.svg` or `logo-dark.svg` by background; in HTML use a
  `<picture>` with `prefers-color-scheme` (see the README).
- In the dashboard header the mark is inline SVG coloured with the brand tokens
  `--brand-indigo`, `--brand-white` and `--brand-amber`.

**Don't** recolour the mark, swap the dot for another colour, stretch or rotate it, add shadows
or outlines, put it on a busy photo, or set the wordmark in another font or in capitals.

## Colour

Two brand colours, used with restraint, on calm cool-grey neutrals.

| Role | Light | Dark | Notes |
|---|---|---|---|
| Brand indigo (logo) | `#4F46E5` | `#4F46E5` | Fixed. `--brand-indigo` |
| Brand amber, the spark (logo) | `#FBBF24` | `#FBBF24` | Fixed. `--brand-amber` |
| Page background `--color-bg` | `#F8F8FC` | `#131528` | |
| Card surface `--color-surface` | `#FFFFFF` | `#1A1C33` | |
| Sunken surface `--color-surface-sunken` | `#F1F1F8` | `#0C0E1F` | Code, notes, inner panels |
| Text `--color-text` | `#1A1C33` | `#F1F1F8` | |
| Muted text `--color-text-muted` | `#50536E` | `#BDBFD3` | Meta, captions |
| Accent `--color-accent` | `#4F46E5` | `#A5B4FC` | Links, active nav, overlines |
| Accent hover `--color-accent-strong` | `#3730A3` | `#C7D2FE` | |
| Accent tint `--color-accent-subtle` | `#EEF2FF` | `#1E1B4B` | Chips, active nav background |
| Spark `--color-spark` | `#FBBF24` | `#FBBF24` | Highlights only |
| Progress fill / track | `#4F46E5` / `#E6E7F1` | `#818CF8` / `#2A2C45` | |
| Success text / background | `#166534` / `#D3F5E0` | `#86EFAC` / `#123D26` | "Done", "Completed" |
| Info text / background | `#4338CA` / `#E0E7FF` | `#C7D2FE` / `#312E81` | "In progress" |
| Warning text / background | `#78350F` / `#FEF3C7` | `#FCD34D` / `#3B2508` | Notices |
| Focus ring / halo | `#4F46E5` / `#FCD34D` | `#FBBF24` / `#3730A3` | Every focusable element |

`tokens.css` also holds the full ramps (`--indigo-50` to `--indigo-950`, `--amber-50` to
`--amber-950`, `--neutral-0` to `--neutral-950`) that these roles map onto.

### Course theme colours

Each course theme has its own tone, so learners spot a theme at a glance on theme badges and
the catalog's theme filters. The tones are cool hues next to the brand indigo, in
`themes.yaml` order: **indigo, sky, violet, rose, teal** (a sixth theme starts again at indigo).
Every tone follows the indigo badge pattern: a `50` tint with `800` text in light, a `950`
tint with `200` text in dark, and a `700` / `300` fill for the selected filter (indigo keeps the accent `600` / `300`). Badge text is
at least 7:1 and filled text at least 5.4:1. The classes `.theme-tone-1` to `.theme-tone-5` in
`tokens.css` set them; the "All" filter stays neutral. Amber and green stay reserved for the
spark and for success.

### Light and dark themes

Each semantic colour is written once as `light-dark(<light>, <dark>)`, so a single token serves
both themes. The theme follows the system setting until the learner uses the sun/moon switch in
the header; the choice is saved in the browser (`localStorage`, key `apprentice-theme`) and sets
`data-theme="light"` or `"dark"` on `<html>`, which pins `color-scheme`. Without JavaScript the
switch is hidden and the system setting applies.

### Where the spark goes

Amber marks the moments that matter, and only those: the **next lesson** card (amber top stripe,
amber dot before "Next up"), **achievements** (finished every lesson, finished a course) and the
**focus ring** (amber ring in dark, amber halo in light). If everything sparkles, nothing does.

### Contrast

Every text colour reaches WCAG AA (at least 4.5:1) on the background, surface and sunken surface
in both themes; the lowest pair is accent on sunken in light (5.6:1). The focus ring, progress
fill and strong borders reach at least 3:1 against what surrounds them. The pull request for
[#15](https://github.com/CGSeb/apprentice/issues/15) has the full table.

**Amber is never text on a light background** (it is only 1.7:1 on white). In light mode it is
always a shape: a stripe, a dot, a halo. Warning text uses dark brown `#78350F` instead.

## Typography

[Inter](https://rsms.me/inter/) (variable), self-hosted through `@fontsource-variable/inter`:
bundled with the dashboard, no request to Google or any CDN, works offline. Fallback:
`system-ui` and the usual system sans-serif fonts.

| Token | Size | Use |
|---|---|---|
| `--text-3xl` | 32 to 44 px (fluid) | h1, bold 700, line-height 1.2, tracking -0.02em |
| `--text-2xl` | 24 to 30 px (fluid) | h2, semibold 600, line-height 1.2 |
| `--text-xl` | 21 px | h3, card titles, key numbers |
| `--text-lg` | 18 px | Lead paragraphs |
| `--text-base` | 16 px | Body, line-height 1.6 |
| `--text-sm` | 14 px | Meta, captions, badges, small headings |
| `--text-xs` | 12 px | Overlines ("NEXT UP"), bold, uppercase, tracking 0.08em |

Weights: 400 body, 500 links and badges, 600 headings, 700 h1 and overlines.
Keep lines under about 70 characters.

## Shape and spacing

The mark's soft 25% corner and round stroke caps set the tone: **rounded, never sharp**.

- Radius: `--radius-sm` 8 px (code), `--radius-md` 12 px (notices, inner panels),
  `--radius-lg` 20 px (cards), `--radius-pill` for badges, nav links, phrase chips and progress bars.
- Round dots and rings (objective bullets, step counters, the spark dot) echo the mark's dot.
- Spacing: a 4 px based scale, `--space-1` (4 px) to `--space-8` (64 px). Cards use
  `--space-5` padding; sections are separated by `--space-5` to `--space-6`.
- Shadows are soft and slightly indigo-tinted (`--shadow-card`, `--shadow-raised` on hover).

## Do / don't

| Do | Don't |
|---|---|
| Use tokens from `tokens.css` for every colour, size, radius and space | Hard-code hex or `rgb()` values in components |
| Keep indigo for links, actions and the current place | Use indigo and amber side by side as large fills |
| Save amber for the next step and achievements | Use amber for body text, links or anything on a light background |
| Pair colour with text ("Done", "In progress") | Rely on colour alone to convey status |
| Write warm, plain sentences | Use developer jargon or shouty capitals in body copy |
| Check both themes and a 375 px wide screen | Ship a change seen only in light mode on desktop |
