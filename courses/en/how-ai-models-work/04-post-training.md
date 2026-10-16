---
id: how-ai-models-work/04-post-training
title: "Post-training: from text predictor to assistant"
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain how a base model becomes a helpful assistant
  - Describe learning from human feedback in plain words
  - Name side effects of that training, such as flattery and over-refusal
prerequisites:
  - how-ai-models-work/03-pre-training
---

## Key ideas
1. **A base model is not yet a good assistant.** It continues text. To make it helpful, it
   gets more training afterwards, called *post-training*, on a much smaller amount of
   carefully chosen material.
2. **Step one: learn from examples of good conversations.** People write (or select) many
   example requests with ideal answers, and the model is trained to imitate them. This is
   how it learns the format of a conversation: answer the question, follow the
   instructions, stay on topic.
3. **Step two: learn from preferences.** The model produces several answers to the same
   request, people (or other AI systems guided by written principles) say which they
   prefer, and the model is adjusted to produce more answers like the preferred ones.
   With human judges this is known as *reinforcement learning from human feedback*
   (RLHF). It is easier to say "this answer is better" than to write the perfect answer.
4. **Safety behaviour is trained in the same way.** Refusing clearly harmful requests,
   admitting uncertainty and a consistent tone are all taught by examples and
   preferences, which is why assistants from different providers feel different.
5. **This training has side effects.** If judges tend to prefer agreeable, confident,
   well-formatted answers, models drift toward flattery (agreeing with you even when you
   are wrong), long answers and a sure tone. They can also refuse harmless requests that
   look like risky ones.
6. **Post-training is not the same as the instructions you give.** A system prompt or your
   own messages steer behaviour at the time of use; post-training changed the model itself,
   beforehand. You can steer within the habits it has, not remove them.

## Teaching notes
- Analogy: pre-training is school (reading everything), post-training is a job
  induction (how to behave with customers). Same knowledge, very different behaviour.
- Demo: ask the learner what a base model might reply to "What is the capital of France?"
  (it might add more quiz questions). Then show how an assistant answers it.
- Misconception: "RLHF teaches the model facts". It mostly shapes style, helpfulness and
  limits; the facts come from pre-training.
- Misconception: "the AI agrees with me, so I am right". Flattery is a known side effect;
  tell the learner to ask for counter-arguments or to present the opposite view.
- Keep out any mention of which provider uses which method, and any dates.
- Beginners: stay at the level of "examples, then votes on which answer is better".
  Experienced learners can discuss reward hacking in one sentence (the model learns what
  scores well, which is not always what is best).
- Pacing: flattery (idea 5) is the most practically useful, so leave time for it.

## Check your understanding
1. Why does the same base model feel very different once it has been post-trained?
   Good answer: it was trained on example conversations and on preferences, so it now
   answers and follows instructions instead of just continuing text.
2. In your own words, how does learning from human feedback work?
   Good answer: the model gives several answers, people (or guided AI) pick the better
   ones, and the model is adjusted to produce more answers like those.
3. You share a weak business plan and the assistant calls it excellent. Give a likely
   cause and what you would do to get a fairer review.
   Good answer: training toward agreeable answers (flattery); ask it to find weaknesses,
   take a critical role, or compare with the opposite view; do not treat praise as evidence.

## Completion criteria
The learner can describe the two post-training steps simply, and explain flattery or
over-refusal as a side effect of training on preferences (checks 1-3).

## Going further
- *Using AI Safely and Wisely* covers bias and checking answers.
- The "Role, examples and output format" lesson of *Prompting Basics* shows how to steer
  within the model's habits.
