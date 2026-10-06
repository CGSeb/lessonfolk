---
id: debugging-with-ai/01-giving-the-assistant-what-it-needs
title: Giving the assistant what it needs
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain why "it doesn't work, fix it" leads to guesses
  - Write a debugging brief with the error, a reproduction and expected vs actual behaviour
  - Reduce a bug to a minimal reproduction
prerequisites:
  - ai-coding-assistants/06-drive-or-delegate
---

## Key ideas
1. **No evidence, only guesses.** The assistant only knows what is in its context (covered in
   AI Coding Assistants in Practice). "My login is broken, fix it" leaves it to imagine the
   bug, so it proposes the most common fix for the most common problem, which is rarely
   yours. The quality of the answer depends on the evidence you give it.
2. **The exact error, in full.** Copy the real error message and the whole stack trace, not
   a summary ("some null error"). Exact wording, file names and line numbers are the most
   useful clues there are. Strip secrets, tokens and personal data from logs before you
   paste them (covered in AI Coding Assistants in Practice), but do not trim the clues.
3. **Expected versus actual.** Say what you did, what you expected and what happened
   instead: "I submit the form with an empty email; I expect a validation message; I get a
   500 error." Many bugs have no error message at all (a wrong total, a missing row), and
   then this comparison is the whole bug report.
4. **A minimal reproduction.** The smallest code and the shortest steps that still show the
   bug. Cut everything that is not needed until removing anything more makes the bug
   disappear. It keeps the assistant focused on the real problem, keeps private code out of
   the chat, and often reveals the cause before you even ask.
5. **What changed, and what you already tried.** "It worked yesterday; since then I updated
   a library and changed the date format" points straight at the suspects. Also say what you
   ruled out, so the assistant does not suggest it again, and give the environment that
   matters (language and library versions, operating system, browser).

## Teaching notes
- Analogy that works: **calling a doctor**. "I feel bad" gets you generic advice; "a sharp
  pain here since Tuesday, worse after meals, I already tried painkillers" gets a real
  diagnosis. The assistant, like the doctor, can only reason from the symptoms you describe.
- Suggest a reusable template for the learner: what I did / what I expected / what
  happened (exact error and stack trace) / minimal reproduction / what changed recently /
  what I tried / environment.
- Misconception: "the agent can read my project, so I don't need to explain". An agent-style
  tool can open files and run commands, but it does not know which behaviour is wrong, what
  you expected, or what changed last week. It still needs the bug report.
- Misconception: "making a minimal reproduction takes too long". It is often the fastest
  route to the cause, with or without AI; many bugs are found while cutting the code down.
- Do not repeat the context and secrets lessons of AI Coding Assistants in Practice; recall
  each in one sentence. If the learner skipped that course, give the idea in a sentence and
  name it as the place to go deeper.
- Experienced learners: go fast on ideas 1–3 and spend the time on idea 4, using a real bug
  of theirs. Learners newer to debugging: spend more time on ideas 2 and 3 with a concrete
  example.

## Check your understanding
1. Why does "my page is broken, fix it" usually get a poor answer from an assistant?
   Good answer: the assistant has no evidence about this bug (no error, no expected vs actual, no code), so it guesses the most common cause and fix, which may have nothing to do with the real problem.
2. Your report total is wrong, but there is no error message. What do you give the assistant?
   Good answer: what you did, the expected value and the actual value (with the input data), the code that computes it, ideally as a small reproduction, plus what changed recently.
3. What is a minimal reproduction, and why is it worth making?
   Good answer: the smallest code and steps that still show the bug; it keeps the assistant focused, keeps unrelated or private code out of the chat, and often reveals the cause on its own.

## Exercise
Needs a computer with Python (or any language you use) and any free assistant, or this chat.
The tutor gives you a short buggy script, for example a function that averages a list of
prices read from text and crashes on one input. First ask an assistant "this doesn't work,
fix it" with the code only. Then reduce the bug to a minimal reproduction and send a full
brief (what you did, expected, actual with the exact error, what you tried). Compare the two
answers with the tutor. Use your own language if you prefer: the tutor adapts the snippet.

## Completion criteria
The learner answers the checks correctly and can list, without help, what a good debugging
brief contains: the exact error, expected vs actual, a minimal reproduction, recent changes and
what was already tried.

## Going further
- "How to create a minimal, reproducible example", a well-known guide in the Stack Overflow
  help center.
- Next lesson: reading the error and the stack trace together with the assistant.
