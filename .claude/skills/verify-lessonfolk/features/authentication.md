# Sign-in modes

LessonFolk runs either with no sign-in (one local learner, only on this computer) or with OAuth sign-in (GitHub, Google, and an email-and-password demo account when one is configured). The verification run uses the no-sign-in mode, so it proves that mode and that the sign-in pages are absent.

## Sub-features

- `auth-none-user` identifies the one local learner without any sign-in.
- `auth-none-no-pages` has no sign-in: `/sign-in`, provider sign-in, sign-out and the AI app approval page send the visitor back, and the demo sign-in and the sign-in API answer 404.
- `auth-none-header` shows the `Account` link and no `Sign in` or `Sign out`, with a footer saying progress stays on this computer.
- `auth-me` answers who the current user is, never cached.
- `auth-oauth-signin` signs in and out with a provider or the demo account, and approves an AI app (not drivable here).

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
- **No sign-in page.** Run `verify http GET /sign-in --header "Accept: text/html" --feature authentication --path sign-in.json`. Status `303` with `location` `/`: there is nothing to sign in to, the visitor is sent home. With a safe return address it goes there: `verify http GET "/sign-in?next=/courses" --feature authentication --path sign-in-next.json` gives `location` `/courses`; `next=//evil.example` gives `/`.
- **No provider or demo sign-in.** Run `verify http POST /sign-in/github --form "next=/" --feature authentication --path sign-in-github.json`: `303` to `/`, no cookie. Run `verify http POST /sign-in/demo --form "email=a@b.c&password=x" --feature authentication --path sign-in-demo.json`: `404`.
- **No app approval.** Run `verify http GET /oauth/consent --feature authentication --path oauth-consent.json`: `303` to `/`. Run `verify http GET /api/auth/get-session --feature authentication --path api-auth.json`: `404` with `Sign-in is off (LESSONFOLK_AUTH=none).`
- **Header and footer.** Run `verify browser goto --url / --feature authentication`, `verify browser expect-visible --role link --name "Account" --exact --feature authentication`, `verify browser expect-text --text "Your progress is saved only on this computer." --feature authentication` and `verify browser expect-no-text --text "Sign out" --feature authentication`.
- **Sign-out does nothing.** Run `verify http POST /sign-out --form "x=1" --feature authentication --path sign-out.json`. Status `303` to `/` and `setCookie` is empty.
- **Proof and stored data.** `verify db "select id, name from \"user\"" --feature authentication` shows the single row of the local learner (`id` `local`).

## Gotchas

- `/sign-in` redirects home (303) only in no-sign-in mode; in OAuth mode it is a page. Do not assert it there. (An earlier version of this sheet said 404; the first live drive showed 303.)
- Cross-site POST refusal (403 on a foreign `Origin`) is covered by the automated tests; to drive it, use `verify http POST /sign-out --header "Origin: http://evil.example" --form "x=1"`.
- Real provider sign-in is never driven by this skill (no credentials, no external accounts). The demo account needs `LESSONFOLK_DEMO_EMAIL` and `LESSONFOLK_DEMO_PASSWORD`, and the fake provider only runs under `NODE_ENV=test`: neither is in the production build `launch` makes.
- Sign-in POSTs (`/sign-in/*`) are limited to 10 a minute per address: repeated drives get `429`.
- `/sign-out` has no GET: drive it with POST.
