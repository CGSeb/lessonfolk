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

## Feature map (`features/`)

`features/` is a machine-readable map of what LessonFolk does: one line per feature in
`features/index.yaml`, one sheet per feature (entry points, code, models, dependencies, rules,
acceptance criteria, tests, coverage gaps). Format and commands: `features/README.md`.

When you test, change or create a feature:

1. **Read `features/index.yaml` first**, then load only the sheets concerned
   (`npm run features -- show <id>`). Do not read every sheet.
2. **Find what you touch**: `npm run features -- files-for <file...>`, and for a whole branch
   `npm run features -- impacted --base main` (it adds the features that depend on the changed
   ones: test those too).
3. **Test from the sheet**: turn its `acceptance` criteria into tests, reuse `tests.harness`, put
   the test next to the ones in `tests.e2e`/`tests.unit`, and remove the matching line from
   `tests.coverage_gaps` once a test closes it. `npm run features -- untested` lists the gaps.
4. **Update the sheet in every change that touches a feature**: new route, file or model,
   changed rule or acceptance criterion, new or removed test. An out-of-date sheet misleads the
   next agent.
5. **New feature: write its sheet (and its index line) before implementing**, with acceptance
   criteria concrete enough to test. A route under `dashboard/src/pages` that no sheet claims is an error.
6. Run `npm run features -- validate` and `npm run features:test` before you commit; CI runs both.
