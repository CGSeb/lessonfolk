---
id: connecting-ai-with-mcp/04-choosing-servers-well
title: Choosing servers well
level: intermediate
estimatedMinutes: 15
objectives:
  - Decide when a connection is worth it and when something simpler will do
  - Explain why connecting many tools can make an assistant worse
  - Apply least privilege and basic quality checks when choosing a server
prerequisites:
  - connecting-ai-with-mcp/03-local-and-remote-servers
---

## Key ideas
1. **Start from the job, not from the catalogue.** Many servers exist, but the question is what
   you need. A one-off task: paste the text. A stable document: attach the file. Something you do
   often, with live data or real actions: a connection starts to pay off. A built-in integration of
   your tool may be simpler still.
2. **Fewer tools is usually better.** Every tool's name and description is sent to the model and takes
   room in the context window, and a long menu makes wrong choices more likely. Connect only what the
   task needs and switch the rest off. This is the budget thinking of *Context Engineering for
   Long-Running Agents*.
3. **Give the least access that works.** Prefer read-only tools before tools that change things, narrow
   permissions before broad ones, and a test workspace before real data. For any action that sends,
   deletes, pays or publishes, keep a human approval step.
4. **Judge the server, not just the idea.** Look at who runs or maintains it, whether it is documented
   and kept up to date, how clear its tool names and descriptions are, whether it offers a small
   sensible set of tools, and how it reports errors. An official server from the service itself is
   usually a safer starting point than an unknown third-party one.
5. **Check that it works the way you need.** Try a handful of realistic requests and look at which
   tool is chosen and whether the results are right, using the habits of *Evaluating AI Output*. Repeat
   after the server or the model changes.

## Teaching notes
- Analogy: a toolbox. A well-chosen small set of tools is faster to use than a garage full of every tool
  ever made, where you spend the time searching, and the wrong tool is easy to pick up.
- Scenario to reason through with the learner (nothing to install): a team lead has found fifteen servers
  that look useful and wants to connect them all. Ask what could go wrong, which two they would start
  with, and with what access.
- Second scenario: three ways to give an assistant the content of a 20-page policy that rarely changes.
  Ask which they would choose (paste, attach, connect) and why.
- Misconception: "more connections means a more capable assistant". Past a point they add noise, cost
  and risk.
- Misconception: "popular means safe". Popularity helps, but still read what it can do.
- Do not name servers, catalogues, vendors or counts of available servers.
- Beginners to the course: ideas 1 to 3 with the policy scenario. Experienced learners: discuss quality
  checks and how to measure tool-choice errors.
- Pacing: finish with the fifteen-servers scenario, it pulls the ideas together.

## Check your understanding
1. For each of these, say whether you would paste, attach or connect: a policy that rarely changes, a
   quick question about a paragraph, a ticket queue you check ten times a day.
   Good answer: attach the policy, paste the paragraph, connect the ticket queue because it is live,
   frequent and may involve actions.
2. Give two reasons why connecting fifteen servers at once could make an assistant worse.
   Good answer: the tool descriptions use up context and cost, the long menu makes wrong tool choices
   more likely, and each server adds access and risk.
3. You are choosing a server to read and update tasks. Name three things you would check or set up.
   Good answer: who maintains it and whether it is documented; clear tool descriptions; read-only or
   narrow permissions first with approval for changes; test with harmless data.

## Completion criteria
The learner can decide between pasting, attaching and connecting, explain the cost of too many tools,
and apply least privilege and quality checks to a choice (checks 1-3).

## Going further
- The "Budgeting the context window" lesson of *Context Engineering for Long-Running Agents* explains
  why every tool description has a cost.
- *Evaluating AI Output* shows how to test that a connection behaves as you expect.
