---
id: adapting-models/05-deciding-and-maintaining
title: "Is it worth it? Deciding and maintaining"
level: advanced
estimatedMinutes: 20
objectives:
  - Prove the gain of an adapted model against the best cheaper option
  - Count the full cost of adapting a model, beyond the training run
  - Plan for the maintenance an adapted model needs
  - Decide, with numbers, when not to adapt or to step back down the ladder
prerequisites:
  - adapting-models/04-distillation-and-smaller-models
---

## Key ideas
1. **Prove the gain against the best cheaper option.** Compare the adapted model with the best
   version of the rung below (the improved prompt with retrieval, not the first draft), on the
   same held-out test set, judged on every criterion that matters: quality, safety, the hard
   cases, cost and delay. Look at what got worse, not only at the average, and treat small
   differences as noise until they repeat (comparing versions is covered in *Evaluating AI
   Output*).
2. **Count the full cost.** The training run is often the smallest part. Add collecting,
   cleaning and checking the data, people's time, evaluation runs, hosting (a dedicated model
   may cost money even when idle), and every future retraining. Set that against the saving per
   call multiplied by the volume, and against the value of the quality gained.
3. **An adapted model is something you maintain.** It is tied to its base model: when the
   provider retires that base or a better one appears, you train again and test again. Your
   products, policies and customers change, so the training data ages. Keep the whole recipe
   reproducible: the data version, the training settings, the test results and the decision.
4. **Re-check the cheaper rungs regularly.** New base models keep getting better at following
   instructions. A model that needed fine-tuning last year may be matched today by a newer model
   with a good prompt, without the maintenance. Re-run the baseline when new models appear, and
   be ready to step back down the ladder.
5. **"Not worth it" is a valid result.** If the gain is small, unstable or bought with a loss
   elsewhere, the right decision is to stop, and to write down the numbers so that the question
   is not reopened from scratch in six months.

## Teaching notes
- Analogy that works: **buying a machine versus renting one**. Owning it can be cheaper per use,
  but you pay for maintenance, repairs, storage and the day it becomes obsolete; renting stays
  flexible.
- Running case: the support team's fine-tuned model scores a little higher on average than the
  improved prompt, but worse on escalation cases, and needs dedicated hosting. Ask the learner
  whether to ship it. Then: a year later the provider announces that the base model will be
  retired, and a newer model with the old prompt matches the fine-tune. Ask what they do.
- Misconception: "we spent months on it, so we should use it". Sunk cost is not a reason; the
  numbers on the test set are.
- Misconception: "once trained, it is done". Data, products and base models all move.
- Experienced learners: discuss how they would set a stopping rule before starting (for example,
  a minimum gain on the critical cases that must be reached for the project to continue).
- Do not quote prices or retirement schedules of providers.
- This lesson closes the course: tie it back to the ladder of lesson 1 in a sentence.
- Pacing: the two-part running case is the heart of the lesson.

## Check your understanding
1. The fine-tuned model scores slightly higher on average than the improved prompt, but worse on escalation cases. Would you ship it? Explain.
   Good answer: probably not as is: a small average gain can be noise, and a regression on important cases such as escalations can outweigh it; investigate and fix the escalation cases first, or keep the prompt.
2. Name four costs of a fine-tuned model besides the training run.
   Good answer: four of: collecting, cleaning and checking data, people's time, evaluation runs, hosting including idle time, retraining when the base model or data changes, keeping the recipe reproducible.
3. The provider announces that the base model of your fine-tune will be retired. What do you do?
   Good answer: re-run the baseline with newer models and the current prompt first; if a fine-tune is still needed, retrain on the new base with the versioned data and settings, and re-test quality and safety before switching.
4. A year later, a newer model with a good prompt matches your fine-tuned model. What should the team do and why?
   Good answer: consider stepping back down the ladder to the prompt-based option, since it gives the same quality without the training, hosting and maintenance costs; confirm on the full test set, including hard cases and safety, then switch and record the decision.

## Completion criteria
The learner answers the checks correctly, compares against the best cheaper option on all
criteria, counts the full cost and maintenance, and accepts stepping down or stopping when the
numbers say so (checks 1-4).

## Going further
- Topics: total cost of ownership for AI models, model versioning and deprecation, evaluation
  baselines.
- Ask the tutor to "quiz me" on this course to revisit the ladder and the data rules.
