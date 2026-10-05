---
id: prompting-basics/04-common-prompt-mistakes
title: Common prompt mistakes
level: beginner
estimatedMinutes: 15
objectives:
  - Recognise the most common prompt mistakes
  - Rewrite a flawed prompt to fix them
prerequisites:
  - prompting-basics/03-iterating-on-a-bad-answer
---

## Key ideas
1. **Too vague, or assuming shared context.** "Fix this", "make it better", "the usual
   format": the assistant does not know what "this", "better" or "usual" mean to you. Name
   the thing, the problem and the result you want.
2. **Too many tasks at once.** "Summarise this report, translate it, write three tweets and
   a slide plan" in one go often gets each part done half well. Split big jobs into steps,
   one prompt per step, and check each result before moving on.
3. **Leading questions.** "Isn't it true that my business idea is great?" invites the
   assistant to agree with you, because agreeable text is a likely answer. Ask neutral
   questions instead: "What are the strengths and weaknesses of this idea?"
4. **Conflicting instructions.** "Be very detailed but keep it short" or "formal but
   casual" forces the assistant to pick one, and you cannot predict which. Re-read your
   prompt and decide what matters most.
5. **Sharing what you should not.** It is tempting to paste everything for context, but
   passwords, other people's personal data or confidential work documents should stay out
   unless you know how the tool handles them. Replace them with placeholders or remove them.

## Teaching notes
- Format that works: show a short "bad prompt" for each mistake, ask the learner what is
  wrong with it, then let them rewrite it before you show yours. Learners remember mistakes
  they spotted themselves.
- Analogy for mistake 3: **asking a friend who hates to disagree**. If you ask "it looks
  great, right?", you will hear "yes". Ask "what would you change?" to get a real opinion.
- Misconception: "the AI will tell me if my question is biased". Sometimes it pushes back,
  but often it goes along with the framing. The learner is responsible for asking neutrally.
- Mistake 5 is only a short practical reminder; do not turn it into a privacy lecture. If
  the learner asks for more, say a later course covers using AI safely.
- Link back to lessons 1–3: mistake 1 is lesson 1 (context, goal, audience), mistake 2 uses
  lesson 3's idea of steps and feedback.
- Pacing: this lesson is mostly practice. Keep explanations to a sentence or two per
  mistake.

## Check your understanding
1. What is wrong with "Isn't remote work clearly better for everyone?", and how would you rewrite it?
   Good answer: it is a leading question that invites agreement; a neutral version asks for pros and cons or for the evidence on both sides.
2. A friend asks an assistant to "summarise this 30-page report, write a press release and draft five social posts" in one prompt, and gets weak results. What would you advise?
   Good answer: split it into steps (summary first, check it, then the press release from the summary, then the posts), one prompt per task.
3. Before pasting a document into a chat assistant, what should you check?
   Good answer: that it does not contain passwords, other people's personal data or confidential information, or remove and replace those parts first.

## Exercise
Needs nothing (or a chat assistant to test) — free. The tutor gives three flawed prompts, one
at a time. For each, name the mistake and rewrite it. Optionally, run both versions in a chat
assistant and compare.

## Completion criteria
The learner answers the checks correctly and correctly names and fixes at least two of the
mistakes in practice prompts.

## Going further
- Next lesson: what even a perfect prompt cannot fix.
