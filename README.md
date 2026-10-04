<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-dark.svg">
    <img src="assets/brand/logo.svg" alt="Apprentice" width="320">
  </picture>
</h1>

<p align="center"><strong>Learn AI from zero to advanced, with an AI as your tutor.</strong></p>

Apprentice is a collection of open-source AI courses designed to be taught *by* an AI coding
agent — [Claude Code](https://claude.com/claude-code), [Codex](https://openai.com/codex), or any
agent that reads `AGENTS.md`. You open the agent in this folder, say "let's start", and it guides
you through lessons in a conversation: explaining, asking questions, adapting to your level,
and tracking your progress.

Courses are versioned here. Your progress stays on your computer (`.progress/`, never committed).

## Quick start

```bash
git clone https://github.com/<you>/apprentice.git
cd apprentice
claude      # or: codex
```

Then just say:

> Let's start learning AI.

The tutor will ask a few questions about you, then begin the first lesson.

Useful things to say: *"continue"*, *"show my progress"*, *"what can I learn?"*, *"quiz me"*,
*"I already know this, skip"*. In Claude Code you can also use `/learn`, `/progress`, `/review`.

## How it works

| What | Where | Versioned? |
|---|---|---|
| Tutor instructions | `AGENTS.md` (Claude Code reads it via `CLAUDE.md`) | yes |
| Courses | `courses/<lang>/<course>/` | yes |
| Your progress | `.progress/progress.json` | **no**, local only |

## Dashboard (optional)

A local web dashboard shows your courses and progress. Requires [Node.js](https://nodejs.org) 22 or later.

```bash
npm install
npm run dashboard
```

Then open http://127.0.0.1:4321. It only listens on your machine and never modifies your progress —
the AI tutor is the only thing that writes it.

| Script | Purpose |
|---|---|
| `npm run dashboard` | Start the dashboard in development mode |
| `npm run dashboard:build` | Build the production server |
| `npm run dashboard:start` | Run the built server |
| `npm test` | Run the dashboard tests |

Set `APPRENTICE_COURSES_DIR` or `APPRENTICE_PROGRESS_DIR` to point the dashboard at other folders
(useful for testing with sample progress files). See [`docs/testing.md`](docs/testing.md) for the
automated tests and the manual end-to-end checklist with a real tutor.
The logo, colours and type used by the dashboard are described in [`docs/brand.md`](docs/brand.md).

## Courses

| Course | Level |
|---|---|
| AI Foundations | Beginner |

## Contributing a course

A lesson is a Markdown file with key ideas, teaching notes for the tutor, comprehension checks
and completion criteria. You don't need to learn the format first: your agent can write the
course with you. Open the agent in this folder and say:

> Create a course about prompting for beginners.

The agent asks a few questions one at a time (topic, level, prerequisites, length, place in
the learning path), then proposes an outline. **Nothing is written until you approve it.**
It then writes `course.yaml` and the lessons, adds the course to `courses/<lang>/index.yaml`,
and validates everything before handing back with a suggested commit message.

To change an existing course, say *"add a lesson about bias to AI Foundations"*, *"improve
lesson 2 of AI Foundations"* or *"reorder the lessons of …"*. The agent proposes the changes,
keeps file names, lesson ids and prerequisites in sync, and warns you before renaming a lesson
that learners may already have completed.

In Claude Code these are the `/create-course` and `/edit-course` skills; Codex follows the
same procedures from `AGENTS.md`.

Whether you write by hand or with the agent, check your work before opening a pull request:

```bash
npm install
npm run check:courses
```

It fails on structural errors (missing or misspelled sections, broken ids or prerequisites)
and warns about guideline drift. The full specification is in
[`docs/course-format.md`](docs/course-format.md).

## License

Apprentice is developed by CG Seb.

- **Code** (dashboard, tooling, tutor instructions): [MIT](LICENSE)
- **Course content** (`courses/`): [CC BY 4.0](courses/LICENSE). You may share and adapt the
  courses, including commercially, as long as you give appropriate credit.
