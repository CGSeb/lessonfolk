# Edit a project
Write only inside the project being edited (both languages) and `projects/en/index.yaml`.
Read `docs/project-format.md` and the project in full first, then propose the changes as a
summary per section, quoting the sentences you would replace. **Apply them only after the
author approves.**

- **Saved progress refers to the project id and to milestone and review criterion numbers.**
  Renaming the file orphans every learner's progress on it, and adding, removing or reordering
  milestones or criteria changes what the saved numbers mean. Before such a change, check
  whether the project is published (`git log origin/main -- projects/en/<project>.md`). If it
  is, tell the author and offer the choice: append at the end (saved numbers keep their
  meaning), or change it anyway. Rewording a milestone, the brief or the coaching notes is
  always safe.
- Apply the same change to the French file, keeping the same milestones and criteria in the
  same order.
- Run `npm run check:courses` and fix every error, then hand back what changed (and the
  progress warning if numbers or the id changed) with a commit message: `docs: :memo: Revise
  <title> project`. Do not commit unless the author asks.

