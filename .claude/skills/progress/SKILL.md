---
name: progress
description: Show the learner's LessonFolk progress across courses, or list the courses and themes. Use when the user asks where they are, how far they've got, or what they can learn.
---

Run the LessonFolk MCP server's `progress` prompt: read `packages/mcp/prompts/progress.md` (the
same text) and follow it with the LessonFolk tools.

The LessonFolk MCP server (`lessonfolk` in `.mcp.json`) keeps the courses and the learner's
progress. If its tools (`mcp__lessonfolk__*`) are not available, do not teach from the files:
follow "When the user wants to learn" in `AGENTS.md`.
