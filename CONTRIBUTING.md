# Contributing to LessonFolk

Thank you for helping. This guide takes you from a fresh clone to passing tests, then explains
how the project is organised and how changes get in. To learn with LessonFolk instead, see
[Using LessonFolk](docs/using-lessonfolk.md).

You can contribute in two ways, and they need different setups:

- **Courses** (lessons in Markdown and YAML): you need Node.js 22 or later, to run
  `npm run check:courses`. See [Contributing a course](#contributing-a-course).
- **Code** (the dashboard, the packages, the tests, the tutor rules): you also need Docker, for
  the database tests. Start with [Development setup](#development-setup).

## Contents

- [Repository map](#repository-map)
- [Development setup](#development-setup)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [Database changes](#database-changes)
- [Tests](#tests)
- [Contributing a course](#contributing-a-course)
- [Workflow](#workflow)
- [Brand and design](#brand-and-design)
- [Search engines and AI search](#search-engines-and-ai-search)

## Repository map

| Path | What it holds |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Instructions for AI agents opened in this folder: the course authoring procedures, and for learners a pointer to the MCP server. [`CLAUDE.md`](CLAUDE.md) points Claude Code to it. |
| [`courses/`](courses) | The courses: `courses/<lang>/index.yaml` (the recommended order), `themes.yaml`, one folder per course, and `courses/authors.yaml`. Format: [`docs/course-format.md`](docs/course-format.md). |
| [`dashboard/`](dashboard) | The web dashboard (an [Astro](https://astro.build) server), its sign-in code, its end-to-end tests, and the scripts `scripts/serve.ts` (starts the built server after checking its settings) and `scripts/check-courses.ts`. |
| [`packages/core/`](packages/core) | `@lessonfolk/core`: loading and validating courses, the progress format (progress.json v1), the tutor's rules (next lesson, path, level check) as code, and the `ProgressStore` interface every progress backend follows. |
| [`packages/db/`](packages/db) | `@lessonfolk/db`: the Postgres schema ([Drizzle](https://orm.drizzle.team)), the migrations in `drizzle/`, the Postgres progress store (`createPostgresProgressStore`) and the database test helpers. |
| [`packages/mcp/`](packages/mcp) | `@lessonfolk/mcp`: the MCP server (course and progress tools, course resources, tutor prompts) the dashboard serves at `/mcp`, and its OAuth setup for `LESSONFOLK_AUTH=oauth`. The tutor's instructions and the `learn`, `review` and `progress` prompts are `packages/mcp/prompts/*.md`: the only copy of the tutoring procedures (the skills point to them). |
| [`.claude/skills/`](.claude/skills) | Claude Code skills (`learn`, `progress` and `review`, which run the MCP prompts; `create-course`, `edit-course`) and two mods: `course-companion` (for learners) and `course-builder` (for course authors). |
| [`docs/`](docs) | Documentation: see the [index](docs/README.md). |
| [`assets/brand/`](assets/brand) | Logo files. |
| [`.mcp.json`](.mcp.json) | Connects Claude Code opened in this folder to the MCP server of a local LessonFolk (`http://localhost:4321/mcp`). |
| `.progress/` | Where older versions of the tutor saved progress (`progress.json`). Git ignores it; only the import reads it. The format is [`docs/progress.example.json`](docs/progress.example.json). |
| `docker-compose.yml`, `Dockerfile` | Postgres and the app in containers. |
| `.github/` | The issue template and the CI workflow. |

The repository is an npm **workspace**: one `npm install` at the root installs the dashboard
and every package under `packages/`, and links them together (the dashboard imports
`@lessonfolk/core`, `@lessonfolk/db` and `@lessonfolk/mcp` straight from their source).

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
other settings, copy `.env.example` to `.env` and change it (see
[Environment variables](#environment-variables)).

When you are done, `docker compose stop db` stops Postgres and keeps its data;
`docker compose down -v` removes it with its data.

To look into the database, start [CloudBeaver](https://dbeaver.com/docs/cloudbeaver/) (a web database
browser, development only) with `docker compose --profile tools up -d cloudbeaver`, open
http://127.0.0.1:8978 and sign in as `cbadmin` / `lessonfolk-dev`. The **LessonFolk (local)**
connection is already set up (it assumes the default `POSTGRES_PASSWORD`; see
`docker/cloudbeaver/data-sources.json`).

To run the dashboard while you work, `npm run dashboard` (http://127.0.0.1:4321), with Postgres
running. It reloads as you edit. To see a progress fixture, import it:
`npm run progress:import -- dashboard/tests/fixtures/progress/all-done/progress.json`. The [learner guide](docs/using-lessonfolk.md#the-dashboard) describes its pages.

## Environment variables

Every setting is an environment variable. `npm run dashboard`, `npm run dashboard:start`,
`npm run migrate -w @lessonfolk/db`, `npm test` and `docker compose` read them from a `.env`
file at the repository root if there is one (copy [`.env.example`](.env.example); `.env` is
never committed). Variables already set in your shell win over `.env`.

**Database and Docker Compose**

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | `postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk` | The Postgres server for the tests, the migrations, sign-in and the dashboard's progress (in every mode; `LESSONFOLK_AUTH=none` applies pending migrations and creates the local learner on start). In Docker Compose, the app gets its own value pointing to the `db` service. |
| `POSTGRES_PASSWORD` | `lessonfolk` | Docker Compose: the password of the `db` service. Change `DATABASE_URL` to match. |
| `LESSONFOLK_PORT` | `4321` | Docker Compose: the port of the app on your computer. |
| `LESSONFOLK_DB_PORT` | `5432` | Docker Compose: the port of Postgres on your computer. Change `DATABASE_URL` to match. |
| `LESSONFOLK_CLOUDBEAVER_PORT` | `8978` | Docker Compose, `tools` profile: the port of CloudBeaver on your computer. |
| `LESSONFOLK_IMAGE_TAG` | `latest` | Docker Compose: the tag of the published `ghcr.io/cgseb/lessonfolk` image the app runs (a release tag such as `v0.1.0`). Not used with `--build`. |
| `LESSONFOLK_BIND` | `127.0.0.1` | Docker Compose: the address the app port is published on. With `LESSONFOLK_AUTH=none`, the app refuses to start unless it is `127.0.0.1`. |
| `LESSONFOLK_MIGRATE_ATTEMPTS` | `30` | How many times `migrate` retries, one second apart, while Postgres starts up. |

**Sign-in** (details in [`docs/auth-dev.md`](docs/auth-dev.md))

| Variable | Default | What it does |
|---|---|---|
| `LESSONFOLK_AUTH` | `none` | `none`: no sign-in, one local learner, only reachable from `127.0.0.1`. `oauth`: sign in with GitHub and/or Google. |
| `LESSONFOLK_BASE_URL` | (none) | `oauth` only, required: the address people open in their browser, e.g. `http://localhost:4321`. Anything but localhost must use `https://`. |
| `BETTER_AUTH_SECRET` | (none) | `oauth` only, required: a random secret of 32 characters or more that signs the session cookies. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | (none) | `oauth`: your GitHub OAuth app. Set both or neither. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | (none) | `oauth`: your Google OAuth client. Set both or neither. |
| `LESSONFOLK_PRIVACY_CONTACT` | (none) | `oauth`: who learners write to about their data (an email address or a page), shown on the `/privacy` page. |
| `LESSONFOLK_DATA_LOCATION` | (none) | `oauth`: the country or region where the server and its backups are, shown on the `/privacy` page (e.g. `Canada`). |
| `LESSONFOLK_MCP_TOKEN` | (none) | `none` only: when set, the MCP server at `/mcp` requires `Authorization: Bearer <token>`. Without it, `/mcp` only answers this computer. (`oauth` uses OAuth access tokens instead.) |

**Dashboard server and folders**

| Variable | Default | What it does |
|---|---|---|
| `HOST` | `127.0.0.1` | The address `npm run dashboard:start` listens on. With `LESSONFOLK_AUTH=none`, anything else is refused. The Docker image sets `0.0.0.0` and relies on `LESSONFOLK_BIND`. |
| `PORT` | `4321` | The port `npm run dashboard:start` listens on. (For `npm run dashboard`, see the [learner guide](docs/using-lessonfolk.md#troubleshooting).) |
| `LESSONFOLK_ROOT` | the nearest folder above the working directory that holds `AGENTS.md` | The repository root, where `courses/` (and an old `.progress/progress.json` to import) are found. The Docker image sets `/app`. |
| `LESSONFOLK_COURSES_DIR` | `<root>/courses` | Read the courses from another folder, e.g. a test fixture. |

**Set by the tooling** (you don't set these yourself)

| Variable | Set by | What it does |
|---|---|---|
| `NODE_ENV` | The end-to-end tests (`test`), the Docker image (`production`) | The fake OAuth provider of the tests only works with `test`. |
| `LESSONFOLK_TEST_OAUTH_URL` | The end-to-end tests | Turns on the fake OAuth provider. The server refuses to start if it is set outside the tests. |
| `INIT_CWD` | npm | Lets `npm run check:courses -- <folder>` resolve `<folder>` from where you ran the command. |

## npm scripts

Run root scripts from the repository root. Run a workspace script with `-w <workspace>`
(`-w dashboard`, `-w packages/core` or `-w @lessonfolk/db`).

| Command | What it does |
|---|---|
| `npm run dashboard` | Start the dashboard in development mode on http://127.0.0.1:4321, reloading as you edit (`astro dev`). |
| `npm run dashboard:build` | Build the production server into `dashboard/dist/`. |
| `npm run dashboard:start` | Run the built server, after the sign-in startup checks (`dashboard/scripts/serve.ts`). Build first. |
| `npm test` | Run the tests of every workspace (core, db, mcp, dashboard). Needs Postgres. |
| `npm run check:courses` | Validate every course and lesson file. Add `-- <folder>` to check another courses folder. |
| `npm run progress:import` | Copy a `progress.json` (default: the old `.progress/progress.json`, or `-- <file>`) into `DATABASE_URL` as the local learner's progress, replacing it. |
| `npm run check -w dashboard` | Type-check the dashboard (`astro check`). |
| `npm run check -w packages/core` | Type-check `@lessonfolk/core`. |
| `npm run check -w @lessonfolk/db` | Type-check `@lessonfolk/db`. |
| `npm run check -w @lessonfolk/mcp` | Type-check `@lessonfolk/mcp`. |
| `npm test -w <workspace>` | Run one workspace's tests. |
| `npm run test:unit -w dashboard`, `npm run test:unit -w @lessonfolk/db`, `npm run test:unit -w @lessonfolk/mcp` | Run the tests that need no database (everything but `*.db.test.ts`). |
| `npm run generate -w @lessonfolk/db` | Write a new migration from changes to the schema. See [Database changes](#database-changes). |
| `npm run migrate -w @lessonfolk/db` | Apply pending migrations to `DATABASE_URL`. |

The dashboard workspace also has `dev`, `build` and `start`: the root `dashboard`,
`dashboard:build` and `dashboard:start` scripts run them.

## Database changes

The schema lives in [`packages/db/src/schema.ts`](packages/db/src/schema.ts) (Drizzle). It
holds the sign-in tables of [Better Auth](https://www.better-auth.com) (`user`, `session`,
`account`, `verification`) and those of the MCP authorization server (`jwks`, `oauth_*`), then `learner` (one per user), `lesson_progress` and the
append-only `progress_event` log.

To change it:

1. Edit `schema.ts`.
2. Generate a migration: `npm run generate -w @lessonfolk/db`. It writes a new
   `packages/db/drizzle/NNNN_*.sql` file and updates `drizzle/meta/`.
3. Read the generated SQL, then apply it to your database:
   `npm run migrate -w @lessonfolk/db`.
4. Run `npm test`: every database test file starts from a fresh database with all migrations.
5. Commit the schema change and the generated files together.

A table that holds personal data must reference `user` with `on delete cascade`, be added to the
full export (`dashboard/src/lib/personal-data.ts`) and to the data map in
[`docs/privacy.md`](docs/privacy.md). The account deletion test fails if a row is left behind.

**Never edit or delete a migration that is already on `main`.** It may already have run on
someone's database, and migrations run in order. To fix one, generate a new migration.

Migrations run by themselves when the app starts in Docker (`docker compose up --build`),
before the server listens.

## Tests

`npm test` runs every workspace's tests with [Vitest](https://vitest.dev): unit tests next to
the code, end-to-end tests that start the real dashboard server, and database tests against a
real Postgres (never a mock). CI runs the same tests.

[`docs/testing.md`](docs/testing.md) explains how they work (fixtures, database tests, the
fake OAuth provider), how to run the tests without Docker, and the manual checks with a real
tutor in Claude Code and Codex.

The rule: run `npm test` (and `npm run check:courses` if you touched `courses/`) before you
commit, and fix every failure. Never skip, delete or loosen a test to make it pass. Fix the
code, or fix the test only if the test itself is wrong, and say why in the pull request.

The Course companion mod has its own tests in `.claude/skills/course-companion/tests/`; they
are not part of `npm test`: run them with `claude plugin test .claude/skills/course-companion`
(and `claude plugin validate` on the same folder). The mod reads the progress through the
LessonFolk MCP server with `$.mcp.call` (`get_progress`, `list_courses`, `get_lesson`), so it
needs no file or token of its own and works with a local or a hosted instance; the tests stand in
for the server with `tests/server.ts`. When you add or rename an MCP read tool it uses, update
that stand-in too.

### Live refresh

Open dashboard pages refresh by themselves when the tutor saves progress. The Postgres store
takes an `onChange(userId)` option, called after each committed write; the dashboard passes a
publisher of the in-process hub in
[`dashboard/src/lib/watch.ts`](dashboard/src/lib/watch.ts), and `/api/events` (Server-Sent
Events, signed-in users only) streams `progress` events of the signed-in user alone to
[`LiveRefresh.astro`](dashboard/src/components/LiveRefresh.astro), which swaps the page's
`<main>`. MCP runs in the same server, so its writes arrive without extra setup. With several
instances, publish through Postgres `LISTEN/NOTIFY` instead (same hub interface).

## Adding a tutor action

A learner action such as resetting a course touches four places: a pure rule in
[`packages/core/src/tutor.ts`](packages/core/src/tutor.ts) (with unit tests), the `ProgressStore`
method (`store.ts`, implemented in `packages/db/src/progress-store.ts`, which logs a
`progress_event`), the MCP tool in `packages/mcp/src/server.ts`, and the procedure in
`packages/mcp/prompts/learn.md` (plus its phrase in `instructions.md` and the `learn` skill).
`reset_course` is a small example. Add the manual check to `docs/testing.md`.

## Contributing a course

A lesson is a Markdown file with key ideas, teaching notes for the tutor, questions to check
understanding and completion criteria. The full specification is
[`docs/course-format.md`](docs/course-format.md). You don't need to learn it first: your agent
can write the course with you.

**Create a course.** Open your agent in the LessonFolk folder and say, for example:

> Create a course about prompting for beginners.

The agent asks a few questions, one at a time (topic, level, prerequisites, length, place in
the learning path, theme, authors), then proposes an outline. **Nothing is written until you
approve it.** It then writes `course.yaml` and the lessons, adds the course to
`courses/<lang>/index.yaml`, runs `npm run check:courses` and hands back a commit message.

**Change a course.** Say *"add a lesson about bias to AI Foundations"*, *"improve lesson 2 of
AI Foundations"* or *"reorder the lessons of …"*. The agent proposes the changes first, keeps
file names, lesson ids and prerequisites in sync, and warns you before renaming a lesson that
learners may already have finished (their progress refers to lessons by id).

In Claude Code these flows are the `/create-course` and `/edit-course` skills. Codex follows the
same "Create a course" and "Edit a course" procedures from [`AGENTS.md`](AGENTS.md). While
`/create-course` runs, Claude Code shows the **Course builder** pane beside the chat: the course
title, the steps done so far and the lessons written. `/course-builder` reopens it. It is a mod
in `.claude/skills/course-builder/`.

**Check your work** before opening a pull request, whether you wrote by hand or with the agent:

```bash
npm install            # once
npm run check:courses
```

It fails on structural errors and warns about drift from the writing guidelines; the list is in
[Validation](docs/course-format.md#validation). To see your course as a learner would, run
`npm run dashboard`.

Course text is published under [CC BY 4.0](courses/LICENSE). Course authors are credited from
`courses/authors.yaml`.

## Workflow

1. **Issue first.** Open an issue with the **Task** template
   ([`.github/ISSUE_TEMPLATE/task.yml`](.github/ISSUE_TEMPLATE/task.yml)): summary, why,
   scope, acceptance criteria. One issue is one deliverable that fits in one pull request.
2. **Branch** from `main`, named `<type>/<issue number>-<short-slug>`, for example
   `feat/45-prompting-basics` or `docs/100-learner-contributor-docs`. Never commit straight to
   `main`.
3. **One commit per change**, with a message in this format:

   ```
   <type>: <gitmoji> <imperative summary>
   ```

   For example `feat: :sparkles: Add prompting basics course`. The types and their gitmoji
   are listed in [`AGENTS.md`](AGENTS.md#commit-messages).
4. **Test** as described in [Tests](#tests).
5. **Pull request** to `main`. Say what changed and why, how you tested it, and close the issue
   with `Closes #<number>`. If the change affects tutoring, say whether you tried it in Claude
   Code, Codex or both.
6. **CI** ([`.github/workflows/test.yml`](.github/workflows/test.yml)) runs `npm ci`,
   `npm test` (with Postgres as a service) and `npm run check:courses` on every pull request.
   It must pass before merging.
7. **Release.** Publishing a GitHub release runs [`release.yml`](.github/workflows/release.yml): the same
   tests on the release's tag, then it publishes the Docker image to GHCR and deploys it to the hosted server (the files in
   [`deploy/`](deploy)).

Never commit `.progress/` or `.env`.

## Brand and design

The logo, colours, type, spacing and voice are in [`docs/brand.md`](docs/brand.md). The
dashboard uses the design tokens in
[`dashboard/src/styles/tokens.css`](dashboard/src/styles/tokens.css): use the tokens, never raw
values. Write interface text and docs in plain, warm language: short sentences, every technical
term defined the first time.

## Search engines and AI search

Public pages must stay easy for search engines and AI assistants to read: unique title and
description per page, one `<h1>`, `alt` text on images, and a place in the sitemap (or in the
private paths). [`docs/seo.md`](docs/seo.md) lists what the dashboard sends and how to check it.

## License

Code is under the [MIT license](LICENSE). Course content (`courses/`) is under
[CC BY 4.0](courses/LICENSE).
