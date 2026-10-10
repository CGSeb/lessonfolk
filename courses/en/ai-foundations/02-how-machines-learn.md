---
id: ai-foundations/02-how-machines-learn
title: How do machines learn?
level: beginner
estimatedMinutes: 20
objectives:
  - Describe machine learning as learning from examples
  - Explain training data, model, and prediction
  - Understand why data quality matters
prerequisites:
  - ai-foundations/01-what-is-ai
---

## Key ideas
1. **Machine learning = learning from examples.** Instead of writing rules, we show the
   computer many examples (photos labelled "cat" or "dog") and it adjusts itself until it
   gets them mostly right.
2. **Three words to know**: *training data* (the examples), *model* (the result of
   training — a big set of adjusted numbers), *prediction* (the model's answer on new input).
3. **Training is trial and error at scale**: the model guesses, measures how wrong it was,
   nudges its numbers to be a little less wrong, and repeats — millions of times.
4. **Garbage in, garbage out**: a model learns whatever patterns are in its data, including
   mistakes and biases. If the examples are unbalanced or wrong, the model will be too.
5. **Learning ≠ memorising**: the goal is to do well on *new* examples it has never seen.

## Teaching notes
- Analogy that works well: a child learning to recognise dogs from many examples, without anyone defining "dog".
- Ask the learner to imagine teaching a computer to recognise ripe bananas: what examples would they collect?
- Bias example to use: a hiring model trained on past decisions reproduces past unfairness.
- Avoid math. "Adjusting numbers" is enough at this level; mention "parameters" only if the learner is curious.

## Check your understanding
1. What is training data?
   Good answer: the examples a model learns from.
2. A model was trained only on photos of dogs taken in sunny parks. What might go wrong?
   Good answer: it may fail on other conditions (night, indoors, snow) — the data didn't represent them.
3. Why is memorising the training examples not enough?
   Good answer: the model must work on new, unseen examples.
4. What is the difference between a model and a prediction?
   Good answer: the model is the result of training (the adjusted numbers); a prediction is the answer the model gives on a new input.

## Exercise
No computer needed. Pick a task (e.g. sorting emails into "urgent" / "not urgent") and
describe what training examples you would collect and one way your data could be biased.

## Completion criteria
The learner correctly explains training data and prediction, and gives a sensible answer to question 2.
