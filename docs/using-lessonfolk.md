# Using LessonFolk

This guide is for learners. It takes you from nothing to your first lesson, then shows the
dashboard, the things you can say to your tutor, and how to run LessonFolk with Docker.

LessonFolk runs on your own computer. Your **tutor** is an AI coding agent (a chat program that
can read and write the files in a folder) such as Claude Code or Codex. It reads the courses in
this folder and teaches them to you in a conversation.

- [What you need](#what-you-need)
- [Get LessonFolk and start the tutor](#get-lessonfolk-and-start-the-tutor)
- [Your first session](#your-first-session)
- [What you can say](#what-you-can-say)
- [The Course companion (Claude Code)](#the-course-companion-claude-code)
- [The dashboard](#the-dashboard)
- [Your progress and your privacy](#your-progress-and-your-privacy)
- [Run it with Docker (self-hosting)](#run-it-with-docker-self-hosting)
- [Connect your AI chat with MCP](#connect-your-ai-chat-with-mcp)
- [Troubleshooting](#troubleshooting)

## What you need

| You need | For | Notes |
|---|---|---|
| [Git](https://git-scm.com) | Getting the project | Or download the project as a ZIP from GitHub. |
| An AI coding agent | The tutor | [Claude Code](https://claude.com/claude-code) or [Codex](https://openai.com/codex). Each needs an account with its provider. Any agent that reads `AGENTS.md` should work too. |
| [Node.js](https://nodejs.org) 22 or later | The dashboard only | Optional. You can learn without it. |
| [Docker](https://docs.docker.com/get-docker/) | The dashboard and self-hosting | Optional. Runs the database (Postgres) where the dashboard reads your progress. |

## Get LessonFolk and start the tutor

Open a terminal (on Windows: PowerShell or Terminal) and run:

```bash
git clone https://github.com/CGSeb/lessonfolk.git
cd lessonfolk
```

Then start your agent **in this folder**. The tutor only works when the agent is opened in the
LessonFolk folder, because that is where it finds its instructions and the courses.

- **Claude Code:** run `claude`. Claude Code reads the tutor instructions through `CLAUDE.md`.
- **Codex:** run `codex`. Codex reads `AGENTS.md` directly.

If your agent asks whether you trust this folder, say yes: the tutor needs to read the
courses and save your progress in it.

## Your first session

Say:

> Let's start learning AI.

What happens next:

1. **Onboarding.** The tutor asks a few questions, one at a time: what to call you, your
   experience with AI, why you want to learn, the themes you would like to explore, and the
   language for your sessions. It saves your answers in `.progress/progress.json`.
2. **Level check (optional).** If you already know some AI (you said "some technical",
   "developer" or "ML practitioner"), the tutor offers a short level check: at most 6
   questions, no teaching. Courses you clearly know are marked as skipped, so you don't redo
   them. You can decline it or stop at any time.
3. **Your path.** The tutor recommends a path: the courses to take, in order, and why. You can
   remove, add or reorder courses (a course always stays after the courses it builds on).
   Nothing is saved until you agree.
4. **Your first lesson.** The tutor teaches it in small chunks and asks you questions along the
   way. Answer in your own words; there is no penalty for being wrong.

Stop whenever you like. Next time, open the agent in the same folder and say *"continue"*: the
tutor picks up where you left off.

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
| *"recommend a path"*, *"recommend a path again"* | A new personal path. |
| *"change my level"* | Asks your experience again, then offers a new path. |
| *"update my interests"* | Asks which themes interest you, then offers a new path. |

In **Claude Code** you can also type these shortcuts (called skills):

| Skill | Same as |
|---|---|
| `/learn` | *"let's start"*, *"continue"*, *"recommend a path"*, *"change my level"* |
| `/progress` | *"show my progress"* |
| `/review` | *"quiz me"* |

The full rules the tutor follows are in [`AGENTS.md`](../AGENTS.md).

## The Course companion (Claude Code)

In Claude Code, an optional **mod** (a small add-on that loads with the project) helps you
follow along. It starts on its own once you begin learning:

- **A side pane** shows your course, its lessons (done, current, to do) and the key ideas of the
  current lesson, ticked off as the tutor covers them, then the next lesson.
- **Buttons above the prompt** send the usual commands: **Continue**, **Quiz me**, **Skip** and
  **My progress**. When the tutor asks a question with fixed answers (during onboarding, for
  example), the buttons show those answers instead.
- **Companion** reopens the pane (so does `/course-companion`). **Dashboard** starts the
  [dashboard](#the-dashboard) for you and then opens it; it needs `npm install` first.

If your Claude Code does not show the pane, nothing is lost: everything works in the chat.
The mod lives in `.claude/skills/course-companion/`. Codex has no companion.

## The dashboard

The dashboard is a small website that runs on your computer and shows your courses and
progress. It is optional. Only the tutor writes your progress, except on the **Your data** page
(import, export, erase).

The dashboard reads your progress from a database (Postgres), not from
`.progress/progress.json`. Until the tutor saves to the database itself, import your file on the
**Your data** page (see [Your data](#your-data-import-export-erase)).

### Start it

With Node.js 22 or later and Docker running, from the LessonFolk folder:

```bash
npm install              # the first time, and after updating LessonFolk
docker compose up -d db  # the database
npm run dashboard
```

Open http://127.0.0.1:4321 in your browser. Keep the terminal open; press `Ctrl+C` to stop the
dashboard. In Claude Code, the companion's **Dashboard** button does the same for you.

`npm run dashboard` starts the development server, which is fine for everyday use. To run the
built (faster) version instead:

```bash
npm run dashboard:build
npm run dashboard:start
```

### What each page shows

| Page | Address | What you see |
|---|---|---|
| **Home** | `/` | Before you start: how to start. Afterwards: a greeting, your level and interests, your path and why the tutor chose it, your progress, and the next lesson with the phrase to say to your tutor. |
| **Courses** | `/courses` | The catalog: every course grouped by theme, with its level, length and your status. Filter by theme or search by title or topic. Courses in your path are marked "Recommended for you". |
| **A course** | `/courses/<course-id>` | The course's lessons with your status, scores, finish dates and the tutor's notes, what the course builds on, and the next lesson. |
| **Authors** | `/authors` | The people and projects who write the courses, and the courses of each author. |
| **Connect** | `/connect` | Your LessonFolk address for AI chats and the setup steps for each app (see [Connect your AI chat with MCP](#connect-your-ai-chat-with-mcp)). |
| **Your data** | `/account` | Download, import or erase your progress (see [Your data](#your-data-import-export-erase)). |

Reload a page to see your latest progress (pages refresh by themselves only when course files
change). Lessons you skipped after the level check show as "Skipped after level check".

With sign-in (`LESSONFOLK_AUTH=oauth`), the courses and authors pages are open to everyone,
without progress. Home needs you to sign in, and each person sees only their own progress.

### Your data (import, export, erase)

The **Your data** page (`/account`) holds your progress, as a `progress.json` file:

- **Download** it, as a backup or to move to another LessonFolk.
- **Import** a `progress.json`. LessonFolk checks the file and shows what changes before you
  confirm; an invalid file is refused with the list of problems. Importing replaces the progress
  saved here. On your first visit without sign-in, home and this page offer to import
  `.progress/progress.json` for you. Import it again after a tutoring session to see your new
  progress (the file itself is never changed).
- **Erase** it. Without sign-in this erases the local learner's progress and its history from the
  database (there is no account to delete; `.progress/progress.json` is kept). With sign-in it
  deletes your account and all its data.

From a terminal, `npm run progress:import [-- path/to/progress.json]` does the same import for
the local learner, without the preview.

## Your progress and your privacy

- Your progress lives in one file: `.progress/progress.json`, in the LessonFolk folder. The
  tutor creates it during onboarding and saves it after every change.
- It stays on your computer. Git ignores the `.progress/` folder, so your progress is never
  committed or shared, even if you contribute to the project.
- The dashboard reads the copy you [import](#your-data-import-export-erase) into the database, which
  runs on your computer. Without sign-in, it only listens on your own computer (`127.0.0.1`).
- Your conversations go to your agent's provider (Anthropic for Claude Code, OpenAI for Codex),
  as with any use of that agent. Without sign-in (the default), LessonFolk itself sends
  nothing anywhere.
- To start over, delete `.progress/progress.json` and erase the database copy on the **Your data**
  page. Download or copy it first if you want to keep it.

## Run it with Docker (self-hosting)

Docker runs LessonFolk's dashboard and its database (Postgres) in containers, without
installing Node.js. Use this if you want to keep LessonFolk running as a service on your
computer. You still learn with your agent in the LessonFolk folder, exactly as above.

Make sure Docker is running, then, from the LessonFolk folder:

```bash
docker compose up --build
```

- Open http://127.0.0.1:4321. The database listens on `127.0.0.1:5432`. Both only listen on your
  own computer.
- Add `-d` (`docker compose up -d --build`) to run it in the background.
- The dashboard reads your progress from the database: upload `.progress/progress.json` on the
  **Your data** page (the container cannot see the file itself). The courses are copied into the app when it
  is built.
- The database keeps its data in a Docker volume called `db-data`, so it survives restarts.

**Settings.** To change the defaults, copy `.env.example` to `.env` and edit it. For example,
set `LESSONFOLK_PORT` if port 4321 is taken, or `LESSONFOLK_DB_PORT` for 5432. Every setting is
described in [Environment variables](../CONTRIBUTING.md#environment-variables).

**Sign-in.** `LESSONFOLK_AUTH` chooses the sign-in mode:

- `none` (the default): no sign-in, one learner. The app refuses to start if anything other than
  your own computer could reach it.
- `oauth`: sign in with GitHub and/or Google. This needs your own OAuth apps; follow
  [Sign-in for developers](auth-dev.md).

**Update** to the latest courses and app:

```bash
git pull
docker compose up -d --build
```

**Stop** it with `Ctrl+C` (or `docker compose stop` if it runs in the background). `docker
compose down` removes the containers but keeps the data; `docker compose down -v` also
deletes the database volume.

## Connect your AI chat with MCP

The dashboard's **Connect** page (`/connect`) shows your exact address and short steps for Claude
Code, Codex, Cursor, Claude Desktop, claude.ai and ChatGPT. Web chats (claude.ai, ChatGPT) connect
from their company's servers, so they cannot reach LessonFolk on your computer: without sign-in,
use an app that runs on your computer.

The running app (e.g. with Docker above) is also an [MCP](https://modelcontextprotocol.io)
server at `http://localhost:4321/mcp`. An AI chat connected to it gets the courses and reads
and saves your progress in the database through tools (`get_progress`, `get_next_lesson`,
`start_lesson`, `complete_lesson`…), from any folder. In Claude Code:

```bash
claude mcp add --transport http lessonfolk http://localhost:4321/mcp
```

- **`LESSONFOLK_AUTH=none`**: that's all; it only works from your own computer. If you set
  `LESSONFOLK_MCP_TOKEN` in `.env`, add
  `--header "Authorization: Bearer <your token>"` to the command.
- **`LESSONFOLK_AUTH=oauth`**: in Claude Code, run `/mcp`, pick `lessonfolk` and authenticate.
  Your browser opens: sign in, then **Allow** the app to use LessonFolk. Every learner signs in
  as themselves and only ever sees their own progress.

**Start learning** from any folder: say *Let's start learning AI*, or use the server's `learn`
prompt (in Claude Code: `/mcp__lessonfolk__learn`). The `review` prompt quizzes you and
`progress` shows where you are. The tutor works as in [Your first session](#your-first-session),
but saves to the database instead of `.progress/progress.json`.

## Troubleshooting

**"Port 4321 is already in use" (or the dashboard opens on another port).** Another program,
maybe another dashboard, uses the port. Stop it, or pick another port:

| How you run it | Change the port with |
|---|---|
| `npm run dashboard` | `npm run dev -w dashboard -- --port 4322` |
| `npm run dashboard:start` | the `PORT` variable: `PORT=4322 npm run dashboard:start` (PowerShell: `$env:PORT = "4322"; npm run dashboard:start`) |
| Docker | `LESSONFOLK_PORT=4322` in `.env` (and `LESSONFOLK_DB_PORT` if 5432 is taken) |

**`npm install` or the dashboard fails with a Node.js error.** Check your version with
`node --version`: you need 22 or later. Install a newer version from
[nodejs.org](https://nodejs.org), then run `npm install` again.

**"Cannot connect to the Docker daemon" or "docker: command not found".** Start Docker Desktop
(or the Docker service) and wait until it is ready, then run the command again. Install Docker
first if you don't have it.

**The dashboard stops with "the database … cannot be reached".** The dashboard keeps your
progress in Postgres. Start Docker, then the database with `docker compose up -d db`, and start
the dashboard again. With your own Postgres, set `DATABASE_URL` in `.env`.

**The dashboard shows no progress.**

- Did you import it? Import it on the **Your data** page (or run `npm run progress:import`), then
  reload the page.
- Did onboarding finish? Check that `.progress/progress.json` exists in the LessonFolk folder.
  If not, say *"let's start"* to your tutor.
- Was the agent opened in the LessonFolk folder? If you opened it elsewhere, the tutor saved
  nothing here. Close it and open it again in this folder.
- The import says the file is not valid: ask your tutor to check
  `.progress/progress.json`. Your progress is not lost.
- "Your progress could not be loaded": the database stopped. Start it again with
  `docker compose up -d db` and reload the page.

**The tutor does not act like a tutor.** Make sure the agent was started in the LessonFolk
folder (it should mention LessonFolk when you say *"let's start"*). Then say *"let's start"*
again.

Still stuck? Open an issue on [GitHub](https://github.com/CGSeb/lessonfolk/issues).
