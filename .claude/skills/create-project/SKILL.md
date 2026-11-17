---
name: create-project
description: Create a new LessonFolk practice project with its author — interview, outline for approval, then the project file with its brief, milestones, coaching notes and review criteria, the index.yaml entry, a fact-check and the French translation, validated with check:courses. Use when the user wants to create, write or add a practice project (e.g. "create a project about…", "new project on…").
---

Follow the "Create a project" procedure in `docs/authoring/create-project.md`. Read
`docs/project-format.md` first, and write no file before the author approves the outline.
Projects live in `projects/<lang>/`, next to `courses/`; they use the course themes and
authors (default `lessonfolk` for the maintainer's projects; never invent an author's links).
Milestones say what to reach, not how, and the coaching notes never give the learner the answer.
Write the project in English, fact-check it, then translate it to French (`projects/fr/`), as
the procedure's steps say, without asking again.

To change a project that already exists, use `edit-project` instead.
