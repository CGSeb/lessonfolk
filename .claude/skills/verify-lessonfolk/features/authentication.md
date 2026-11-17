# Sign-in modes

LessonFolk runs either with no sign-in (one local learner, only on this computer) or with OAuth sign-in (GitHub, Google, a demo account). The verification run uses the no-sign-in mode, so it proves that mode and that the sign-in pages are absent.

## Sub-features

- `auth-none-user` identifies the one local learner without any sign-in.
- `auth-none-no-pages` has no sign-in page: `/sign-in` and `/sign-out` send the visitor home.
- `auth-me` answers who the current user is, never cached.
- `auth-oauth-signin` signs in and out with a provider (not drivable here).

## How to get to it (user POV)

- Nothing to click in no-sign-in mode: the learner is already "in".
- In OAuth mode, the sign-in call to action and the `/sign-in` page.

## Driving it with verify

Preconditions:

- Baseline state, `LESSONFOLK_AUTH=none`.
- OAuth sign-in needs provider credentials or the test-only fake provider: neither is part of the baseline, so `auth-oauth-signin` is **unreachable** in this skill.

States to exercise:

- No-sign-in user, absent sign-in page, current-user endpoint. Signed-out and signed-in OAuth states are unreachable.

- **Current user.** Run `verify http GET /api/me --feature authentication --path me.json`. Status `200`, `headers.cache-control` is `no-store`, `bodyStart` shows `"authMode":"none"` and a user with id `local`.
- **No sign-in page.** Run `verify http GET /sign-in --header "Accept: text/html" --feature authentication --path sign-in.json`. Status `303` with `location` `/`: there is nothing to sign in to, the visitor is sent home.
- **Sign-out does nothing.** Run `verify http POST /sign-out --form "x=1" --feature authentication --path sign-out.json`. Status `303` to `/` and `setCookie` is empty.
- **Proof and stored data.** `verify db "select id, name from \"user\"" --feature authentication` shows the single row of the local learner (`id` `local`).

## Gotchas

- `/sign-in` redirects home (303) only in no-sign-in mode; in OAuth mode it is a page. Do not assert it there. (An earlier version of this sheet said 404; the first live drive showed 303.)
- Cross-site POST refusal (403 on a foreign `Origin`) is covered by the automated tests; to drive it, use `verify http POST /sign-out --header "Origin: http://evil.example" --form "x=1"`.
- Real provider sign-in is never driven by this skill (no credentials, no external accounts).
