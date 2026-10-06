---
id: prompting-basics/05-what-prompting-cannot-fix
title: What prompting cannot fix
level: beginner
estimatedMinutes: 15
objectives:
  - Explain what a good prompt can and cannot change
  - Recognise tasks where an answer needs extra care
  - Spot "magic phrase" myths
prerequisites:
  - prompting-basics/04-common-prompt-mistakes
---

## Key ideas
1. **Prompting shapes the answer; it does not change the model.** A good prompt helps the
   assistant use what it already learned, in the form you need. It cannot add knowledge the
   model never had.
2. **It cannot know what it was not given.** Recent events after its training, your private
   files, your company's internal rules: unless you paste them in, or the tool is connected
   to search or your documents, the assistant does not have them, however well you ask.
3. **A great prompt can still get a wrong answer.** The model generates likely text, so it
   can still be confidently wrong (a "hallucination", covered in AI Foundations). For anything
   that matters — health, money, legal, facts you will repeat — check the answer against a
   reliable source.
4. **Some tasks are a poor fit without a tool.** Exact counting (letters, words), precise
   calculations or long lists of exact facts can go wrong, because the model predicts text
   rather than computing. Assistants that can run a calculator or code do better; otherwise,
   double-check.
5. **There are no magic phrases.** Lists of "secret prompts" or "one phrase that unlocks
   genius mode" promise more than they deliver. What works is what this course taught:
   clear context, goal and audience, examples, format, and good follow-ups.

## Teaching notes
- Analogy that works: **a great question to a well-read friend**. Asking clearly gets you
  their best answer, but it cannot make them know yesterday's news or a book they never read,
  and they can still misremember.
- You are an LLM: be honest about your own limits here, with a concrete example (you may not
  know very recent events; you can make mistakes). Avoid stating your training cutoff or
  comparing models — that ages quickly.
- Keep answer-checking short (idea 3). Say that the Using AI Safely and Wisely course covers
  how to verify answers; do not teach verification techniques here.
- Misconception: "if the answer is wrong, my prompt was bad". Sometimes, but not always —
  the limit can be the model's knowledge or reliability, not the wording.
- Misconception: "telling the AI 'don't make mistakes' or 'be 100% accurate' prevents
  errors". It may sound more careful, but it does not make the model know more.
- End the course on a positive note: prompting is a real, everyday skill, and knowing its
  limits is part of using it well.

## Check your understanding
1. Someone writes a very detailed prompt asking for yesterday's local football results and gets a confident answer. Should they trust it? Why?
   Good answer: not without checking; unless the assistant used a search tool, it does not know recent events, and a good prompt cannot add that knowledge — it may have produced plausible but invented results.
2. Does adding "be 100% accurate" to a prompt make the answer reliable? Explain.
   Good answer: no; it can change the tone but not what the model knows or how it generates text, so it can still be wrong and important answers still need checking.
3. Give one kind of task where you should double-check an assistant's answer, and why.
   Good answer: e.g. exact counting or calculations (it predicts text rather than computing, unless it uses a tool), or health, money or legal questions (high stakes, can be confidently wrong).

## Exercise
Needs a chat assistant (this one works) — free. Ask it something you can verify yourself:
how many times a given letter appears in a long word, the sum of a list of ten numbers, or a
detail from your own job. Check the answer yourself and discuss with the tutor whether a better
prompt would have helped, or whether it hit a limit.

## Completion criteria
The learner answers the checks correctly and can explain, in their own words, the difference
between what a better prompt can improve and what it cannot.

## Going further
- Using AI Safely and Wisely: hallucinations, how to check answers, privacy, bias and honest use.
- Build with AI: Your First AI App: system prompts and using models through code go beyond chat prompting.
