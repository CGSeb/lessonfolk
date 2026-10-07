# LessonFolk — Agent Instructions

**LessonFolk** is an open-source project that teaches AI to anyone, from complete beginners to
advanced practitioners, through a conversation with an AI tutor.

Courses live in `courses/` (versioned). Learners' progress lives in a database, behind the
LessonFolk **MCP server** (`/mcp` of the dashboard app), never in files of this repository.

## Repository map

| Path | Purpose |
|---|---|
| `courses/<lang>/index.yaml` | Ordered catalog of courses for a language (the recommended learning path) |
| `courses/<lang>/themes.yaml` | Ordered themes that group courses; each course names one in `course.yaml` |
| `courses/authors.yaml` | Course authors (all languages); each course lists its authors in `course.yaml` |
| `courses/<lang>/<course>/course.yaml` | Course metadata and ordered list of lessons |
| `courses/<lang>/<course>/<lesson>.md` | A lesson: content + teaching notes + checks |
| `docs/course-format.md` | Specification of the course and lesson format |
| `packages/mcp/prompts/` | The tutor's instructions and its `learn`, `review` and `progress` procedures, served by the MCP server |
| `docs/progress.example.json` | The progress import/export format (`progress.json` v1) |

## When the user wants to learn

The tutoring procedures (onboarding, level check, path, lessons, review, progress) are served
by the LessonFolk MCP server, with the tools that read the courses and save progress. The
project's `.mcp.json` connects to `http://localhost:4321/mcp`.

- **The LessonFolk tools are available** (`get_progress`, `get_next_lesson`…): follow the
  server's instructions and its `learn`, `review` or `progress` prompt for what the learner asks
  (the text of each prompt is `packages/mcp/prompts/<name>.md`). Read and save progress only
  through the tools.
- **They are not**: do not teach from the files or keep progress yourself. Tell the learner to
  start LessonFolk (`docker compose up -d --build` in this folder, then open
  http://127.0.0.1:4321), connect their chat (in Claude Code, approve the `lessonfolk` server of
  `.mcp.json`; other apps: the dashboard's **Connect** page), and start the session again. Or to
  use a hosted LessonFolk. See `docs/using-lessonfolk.md`.
- Never modify `courses/` while tutoring, and never create or edit progress files such as
  `.progress/progress.json`. An old one can be imported on the dashboard's **Your data** page.

## Contributing (when the user is editing the project, not learning)
If the user asks to create or edit courses, follow `docs/course-format.md` exactly and keep
`course.yaml` and `index.yaml` in sync with the lesson files.

- **"create a course about…" / "new course" / "write a course"** → [Create a course](#create-a-course)
- **"add a lesson to…" / "improve lesson…" / "reorder the lessons of…"** → [Edit a course](#edit-a-course)

### Create a course
This is contributing mode: the tutoring rule "never modify `courses/`" does not apply, but
only write the new course's folder and `courses/<lang>/index.yaml` (plus
`courses/<lang>/themes.yaml` if the author approves a new theme, and `courses/authors.yaml`
(with the author's avatar image in `courses/authors/` if they give one) to add a new course
author). Never edit other courses.

1. **Prepare.** Read `docs/course-format.md`, `courses/<lang>/index.yaml`,
   `courses/<lang>/themes.yaml`, `courses/authors.yaml` and every listed
   `course.yaml`, so you know which courses exist and at what level. Read one or two lessons
   of `ai-foundations` in full: they are the quality bar.
2. **Interview**, one question at a time, skipping anything the author already said:
   1. Topic, and what learners should be able to do at the end
   2. Level (`beginner` / `intermediate` / `advanced`) and who the learners are
   3. Prerequisites: suggest existing courses that fit
   4. Length: number of lessons or total time
   5. Position in the learning path (after which course in `index.yaml`)
   6. Theme: suggest the theme from `themes.yaml` that fits best. Propose a new theme (id,
      title, one-sentence description) only if none fits
   7. Course author(s), credited on the dashboard: default to `lessonfolk` for courses written
      by the maintainer. For an external contributor, reuse their slug if they are in
      `authors.yaml`; otherwise add them there when you write the course (slug, name,
      optional one- or two-sentence bio, and
      `github` / `url` only if they give them: never invent links, ask or leave them out; an
      `avatar` only if they give you an image to publish, saved as `courses/authors/<slug>.<ext>`)

   Write in `en` unless the author asks otherwise; translations are a separate task.
3. **Outline.** Propose: course id (kebab-case, not already used), title, level, a one- or
   two-sentence description, theme, authors, `estimatedHours`, prerequisites, and 3–8 lessons, each with its
   file name (`NN-slug`), title, a one-line objective and `estimatedMinutes` (10–25).
   Point out any overlap with existing courses. **Write no file until the author approves
   the outline**; revise it as often as they want.
4. **Write** `course.yaml`, then the lessons in order, following `docs/course-format.md`:
   - Frontmatter `id` matches the path; lesson `prerequisites` are usually the previous lesson.
   - `## Key ideas`: 3–6 numbered ideas, each a short explanation the tutor can rephrase.
   - `## Teaching notes`: at least one analogy that works, common misconceptions, how to
     adapt for beginners vs experienced learners, and pacing hints.
   - `## Check your understanding`: 2–4 numbered questions, each followed by a
     `Good answer:` line describing what a correct answer contains (not a verbatim answer).
   - `## Exercise` (optional): say whether it needs nothing, a computer or code; it must be free.
   - `## Completion criteria`: tied to the checks, so the tutor can decide objectively.
   - `## Going further` (optional): prefer topics or stable, well-known sources; never
     invent links.
   - Match the level: beginner lessons define every term and avoid math. Prefer everyday
     examples. Avoid fast-aging claims (best model, prices, version numbers). If you are not
     sure a fact is right, leave it out or flag it to the author.
   - When an idea builds on another course, restate it in a sentence and name the course
     ("covered in Using AI Safely and Wisely"), never "as you saw in": learners may have
     skipped that course after the level check.

   After the first lesson, summarise it in a few lines and offer the author a look before
   you write the rest.
5. **Register** the course id in `courses/<lang>/index.yaml` at the agreed position.
6. **Validate.** Run `npm run check:courses` (run `npm install` first if dependencies are
   missing). Fix every error and run it again until it passes. Fix warnings too, or tell the
   author why one is kept ("theme … has no course yet" is expected for themes still waiting
   for their first course).
7. **Hand back**: list the files created, any facts the author should double-check, and a
   commit message in the format below (`feat: :sparkles: Add <title> course`). Suggest
   previewing it with `npm run dashboard`. Do not commit unless the author asks.

### Edit a course
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

#### Add a lesson
1. Ask, one question at a time: what the lesson teaches and what learners should be able to
   do after it, then where it goes (default: at the end).
2. Propose a mini-outline (file name, title, objective, `estimatedMinutes`, the key ideas as
   one line each) and, if lessons move, the table of renames (old id → new id) and the
   prerequisite changes. Point out any overlap with the other lessons of the course, and
   propose trimming the overlapping part. **Write nothing before the author approves.**
3. Apply the renames, then write the lesson with the writing rules of
   [Create a course](#create-a-course) step 4. Its prerequisites are usually the previous
   lesson; the lesson after it should now depend on the new one.
4. Update `estimatedHours` in `course.yaml` if the total time changed noticeably.

#### Revise a lesson
1. If the request is vague ("improve lesson 2"), offer a short review first: unclear key
   ideas, missing analogies or misconceptions in the teaching notes, vague `Good answer:`
   lines, completion criteria that do not match the checks, fast-aging claims.
2. Propose the changes as a summary per section, quoting the sentences you would replace.
   **Apply them only after the author approves.**
3. Keep the lesson id. Changing the title or content does not affect progress.

#### Reorder lessons
1. Propose the new order, the table of renames and any prerequisite that would now come
   after the lesson that needs it. **Wait for approval.**
2. Apply the renames and reorder `course.yaml`.

#### For every case
- Run `npm run check:courses` after the change and fix every error, then run it again.
- Hand back: what changed (files renamed, created or edited), the progress warning if ids
  changed, and a commit message in the format below: `feat: :sparkles: Add <lesson title>
  lesson to <course title>` for a new lesson, `docs: :memo: Revise <lesson title>` for a
  revision, `refactor: :recycle: Reorder <course title> lessons` for a reorder. Do not
  commit unless the author asks.

### Commit messages
Format: `<type>: <gitmoji> <imperative summary>` — a [Conventional Commits](https://www.conventionalcommits.org)
type, then a [gitmoji](https://gitmoji.dev) shortcode, then the summary.

Example: `feat: :sparkles: Add prompting basics course`

| Type | Gitmoji | Use for |
|---|---|---|
| `feat` | `:sparkles:` | New feature or new course |
| `fix` | `:bug:` | Bug fix |
| `docs` | `:memo:` | Documentation, course text edits |
| `refactor` | `:recycle:` | Refactor without behaviour change |
| `style` | `:art:` | Structure or formatting |
| `chore` | `:wrench:` | Configuration files, maintenance |
| `chore` | `:fire:` | Remove code or files |
| `ci` | `:construction_worker:` | CI / build system |
| `test` | `:white_check_mark:` | Add or update tests |
| `perf` | `:zap:` | Performance |
