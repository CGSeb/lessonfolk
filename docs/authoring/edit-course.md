# Edit a course
Contributing mode again: write only inside the course being edited, plus the same course in
other languages and other lessons' `prerequisites` when ids change.

Start by reading `docs/course-format.md`, the course's `course.yaml` and all its lessons in
full. Then follow the case that matches the request.

**Lesson ids and learner progress.** A lesson id is `<course-id>/<file name>`, and learners'
saved progress (in the database and in exported `progress.json` files) refers to lessons by
id. Renaming a lesson file orphans that progress: the lesson shows as not started again. Before any rename, check
whether the course is published (`git log origin/main -- courses/<lang>/<course>/`). If it
is, tell the author and offer the choice: append at the end (no id changes), or insert and
renumber anyway. Lesson order comes from `course.yaml`, so ids never need to change for a
revision or a title change.

**Renaming rules** (inserting or reordering):
- Lesson files keep the `NN-slug.md` pattern, with `NN` matching the position in `course.yaml`.
- Rename with `git mv` to keep history (plain `mv` for files not committed yet, such as a
  course still being drafted). Work from the last lesson backwards so names never
  collide (`03-…` → `04-…` before `02-…` → `03-…`).
- For each renamed lesson, update its frontmatter `id`, its entry in `course.yaml`, and every
  `prerequisites` entry that refers to the old id, in all courses and all languages (search
  `courses/` for the old id).
- If the course exists in other languages, apply the same renames there.
- After the change, every lesson's prerequisites must come before it in the course order.
  `check:courses` does not check this, so check it yourself.

## Add a lesson
1. Ask, one question at a time: what the lesson teaches and what learners should be able to
   do after it, then where it goes (default: at the end).
2. Propose a mini-outline (file name, title, objective, `estimatedMinutes`, the key ideas as
   one line each) and, if lessons move, the table of renames (old id → new id) and the
   prerequisite changes. Point out any overlap with the other lessons of the course, and
   propose trimming the overlapping part. **Write nothing before the author approves.**
3. Apply the renames, then write the lesson with the writing rules of
   [Create a course](create-course.md) step 4. Its prerequisites are usually the previous
   lesson; the lesson after it should now depend on the new one.
4. Update `estimatedHours` in `course.yaml` if the total time changed noticeably.

## Revise a lesson
1. If the request is vague ("improve lesson 2"), offer a short review first: unclear key
   ideas, missing analogies or misconceptions in the teaching notes, vague `Good answer:`
   lines, completion criteria that do not match the checks, fast-aging claims.
2. Propose the changes as a summary per section, quoting the sentences you would replace.
   **Apply them only after the author approves.**
3. Keep the lesson id. Changing the title or content does not affect progress.

## Reorder lessons
1. Propose the new order, the table of renames and any prerequisite that would now come
   after the lesson that needs it. **Wait for approval.**
2. Apply the renames and reorder `course.yaml`.

## For every case
- Run `npm run check:courses` after the change and fix every error, then run it again.
- Hand back: what changed (files renamed, created or edited), the progress warning if ids
  changed, and a commit message in the format below: `feat: :sparkles: Add <lesson title>
  lesson to <course title>` for a new lesson, `docs: :memo: Revise <lesson title>` for a
  revision, `refactor: :recycle: Reorder <course title> lessons` for a reorder. Do not
  commit unless the author asks.

