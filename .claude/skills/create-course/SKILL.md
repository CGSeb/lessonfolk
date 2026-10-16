---
name: create-course
description: Create a new LessonFolk course with its author — interview, outline for approval, then course.yaml, lessons, the index.yaml entry and the French translation, validated with check:courses. Use when the user wants to create, write or add a new course (e.g. "create a course about…", "new course on…").
---

Follow the "Create a course" procedure in `AGENTS.md` (Contributing section). Read
`docs/course-format.md` first, and write no file before the author approves the outline.
Every course credits its authors from `courses/authors.yaml` (default `lessonfolk` for the
maintainer's courses); never invent an author's links.
Write the course in English, then translate it to French (`courses/fr/`) as the procedure's
translation step says, without asking again.

To change a course that already exists (add, revise or reorder lessons), use `edit-course` instead.
