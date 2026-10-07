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
