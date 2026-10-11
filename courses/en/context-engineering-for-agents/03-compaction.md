---
id: context-engineering-for-agents/03-compaction
title: "Compaction: summarising without losing the thread"
level: advanced
estimatedMinutes: 20
objectives:
  - Choose between clearing old results, compacting and starting fresh
  - Say what a compaction summary must keep
  - Recognise the ways a summary goes wrong
prerequisites:
  - context-engineering-for-agents/02-budgeting-the-context-window
---

## Key ideas
1. **Compaction replaces the history with a summary.** Build with AI covers the simple form:
   summarise older messages of a chat. In an agent, the model (or a separate call) writes a
   summary of the work so far, and the loop goes on with the instructions, that summary and
   perhaps the last few messages. It is lossy on purpose. The whole skill is choosing what
   to lose.
2. **Try the lighter step first: clear old tool results.** Replace results the agent has
   already used with a one-line note ("content of `models.py` removed; read it again if
   needed"). The reasoning and the decisions stay, the bulk goes, and almost nothing is lost
   when the content can be fetched again. It also removes stale copies, one of the problems
   of a long context.
3. **A good summary keeps what cannot be found again.** The goal and the constraints, as
   close to the original words as possible. The decisions and their reasons. What is done
   and what remains. What was tried and failed, so it is not tried again. Where things are:
   paths, names, ids, the commands that work. And the next step. It drops raw output, and the
   detours, keeping only their conclusion.
4. **Compact at a boundary, with room to spare.** The right moment is when a sub-task is
   finished and its state is clear (tests pass, a decision is made), not in the middle of a
   delicate change. Do it well before the window is full: writing the summary needs room,
   and a crowded context is summarised as badly as it is used. Many tools compact on their
   own near the limit; choosing the moment yourself usually gives a better summary.
5. **Summaries fail in recognisable ways.** A detail that mattered is gone (the exact error
   message, a file name). A constraint is softened ("must not change the API" becomes "be
   careful with the API"). A state is invented or rounded up ("tests pass" when two fail).
   The reason for a decision is lost, so the agent reopens it. And each new compaction
   summarises the previous summary, so errors accumulate. Protect yourself: keep the original
   task word for word outside the summary, and treat the summary as a claim to check against
   the files and the tests.
6. **Sometimes a fresh start beats a summary.** When the session went in a wrong direction,
   or is tangled in failed attempts, a summary carries the confusion along. Start a new
   session with a brief you control: the goal, what is known for sure, what to avoid. You
   lose the history, which is the point.

## Teaching notes
- Analogy that works: **the minutes of a long meeting**. Nobody rereads the recording. Good
  minutes give the decisions, who does what, and the open points; bad minutes say "we had a
  productive discussion about the budget". And minutes written from earlier minutes, without
  the meeting, drift a little each time.
- The three options form a ladder, from least to most loss: clear old results, compact, start
  fresh. Ask the learner to place a situation on the ladder before explaining idea 6.
- For learners who build agents: compaction is a function in their loop (when to trigger,
  which prompt writes the summary, what is kept verbatim). The summary prompt deserves the
  same care as a system prompt: list the headings of idea 3 in it.
- For learners who drive an assistant: most agent-style assistants offer a way to compact
  and a way to start a new session; send them to their tool's documentation without naming
  a command. What they control is the moment, and often a sentence saying what the summary
  must keep.
- Misconception: "compaction is a technical detail, the result is the same conversation,
  shorter". It is a rewrite by the model, with everything that implies: it can omit, soften
  or invent.
- Misconception: "compact as late as possible to keep the most detail". Late compaction is
  done by a model already struggling with a crowded context, and may not have room to finish.
- Misconception: "after compaction the agent still knows what it read". Only what the summary
  says. If the content of a file matters again, it must be read again; that is fine and cheap.
- Do not promise that a summary can be made safe. The honest position: lossy, useful, and
  to be checked against the real state of the work. Lesson 4 gives the stronger answer
  (state kept outside the window).
- Pacing: idea 3 and idea 5 are two sides of the same list. Teach idea 3, then ask the learner
  to guess how each item can go wrong before giving idea 5.

## Check your understanding
1. What is the difference between clearing old tool results and compacting, and why try clearing first?
   Good answer: clearing replaces used results by short notes and keeps the reasoning and decisions; compacting rewrites the whole history as a summary. Clearing loses almost nothing when content can be fetched again, so it is the cheaper, safer step.
2. List four things a compaction summary must keep.
   Good answer: any four of the goal and constraints in their original words, decisions and reasons, done and remaining work, failed attempts, where things are (paths, names, commands), and the next step.
3. When is a good moment to compact, and when is a bad one?
   Good answer: good at a boundary where a sub-task is finished and the state is clear, with room left in the window; bad in the middle of a delicate change or when the window is nearly full, because the summary is then poor or cannot be completed.
4. Give one way a summary can mislead the agent, and one protection against it.
   Good answer: a lost detail, a softened constraint, an invented or rounded-up state, a lost reason or drift over repeated compactions; protections include keeping the original task verbatim outside the summary and checking claims against files and tests (or starting fresh when the session is tangled).

## Completion criteria
The learner answers the checks correctly, and can name at least two things a careless summary
loses (such as a constraint or decision, or the real test status) and list what a good
summary keeps.

## Going further
- Topics: summarisation prompts, checkpoints and resuming long tasks.
- Next lesson: memory outside the window, for what must survive any summary.
