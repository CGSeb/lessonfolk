# Course format

LessonFolk courses are plain files, versioned in git and taught by an AI agent
(Claude Code, Codex, …) in chat. A lesson is a **script for a tutor**, not a page to read:
it gives the content, how to teach it, and how to check understanding.

You can write courses by hand from this spec, or let your agent do it with you: say *"create a
course about…"* or *"add a lesson to…"* (the `create-course` and `edit-course` skills in Claude
Code; the "Create a course" and "Edit a course" procedures in `AGENTS.md` for other agents).

## Layout

```
courses/
  authors.yaml                # course authors, shared by every language
  authors/                    # optional author avatar images (never a language)
  en/                         # language code (ISO 639-1)
    index.yaml                # ordered learning path for this language
    themes.yaml               # themes that group courses in the catalog
    ai-foundations/           # course id (kebab-case)
      course.yaml
      01-what-is-ai.md        # lesson file: NN-lesson-slug.md
      02-how-machines-learn.md
  fr/                         # optional translation: only the files translated so far
    themes.yaml               # optional
    ai-foundations/
      course.yaml             # optional
      01-what-is-ai.md        # each lesson is optional too
```

Translations reuse the same course, lesson and theme ids, so progress is shared across
languages. `en` holds the courses; other languages are layered on top of it: see
[Translations](#translations).

## Translations

A language folder (`courses/fr/`) holds only translated files, with the same names as in
`courses/en/`. Whatever it lacks is shown in English, so a course can be translated one lesson
at a time. The dashboard shows the pages in the visitor's language with this fallback. The
tutor's course tools use the learner's profile language (saved as a code such as `fr`): they
return the translated lesson, or the English one, which the tutor still teaches in the
learner's language.

- **What comes from English.** Which courses exist, their order (`index.yaml`, not needed in a
  translation), lessons, levels, themes, authors, durations and prerequisites.
- **`themes.yaml`**: the themes to translate, with their `id`, `title` and `description`.
- **`course.yaml`**: `id`, `title` and `description`. Other fields are ignored, so you may copy
  the whole English file.
- **Lesson files**: a copy of the English lesson with its text translated. The frontmatter
  `id` stays; `title` and `objectives` are translated (the other fields are read from English).
  Keep the `##` section headings and the `Good answer:` labels in English: the tutor and
  `check:courses` rely on them. Keep the same "Check your understanding" questions in the same
  order: the tutor saves its verdict on each one by its number.

`npm run check:courses` reports a translation file that matches no English course, lesson or
theme, and a translated lesson whose sections are broken or whose number of checks differs
from the English one (the English one is shown instead).

## `index.yaml`

```yaml
courses:
  - ai-foundations        # in recommended order
  - prompting-basics
```

`index.yaml` is the recommended learning path across all themes; themes only group courses.

## `themes.yaml`

```yaml
themes:                   # in display order
  - id: understanding-ai  # kebab-case, unique
    title: Understanding AI
    description: One sentence on what the courses of this theme cover.
  - id: using-ai
    title: Using AI tools
    description: Practical skills to get useful, reliable results from AI assistants.
```

Every course belongs to exactly one theme. A theme with no course yet is allowed (it is hidden
in the dashboard catalog and in the tutor's course listing). Add a new theme only when no
existing one fits.

Themes are used in three places:

- **Catalog.** The dashboard and the tutor's "what can I learn?" group courses by theme, in
  `themes.yaml` order; within a theme, courses keep `index.yaml` order.
- **Interests.** During onboarding the tutor lists the theme titles (empty ones as "coming
  soon") and saves the learner's picks as theme ids in `profile.interests`.
- **Personal path.** When the tutor recommends a path, it keeps the unfinished courses at or
  below the learner's level in the themes they picked, plus their prerequisites whatever their
  theme. The course `level` matters too: the optional level check only asks about courses below
  the learner's level.

Theme ids end up in learners' saved progress, so never rename or remove a theme id once
it is published; change its title or description instead. Unknown ids are ignored with a
warning on the dashboard, never fatal.

### Choosing a theme

Pick the theme that matches what the learner will be able to *do* after the course, not the
technology it mentions:

| If learners will mainly… | Theme |
|---|---|
| understand how AI works (concepts, vocabulary, what happens inside) | `understanding-ai` |
| get better results from AI assistants they already use | `using-ai` |
| build apps, tools or agents on top of AI models (usually needs code) | `building-with-ai` |
| reason about risks, ethics and impact on people and work | `ai-and-society` |

If a course seems to fit two themes, choose the one its last lesson serves, and link the other
side through `prerequisites` or the lessons' "Going further". Propose a new theme (id, title,
one-sentence description) in your pull request only when none of the existing ones fits.

## `authors.yaml`

```yaml
authors:
  - slug: lessonfolk      # kebab-case, unique; used in course.yaml and in the author page URL
    name: LessonFolk
    bio: One or two sentences about the author.   # optional
    github: some-username # optional, GitHub username (not a URL)
    url: https://example.com   # optional, personal website (http or https)
    avatar: lessonfolk.svg     # optional, image file name in courses/authors/
```

`courses/authors.yaml` is shared by every language. Each author gets a page in the dashboard
(`/authors/<slug>`) listing their courses, with their links when set. Only add `github` or `url`
when the author gives them; never guess. Courses written by the project's maintainers use
the `lessonfolk` author.

`avatar` is the file name of an image in `courses/authors/` (lower-case kebab-case, `.png`,
`.jpg`, `.webp` or `.svg`, at most 512 KB), usually named after the slug. The dashboard shows it
round on the authors list and the author's page; a square image works best. Without an avatar
it shows the author's initials. Only add an image the author gave you and agreed to publish.
`courses/authors/` holds only these images: it is never read as a language folder.

## `course.yaml`

```yaml
id: ai-foundations
title: AI Foundations
level: beginner           # beginner | intermediate | advanced
theme: understanding-ai   # one theme id from themes.yaml
authors: [lessonfolk]     # one or more author slugs from authors.yaml
description: One or two sentences shown in the course list.
estimatedHours: 2
prerequisites: []         # course ids
lessons:                  # ordered; ids are <course-id>/<file name without .md>
  - ai-foundations/01-what-is-ai
  - ai-foundations/02-how-machines-learn
```

## Lesson file

Frontmatter, then these sections in this order. Section headings are fixed — the tutor
relies on them.

```markdown
---
id: ai-foundations/01-what-is-ai
title: What is AI?
level: beginner
estimatedMinutes: 15
objectives:
  - Explain in plain words what AI is
prerequisites: []        # lesson ids
---

## Key ideas
Numbered list of the ideas to teach, in order. Each idea: a short explanation
the tutor can rephrase. This is the content.

## Teaching notes
For the tutor only: analogies that work, common misconceptions, how to adapt for
beginners vs experienced learners, pacing hints.

## Check your understanding
Numbered questions. Under each, a "Good answer:" line describing what a correct
answer contains (not a word-for-word answer). Include at least one question that asks the
learner to apply an idea to a case, not only to recall it.

## Completion criteria
When the tutor may mark the lesson as done. The tutor asks every check, one at a time, and
saves its verdict on each (`record_check`) first: the server refuses to complete a lesson
before then.

## Going further       (optional)
Links or topics for curious learners.
```

## Writing guidelines
- Write for the level stated. Beginner lessons define every term and avoid math.
- Keep lessons short: 3–6 key ideas, 10–25 minutes.
- Prefer everyday examples. Avoid fast-aging claims ("the best model today is…").
- A lesson is taught and checked in the conversation: it has no exercise section, and its
  completion criteria never require the learner to build, install or pay for something.
- A lesson, even the last of a course, never asks the learner what to learn next or to plan
  their next steps: the tutor closes the lesson and proposes the next one in their path. A
  closing note may name a follow-up course in a sentence, nothing more.

## Validation

Run `npm run check:courses` before opening a pull request. It fails on:
- invalid `index.yaml`, `themes.yaml`, `course.yaml` or lesson frontmatter, ids that do not
  match file paths, and broken prerequisites;
- a missing `themes.yaml`, duplicate theme ids, or a course whose `theme` is missing or not
  listed in `themes.yaml`;
- a missing or invalid `authors.yaml`, duplicate author slugs, an `avatar` whose image is
  missing from `courses/authors/` or larger than 512 KB, or a course with no `authors` or an
  author slug not listed in `authors.yaml`;
- lesson sections that are missing, misspelled, duplicated or out of order (only the `##`
  headings above are allowed, so a `## Exercise` section from the older format fails;
  `###` sub-headings are free);
- a question under `## Check your understanding` without a `Good answer:` line.

It only warns (without failing) when a lesson strays from the writing guidelines (fewer than
3 or more than 6 numbered key ideas, or `estimatedMinutes` outside 10–25), when a course's
`estimatedHours` is more than 15 minutes away from the sum of its lessons' `estimatedMinutes`,
when a theme has no course yet, and when an author has no course in any language.

`check:courses` checks the times against each other, not against reality: nothing in the
files says how long a learner really takes.

## Review

`check:courses` cannot tell whether a lesson is any good. For that, ask your agent to
*"review the course …"* (`/review-course` in Claude Code, the "Review a course" procedure in
`AGENTS.md` for other agents). It reads each lesson and answers six questions:

| Criterion | The lesson… |
|---|---|
| `on-topic` | teaches what its title promises and belongs in its course |
| `objectives-covered` | teaches and tests every objective of its frontmatter |
| `criteria-match-checks` | has completion criteria the tutor can decide from the checks |
| `level-fit` | is written for its stated level |
| `no-fast-aging-claims` | has no claim that will soon be wrong (best model, prices, versions, dates) |
| `no-overlap` | does not repeat another lesson of the catalog |

The agent starts from `npm run review:courses -- <course-id or lesson-id>…`, which prints the
rubric, the lessons to read and the catalog outline, and calls no AI service. The review is
the agent's judgement: use it to pick the lessons to reread, not as a pass or fail.
