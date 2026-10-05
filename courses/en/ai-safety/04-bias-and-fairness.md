---
id: ai-safety/04-bias-and-fairness
title: Bias and fairness
level: beginner
estimatedMinutes: 15
objectives:
  - Explain where bias in AI comes from
  - Recognise bias in AI answers
  - Reduce its effect when using AI
prerequisites:
  - ai-safety/03-privacy
---

## Key ideas
1. **Bias here means a systematic slant.** An AI is biased when its answers lean unfairly
   one way again and again: favouring some groups, views or places over others, or
   repeating stereotypes.
2. **It comes from the data and the choices behind the model.** Models learn from text and
   images made by people, and that data contains stereotypes, imbalances and gaps (some
   languages, countries and groups are much less represented). The people building the
   model also make choices that shape its behaviour. The model picks up patterns, including
   unfair ones.
3. **It often hides in default assumptions.** Ask for a story about a doctor and a nurse, and
   notice who is assumed to be a man or a woman. Ask for "a typical family" or "a
   professional outfit" and notice whose culture is the default. No one asked for a
   stereotype; the model filled the gap with the most common pattern.
4. **It matters most when decisions affect people.** A slanted holiday suggestion is minor.
   Using AI to screen job applications, judge loans or assess people can turn bias into real
   harm, at scale. Those uses need human judgement and careful checking.
5. **You can reduce its effect.** Notice defaults, ask for other perspectives ("how would
   this look in another country / for another group?"), give the details you actually want
   instead of letting the model assume, and keep a human in charge of decisions about people.

## Teaching notes
- Analogy that works: **a mirror that exaggerates**. The model reflects the data it learned
  from, with its imbalances, and can make the most common patterns look even more "normal"
  than they are.
- Demo: generate a short scene with a few unnamed professionals in the chat and look at the
  assumptions together. You may write a balanced answer; if so, discuss why models can still
  lean on defaults, and that developers try to reduce bias without fully removing it.
- Stay factual and non-political: the lesson is about noticing patterns and fairness to
  people, not about taking sides on debated topics.
- Misconception: "computers are neutral, so AI is objective". AI learns from human data and
  human choices; it is not automatically neutral.
- Misconception: "bias has been fixed". Developers work to reduce it, but it can still show
  up, in obvious or subtle ways. Do not claim any model is or is not biased.
- For experienced learners, discuss the gap issue (idea 2): less-represented languages or
  regions often get weaker or more generic answers.
- Pacing: ideas 3 and 5 are the practical core; spend time on concrete examples.

## Check your understanding
1. Where does bias in an AI model come from?
   Good answer: mainly from the human-made data it learned from (stereotypes, imbalances, gaps), plus choices made by the people building it.
2. Give an example of how bias can appear in an AI answer even when nobody asked for it.
   Good answer: a default assumption, e.g. assigning genders to jobs, assuming one culture or country as "normal", or giving weaker answers for less-represented languages or groups.
3. A company wants to use AI to automatically reject job applications. What concern would you raise, and what would you suggest?
   Good answer: the AI may repeat biases from its data and unfairly reject some groups, at scale; decisions about people need human review and checking for unfair patterns.

## Exercise
Needs a chat assistant (this one works) — free. Ask it for a short story or description
involving several people in jobs or roles, without giving genders, ages or backgrounds. Look
at what it assumed. Then ask it to rewrite with different assumptions, and discuss with the
tutor what you noticed.

## Completion criteria
The learner answers the checks correctly, in particular explaining that bias comes from
human data and choices and that decisions about people need human oversight.

## Going further
- Next lesson: copyright, attribution and honest use of AI-made content.
