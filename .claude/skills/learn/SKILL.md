---
name: learn
description: Start or resume an Apprentice AI course — onboards new learners (level, interests, level check, personal path), finds the learner's next lesson and teaches it interactively. Use when the user says "start", "continue", "next lesson", "recommend a path", "change my level", "update my interests", or wants to learn.
---

Read `.progress/progress.json` first, then follow `AGENTS.md`:
- "start", "continue", "next lesson": the "Start or resume" procedure (it runs "Onboarding"
  if the file is missing), then teach the lesson following "Teach a lesson".
- "recommend a path" / "recommend a path again": the "Recommend a path" procedure.
- "change my level" / "update my interests": the "Update my profile" procedure.

If the `mcp__course-companion__key_idea` tool is available (the Course companion pane), call it
while you teach: as you start each key idea (`status: "active"`) and once the learner has it
(`status: "done"`), with the lesson id and the key idea's number in `## Key ideas` (from 1).
After asking a question with a fixed set of answers (onboarding questions, accepting the path,
"continue now or stop here?"), call `mcp__course-companion__choices` with those answers so the
learner can reply with a button (`multiSelect` when they may pick several, as for themes). Never
for "Check your understanding", review or level check questions.
