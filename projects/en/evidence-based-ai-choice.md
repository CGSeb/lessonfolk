---
id: evidence-based-ai-choice
title: Choose an AI tool with evidence
level: intermediate
theme: using-ai
authors: [lessonfolk]
description: Compare two AI options for a task you really do, on a small set of real test cases scored against written criteria, and make a choice you can explain.
estimatedHours: 3
buildsOn: [evaluating-ai-output, prompting-basics]
needs:
  - Two AI chat apps or two models to compare, or one app and two versions of a prompt (free plans are enough)
  - A spreadsheet or a document with a table to record scores
  - A task you do with AI, or would like to, that comes back often
---

## Brief
You have a choice to make for a task you really do: two AI chat apps, two models in the same
app, or your current prompt and a new version of it. Instead of picking the one that "looked
better" on one try, you will build a small test of your own, score both options on it and make
a decision you can explain to someone else.

You choose the task, the two options, the criteria and the test cases. Your tutor is your
coach: it asks questions, points out what could make the comparison unfair and reviews your
results with you, but it will not write your criteria, your cases or your conclusion.

Your test cases should come from real use, but never paste personal or confidential
information into an AI app: remove or change names, numbers and anything private first.

## Milestones
1. **Define what a good answer is.** Write down what a result must have for you to use it,
   as criteria that someone else could check.
   Done when: the learner shares 3 to 5 criteria for their task, each one observable (they can
   say how they would tell a pass from a miss), and says which ones are must-pass and which
   are nice-to-have.
2. **Build the test set.** Collect real cases for the task, varied enough to show where an
   option breaks, and note for each what a good answer must contain or avoid.
   Done when: the learner shares at least 8 disguised cases that include typical ones and at
   least two hard ones (messy, ambiguous, very long or unusual), each with a short note of what
   good looks like.
3. **Choose how to score.** Decide, for each criterion, whether you check it with a simple
   rule, by reading it yourself, or with an AI judge, and how you will record the result.
   Done when: the learner names a scoring method for every criterion with a reason, and shows
   the empty table (cases in rows, criteria for each option in columns) they will fill in.
4. **Run the comparison.** Run both options on every case under the same conditions, and
   fill in the table.
   Done when: the learner shares the filled table for both options on all cases, says what was
   kept the same between the two runs, and lists the cases where one option fails a must-pass
   criterion.
5. **Decide and plan the next run.** Make a choice backed by the results, say what the test
   cannot tell you, and decide when to run it again.
   Done when: the learner states their choice (or "no clear difference") with the results that
   support it, names at least one limit of their test, and names at least one event that would
   make them run it again.

## Coaching notes
- **Coach, do not decide.** Never write the criteria, the cases or the conclusion for the
  learner. When they are stuck, go up a ladder of help: first a question ("what would make you
  send this answer without editing it?"), then point to the idea (covered in Evaluating AI
  Output), and only then a short example on a different task than theirs.
- **Pick a fair pair.** In milestone 1 or before, check what the two options are. Comparing
  two prompts on two different models changes two things at once: suggest keeping one of them
  fixed (covered in "Comparing versions and catching regressions" of Evaluating AI Output).
- **Milestone 1: vague criteria.** "Clear", "good tone" or "accurate" alone cannot be scored.
  Ask how they would tell a pass from a miss, and push for wording anyone could apply. A
  must-pass criterion is one where a miss makes the answer unusable however good the rest is.
- **Milestone 2: cases that all look alike.** Tidy cases written for the test flatter both
  options. Encourage cases from real use with their mess, and at least two hard ones. If the
  learner is improving a prompt, suggest keeping two or three cases aside that they never
  adjust the prompt against, to check the final version.
- **Milestone 3: trusting an AI judge blindly.** If the learner uses an AI judge, ask them to
  give it the rubric, to swap the order when it compares two answers, and to score a few cases
  themselves first to see whether the judge agrees. Known judge biases (preferring longer
  answers, the first or last answer shown, or a style like its own) are covered in "Scoring:
  checks, people and AI judges". A rule is enough for format, length or a required mention.
- **Milestone 4: an unfair run.** Watch for options run on different days with different
  instructions, a chat that already holds earlier messages, or settings changed for one side
  only. A fresh conversation for each case keeps one answer from leaking into the next.
- **Milestone 5: a winner from noise.** With about ten cases, a gap of one or two cases may be
  luck, and answers vary from one run to the next. If the gap is small, encourage running the
  closest cases again, or concluding "no clear difference" and choosing on something else
  (cost, ease, privacy). One failure on a must-pass criterion can outweigh several small gains.
- **What the test cannot tell.** Steer the limit toward real ones: only the situations they
  thought of, a small set, a single run, one person's judgement. Events that call for a new
  run include a model update or change, a prompt change, new kinds of input, or people saying
  the results feel different.
- **High stakes.** If the task touches health, law, money or decisions about people, say that
  the test helps choose a tool but does not replace checking important answers by hand.
- **Privacy** (covered in Using AI Safely and Wisely): if the learner pastes names, client
  data or anything private, stop and ask them to disguise it first. Never repeat it back.
- **Learners who have not done the course** may need the core ideas as they go: one short
  explanation per milestone, then back to their task. **Experienced learners** can add more
  cases, run each option twice, or compare their own scores with a second person's.
- **Pacing.** The project fits two or three sessions; milestone 4 takes the longest. Save notes
  after each milestone so the next session starts where this one stopped. You only see what
  the learner pastes: ask for the criteria, the cases and the table instead of assuming.

## Review
1. The criteria are observable, fit the task, and separate must-pass from nice-to-have.
2. The test set comes from real use, is varied, includes hard cases, and says what good looks
   like for each case.
3. Each criterion has a scoring method that suits it, and any AI judge was checked against the
   learner's own scores.
4. The two options were compared fairly: the same cases, the same criteria and the same
   conditions, with one thing changed.
5. The decision follows from the results, treats small gaps with caution, names a limit of the
   test and says when to run it again.
6. The test cases contained no personal or confidential information, or it was disguised
   first.

## Going further
- Keep the test set and the table, and run them again the next time the model or your prompt
  changes; note what moved.
- Each time an option fails in real use, add that case to the test set with what good looks
  like.
- Ask a colleague to score a few answers with your criteria, and talk through where you
  disagree: it shows which criterion is still unclear.
