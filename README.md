<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-dark.svg">
    <img src="assets/brand/logo.svg" alt="LessonFolk" width="320">
  </picture>
</h1>

<p align="center"><strong>Learn AI from zero to advanced, with an AI as your tutor.</strong></p>

LessonFolk is a collection of open-source AI courses designed to be taught *by* an AI coding
agent — [Claude Code](https://claude.com/claude-code), [Codex](https://openai.com/codex), or any
agent that reads `AGENTS.md`. You open the agent in this folder, say "let's start", and it guides
you through lessons in a conversation: explaining, asking questions, adapting to your level,
and tracking your progress.

## How it works

| What | Where | Versioned? |
|---|---|---|
| Tutor instructions | `AGENTS.md` (Claude Code reads it via `CLAUDE.md`) | yes |
| Courses | `courses/<lang>/<course>/` | yes |
| Your progress | `.progress/progress.json` | **no**, it stays on your computer |

The tutor asks about your level and interests, recommends a path of courses, and teaches one
short lesson at a time. An optional local dashboard shows your courses and progress.

Courses are grouped by theme: *Understanding AI*, *Using AI tools*, *Building with AI* and
*AI and society*. The full list, in the recommended order, is
[`courses/en/index.yaml`](courses/en/index.yaml), or ask your tutor *"what can I learn?"*.

## Quick start

```bash
git clone https://github.com/CGSeb/lessonfolk.git
cd lessonfolk
claude      # or: codex
```

Then say:

> Let's start learning AI.

## Documentation

- [Using LessonFolk](docs/using-lessonfolk.md): the learner guide (first session, what to say,
  the dashboard, Docker, troubleshooting)
- [Contributing](CONTRIBUTING.md): development setup, settings, scripts, writing courses,
  workflow
- [Course format](docs/course-format.md): how courses and lessons are written
- [Testing](docs/testing.md): automated tests and manual checks
- [Sign-in for developers](docs/auth-dev.md): GitHub and Google sign-in
- [Brand](docs/brand.md): logo, colours and type
- [All docs](docs/README.md)

## License

LessonFolk is developed by CG Seb.

- **Code** (dashboard, tooling, tutor instructions): [MIT](LICENSE)
- **Course content** (`courses/`): [CC BY 4.0](courses/LICENSE). You may share and adapt the
  courses, including commercially, as long as you give appropriate credit.
