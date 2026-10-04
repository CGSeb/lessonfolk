# Course format

Apprentice courses are plain files, versioned in git and taught by an AI agent
(Claude Code, Codex, …) in chat. A lesson is a **script for a tutor**, not a page to read:
it gives the content, how to teach it, and how to check understanding.

You can write courses by hand from this spec, or let your agent do it with you: say *"create a
course about…"* or *"add a lesson to…"* (the `create-course` and `edit-course` skills in Claude
Code; the "Create a course" and "Edit a course" procedures in `AGENTS.md` for other agents).

## Layout

```
courses/
  en/                         # language code (ISO 639-1)
    index.yaml                # ordered learning path for this language
    themes.yaml               # themes that group courses in the catalog
    ai-foundations/           # course id (kebab-case)
      course.yaml
      01-what-is-ai.md        # lesson file: NN-lesson-slug.md
      02-how-machines-learn.md
  fr/                         # optional translation, same ids and file names
```

Translations reuse the same course, lesson and theme ids, so progress is shared across
languages. A translation has its own `themes.yaml` with translated titles and descriptions.

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
in the dashboard and the tutor). Add a new theme only when no existing one fits.

## `course.yaml`

```yaml
id: ai-foundations
title: AI Foundations
level: beginner           # beginner | intermediate | advanced
theme: understanding-ai   # one theme id from themes.yaml
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
answer contains (not a word-for-word answer).

## Exercise            (optional)
A hands-on activity. Say whether it needs a computer, code, or nothing at all.

## Completion criteria
When the tutor may mark the lesson as done.

## Going further       (optional)
Links or topics for curious learners.
```

## Writing guidelines
- Write for the level stated. Beginner lessons define every term and avoid math.
- Keep lessons short: 3–6 key ideas, 10–25 minutes.
- Prefer everyday examples. Avoid fast-aging claims ("the best model today is…").
- No secrets, no paid-only requirements for mandatory exercises.

## Validation

Run `npm run check:courses` before opening a pull request. It fails on:
- invalid `index.yaml`, `themes.yaml`, `course.yaml` or lesson frontmatter, ids that do not
  match file paths, and broken prerequisites;
- a missing `themes.yaml`, duplicate theme ids, or a course whose `theme` is missing or not
  listed in `themes.yaml`;
- lesson sections that are missing, misspelled, duplicated or out of order (only the `##`
  headings above are allowed; `###` sub-headings are free);
- a question under `## Check your understanding` without a `Good answer:` line.

It only warns (without failing) when a lesson strays from the writing guidelines (fewer than
3 or more than 6 numbered key ideas, or `estimatedMinutes` outside 10–25) and when a theme has
no course yet.
