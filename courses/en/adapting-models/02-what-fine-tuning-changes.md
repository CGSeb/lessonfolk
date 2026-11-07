---
id: adapting-models/02-what-fine-tuning-changes
title: What fine-tuning really changes
level: advanced
estimatedMinutes: 20
objectives:
  - Explain what supervised fine-tuning does to a model
  - Judge which problems fine-tuning fits and which it does not
  - Name the side effects to test for after fine-tuning, including weaker safety behaviour
  - Tell full fine-tuning, adapters and preference tuning apart
prerequisites:
  - adapting-models/01-the-adaptation-ladder
---

## Key ideas
1. **Fine-tuning continues training on your examples.** You give pairs of an input and the
   ideal output, and the model's numbers are adjusted so that it produces outputs more like
   yours. It is the same mechanism as the first step of post-training (covered in *How AI
   Models Really Work*), applied to your narrow task. The result is a new version of the model,
   which you now call instead of the original.
2. **It is good at behaviour.** A consistent format, tone or style across many cases; a narrow
   task done the same way every time (sorting, extracting fields, following a house procedure);
   behaviour that would take pages of instructions to describe; and shorter prompts, since the
   instructions and examples are now built in, which saves cost and time on every call.
3. **It is poor at knowledge and has side effects.** Facts trained in are learned unreliably
   and go stale (lesson 1). A model tuned hard on one task can get worse at others it used to
   do well, a problem known as *catastrophic forgetting*. And fine-tuning can weaken the safety
   behaviour the provider trained in: research has shown that training on ordinary, harmless
   datasets can make a model somewhat more willing to answer harmful requests, and that a
   handful of harmful examples can undo much of that behaviour. After any
   fine-tuning, re-run your safety and general tests, not only the task test.
4. **Full fine-tuning or a small add-on.** *Full* fine-tuning adjusts all of the model's
   numbers: costly and heavy to store. *Parameter-efficient* methods, such as low-rank adapters
   (LoRA), freeze the model and train a small set of extra numbers on top; they are much
   cheaper, can be swapped per task over the same base model, and often match full
   fine-tuning in quality. With a closed model, the provider's service does the training and you get a
   model you can call, not one you can download.
5. **Preference tuning, when judging is easier than writing.** For some qualities (a helpful
   tone, the right length, refusing only what should be refused) it is easier to say which of
   two answers is better than to write the perfect one. Preference tuning trains on such pairs,
   like the second step of post-training. The model learns whatever the preferences reward,
   including their biases, and can learn to please the judge rather than to be right, so the
   test set matters even more.

## Teaching notes
- Analogy that works: **coaching a skilled professional**. Coaching changes how they work
  (style, habits, a procedure) far more easily than it gives them reliable new facts; overdo the
  coaching on one task and they may get rusty at others.
- Running case: the support team. Their prompt gets the three-line house format right about
  four times in five, and the drafts sometimes drift in tone. That is a behaviour gap where
  fine-tuning can fit, once better prompting has been tried and measured. The product facts
  stay in retrieval.
- For idea 3, keep the safety point concrete and calm: it is a known effect, not a reason to
  never fine-tune; the answer is to test safety after tuning, not to assume it survived.
- Misconception: "fine-tuning makes the model smarter". It makes it more specialised; general
  ability does not go up and can go down.
- Misconception: "adapters are a cheap imitation". For many narrow tasks they are the normal
  choice; quality has to be measured either way.
- Experienced learners may ask about specific preference methods: methods that learn directly
  from preference pairs, without a separate reward model, exist and are widely used. Name the
  idea, not a ranking of methods.
- Do not quote costs, minimum dataset sizes, or which providers offer which kind of training.
- Pacing: ideas 2 and 3 matter most for decisions; idea 4 can be quick for learners who will
  not run training themselves.

## Check your understanding
1. In your own words, what does supervised fine-tuning change in a model, and what do you get at the end?
   Good answer: it continues training on input and ideal-output pairs, adjusting the model's numbers so its outputs look more like the examples; the result is a new model version you call instead of the original.
2. The support team's prompt gets the house format right four times in five, and they have already improved the prompt and measured it. Is fine-tuning a good fit? What would you keep out of it?
   Good answer: yes, a consistent format and tone is a behaviour gap fine-tuning handles well and may shorten the prompt; keep product facts out of the training and in retrieval.
3. Why should you re-run safety and general tests after fine-tuning a model on harmless support replies?
   Good answer: fine-tuning can weaken the safety behaviour trained by the provider, even with harmless data, and can degrade other abilities (catastrophic forgetting); the task score alone will not show this.
4. A company wants five differently styled assistants for five products on the same base model. Why might adapters suit them better than five full fine-tunes?
   Good answer: adapters train a small add-on per task over a frozen base, so they are much cheaper to train and store, can be swapped per product over one shared model, and often reach similar quality; it still has to be measured.

## Completion criteria
The learner answers the checks correctly, explains what fine-tuning changes, picks behaviour
gaps rather than knowledge gaps for it, and names the side effects to test for (checks 1-4).

## Going further
- Topics: catastrophic forgetting, low-rank adaptation (LoRA), preference optimisation, the
  effect of fine-tuning on safety training.
- Next lesson: what makes good training data.
