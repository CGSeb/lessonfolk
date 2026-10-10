---
id: ai-coding-assistants/01-what-your-assistant-sees
title: What your coding assistant sees
level: intermediate
estimatedMinutes: 20
objectives:
  - Describe the main kinds of AI coding assistants
  - Explain what goes into the assistant's context and what never does
  - Give an assistant the context it needs for a coding task
prerequisites:
  - prompting-basics/05-what-prompting-cannot-fix
  - ai-safety/05-copyright-and-honest-use
---

## Key ideas
1. **Coding assistants come in a few shapes.** **Inline completion** suggests the next lines
   as you type. **Chat in the editor** answers questions and proposes edits to the code you
   point it at. **Agent-style assistants** can read files, search the project, run commands
   (tests, builds) and edit several files on their own, in a loop, until they think the task
   is done. All of them are built on a large language model, the kind of model behind chat
   assistants (covered in AI Foundations).
2. **The model only sees its context.** Everything it knows about your task comes from what
   the tool sends with your request: your message, the current file or selection, files the
   tool picked or that you attached, the output of commands it ran, and any project
   instructions. Anything else simply does not exist for it, however obvious it is to you.
3. **What it never sees, unless you say it.** Your intentions and the "why" behind the
   feature, decisions made in a meeting, how the app behaves in production, real user data,
   the bug report you read this morning, and the parts of the codebase the tool did not open.
   When an assistant "ignores" an obvious convention, it usually never saw it.
4. **Context has limits.** The model can only take in a limited amount of text at once (its
   **context window**), and very long contexts make it less precise. Agent-style tools choose
   which files to read; they can miss the one that matters. More context is not always
   better: the right files beat the whole repository.
5. **Give it what a new teammate would need.** The goal, the files involved, the constraints
   (framework and version, style, what must not change), an example of similar code in the
   project, and how to know the task is done. This is Prompting Basics applied to code.

## Teaching notes
- Analogy that works: **a skilled contractor dropped into your project for one task**. They
  code well, but they have not been to your meetings, do not know your users, and only
  read the files you hand them or think to open. A good brief makes all the difference.
- Misconception: "the assistant knows my whole project". Most tools see only part of it at a
  time; some index the project for search, but the model still works from the pieces that end
  up in its context for this request.
- Misconception: "it knows the latest version of my framework". It learned from code up to
  its training date and may default to older patterns unless the project files or your
  message show the version you use.
- Mention in one line that many tools read a project instructions file (team conventions,
  commands to run) automatically. Do not teach it here: the
  AI Coding Assistants for Teams: Rules, Skills and Plugins course covers it.
- Stay tool-agnostic: never rank tools or name "the best one". If the learner uses a specific
  tool, use it as the example, and let them check its documentation for what it includes in
  context.
- For learners who have only used inline completion, spend more time on idea 1 and what
  agent-style tools can do (and therefore get wrong). For learners already using agents, go
  faster on idea 1 and dig into idea 4 (how their tool picks files).
- The agent loop itself is taught in the AI Agents and Tools course; only name the idea here.

## Check your understanding
1. Your assistant writes a new API route that ignores the error-handling pattern used everywhere else in your project. What is the most likely reason?
   Good answer: the files showing that pattern were not in its context (it never saw them), so it fell back on generic code; the fix is to point it to an existing example or describe the pattern.
2. Name three things a coding assistant cannot know unless you tell it.
   Good answer: any three of the goal or reason for the change, team decisions, production behaviour or real data, the bug report, constraints such as what must not change, files it did not open, the framework version if not visible.
3. Why is "add the whole repository to the context" not always a good idea?
   Good answer: the context window is limited and long contexts make the model less precise; the right, relevant files work better than everything.
4. What can an agent-style assistant do that inline completion cannot?
   Good answer: read and search files, run commands such as tests, and edit several files in a loop until it thinks the task is done; inline completion only suggests the next lines as you type.

## Exercise
Needs a computer and any coding assistant (a free tier or this chat works). Take a small,
real task from one of your projects. Write the request twice: once in one line, once as a
brief for a new teammate (goal, files, constraints, an example, how to know it is done).
Compare the two results with the tutor and note what the assistant got wrong without context.

## Completion criteria
The learner can explain what goes into an assistant's context and what does not, answers the
checks correctly, and can list what a good brief for a coding task contains.

## Going further
- The AI Agents and Tools course, for how agent-style assistants run their loop of reading,
  acting and checking.
- AI Coding Assistants for Teams: Rules, Skills and Plugins, for the project instructions files and team
  conventions your assistant reads automatically.
- Your assistant's documentation on how it chooses which files to include.
