# Privacy and personal data

Where LessonFolk keeps personal data, how a learner downloads or deletes it, and how long
anything outside the database lives. The learner-facing text is the `/privacy` page
(`dashboard/src/pages/privacy.astro`, strings in `dashboard/src/i18n/en.ts`); keep it in step with
this page. **A human must review the privacy text before the hosted version opens to learners.**
The retention periods below are the defaults the text states: whoever runs a server must make
them true (or change the text).

With `LESSONFOLK_AUTH=none` there is no account and nothing leaves the computer: the only data is
the local learner's progress.

## Data map

Everything is in Postgres (`packages/db/src/schema.ts`). Every table below is reached from `user`
by an `on delete cascade` key, so deleting the user row deletes it all.

| Table | Personal data | In the full export | Secrets (never exported) |
|---|---|---|---|
| `user` | name, email (the profile picture is never stored; the `image` column stays empty because Better Auth requires it) | yes | |
| `account` | sign-in provider and the learner's id there, scope | yes | access, refresh and id tokens, password |
| `session` | browser, dates (the IP address is never stored; the `ip_address` column stays empty because Better Auth requires it) | yes | session token |
| `verification` | short-lived sign-in values (minutes); deleted with the account when keyed by email or user id | no (not linked to the user) | all |
| `oauth_client` | AI apps the learner registered: name, address, contacts | yes | client secret |
| `oauth_consent` | which AI app the learner allowed, with which scopes | yes | |
| `oauth_access_token`, `oauth_refresh_token` | which app, scopes, dates | yes (metadata) | token values |
| `learner` | profile (name, experience, goal, language, level, interests), path | yes | |
| `lesson_progress` | status, dates, score, the tutor's notes | yes | |
| `progress_event` | history of every change to the progress | yes | |
| `jwks`, `oauth_resource`, `oauth_client_assertion` | server keys and settings, no personal data | no | |

Outside the database: server logs and database backups (below). The dashboard sets no analytics
or advertising cookies, only the sign-in session cookie.

## Download all my data

**Account** page, "Download all my data" (`/api/account/export-all`): one JSON file with every
row above that belongs to the learner (`dashboard/src/lib/personal-data.ts`). Where a secret
exists it only says so (`hasAccessToken: true`). The tutor's `progress.json` stays a separate
download (`/api/account/export`). A learner can only get their own data: the route takes no user id.

## Delete my account

**Account** page, type "delete" (`/api/account/delete`, `deleteLearnerData` in
`dashboard/src/lib/account.ts`): deletes the `user` row and, through the cascade, every row in the
table above, plus pending `verification` values, in one transaction, then signs out. Sessions are
rows, so they stop working at once; MCP access tokens are signed and would otherwise live until
they expire, so the MCP endpoint also checks that the user still exists. Without sign-in, the same
button erases the local learner's progress and history.

Both the full export and the deletion require a **recent sign-in** (10 minutes) on the hosted
version; otherwise the learner is sent to sign in again and comes back to the Account page.

When you add a table that references a user, make it cascade, add it to the export and to this
table. The test in `dashboard/tests/e2e/account-oauth.db.test.ts` fails if any text or JSON column
of any table still holds the user's id or email after deletion.

## Retention outside the database

| Where | Kept | Notes |
|---|---|---|
| Sessions | 7 days | Better Auth's default expiry. |
| Server and proxy logs | at most 30 days | Requests include the IP address; it is the only place one is kept. Set by whoever hosts the server. |
| Database backups | at most 35 days | Deleted data leaves the backups when they expire; a backup is never restored without deleting again the accounts deleted since. |

**Hosts must configure the log and backup periods.** Nothing in this repository enforces them: the
server, proxy and database backups keep data as long as the host's own setup says. Whoever runs a
server must set log rotation to at most 30 days and backup expiry to at most 35 days, or change
the periods stated here and in the dashboard's privacy text (`dashboard/src/i18n/en.ts`) to the
real values. The `/privacy` page must never state a period the host does not apply.

The `/privacy` page is linked from the footer, the sign-in page and the Account page, and points
learners who would rather not send data to self-hosting ([using-lessonfolk](using-lessonfolk.md)).
There are no separate terms of service.

The contact shown on `/privacy` is the `LESSONFOLK_PRIVACY_CONTACT` environment variable, and the
"Where it is stored" section says the country or region of the server from `LESSONFOLK_DATA_LOCATION`
(for example `Canada`). Without it the page says the data is on the server of whoever runs this
LessonFolk. A host must set it to where the database and its backups really are, and change it if the
server moves.

If the data is stored outside the learner's country (for example learners in the EU, a server in
Canada), say so in `LESSONFOLK_DATA_LOCATION`: the page shows it as written.
