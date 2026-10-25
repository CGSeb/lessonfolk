---
name: progress
description: Show the learner's LessonFolk progress across courses, or list the courses and themes. Use when the user asks where they are, how far they've got, or what they can learn. Also in French, such as "où j'en suis ?", "ma progression", "qu'est-ce que je peux apprendre ?".
---

Follow the LessonFolk `progress` procedure below with the LessonFolk tools (`get_progress`,
`list_courses`, `list_themes`).

The LessonFolk MCP server keeps the courses and the learner's progress. If its tools are not
available, do not teach from memory or from files, and keep no progress yourself. Tell the
learner that the LessonFolk server is not connected and how to fix it: run `/mcp`, pick the
LessonFolk server and sign in. With the LessonFolk plugin that server is https://lessonfolk.com;
for another LessonFolk instance, the steps are on its dashboard's **Connect** page. Then start
again.

<!-- The procedure below is copied by `npm run plugin:sync`: do not edit it here. -->

# LessonFolk: progress

## Show progress ("where am I?")
`get_progress()` and `list_courses()`. Summarise per course: lessons finished (done or skipped) / total, the current lesson, and topics flagged as hard in the notes (`recentNotes` has the latest; `get_progress(courseId)` gives the notes of one course). Say which lessons were skipped after the level check (`skipped_after_level_check`), and mention the learner's level and path if set. Keep it short and motivating.

## List courses ("what can I learn?")
`list_themes()` and `list_courses()`. Group the courses by theme, in theme order, keeping the course order within a theme. For each theme: its title and description, then each course with its level, description and the learner's status (not started / in progress / done / skipped after level check). Hide themes with no course. End by offering to explore one theme.

## Explore a theme ("show me the <theme> courses")
Match their words to one theme (title, id or description); if unclear, list the theme titles and ask which one. Show that theme only, as above, with `list_courses(theme)`. Suggest where to start: its first course that is not done and whose prerequisites are all done or skipped, and name any missing prerequisite course. A theme with no course yet: say so and suggest a related theme.
