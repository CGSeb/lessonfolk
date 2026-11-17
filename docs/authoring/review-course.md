# Review a course
Read-only: change no file. The review is your judgement against a fixed rubric, so it is
advice for the author, not a test: the same lesson may get a slightly different review twice.

1. Run `npm run review:courses -- <course-id or lesson-id>…` (no id: every lesson; run
   `npm install` first if dependencies are missing). It prints the rubric, the lesson files
   to review and an outline of the catalog. It calls no AI service: you do the review.
2. Read every listed lesson in full, and its `course.yaml`. For the overlap criterion, open
   the other lesson before you call something a repeat: similar titles are not enough.
3. Answer every criterion for every lesson. Fail one only for something you can quote from
   the lesson (or name as missing).
4. Report in the format the brief gives: one line per clean lesson, and for the others each
   failed criterion with the quote and what to change. End with the counts.
5. Offer to fix the flagged lessons with [Edit a course](edit-course.md) ("Revise a lesson"),
   which needs the author's approval first.

For more than about ten lessons, review one course at a time so each lesson gets a full read.

