# Create a project
Contributing mode, like a course: write only the new project's files (`projects/en/<project>.md`
and its French translation `projects/fr/<project>.md`) and `projects/en/index.yaml`, plus
`courses/authors.yaml` (and an avatar in `courses/authors/` if they give one) to add a new
author. Never edit courses or other projects.

1. **Prepare.** Read `docs/project-format.md`, `projects/en/index.yaml` and the projects it
   lists, `courses/en/index.yaml`, `courses/en/themes.yaml` and `courses/authors.yaml`. Read
   the `course.yaml` of every course the project could build on, and one existing project in
   full: it is the quality bar.
2. **Interview**, one question at a time, skipping anything the author already said:
   1. The result the learner reaches, and what they choose themselves (their topic, their data)
   2. Level and who the learners are
   3. The courses it builds on (`buildsOn`): suggest the ones that fit, or none for a project
      that stands alone
   4. What the learner needs (`needs`): prefer free tools, and never require paying
   5. Length: estimated hours (1–10) and number of milestones (3–6)
   6. Theme: the one from `courses/en/themes.yaml` that fits best
   7. Author(s): default `lessonfolk` for the maintainer's projects; for an external
      contributor, reuse or add their slug in `courses/authors.yaml` as for a course
   8. Position in `projects/en/index.yaml` (default: at the end)
3. **Outline.** Propose: project id (kebab-case, not used by another project), title, level,
   theme, authors, a one- or two-sentence description, `estimatedHours`, `buildsOn`, `needs`,
   a two-line brief, the milestones (a bold title and what to reach, each with its
   `Done when:` line) and the review criteria. Point out any overlap with existing projects.
   **Write no file until the author approves the outline**; revise it as often as they want.
4. **Write** `projects/en/<project>.md` following `docs/project-format.md`:
   - Frontmatter `id` matches the file name; every `buildsOn` course exists.
   - `## Brief`: for the learner. The subject, the result to reach, what they choose, what
     they need, and the rules that apply (such as never pasting personal or confidential data
     into an AI app).
   - `## Milestones`: numbered, in order. Each says what to reach, not how, starts with a
     **bold** title, and has a `Done when:` line describing what the learner shows or explains,
     so the tutor can decide from the conversation (it only sees what the learner pastes).
   - `## Coaching notes`: for the tutor only. How to help without doing the work (a ladder of
     hints: a question, then a pointer to the idea, then an example on a different case), the
     usual misses at each milestone, how to adapt for beginners vs experienced learners, pacing
     over several sessions.
   - `## Review`: 3–6 numbered criteria the tutor reviews the result against, tied to the
     milestones.
   - `## Going further` (optional): ideas for learners who want more; never invent links.
   - The dashboard renders inline `**bold**` and `` `code` `` only: keep each paragraph,
     milestone and criterion plain text otherwise.
   - When the project relies on a course, name it in a sentence ("covered in Prompting Basics")
     and never assume the learner did it. Avoid fast-aging claims (best model, prices,
     versions).
5. **Register** the project id in `projects/en/index.yaml` at the agreed position.
6. **Fact-check** the claims of the brief and the coaching notes (what a tool or technique
   does, rules of thumb), like a course: verify each against a primary or well-known source,
   open each course you name to confirm it covers what you say, fix or drop what is wrong,
   and keep the sources for step 9.
7. **Translate to French** without asking again: `projects/fr/<project>.md`, a copy of the
   English file with `title`, `description`, `needs` and the text translated. Keep the `##`
   headings and the `Done when:` labels in English, and the same milestones and review criteria
   in the same order. Write natural French with « vous », reusing the vocabulary of the French
   courses. Skip this step only if the author says so.
8. **Validate.** Run `npm run check:courses` (it checks the projects too). Fix every error and
   run it again until it passes; fix the warnings or tell the author why one is kept.
9. **Hand back**: the files created, the fact-check result, and a commit message in the
   format below (`feat: :sparkles: Add <title> project`). Suggest previewing it with
   `npm run dashboard` (`/projects/<project>`). Do not commit unless the author asks.

