@AGENTS.md

## Tests on code branches

When a branch changes code (anything outside `courses/` and plain docs: the
dashboard, scripts, tests, fixtures, configuration, dependencies), you must run the tests
yourself before you commit, open a pull request or hand the work back:

1. Run `npm install` first if dependencies are missing.
2. Start Postgres with `docker compose up -d db` (database tests run against a real
   Postgres; leave it running between test runs). If they fail with "Cannot reach Postgres",
   Docker or the `db` service is not running. See `docs/testing.md`.
3. Run `npm test` from the repository root. If the branch touches `courses/` too, also run
   `npm run check:courses`.
4. Fix every failure and run the tests again until they all pass. Never commit, push or
   report the work as done while a test fails, and never skip, delete or loosen a test just
   to make it pass: fix the code, or fix the test only if the test itself is wrong (and say why).
5. In your summary, give the test result (for example "271 tests pass"). If you could not run
   the tests, say so plainly instead of implying they pass.

## Feature map and verification (`.claude/skills/verify-lessonfolk/`)

The project's feature map lives in the `verify-lessonfolk` skill: `features/README.md` (index,
baseline, conventions, proof rules) and one sheet per user-facing feature, written from the
user's point of view (how to reach it, how to drive it, observable results, gotchas). It holds no
file paths or code structure: read those from the source. The skill launches the dashboard from
an empty database and proves a feature in a real browser (`npm run verify -- launch | doctor |
browser … | teardown`). It is a contributor tool: the learner plugin (`.claude/skills/lessonfolk-tutor`)
does not ship it.

- **To prove a change works**, follow the skill: launch, doctor, drive the feature through its
  sheet, keep the evidence (`.verify/`), teardown. Docker Desktop must already be running: never
  start it yourself, ask the user.
- **Read the README first**, then only the sheet of the feature you touch.
- **A change to what a user sees updates that sheet; a new feature gets its sheet** (and its
  README line) in the same change.
- **Keep the sheets honest** with the maintenance procedure in the skill's `SKILL.md` ("Maintain it"):
  one read-only sub-agent per feature reads the source, then one real pass drives every feature,
  and each finding is triaged as doc drift (fix the sheet), harness gap (fix `verify.mjs`) or
  product gap (report it). Outcome: clean, changed (one PR) or blocked. Never weaken a journey to
  make it pass: a missing precondition is a failure and a line in the sheet's `Gotchas`.
- Run `npm run verify:check` and `npm run verify:test` before you commit a change to the skill; CI runs both.
