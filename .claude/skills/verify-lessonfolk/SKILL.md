---
name: verify-lessonfolk
description: Drive the real LessonFolk dashboard in a browser (Playwright) from an empty database and prove a feature works, with evidence. Use to verify a change or a feature end to end, to reproduce a UI bug, or when asked to "verify", "prove" or "drive" LessonFolk. Also holds the maintenance procedure for its own feature map (`features/`).
---

# Verify LessonFolk

The dashboard (Astro, `dashboard/`) with no sign-in (`LESSONFOLK_AUTH=none`): one local learner, a fresh
Postgres database per run, the production build, a real Chrome driven through ARIA roles and
accessible names. This skill answers "does this feature work for a user?" with proof. The
other layer, `features/*.yaml` at the repository root, answers "what does this feature touch?"
(see `features/README.md`). **Both use the same feature id**, and `npm run features -- validate`
fails when one has a feature the other lacks.

`verify` below is `npm run -s verify --` (it runs `helpers/verify.mjs`).

## Before anything

- **Docker Desktop must be running** (Postgres). Never start it yourself: if `docker info` fails,
  ask the user to start it and wait. The compose `db` service is started by `launch` only when Docker is up.
- First time on a checkout: `npm install` at the root, then `npm install --prefix .claude/skills/verify-lessonfolk/helpers`
  (installs `playwright-core`; no browser download needed, a system Chrome or Edge is used when Playwright's Chromium is absent or blocked).

## Launch

```bash
verify launch
```

Creates an **empty** database `lessonfolk_verify_<run>` next to the compose one, builds the dashboard
in a private folder (never the learner's own `dashboard/dist`), and starts it on a free port with
`LESSONFOLK_AUTH=none`, the repository's `courses/` and `projects/`, and an empty `LESSONFOLK_ROOT`
(no old `progress.json`, so no import offer). The server is detached and logs to `.verify/<run>/server.log`.
**Ready means usable**: `launch` waits until `/api/me` returns the local learner (migrations done, learner
created), not just until the port answers. It prints the URL, pid, database and evidence folder.
Allow about a minute for the build. One instance at a time: `launch` refuses while a run is up. If `launch`
cannot reach Postgres and Docker is down, it stops with the compose error: ask the user for Docker.

## Doctor

```bash
verify doctor
```

Read-only. Exits 1 and lists `problems` when: the pid is dead, `/api/me` does not answer or is not
`authMode: none` with user `local`, the database is unreachable, or `HEAD` moved since the build
(you would be verifying old code: relaunch). Run it before the first drive, after any failed drive,
and whenever something looks off. It never fixes anything.

## Drive

One command per user action; cookies and the current page persist between calls (a fresh headless
browser each time, same cookie jar). Always pass `--feature <id>` so proof lands under that feature.

```bash
verify browser goto --url /courses --feature course-catalog
verify browser click --role link --name "Courses" --feature course-catalog
verify browser fill --role searchbox --name "Search courses" --value "prompt" --submit --feature course-catalog
verify browser expect-text --text "Prompting Basics" --feature course-catalog
verify browser expect-visible --role heading --name "Courses" --feature course-catalog
verify browser expect-url --url "/courses?q=prompt" --feature course-catalog
verify browser set-language --lang fr --feature interface-language       # the footer switcher, a real form post
verify browser cookies --feature interface-language                        # name, value, path, httpOnly, sameSite, lifetime
verify browser snapshot --path list.aria.txt --feature course-catalog      # ARIA snapshot of the page
verify browser screenshot --path list.png --feature course-catalog
verify http GET /api/me --feature authentication                          # plain request: status, headers, Set-Cookie
verify http POST /api/language --form "lang=fr&next=/courses" --feature interface-language
verify db "select count(*) from learner" --feature account-data          # read-only SQL on the run's database
```

- Locators are **ARIA roles and accessible names** (`--role button --name "Search"`), or `--testid`
  when an element has a `data-testid`. Never CSS selectors, XPath, coordinates or DOM position. The app has
  almost no `data-testid`: names and roles are the stable handles. If a user action has no accessible name, that is a product gap, not a reason to use a CSS selector.
- Options: `--accept-language fr` (browser language), `--viewport 390x800`.
- `expect-*` and a failed click exit 1: **a failed expectation fails the journey**. Do not retry with a looser
  check, do not drive another way and call the original path verified.
- Only pages of the launched instance are driven; any other URL is refused. (In Git Bash a leading `/` is rewritten to
  `C:/Program Files/Git/…`: the helper undoes it, or set `MSYS_NO_PATHCONV=1`.)
- Use the real user path. No test-only endpoints, no writing rows to fake a state a user could not reach. Seeding
  state goes through the app (import a `progress.json` on `/account`, or the tutor's MCP tools).

## Evidence

A proof is: **the action, the resulting state, and the stored data checked from a second view**.

- Every `verify browser` and `verify http` call is appended to `evidence/actions.log` (timestamp, feature, action, result).
- Per feature, under `.verify/<run>/evidence/<feature>/`: an ARIA snapshot and a screenshot of the end state, cookies or response headers
  for what the browser does not show, and for any change of stored data a `verify db` read of the row (or the cookie for browser-side state).
- A mutation is not proven by its success message alone: reopen the page or query the stored value.
- `verify evidence` lists the files of the run. Name the run folder in your report.
- Dry-run and test modes: observe what they skip rather than trusting the name.
- `.verify/` is git-ignored. Proof is never committed, and never deleted by cleanup.

## Cleanup

```bash
verify teardown
```

Stops **only** the server whose pid this run recorded, drops its database, removes its private build and browser cookies,
and stops the compose `db` service only if this run started it. It never kills by process name. **Evidence stays** in
`.verify/<run>/evidence/`; confirm with `verify evidence` or `ls` afterwards. Run it after every failed attempt too, so no server or database is left behind.

## Helpers

| Command | Purpose |
|---|---|
| `verify launch [--auth none]` | empty database, build, server, wait until usable |
| `verify doctor` | read-only health check |
| `verify browser <action> …` | one Playwright action (list above) |
| `verify http <METHOD> <path> [--header "K: V"] [--form k=v&…]` | request with status, headers and Set-Cookie |
| `verify db "<select …>"` | read-only SQL cross-check |
| `verify evidence` | list proof files |
| `verify teardown` | stop what the run started, keep proof |

`helpers/verify.mjs` is the only script; run it with no arguments for the usage text. It needs Node 22+, Docker for Postgres, and a Chrome, Edge or Playwright Chromium.

## The feature map of this skill

`features/README.md` holds the baseline preconditions, driving conventions, proof rules and the contract every
sheet follows, and indexes one sheet per feature (`features/<id>.md`). Read the README, then only the sheet you need.

## Maintain it (`features/` honest as the app changes)

Run this when features change, before a release, or when a sheet failed in a real run. Outcomes: **clean** (every feature covered from
source and live, nothing to ship), **changed** (one PR of proven corrections), **blocked** (say what blocked it).

1. **Locate and index hygiene.** Compare `features/index.yaml` (root), the sheets in `features/*.yaml` and `.claude/skills/verify-lessonfolk/features/*.md`; `npm run features -- validate` lists features missing from either layer and malformed sheets. Fix dead or duplicate entries.
2. **Source wave.** One **read-only sub-agent per feature**, in parallel. Each reads the source of its feature and returns: summary, entry points, likely doc drift with file citations, and one live recipe. Sub-agents never drive the app and never edit.
3. **Reconcile.** Merge overlapping recipes into as few app states as possible. Spot-check cited drift. Look at recent churn (`git log` on `dashboard/src/pages`) for user-facing surfaces missing from the map; require a concrete source path before calling one missing.
4. **Live pass (required even if source looks clean).** You drive, serially: `launch`, `doctor`, then every feature at least once through its sheet. Keep three invariants: doctor before the first drive and after any failed drive; evidence survives every cleanup (check the folder); nothing a drive started outlives it. A feature that cannot be reached is `verified-unreachable` only with the concrete unmet precondition and the route tried; if the sheet omitted that precondition, that is drift. Teardown once, after the last drive.
5. **Triage.** Wrong or missing user description → **doc drift**, fix the sheet. Working behavior the harness cannot drive → **harness gap**, fix `verify.mjs` and re-drive the fix live. App behavior that is broken → **product gap**: record it for the user, keep it out of the PR.
6. **Ship or stop.** Edit only this skill's folder and `features/*.yaml`; never product code during a maintenance run. Re-run `npm run features -- validate` and `npm run features:test`. Changed → one PR of corrections. Clean or blocked → no PR, report coverage honestly. Keep run notes in a scratch location, not in the repository.
