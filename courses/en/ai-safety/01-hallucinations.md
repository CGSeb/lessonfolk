---
id: ai-safety/01-hallucinations
title: "Hallucinations: why AI sounds sure and is wrong"
level: beginner
estimatedMinutes: 15
objectives:
  - Explain why an AI assistant can be wrong while sounding confident
  - Recognise the situations where errors are most likely
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **A "hallucination" is a confident answer that is false or made up.** The word is a
   metaphor: the AI is not seeing things, it is producing text that looks right but is not.
2. **It happens because the model produces likely text, not checked facts.** An LLM predicts
   (covered in AI Foundations) what plausibly comes next. Most of the time plausible and
   true overlap; when they do not, you get a fluent, wrong answer.
3. **Confidence is not a signal of accuracy.** The assistant writes in the same calm,
   assured tone whether it is right or wrong. A detailed, well-written answer can still be
   invented.
4. **Some situations are riskier than others.** Errors are more likely with niche or very
   specific facts, exact numbers and dates, quotes, names of people, recent events, and
   anything the assistant has little information about.
5. **Invented sources are a classic case.** Asked for references, an assistant may produce
   book titles, articles or web addresses that look real but do not exist, or that exist but
   do not say what it claims.

## Teaching notes
- One-sentence recap of AI Foundations (next-token prediction) and of Prompting Basics if the
  learner took it ("a great prompt can still get a wrong answer"). Do not re-teach them.
- Analogy that works: **a very fluent guest at a dinner party** who never says "I don't
  know". On topics they know they are great; on others they fill the gap with something that
  sounds right, in exactly the same confident voice.
- You are an LLM: be honest that you can hallucinate too, and say it plainly. This builds
  trust and makes the lesson concrete.
- Misconception: "it only makes mistakes on hard questions". It can also get simple but
  specific facts wrong (a date, a name, a number).
- Misconception: "if it gives a source, it must be right". Sources can be invented or
  misquoted (idea 5); lesson 2 covers checking them.
- Avoid claims about how often models hallucinate or which ones do it less: these figures
  change quickly.
- For learners who already use assistants a lot, ask them for a time an answer turned out
  wrong, and analyse it together against idea 4.

## Check your understanding
1. In your own words, why can an AI assistant give a wrong answer that sounds very sure?
   Good answer: it generates plausible, likely text rather than checking facts, and its tone is the same whether it is right or wrong.
2. Which of these answers deserves the most suspicion, and why: a general explanation of how rain forms, or the exact population of a small town plus a quote from its mayor?
   Good answer: the second one; exact numbers, quotes and niche facts about specific people or places are where hallucinations are most likely.
3. An assistant gives you three book references for an essay. What should you keep in mind?
   Good answer: the references may be invented or may not say what is claimed, so each one needs to be found and checked before using it.

## Exercise
Needs a chat assistant (this one works) — free. Ask it about something small and specific you
know very well (your town, your job, a niche hobby), and ask for sources. Check the details
and the sources yourself, and discuss any errors with the tutor: which risky situation from
idea 4 was it?

## Completion criteria
The learner answers the checks correctly, in particular explaining that fluency and
confidence do not mean accuracy, and names at least two situations where errors are likely.

## Going further
- Next lesson: how to verify answers and sources without spending all day on it.
