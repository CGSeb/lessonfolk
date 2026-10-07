---
name: review
description: Quiz the learner on completed LessonFolk lessons, focusing on weak spots. Use when the user says "quiz me" or "review".
---

Run the LessonFolk MCP server's `review` prompt: read `packages/mcp/prompts/review.md` (the same
text) and follow it with the LessonFolk tools.

The LessonFolk MCP server (`lessonfolk` in `.mcp.json`) keeps the courses and the learner's
progress. If its tools (`mcp__lessonfolk__*`) are not available, do not teach from the files:
follow "When the user wants to learn" in `AGENTS.md`.
