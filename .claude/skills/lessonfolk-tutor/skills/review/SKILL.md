---
name: review
description: Quiz the learner on completed LessonFolk lessons, focusing on weak spots. Use when the user says "quiz me" or "review".
---

Follow the LessonFolk `review` procedure below with the LessonFolk tools (`get_progress`,
`get_lesson`, `record_review_score`), together with the LessonFolk server's instructions.

The LessonFolk MCP server keeps the courses and the learner's progress. If its tools are not
available, do not teach from memory or from files, and keep no progress yourself. Tell the
learner that the LessonFolk server is not connected and how to fix it: run `/mcp`, pick the
LessonFolk server and sign in. With the LessonFolk plugin that server is https://lessonfolk.com;
for another LessonFolk instance, the steps are on its dashboard's **Connect** page. Then start
again.

<!-- The procedure below is copied by `npm run plugin:sync`: do not edit it here. -->

# LessonFolk: review

1. `get_progress()`: pick the `done` lessons with the lowest scores or with difficulties in their notes. None done yet: say so and offer to start learning.
2. Ask 2–4 questions in total from their `## Check your understanding` sections (`get_lesson(lessonId, lang)`), one at a time. Judge against the "Good answer" hints; be encouraging, correct gently, re-explain differently if needed.
3. When a lesson's answers beat its saved score: `record_review_score(lessonId, score)` right away.
