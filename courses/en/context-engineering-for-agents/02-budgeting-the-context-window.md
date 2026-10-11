---
id: context-engineering-for-agents/02-budgeting-the-context-window
title: Budgeting the context window
level: advanced
estimatedMinutes: 20
objectives:
  - List what shares an agent's context window
  - Find where the tokens go before cutting anything
  - Reduce waste with shaped tool results, references and lighter fixed costs
prerequisites:
  - context-engineering-for-agents/01-why-long-tasks-go-wrong
---

## Key ideas
1. **Five things share the window.** The instructions (system prompt and project rules), the
   tool definitions (name, description and arguments of every tool, sent at every step even
   when unused), the messages (what the user said, what the model answered and planned), the
   tool results, and the room left for the next reply. A budget starts with knowing these
   five lines.
2. **Measure before you cut.** Count the tokens of each share at a few points of a real task:
   the usage numbers returned with each model call, or a count per message type in your own
   log, are enough. In most long tasks tool results are by far the largest share. Cut the
   largest share first, not the one you happen to look at most (usually the system prompt).
3. **Shape tool results at the source.** A tool result is text your code chose to return, so
   return what the next step needs: the matching lines with a little around them, not the
   file; the failing tests, not the whole log; a count and the first rows, not the full table.
   When you cut, say so in the result ("showing 20 of 2,340 rows; filter to narrow down"), so
   the model knows there is more and how to get it. Silent truncation makes it reason from a
   partial view without knowing.
4. **Keep references, load content when it is needed.** A file path, an id or a table of
   contents costs a few tokens; the content costs thousands. Give the agent the references and
   a tool to fetch the detail at the step that needs it, rather than loading everything "to be
   safe" at the start. The trade-off: more steps, and the agent can miss what it never opens
   (the same risk as retrieval, covered in AI Agents and Tools). References need good names
   to be worth opening.
5. **Fixed costs are paid at every step.** Whatever sits at the top of the context is resent
   and re-read on every turn: a long system prompt, dozens of tools with long descriptions,
   documents loaded "just in case". Keep there only what every step needs. Move guidance for
   rare situations into something the agent can load on demand, and remove tools the task
   does not need: many similar tools also make the model choose worse.

## Teaching notes
- Analogy that works: **a workbench and labelled drawers**. On the bench: the piece you are
  working on and the two tools in use. Everything else is in drawers with clear labels, one
  reach away. A bench covered with every tool you own is slower to work on, even though
  nothing is missing. The labels matter: an unlabelled drawer is never opened.
- For learners who build agents: every idea is a change in their code (tool functions, the
  system prompt, the tool list). Ask what their tools return today and which result is the
  largest.
- For learners who drive an assistant: they cannot rewrite its tools, but they control a lot.
  Ask for narrow reads ("only the `refund` function"), prefer commands with short output
  (a quiet test run, a filtered log), disconnect tools and extensions the task does not need,
  and keep project instruction files short. Many assistants can show how the context is
  currently filled: send the learner to their tool's documentation and do not name a command.
- Misconception: "cutting tool output loses information, so it is risky". The risk is silent
  cutting. A result that says what was cut and how to get the rest loses nothing: the detail
  stays one tool call away.
- Misconception: "load everything at the start so the agent has the full picture". The full
  picture is exactly the crowded desk of lesson 1. A map of what exists beats the content of
  everything.
- Misconception: "the system prompt is small, it does not matter". Multiply it by the number
  of steps, and remember it competes for attention with the task at every one of them.
- Idea 2 is the one learners skip. Insist on it: without a measurement, people trim the
  instructions they wrote by hand and leave the tool that returns whole files.
- Do not give token counts, prices or window sizes. If the learner wants numbers, have them
  reason in shares ("about two thirds of the window is test output").
- Clearing results that are already in the history is the next lesson (compaction); here the
  point is what enters the window in the first place.

## Check your understanding
1. Name the things that share an agent's context window. Which is usually the largest in a long task?
   Good answer: instructions, tool definitions, messages (user and model), tool results, and room for the reply; tool results usually dominate.
2. A search tool returns the full content of every matching file. How would you change what it returns, and what must the result say?
   Good answer: return the matching lines with some surrounding context, or paths with a count, limited to a reasonable number; state what was left out and how to get more (narrow the query, read a specific file), so the cut is not silent.
3. What do you gain and what do you risk by giving the agent a list of file paths and a read tool, compared with loading the files up front?
   Good answer: gain a much smaller context and content loaded only when relevant; risk extra steps and the agent never opening a file that mattered, especially if the names are unclear.
4. Why does one unused tool with a long description cost more than it seems?
   Good answer: tool definitions are a fixed cost sent and read at every step, so the cost is multiplied by the number of steps, and extra similar tools make tool choice less reliable.

## Completion criteria
The learner answers the checks correctly, and for a context that is too full starts from the
largest share and proposes at least three concrete changes, including one that turns content
into a reference or says what was cut.

## Going further
- Topics: tokenizers and token counting, prompt caching, tool design for agents.
- Next lesson: compaction, for what is already in the window.
