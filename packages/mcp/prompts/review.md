# LessonFolk: review

1. `get_progress()`: pick the `done` lessons with the lowest scores or with difficulties in their notes. None done yet: say so and offer to start learning.
2. Ask 2–4 questions in total from their `## Check your understanding` sections (`get_lesson(lessonId, lang)`), one at a time. Judge against the "Good answer" hints; be encouraging, correct gently, re-explain differently if needed.
3. When a lesson's answers beat its saved score: `record_review_score(lessonId, score)` right away.
