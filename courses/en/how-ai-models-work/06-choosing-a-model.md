---
id: how-ai-models-work/06-choosing-a-model
title: Choosing a model
level: intermediate
estimatedMinutes: 15
objectives:
  - Name the main trade-offs when choosing a model
  - Explain the difference between open-weight and closed models and between local and cloud use
  - Compare candidate models on your own examples rather than on rankings alone
prerequisites:
  - how-ai-models-work/05-reasoning-models
---

## Key ideas
1. **There is no best model, only a best fit.** Models differ in several ways at once:
   quality on your kind of task, speed, cost, how much text they can take in, whether they
   handle images, audio or tools, and where your data goes. Improving one often costs
   another.
2. **Size is a trade-off.** In general, larger models are more capable, more expensive and
   slower; smaller ones are cheaper and faster and often good enough for simple,
   well-defined jobs such as sorting messages or rewriting text. Using the biggest model
   for everything wastes time and money.
3. **Closed or open-weight.** With a *closed* model you use it through the provider's
   service and cannot see or keep it. With an *open-weight* model the provider publishes
   the trained numbers, so anyone can download and run it, adapt it and keep it on their
   own machine. "Open-weight" is not the same as fully open source: the training data and
   code are often not shared, and licences vary, so read the terms.
4. **Local or cloud.** Running a model on your own computer keeps data in your hands and
   works offline, but needs capable hardware and usually means a smaller model. A cloud
   service gives access to the largest models, with no hardware to manage, but your text
   travels to the provider, so its data terms matter (see *Using AI Safely and Wisely*).
5. **Rankings are a starting point.** Public leaderboards and scores help shortlist
   candidates, but they measure general tasks, and models are sometimes tuned for them.
   The reliable test is a small set of real examples from your own work.
6. **Test, then re-test.** Run the same five to ten real tasks on two or three candidates,
   judge the answers on what matters to you (correct, clear, safe, fast, affordable) and
   keep the notes. Models change over time under the same name, so repeat the check when
   something feels different.

## Teaching notes
- Analogy: choosing a vehicle. A lorry, a car and a bicycle are not ranked on one scale;
  the best one depends on the load, the distance and the road.
- Demo: ask the learner for one real task they do and walk through which trade-off matters
  most for it (cost? privacy? quality?).
- Misconception: "open-weight means free and private". It means you can run it; you
  still need hardware, and it may be less capable than the largest closed models.
- Misconception: "the top of a leaderboard is the best for me". Point to idea 5.
- Do not name or rank products, give prices, sizes or release dates: this lesson must
  still be right in a year. Teach the method, not a list.
- If the learner is not a developer, keep local running to a concept; do not ask them to
  install anything.
- Pacing: the applied question is the heart of the lesson, leave enough time for it.

## Check your understanding
1. Give three things, other than raw quality, that you would compare between two models.
   Good answer: any of speed, cost, amount of text it can handle, image or tool support,
   where data goes, licence, hardware needs.
2. A company wants to classify thousands of short customer messages by topic each day and
   must keep the messages on its own servers. What would you consider and why?
   Good answer: a smaller, cheaper, faster model is probably enough for a simple task; an
   open-weight model run locally keeps data in-house; test it on real messages before deciding.
3. How would you compare two assistants for your own work without relying on a ranking?
   Good answer: pick five to ten real tasks, run them on both, judge on your own criteria
   (correctness, clarity, speed, cost), note the results, and repeat when things change.

## Completion criteria
The learner can name the main trade-offs, distinguish open-weight from closed and local
from cloud, and describe a simple test on their own examples (checks 1-3).

## Going further
- The "Handling errors, cost and latency" lesson of *How AI Apps Work* shows cost and speed
  from a developer's side.
- *AI Coding Assistants in Practice* covers working with tools for code.
