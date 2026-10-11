---
id: ai-agents-and-tools/06-guardrails-and-human-oversight
title: Guardrails and human oversight
level: intermediate
estimatedMinutes: 15
objectives:
  - Limit what an agent can do with least privilege and budgets
  - Require human approval before risky actions
  - Log and test an agent so you can trust it more over time
prerequisites:
  - ai-agents-and-tools/05-where-agents-fail
---

## Key ideas
1. **Least privilege: give only the tools it needs.** Every tool is a capability that can be
   misused by mistake or through prompt injection. Prefer read-only tools, narrow tools
   (`get_order_status(order_id)` rather than "run any database query") and the smallest
   permissions and data access that do the job.
2. **Enforce rules in code, not only in the prompt.** Validate every argument, check that the
   user is allowed to act on that data, and limit steps, time and spending. The system prompt
   guides the model; your code decides what is actually allowed.
3. **A human approves risky actions.** Anything irreversible or outward-facing (sending a
   message, paying, deleting, publishing) should pause and show a person exactly what will
   happen, and only run after they say yes. Reading can be automatic; acting on the world
   should be deliberate.
4. **Log everything.** Keep a record of each step: the request, tool calls, arguments, results
   and approvals. Logs let you debug failures, explain what happened and spot abuse. Store
   them with the same care as other user data.
5. **Test before you trust, then widen slowly.** Build a small set of test tasks, including
   tricky and malicious ones from lesson 5, and run them after every change. Start with tight
   limits and human approval everywhere, and relax them only where the agent has proven
   reliable.

## Teaching notes
- Close the course and the learning path: connect guardrails back to the safety course (human
  judgement, checking what matters) and to Build with AI (keys, limits, data notice). Agents
  are powerful when they are bounded.
- Analogy that works: **a new employee's access badge**. On day one they can enter the
  building but not the server room; payments need a manager's signature; everything is logged.
  Access grows as trust is earned.
- If you are an agent with tools in this chat, you can point to your own approval prompts as
  a real example of human oversight (only if that is true in the learner's tool).
- Misconception: "a strict system prompt is enough of a guardrail". Prompts can be bypassed;
  code-level limits and approvals cannot be talked around.
- Misconception: "asking for approval every time makes agents useless". Approve only the
  risky actions; let read-only steps run freely.
- Do not give legal or compliance advice; mention that some domains have rules about
  automated decisions and data, which differ by country.

## Check your understanding
1. You are building an agent that helps customers with orders. Which tools would you give it, and which would need human approval?
   Good answer: narrow, mostly read-only tools such as order status or stock lookups run freely; actions like refunds, cancellations or sending messages require explicit human approval; no broad tools like raw database access.
2. Why should limits and validation live in code rather than only in the system prompt?
   Good answer: the model can ignore or be manipulated out of prompt instructions (e.g. prompt injection), while code checks are enforced every time.
3. What should an agent's logs contain, and why keep them?
   Good answer: each step's request, tool calls, arguments, results and approvals; to debug failures, explain what happened and detect misuse, while storing them carefully as user data.

## Completion criteria
The learner answers the checks correctly and can describe an agent with at least one
approval-gated action, argument validation, a step limit and a log.

## Going further
- Topics: evaluating agents with test suites, sandboxing tools, permission systems.
- Ask the tutor to "quiz me" on the agents course, or revisit Using AI Safely and Wisely.
