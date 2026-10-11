---
id: context-engineering-for-agents/01-why-long-tasks-go-wrong
title: Why long tasks go wrong
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why an agent's context grows during a long task and what that costs
  - Describe the ways a long context degrades an agent's behaviour
  - Spot the symptoms of a degraded context in a trace
prerequisites:
  - ai-agents-and-tools/06-guardrails-and-human-oversight
---

## Key ideas
1. **The context only grows.** An agent is a loop: the model asks for a tool, your code runs
   it, the result is added to the messages, and the whole list is sent again (covered in AI
   Agents and Tools). Nothing ever leaves on its own. After fifty steps the original task is
   a few lines at the top, and almost everything else is old tool results: files read, search
   results, command output, failed attempts.
2. **Fitting in the window is not the same as being used well.** The context window is the
   hard limit, but quality drops long before it is full. At every step the model has to find
   the few lines that matter among everything else, and each extra page is one more thing it
   can latch onto by mistake. Treat the model's attention as a budget that every token spends,
   not as free space up to the limit.
3. **A long context goes bad in four ways.** **Buried instructions**: a constraint given at
   the start ("do not change the public API") loses weight under thousands of later lines.
   **Stale information**: the agent read a file at step 5, changed it at step 20, and still
   reasons from the old copy. **Contradiction**: two versions of the same fact, or three failed
   attempts next to the one that worked, with nothing saying which is current.
   **Distraction**: results that were only useful for one step keep pulling the agent towards
   side issues, and its own earlier mistakes become examples it imitates.
4. **Cost and time grow faster than the task.** Every step resends everything before it, so a
   task twice as long costs much more than twice as much to process: each new step pays for
   all the earlier ones again. Many providers charge less for a repeated beginning (caching),
   which lowers the bill but does nothing for the attention problem.
5. **A degraded context shows in the trace.** The agent reads a file it has already read, runs
   again a command that already failed, breaks a rule from the first message, undoes a decision
   it made earlier, or says "done" while part of the task is forgotten. One such step is noise;
   several in a row, late in a long task, point to the context.
6. **Context engineering is deciding what the model sees at every step.** Prompting shapes the
   first message. Context engineering manages the whole window over the whole task: what goes
   in, what stays out, what is compressed, what is stored elsewhere and what is handed to
   another agent. A sterner prompt does not fix a crowded window; changing what is in it does.

## Teaching notes
- Learners come from two sides: people who build agents in code, and people who drive
  agent-style assistants for hours. Ask which one they are in the first minute and take every
  example from their side. The ideas are the same; only the vocabulary changes ("the messages
  list" for builders, "the session" for users).
- Analogy that works: **a desk during a long project**. Every document you open stays on the
  desk. After a day the brief is somewhere under the pile, two versions of the same draft lie
  side by side, and you pick up the old one. The desk is not too small; it is too full to
  work on. Tidying it is work you have to decide to do.
- Start from the learner's experience: ask whether an assistant or agent ever "got worse" late
  in a long session, and what it did. Most have a story; map it to the four ways of idea 3.
- Misconception: "a bigger context window solves this". A bigger window moves the hard limit,
  not the attention problem: a larger pile is still a pile. It also makes each step cost more.
- Misconception: "the model forgets the oldest things first, like a person". Nothing is
  forgotten: every line is still there and still competes for attention. Which positions get
  less attention varies between models, so do not teach a rule such as "the middle is lost".
- Misconception: "repeat the instruction in capitals". It may help for a few steps, then the
  repetition is buried too. It treats the symptom of idea 3, not the cause.
- Link idea 3 to "errors compound" from AI Agents and Tools in one sentence: a wrong result
  that stays in the context keeps misleading later steps. Do not re-teach failure modes.
- Idea 4: keep the reasoning qualitative. A small sketch is enough ("step 1 sends 1 page, step
  2 sends 2, step 3 sends 3…"). Do not quote prices, window sizes or a length at which quality
  drops: they differ between models and change quickly.
- Idea 6 is the map of the course: budgeting (lesson 2), compaction (lesson 3), memory outside
  the window (lesson 4), sub-agents (lessons 5 and 6). Name them in one sentence each and move
  on; do not start teaching them.
- Pacing: ideas 1 and 2 go fast for this audience. Spend the time on ideas 3 and 5, with the
  learner's own stories or short invented traces.

## Check your understanding
1. An agent has a very large context window and has used a quarter of it. Why can its work still be getting worse?
   Good answer: fitting is not the same as being used well; the model must find the relevant lines among everything else, so more content means more buried instructions, stale or contradicting results and distractions, well before the limit.
2. Name two ways a long context degrades an agent, with an example of each.
   Good answer: any two of buried instructions (an early constraint is ignored), stale information (reasoning from an old copy of a changed file), contradiction (several versions or failed attempts with no sign of which is current) and distraction (old results or past mistakes pull it off the task), each with a plausible example.
3. Why does a task with twice as many steps cost much more than twice as much?
   Good answer: every step resends the whole history, so each new step pays again for all the earlier ones; the total grows faster than the number of steps. Caching can lower the price but not the amount the model has to attend to.
4. Late in a long session the agent breaks a rule from your first message. Why is repeating the rule more forcefully a weak fix?
   Good answer: the rule was not misunderstood, it was buried; the repetition will be buried in turn. The real fix changes what is in the context (remove, compress or move content), which is what context engineering means.

## Completion criteria
The learner answers the checks correctly, and can name at least three symptoms of a long
task going wrong and tie each to a cause from idea 3 (or to the waste described in ideas 1
and 4).

## Going further
- Topics: how attention works in a transformer, prompt caching, long-context evaluation.
- Next lesson: budgeting the context window.
