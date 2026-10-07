# Sign-in for developers (GitHub and Google)

LessonFolk has two sign-in modes, chosen with `LESSONFOLK_AUTH`:

| Mode | Who it is for | What happens |
|---|---|---|
| `none` (default) | Learners on their own computer, self-hosters who learn alone | No sign-in. One local learner (user id `local`). The server **refuses to start** unless only `127.0.0.1` can reach it. |
| `oauth` | The hosted version, and developers testing sign-in | A sign-in page lists GitHub and/or Google: only the providers whose credentials are set. The server **refuses to start** with no provider. |

Sign-in uses [Better Auth](https://www.better-auth.com) (self-hosted, free). Users,
sessions and linked accounts are stored in Postgres (`user`, `session`, `account`,
`verification` tables in `packages/db/src/schema.ts`), so `oauth` always needs the database.

This page shows how to try real GitHub and Google sign-in on your machine with free
development OAuth apps. You need a GitHub account and/or a Google account. Nothing here costs money.

## 1. Prepare your settings

Copy `.env.example` to `.env` at the repository root (if you have not already), then set the
following (every setting is listed in [Environment variables](../CONTRIBUTING.md#environment-variables)):

```bash
LESSONFOLK_AUTH=oauth
LESSONFOLK_BASE_URL=http://localhost:4321
BETTER_AUTH_SECRET=   # paste the output of: openssl rand -base64 32
```

- `LESSONFOLK_BASE_URL` is the address you open in your browser. It must be exactly the same
  address everywhere: in `.env`, in your OAuth apps and in the browser (`localhost` and
  `127.0.0.1` are different sites for cookies and for the providers). These steps use
  `http://localhost:4321`. If you changed `LESSONFOLK_PORT`, use that port.
- `BETTER_AUTH_SECRET` signs the session cookies. Use a long random value, keep it out of git
  (`.env` is ignored), and keep it stable: changing it signs everybody out.
- No `openssl`? Any random string of 32 characters or more works, for example from a password manager.

The callback URL of each provider is `<LESSONFOLK_BASE_URL>/api/auth/callback/<provider>`:

| Provider | Callback URL for local development |
|---|---|
| GitHub | `http://localhost:4321/api/auth/callback/github` |
| Google | `http://localhost:4321/api/auth/callback/google` |

## 2. Create a GitHub OAuth app

1. Sign in to GitHub, open your account **Settings**, then **Developer settings** (at the
   bottom of the sidebar), then **OAuth Apps**, and create a new OAuth app.
   (Direct link: https://github.com/settings/developers.)
2. Fill in the form:
   - Application name: anything, e.g. `LessonFolk (local dev)`
   - Homepage URL: `http://localhost:4321`
   - Authorization callback URL: `http://localhost:4321/api/auth/callback/github`
3. Register the application. On the app page, copy the **Client ID** and generate a **client
   secret** (GitHub shows the secret only once: copy it right away).
4. Add both to `.env`:

   ```bash
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

A GitHub OAuth app has a single callback URL. Create a separate app for each address you use
(local development, a staging server, production) rather than editing one back and forth.

If your GitHub email is private, sign-in still works: LessonFolk asks for the `user:email`
permission to read your verified email address.

## 3. Create a Google OAuth client

Google's console changes its menus from time to time; look for the same ideas if a label
differs from what is written here.

1. Open the [Google Cloud console](https://console.cloud.google.com/) and create a project
   (or pick one you use for testing).
2. Set up the OAuth consent screen (the branding and audience shown when people sign in;
   newer consoles group this under "Google Auth Platform"). Choose an **external** audience,
   give the app a name and your email address. While the app is in **testing**, only the
   test users you list can sign in: add your own Google account as a test user. You do not
   need to publish or verify the app for local development.
3. Create credentials of type **OAuth client ID**, application type **Web application**:
   - Authorized JavaScript origins: `http://localhost:4321`
   - Authorized redirect URIs: `http://localhost:4321/api/auth/callback/google`
4. Copy the client ID and client secret into `.env`:

   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

Google accepts `http://localhost` redirect URIs for development; any other address must use `https://`.

You can set up GitHub, Google or both. The sign-in page only shows the providers whose
**two** values (client ID and secret) are set; setting only one of the two stops the server
with an error that names the missing one.

## 4. Run LessonFolk and sign in

**With Docker** (Postgres and the app, the setup we test):

```bash
docker compose up --build
```

Open http://localhost:4321, choose **Sign in**, then a provider. After approving on GitHub or
Google you are back on LessonFolk, and the header shows "Signed in as …" with a **Sign out** button.

**Without Docker for the app** (Postgres still needed):

```bash
docker compose up -d db
npm run dashboard        # reads .env; open http://localhost:4321
```

`npm run dashboard` listens on `127.0.0.1:4321`, which `http://localhost:4321` reaches.

### What to check

- The sign-in page lists exactly the providers you configured.
- Signing in with each provider brings you back signed in; signing out signs you out.
- Signing in again with the same account finds the same user (no duplicate in the `user` table).

To look at the rows: `docker compose exec db psql -U lessonfolk -d lessonfolk -c 'select id, name, email from "user"'`.

## 5. Back to no sign-in

Set `LESSONFOLK_AUTH=none` (or remove it). Users created with `oauth` stay in the database;
`none` always uses the local learner (`local`).

## Errors at startup

The server checks its settings before it starts and stops with a message saying what to fix:

| Message starts with | Fix |
|---|---|
| `LESSONFOLK_AUTH=none has no sign-in, so it only runs on 127.0.0.1` | Without sign-in, anyone who can reach the server sees the learner's data. Keep `HOST` (and, with Docker, `LESSONFOLK_BIND`) at `127.0.0.1`, or switch to `oauth`. |
| `LESSONFOLK_AUTH=oauth needs at least one sign-in provider` | Set `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` and/or `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. |
| `… is missing: set both …` | Only half of a provider's credentials is set. |
| `LESSONFOLK_AUTH=oauth needs LESSONFOLK_BASE_URL` | Set it to the address you open in the browser, e.g. `http://localhost:4321`. Anything but localhost must use `https://`. |
| `LESSONFOLK_AUTH=oauth needs BETTER_AUTH_SECRET` | Set a random value of 32 characters or more. |

### How the 127.0.0.1 check works with Docker

Inside the container the server must listen on `0.0.0.0`, otherwise the published port
would not reach it. What matters is where Docker publishes the port on your machine:
`docker-compose.yml` publishes it on `LESSONFOLK_BIND` (default `127.0.0.1`) and passes the
same value to the app, which checks it instead of its own listening address. Without Docker,
the check uses `HOST` (default `127.0.0.1`). In `astro dev`, it checks the address the dev
server really listens on (so `astro dev --host` is refused in `none` mode).

## For the automated tests

The tests never call GitHub or Google. `dashboard/tests/e2e/fake-oauth.ts` is a small OAuth
2.0 provider on `127.0.0.1`; the dashboard enables it as the "Test provider" only when
`LESSONFOLK_TEST_OAUTH_URL` is set **and** `NODE_ENV=test` (the server refuses to start if it
is set otherwise). It goes through the same sign-in, callback and session code as the real
providers. Real GitHub and Google sign-in is a manual check: see the checklist in
[`docs/testing.md`](testing.md#manual-check-sign-in-with-github-and-google).
