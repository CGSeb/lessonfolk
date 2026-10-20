# LessonFolk tutor (Claude Code plugin)

Learn AI from zero to advanced with an AI tutor, inside Claude Code. The plugin connects Claude
Code to the hosted [LessonFolk](https://lessonfolk.com) server, where the open-source courses and
your progress live.

## What it adds

- **Three skills**: `learn` (onboarding, level check, personal learning path, lessons taught as a
  conversation), `progress` (where you are, what you can learn) and `review` (a quiz on lessons
  you finished). Each skill follows the procedure served by the LessonFolk server and keeps no
  progress of its own.
- **The Course companion**: a side pane that shows your course, its lessons and the key ideas of
  the current lesson. Open it with `/course-companion`.
- **The LessonFolk MCP server** (`.mcp.json`): `https://lessonfolk.com/mcp`, a remote server you
  sign in to with GitHub or Google (OAuth). Run `/mcp`, pick LessonFolk and sign in once.

## What it does with your data

- The only network destination is `https://lessonfolk.com`. Your profile (name, experience,
  goal, language, level, interests), learning path, lesson status, scores and notes are stored on
  that server, under your own account. The privacy policy is at https://lessonfolk.com/privacy.
- The companion reads the `.mcp.json` of the folder you are working in, only to find which
  LessonFolk server to link to from its Dashboard button.
- The Dashboard link shown under the prompt points to the LessonFolk site; the plugin opens nothing by itself. Nothing else leaves your computer.
- No secrets are stored in the plugin, and it runs no downloaded code.

## What the Course companion does

The Course companion is a small mod (`hooks/register.tsx`, readable source, no bundled or
downloaded code). It runs no shell command and starts no process. Here is everything it does:

- **Calls to the LessonFolk server.** To fill the pane it calls three read-only tools of the
  LessonFolk MCP server, `get_progress`, `list_courses` and `get_lesson`, with the session's own
  connection and sign-in. It does this when a session starts, when you open the pane, after the
  `learn`, `review` or `progress` skill runs, and after the tutor itself calls a LessonFolk tool.
  Nothing is sent to any other server.
- **Local file read.** It reads the `.mcp.json` of the folder you are working in, only to find
  which LessonFolk server (local or hosted) the Dashboard link should open. The content of that
  file is not sent anywhere.
- **What it sees of the conversation.** Like any mod, it is notified of every tool call, but it
  acts only on the calls of the `learn`, `review` and `progress` skills, of the LessonFolk tools
  and of its own two tools, and ignores the others. It does not read or send the text of your
  messages or of Claude's replies.
- **Its own tools.** It adds two tools for the tutor, `key_idea` (marks a key idea of the current
  lesson in the pane) and `choices` (shows the answers to a question as buttons above the
  prompt). The mod answers these calls itself and they only update the pane and the buttons.
  It also adds the `/course-companion` command and, when the `learn` skill starts, a short note
  to Claude explaining these two tools.
- **Prompts it submits.** When you press a button, it submits the text of that button as your
  message, such as an answer the tutor offered or one of the commands shown under the prompt
  (`continue`, `quiz me`, `skip this`, `show my progress`). It adds nothing else to the prompt.
- **Clipboard.** On the pane's "copy" button only, it copies a `permissions.allow` snippet for
  the LessonFolk tools. It never writes your settings itself.

## Install

```bash
claude plugin marketplace add CGSeb/lessonfolk
claude plugin install lessonfolk-tutor@lessonfolk
```

Then say "start" in Claude Code. More in the [LessonFolk guide](https://github.com/CGSeb/lessonfolk/blob/main/docs/using-lessonfolk.md).

## License

Code under the [MIT license](https://github.com/CGSeb/lessonfolk/blob/main/LICENSE); course content
under [CC BY 4.0](https://github.com/CGSeb/lessonfolk/blob/main/courses/LICENSE).
