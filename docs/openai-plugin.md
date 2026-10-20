# OpenAI plugin directory

How to list LessonFolk in OpenAI's plugin directory, shared by ChatGPT and Codex. It is a separate
submission from the Claude directory: neither approval carries over. OpenAI's own guide is
[Submit your Claude Code plugin to OpenAI](https://developers.openai.com/plugins/guides/submit-claude-plugin);
check it again before submitting, the portal changes.

LessonFolk submits a **plugin with a remote MCP server**: the hosted server (`https://lessonfolk.com/mcp`)
and the three skills (`learn`, `progress`, `review`). The Course companion is a Claude Code mod
(hooks), which OpenAI removes from public submissions, so it is not part of the upload.

## What the repository already does

| OpenAI asks for | Where it is |
|---|---|
| Public HTTPS endpoint, Streamable HTTP | `/mcp` of the hosted server |
| OAuth 2.1 with PKCE | `packages/mcp/src/oauth.ts` (Better Auth), tested end to end in `dashboard/tests/e2e/mcp-oauth.db.test.ts` |
| A UserInfo endpoint that returns `email` and `email_verified: true`, and the `openid` and `email` scopes | advertised in `/.well-known/openid-configuration`; the same test calls it |
| Safety annotations on every tool | `packages/mcp/src/server.ts` (all four hints on each tool; `reset_course` and `import_progress` are destructive and ask the learner to confirm) |
| Domain verification at `/.well-known/openai-apps-challenge` | `OPENAI_APPS_CHALLENGE` ([Settings](configuration.md)) |
| Skills in provider-neutral words, no hooks, no `.mcp.json` | `npm run plugin:openai` |

## Before submitting

1. **Account.** An OpenAI organization where you have the *Apps Management* write permission, and
   the individual or business identity verification. Use a project with global data residency (EU
   residency cannot submit MCP plugins, per OpenAI's review page).
2. **Build the upload.** `npm run plugin:openai` writes `dist/openai-plugin/lessonfolk-tutor.zip`
   (and the same files in a folder): the manifest, its icon and the three skills, with the
   Claude Code only parts left out. Test the skills in a clean environment before uploading.
3. **Test account.** Reviewers need to sign in: prepare a GitHub or Google account for them, and give
   its details in the review form (never in the repository).
4. **Privacy.** The [privacy page](privacy.md) and `/privacy` must be up to date; the portal links it.

## In the portal

1. [platform.openai.com/plugins](https://platform.openai.com/plugins): **Create plugin**, then
   **With MCP**, and enter `https://lessonfolk.com/mcp`.
2. **Domain verification.** The portal shows a token. Set it as `OPENAI_APPS_CHALLENGE` in the
   server's `.env` (`deploy/.env.example`), redeploy, and check
   `https://lessonfolk.com/.well-known/openai-apps-challenge` shows it as plain text. Then verify.
3. Choose OAuth as the authentication, add the skills from the zip, complete the listing, fix every
   scan result and submit. The submitter confirms the attestations and sends: it is not done by a script.

After approval, publishing is a separate step. The remote server must stay compatible: a change to a
tool's name or shape needs a new submission.
