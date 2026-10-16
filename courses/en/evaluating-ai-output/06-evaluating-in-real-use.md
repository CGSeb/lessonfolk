---
id: evaluating-ai-output/06-evaluating-in-real-use
title: Evaluating in real use
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain why checks before launch are not enough and how real use feeds evaluation
  - Describe how to judge multi-step agents, not only final answers
  - State what an evaluation cannot tell you, and when people must stay in charge
prerequisites:
  - evaluating-ai-output/05-comparing-and-regressions
---

## Key ideas
1. **Real users bring cases you did not foresee.** A test set is a guess about the future. Once
   an AI tool is in use, look at real exchanges (with respect for privacy), at signals such as
   corrections, complaints, thumbs down and people asking for a human, and at what users
   do next. This shows where it really falls short.
2. **Turn every real failure into a test case.** When something goes wrong in use, add that
   case to the test set, with a note on what good looks like. The set grows from reality, the
   same mistake is caught next time, and old problems cannot return unnoticed.
3. **Judge agents on the outcome and on the path.** An agent that uses tools in several steps
   (covered in *AI Agents and Tools*) can reach a right result by a bad route, or a wrong one by
   a reasonable route. Check whether the goal was reached, and also which tools it used, whether it
   skipped checks, took risky actions, looped or spent too much. Errors compound over steps (see
   "Where agents fail" in that course), so look at each step.
4. **Where being wrong is costly, people stay in charge.** For health, law, money, or decisions
   about people, an evaluation helps choose and monitor a tool, but it does not replace review of
   important outputs. Scores are an input to human judgement, not a replacement for it.
5. **Know what an evaluation cannot tell you.** It measures only what you thought to include. A
   high score does not mean "safe" or "works everywhere", and it ages as use and models change.
   Small checks, repeated often, beat a big one done once. Keep the effort in proportion to the
   stakes.

## Teaching notes
- Analogy: a restaurant inspection before opening, versus listening to the customers and the
  kitchen every week afterwards. Both are needed, and the complaints of the second improve the
  first.
- Scenario to reason through with the learner (nothing to set up): an internal assistant launched
  with a good test score. After a month, staff report that it gives out-of-date holiday rules.
  Ask what the team should do with this report, and what it says about the test set.
- Second scenario: an agent books meetings for a team and its final calendar looks right. Ask what
  else the team should check in the steps it took.
- Misconception: "we tested it before launch, so we are done". Use shifts, and the world changes.
- Misconception: "a good score means it is safe". A score covers what was tested, nothing more.
- Respect privacy: real conversations may hold personal data, so reviewing them needs a legitimate
  reason, minimum access and care (see *Using AI Safely and Wisely*).
- Beginners to the course: ideas 1, 2 and 5. Experienced learners: ideas 3 and 4, with examples from
  their own tools.
- Do not name monitoring products or give metrics thresholds.
- Pacing: close with the two scenarios, they tie the whole course together.

## Check your understanding
1. Why is a good score before launch not enough?
   Good answer: the test set is a guess about use; real users bring unforeseen cases, and models and
   needs change, so quality has to be watched in real use.
2. Staff report a wrong answer from the assistant. What should happen with that report?
   Good answer: investigate it, fix what caused it, and add it as a new test case with the expected
   good behaviour so the mistake is caught in future checks.
3. An agent reached the right final result, but you find it used a tool it should not have, with
   customer data. Why does that matter, and what does it show about evaluating agents?
   Good answer: a right outcome can hide a risky path; agents must be judged on the steps and tool
   use as well as the final answer.
4. Give one situation where you would not rely on an AI judge and score alone, and say why.
   Good answer: high-stakes content such as medical, legal, financial or decisions about people,
   because errors are costly, scores can be wrong or miss cases, and a person must review.

## Completion criteria
The learner can explain how real use feeds the test set, judge agents on outcome and path, name
situations that need human review, and state the limits of an evaluation (checks 1-4).

## Going further
- The "Guardrails and human oversight" lesson of *AI Agents and Tools* covers keeping people in
  charge of agent actions.
- The "Where agents fail" lesson of the same course explains how errors compound over steps.
