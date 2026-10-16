---
id: evaluating-ai-output/05-comparing-and-regressions
title: Comparing versions and catching regressions
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain how to compare two options fairly
  - Read results beyond an average, including noise and small differences
  - Describe why results must be re-checked when a model changes, and what to record
prerequisites:
  - evaluating-ai-output/04-scoring-methods
---

## Key ideas
1. **Compare like with like, and change one thing at a time.** Use the same cases and the same
   criteria for both options. If you change the prompt and the model together, you cannot tell
   which one caused the difference. Comparing is only fair when one thing changes.
2. **Look at what got worse, not only at the average.** A new version can raise the overall score
   while quietly breaking cases that matter. A case that used to pass and now fails is a
   *regression*. List regressions explicitly, and weigh them by importance: one new failure on
   a must-pass requirement can outweigh several small gains.
3. **Mind the noise.** Because answers vary from run to run, and because test sets are small, a
   small gap may be luck. If a result will drive a decision, run the cases more than once and look
   for differences that appear every time. When the gap is small, say "no clear difference"
   instead of declaring a winner.
4. **Models change underneath you.** Providers update, replace and retire models, and a name
   can stay while the behaviour moves; some let you pin a specific version, which keeps behaviour
   steadier until it is retired. So a good result last season is not a guarantee today. Re-run
   your cases when the model, its settings or the provider changes, and when users
   report that "it feels different".
5. **Keep a simple record.** Note for each run: the prompt version, the model name and version,
   the date, the scores, and the decision. This lets you go back to a version that worked, explain
   your choice to others, and notice slow drifts.

## Teaching notes
- Analogy: a school comparing two teaching methods. If one class has the method and a different
  teacher, a different year and a different test, nothing can be concluded. A change of
  one factor, tested the same way, can.
- Scenario to reason through with the learner (nothing to run): a new prompt raises the average
  score from 78 to 82, but two customers' refund questions that passed before now fail. Ask
  whether to ship it and what else they want to know.
- Second scenario: a provider announces that an older model will be retired and a newer one will
  replace it. Ask what the team should do before the switch and what it should record.
- Misconception: "a higher average means better". It hides what got worse and ignores noise.
- Misconception: "if it passed once, it is fine forever". Models, prompts and data change.
- Beginners to the course: ideas 1, 2 and 4 with the first scenario. Experienced learners: discuss
  repeated runs, weighting regressions and pinning versions.
- Do not name providers, models, version numbers or retirement dates.
- Pacing: spend most of the time on the two scenarios.

## Check your understanding
1. Why change only one thing at a time when comparing two options?
   Good answer: otherwise you cannot tell which change caused the difference; with one change, the
   result can be attributed to it.
2. A new version scores higher on average but fails three cases that used to pass. How would you
   decide whether to adopt it?
   Good answer: look at what the three cases are and how important they are (especially must-pass
   ones), weigh them against the gains, and consider fixing them before switching.
3. Your assistant worked well for months, then staff say its answers feel different. List two
   possible causes and what you would do.
   Good answer: the model behind the name was updated or replaced, or settings and data changed;
   re-run the test cases, compare with the earlier record, and pin or adapt as needed.

## Completion criteria
The learner can describe a fair comparison, read results beyond the average (regressions and
noise), and explain why to re-check and keep records when a model changes (checks 1-3).

## Going further
- The "Handling errors, cost and latency" lesson of *How AI Apps Work* looks at running a model in
  an application.
- Topic to explore: how repeated runs and confidence ranges help read small differences.
