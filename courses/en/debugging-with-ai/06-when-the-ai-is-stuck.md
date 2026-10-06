---
id: debugging-with-ai/06-when-the-ai-is-stuck
title: When the AI is stuck or confidently wrong
level: intermediate
estimatedMinutes: 20
objectives:
  - Recognise the signs that an assistant is stuck or confidently wrong
  - Get unstuck by resetting the conversation, adding evidence or narrowing the problem
  - Decide when to debug yourself or ask a person
prerequisites:
  - debugging-with-ai/05-verifying-the-fix
---

## Key ideas
1. **Know the signs.** The assistant is stuck when it **loops** (proposes a fix you already
   tried), **flip-flops** (undoes its last change, then redoes it), produces ever bigger
   changes for a small bug, or blames things it cannot see ("probably a caching issue")
   without a way to check. It is confidently wrong when it invents a function, option or
   setting that does not exist (made-up APIs, covered in AI Coding Assistants in Practice)
   or insists a fix works when your test says otherwise.
2. **Long conversations go stale.** After many failed attempts, the context is full of wrong
   ideas, discarded code and dead ends, and the model keeps drawing on them. Start a fresh
   conversation with a clean summary: the bug brief, what you ruled out and the evidence
   you have. A clean start often beats the tenth attempt in the same thread.
3. **Change the input, not the volume.** Asking again more firmly rarely helps. Give new
   evidence instead (a log of the real values, the exact library version, the documentation
   page of the function involved), narrow the problem (a smaller reproduction, one
   hypothesis at a time), or ask a different question ("what would have to be true for this
   output to happen?").
4. **Go to the source of truth.** When the assistant and the program disagree, the program
   wins. Read the official documentation, the library's source code or its issue tracker,
   and check that every function and option the assistant uses really exists in your
   version.
5. **Take the wheel or ask a person.** Set yourself a limit, such as three failed attempts
   or a fixed amount of time, then change approach: debug it yourself with prints and a
   debugger, explain the problem out loud, or ask a colleague or a community with your bug
   brief. The assistant is a partner; the judgement and the decision stay with you.

## Teaching notes
- Analogy that works: **a GPS stuck in a recalculation loop**. Repeating the address louder
  does not help; you look at the actual road signs, check a map, or ask someone local.
- **Rubber duck debugging**: explaining the problem step by step, even to an object, often
  reveals the cause. Writing a clean summary for a fresh conversation (idea 2) has the same
  effect, and many learners find the bug while writing it.
- Misconception: "a better or bigger model would get it". Sometimes, but usually the missing
  piece is evidence, not intelligence: no model can see a value your program never printed.
- Misconception: "if I need to debug myself, the AI failed me". Assistants have real blind
  spots (your runtime, your data, your environment); knowing when to take over is part of
  using them well.
- Do not re-teach hallucinated APIs: one sentence recalling that assistants invent plausible
  functions and options, then focus on how it shows up in debugging (a fix that cannot run, a
  setting that does nothing). If the learner skipped AI Coding Assistants in Practice, name it
  as the place to go deeper.
- This is the last lesson: recap the course method (brief → explain → hypotheses → root
  cause → verify, and knowing when to take over) and celebrate. Suggest next steps: AI Coding
  Assistants for Teams: Rules, Skills and Plugins (sharing these habits with a team) and Build
  with AI (building their own AI features).

## Check your understanding
1. Give two signs that an assistant is stuck on a bug.
   Good answer: any two of repeating a fix already tried, undoing and redoing the same change, ever larger changes for a small bug, vague blame on things it cannot see, invented functions or settings, insisting a fix works when the test fails.
2. After a dozen failed attempts in one conversation, what do you do, and why?
   Good answer: start a fresh conversation with a clean summary (bug brief, what was ruled out, evidence), because the long context is full of wrong ideas and dead ends the model keeps drawing on.
3. The assistant says to set an option `strict_dates=True` in a library call, but nothing changes. What do you check?
   Good answer: whether that option really exists in the library version you use, in the official documentation or source code; it may be invented.
4. When should you stop asking the assistant and change approach?
   Good answer: after a limit you set (a few failed attempts or a fixed time), or when it loops or invents things; then debug yourself, rubber-duck it, or ask a person with the bug brief.

## Exercise
Needs a computer and any free assistant, or this chat. Recall a bug where an assistant went in
circles (yours, or one the tutor describes). Write the clean summary you would use to start a
fresh conversation: the bug brief, what was ruled out, the evidence so far and the next
hypothesis. Optionally, try it in a new conversation and compare the result. Then write your
personal "stuck" rule in one or two lines (for example, "after three failed fixes: fresh
summary, then the documentation, then a colleague") and discuss it with the tutor.

## Completion criteria
The learner answers the checks correctly, can name the signs of a stuck or confidently wrong
assistant, and has a concrete rule for when and how to change approach.

## Going further
- Rubber duck debugging, a long-standing programmer technique.
- AI Coding Assistants for Teams: Rules, Skills and Plugins, to share debugging habits and
  guardrails with your whole team.
- Build with AI: Your First AI App, to add AI features to your own projects.
