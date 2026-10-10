# Developing LessonFolk

The reference for people who change the code: where things are, the commands, and how a few
parts work. To get a working checkout first, follow
[Development setup](../CONTRIBUTING.md#development-setup).

- [Repository map](#repository-map)
- [npm scripts](#npm-scripts)
- [Database changes](#database-changes)
- [Adding a tutor action](#adding-a-tutor-action)
- [Live refresh](#live-refresh)
- [Content Security Policy](#content-security-policy)
- [Docker images](#docker-images)

## Repository map

| Path | What it holds |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | Instructions for AI agents opened in this folder: the course authoring procedures, and for learners a pointer to the MCP server. [`CLAUDE.md`](../CLAUDE.md) points Claude Code to it. |
| [`courses/`](../courses) | The courses: `courses/<lang>/index.yaml` (the recommended order), `themes.yaml`, one folder per course, and `courses/authors.yaml`. Format: [Course format](course-format.md). |
| [`dashboard/`](../dashboard) | The web dashboard (an [Astro](https://astro.build) server), its sign-in code, its end-to-end tests, and the scripts `scripts/serve.ts` (starts the built server after checking its settings) and `scripts/check-courses.ts`. |
| [`packages/core/`](../packages/core) | `@lessonfolk/core`: loading and validating courses, the progress format (progress.json v1), the tutor's rules (next lesson, path, level check) as code, and the `ProgressStore` interface every progress backend follows. |
| [`packages/db/`](../packages/db) | `@lessonfolk/db`: the Postgres schema ([Drizzle](https://orm.drizzle.team)), the migrations in `drizzle/`, the Postgres progress store (`createPostgresProgressStore`) and the database test helpers. |
| [`packages/mcp/`](../packages/mcp) | `@lessonfolk/mcp`: the MCP server (course and progress tools, course resources, tutor prompts) the dashboard serves at `/mcp`, and its OAuth setup for `LESSONFOLK_AUTH=oauth`. The tutor's instructions and the `learn`, `review` and `progress` prompts are `packages/mcp/prompts/*.md`: the only copy of the tutoring procedures (the skills point to them). |
| [`.claude/skills/`](../.claude/skills) | Claude Code skills (`learn`, `progress` and `review`, which run the MCP prompts; `create-course`, `edit-course`, `review-course`) and two mods: `course-companion` (for learners) and `course-builder` (for course authors). |
| [`docs/`](.) | Documentation: see the [index](README.md). |
| [`assets/brand/`](../assets/brand) | Logo files. |
| [`.mcp.json`](../.mcp.json) | Connects Claude Code opened in this folder to the MCP server of a local LessonFolk (`http://localhost:4321/mcp`). |
| `.progress/` | Where older versions of the tutor saved progress (`progress.json`). Git ignores it; only the import reads it. The format is [`progress.example.json`](progress.example.json). |
| `docker-compose.yml`, `Dockerfile` | Postgres and the app in containers. |
| `.github/` | The issue and pull request templates, and the CI, security and release workflows. |

The repository is an npm **workspace**: one `npm install` at the root installs the dashboard
and every package under `packages/`, and links them together (the dashboard imports
`@lessonfolk/core`, `@lessonfolk/db` and `@lessonfolk/mcp` straight from their source).

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
| `npm run review:courses` | Print the brief your agent follows to review lessons (rubric, lessons to read, catalog outline). Add `-- <course-id or lesson-id>…` to pick lessons. Calls no AI service. |
| `npm run progress:import` | Copy a `progress.json` (default: the old `.progress/progress.json`, or `-- <file>`) into `DATABASE_URL` as the local learner's progress, replacing it. |
| `npm run check -w <workspace>` | Type-check one workspace (`dashboard`, `packages/core`, `@lessonfolk/db` or `@lessonfolk/mcp`). |
| `npm test -w <workspace>` | Run one workspace's tests. |
| `npm run test:unit -w dashboard`, `npm run test:unit -w @lessonfolk/db`, `npm run test:unit -w @lessonfolk/mcp` | Run the tests that need no database (everything but `*.db.test.ts`). |
| `npm run generate -w @lessonfolk/db` | Write a new migration from changes to the schema. See [Database changes](#database-changes). |
| `npm run migrate -w @lessonfolk/db` | Apply pending migrations to `DATABASE_URL`. |

The dashboard workspace also has `dev`, `build` and `start`: the root `dashboard`,
`dashboard:build` and `dashboard:start` scripts run them.

## Database changes

The schema lives in [`packages/db/src/schema.ts`](../packages/db/src/schema.ts) (Drizzle). It
holds the sign-in tables of [Better Auth](https://www.better-auth.com) (`user`, `session`,
`account`, `verification`) and those of the MCP authorization server (`jwks`, `oauth_*`), then
`learner` (one per user), `lesson_progress` and the append-only `progress_event` log.

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
[Privacy and personal data](privacy.md). The account deletion test fails if a row is left behind.

**Never edit or delete a migration that is already on `main`.** It may already have run on
someone's database, and migrations run in order. To fix one, generate a new migration.

Migrations run by themselves when the app starts in Docker (`docker compose up --build`),
before the server listens.

**Looking into the database.** Start [CloudBeaver](https://dbeaver.com/docs/cloudbeaver/) (a
web database browser, development only) with `docker compose --profile tools up -d cloudbeaver`,
open http://127.0.0.1:8978 and sign in as `cbadmin` / `lessonfolk-dev`. The **LessonFolk
(local)** connection is already set up (it assumes the default `POSTGRES_PASSWORD`; see
`docker/cloudbeaver/data-sources.json`).

## Adding a tutor action

A learner action such as resetting a course touches four places: a pure rule in
[`packages/core/src/tutor.ts`](../packages/core/src/tutor.ts) (with unit tests), the
`ProgressStore` method (`store.ts`, implemented in `packages/db/src/progress-store.ts`, which
logs a `progress_event`), the MCP tool in `packages/mcp/src/server.ts`, and the procedure in
`packages/mcp/prompts/learn.md` (plus its phrase in `instructions.md` and the `learn` skill).
`reset_course` is a small example. Add the manual check to [Testing](testing.md).

Give every new text or list argument of an MCP tool a `.max()` from `LIMITS` in `server.ts`. The
store also refuses any write that would make a learner's saved progress larger than the 1 MB
import limit (`MAX_IMPORT_BYTES`).

## Live refresh

Open dashboard pages refresh by themselves when the tutor saves progress. The Postgres store
takes an `onChange(userId)` option, called after each committed write; the dashboard passes a
publisher of the in-process hub in
[`dashboard/src/lib/watch.ts`](../dashboard/src/lib/watch.ts), and `/api/events` (Server-Sent
Events, signed-in users only) streams `progress` events of the signed-in user alone to
[`LiveRefresh.astro`](../dashboard/src/components/LiveRefresh.astro), which swaps the page's
`<main>`. MCP runs in the same server, so its writes arrive without extra setup. With several
instances, publish through Postgres `LISTEN/NOTIFY` instead (same hub interface).

## Content Security Policy

The dashboard's CSP allows no `'unsafe-inline'` for scripts or `<style>` elements. Astro builds it
(`security.csp` in `dashboard/astro.config.mjs`, directives in
[`dashboard/src/lib/security-headers.ts`](../dashboard/src/lib/security-headers.ts)): it hashes
the scripts and styles it inlines. When you add to a page:

- **Scripts**: use a normal `<script>` in an `.astro` file (Astro bundles and hashes it) or a file
  in `dashboard/public/`. No `is:inline` script with code in it, no inline event handlers
  (`onclick=…`), no third-party script hosts without adding them to the config.
- **Styles**: `<style>` blocks are fine. Inline `style="--var: …"` attributes are allowed
  (`style-src-attr`), but prefer a class.
- The CSP only exists in builds, not in `npm run dashboard`: check new pages with
  `npm run dashboard:build` then `npm run dashboard:start`, and look for "violates the following
  Content Security Policy" in the browser console.

## Docker images

Docker images (`FROM` in the `Dockerfile`, `image:` in the compose files and in `test.yml`) are
pinned as `tag@sha256:<digest>` of the multi-arch index, so a rebuilt tag cannot change them
silently. Dependabot opens the weekly pull requests that refresh the digests (the `test.yml`
Postgres image has to be updated by hand together with the compose files). To bump one by hand:
`docker buildx imagetools inspect <tag>` and copy the top-level `Digest`.
