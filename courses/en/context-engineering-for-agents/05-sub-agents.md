---
id: context-engineering-for-agents/05-sub-agents
title: "Sub-agents: delegating to a fresh context"
level: advanced
estimatedMinutes: 20
objectives:
  - Explain how a sub-agent keeps the main agent's context small
  - Write a brief a sub-agent can act on without the main agent's context
  - Decide what a sub-agent must return, and treat its report as a claim to check
prerequisites:
  - context-engineering-for-agents/04-memory-outside-the-window
---

## Key ideas
1. **A sub-agent is an agent loop called as a tool.** The main agent calls something like
   `run_subagent(brief)`. Your code starts a second loop with its own empty message list, its
   own tools and its own step limit. That loop works until it has an answer, and only that
   final answer comes back to the main agent, as an ordinary tool result.
2. **The benefit is isolation.** The sub-agent can read forty files and fill its own window;
   the main agent receives a paragraph. All the exploration stays out of the main context,
   which remains about the task and its decisions. This is a trade, not a saving: the total
   work done by models usually goes up. You pay more to keep one context clean.
3. **The brief is the sub-agent's whole world.** It starts knowing nothing the main agent
   knows: not the user's goal, not the constraints, not what was already ruled out. A brief
   that works gives the goal and why it matters, what "done" looks like, what is already
   known, the limits (read only? which files are off limits?) and what to send back. The
   main model writes this brief, so its own instructions must ask for these parts.
4. **Decide what comes back.** Ask for a short, structured report: the answer, the evidence
   (paths, lines, commands run), what was verified and what is only inferred, and what was
   not done. Anything bulky goes into a file, and the report gives its path. A report as long
   as the exploration brings back the problem the sub-agent was there to remove.
5. **A report is a claim, not a fact.** A sub-agent can stop early, misread, or say it
   succeeded when it did not (claiming success is covered in AI Agents and Tools). The main
   agent sees the report, not the trace behind it. Check in proportion to the stakes: open
   the file it cites, run the test it says passes. And keep the sub-agent's trace in your own
   logs, because you will need it to understand a wrong report.
6. **Give it less power than the main agent.** A sub-agent sent to investigate needs read
   tools, not write tools. Give each one the smallest set of tools for its job, its own step
   and cost limit, and no ability to start further sub-agents unless you designed for it.
   This limits both accidents and what an injected instruction could do.

## Teaching notes
- Analogy that works: **sending a research assistant to the archive**. They spend the day
  among the boxes; you get a one-page memo. Your desk stays clear. But the memo is only as
  good as your request ("find out about the 1987 contract" versus "find who signed the 1987
  contract with Dupont, and bring a copy of the signature page"), and you were not in the
  archive, so for anything important you ask to see the page.
- Start from the agent loop, restated in one sentence from AI Agents and Tools: the model
  asks for a tool, the code runs it and adds the result. A sub-agent is that, where the tool
  happens to be another loop. Nothing more mysterious.
- For learners who build agents: the pieces are a function that runs a loop and returns a
  string, a tool definition for it, and system prompt lines that teach the main model how to
  brief. Ask where the sub-agent's trace would be visible to them.
- For learners who drive an assistant: many agent-style assistants can start sub-agents, on
  their own or when asked; send learners to their tool's documentation. What they can do
  today: ask the assistant to delegate an investigation and report back briefly, and read the
  brief it writes when the tool shows it.
- Misconception: "the sub-agent knows what we have been doing". It knows the brief. The
  most common failure is a one-line brief written by a main agent that forgot the reader
  starts from zero, the same mistake as the hand-off note of lesson 4.
- Misconception: "sub-agents make the task cheaper". They make the main context smaller.
  The total usually costs more.
- Misconception: "the report is the result of the tools, so it is reliable". It is a model's
  summary of its own work, with the weaknesses of any summary (lesson 3).
- The brief and the report are both lossy hand-offs. Link them to lessons 3 and 4 in one
  sentence: the skill of writing for a reader with no context is the same.
- Keep the question "when should I use several agents at all?" for lesson 6. Here the learner
  should come out able to delegate one piece of work well.

## Check your understanding
1. In what sense does a sub-agent "save context", and what does it not save?
   Good answer: its exploration happens in its own window and only a short report enters the main context, which stays focused; it does not save total model work or cost, which usually go up.
2. What must a brief contain for a sub-agent to do useful work?
   Good answer: the goal and why it matters, what done looks like, what is already known or ruled out, constraints and limits, and what to return and in what form; because the sub-agent starts with none of the main agent's context.
3. What should a sub-agent's report contain, and why should it stay short?
   Good answer: the answer, the evidence (paths, lines, commands), what was verified versus inferred, and what was not done; short because a long report refills the main context, with bulky material written to a file and referenced.
4. A sub-agent reports "the cause is in `auth/refresh.py`, line 88; I confirmed it with the tests". What should the main agent, or you, do before acting on it?
   Good answer: treat it as a claim: read the cited lines, run or inspect the test it mentions, in proportion to the stakes; and have the sub-agent's trace available to check what it really did.

## Exercise
Needs nothing. Give the learner the situation and the brief, and ask what the sub-agent
cannot know, how they would rewrite the brief, and what the report should look like.

The situation in the main agent's context: since last Tuesday's release, users are logged out
after about ten minutes. The session store was checked and is healthy. The main agent
suspects the token refresh code in `auth/refresh.py`. The user said the public
authentication API must not change, and wants a diagnosis before any fix.

The brief the main agent wrote: "Look into the login problem and fix whatever you find."

A good discussion finds: the brief hides the symptom (logged out after ten minutes, since
Tuesday's release), what was ruled out (the session store), the suspect (`auth/refresh.py`),
the constraint (public API unchanged) and the user's wish (diagnosis only); worse, it asks
for a fix the user did not want. A better brief states all of these, asks for read-only
investigation, and asks for a report with the likely cause, the evidence (file and lines,
what changed in the release), how sure the sub-agent is, and what it did not check. The
sub-agent should get read tools only.

## Completion criteria
The learner answers the checks correctly, and in the exercise names at least four things
missing from the brief, removes the unwanted "fix", and specifies what the report must
contain.

## Going further
- Topics: orchestrator and worker designs, least privilege for agents, logging and tracing
  nested agents.
- Next lesson: one agent or several, to decide when delegation is worth it.
