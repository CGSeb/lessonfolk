---
id: ai-coding-assistants/02-splitting-the-work
title: Splitting the work into good tasks
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain why small, well-specified tasks work better than large vague ones
  - Split a feature into tasks an assistant can complete reliably
  - Write clear "done" criteria for a coding task
prerequisites:
  - ai-coding-assistants/01-what-your-assistant-sees
---

## Key ideas
1. **Big vague requests produce big vague code.** "Build the checkout page" leaves the
   assistant to guess hundreds of decisions: data shape, validation, error states, styling,
   edge cases. Each guess can be wrong, and a large change is slow to review. Errors also
   compound: a wrong early choice spreads through everything built on it.
2. **A good task is small, specific and checkable.** It touches a few files, has one clear
   goal, and you can tell quickly whether it worked. "Add a `validateCart` function in
   `cart.ts` that rejects quantities below 1, with unit tests" is a good task; "improve the
   cart" is not.
3. **Plan first, then build in steps.** For anything larger than a small change, ask the
   assistant for a plan before any code: the steps, the files each step touches, the open
   questions. Correct the plan (it is cheap to fix), then run one step at a time and check
   each before the next.
4. **Say what "done" means.** Give acceptance criteria the assistant and you can both check:
   the behaviour expected, the cases to handle, the tests that must pass, what must not
   change. Without them, the assistant decides on its own when to stop, often too early or
   with extra changes you did not ask for.
5. **Keep decisions with you.** Split so that the important choices (data model, API shape,
   which library to add, security rules) are made by you, ideally before the task starts.
   Hand the assistant the work that follows from those decisions, not the decisions
   themselves.

## Teaching notes
- Analogy that works: **writing tickets for a fast but brand-new teammate**. You would not
  give them "build the checkout" on day one; you would give them well-scoped tickets with
  clear acceptance criteria, and review each one.
- Misconception: "agent-style tools can take whole features now, so splitting is
  unnecessary". They can attempt large tasks, but the bigger the change, the harder it is to
  review and the more guesses pile up. Splitting is about your ability to check, not only
  the tool's ability to do.
- Misconception: "planning with the assistant wastes time". Fixing a wrong plan takes a
  minute; fixing a wrong implementation across ten files takes much longer.
- Link to lesson 1: each task brief still needs the context (files, constraints, an example).
- For web developers, use familiar splits: data model → API route → validation → UI
  component → states (loading, empty, error) → tests.
- If the learner is experienced, let them split a real feature from their own work and
  critique the split together instead of using a generic example.

## Check your understanding
1. Why does "build the user settings page" tend to give worse results than a series of smaller tasks?
   Good answer: the assistant must guess many decisions, wrong guesses compound, and the large result is hard to review; small tasks can each be specified and checked.
2. What makes a coding task "good" for an assistant?
   Good answer: small scope (a few files), one clear goal, the needed context, and clear done criteria such as expected behaviour and tests that must pass.
3. Before letting the assistant implement a medium-sized feature, what should you ask it for, and why?
   Good answer: a plan (steps, files, open questions), because correcting a plan is cheap and lets you keep the important decisions before any code is written.

## Exercise
Needs nothing but a text editor (an assistant is optional). Pick a feature from your work or
a familiar one, such as "users can reset their password". Split it into 4–8 tasks. For each,
write one sentence of goal and one line of done criteria, and mark the decisions you would
make yourself before starting. Review the split with the tutor; optionally ask an assistant
for its own plan and compare.

## Completion criteria
The learner answers the checks correctly and can split a feature into small tasks with clear
done criteria, keeping the key decisions for themselves.

## Going further
- Writing good tickets and acceptance criteria, a skill that transfers directly to briefing
  AI assistants.
- Next lesson: reviewing the code the assistant writes.
