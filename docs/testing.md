# Testing LessonFolk

Two kinds of checks keep the dashboard and the tutor in step: automated tests you run with
one command, and a manual end-to-end session with a real AI tutor.

## Automated tests

Set up once as in [Development setup](../CONTRIBUTING.md#development-setup) (`npm install`,
then Postgres with `docker compose up -d db`), then run `npm test` and, for course changes,
`npm run check:courses`. Every command, type checks included, is listed in
[npm scripts](../CONTRIBUTING.md#npm-scripts).

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
  another server or port, see [Environment variables](../CONTRIBUTING.md#environment-variables).
  The user needs the right to create databases.
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

### Database schema and migrations

Changing the schema and generating migrations: see
[Database changes](../CONTRIBUTING.md#database-changes).

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
- **Live refresh.** The store publishes a per-user event after each committed write
  (`onChange` option of `createPostgresProgressStore`, hub in `dashboard/src/lib/watch.ts`) and
  `/api/events` streams it to that user only. The event stream lives in the server process, so
  e2e tests must write through MCP (`mcp-client.ts`), not through a store of the test process.
- **Course fixtures** live in `packages/core/tests/fixtures/`: `courses-valid/` is a pinned copy of the
  catalog with only AI Foundations, used by every test that expects an exact catalog (themes,
  authors, personalization scenarios, e2e pages), so adding a course to `courses/` never breaks
  them; `courses-invalid/` holds broken courses for the validation tests. The real `courses/`
  folder is checked by `npm run check:courses`.

| Test | What it checks |
|---|---|
| `pages.db.test.ts` | Home, catalog, AI Foundations course page, authors and an unknown course (404) for each fixture below, seeded as the local learner's progress; the next lesson shown on home and on the course page is the one `getNextLesson` picks |
| `progress-updates.db.test.ts` | Simulates a first session through the progress store (onboarding, lesson started and done, path, reset): each page load shows the new state |
| `auth-startup.test.ts` | Startup checks: `LESSONFOLK_AUTH=none` refuses a server reachable beyond 127.0.0.1 (`HOST`, or `LESSONFOLK_BIND` as in Docker) or an unreachable database, `oauth` refuses to start with no provider. No Postgres needed |
| `auth-oauth.db.test.ts` | Sign-in with `LESSONFOLK_AUTH=oauth` through the **fake OAuth provider** (`fake-oauth.ts`, enabled only with `NODE_ENV=test`): only configured providers are listed, callbacks use `LESSONFOLK_BASE_URL`, sign-in creates the user, account and learner rows, home redirects to sign-in and public pages show no progress when signed out, **two users each see only their own progress**, sign-out, signing in again finds the same user |
| `auth-none.db.test.ts` | `LESSONFOLK_AUTH=none`: the local learner is created on first start, once; pages show its progress without sign-in; the Docker-style start (`HOST=0.0.0.0`, `LESSONFOLK_BIND=127.0.0.1`) works |
| `mcp-none.db.test.ts` | `/mcp` in `none` mode with the MCP client: tools for the local learner, other sites refused, `LESSONFOLK_MCP_TOKEN` required when set |
| `account-none.db.test.ts` | `none` mode: the Connect page (address, apps, token note), the first-run import of `.progress/progress.json` (from a temporary `LESSONFOLK_ROOT`), import preview and confirm, invalid files refused, export round trip, cross-site posts refused, erase removes the local learner's rows |
| `account-oauth.db.test.ts` | `oauth` mode: Connect page with `LESSONFOLK_BASE_URL`, account routes need sign-in, import and export for the signed-in user only, deleting the account removes all that user's rows and signs out |
| `sessions-oauth.db.test.ts` | `oauth` mode: the Account page lists a learner's browser sessions (no IP address), ends one, the others or all, never another learner's, and a session ends 30 days after sign-in |
| `mcp-oauth.db.test.ts` | `/mcp` in `oauth` mode as an MCP client connects: 401 with the resource metadata, discovery, dynamic client registration, sign-in (fake provider), consent (allow and deny), PKCE token, then the tools as that user; two users apart (one cannot read or write the other's progress, even with a user id argument); forged tokens refused; oversized bodies refused (413); open client registration rate limited (429) |

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

## Manual end-to-end check with a real tutor

Automated tests write progress through the store themselves. This checklist proves that a real
AI tutor, opened in the LessonFolk folder as the README says, saves progress through the MCP
server the way the dashboard expects. Run it once in **Claude Code** and once in **Codex**, and
repeat it after changes to `AGENTS.md`, the skills, `.mcp.json`, `packages/mcp/prompts/`, the
progress format or the dashboard.

To read the saved progress at any step, use **Download progress.json** on the **Account**
page (`/account`): it has the progress.json v1 shape of
[`progress.example.json`](progress.example.json).

### Before you start

1. Back up your own progress if you have any: **Download progress.json** on the **Account**
   page.
2. Start LessonFolk without sign-in (`LESSONFOLK_AUTH=none`, the default) in one terminal:

   ```bash
   docker compose up --build
   ```

3. Start as a new learner: **Erase my progress** on the **Account** page.
4. Open http://127.0.0.1:4321 and keep it visible next to the chat. Also open
   http://127.0.0.1:4321/courses/ai-foundations in a second tab. Reload a page to see new progress.

### Checklist

- [ ] **First visit.** Home shows "Welcome to LessonFolk", the "How to start" steps and
      "What is AI?" as your first lesson. The course page shows "0 of 3 lessons" and every lesson
      "Not started".
- [ ] **Connect.** In a second terminal, in the repository folder, run `claude` (Claude Code): it
      asks to use the `lessonfolk` server of `.mcp.json`; approve it, and `/mcp` shows it
      connected. Codex: `codex mcp add lessonfolk --url http://localhost:4321/mcp` once, then
      `codex`.
- [ ] **Not connected.** Stop the app (`docker compose stop app`), start a new chat and say
      *Let's start learning AI*: the tutor does not teach from the files and tells you to start
      LessonFolk and connect (as `AGENTS.md` says). Start the app again
      (`docker compose start app`), then a new chat.
- [ ] **Onboarding.** Say *Let's start learning AI* (or `/learn` in Claude Code). The tutor calls
      `get_progress` first, then asks the onboarding questions one at a time (name, experience,
      why you want to learn, themes you are interested in, language). Answer "used ChatGPT-like
      tools" for experience: there is no level check for beginners.
- [ ] **Path.** The tutor recommends a path (AI Foundations) and explains why in 2–3 sentences,
      then asks if it suits you. Nothing about the path is saved before you agree. Accept it.
- [ ] **Progress saved.** The download has `version: 1`, a `profile` with your answers,
      `level: "beginner"`, your `interests` (theme ids), `path: ["ai-foundations"]` with
      `pathReason` and `pathUpdatedAt`, `current: "ai-foundations/01-what-is-ai"` and that lesson
      with `status: "in_progress"`. No `.progress/` folder was created.
- [ ] **Dashboard after onboarding.** Home greets you by name ("Welcome back, …!") and shows
      "What is AI?" under "Pick up where you left off". The course page shows lesson 1 "In
      progress" and the catalog shows AI Foundations "In progress".
- [ ] **Teach lesson 1.** Work through the lesson, answer the checks, finish it.
- [ ] **Lesson completed.** Lesson 1 has `status: "done"`, a `completedAt` date, a `score` between
      0 and 1 and short `notes`; `current` is cleared (`null` or absent).
- [ ] **Dashboard reflects it.** Home shows "1 of 3 lessons finished" and "How do machines learn?"
      under "Next up". The course page shows lesson 1 "Done" with its score, finish date and tutor notes,
      lesson 2 marked "Next up", and "1 of 3 lessons". The catalog shows "1 of 3 lessons".
- [ ] **No warnings.** No page shows "Your progress could not be loaded" or course file problems.
- [ ] **Commands.** Say *show my progress* (or `/progress`): the tutor's summary matches the
      dashboard. *Quiz me* (or `/review`) asks about lesson 1.
- [ ] **Nothing to commit.** `git status` shows no change.

Repeat the whole checklist in the other agent (Claude Code, then Codex, or the reverse), starting
again from an erased progress.

### Personalization scenarios

Three more runs check that the tutor and the dashboard agree on levels, level checks and
paths. The automated tests cover the same three learners with fixtures (`beginner-onboarded`,
`level-check-passed` and `placement-path`, `mid-course`), but only a real session proves that
the tutor saves what the dashboard reads. Run all three in **Claude Code**, and at least
scenario 1 in **Codex**. Back up your own progress first (see [Before you start](#before-you-start)).

**Scenario 1 — beginner, fresh start.** Erase your progress, say *Let's start learning AI*.

- [ ] The tutor asks name, experience, goal, interests (theme titles, empty themes marked
      "coming soon") and language, one question at a time. Answer "none" for experience.
- [ ] No level check is offered. The tutor recommends AI Foundations with a 2–3 sentence reason
      and asks if it suits you. Accept.
- [ ] The download has `profile.level: "beginner"`, `profile.interests` (theme ids, not titles),
      `path: ["ai-foundations"]`, `pathReason`, `pathUpdatedAt`,
      `current: "ai-foundations/01-what-is-ai"` and that lesson `in_progress`.
- [ ] Home shows "Level: Beginner", your interests, "Your path" with AI Foundations "In progress"
      and the tutor's reason behind "Why this path", and "What is AI?" under "Pick up where you
      left off". No "Some of your learning path was ignored" warning.

**Scenario 2 — developer, level check.** Erase your progress, start again and answer
"developer" for experience.

- [ ] The tutor offers an optional "level check" (never calls it "placement") of at most 6
      questions, one at a time, without teaching. Answer the AI Foundations questions well.
- [ ] Every AI Foundations lesson is `skipped` with `notes: "placement"` exactly and a
      `completedAt` date; `profile.level` is `"intermediate"`.
- [ ] With today's catalog (AI Foundations is the only course), the tutor says you have covered
      the catalog for now and saves no `path`.
- [ ] The catalog and the course page show "Skipped after level check" (course badge and each
      lesson), with no "Notes from your tutor" for these lessons. Home shows "You finished every
      lesson" and does **not** suggest "recommend a path".
- [ ] Variant: start over, answer the level check badly. Nothing is skipped, the tutor may lower
      your level, and AI Foundations is in the path.
- [ ] Say *show my progress*: the tutor counts skipped lessons as finished and says they were
      skipped after the level check, matching the dashboard.

**Scenario 3 — existing learner with an old progress file.** Erase your progress, then copy
`dashboard/tests/fixtures/progress/mid-course/progress.json` to `.progress/progress.json`
(no `level`, `interests` or `path`; lesson 1 done, lesson 2 in progress).

- [ ] Home offers to import the file; import it. Home then shows "Welcome back, Alex!", "1 of 3
      lessons finished", "How do machines learn?" under "Pick up where you left off", "Get a path
      made for you" with the phrase "recommend a path", and no warning.
- [ ] Say *continue*. The tutor asks the experience question **once** (mentioning your saved
      experience). Answer "used ChatGPT-like tools": it saves `profile.level: "beginner"`, offers
      no level check, and recommends a path.
- [ ] Nothing is lost: lesson 1 is still `done` with its score and notes, lesson 2 is still
      `in_progress`, and the tutor resumes lesson 2. Home shows the same counts. The tutor never
      reads or changes `.progress/progress.json`.
- [ ] If you accept the path, home shows "Your path" and stops suggesting "recommend a path".
      Say *continue* again: the tutor does not ask your level a second time.

### Reset

Stop the tutor, then **Erase my progress** on the **Account** page (and delete
`.progress/progress.json` if you made one for scenario 3): the dashboard shows the first visit
view again. Import your backup if you made one. Stop the app with `Ctrl+C`.

### Reporting a problem

Note the agent, the step that failed, and attach your downloaded progress.json (remove anything
personal) plus a screenshot of the dashboard. Open an issue on GitHub.

## Manual check: sign-in with GitHub and Google

The automated tests sign in through a fake provider. Real GitHub and Google sign-in needs your
own development OAuth apps, so it is checked by hand: after changes to sign-in, Better Auth
upgrades, or the auth tables. Follow [`docs/auth-dev.md`](auth-dev.md) to create the apps and
fill in `.env` (`LESSONFOLK_AUTH=oauth`, `LESSONFOLK_BASE_URL=http://localhost:4321`,
`BETTER_AUTH_SECRET`, both providers' credentials), then run `docker compose up --build`.

- [ ] **Startup.** The app log says "Sign-in with OAuth (LESSONFOLK_AUTH=oauth) at http://localhost:4321".
- [ ] **Signed out.** http://localhost:4321 sends you to the sign-in page. http://localhost:4321/courses
      shows the catalog without progress, an invitation to sign in and a **Sign in** button in the header.
- [ ] **Sign-in page.** **Sign in** opens a page listing "Sign in with GitHub" and "Sign in with Google".
      Remove the Google values from `.env`, restart: only GitHub is listed. Put them back.
- [ ] **GitHub.** Sign in with GitHub, approve the app: you land back on the page you came from,
      and the header shows "Signed in as <your name>" and **Sign out**.
- [ ] **Sign out.** **Sign out** brings you home with the **Sign in** button again.
- [ ] **Google.** Same with Google (your account must be a test user of the Google app).
- [ ] **Same user again.** Sign in again with GitHub: `docker compose exec db psql -U lessonfolk -d lessonfolk -c 'select id, name, email from "user"'`
      shows no duplicate, and every user has a row in `learner`.
- [ ] **Errors.** Cancel on the GitHub approval screen: you are back on the sign-in page with
      "Signing in did not work". Set only `GITHUB_CLIENT_ID` (no secret): the app refuses to start
      and says `GITHUB_CLIENT_SECRET` is missing.
- [ ] **No sign-in mode.** Set `LESSONFOLK_AUTH=none`: no **Sign in** button, `/sign-in` sends you home.
      Set `LESSONFOLK_BIND=0.0.0.0` too: the app refuses to start ("only runs on 127.0.0.1").

Put `.env` back the way it was when you are done, and never commit it.

## Manual check: Connect and Account pages

After changes to these pages, with `npm run dashboard` (no sign-in) and a copy of your own
`progress.json` kept somewhere safe:

- [ ] **Connect** (`/connect`) shows `http://127.0.0.1:4321/mcp`, marks claude.ai and ChatGPT as
      not available, and its Claude Code command connects (`/mcp` in Claude Code).
- [ ] **First run.** With no progress in the database and a `.progress/progress.json`, home offers
      to import it; the preview shows your name and lessons; **Replace my progress** imports it.
- [ ] **Account** (`/account`): **Download progress.json** saves the file; importing a file that
      is not JSON shows "This file cannot be imported" and changes nothing; **Erase my progress**
      needs "delete" typed, then home shows the first visit again.
- [ ] Both themes and a 375 px wide window look right.

## Manual check: Claude Code over MCP

The automated tests connect with the official MCP client. Check a real AI chat by hand after
changes to `packages/mcp`, the OAuth setup or Better Auth upgrades. Start the app with a database
(`docker compose up --build`), then follow [Connect your AI chat with MCP](using-lessonfolk.md#connect-your-ai-chat).

- [ ] **`none` mode.** `claude mcp add --transport http lessonfolk http://localhost:4321/mcp`, start
      `claude`: `/mcp` shows `lessonfolk` connected with its tools. Say *Let's start learning AI*:
      the tutor calls `get_progress`, onboards you and saves with `set_profile`, `set_path`,
      `start_lesson`. The rows appear in Postgres (`select * from lesson_progress`).
- [ ] **Token.** Set `LESSONFOLK_MCP_TOKEN` in `.env`, restart: without the header Claude Code fails
      to connect; with `--header "Authorization: Bearer <token>"` it connects.
- [ ] **`oauth` mode.** With the settings of [`auth-dev.md`](auth-dev.md), `claude mcp remove lessonfolk`,
      add it again, then `/mcp` → `lessonfolk` → authenticate. The browser shows sign-in, then
      "Allow Claude Code to use LessonFolk?". Allow: Claude Code connects and the tools act on your
      signed-in user. Deny once: Claude Code reports the authorization failed.
- [ ] **Codex.** Repeat the `none` and `oauth` checks with Codex's MCP settings for the same URL.

## Manual check: tutoring over MCP

The automated tests check that the instructions and the `learn`, `review` and `progress` prompts
are served and only name real tools. Check that real AI chats follow them after changes to
`packages/mcp/prompts/` or the tool descriptions, in **Claude Code and at least one other client**
(e.g. Codex). Use a fresh learner (`LESSONFOLK_AUTH=none` with an empty database, or a new
account in `oauth` mode) and open each client **outside** the LessonFolk folder, so it cannot read
`AGENTS.md` (in Claude Code, add the server there or with `--scope user`).

- [ ] **Instructions alone.** Say *Let's start learning AI*: the tutor calls `get_progress` first
      and onboards you one question at a time (name, experience, goal, themes from `list_themes`,
      language), then saves them with `set_profile` (level set from your experience).
- [ ] **Level check.** Answer "developer": the tutor offers an optional level check (never called
      "placement"), asks at most 6 questions, and calls `level_check_skip_course` for a course you
      pass. The dashboard shows its lessons as "Skipped after level check".
- [ ] **Path.** The tutor proposes a path with its themes and why, and calls `set_path` only after
      you agree. The dashboard shows the path and its reason.
- [ ] **Lesson.** The tutor calls `get_next_lesson`, `start_lesson`, `get_lesson`, then teaches one
      key idea at a time without pasting the lesson, asks a question after each and waits. A
      reference to a course you skipped is not "as you saw". After the checks it calls
      `complete_lesson` with a score and notes; the dashboard shows the lesson done with them.
- [ ] **Prompts.** In a new chat, use the `learn` prompt (Claude Code: `/mcp__lessonfolk__learn`;
      in clients without prompts, skip this): the tutor resumes from the saved progress. The
      `review` prompt quizzes a done lesson and calls `record_review_score`; `progress` summarises
      per course and names the lessons skipped after the level check.
- [ ] **Reset.** Say *reset AI Foundations* (after finishing or skipping some of it): the tutor shows
      the lessons and scores that will be removed and asks first. After your yes it calls
      `reset_course`; the dashboard shows the course as not started, other courses are unchanged,
      and *continue* starts its first lesson.
- [ ] **Mid-lesson stop.** Say you have to go during a lesson: the tutor calls `save_lesson_notes`;
      a new chat resumes there.
