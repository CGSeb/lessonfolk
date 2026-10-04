# Testing Apprentice

Two kinds of checks keep the dashboard and the tutor in step: automated tests you run with
one command, and a manual end-to-end session with a real AI tutor.

## Automated tests

From the repository root:

```bash
npm ci                 # once
npm test               # all dashboard tests (unit + end-to-end), about 10 s
npm run check:courses  # validate every course and lesson file
npm run check -w dashboard  # type-check the dashboard
```

`npm test` runs [Vitest](https://vitest.dev) in `dashboard/`:

- **Unit tests** sit next to the code (`dashboard/src/**/*.test.ts`).
- **End-to-end tests** live in `dashboard/tests/e2e/`. Before they run, a global setup builds the
  production server into `dashboard/node_modules/.cache/apprentice-e2e/` (your own `dashboard/dist`
  is never touched). Each test file then starts that server as a real Node process on a free
  port, pointed at the real `courses/` folder and at one progress fixture, and fetches pages over
  HTTP. Servers and temporary folders are removed when the tests finish.

| Test | What it checks |
|---|---|
| `pages.test.ts` | Home, catalog, AI Foundations course page and an unknown course (404) for each fixture below |
| `live-refresh.test.ts` | Simulates a first session in a temporary `.progress/`: creating, updating and deleting `progress.json` each sends a `change` event on `/api/events`, and the pages show the new state |

Progress fixtures (`dashboard/tests/fixtures/progress/`):

| Fixture | Learner state |
|---|---|
| *(no folder)* | New learner: no `progress.json` yet |
| `minimal` | Onboarded, no lesson started |
| `mid-course` | Lesson 1 done, lesson 2 in progress |
| `all-done` | Every AI Foundations lesson done or skipped, with scores and notes |
| `invalid-json` | `progress.json` is not valid JSON |
| `invalid-shape` | Valid JSON, but not the expected shape |

To look at a fixture in the browser, point the dashboard at it with an **absolute** path
(relative paths resolve from `dashboard/`):

```bash
# macOS / Linux
APPRENTICE_PROGRESS_DIR="$PWD/dashboard/tests/fixtures/progress/all-done" npm run dashboard
```

```powershell
# Windows PowerShell
$env:APPRENTICE_PROGRESS_DIR = "$PWD\dashboard\tests\fixtures\progress\all-done"; npm run dashboard
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

- [ ] **First visit.** Home shows "Welcome to Apprentice", the "How to start" steps and
      "What is AI?" as your first lesson. The course page shows "0 of 3 lessons" and every lesson
      "Not started".
- [ ] **Open the tutor.** In a second terminal, in the repository folder, run `claude` (Claude Code)
      or `codex` (Codex). Say: *Let's start learning AI*.
- [ ] **Onboarding.** The tutor asks the onboarding questions one at a time (name, experience,
      why you want to learn, language). Answer them.
- [ ] **Progress file created.** `.progress/progress.json` exists, is valid JSON and matches
      `.progress/progress.example.json`: `version: 1`, a `profile` with your answers,
      `current: "ai-foundations/01-what-is-ai"` and that lesson with `status: "in_progress"`.
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

### Reset

Stop the tutor, then delete `.progress/progress.json` (the dashboard switches back to the first
visit view by itself). Restore your backup if you made one. Stop the dashboard with `Ctrl+C`.

### Reporting a problem

Note the agent, the step that failed, and attach `.progress/progress.json` (remove anything personal)
plus a screenshot of the dashboard. Open an issue on GitHub.
