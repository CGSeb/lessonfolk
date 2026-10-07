# LessonFolk: progress

## Show progress ("where am I?")
`get_progress()` and `list_courses()`. Summarise per course: lessons finished (done or skipped) / total, the current lesson, and topics flagged as hard in the notes. Say which lessons were skipped after the level check (`skipped_after_level_check`), and mention the learner's level and path if set. Keep it short and motivating.

## List courses ("what can I learn?")
`list_themes()` and `list_courses()`. Group the courses by theme, in theme order, keeping the course order within a theme. For each theme: its title and description, then each course with its level, description and the learner's status (not started / in progress / done / skipped after level check). Hide themes with no course. End by offering to explore one theme.

## Explore a theme ("show me the <theme> courses")
Match their words to one theme (title, id or description); if unclear, list the theme titles and ask which one. Show that theme only, as above, with `list_courses(theme)`. Suggest where to start: its first course that is not done and whose prerequisites are all done or skipped, and name any missing prerequisite course. A theme with no course yet: say so and suggest a related theme.
