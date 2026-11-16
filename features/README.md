# Feature map

A machine-readable inventory that links each user-facing feature to its entry points (routes, UI),
code, data, dependencies, rules, acceptance criteria and tests. It lets an AI agent (or a new
contributor) find what a change touches and what to test, without reading the whole repository.

- `index.yaml`: one line per feature (id, name, summary, sheet path). **Read this first.**
- `<id>.yaml`: the sheet of one feature. Load only the sheets you need.

## Sheet fields

| Field | Meaning |
|---|---|
| `id`, `name`, `summary`, `status` | `status` is `stable`, `beta`, `experimental` or `deprecated`. Optional: `flag`, `owner`. |
| `entry_points.routes` | `METHOD /path` in Astro file convention (`/courses/[id]`). Every page under `dashboard/src/pages` must be claimed by a feature. |
| `entry_points.ui` | `page`, `components` (files that must exist) and `selectors` (CSS selectors a test can use). |
| `code.paths` | Globs (`**` crosses folders, `*` does not) of the files that implement it. `code.models`: tables of `packages/db/src/schema.ts`. |
| `depends_on`, `impacts` | Feature ids. A change in A reaches B if B depends on A or A lists B in `impacts`. |
| `rules` | Business invariants, written so a reviewer can check them. |
| `acceptance` | `given` / `when` / `then`, concrete and testable (status codes, headers, numbers). |
| `tests` | `e2e`, `unit` (files that must exist), `harness` (helpers to reuse), `run` (command), `coverage_gaps` (what is known to be untested). |
| `risks` | What breaks badly if this goes wrong. |

Granularity: a user journey or capability, not a file. Start coarse; split a feature when its sheet gets long.

## Commands

```bash
npm run features -- list                         # the index
npm run features -- show <id>                    # one sheet
npm run features -- files-for <file...>          # which features own these files
npm run features -- impacted --base main         # features touched by the branch, plus dependents
git diff | npm run features -- impacted --stdin  # same, from a diff or a list of paths
npm run features -- untested                     # features without tests, or with coverage_gaps
npm run features -- validate                     # drift checks, run in CI
npm run features:test                            # tests of the scripts themselves
```

Add `--json` for machine output.

## What `validate` checks

Ids are unique and match the index and the file name; every `code.paths` glob, test, harness and UI
component exists; every `depends_on`/`impacts` id is a feature and `depends_on` has no cycle; every
page route is claimed by a feature and every claimed route has a page, served by a file inside that
feature's `code.paths`; every `models` entry is a table; acceptance entries have `given`, `when`,
`then`. It warns about e2e tests that no feature lists.

It cannot tell whether a rule or an acceptance criterion is still true: that is why a pull request
that changes a feature updates its sheet, and why a reviewer reads the sheet diff.

## Verification layer (`.claude/skills/verify-lessonfolk/`)

The YAML sheets say what a feature touches. The skill `verify-lessonfolk` proves, in a real browser and from an empty
database, that a feature works for a user: `npm run -s verify -- launch`, `doctor`, `browser …`, `http …`, `db …`,
`teardown`. Each feature has a sheet `.claude/skills/verify-lessonfolk/features/<id>.md` with **the same id** as
here. `validate` fails when a feature exists in one layer and not in the other, when a sheet is not listed in the
skill's index, or when its sections are not exactly `Sub-features`, `How to get to it (user POV)`,
`Driving it with verify`, `Gotchas`.

When you add a feature: write its YAML sheet (and index line) and its verification sheet together.

### Keeping the verification sheets honest

Procedure (details in the skill's `SKILL.md`, section "Maintain it"): one read-only sub-agent per feature reads
the source and reports likely drift; then one real pass drives every feature through its sheet; each finding is
triaged as **doc drift** (fix the sheet), **harness gap** (fix `verify.mjs` and re-drive it) or **product gap**
(report it, do not hide it in docs). The outcome is **clean**, **changed** (one PR of proven corrections) or
**blocked**. A missing precondition is a failed journey and a line in `Gotchas`, never a weakened journey.
