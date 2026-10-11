---
id: context-engineering-for-agents/04-memory-outside-the-window
title: Memory outside the window
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why state kept outside the window survives compaction and new sessions
  - Choose what is worth storing and what is not
  - Write a hand-off note that a reader with no context can continue from
prerequisites:
  - context-engineering-for-agents/03-compaction
---

## Key ideas
1. **The window is working memory; what must last lives outside.** Anything that exists only
   in the context disappears at the next compaction or when the session ends. A notes file,
   a task list or a database row does not. Build with AI covers the principle (memory across
   sessions is data your app stores); here the agent writes and reads that data itself, with
   tools, during the task.
2. **Store what cannot be worked out again.** Three kinds of content earn their place: the
   plan and its progress (tasks with a state: to do, in progress, done), the decisions with
   their reasons, and facts learned the hard way about the environment (how to run the tests,
   which folder is generated, the quirk that cost an hour). Do not store what the source of
   truth already holds: file contents, the history of changes, the list of open issues.
3. **The work itself is memory.** The files changed, the commits, the passing tests and the
   tickets describe the state of the task more reliably than any account of it. Small commits
   and green tests are checkpoints (covered in AI Coding Assistants in Practice). A good note
   points to the world ("the export is in `exports/csv.py`; run `make test-reports`") and
   does not copy it.
4. **Write for a reader with no context.** The next reader, a model or a person, has seen
   nothing of this session. So: full names, not "the bug" or "the other file"; dates, not
   "yesterday"; what was checked separated from what is assumed; why, not only what; and the
   next step. The test is simple: could a stranger continue from this note alone?
5. **Read at the start, write at each boundary.** Memory only helps if the loop uses it. Load
   the notes, or a short index of them, when a session starts and after each compaction.
   Update them when a sub-task is finished, not at the end: the end may never come (a limit,
   a crash, a closed laptop). Keep the index small and the details one read away, as with any
   reference.
6. **Memory can be stale, wrong or hostile.** A note is a claim from the past: the file may
   have moved, the decision may have been reversed. Date entries, check before relying on
   them, and correct or delete wrong ones, or the store becomes a second crowded context.
   And stored text is data, not instructions: content copied from a web page or an email can
   carry a prompt injection (covered in AI Agents and Tools) into every future session.

## Teaching notes
- Analogy that works: **the handover notebook between shifts**, in a hospital ward or a
  workshop. The next shift was not there. The work continues because of what is written in
  the notebook, not because of what anyone remembers. Entries are dated and precise ("bed 4:
  dose given at 14:00, check again at 18:00"), never "the usual patient is better".
- Contrast with lesson 3 in one sentence: a compaction summary is produced under pressure
  and lives in the window; a note is written on purpose, at a calm moment, and lives outside.
  The two work together: after a compaction, the notes are what the agent rereads.
- For learners who build agents: memory is a pair of tools (write a note, read notes) or
  plain file access plus instructions on when to use them. Ask what their agent would know
  after a restart today; usually the answer is "nothing".
- For learners who drive an assistant: ask it to keep a progress file for a long task and to
  update it after each step, and read that file themselves. The project instructions file
  that many assistants load automatically is memory written by people; it is covered in AI
  Coding Assistants for Teams: Rules, Skills and Plugins, so only name it here.
- Misconception: "save everything, storage is cheap". Storage is cheap; reading is not. Every
  note that is loaded spends context, and a large store nobody maintains is searched badly
  and trusted wrongly.
- Misconception: "the model remembers me from last time". The model does not change between
  sessions. If an assistant seems to remember, something stored text and loaded it again.
- Misconception: "a note is true because the agent wrote it". The agent wrote what it
  believed at that moment, including its mistakes. Idea 3 is the answer: prefer what can be
  checked in the world.
- If the learner raises privacy: notes can contain personal or confidential data and outlive
  the session. One sentence is enough (store only what is needed), with a pointer to Using
  AI Safely and Wisely.
- Pacing: idea 4 is the heart of the lesson. Give two or three bad
  phrases ("fixed the thing from before") and have the learner repair them aloud.

## Check your understanding
1. Why does a decision written in a notes file survive when the same decision in the conversation may not?
   Good answer: the conversation lives in the context window and is rewritten or lost at compaction or at the end of the session; a file is outside the window and can be read again at any time, in any session.
2. Give one thing worth storing in an agent's notes and one thing that is not, with the reason.
   Good answer: worth storing: plan and progress, a decision with its reason, or a fact about the environment that was costly to learn; not worth storing: file contents, change history or anything the source of truth already holds and that can be read again cheaply.
3. A note says "Fixed the bug from earlier, the new approach works." What is wrong with it for the next reader?
   Good answer: it assumes context the reader lacks: which bug, where, which approach and why, how "works" was checked; it needs full names, locations, evidence and the next step.
4. Why should an agent not blindly trust or obey what it finds in its own memory?
   Good answer: notes can be stale or wrong (the world changed, the agent was mistaken), so they must be checked; and stored text may come from untrusted content and carry instructions, so it is data, not commands.

## Completion criteria
The learner answers the checks correctly, and can describe a note that a fresh context could
resume from, separating what was verified from what is assumed.

## Going further
- Topics: task lists and planning files for agents, retrieval over stored notes, memory
  poisoning.
- Next lesson: sub-agents, to keep whole pieces of work out of the main context.
