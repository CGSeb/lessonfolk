---
id: adapting-models/01-the-adaptation-ladder
title: The adaptation ladder
level: advanced
estimatedMinutes: 20
objectives:
  - Tell apart a knowledge gap, a behaviour gap and a cost gap
  - Order the ways to adapt a model from the cheapest and most reversible to the most expensive
  - Explain why knowledge usually belongs in retrieval rather than in the model's weights
  - Explain why every adaptation starts from a test set and a baseline
prerequisites: []
---

## Key ideas
1. **Name the gap before choosing the cure.** "The model is not good enough" hides three
   different problems. A *knowledge* gap: it does not know your products, your rules or recent
   events. A *behaviour* gap: it knows enough but does not answer the way you need (format,
   tone, a narrow procedure, consistency across thousands of cases). A *cost* gap: the answers
   are good but too slow or too expensive at your volume. Each has a different cure, and
   mixing them up is the most common reason adaptation projects disappoint.
2. **The ladder: climb only as high as you must.** From cheapest and most reversible to most
   expensive: (a) **the prompt**: clear instructions, a few good examples, a required output
   format; (b) **retrieval and tools**: give the model the facts at the moment it answers
   (RAG, covered in *RAG in Depth*); (c) **fine-tuning**: train the model further on your own
   examples to change its behaviour; (d) **distillation**: train a smaller model to reproduce a
   larger one's answers on your task, to cut cost and delay. Each rung up costs more time,
   data and money, and is harder to undo: a prompt change is reverted in a minute, a trained
   model is something you now own and maintain.
3. **Knowledge belongs in retrieval, not in the weights.** Facts given at answer time are easy
   to update, can be cited, and can be filtered by what each user may see. Facts trained into a
   model are none of these: they cannot be removed or corrected without training again, and
   research suggests that fine-tuning on facts the model did not already know is learned slowly
   and can make it invent more. Fine-tuning shines at behaviour; retrieval shines at knowledge.
4. **No climb without a test set and a baseline.** Before changing anything, collect real
   examples with what a good answer looks like, and score the cheapest option on them (the
   ways to build and score such a set are covered in *Evaluating AI Output*). Without that
   baseline you cannot tell whether a rung helped, and you will not notice when it made
   something else worse. Many "we need to fine-tune" projects end at rung (a) once someone
   writes better examples and measures.
5. **The rungs combine.** They are not alternatives: a fine-tuned model can still read
   retrieved documents, a distilled model still gets a short prompt. A common shape is
   retrieval for the facts, a prompt for the rules of the day, and, only if needed, fine-tuning
   for a behaviour the prompt could not make reliable.

## Teaching notes
- Use one running example through the course: **a support team at a software company** that
  wants an assistant to draft replies to customer tickets, in the house style, using the
  product documentation, for tens of thousands of tickets a month. It has all three gaps,
  which makes it a good case for every lesson.
- Analogy that works: **a new hire**. If they lack facts, you give them the handbook (they can
  look things up, and you update it when things change). If they do the job the wrong way, you
  train them. If they are too costly for routine work, a junior trained by them takes over the
  routine part. You would not send someone on a training course to memorise a price list.
- Walk through idea 1 with the support team: "replies quote last year's pricing" (knowledge),
  "replies are three paragraphs when the team wants three lines" (behaviour, and probably a
  prompt fix first), "it costs too much per ticket" (cost). Let the learner sort them.
- Misconception: "fine-tuning teaches the model our documents". It mainly changes how the model
  answers; for what it knows, retrieval is cheaper, fresher and traceable.
- Misconception: "fine-tuning is the professional option, prompting is for amateurs". Teams
  that adapt models well usually exhaust prompting and retrieval first and keep the measurements
  that prove it.
- Experienced learners may mention parameter-efficient methods or very long context windows:
  agree they change the costs, not the reasoning of the ladder. Lesson 2 covers the methods.
- Avoid prices, model names and claims about which provider offers which kind of training:
  they change quickly.
- Pacing: idea 1 and its sorting exercise, then idea 4, are what learners will use most.

## Check your understanding
1. Sort these complaints into knowledge, behaviour or cost gaps: "it gets our refund policy wrong", "it answers in long paragraphs instead of our three-line format", "it is too slow for live chat".
   Good answer: refund policy wrong is a knowledge gap; long paragraphs instead of the house format is a behaviour gap; too slow for live chat is a cost or latency gap.
2. Why are the rungs of the ladder ordered from prompt to distillation, and what changes as you climb?
   Good answer: they go from cheapest, fastest and easiest to undo to most expensive and hardest to undo; climbing costs more time, data and money and leaves you with a model to own and maintain, so you go only as high as the gap requires.
3. A manager wants to fine-tune a model on the company's product catalogue, which changes every week. What would you recommend and why?
   Good answer: put the catalogue in retrieval rather than training it in: retrieved facts can be updated, cited and filtered per user, while trained-in facts go stale, cannot be corrected without retraining and are learned unreliably; keep fine-tuning for behaviour if a gap remains.
4. A team says the prompt "does not work" and wants to fine-tune. What do you ask for first?
   Good answer: a test set of real examples with what good looks like, and the prompt's score on it as a baseline; then whether better instructions and examples were tried, because without a baseline nobody can show that fine-tuning helped.

## Completion criteria
The learner answers the checks correctly, sorts problems into knowledge, behaviour and cost
gaps, places each on the ladder, and insists on a test set and baseline before climbing
(checks 1-4).

## Going further
- Topics: few-shot prompting, retrieval-augmented generation, evaluation baselines.
- Next lesson: what fine-tuning actually changes in a model, and what it does not.
