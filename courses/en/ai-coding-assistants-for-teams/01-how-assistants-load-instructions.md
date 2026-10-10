---
id: ai-coding-assistants-for-teams/01-how-assistants-load-instructions
title: How assistants load project instructions
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain what a project instructions file is and when the assistant reads it
  - Name AGENTS.md and the instructions file of the tool you use
  - Find which instruction files your assistant actually loads
prerequisites:
  - ai-coding-assistants/06-drive-or-delegate
---

## Key ideas
1. **A brief you write once.** An assistant does better work with the context a new teammate
   would need (covered in AI Coding Assistants in Practice). A **project instructions file** is
   that brief, saved in the repository: how to build and test, how the code is organised, the team's conventions.
   The tool adds it to the model's context automatically at the start of every session, so
   nobody has to repeat it, and everyone on the team gets the same brief.
2. **AGENTS.md is the shared convention.** `AGENTS.md` is a plain Markdown file at the root of
   a repository, an open convention that many coding assistants read. It has no required
   structure: it is a README written for agents. Because it does not belong to one tool, it is
   the natural place for rules the whole team shares, whatever assistant each person uses.
3. **Most tools also have their own file.** Many assistants read a file of their own as well
   as, or instead of, AGENTS.md: for example `CLAUDE.md` for Claude Code,
   `.github/copilot-instructions.md` for GitHub Copilot, rule files in `.cursor/rules/` for
   Cursor, `GEMINI.md` for Gemini CLI. They all do the same job: text that is always loaded
   into context for this project.
4. **Always loaded means always paying.** Everything in the file takes room in the context
   window on every request, and competes with the task for the model's attention. A long,
   vague file makes the assistant less precise, not more. The file guides the model; it does
   not force it, and the model can still miss or ignore a rule (lesson 5 covers enforcement).
5. **Check what your tool actually reads.** Tools differ in which file names they look for,
   where (repository root, sub-folders, your home folder) and in what order. Do not assume:
   read your tool's documentation, or ask the assistant which instructions it has loaded and
   test with a rule whose effect you can see.

## Teaching notes
- First, find out which tool the learner uses. If you are running inside a coding tool
  (Claude Code, Codex, Copilot, Cursor, Gemini CLI…), say which one you are and use it as the
  main example for the whole course; also ask which tool they use at work, if different.
  Teach with that tool's names, and only mention the others briefly through the table below.
- Live example: the learner is taking this course inside the LessonFolk repository. Open
  `AGENTS.md` at its root with them: it is the instructions file you are following right now
  (the tutor procedures, the repository map, the commit rules). Then show `CLAUDE.md`: its
  first line, `@AGENTS.md`, imports the shared file for Claude Code (lesson 3 explains imports).
- Analogy that works: **the welcome pack for a new contractor**, handed over on day one with
  the door codes, the house rules and who to ask. Everyone gets the same pack, and you update
  it when something changes, instead of explaining it again each morning.
- Misconception: "the assistant learns my project over time". It does not remember earlier
  sessions unless the tool saves notes; the instructions file is how knowledge persists.
- Misconception: "the more rules, the better". Each line costs context on every request;
  lesson 2 is about writing a short, useful file.
- Instruction files, as of late 2026 (these change often; check the tool's documentation
  before stating details, and say so to the learner):

  | Tool | Shared / own project file | Personal file |
  |---|---|---|
  | Claude Code | `CLAUDE.md` (can import `AGENTS.md`) | `~/.claude/CLAUDE.md` |
  | OpenAI Codex | `AGENTS.md` | `~/.codex/AGENTS.md` |
  | GitHub Copilot | `AGENTS.md`, `.github/copilot-instructions.md` | personal instructions in settings |
  | Cursor | `AGENTS.md`, `.cursor/rules/` | user rules in settings |
  | Gemini CLI | `GEMINI.md` (can be set to read `AGENTS.md`) | `~/.gemini/GEMINI.md` |

- For learners new to agent-style tools, spend time on idea 1 and the live example. For
  learners who already have an instructions file, go faster and ask them to bring theirs: you
  will improve it in lesson 2.

## Check your understanding
1. What is a project instructions file, and what problem does it solve for a team?
   Good answer: a file in the repository that the assistant loads into its context automatically every session (build and test commands, structure, conventions); it saves everyone from repeating the same brief and gives the whole team, and every session, the same context.
2. Why does it make sense to put shared rules in AGENTS.md rather than only in one tool's own file?
   Good answer: AGENTS.md is an open convention read by many tools, so the rules reach teammates whatever assistant they use, and there is one place to maintain.
3. A teammate pastes the whole team wiki into the instructions file "so the assistant knows everything". What is the problem?
   Good answer: the file is loaded on every request, so it fills the context window, dilutes the important rules and makes the model less precise; keep it short and point to documents the assistant can open when needed.

## Exercise
Needs a computer. In a project you work on (or in this repository), find every instructions
file your assistant reads: look for `AGENTS.md` and your tool's own file at the root, in
sub-folders and in your home folder. Then start a fresh session and ask the assistant what
project instructions it has. Compare its answer with what you found, and discuss any
surprise with the tutor.

## Completion criteria
The learner answers the checks correctly, can name AGENTS.md and their own tool's
instructions file, and explains why the file must stay short.

## Going further
- The AGENTS.md convention: agents.md
- Your assistant's documentation on project instructions or "memory" files.
