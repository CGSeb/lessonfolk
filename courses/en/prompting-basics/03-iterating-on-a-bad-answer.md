---
id: prompting-basics/03-iterating-on-a-bad-answer
title: Iterating on a bad answer
level: beginner
estimatedMinutes: 20
objectives:
  - Treat a first answer as a draft to improve
  - Diagnose why an answer missed the mark
  - Fix it with targeted follow-ups or a fresh start
prerequisites:
  - prompting-basics/02-role-examples-and-format
---

## Key ideas
1. **The first answer is a draft, not a verdict.** A chat is a conversation: you can react to
   the answer and steer it. Most good results come after one or two follow-ups.
2. **Diagnose before you retry.** Ask yourself why the answer missed. The usual causes are:
   missing information (the assistant guessed), the wrong format or length, too generic
   (no goal or audience), or a misunderstanding of the task. Each has a different fix.
3. **Give specific feedback.** "Not good, try again" gives the assistant nothing to work
   with. "Shorter, drop the second paragraph, and make the tone less formal" does. Say what
   to keep as well as what to change.
4. **Let the assistant ask you questions.** When you are not sure what to add, ask: "Before
   you answer, ask me the questions you need to do this well." It turns the missing context
   into a short interview.
5. **Know when to start fresh.** In a long conversation full of rejected attempts, earlier
   mistakes can keep leaking back in. Starting a new conversation with one improved prompt,
   which includes what you learned, is often faster than piling on corrections.

## Teaching notes
- Analogy that works: **a hairdresser**. If the cut is not right, you do not walk out and say
  nothing, and you do not just say "wrong". You say "a bit shorter on the sides, keep the
  top". Specific feedback, step by step.
- Live demo: deliberately give a mediocre answer to a vague request from the learner, then
  coach them through diagnosing it (which of the causes in idea 2?) and writing a follow-up.
  Show the improved answer.
- Misconception: "if the first answer is bad, the AI can't do it". Often the request just
  lacked information. Try one diagnosis-and-fix round before concluding.
- Misconception: "regenerating the same prompt again and again will eventually work". Asking
  again can give a different answer, but without a change to the prompt you are just rolling
  the dice. Change something.
- The "fresh start" idea links back to AI Foundations: the model works from what is in the
  conversation, so a conversation full of bad attempts is part of what it sees.
- For experienced users, focus on ideas 4 and 5, which they use least.

## Check your understanding
1. An assistant wrote you a birthday message that is far too long and formal. What follow-up would you send?
   Good answer: specific feedback naming the changes (e.g. "make it 2 sentences, warm and casual, keep the joke about…"), not just "try again".
2. Name two different reasons an answer can miss the mark, and how you would fix each.
   Good answer: any two of missing information (add the context), wrong format or length (ask for the format), too generic (add goal or audience), misunderstood task (restate the task more clearly), each paired with a matching fix.
3. When is it better to start a new conversation instead of correcting again?
   Good answer: when the conversation has many failed attempts or has drifted, so old mistakes keep coming back; a fresh, improved prompt that includes what was learned works better.

## Exercise
Needs a chat assistant (this one works) — free. Ask for something with a deliberately vague
one-line prompt. Then improve the answer in at most three follow-ups, naming each time which
cause you are fixing. Finally, write the single prompt you wish you had sent first, and test it
in a new conversation.

## Completion criteria
The learner answers the checks correctly, and can turn vague feedback ("it's bad") into a
specific follow-up that names what to change and what to keep.

## Going further
- Next lesson: the most common prompt mistakes and how to avoid them.
