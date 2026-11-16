# LessonFolk verification map

This directory is the maintained source for verifying the user-facing behavior of the LessonFolk dashboard. Read this index before driving the app, then use the matching feature sheet as the recipe. It is the project's only feature map: sheets describe what a user sees and does, never file paths or internals (read those from the source when you need them). `npm run verify:check` checks the sheets against the contract below and against the harness.

`verify` stands for `npm run -s verify --` (the helper in `../helpers/verify.mjs`, see `../SKILL.md`).

## Baseline preconditions

- Docker Desktop is running (started by the user, never by the agent) and Postgres answers.
- `verify launch` has reached "ready": an empty database, the production build of the current checkout, `LESSONFOLK_AUTH=none`, the local learner exists, the repository's `courses/` catalog.
- `verify doctor` reports `healthy: true` and the build revision matches `HEAD`.
- No progress is saved: the learner is new (no profile, no path, no lessons done) unless a sheet says how to seed it through the app.
- English is the interface language (the browser sends `en-US`, no `lessonfolk-lang` cookie).
- Never drive an instance that was not launched by this run. One instance at a time.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise. Reset by `teardown` then `launch`.
- Prefer ARIA roles and accessible names (`--role link --name "Courses"`) and `--testid`; never CSS, XPath, coordinates or DOM position.
- Treat every command as literal. Keep quoted names exactly as the page shows them (curly quotes in `Type “delete” to confirm` included).
- Pass `--feature <id>` on every call so proof lands in `evidence/<id>/`.
- Browser actions are one-shot and share a cookie jar; use `verify http` for status codes, headers and `Set-Cookie`, which a page does not show.
- Sign-in is off: `/sign-in` does not exist. Journeys that need OAuth sign-in are not drivable here and say so (see `authentication`).

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof: an ARIA snapshot and a screenshot of the end state, plus the `actions.log` lines.
- Header, cookie or API proof: the `verify http` / `verify browser cookies` output saved under the feature.
- Mutation proof: a read-only second view of the stored value (`verify db`, or a reopened page).
- Record the feature id and entry point used with every artifact.
- Report an unreachable path with the command attempted and the unmet precondition. Do not report a skipped entry point as verified through a different path.
- A precondition the baseline cannot give (a signed-in user, a progress state, a second learner, an unlaunchable flag) makes the journey **fail or be reported unreachable**, and the reason goes in that sheet's `Gotchas`. Never weaken a journey to make it pass.

## Feature sheet contract

Each sheet starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short ids with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify` starts with `Preconditions:` (auth, data, roles, flags), then `States to exercise:` (loading, empty, error, disabled, as relevant), then labeled bullets that pair each user action with the exact command and the observable result.
4. `Gotchas` lists traps that waste or invalidate a run, and every precondition the baseline cannot provide.

Keep implementation details out of the sheets: only user paths, stable handles, required state, commands and observable proof.

## Features

- [Home and learning path](./home-learning-path.md) covers the new-learner home page, its steps and its sign-in-free behavior.
- [Course catalog, course pages and authors](./course-catalog.md) covers listing, search, theme filter, course page, author pages and 404s.
- [Interface language](./interface-language.md) covers browser language, the footer switcher, the cookie and the page language.
- [Sign-in modes](./authentication.md) covers the no-sign-in mode, the current-user endpoint and what cannot be driven here.
- [Account and personal data](./account-data.md) covers download, import check, and erase of progress.
- [AI tutor connection (MCP)](./mcp-connection.md) covers the Connect page and the MCP endpoint's refusals.
- [Crawler files, legal pages, analytics and 404](./site-pages.md) covers robots, sitemap, llms, privacy, terms and the custom 404.
