# Project format

A **project** is where a learner puts the courses to work: a real result to reach, on a subject
they choose where possible, in a few milestones. The tutor coaches: it asks questions, gives a
hint when the learner is stuck and reviews the result, but never does the work.

Lessons teach and check understanding in the conversation (see [Course format](course-format.md)).
Projects are the hands-on part: unlike a lesson, a project may ask the learner to make
something, with the tools listed in its `needs`.

## Layout

Projects have their own folder at the repository root, next to `courses/`. They use the
themes (`courses/<lang>/themes.yaml`), the authors (`courses/authors.yaml`) and the courses
of the catalog, and `npm run check:courses` checks them with the courses:

```
courses/                   # the courses, themes and authors
projects/
  en/
    index.yaml             # ordered list of project ids
    reusable-prompt.md     # one file per project: <project-id>.md
  fr/                      # optional translation: only the files translated so far
    reusable-prompt.md
```

`LESSONFOLK_PROJECTS_DIR` reads the projects from another folder, like
`LESSONFOLK_COURSES_DIR` for the courses (see [Settings](configuration.md)).

## `index.yaml`

```yaml
projects:
  - reusable-prompt
```

The order is the order of the catalog. Only `en/index.yaml` is read: translations reuse it.

## Project file

Frontmatter, then these sections in this order. Section headings are fixed: the tutor relies
on them.

```markdown
---
id: reusable-prompt               # kebab-case, matches the file name
title: A prompt you can reuse every week
level: beginner                   # beginner | intermediate | advanced
theme: using-ai                   # a theme id from courses/en/themes.yaml
authors: [lessonfolk]             # slugs from courses/authors.yaml
description: One or two sentences for the catalog.
estimatedHours: 2
buildsOn: [prompting-basics]      # course ids whose ideas it puts to work; [] when none
needs:                            # what the learner needs, at least one item
  - An AI chat app (a free plan is enough)
---

## Brief
For the learner: the subject, the result to reach, what they choose, and the rules that
apply (for example what never to paste into an AI app).

## Milestones
Numbered milestones, in order. Each one says what to reach, not how, and has a
"Done when:" line: what the tutor must see to count it as reached.

## Coaching notes
For the tutor only: how to help without doing the work, the usual misses at each milestone,
how to adapt for beginners vs experienced learners, pacing.

## Review
Numbered criteria the tutor uses to review the finished result with the learner.

## Going further       (optional)
Ideas for learners who want more.
```

## Writing guidelines

- **Milestones, not instructions.** A milestone names a result ("test it on three real
  cases"), not the steps to get there. Keep 3–6 milestones and 1–10 hours.
- **A real subject.** Let the learner pick their own topic or data where possible, rather than
  a toy exercise.
- **Checkable "Done when:" lines.** Each one describes what the learner shows or explains, so
  the tutor can decide from the conversation. The tutor only sees what the learner pastes.
- **Coach, not solution.** Coaching notes say how to help (questions, a pointer to an idea, an
  example on a different task) and never give the answer to paste.
- **Cheap and safe.** Prefer free tools, say in `needs` what is required, and remind the
  learner not to share personal or confidential data.
- When a project relies on a course, list it in `buildsOn` and name it in a sentence
  ("covered in Prompting Basics"): the learner may have skipped it after the level check.
- Avoid fast-aging claims (best model, prices, version numbers), like in lessons.

## Translations

A translated project is a copy of the English file in `projects/<lang>/`, with the
same file name. Only `id`, `title`, `description` and `needs` are read from its frontmatter;
the rest comes from English. Keep the `##` headings and the `Done when:` labels in English, and
keep the same milestones and review criteria in the same order: the tutor records milestones
by their number. A project without a translation is shown in English.

## How the tutor uses a project

The tutor follows the `project` prompt ([`packages/mcp/prompts/project.md`](../packages/mcp/prompts/project.md)):
it reads the project with `get_project`, presents the brief, then coaches one milestone at a
time. It calls `record_milestone` when the learner shows what a `Done when:` line asks
(milestones are reached in order), `record_project_review` on each review criterion (`met`,
`partly` or `not_met`), then `complete_project`. The progress is saved under `projects` in
progress.json (see [`progress.example.json`](progress.example.json)) and in the
`project_progress` table.

## On the dashboard

`/projects` lists the projects and `/projects/<project-id>` shows one: the brief, `needs`, the
`buildsOn` courses, the milestones with their `Done when:` lines, the review criteria and
"Going further", with the learner's progress. The coaching notes are never shown. A course page
lists the projects that build on it. Inline `**bold**` and `` `code` `` are rendered; other
Markdown is shown as plain text, so keep the brief, milestones and criteria to short paragraphs.

## Validation

`npm run check:courses` checks the projects with the courses. It fails on:
- an invalid `index.yaml` or frontmatter, a project listed twice, a listed project without its
  file, a project file not listed, or an `id` that does not match the file name;
- a `theme`, author or `buildsOn` course that does not exist;
- sections that are missing, misspelled, duplicated or out of order, an empty `## Brief`, a
  milestone without a `Done when:` line, or a `## Review` without numbered criteria;
- a translation of a project that does not exist, or with a different number of milestones
  or review criteria than the English one.

It only warns when a project has fewer than 3 or more than 6 milestones, or `estimatedHours`
outside 1–10.
