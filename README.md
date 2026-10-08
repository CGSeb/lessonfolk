<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-dark.svg">
    <img src="assets/brand/logo.svg" alt="LessonFolk" width="320">
  </picture>
</h1>

<p align="center"><strong>Learn AI from zero to advanced, with an AI as your tutor.</strong></p>

LessonFolk is a collection of open-source AI courses designed to be taught *by* an AI. Connect
your AI chat ([Claude Code](https://claude.com/claude-code), [Codex](https://openai.com/codex),
Claude Desktop, Cursor…) to LessonFolk, say "let's start", and it guides you through lessons in a
conversation: explaining, asking questions, adapting to your level, and saving your progress.

## How it works

LessonFolk is a website and an [MCP](https://modelcontextprotocol.io) server (Model Context
Protocol, a standard way for AI apps to use tools). Your AI chat connects to it: it gets the
courses and the tutor's instructions, and saves your progress there. The website shows your
courses, your path and your progress.

The tutor asks about your level and interests, recommends a path of courses, and teaches one
short lesson at a time. Courses are grouped by theme: *Understanding AI*, *Using AI tools*,
*Building with AI* and *AI and society*. The full list, in the recommended order, is
[`courses/en/index.yaml`](courses/en/index.yaml), or ask your tutor *"what can I learn?"*.

## Quick start

Pick one of two ways:

**Hosted** (coming soon): sign in on the hosted LessonFolk with GitHub or Google, open its
**Connect** page and add LessonFolk to your AI chat. Your progress is saved with your account.

**Self-hosted**: private, on your computer, no data sent to us. With
[Docker](https://docs.docker.com/get-docker/) running:

```bash
git clone https://github.com/CGSeb/lessonfolk.git
cd lessonfolk
docker compose up -d --build
```

Open http://127.0.0.1:4321 to see the dashboard. Then start your AI chat **in this folder**:

- **Claude Code:** run `claude` and approve the `lessonfolk` MCP server when asked.
- **Codex:** run `codex mcp add lessonfolk --url http://localhost:4321/mcp` once, then `codex`.
- **Other apps:** follow the dashboard's **Connect** page.

Then say:

> Let's start learning AI.

The [learner guide](docs/using-lessonfolk.md) has the details.

## Documentation

- [Using LessonFolk](docs/using-lessonfolk.md): the learner guide (first session, what to say,
  the dashboard, Docker, troubleshooting)
- [Contributing](CONTRIBUTING.md): development setup, settings, scripts, writing courses,
  workflow
- [Course format](docs/course-format.md): how courses and lessons are written
- [Testing](docs/testing.md): automated tests and manual checks
- [Sign-in for developers](docs/auth-dev.md): GitHub and Google sign-in
- [Privacy and personal data](docs/privacy.md): what is stored, export and deletion
- [Brand](docs/brand.md): logo, colours and type
- [All docs](docs/README.md)

## License

LessonFolk is developed by CG Seb.

- **Code** (dashboard, tooling, tutor instructions): [MIT](LICENSE)
- **Course content** (`courses/`): [CC BY 4.0](courses/LICENSE). You may share and adapt the
  courses, including commercially, as long as you give appropriate credit.
