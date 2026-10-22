---
id: how-ai-models-work/05-reasoning-models
title: "Reasoning models: thinking before answering"
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what a reasoning model does differently from a standard one
  - Decide when a reasoning model is worth its extra time and cost
  - State limits of visible reasoning
prerequisites:
  - how-ai-models-work/04-post-training
---

## Key ideas
1. **A standard model answers in one go; a reasoning model writes out its work first.**
   Before the final answer, it produces a long stretch of intermediate text (planning,
   trying approaches, checking itself). That text is generated token by token like any
   other, and it gives the model room to work in steps instead of jumping to an answer.
   Most products do not show you this text as it was written: they show a summary of it, or
   nothing.
2. **Why writing steps helps.** Each token is produced with a fixed amount of computing.
   A hard problem cannot be solved in a single token, but it can be solved across
   hundreds, each building on the previous ones. This is why asking a standard model to
   "think step by step" often helps too.
3. **They are trained for it.** Reasoning models are typically given extra training on
   problems whose answers can be checked, such as maths puzzles and code that must
   pass tests, and rewarded when the final answer is right. Over time they pick up habits
   such as re-checking their work and trying another path when one looks wrong.
4. **The price is time and tokens.** The thinking text takes time to generate and usually
   counts toward the cost. A quick lookup or a short email gains almost nothing from it.
   Multi-step maths, tricky code, planning with constraints and careful analysis gain
   the most.
5. **Visible reasoning is a tool, not proof.** Any displayed steps (usually a summary of the
   model's work, not the raw text) can be useful to read and to check, but they are not a
   guaranteed record of how the model really reached the answer, and a reasoning model can still reach a wrong answer with convincing steps.
   Check the result, especially when stakes are high.
6. **Often you can choose the effort.** Many tools let you pick how much to think, or
   switch it on only for hard questions. Match effort to difficulty.

## Teaching notes
- Analogy: answering "17 times 24" instantly versus on a sheet of paper. Same person,
  same brain, but the paper lets them go through steps. Reasoning models are given the paper.
- Demo: ask the learner a small multi-step puzzle (for example a scheduling puzzle with
  three constraints), then ask if they would answer it instantly or write things down.
- Misconception: "a reasoning model is simply smarter at everything". It is better at
  multi-step problems, and costlier and slower on simple ones; for creative or casual
  writing the gain is small.
- Misconception: "I can read its thoughts, so I know why it said that". Present
  idea 5 calmly: the steps are helpful, not a window into a mind. Many assistants show only a
  summary of the thinking, or hide it; do not promise the learner they can read all of it.
- Do not name specific models, versions, benchmarks or prices.
- Beginners: focus on ideas 1, 4 and a simple rule of thumb ("use it for hard,
  multi-step tasks"). Advanced learners: discuss training on checkable answers and
  why it works best where answers can be verified.
- Pacing: finish with the applied question, it is the part they will reuse.

## Check your understanding
1. What does a reasoning model do before it gives its final answer, and why can that help?
   Good answer: it produces intermediate steps (planning, trying, checking), giving the
   model room to solve in stages instead of in a single leap.
2. Name one task where a reasoning model is worth the extra wait and one where it is not.
   Good answer: worth it for multi-step maths, debugging, planning with constraints;
   not for a quick fact, a short rewrite or casual chat.
3. A reasoning model shows clear, confident steps ending in an answer. Does that prove the
   answer is correct? What would you do?
   Good answer: no; steps can look convincing and still be wrong or not reflect the real
   process; verify the result independently, especially for important decisions.

## Completion criteria
The learner can explain writing steps as the difference, choose when to use a reasoning
model, and say why its visible steps do not prove correctness (checks 1-3).

## Going further
- The "What prompting cannot fix" lesson of *Prompting Basics* shows other tasks (exact
  counting, precise calculation) where predicting text reaches its limits.
- The "Where agents fail" lesson of *AI Agents and Tools* shows what happens when plans go wrong.
