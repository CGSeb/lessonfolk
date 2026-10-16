---
id: evaluating-ai-output/04-scoring-methods
title: "Scoring: checks, people and AI judges"
level: intermediate
estimatedMinutes: 15
objectives:
  - Compare automatic checks, human review and AI judges, with their strengths and limits
  - Name the known biases of AI judges
  - Explain how to combine methods and decide how far to trust a judge
prerequisites:
  - evaluating-ai-output/03-what-makes-a-good-test-set
---

## Key ideas
1. **Automatic checks suit anything that can be a rule.** Is the answer exactly the expected
   category? Is it valid in the requested format? Does it mention the required point, or avoid
   the forbidden one? Is it under the length limit? Such checks are fast, cheap and perfectly
   consistent, but they cannot judge whether an open-ended text is actually good.
2. **People judge nuance, but slowly and unevenly.** Human review is the reference for
   quality, tone and subtle errors. It is slow and costly, and two reviewers may disagree. Give
   them the written criteria, let two of them score a sample, and talk through the
   disagreements: they show where the criteria are unclear.
3. **An AI can act as a judge.** You give a model the case, the answer and the rubric, and ask for
   a verdict with a short reason. This scales to thousands of answers. But the judge is a
   measuring tool that can be wrong, and it needs checking like any instrument.
4. **AI judges have known biases.** They tend to prefer longer answers, to favour whichever answer
   comes first (or last), to favour text written in a style like their own, and to grade poorly on tasks that
   need careful reasoning, such as maths. They can also share the blind spots of the model being
   judged. Useful
   counter-measures: a clear rubric, swapping the order of two answers, and comparing the
   judge with human scores on a sample.
5. **Combine them, and calibrate.** A common pattern is cheap automatic checks for everything
   that can be a rule, an AI judge for the volume, and humans for a sample and for the hard or
   high-stakes cases. Before relying on a judge, see how often it agrees with people on the
   same answers; if it disagrees often, fix the rubric or do not use it. Where being wrong is
   costly, never let an AI judge be the only evidence.

## Teaching notes
- Analogy: a ruler, a colleague and an automatic scale. Each measures something different. The
  scale is exact about weight and blind to quality; the colleague notices quality but gets tired;
  a second, untested scale needs checking against a known weight before you trust it.
- Scenario to reason through with the learner (nothing to run): a team wants to score 2,000
  assistant answers a week. Ask which parts they would check automatically, where they would use
  an AI judge, and where they would still want a person.
- Second scenario: an AI judge picks the longer of two answers 80% of the time. Ask what that
  could mean and what they would check before trusting it. (Do not give the percentage as a real
  statistic; it is only an example.)
- Misconception: "an AI judge is objective because it is a machine". It is a model with
  tendencies, and it needs a rubric and a check against people.
- Misconception: "human review is always the truth". People disagree and tire; use agreement
  between reviewers as a signal.
- Beginners to the course: ideas 1 to 3 and the 2,000-answers scenario. Experienced learners:
  discuss calibration and the bias counter-measures.
- Do not name judging tools, models or benchmark scores.
- Pacing: idea 4 is the core of the lesson; leave time for the second scenario.

## Check your understanding
1. Name one thing automatic checks do well and one thing they cannot do.
   Good answer: they check rules fast and consistently (format, required or forbidden content,
   exact category, length); they cannot judge the quality of open-ended text.
2. Name two known biases of AI judges and one way to reduce their effect.
   Good answer: any two of preferring longer answers, favouring the first (or last) answer shown,
   favouring their own style, grading reasoning tasks poorly; reduce them with a clear rubric,
   swapping the order, or checking against human scores on a sample.
3. A team plans to use an AI judge as the only check on answers about medication doses. What is the
   concern, and what would you propose?
   Good answer: the stakes are high and the judge can be wrong or share the model's blind spots;
   add human review of the answers, at least a sample and all hard cases, and check the judge
   against people before trusting it.

## Completion criteria
The learner can compare the three scoring methods, name biases of AI judges with a counter-measure
and describe how to combine methods and when a human must stay involved (checks 1-3).

## Going further
- The "Verifying answers and sources" lesson of *Using AI Safely and Wisely* shows personal habits
  for checking an answer.
- Topic to explore: agreement between reviewers as a measure of how clear a rubric is.
