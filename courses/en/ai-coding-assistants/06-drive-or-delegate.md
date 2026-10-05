---
id: ai-coding-assistants/06-drive-or-delegate
title: "Drive or delegate: your workflow"
level: intermediate
estimatedMinutes: 15
objectives:
  - Choose between writing code yourself, pairing with an assistant and delegating a task
  - Build a personal workflow from the habits of this course
prerequisites:
  - ai-coding-assistants/05-secrets-and-private-code
---

## Key ideas
1. **Three modes, not one.** **Drive**: you write the code, the assistant suggests or answers
   questions. **Pair**: you work step by step together, checking each change. **Delegate**:
   you hand over a well-specified task and review the result. Good developers switch modes
   many times a day.
2. **Delegate what is clear and easy to check.** Boilerplate, repetitive changes across
   files, tests for agreed behaviour, small scripts, explanations of unfamiliar code, first
   drafts of documentation. The task is well specified, and a mistake is easy to spot and
   cheap to undo.
3. **Drive what is critical, unclear or new to you.** Core design decisions, security and
   payment code, vague requirements still being explored, and skills you are still
   learning. If reviewing the result would take longer than writing it, write it. If you
   would not be able to tell whether the code is right, you need to understand it first.
4. **Protect your own skills.** Delegating everything can leave you unable to debug or
   judge the code. Use the assistant to learn as well as to produce: ask it to explain, to
   compare approaches, to quiz you on what it wrote. You stay the one who decides.
5. **Your workflow is the sum of the habits.** Brief with context (lesson 1), split and plan
   (lesson 2), review the diff (lesson 3), test and commit small (lesson 4), keep secrets
   out (lesson 5), and choose the mode for each task. Start with a few habits, notice what
   works for you, and adjust.

## Teaching notes
- Analogy that works: **a driving instructor's car with dual controls**. Sometimes you
  drive and the instructor watches, sometimes you let them take the wheel on a familiar
  road, but on the icy mountain pass you want your own hands on the wheel.
- Misconception: "the goal is to delegate as much as possible". The goal is good software,
  delivered efficiently; delegating a task you cannot review well moves the work to
  debugging later.
- Misconception: "using AI makes you a worse developer". It can, if you stop understanding
  what you ship; used to explain and explore, it can also speed up learning.
- Ask the learner how they work today and build idea 5 from their answers rather than
  reciting the list; the result should feel like their workflow, not the course's.
- This is the last lesson: leave time to recap the course and celebrate. Suggest next steps:
  Build with AI (adding AI features to their own apps) and AI Agents and Tools (how
  agent-style assistants work inside).

## Check your understanding
1. Give one task you would delegate to an assistant and one you would drive yourself, and explain why.
   Good answer: a delegated task that is well specified and easy to check (boilerplate, tests for known behaviour, repetitive edits), and a driven task that is critical, unclear or hard to review (security, core design, exploring vague requirements, a skill being learned), with a reason tied to clarity, risk or ease of checking.
2. When is it faster to write the code yourself than to ask the assistant?
   Good answer: when specifying and reviewing the result would take longer than writing it, or when you could not judge whether the result is correct.
3. Describe your own workflow for a typical AI-assisted task in a few steps.
   Good answer: covers most of: brief with context, split or plan, choose a mode, clean git state, tests, review the diff, commit small, keep secrets out.

## Exercise
Needs nothing (a computer is optional). List five tasks from your recent or upcoming work.
For each, choose drive, pair or delegate and give one reason. Then write your personal
checklist for an AI-assisted task in five lines or fewer, and keep it next to your editor.
Discuss both with the tutor.

## Completion criteria
The learner answers the checks correctly, can justify a mode choice by clarity, risk and ease
of checking, and has described a workflow that uses the habits of the course.

## Going further
- Build with AI: Your First AI App, to add AI features to your own projects.
- AI Agents and Tools, to understand how agent-style assistants work inside.
- Project instructions files and team conventions for AI assistants (a future course).
