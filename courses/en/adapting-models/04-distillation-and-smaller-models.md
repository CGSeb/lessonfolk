---
id: adapting-models/04-distillation-and-smaller-models
title: Distillation and smaller models
level: advanced
estimatedMinutes: 20
objectives:
  - Explain how distillation trains a smaller model from a larger one
  - Judge when distillation pays off and where the student fails
  - Name cheaper alternatives to distillation
  - Check the terms that apply to the teacher's outputs
prerequisites:
  - adapting-models/03-data-for-fine-tuning
---

## Key ideas
1. **A teacher writes the examples, a student learns them.** In *distillation*, a large, capable
   model (the *teacher*) answers many real inputs from your task, and a much smaller model (the
   *student*) is fine-tuned on those answers. The goal is close to the teacher's quality on that
   one task, at the student's cost and speed. It is fine-tuning (lesson 2) where the training
   data comes from a model rather than from people.
2. **It pays off at volume, on a stable, narrow task.** A smaller model is cheaper per call,
   faster, and can run on your own servers or even on a device, which keeps data in-house. Those
   savings add up when the task is repeated many times and does not change much; for a few
   hundred calls a month, the work of distilling rarely pays back.
3. **The student is only as good as what it was shown.** It does well on inputs like those in
   its training set and drops faster than the teacher outside them: a new product, an unusual
   request, a change in policy. It rarely beats the teacher, and it copies the teacher's
   mistakes, so filter the teacher's answers with checks or reviews before training on them, and
   keep a test set of real cases, including new ones.
4. **Try the cheaper shrinking options first.** A smaller model with a good prompt and retrieval
   may already be enough: test it before training anything. *Routing* sends easy requests to a
   small model and hard ones to a large one. *Quantisation* stores a model's numbers with less
   precision, so it takes less memory and runs faster, usually with a small loss of quality.
   These can be combined with distillation or make it unnecessary.
5. **Check the terms on both sides.** Some providers' terms forbid using their models' outputs to
   build competing models, and open-weight models come with licences that differ in what they
   allow. Read the teacher's terms before generating training data, and the student's licence
   before deploying it.

## Teaching notes
- Analogy that works: **a senior expert writing a field guide for juniors**. The juniors handle
  the routine cases well and cheaply by following the guide; a case the guide never covered
  still needs the expert.
- Running case: the support team now has good drafts from a large model, but at tens of
  thousands of tickets a month the cost and delay are too high. Distillation fits: high volume,
  a fairly stable task, a teacher whose answers can be checked. Then a new product launches and
  the student's drafts for it are poor. Ask the learner why and what to do (add new examples
  from the teacher, retrain, and route new-product tickets to the large model meanwhile).
- Misconception: "the student becomes as good as the teacher". On its narrow task, it can come
  close; outside it, it is a small model.
- Misconception: "smaller means worse". For a narrow, well-defined task, a small adapted model
  can be the better choice once cost and speed count.
- Experienced learners may know the original sense of distillation (training the student on the
  teacher's probabilities, not only its final answers). Mention it as the classic form; with
  closed teachers, only the answers are usually available.
- Do not quote model sizes, prices or speed figures, and do not interpret licences: tell the
  learner to read them.
- Pacing: the new-product scenario carries the lesson.

## Check your understanding
1. Explain distillation in your own words, with the support team as the example.
   Good answer: the large model drafts replies to many real tickets, the drafts are checked, and a smaller model is fine-tuned on them so it produces similar replies more cheaply and quickly.
2. When does distillation pay off, and when would you not bother?
   Good answer: it pays off for a high-volume, stable, narrow task where cost, speed or running in-house matters; not for low volumes, tasks that change often, or when a smaller model with a good prompt is already good enough.
3. After distillation, the student writes poor drafts for tickets about a newly launched product. Why, and what would you do?
   Good answer: the student only learned the cases in its training data and does worse outside them; route those tickets to the large model for now, collect checked teacher answers for the new product, retrain and test on new cases.
4. Name two ways to cut cost or delay that need no distillation.
   Good answer: two of: a smaller model with a good prompt and retrieval, routing easy requests to a small model and hard ones to a large one, quantisation, shorter prompts or caching.

## Completion criteria
The learner answers the checks correctly, explains the teacher and student roles, judges when
distillation pays off and where the student fails, and names alternatives and the terms to
check (checks 1-4).

## Going further
- Topics: knowledge distillation, model routing, quantisation.
- Next lesson: deciding whether an adaptation is worth it, and keeping it alive.
