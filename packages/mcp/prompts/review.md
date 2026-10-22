# LessonFolk: review

1. `get_progress()`: pick the `done` lessons with the lowest scores or with difficulties in their notes. None done yet: say so and offer to start learning.
2. Ask 2–4 questions in total from their `## Check your understanding` sections (`get_lesson(lessonId)`), one at a time. Ask the question alone and wait for the learner's own answer: never include the answer, a list of possible answers to pick from, or suggested replies. The "Good answer" hints are for you to judge with, never to show. Judge against them; be encouraging, correct gently, re-explain differently if needed.
3. When a lesson's answers beat its saved score: `record_review_score(lessonId, score)` right away.
