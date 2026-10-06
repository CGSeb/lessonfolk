---
id: ai-coding-assistants-for-teams/02-writing-agents-md
title: Writing a good AGENTS.md
level: intermediate
estimatedMinutes: 20
objectives:
  - Structure an instructions file around commands, map, conventions, boundaries and done
  - Turn vague wishes into specific, checkable rules
  - Decide what to leave out of the file
prerequisites:
  - ai-coding-assistants-for-teams/01-how-assistants-load-instructions
---

## Key ideas
1. **Start with the commands.** The most useful lines are the exact commands to install,
   build, run, test and lint the project, including how to run a single test. With them, an
   agent-style assistant can check its own work instead of guessing.
2. **Give a short map and the conventions that are not obvious.** A few lines on how the code
   is organised (where the API lives, where tests go) and the conventions a newcomer would
   get wrong: the error-handling pattern, the naming rule, the library to use for dates, the
   commit message format. Point to an example file rather than describing it at length.
3. **State the boundaries.** What the assistant must never do or touch: generated files,
   database migrations already applied, public APIs that must not change, secrets, pushing to
   the main branch. Say what to do instead ("ask first", "create a new migration").
4. **Define done.** How to know a task is finished: tests pass, the linter is clean, docs
   updated, a summary of what changed. This turns "looks finished" into a check the assistant
   can run.
5. **Specific and checkable beats long and vague.** "Write clean code" changes nothing;
   "Use `Result` types for errors in `services/`, never throw, see `services/user.ts`" does.
   If you cannot tell whether a rule was followed, rewrite it. Leave out what the tools
   already enforce (formatting the linter fixes), what changes every week, and anything
   secret: the file is committed and read by every tool.

## Teaching notes
- Analogy that works: **a recipe card, not a cookbook**. It lists the steps and the traps
  ("do not open the oven before 20 minutes"), not the history of French cooking.
- Live example: walk through the Apprentice `AGENTS.md` with the learner. Point out its
  repository map, its procedures and its commit-message table. Then point out what could be
  better for a code project: it has almost no build or test commands (those live in
  `CLAUDE.md` here), which shows that one file can serve more than one audience.
- A compact skeleton to show (in your own words, adapt to their stack):
  `## Commands` · `## Project map` · `## Conventions` · `## Boundaries` · `## Definition of done`.
  There is no required structure; headings just make the file easy to scan for people and
  models.
- Misconception: "the assistant will follow every rule". Rules are guidance; important ones
  belong in tests, linters or hooks too (lesson 5). Put the most important rules first and
  keep them few.
- Misconception: "I should write it all before using the assistant". Start with commands and
  three or four conventions; add a rule each time the assistant makes the same mistake twice
  (lesson 6).
- Some tools can generate a first draft from the codebase (for example an `/init` command).
  A draft is a starting point: review it and cut what is generic.
- For learners from small or solo projects, keep it to commands, conventions and done. For
  learners in large teams, spend more time on boundaries and on pointing to existing docs
  instead of copying them.

## Check your understanding
1. Why are the exact build and test commands the most valuable lines in an instructions file?
   Good answer: they let the assistant run and check its own work (build, tests, linter) instead of guessing, which catches its mistakes early.
2. Rewrite the rule "Handle errors properly" so that an assistant can follow it and you can check it.
   Good answer: a specific rule naming the pattern, the place and an example, e.g. which error type or helper to use in which folder, what never to do, and a file to copy from.
3. Name two things that should not go in AGENTS.md, and why.
   Good answer: any two of secrets or credentials (the file is committed and sent to tools), rules the linter or formatter already enforces, long copied documentation (wastes context, point to it instead), facts that change constantly, vague wishes that cannot be checked.

## Exercise
Needs a computer. Write (or rewrite) the AGENTS.md of a project you work on, in 40 lines or
fewer, with the five sections of this lesson. Then give your assistant a small real task in a
fresh session and see whether it ran the right commands and followed your conventions.
Review the file with the tutor and cut any line that is vague or redundant.

## Completion criteria
The learner answers the checks correctly and has drafted, or can describe in detail, an
instructions file with commands, conventions, boundaries and a definition of done, written
as specific rules.

## Going further
- The AGENTS.md convention and its examples: agents.md
- Your assistant's documentation on writing good project instructions.
