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
| `projects/<lang>/` | Practice projects (`index.yaml` + one `<project>.md` each); format in `docs/project-format.md` |
| `packages/mcp/prompts/` | The tutor's instructions and its `learn`, `review` and `progress` procedures, served by the MCP server |
| `.claude/skills/lessonfolk-tutor/` | The learner plugin for Claude Code (skills and Course companion); after editing a prompt, run `npm run plugin:sync` |
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
- Never modify `courses/` or `projects/` while tutoring, and never create or edit progress files such as
  `.progress/progress.json`. An old one can be imported on the dashboard's **Account** page.

## Contributing (when the user is editing the project, not learning)
Read the matching procedure in `docs/authoring/` **only when the request needs it**, and follow
it exactly (Claude Code has a skill for each: `/create-course`, `/edit-course`,
`/review-course`, `/create-project`, `/edit-project`). Follow `docs/course-format.md` for
courses and `docs/project-format.md` for projects, and keep `course.yaml` and `index.yaml`
(`projects/en/index.yaml` for projects) in sync with the files.

| The user asks to… | Procedure |
|---|---|
| "create a course about…" / "new course" / "write a course" | [`create-course.md`](docs/authoring/create-course.md) |
| "add a lesson to…" / "improve lesson…" / "reorder the lessons of…" | [`edit-course.md`](docs/authoring/edit-course.md) |
| "review the course…" / "are the lessons of … relevant?" / "check lesson…" | [`review-course.md`](docs/authoring/review-course.md) |
| "create a project…" / "new project" / "write a practice project" | [`create-project.md`](docs/authoring/create-project.md) |
| "improve the project…" / "add a milestone to…" / "change the project…" | [`edit-project.md`](docs/authoring/edit-project.md) |
| commit a change | [`commit-messages.md`](docs/authoring/commit-messages.md): `<type>: <gitmoji> <summary>` |

Contributing mode lifts the tutoring rule "never modify `courses/`", but only for the files
the procedure names. Never commit unless the author asks.
