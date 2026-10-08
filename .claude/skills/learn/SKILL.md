---
name: learn
description: Start or resume a LessonFolk AI course — onboards new learners (level, interests, level check, personal path), finds the learner's next lesson and teaches it interactively. Use when the user says "start", "continue", "next lesson", "skip this", "reset <course>", "do <course> again", "recommend a path", "change my level", "update my interests", or wants to learn.
---

Run the LessonFolk MCP server's `learn` prompt: read `packages/mcp/prompts/learn.md` (the same
text) and follow it with the LessonFolk tools, together with the server's instructions.

The LessonFolk MCP server (`lessonfolk` in `.mcp.json`) keeps the courses and the learner's
progress. If its tools (`mcp__lessonfolk__*`) are not available, do not teach from the files:
follow "When the user wants to learn" in `AGENTS.md`.

If the `mcp__course-companion__key_idea` tool is available (the Course companion pane), call it
while you teach: as you start each key idea (`status: "active"`) and once the learner has it
(`status: "done"`), with the lesson id and the key idea's number in `## Key ideas` (from 1).
After asking a question with a fixed set of answers (onboarding questions, accepting the path,
"continue now or stop here?"), call `mcp__course-companion__choices` with those answers so the
learner can reply with a button (`multiSelect` when they may pick several, as for themes). Never
for "Check your understanding", review or level check questions.
