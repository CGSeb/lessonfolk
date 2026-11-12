# Create a course
This is contributing mode: the tutoring rule "never modify `courses/`" does not apply, but
only write the new course's folders (`courses/en/<course>/` and its French translation
`courses/fr/<course>/`) and `courses/en/index.yaml` (plus
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

   Write the course in `en` first: it is the source of truth. Other languages are translations
   of the English files ([Translations](../course-format.md#translations)); step 7 produces
   the French one.
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
   - No `## Exercise` section: lessons are taught and checked in the conversation. Put a
     question that applies the ideas to a case in the checks instead.
   - Lesson titles, objectives and checks are phrased as understanding and judgement ("what
     makes a good X", "spot the flaw in this Y"), never as a task for the learner ("build /
     collect / make your own X"). Activities suggested in Teaching notes are conversation-only
     scenarios with nothing to produce, build, install or run.
   - `## Completion criteria`: tied to the checks, so the tutor can decide objectively; never
     require the learner to build or install something.
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
6. **Fact-check** the English lessons before they are translated, without asking again:
   - List every checkable claim (rules of thumb, how a technique works, what a study found,
     what a tool or method does) and the cross-references to other lessons ("covered in …").
   - Verify each claim against a primary or well-known source with a web search (official
     documentation, the paper itself), and open each referenced lesson to confirm it says
     what you claim. Never rely on memory alone for a number, a name or a finding.
   - Fix what is wrong, overstated or too precise. Keep fast-aging details out rather than
     correcting them.
   - Keep the sources and the claims you could not verify for step 9.
7. **Translate to French.** Once the English course is fact-checked (outline approved, first
   lesson reviewed), translate it without asking again: create `courses/fr/<course>/` with
   `course.yaml` (translated `title` and `description`) and one file per lesson, following
   [Translations](../course-format.md#translations). Keep ids, `##` headings and
   `Good answer:` labels in English; translate `title`, `objectives` and the text. Write
   natural French (not word for word), address the learner as « vous » like the existing
   French courses, and reuse their vocabulary (read one translated lesson first). Add a
   French theme only if you added an English one. Skip this step only if the author says so.
8. **Validate.** Run `npm run check:courses` (run `npm install` first if dependencies are
   missing). Fix every error and run it again until it passes. Fix warnings too, or tell the
   author why one is kept ("theme … has no course yet" is expected for themes still waiting
   for their first course).
9. **Hand back**: list the files created (English and French), the fact-check result (what
   you verified with its source, what you corrected, what you could not verify), and a
   commit message in the format below (`feat: :sparkles: Add <title> course`). Suggest
   previewing it with `npm run dashboard`. Do not commit unless the author asks.

