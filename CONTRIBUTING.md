# Contributing to LessonFolk

Thank you for helping. To learn with LessonFolk instead, see
[Using LessonFolk](docs/using-lessonfolk.md).

You can contribute in two ways:

- **Courses** (lessons in Markdown and YAML): you need [Node.js](https://nodejs.org) 22 or
  later. Go to [Contributing a course](#contributing-a-course).
- **Code** (the dashboard, the packages, the tests, the tutor's instructions): you also need
  [Docker](https://docs.docker.com/get-docker/), for the database tests. Go to
  [Development setup](#development-setup).

Either way, changes get in through the same [workflow](#workflow). Looking for something to do?
See the issues labelled
[good first issue](https://github.com/CGSeb/lessonfolk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
and [help wanted](https://github.com/CGSeb/lessonfolk/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22),
or ask in [Discussions](https://github.com/CGSeb/lessonfolk/discussions). Everyone here follows
the [code of conduct](CODE_OF_CONDUCT.md).

## Contributing a course

A lesson is a Markdown file with key ideas, teaching notes for the tutor, questions to check
understanding and completion criteria. You don't need to learn the format first: your AI agent
writes the course with you. Open it in the LessonFolk folder and say what you want:

| You say | What the agent does |
|---|---|
| *"Create a course about prompting for beginners."* | Asks a few questions, one at a time, then proposes an outline. After you approve it, writes the course and adds it to the catalog. |
| *"Add a lesson about bias to AI Foundations."*, *"Improve lesson 2 of …"*, *"Reorder the lessons of …"* | Proposes the changes first, then keeps file names, lesson ids and prerequisites in sync. |
| *"Review the course AI Foundations."* | Reads each lesson and reports the ones to reread. It changes no file. |

**Nothing is written until you approve the outline or the changes.** In Claude Code these are
the `/create-course`, `/edit-course` and `/review-course` skills; other agents follow the same
procedures from [`AGENTS.md`](AGENTS.md). While `/create-course` runs, Claude Code shows the
**Course builder** pane beside the chat (the steps done so far and the lessons written);
`/course-builder` reopens it.

Before you open a pull request, whether you wrote by hand or with the agent:

```bash
npm install            # once
npm run check:courses  # validates every course and lesson
npm run dashboard      # optional: see your course as a learner would (needs Postgres, see below)
```

The format, what `check:courses` checks and the review criteria are in
[Course format](docs/course-format.md). Course text is published under
[CC BY 4.0](courses/LICENSE), and authors are credited from `courses/authors.yaml`.

## Development setup

You need [Git](https://git-scm.com), [Node.js](https://nodejs.org) 22 or later, and
[Docker](https://docs.docker.com/get-docker/) for the database tests.

```bash
git clone https://github.com/CGSeb/lessonfolk.git
cd lessonfolk
npm install                # every workspace
docker compose up -d db    # Postgres on 127.0.0.1:5432, in the background
npm test                   # every workspace's tests
npm run check:courses      # validate the courses
```

That is all: with the defaults, you need no `.env` file. If port 5432 is taken, or you want
other settings, copy `.env.example` to `.env` and change it (see [Settings](docs/configuration.md)).

To run the dashboard while you work, `npm run dashboard` (http://127.0.0.1:4321), with Postgres
running. It reloads as you edit.

When you are done, `docker compose stop db` stops Postgres and keeps its data;
`docker compose down -v` removes it with its data.

## Changing the code

[Developing LessonFolk](docs/development.md) has the repository map, every npm script and how
the main parts work. The rules to keep in mind:

- **Tests.** Run `npm test` (and `npm run check:courses` if you touched `courses/`) before you
  commit, and fix every failure. Never skip, delete or loosen a test to make it pass. Fix the
  code, or fix the test only if the test itself is wrong, and say why in the pull request.
  See [Testing](docs/testing.md).
- **Database.** Change the schema with a new migration, never by editing one that is already
  on `main`. See [Database changes](docs/development.md#database-changes).
- **Personal data.** A new table that holds it must be covered by the export and by account
  deletion. See [Privacy and personal data](docs/privacy.md).
- **Interface.** Use the design tokens of
  [`dashboard/src/styles/tokens.css`](dashboard/src/styles/tokens.css), never raw values. Write
  interface text and docs in plain, warm language: short sentences, every technical term
  defined the first time. See [Brand](docs/brand.md).
- **Scripts and styles.** No inline scripts or event handlers: the Content Security Policy
  blocks them, and only in builds. See
  [Content Security Policy](docs/development.md#content-security-policy).
- **Public pages.** A unique title and description, one `<h1>`, `alt` text on images, and a
  place in the sitemap (or in the private paths). See
  [Search engines and AI search](docs/seo.md).
- **Docs.** Add a new setting to [Settings](docs/configuration.md) and a new script to
  [npm scripts](docs/development.md#npm-scripts). Keep each topic in one place and link to it.

## Workflow

**A small fix** (a typo, a wrong fact in a lesson, a broken link) needs no issue: open a pull
request straight away. If the branch name or the commit message is not quite in the format
below, that is fine on a first pull request: it can be adjusted when merging.

For anything larger:

1. **Issue first**, so nobody builds something that will not be merged.
   [Choose a template](https://github.com/CGSeb/lessonfolk/issues/new/choose): a course idea, a
   bug, a problem in a lesson, or **Task** for other work (summary, why, scope, acceptance
   criteria). One issue is one deliverable that fits in one pull request.
2. **Branch** from `main`, named `<type>/<issue number>-<short-slug>`, for example
   `feat/45-prompting-basics`. Never commit straight to `main`.
3. **One commit per change**, with a message in the format
   `<type>: <gitmoji> <imperative summary>`, for example
   `feat: :sparkles: Add prompting basics course`. The types and their gitmoji are listed in
   [`AGENTS.md`](AGENTS.md#commit-messages).
4. **Pull request** to `main`. Say what changed and why, how you tested it, and close the issue
   with `Closes #<number>`. If the change affects tutoring, say whether you tried it in Claude
   Code, Codex or both.
5. **CI** ([`.github/workflows/test.yml`](.github/workflows/test.yml)) runs `npm test` and
   `npm run check:courses` on every pull request. It must pass before merging.

Never commit `.progress/` or `.env`. Found a security problem? Report it privately: see
[Security](SECURITY.md).

**Releases.** Publishing a GitHub release runs [`release.yml`](.github/workflows/release.yml):
the same tests on the release's tag, then it publishes the Docker image to GHCR and deploys it
to the hosted server (the files in [`deploy/`](deploy)).

## License

Code is under the [MIT license](LICENSE). Course content (`courses/`) is under
[CC BY 4.0](courses/LICENSE).
