# Testing LessonFolk

Two kinds of checks keep the dashboard and the tutor in step: automated tests you run with
one command, and a manual end-to-end session with a real AI tutor.

## Automated tests

From the repository root:

```bash
npm ci                 # once
docker compose up -d db  # once per session: Postgres for the database tests
npm test               # every workspace: dashboard and packages/*
npm run check:courses  # validate every course and lesson file
npm run check -w dashboard  # type-check the dashboard
npm run check -w packages/core  # type-check the core package
npm run check -w @lessonfolk/db  # type-check the database package
```

`npm test` runs `npm test` in every workspace that has one, each with [Vitest](https://vitest.dev):
`packages/core/` (course loading, schemas and progress logic, `@lessonfolk/core`),
`packages/db/` (Postgres schema and migrations, `@lessonfolk/db`) and `dashboard/`.

### Database tests (Postgres)

Database tests run against a real Postgres, never a mock, locally and in CI, so we test what
we run. You need [Docker](https://docs.docker.com/get-docker/):

```bash
docker compose up -d db   # Postgres 17 on 127.0.0.1:5432, data in the `db-data` volume
npm test
docker compose stop db    # when you are done (`docker compose down -v` also deletes the data)
```

- The tests connect with `DATABASE_URL`, by default
  `postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk` (the `db` service). To use
  another server or port, copy `.env.example` to `.env` and change it there (or set
  `DATABASE_URL` in your shell). The user needs the right to create databases.
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
- **Without Docker**, the pure unit tests still run: `npm test -w packages/core`, `npm test -w dashboard`
  (no database test there yet) and `npm run test:unit -w @lessonfolk/db` (everything but `*.db.test.ts`).
- If a run is interrupted, leftover `lessonfolk_test_*` databases may stay behind. They are
  harmless; `docker compose down -v` removes them with the rest of the data.

CI (`.github/workflows/test.yml`) runs `npm test` and `npm run check:courses` on every pull
request, with Postgres as a service container.

### Database schema and migrations

The schema lives in `packages/db/src/schema.ts` (Drizzle): `learner`, `lesson_progress`
and the append-only `progress_event` log. After changing it, generate a migration and commit
it with the schema change:

```bash
npm run generate -w @lessonfolk/db   # writes packages/db/drizzle/NNNN_*.sql
npm run migrate -w @lessonfolk/db    # apply pending migrations to DATABASE_URL by hand
```

Migrations are applied automatically when the app starts in Docker (`docker compose up
--build`), before the dashboard server listens.

### Core and dashboard tests

`npm test -w packages/core` and `npm test -w dashboard` run:

- **Unit tests** sit next to the code (`packages/core/src/**/*.test.ts`, `dashboard/src/**/*.test.ts`).
- **End-to-end tests** live in `dashboard/tests/e2e/`. Before they run, a global setup builds the
  production server into `dashboard/node_modules/.cache/lessonfolk-e2e/` (your own `dashboard/dist`
  is never touched). Each test file then starts that server as a real Node process on a free
  port, pointed at the pinned course fixture and at one progress fixture, and fetches pages over
  HTTP. Servers and temporary folders are removed when the tests finish.
- **Course fixtures** live in `packages/core/tests/fixtures/`: `courses-valid/` is a pinned copy of the
  catalog with only AI Foundations, used by every test that expects an exact catalog (themes,
  authors, personalization scenarios, e2e pages), so adding a course to `courses/` never breaks
  them; `courses-invalid/` holds broken courses for the validation tests. The real `courses/`
  folder is checked by `npm run check:courses`.

| Test | What it checks |
|---|---|
| `pages.test.ts` | Home, catalog, AI Foundations course page, authors and an unknown course (404) for each fixture below; for every valid fixture, the next lesson shown on home and on the course page is the one `getNextLesson` picks |
| `live-refresh.test.ts` | Simulates a first session in a temporary `.progress/`: creating, updating and deleting `progress.json` each sends a `change` event on `/api/events`, and the pages show the new state |

Progress fixtures (`dashboard/tests/fixtures/progress/`):

| Fixture | Learner state |
|---|---|
| *(no folder)* | New learner: no `progress.json` yet |
| `minimal` | Onboarded, no lesson started |
| `mid-course` | Lesson 1 done, lesson 2 in progress. Also an **old progress file** (written before levels and paths: no `level`, `interests` or `path`): no warning, "recommend a path" suggested |
| `beginner-onboarded` | **Beginner right after onboarding**: level, interests, `path: ["ai-foundations"]` with its reason, lesson 1 in progress |
| `placement-path` | **Intermediate learner after a level check**: one lesson skipped by the level check, one skipped by hand, a path with unknown course and theme ids (ignored with a warning) |
| `level-check-passed` | **Developer who passed the level check** for AI Foundations: every lesson `skipped` with `notes: "placement"`, shown as "Skipped after level check" on home, catalog and course page |
| `all-done` | Every AI Foundations lesson done or skipped, with scores and notes |
| `invalid-json` | `progress.json` is not valid JSON |
| `invalid-shape` | Valid JSON, but not the expected shape |

To look at a fixture in the browser, point the dashboard at it with an **absolute** path
(relative paths resolve from `dashboard/`):

```bash
# macOS / Linux
LESSONFOLK_PROGRESS_DIR="$PWD/dashboard/tests/fixtures/progress/all-done" npm run dashboard
```

```powershell
# Windows PowerShell
$env:LESSONFOLK_PROGRESS_DIR = "$PWD\dashboard\tests\fixtures\progress\all-done"; npm run dashboard
```

## Manual end-to-end check with a real tutor

Automated tests write `progress.json` themselves. This checklist proves that a real AI tutor
writes it the way the dashboard expects. Run it once in **Claude Code** and once in **Codex**,
and repeat it after changes to `AGENTS.md`, the progress format or the dashboard.

### Before you start

1. Back up your own progress if you have any: copy `.progress/progress.json` somewhere safe.
2. Delete `.progress/progress.json` so you start as a new learner.
3. Install dependencies and start the dashboard in one terminal:

   ```bash
   npm install
   npm run dashboard
   ```

4. Open http://127.0.0.1:4321 and keep it visible next to the chat. Also open
   http://127.0.0.1:4321/courses/ai-foundations in a second tab.

### Checklist

- [ ] **First visit.** Home shows "Welcome to LessonFolk", the "How to start" steps and
      "What is AI?" as your first lesson. The course page shows "0 of 3 lessons" and every lesson
      "Not started".
- [ ] **Open the tutor.** In a second terminal, in the repository folder, run `claude` (Claude Code)
      or `codex` (Codex). Say: *Let's start learning AI*.
- [ ] **Onboarding.** The tutor asks the onboarding questions one at a time (name, experience,
      why you want to learn, themes you are interested in, language). Answer "used ChatGPT-like
      tools" for experience: there is no level check for beginners.
- [ ] **Path.** The tutor recommends a path (AI Foundations) and explains why in 2–3 sentences,
      then asks if it suits you. Nothing about the path is saved before you agree. Accept it.
- [ ] **Progress file created.** `.progress/progress.json` exists, is valid JSON and matches
      `.progress/progress.example.json`: `version: 1`, a `profile` with your answers,
      `level: "beginner"`, your `interests` (theme ids), `path: ["ai-foundations"]` with
      `pathReason` and `pathUpdatedAt`, `current: "ai-foundations/01-what-is-ai"` and that
      lesson with `status: "in_progress"`.
- [ ] **Live update, no reload.** Without touching the browser, home now greets you by name
      ("Welcome back, …!") and shows "What is AI?" under "Pick up where you left off". The course page
      shows lesson 1 "In progress" and the catalog shows AI Foundations "In progress".
- [ ] **Teach lesson 1.** Work through the lesson, answer the checks, finish it.
- [ ] **Lesson completed in the file.** Lesson 1 has `status: "done"`, a `completedAt` date, a
      `score` between 0 and 1 and short `notes`; `current` is cleared (`null` or absent).
- [ ] **Dashboard reflects it.** Home shows "1 of 3 lessons finished" and "How do machines learn?"
      under "Next up". The course page shows lesson 1 "Done" with its score, finish date and tutor notes,
      lesson 2 marked "Next up", and "1 of 3 lessons". The catalog shows "1 of 3 lessons".
- [ ] **No warnings.** No page shows "Your progress file could not be read" or course file problems.
- [ ] **Commands.** Say *show my progress*: the tutor's summary matches the dashboard.
- [ ] **Not committed.** `git status` does not list anything in `.progress/` other than the example.

Repeat the whole checklist in the other agent (Claude Code, then Codex, or the reverse), starting
again from a deleted `progress.json`.

### Personalization scenarios

Three more runs check that the tutor and the dashboard agree on levels, level checks and
paths. The automated tests cover the same three learners with fixtures (`beginner-onboarded`,
`level-check-passed` and `placement-path`, `mid-course`), but only a real session proves that
the tutor writes what the dashboard reads. Run all three in **Claude Code**, and at least
scenario 1 in **Codex**. Back up your own `progress.json` first (see [Before you start](#before-you-start)).

**Scenario 1 — beginner, fresh start.** Delete `.progress/progress.json`, say *Let's start
learning AI*.

- [ ] The tutor asks name, experience, goal, interests (theme titles, empty themes marked
      "coming soon") and language, one question at a time. Answer "none" for experience.
- [ ] No level check is offered. The tutor recommends AI Foundations with a 2–3 sentence reason
      and asks if it suits you. Accept.
- [ ] `progress.json` has `profile.level: "beginner"`, `profile.interests` (theme ids, not titles),
      `path: ["ai-foundations"]`, `pathReason`, `pathUpdatedAt`,
      `current: "ai-foundations/01-what-is-ai"` and that lesson `in_progress`.
- [ ] Home shows "Level: Beginner", your interests, "Your path" with the tutor's reason under
      "Why this path", AI Foundations "In progress", and "What is AI?" under "Pick up where you
      left off". No "Some of your learning path was ignored" warning.

**Scenario 2 — developer, level check.** Delete `.progress/progress.json`, start again and
answer "developer" for experience.

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

**Scenario 3 — existing learner with an old progress file.** Copy
`dashboard/tests/fixtures/progress/mid-course/progress.json` to `.progress/progress.json`
(no `level`, `interests` or `path`; lesson 1 done, lesson 2 in progress).

- [ ] Before talking to the tutor: home shows "Welcome back, Alex!", "1 of 3 lessons finished",
      "How do machines learn?" under "Pick up where you left off", "Get a path made for you"
      with the phrase "recommend a path", and no warning.
- [ ] Say *continue*. The tutor asks the experience question **once** (mentioning your saved
      experience). Answer "used ChatGPT-like tools": it saves `profile.level: "beginner"`, offers
      no level check, and recommends a path.
- [ ] Nothing is lost: lesson 1 is still `done` with its score and notes, lesson 2 is still
      `in_progress`, and the tutor resumes lesson 2. Home shows the same counts.
- [ ] If you accept the path, home shows "Your path" and stops suggesting "recommend a path".
      Say *continue* again: the tutor does not ask your level a second time.

### Reset

Stop the tutor, then delete `.progress/progress.json` (the dashboard switches back to the first
visit view by itself). Restore your backup if you made one. Stop the dashboard with `Ctrl+C`.

### Reporting a problem

Note the agent, the step that failed, and attach `.progress/progress.json` (remove anything personal)
plus a screenshot of the dashboard. Open an issue on GitHub.
