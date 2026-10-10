# Testing LessonFolk

Two kinds of checks keep the dashboard and the tutor in step: automated tests you run with
one command, and manual checks with a real AI tutor and with real sign-in.

## Automated tests

Set up once as in [Development setup](../CONTRIBUTING.md#development-setup) (`npm install`,
then Postgres with `docker compose up -d db`), then run `npm test` and, for course changes,
`npm run check:courses`. Every command, type checks included, is listed in
[npm scripts](development.md#npm-scripts).

`npm test` runs `npm test` in every workspace that has one, each with [Vitest](https://vitest.dev):
`packages/core/` (course loading, schemas, progress logic and the tutor rules, `@lessonfolk/core`),
`packages/db/` (Postgres schema, migrations and the progress store, `@lessonfolk/db`),
`packages/mcp/` (the MCP server's tools, resources and tutor prompts through the official MCP client, against
Postgres, `@lessonfolk/mcp`) and `dashboard/`.

### Database tests (Postgres)

Database tests run against a real Postgres, never a mock, locally and in CI, so we test what
we run. Start Postgres with `docker compose up -d db` (Postgres 17 on 127.0.0.1:5432, data in
the `db-data` volume); `docker compose stop db` stops it when you are done.

- The tests connect with `DATABASE_URL`, by default
  `postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk` (the `db` service). To use
  another server or port, see [Settings](configuration.md).
  The user needs the right to create databases (the owner, not the app's `lessonfolk_app` role;
  `packages/db/src/app-role.db.test.ts` checks that role can run the progress store and nothing more).
- Each test file gets its **own fresh database**, created and migrated by
  `createTestDatabase()` from `@lessonfolk/db/testing` and dropped at the end, so test
  files run in parallel without seeing each other's rows:

  ```ts
  import { createTestDatabase, type TestDatabase } from '@lessonfolk/db/testing';

  let testDb: TestDatabase;
  beforeAll(async () => { testDb = await createTestDatabase(); });
  afterAll(() => testDb?.drop());
  // testDb.db is a Drizzle client, testDb.sql the raw postgres.js client.
  ```

- Name database test files `*.db.test.ts`. When Postgres is not reachable they fail with
  "Cannot reach Postgres at … run `docker compose up -d db`".
- **Without Docker**, the tests that need no database still run: `npm test -w packages/core`,
  `npm run test:unit -w dashboard`, `npm run test:unit -w @lessonfolk/db` and
  `npm run test:unit -w @lessonfolk/mcp` (everything but `*.db.test.ts`).
- If a run is interrupted, leftover `lessonfolk_test_*` databases may stay behind. They are
  harmless; `docker compose down -v` removes them with the rest of the data.

CI (`.github/workflows/test.yml`) runs `npm test` and `npm run check:courses` on every pull
request, with Postgres as a service container.

### Core and dashboard tests

`npm test -w packages/core` and `npm test -w dashboard` run:

- **Unit tests** sit next to the code (`packages/core/src/**/*.test.ts`, `dashboard/src/**/*.test.ts`).
- **End-to-end tests** live in `dashboard/tests/e2e/`. Before they run, a global setup builds the
  production server into `dashboard/node_modules/.cache/lessonfolk-e2e/` (your own `dashboard/dist`
  is never touched). Each test file then starts that server as a real Node process on a free
  port, through `dashboard/scripts/serve.ts` (the startup checks, like `npm run dashboard:start`),
  pointed at the pinned course fixture and at its own test database, and fetches pages over
  HTTP. Servers and databases are removed when the tests finish. The servers never inherit
  sign-in settings or `DATABASE_URL` from your shell or `.env`: each test sets what it needs.
- **Seeding progress.** Progress lives in Postgres: tests write it with `seedProgress(db, userId,
  fixture)` from `tests/e2e/server.ts` (the store's `importProgress` of a progress fixture, or
  `null` for a learner with nothing saved) or with `testProgressStore(db)` to write step by step
  as the tutor would. The local learner of `LESSONFOLK_AUTH=none` has the user id `local`.
- **Live refresh.** The event stream lives in the server process (see
  [Live refresh](development.md#live-refresh)), so e2e tests must write through MCP
  (`mcp-client.ts`), not through a store of the test process.
- **Course fixtures** live in `packages/core/tests/fixtures/`: `courses-valid/` is a pinned copy of the
  catalog with only AI Foundations, used by every test that expects an exact catalog (themes,
  authors, personalization scenarios, e2e pages), so adding a course to `courses/` never breaks
  them; `courses-invalid/` holds broken courses for the validation tests. The real `courses/`
  folder is checked by `npm run check:courses`.

Each end-to-end file covers one area and says so in its name: pages, progress updates, sign-in
(`auth-*`), the Account page (`account-*`), sessions, the MCP server (`mcp-*`), learner
isolation, security headers and SEO. The `oauth` ones sign in through a **fake OAuth provider**
(`fake-oauth.ts`, enabled only with `NODE_ENV=test`), never GitHub or Google.

Progress fixtures (`dashboard/tests/fixtures/progress/`, progress.json files the tests import into Postgres):

| Fixture | Learner state |
|---|---|
| *(none, `null`)* | New learner: nothing saved yet |
| `minimal` | Onboarded (experience and language only), no lesson started |
| `mid-course` | Lesson 1 done, lesson 2 in progress. Also an **old progress file** (written before levels and paths: no `level`, `interests` or `path`): no warning, "recommend a path" suggested |
| `beginner-onboarded` | **Beginner right after onboarding**: level, interests, `path: ["ai-foundations"]` with its reason, lesson 1 in progress |
| `placement-path` | **Intermediate learner after a level check**: one lesson skipped by the level check, one skipped by hand, a path with unknown course and theme ids (ignored with a warning) |
| `level-check-passed` | **Developer who passed the level check** for AI Foundations: every lesson `skipped` with `notes: "placement"`, shown as "Skipped after level check" on home, catalog and course page |
| `all-done` | Every AI Foundations lesson done or skipped, with scores and notes |

To look at a fixture in the browser, import it as the local learner's progress (this replaces
what your database holds for it), then reload the dashboard:

```bash
npm run progress:import -- dashboard/tests/fixtures/progress/all-done/progress.json
```

### Course companion tests

The Course companion mod has its own tests in `.claude/skills/course-companion/tests/`; they
are not part of `npm test`: run them with `claude plugin test .claude/skills/course-companion`
(and `claude plugin validate` on the same folder). The mod reads the progress through the
LessonFolk MCP server with `$.mcp.call` (`get_progress`, `list_courses`, `get_lesson`), so it
needs no file or token of its own and works with a local or a hosted instance; the tests stand in
for the server with `tests/server.ts`. When you add or rename an MCP read tool it uses, update
that stand-in too.

## Manual checks

Automated tests write progress through the store themselves and sign in through a fake
provider. Only a real session proves that an AI tutor saves what the dashboard reads, and that
real sign-in works. Run the check that matches what you changed:

| After a change to… | Run |
|---|---|
| `AGENTS.md`, the skills, `.mcp.json`, `packages/mcp/prompts/`, the MCP tools, the progress format or the dashboard's progress pages | [A first session](#a-first-session), in **Claude Code** and in **Codex** |
| The level check, paths or onboarding | Also the [variants](#variants) |
| `packages/mcp`, the OAuth setup, sign-in, the auth tables, or a Better Auth upgrade | [Sign-in with GitHub and Google](#manual-check-sign-in-with-github-and-google) |
| The Connect or Account pages | [Connect and Account pages](#connect-and-account-pages) |

### Before you start

1. Back up your own progress if you have any: **Download progress.json** on the **Account**
   page (`/account`). The same download shows the saved progress at any step, in the shape of
   [`progress.example.json`](progress.example.json).
2. Start LessonFolk without sign-in (`LESSONFOLK_AUTH=none`, the default):
   `docker compose up --build`.
3. Start as a new learner: **Erase my progress** on the **Account** page.
4. Keep http://127.0.0.1:4321 and http://127.0.0.1:4321/courses/ai-foundations open next to the
   chat.

### A first session

- [ ] **First visit.** Home shows "Welcome to LessonFolk", the "How to start" steps and
      "What is AI?" as your first lesson. The course page shows "0 of 3 lessons" and every lesson
      "Not started".
- [ ] **Connect.** In the repository folder, run `claude` and approve the `lessonfolk` server of
      `.mcp.json`: `/mcp` shows it connected with its tools. Codex:
      `codex mcp add lessonfolk --url http://localhost:4321/mcp` once, then `codex`.
- [ ] **Not connected.** Stop the app (`docker compose stop app`), start a new chat and say
      *Let's start learning AI*: the tutor does not teach from the files and tells you to start
      LessonFolk and connect. Start the app again (`docker compose start app`), then a new chat.
- [ ] **Onboarding.** Say *Let's start learning AI* (or `/learn` in Claude Code). The tutor calls
      `get_progress` first, then asks one question at a time: name, experience, goal, interests
      (theme titles, empty themes marked "coming soon") and language. Answer "none" or "used
      ChatGPT-like tools" for experience: no level check is offered.
- [ ] **Path.** The tutor recommends a path that starts with AI Foundations, explains why in 2–3
      sentences and asks if it suits you. Nothing about the path is saved before you agree. Accept.
- [ ] **Progress saved.** The download has `version: 1`, a `profile` with your answers,
      `level: "beginner"` and your `interests` (theme ids, not titles), a `path` with `pathReason`
      and `pathUpdatedAt`, `current: "ai-foundations/01-what-is-ai"` and that lesson
      `in_progress`. No `.progress/` folder was created.
- [ ] **Dashboard after onboarding.** Without a reload, home greets you by name ("Welcome back,
      …!") and shows "Level: Beginner", your interests, "Your path" with the tutor's reason
      behind "Why this path", and "What is AI?" under "Pick up where you left off". The course
      page shows lesson 1 "In progress".
- [ ] **Lesson.** The tutor teaches one key idea at a time in its own words, never pasting the
      lesson, asks a question after each and waits. Say you have to go halfway: it saves notes
      (`save_lesson_notes`) and a new chat resumes there with *continue*.
- [ ] **Lesson completed.** After the checks, lesson 1 has `status: "done"`, a `completedAt`
      date, a `score` between 0 and 1 and short `notes`; `current` is cleared. Home shows "How do
      machines learn?" under "Next up"; the course page shows lesson 1 "Done" with its score,
      date and notes, and "1 of 3 lessons".
- [ ] **Commands.** *Show my progress* (or `/progress`) matches the dashboard. *Quiz me* (or
      `/review`) asks about lesson 1 and saves a review score.
- [ ] **Reset.** Say *reset AI Foundations*: the tutor shows the lessons and scores that will be
      removed and asks first. After your yes, the dashboard shows the course as not started and
      *continue* starts its first lesson.
- [ ] **Nothing left behind.** No page shows "Your progress could not be loaded" or course file
      problems, and `git status` shows no change.

### Variants

Each starts from an erased progress.

**Level check.** Answer "developer" for experience.

- [ ] The tutor offers an optional "level check" (never calls it "placement"): at most 6
      questions, one at a time, about courses below your level, without teaching.
- [ ] Answer the AI Foundations question well: every lesson of the course is `skipped` with
      `notes: "placement"` exactly and a `completedAt` date; `profile.level` is `"intermediate"`.
      The catalog and the course page show "Skipped after level check", with no "Notes from your
      tutor" for these lessons, and the path the tutor proposes leaves the course out.
- [ ] Answer a question badly: that course is not skipped and stays in the path.
- [ ] *Show my progress*: the tutor counts skipped lessons as finished and says they were skipped
      after the level check.

**An old progress file.** Copy `dashboard/tests/fixtures/progress/mid-course/progress.json` to
`.progress/progress.json` (no `level`, `interests` or `path`; lesson 1 done, lesson 2 in
progress) and run `npm run dashboard` instead of Docker, which cannot see the file.

- [ ] Home offers to import the file; import it. Home then shows "Welcome back, Alex!", "How do
      machines learn?" under "Pick up where you left off" and "Get a path made for you" with the
      phrase "recommend a path", and no warning.
- [ ] Say *continue*. The tutor asks the experience question **once** (mentioning your saved
      experience), saves the level and recommends a path. Lesson 1 is still `done` with its score
      and notes, and the tutor resumes lesson 2. It never reads or changes
      `.progress/progress.json`.
- [ ] Accept the path: home shows "Your path" and stops suggesting "recommend a path". *Continue*
      again does not ask your level a second time.

**Outside the LessonFolk folder.** Open the client in another folder, so it cannot read
`AGENTS.md`, and add the server
(`claude mcp add --transport http lessonfolk http://localhost:4321/mcp`).

- [ ] *Let's start learning AI* gives the same onboarding, path and lesson as in
      [A first session](#a-first-session), from the server's instructions alone.
- [ ] In a new chat, the `learn` prompt (`/mcp__lessonfolk__learn` in Claude Code) resumes from
      the saved progress; `review` quizzes a finished lesson; `progress` summarises per course.
- [ ] Set `LESSONFOLK_MCP_TOKEN` in `.env` and restart: the client fails to connect without the
      header, and connects with `--header "Authorization: Bearer <token>"`.

### Afterwards

**Erase my progress** on the **Account** page, delete `.progress/progress.json` if you made one,
and import your backup. To report a problem, open an issue on GitHub with the agent, the step
that failed, your downloaded progress.json (remove anything personal) and a screenshot of the
dashboard.

## Manual check: sign-in with GitHub and Google

Real sign-in needs your own development OAuth apps. Follow [`auth-dev.md`](auth-dev.md) to
create them and fill in `.env` (`LESSONFOLK_AUTH=oauth`,
`LESSONFOLK_BASE_URL=http://localhost:4321`, `BETTER_AUTH_SECRET`, both providers'
credentials), then run `docker compose up --build`.

- [ ] **Startup.** The app log says "Sign-in with OAuth (LESSONFOLK_AUTH=oauth) at http://localhost:4321".
- [ ] **Signed out.** http://localhost:4321 sends you to the sign-in page. http://localhost:4321/courses
      shows the catalog without progress and a **Sign in** button in the header.
- [ ] **Sign-in page.** It lists "Sign in with GitHub" and "Sign in with Google". Remove the
      Google values from `.env`, restart: only GitHub is listed. Put them back.
- [ ] **GitHub, then Google.** Sign in and approve the app: you land back on the page you came
      from, and the header shows "Signed in as <your name>". **Sign out** brings back the
      **Sign in** button. (Your Google account must be a test user of the Google app.)
- [ ] **Same user again.** Sign in again with GitHub:
      `docker compose exec db psql -U lessonfolk -d lessonfolk -c 'select id, name, email from "user"'`
      shows no duplicate, and every user has a row in `learner`.
- [ ] **Errors.** Cancel on the GitHub approval screen: you are back on the sign-in page with
      "Signing in did not work". Set only `GITHUB_CLIENT_ID` (no secret): the app refuses to start
      and says `GITHUB_CLIENT_SECRET` is missing.
- [ ] **An AI chat.** `claude mcp remove lessonfolk`, add it again, then `/mcp` → `lessonfolk` →
      authenticate. The browser shows sign-in, then "Allow Claude Code to use LessonFolk?".
      Allow: the tools act on your signed-in user. Deny once: Claude Code reports that the
      authorization failed. Repeat with Codex.
- [ ] **No sign-in mode.** Set `LESSONFOLK_AUTH=none`: no **Sign in** button, `/sign-in` sends
      you home. Set `LESSONFOLK_BIND=0.0.0.0` too: the app refuses to start ("only runs on
      127.0.0.1").

Put `.env` back the way it was when you are done, and never commit it.

## Connect and Account pages

With `npm run dashboard` (no sign-in) and a copy of your own `progress.json` kept somewhere safe:

- [ ] **Connect** (`/connect`) shows `http://127.0.0.1:4321/mcp`, marks claude.ai and ChatGPT as
      not available, and its Claude Code command connects.
- [ ] **Account** (`/account`): **Download progress.json** saves the file; importing it back shows
      a preview, then **Replace my progress** imports it; a file that is not JSON shows "This file
      cannot be imported" and changes nothing; **Erase my progress** needs "delete" typed, then
      home shows the first visit again.
- [ ] Both themes and a 375 px wide window look right.
