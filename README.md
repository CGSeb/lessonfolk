# Apprentice

**Learn AI from zero to advanced, with an AI as your tutor.**

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

## Courses

| Course | Level |
|---|---|
| AI Foundations | Beginner |

## Contributing a course

Read [`docs/course-format.md`](docs/course-format.md). A lesson is a Markdown file with key
ideas, teaching notes for the tutor, comprehension checks and completion criteria.
