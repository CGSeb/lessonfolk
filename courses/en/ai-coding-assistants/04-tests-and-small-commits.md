---
id: ai-coding-assistants/04-tests-and-small-commits
title: Tests and small commits as a safety net
level: intermediate
estimatedMinutes: 20
objectives:
  - Use tests to check AI changes automatically
  - Use small commits and diffs so every AI change is easy to review and undo
  - Spot when an assistant "fixes" a failing test instead of the code
prerequisites:
  - ai-coding-assistants/03-reviewing-ai-code
---

## Key ideas
1. **Tests turn "looks right" into "is checked".** Reviewing by eye misses things; a test
   suite checks the behaviour every time. With an assistant producing code quickly, tests
   are what let you accept changes with confidence. Agent-style tools can also run the tests
   themselves and fix what fails, which makes them far more reliable.
2. **Write or agree the tests first when you can.** Describe the behaviour as tests (or ask
   the assistant for tests, then review them before any implementation). The tests become
   the done criteria from lesson 2, written in code. Then the assistant's job is clear:
   make them pass without changing them.
3. **Watch for the test that gets "fixed".** When a test fails, an assistant may change the
   test instead of the code: loosening an assertion, skipping the test, or updating the
   expected value to whatever the code returns. Always check whether a diff touches tests,
   and why.
4. **Commit before, commit small.** Start each task from a clean state (everything
   committed), so the assistant's change is exactly what the diff shows. Commit each step
   that works before the next one. If a step goes wrong, you can discard it in seconds
   instead of untangling it.
5. **The diff is your review surface.** Look at the diff of every AI change before
   committing it, as you would a pull request. Small, focused diffs are fast to review; a
   huge one is a sign the task was too big (lesson 2), and it is often better to throw it
   away and split the task.

## Teaching notes
- Analogy that works: **climbing with a rope and anchors**. Tests are the rope, commits are
  the anchors: if you slip, you fall back to the last anchor, not to the ground. Climbing
  fast (with an assistant) makes anchors more important, not less.
- Misconception: "AI makes tests less necessary because it writes correct code". The
  opposite: more code, written faster, needs more automatic checking.
- Misconception: "the assistant wrote the tests, so the code is tested". Tests written from
  the same misunderstanding as the code will confirm the mistake. Review what the tests
  check, and add the cases that matter to you.
- Throwing away a bad attempt is normal and cheap with a clean git state; encourage it over
  endless back-and-forth on a broken change.
- Learners who do not write tests yet: start from one simple test for one function, in the
  test tool their project already uses. Do not teach a testing framework here.
- Learners new to git: the minimum is "commit before asking, look at the diff, discard if
  bad". Name the commands of their tool only if they ask.

## Check your understanding
1. After a change, the assistant reports "all tests pass". Its diff includes edits to two test files. What do you check?
   Good answer: whether the test edits are legitimate (new behaviour requested) or weaken the tests (looser assertions, skipped tests, expected values changed to match the code); a test changed just to pass hides a bug.
2. Why start each AI task from a clean, committed state?
   Good answer: the diff then shows exactly what the assistant changed, and a bad change can be discarded instantly by going back to the last commit.
3. The assistant produced a 1,500-line diff for what you thought was a small task. What is a sensible reaction?
   Good answer: do not try to review it all; discard it, and split the task into smaller steps with clearer done criteria (or ask for a plan first).

## Exercise
Needs a computer, a project under git with a test runner, and any coding assistant. Commit
everything, then write (or ask for and review) two or three tests for a small function you
want, including one edge case. Ask the assistant to implement the function so the tests pass
without changing the tests. Review the diff, commit, and tell the tutor what you checked.

## Completion criteria
The learner answers the checks correctly and can describe a loop of clean state → tests →
AI change → diff review → commit, including how to spot a weakened test.

## Going further
- Test-driven development (TDD), a practice that fits AI-assisted coding well.
- Next lesson: keeping secrets and private code safe.
