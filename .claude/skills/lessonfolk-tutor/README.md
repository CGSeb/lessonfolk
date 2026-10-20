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

## Install

```bash
claude plugin marketplace add CGSeb/lessonfolk
claude plugin install lessonfolk-tutor@lessonfolk
```

Then say "start" in Claude Code. More in the [LessonFolk guide](https://github.com/CGSeb/lessonfolk/blob/main/docs/using-lessonfolk.md).

## License

Code under the [MIT license](https://github.com/CGSeb/lessonfolk/blob/main/LICENSE); course content
under [CC BY 4.0](https://github.com/CGSeb/lessonfolk/blob/main/courses/LICENSE).
