---
id: evaluating-ai-output/01-looked-fine-is-not-enough
title: "Why \"it looked fine\" is not enough"
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain why one good answer from an AI proves little
  - Name the traps of judging by a quick look
  - Say what an evaluation is and when one is worth the effort
prerequisites: []
---

## Key ideas
1. **The same request can give different answers.** A model builds its answer by choosing among
   likely next tokens, so asking twice often gives two different results, and some of them
   are better than others. One good answer shows that the model *can* do it, not that it
   *usually* does.
2. **Three traps make a quick look misleading.** *Small samples*: after trying two or three
   examples, a few lucky results feel like proof. *Expecting success*: we tend to try the
   cases we already believe will work, and to remember the impressive ones. *Silent
   failures*: a wrong answer is fluent and confident, so you only spot it where you
   already know the subject (see *Using AI Safely and Wisely*).
3. **An evaluation is a fair, repeatable check.** You gather a set of realistic cases, run
   them through the prompt, model or tool, and judge each result against criteria written down
   beforehand. Because the cases and the criteria stay the same, you can compare two
   options, or the same option on two different days.
4. **It supports three decisions.** Which option to pick (this model or that one, this prompt
   or that one). Whether a change helped (a new wording can fix one case and quietly break
   three others). And whether it is good enough to rely on or hand to other people, with a
   reason you can explain.
5. **The effort should match the stakes.** For a one-off task that you will read yourself, a
   careful look is enough. The more often it runs, the more people depend on it, and the more
   it costs to be wrong, the more a proper evaluation is worth. The rest of this course shows
   how to keep that effort small.

## Teaching notes
- Analogy: tasting one spoonful of soup tells you about that spoonful. A restaurant that
  serves the same soup every night needs to know it comes out right on a busy night, with
  a different cook, and after a change of supplier.
- Scenario to reason through with the learner (no task to do): a colleague tries a new prompt on
  three invoices, all three are summarised well, and they want to give it to the whole team.
  Ask what they have really learned and what they have not.
- Misconception: "I can tell quickly whether the answer is good". True for areas you master,
  false for the ones where you rely on the AI because you do not.
- Misconception: "evaluation is for engineers with special tools". The thinking (cases,
  criteria, comparing) is the same for a teacher, an analyst or a developer; no code is needed.
- Misconception: "if it is random, it cannot be tested". Variation is exactly why testing
  several cases matters.
- Beginners to the course: keep ideas 1, 3 and 5 and use the invoice scenario. Experienced
  learners: bring in the three decisions of idea 4 with examples from their own work.
- Do not name evaluation tools, benchmarks or scores: they change fast.
- Pacing: ideas 1 and 2 are the "aha" of the lesson; spend the rest of the time on the
  scenario.

## Check your understanding
1. Why does one good answer from an AI prove so little?
   Good answer: the same request can give different answers, so one good result shows the model
   can do it, not how often it does; a sample of one says nothing about the usual outcome.
2. A colleague tried a new prompt on three invoices, was pleased, and wants to roll it out to the
   whole team. What is missing before you would agree?
   Good answer: more and varied cases, including hard ones; criteria written beforehand; a
   comparison with the old prompt on the same cases; the three successes may be lucky or too easy.
3. Name two of the traps that make "it looked fine" unreliable, with a short example of each.
   Good answer: for example small samples (two lucky tries), expecting success (trying only
   cases you expect to work), or silent failures (a confident wrong answer you cannot spot).
4. For each of these, say whether a careful look is enough or an evaluation is worth it: a
   one-off email draft you will read yourself; a prompt that answers customer questions every
   day for a team.
   Good answer: the email needs only a careful read; the customer prompt runs often, affects
   other people and can cost trust when wrong, so an evaluation is worth it.

## Completion criteria
The learner can explain why a single good result proves little, name at least two traps of quick
judging, define an evaluation as a fair repeatable check, and decide when it is worth the effort
(checks 1-4).

## Going further
- The "Choosing a model" lesson of *How AI Models Really Work* gives a short method for comparing
  models on your own examples, which this course develops.
- Topic to explore: why the answers of a language model vary from one run to the next.
