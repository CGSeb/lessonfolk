# Settings (environment variables)

Every setting is an environment variable. `npm run dashboard`, `npm run dashboard:start`,
`npm run migrate -w @lessonfolk/db`, `npm test` and `docker compose` read them from a `.env`
file at the repository root if there is one (copy [`.env.example`](../.env.example); `.env` is
never committed). Variables already set in your shell win over `.env`.

With the defaults you need no `.env` file at all.

## Database and Docker Compose

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | `postgres://lessonfolk:lessonfolk@127.0.0.1:5432/lessonfolk` | The Postgres server for the tests, the migrations, sign-in and the dashboard's progress (in every mode; `LESSONFOLK_AUTH=none` applies pending migrations and creates the local learner on start). In Docker Compose, the app gets its own value pointing to the `db` service. |
| `DATABASE_MIGRATION_URL` | `DATABASE_URL` | The database owner, used only for migrations and for creating the runtime role. In Docker Compose and the hosted deployment the app runs as the least-privilege role `lessonfolk_app` (`DATABASE_URL`); the image's start command (`npm run migrate`) applies the migrations as the owner first. Leave it unset in development: one account does everything. |
| `LESSONFOLK_APP_DB_PASSWORD` | `lessonfolk-app` (Compose) | Password of the `lessonfolk_app` role. When set, `migrate` creates or updates the role (connect, read and write the tables and sequences of `public`, no schema changes, no `CREATEDB`/`CREATEROLE`) and re-grants it, so tables added by new migrations are covered. Letters and digits only (it goes in a URL). |
| `POSTGRES_PASSWORD` | `lessonfolk` | Docker Compose: the password of the `db` service. Change `DATABASE_URL` to match. |
| `LESSONFOLK_PORT` | `4321` | Docker Compose: the port of the app on your computer. |
| `LESSONFOLK_DB_PORT` | `5432` | Docker Compose: the port of Postgres on your computer. Change `DATABASE_URL` to match. |
| `LESSONFOLK_CLOUDBEAVER_PORT` | `8978` | Docker Compose, `tools` profile: the port of CloudBeaver on your computer. |
| `LESSONFOLK_IMAGE_TAG` | `latest` | Docker Compose: the tag of the published `ghcr.io/cgseb/lessonfolk` image the app runs (a release tag such as `v0.1.0`). Not used with `--build`. |
| `LESSONFOLK_BIND` | `127.0.0.1` | Docker Compose: the address the app port is published on. With `LESSONFOLK_AUTH=none`, the app refuses to start unless it is `127.0.0.1`. |
| `LESSONFOLK_MIGRATE_ATTEMPTS` | `30` | How many times `migrate` retries, one second apart, while Postgres starts up. |

## Sign-in

Details in [Sign-in for developers](auth-dev.md).

| Variable | Default | What it does |
|---|---|---|
| `LESSONFOLK_AUTH` | `none` | `none`: no sign-in, one local learner, only reachable from `127.0.0.1`. `oauth`: sign in with GitHub and/or Google. |
| `LESSONFOLK_BASE_URL` | (none) | `oauth` only, required: the address people open in their browser, e.g. `http://localhost:4321`. Anything but localhost must use `https://`. |
| `BETTER_AUTH_SECRET` | (none) | `oauth` only, required: a random secret of 32 characters or more that signs the session cookies. |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | (none) | `oauth`: your GitHub OAuth app. Set both or neither. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | (none) | `oauth`: your Google OAuth client. Set both or neither. |
| `LESSONFOLK_PRIVACY_CONTACT` | (none) | `oauth`: who learners write to about their data (an email address or a page), shown on the `/privacy` page. |
| `LESSONFOLK_DATA_LOCATION` | (none) | `oauth`: the country or region where the server and its backups are, shown on the `/privacy` page (e.g. `Canada`). |
| `LESSONFOLK_MCP_TOKEN` | (none) | `none` only: when set, the MCP server at `/mcp` requires `Authorization: Bearer <token>`. Without it, `/mcp` only answers this computer. (`oauth` uses OAuth access tokens instead.) |

## Dashboard server and folders

| Variable | Default | What it does |
|---|---|---|
| `HOST` | `127.0.0.1` | The address `npm run dashboard:start` listens on. With `LESSONFOLK_AUTH=none`, anything else is refused. The Docker image sets `0.0.0.0` and relies on `LESSONFOLK_BIND`. |
| `PORT` | `4321` | The port `npm run dashboard:start` listens on. (For `npm run dashboard`, see the [learner guide](using-lessonfolk.md#troubleshooting).) |
| `LESSONFOLK_ROOT` | the nearest folder above the working directory that holds `AGENTS.md` | The repository root, where `courses/` (and an old `.progress/progress.json` to import) are found. The Docker image sets `/app`. |
| `LESSONFOLK_COURSES_DIR` | `<root>/courses` | Read the courses from another folder, e.g. a test fixture. |

## Set by the tooling

You don't set these yourself.

| Variable | Set by | What it does |
|---|---|---|
| `NODE_ENV` | The end-to-end tests (`test`), the Docker image (`production`) | The fake OAuth provider of the tests only works with `test`. |
| `LESSONFOLK_VERSION` | The published Docker image (the release's tag, e.g. `v0.2.0`) | Shown in the dashboard footer, with a link to the release on GitHub. Not set in a build of a checkout: the footer then shows no version. |
| `LESSONFOLK_TEST_OAUTH_URL` | The end-to-end tests | Turns on the fake OAuth provider. The server refuses to start if it is set outside the tests. |
| `INIT_CWD` | npm | Lets `npm run check:courses -- <folder>` resolve `<folder>` from where you ran the command. |
