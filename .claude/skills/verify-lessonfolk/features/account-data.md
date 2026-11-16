# Account and personal data

The Account page lets the learner download their progress, check a `progress.json` before importing it, download all their data, and erase their progress. Without sign-in there is no account to delete, only the local learner's progress.

## Sub-features

- `account-download` downloads the progress as `progress.json`.
- `account-import-check` checks an uploaded file and shows what would change before saving.
- `account-export-all` downloads everything held about the learner as one JSON file.
- `account-erase` erases the progress after typing `delete`.

## How to get to it (user POV)

- The `Account` link in the navigation.
- The `/account` page; the import has its own page `/account/import`.

## Driving it with verify

Preconditions:

- Baseline state, no-sign-in mode: the page says progress belongs to the one local learner.
- Browser sessions and connected-app lists exist only in sign-in mode and are not shown here.

States to exercise:

- Empty progress (default), erase with a wrong confirmation. Import with a file needs an upload the harness cannot do yet; a confirmed erase is destructive (see Gotchas).

- **Open the page.** Run `verify browser goto --url /account --feature account-data` then `verify browser expect-visible --role heading --name "Account" --feature account-data`. Regions `Your progress` and `Delete` are visible.
- **Download link.** Run `verify browser expect-visible --role link --name "Download progress.json" --feature account-data`, then `verify http GET /api/account/export --feature account-data --path export.json`. Status `200` and a JSON body.
- **Everything export.** Run `verify http GET /api/account/export-all --feature account-data --path export-all.json`. Status `200`, a JSON body.
- **Import check present.** Run `verify browser expect-visible --role button --name "Check this file" --feature account-data`.
- **Erase confirmation field.** Run `verify browser expect-visible --role textbox --name "Type “delete” to confirm" --feature account-data`. The button `Erase my progress` is present.
- **Erase with a wrong word.** Run `verify browser fill --role textbox --name "Type “delete” to confirm" --value "nope" --feature account-data`, then `verify browser click --role button --name "Erase my progress" --feature account-data`. The page stays on `/account` and shows no message (observed: the click does nothing visible); the learner row remains: `verify db "select count(*)::int as learners from learner" --feature account-data` returns `1`.
- **Proof.** `verify browser snapshot --path account.aria.txt --feature account-data` and `verify browser screenshot --path account.png --feature account-data`, with the export JSON and the `verify db` output as the stored-data view.

## Gotchas

- The accessible names use curly quotes (`Type “delete” to confirm`): copy them exactly.
- Erasing for real wipes the run's learner data: only do it on a throwaway run, then relaunch for other features.
- Uploading a file for the import check is not supported by `verify browser` yet (harness gap); the import is unverified by this skill.
- A wrong confirmation word gives no visible message today (possible product gap: a learner gets no feedback); the proof is that stored data is unchanged.
