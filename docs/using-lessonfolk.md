# Using LessonFolk

This guide is for learners. It takes you from nothing to your first lesson, then shows the
dashboard, the things you can say to your tutor, and how to run LessonFolk yourself.

Your **tutor** is the AI chat you already use (Claude Code, Codex, Claude Desktop, Cursor…),
connected to LessonFolk with [MCP](https://modelcontextprotocol.io) (Model Context Protocol, a
standard way for AI apps to use tools). Through it, your chat reads the courses and the tutor's
instructions, and saves your progress in LessonFolk. The LessonFolk website (the **dashboard**)
shows your courses and progress.

- [Two ways to use LessonFolk](#two-ways-to-use-lessonfolk)
- [Self-hosted: run it on your computer](#self-hosted-run-it-on-your-computer)
- [Connect your AI chat](#connect-your-ai-chat)
- [Your first session](#your-first-session)
- [What you can say](#what-you-can-say)
- [The Course companion (Claude Code)](#the-course-companion-claude-code)
- [The dashboard](#the-dashboard)
- [Your progress and your privacy](#your-progress-and-your-privacy)
- [Troubleshooting](#troubleshooting)

## Two ways to use LessonFolk

| | Hosted (coming soon) | Self-hosted |
|---|---|---|
| What you do | Sign in on the hosted LessonFolk with GitHub or Google | Run LessonFolk on your computer with Docker |
| Your progress | Saved on the hosted server, with your account | Saved in a database on your computer; nothing is sent to us |
| AI chats | Any app that supports MCP, including web chats (claude.ai, ChatGPT) | Apps that run on your computer (Claude Code, Codex, Claude Desktop, Cursor) |

With the hosted version, sign in, open the **Connect** page and follow the steps for your app,
then go to [Your first session](#your-first-session).

## Self-hosted: run it on your computer

You need [Git](https://git-scm.com) (or download the project as a ZIP from GitHub) and
[Docker](https://docs.docker.com/get-docker/). Docker runs the dashboard, the MCP server and
their database (Postgres) in containers. Make sure Docker is running, then, in a terminal (on
Windows: PowerShell or Terminal):

```bash
git clone https://github.com/CGSeb/lessonfolk.git
cd lessonfolk
docker compose up -d --build
```

- Open http://127.0.0.1:4321: the dashboard. The MCP server is
  `http://localhost:4321/mcp`. Both only listen on your own computer.
- `-d` runs it in the background. Leave it out to see the logs; then `Ctrl+C` stops it.
- Your progress is kept in a Docker volume called `db-data`, so it survives restarts.

**Settings.** To change the defaults, copy `.env.example` to `.env` and edit it. For example,
set `LESSONFOLK_PORT` if port 4321 is taken, or `LESSONFOLK_DB_PORT` for 5432. Every setting is
described in [Environment variables](../CONTRIBUTING.md#environment-variables).

**Sign-in.** `LESSONFOLK_AUTH` chooses the sign-in mode:

- `none` (the default): no sign-in, one learner. The app refuses to start if anything other than
  your own computer could reach it.
- `oauth`: sign in with GitHub and/or Google, for several learners. This needs your own OAuth
  apps; follow [Sign-in for developers](auth-dev.md).

**Update** to the latest courses and app. `docker compose up -d` uses the image published on
every release (`ghcr.io/cgseb/lessonfolk`), so no build is needed:

```bash
git pull
docker compose pull
docker compose up -d
```

(`docker compose up -d --build` builds the app from your copy of the project instead.)

**Stop** it with `docker compose stop` (or `Ctrl+C`). `docker compose down` removes the
containers but keeps your progress; `docker compose down -v` also deletes the database volume.

Without Docker, with [Node.js](https://nodejs.org) 22 or later and your own Postgres, see the
[development setup](../CONTRIBUTING.md#development-setup): `npm run dashboard` runs the same app.

## Connect your AI chat

The dashboard's **Connect** page (`/connect`) shows your exact address, then one tab per app
(Claude Code, Codex, Cursor, Claude Desktop, claude.ai, ChatGPT) with the short steps for the one
you pick. A tab can be linked to, e.g. `/connect#codex`. Web chats (claude.ai, ChatGPT)
connect from their company's servers, so they cannot reach LessonFolk on your computer: when
self-hosting without sign-in, use an app that runs on your computer.

**Claude Code in the LessonFolk folder.** Run `claude` in the folder you cloned: its `.mcp.json`
already lists the `lessonfolk` server at `http://localhost:4321/mcp`. Approve it when Claude
Code asks (`/mcp` shows it connected). That's all.

**Codex**, once:

```bash
codex mcp add lessonfolk --url http://localhost:4321/mcp
```

**From any folder** (Claude Code):

```bash
claude mcp add --transport http lessonfolk http://localhost:4321/mcp
```

- **`LESSONFOLK_AUTH=none`**: it only works from your own computer. If you set
  `LESSONFOLK_MCP_TOKEN` in `.env`, add
  `--header "Authorization: Bearer <your token>"` to the command (the Connect page shows it).
- **`LESSONFOLK_AUTH=oauth`** (and the hosted version): in Claude Code, run `/mcp`, pick
  `lessonfolk` and authenticate. Your browser opens: sign in, then **Allow** the app to use
  LessonFolk. Every learner signs in as themselves and only ever sees their own progress.

## Your first session

In your connected chat, say:

> Let's start learning AI.

(In Claude Code you can also type `/learn`, or the server's prompt `/mcp__lessonfolk__learn`.)
What happens next:

1. **Onboarding.** The tutor asks a few questions, one at a time: what to call you, your
   experience with AI, why you want to learn, the themes you would like to explore, and the
   language for your sessions. It saves your answers in LessonFolk.
2. **Level check (optional).** If you already know some AI (you said "some technical",
   "developer" or "ML practitioner"), the tutor offers a short level check: at most 6
   questions, no teaching. Courses you clearly know are marked as skipped, so you don't redo
   them. You can decline it or stop at any time.
3. **Your path.** The tutor recommends a path: the courses to take, in order, and why. You can
   remove, add or reorder courses (a course always stays after the courses it builds on).
   Nothing is saved until you agree.
4. **Your first lesson.** The tutor teaches it in small chunks and asks you questions along the
   way. Answer in your own words; there is no penalty for being wrong.

Stop whenever you like. Next time, open your chat and say *"continue"*: the tutor picks up where
you left off, from any folder or app connected to the same LessonFolk.

## What you can say

Talk naturally. These are the phrases the tutor recognises:

| Say | What happens |
|---|---|
| *"let's start"*, *"start the next course"* | Starts or resumes your next lesson (runs onboarding first if you are new). |
| *"continue"*, *"next"* | Resumes the current lesson, or starts the next one. |
| *"show my progress"*, *"where am I?"* | A short summary per course: lessons finished, current lesson, topics you found hard. |
| *"what can I learn?"*, *"list courses"* | Every course, grouped by theme, with your status. |
| *"what can I learn about <theme>?"* | The courses of one theme, and where to start. |
| *"quiz me"*, *"review"* | A few questions on lessons you found harder. |
| *"skip this"*, *"I already know this"* | One or two questions; if you answer well, the lesson is skipped. |
| *"reset <course>"*, *"do <course> again"* | Shows what will be reset, asks you to confirm, then removes the progress and scores of that course so you can take it again from its first lesson. Other courses are not changed. |
| *"recommend a path"*, *"recommend a path again"* | A new personal path. |
| *"change my level"* | Asks your experience again, then offers a new path. |
| *"update my interests"* | Asks which themes interest you, then offers a new path. |

The server also offers three **prompts** (shortcuts your app may list): `learn`, `review` and
`progress`. In Claude Code they are `/mcp__lessonfolk__learn` and so on; opened in the LessonFolk
folder, Claude Code also has the shorter skills `/learn`, `/progress` and `/review`.

The full rules the tutor follows are in
[`packages/mcp/prompts/`](../packages/mcp/prompts).

## The Course companion (Claude Code)

In Claude Code (also in Claude Desktop), an optional **mod** (a small add-on that loads with the project) helps you
follow along. It starts on its own once you begin learning:

- **A side pane** shows your course, its lessons (done, current, to do) and the key ideas of the
  current lesson, ticked off as the tutor covers them, then the next lesson.
- **Buttons above the prompt** send the usual commands: **Continue**, **Quiz me**, **Skip** and
  **My progress**. When the tutor asks a question with fixed answers (during onboarding, for
  example), the buttons show those answers instead.
- **Companion** reopens the pane (so does `/course-companion`). **Dashboard** opens the
  [dashboard](#the-dashboard) of your LessonFolk instance: the address of the `lessonfolk` server
  in the project's `.mcp.json`, or `http://localhost:4321/` when it names none.

The companion reads your progress and the courses from the LessonFolk MCP server, the same one
the tutor uses, so it works the same with a local or a hosted instance and refreshes each time the
tutor calls the server. It needs that server connected (`/mcp` lists it); otherwise the pane says
your progress could not be read. If your Claude Code does not show the pane, nothing is lost:
everything works in the chat. The mod lives in `.claude/skills/course-companion/`. Codex has no
companion.

The pane's own calls (`get_progress` and `list_courses`) need a permission like any tool call.
The project's `.claude/settings.json` allows them. If the pane still says your progress could
not be read although `/mcp` shows `lessonfolk` as connected (typically in auto permission mode, or
if you replaced the project settings), allow them yourself:

```json
{
  "permissions": {
    "allow": ["mcp__lessonfolk__get_progress", "mcp__lessonfolk__list_courses"]
  }
}
```

Put it in `.claude/settings.json` (shared) or `.claude/settings.local.json` (only you).

## The dashboard

The dashboard shows your courses and progress. Only the tutor writes your progress, except on
the **Account** page (import, export, erase).

| Page | Address | What you see |
|---|---|---|
| **Home** | `/` | Before you start: how to start. Afterwards: a greeting with your level and interests, your overall progress, the next lesson with the phrase to say to your tutor (its objectives open on a click), and your path: the current course and the next ones, with why the tutor chose it on demand. |
| **Courses** | `/courses` | The catalog: every course grouped by theme, with its level, length and your status. Filter by theme or search by title or topic. Courses in your path are marked "Recommended for you". |
| **A course** | `/courses/<course-id>` | The course's lessons with your status, scores, finish dates and the tutor's notes, what the course builds on, and the next lesson. |
| **Authors** | `/authors` | The people and projects who write the courses, and the courses of each author. |
| **Connect** | `/connect` | The setup steps for each AI app, with this LessonFolk's address in them (see [Connect your AI chat](#connect-your-ai-chat)). |
| **Account** | `/account` | Download, import or erase your progress (see [Account](#account-import-export-erase)). |

Pages update by themselves within a few seconds when your tutor saves progress (no reload
needed; the page keeps your scroll position and open sections). Lessons you skipped after the level check show as "Skipped after level check".

With sign-in (`LESSONFOLK_AUTH=oauth`), the courses and authors pages are open to everyone,
without progress. Home needs you to sign in, and each person sees only their own progress.

### Account (import, export, erase)

The **Account** page (`/account`) has one **Your progress** block (download or import a `progress.json`), a small link to download
all your data, and, last and set apart, **Delete**. It holds your progress, as a `progress.json` file (the format is
[`progress.example.json`](progress.example.json)):

- **Download** it, as a backup or to move to another LessonFolk, or **download all your data**: one
  JSON file with every record LessonFolk holds about you (profile, sign-in methods, sessions, the AI
  apps you allowed, progress and its history), never passwords or tokens.
- **Import** a `progress.json`. LessonFolk checks the file and shows what changes before you
  confirm; an invalid file is refused with the list of problems. Importing replaces the progress
  saved here.
- **Erase** it. Without sign-in this erases the local learner's progress and its history from the
  database (there is no account to delete). With sign-in it deletes your account and all its data,
  signs you out and stops your AI apps from connecting. With sign-in, downloading all your data and
  deleting ask you to sign in again first if you signed in more than 10 minutes ago. What is stored,
  and for how long, is on the **Privacy notice** page and in [Privacy and personal data](privacy.md).

**Coming from an older LessonFolk?** Older versions of the tutor saved your progress in
`.progress/progress.json`, in the LessonFolk folder. The tutor no longer reads that file: import
it once. Without sign-in, home and the **Account** page offer to import it on your first visit
(not in Docker: the container cannot see the file, so upload it on the **Account** page). From
a terminal, `npm run progress:import [-- path/to/progress.json]` does the same for the local
learner, without the preview.

## Your progress and your privacy

- **Self-hosted**: your progress is saved in the database on your computer. Without sign-in,
  LessonFolk only listens on your own computer (`127.0.0.1`) and sends nothing anywhere.
- **Hosted**: your progress is saved on the hosted server, with your account. Each learner only
  ever sees their own progress, and you can download or delete it at any time on the **Your
  data** page.
- Your conversations go to your AI app's provider (Anthropic for Claude Code, OpenAI for Codex…),
  as with any use of that app. The tutor sends LessonFolk only what it saves: your profile, path,
  lesson statuses, scores and its short notes.
- To start over, erase your progress on the **Account** page. Download it first if you want to
  keep it.

## Troubleshooting

**The tutor does not act like a tutor, or says LessonFolk is not connected.** LessonFolk must be
running and connected to your chat. Check that http://127.0.0.1:4321 opens (self-hosted: start it
with `docker compose up -d`), then check the connection: in Claude Code, `/mcp` should show
`lessonfolk` connected (approve it, or reconnect). Start a new chat and say *"let's start"*
again.

**"Port 4321 is already in use".** Another program, maybe another dashboard, uses the port. Stop
it, or set `LESSONFOLK_PORT=4322` in `.env` (and `LESSONFOLK_DB_PORT` if 5432 is taken), then use
the new port in your MCP address too (Claude Code in the LessonFolk folder: in `.mcp.json`).

**"Cannot connect to the Docker daemon" or "docker: command not found".** Start Docker Desktop
(or the Docker service) and wait until it is ready, then run the command again. Install Docker
first if you don't have it.

**The dashboard shows no progress.**

- Is it the same LessonFolk your chat is connected to? Compare the address on the **Connect**
  page with your app's MCP settings.
- With sign-in: did you sign in with the same account in the browser and in your chat?
- Did onboarding finish? Say *"let's start"* to your tutor.
- "Your progress could not be loaded": the database stopped. Start it again
  (`docker compose up -d`) and reload the page.

Still stuck? Open an issue on [GitHub](https://github.com/CGSeb/lessonfolk/issues).
