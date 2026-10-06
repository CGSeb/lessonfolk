---
id: debugging-with-ai/03-hypotheses-not-guesses
title: Hypotheses, not guesses
level: intermediate
estimatedMinutes: 25
objectives:
  - Ask the assistant for ranked likely causes, each with a way to test it
  - Choose a cheap test for a hypothesis (logs, prints, a debugger, bisecting)
  - Change one thing at a time and let evidence decide
prerequisites:
  - debugging-with-ai/02-reading-errors-together
---

## Key ideas
1. **A guess is a fix without a reason.** Trying the assistant's patches one after another
   until the error disappears is guessing. You may land on something that hides the bug, and
   you learn nothing either way. Debugging works better as an experiment: a hypothesis, a
   test, a result.
2. **Ask for ranked causes with tests.** Instead of "fix it", ask: "List the three most
   likely causes, most likely first. For each one, how could I confirm or rule it out
   quickly?" The assistant is good at listing possible causes; you and the program decide
   which one is true.
3. **Cheap tests first.** Ways to test a hypothesis, roughly from quickest to heaviest:
   print or log the value at the suspect line; check the input data; run the reproduction
   with one variation; step through it with a **debugger** (a tool that pauses the program
   so you can inspect variables line by line). Prefer the test that rules out the most with
   the least effort, not only the most likely cause.
4. **Bisect when you are lost.** If it worked before and not now, split the search in two:
   test a version halfway between the good one and the bad one (version control tools can
   automate this over commits), or remove half the code or half the input and see whether
   the bug stays. Each step halves the search space, so even a long history narrows quickly.
5. **One change at a time, then update.** Change one thing, rerun, and note the result.
   Give the result back to the assistant ("I printed `total`: it is a string, not a
   number") and ask it to update its ranking. Evidence beats confidence, the assistant's and
   your own.

## Teaching notes
- Analogy that works: **a mechanic with a strange engine noise**. A good one does not
  replace parts at random until it stops; they list likely causes, check the cheapest first
  (is it just a loose cover?) and replace a part only once the evidence points there.
- Give the learner a prompt they can reuse: "Here is the bug [brief]. Do not fix it yet.
  List the most likely causes, ranked, with a quick test for each."
- Misconception: "asking for hypotheses is slower than asking for a fix". For simple bugs
  the first fix often works. For anything that resists one or two attempts, guessing costs
  far more time than a few targeted tests.
- Misconception: "an agent that runs the code itself does not need this". Agent-style tools
  can run tests and add prints themselves, which is useful, but they can also churn through
  many speculative edits. Ask them to state the hypothesis before each change and to revert
  changes that did not help.
- Bisecting: name the idea and the fact that version control tools can automate it over
  commits; do not teach a specific command unless the learner asks, then use their tool.
- Remind the learner to remove temporary prints and logs afterwards (lesson 5 comes back to
  this).
- This is the longest lesson; check engagement after idea 2 and after idea 4.

## Check your understanding
1. What is the difference between guessing and testing a hypothesis while debugging?
   Good answer: guessing tries fixes until the error disappears without knowing why; testing a hypothesis states a possible cause, runs a check that confirms or rules it out, and lets the result decide the next step.
2. What do you ask the assistant instead of "fix it" when a bug resists a first attempt?
   Good answer: a ranked list of likely causes, each with a quick way to confirm or rule it out.
3. A feature worked last week and is broken now, after about forty commits. You have no idea which change broke it. What approach fits?
   Good answer: bisect: test a version halfway between the good and the bad one, keep the half that contains the change, and repeat (version control tools can automate it).
4. Why change only one thing at a time?
   Good answer: so you know which change had which effect; changing several things at once makes the result impossible to interpret.

## Exercise
Needs a computer with Python (or the language you use) and any free assistant, or this chat.
The tutor gives you a script with a bug that has no error, for example a discount
calculation that gives the wrong total for some orders only. Ask the assistant for ranked
causes and a test for each, without a fix. Run the tests one at a time (prints are fine),
report each result back to the assistant, and keep a short log: hypothesis, test, result.
Stop when the evidence points to one cause, and show your log to the tutor.

## Completion criteria
The learner answers the checks correctly and can run, or describe, a loop of hypothesis →
cheap test → result → updated ranking, changing one thing at a time.

## Going further
- The scientific method, which this lesson applies to code.
- Your version control tool's documentation on bisecting.
- Your editor's or language's debugger documentation, for breakpoints and stepping.
- Next lesson: telling a root-cause fix from one that only hides the symptom.
