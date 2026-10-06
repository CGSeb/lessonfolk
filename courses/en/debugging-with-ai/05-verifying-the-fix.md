---
id: debugging-with-ai/05-verifying-the-fix
title: Verifying the fix
level: intermediate
estimatedMinutes: 20
objectives:
  - Reproduce a bug reliably before fixing it
  - Turn the reproduction into a test that fails before the fix and passes after
  - Check for regressions and for the same bug elsewhere before calling it done
prerequisites:
  - debugging-with-ai/04-root-cause-or-symptom
---

## Key ideas
1. **No reproduction, no proof.** If you cannot make the bug happen on demand, you cannot
   show that a fix removed it: it may simply not have happened this time. Get a reliable
   reproduction first (lesson 1's minimal reproduction is a good start). For bugs that
   appear only sometimes, find the condition that triggers them before fixing anything.
2. **Turn the reproduction into a failing test.** Write a test that reproduces the bug and
   fails for the right reason: the same wrong value or error you saw. This is a
   **regression test**: once the bug is fixed, it guards against the bug coming back. The
   assistant can draft it; you check that it really reproduces your bug.
3. **See it fail, then see it pass.** Run the test before the fix: it must fail. Apply the
   fix: it must pass, without the test being changed. A test that passed before the fix
   proves nothing, because it never caught the bug in the first place.
4. **Check around the fix.** Run the whole test suite, not just the new test, to catch
   regressions (things the fix broke elsewhere). Ask the assistant: "Where else in this
   codebase could the same mistake exist?" The same wrong assumption often appears in
   several places.
5. **Clean up and explain.** Remove the temporary prints, logs and experiments from your
   debugging. Then explain the bug and the fix in a sentence or two, in your own words: the
   cause, why the fix addresses it, how the test proves it. If you cannot, you are not
   finished; this is also a good commit message.

## Teaching notes
- Analogy that works: **a plumber fixing a leak**. They first make the drip happen (turn the
  tap on), fix the joint, then run the water again and check the other joints along the
  same pipe. "It's not dripping right now" is not proof.
- This lesson builds on tests as a safety net from AI Coding Assistants in Practice; recall
  it in one sentence and focus on what is specific to a bug: reproduce first, a test that
  fails for the right reason, see it fail then pass.
- Misconception: "the assistant said it's fixed". The assistant may not have run anything,
  and even agent-style tools sometimes report success too early. Proof is a test you saw
  fail and then pass.
- Misconception: "a bug too small for a test". A one-line test is usually enough, and it is
  the cheapest insurance against the bug coming back after a later change.
- For bugs that are hard to test automatically (visual glitches, timing issues), accept a
  written manual reproduction with exact steps, run before and after the fix.
- Learners who do not write tests yet: start with one test for one function in the test tool
  their project already uses; do not teach a testing framework here.

## Check your understanding
1. Why must you see the new test fail before applying the fix?
   Good answer: it proves the test actually reproduces the bug; a test that already passes before the fix would pass anyway and proves nothing about the fix.
2. The assistant fixed the bug and the new test passes. What else do you check before calling it done?
   Good answer: the whole test suite still passes (no regressions), the test was not changed to pass, the same mistake does not exist elsewhere, and temporary debug code is removed.
3. A bug happens only sometimes. Why is fixing it straight away risky?
   Good answer: without a reliable reproduction you cannot tell whether the fix worked or the bug just did not occur this time; first find the condition that triggers it.

## Exercise
Needs a computer with Python (or the language you use) and its usual test tool; an assistant
is optional. Take the bug from an earlier exercise in this course, or one of your own. Write
a test that reproduces it and run it: confirm it fails for the right reason. Fix the bug (or
ask an assistant to, without touching the test), run the test and then the whole suite. Ask
the assistant where else the same mistake could exist. Finish with a two-sentence
explanation of the bug and fix, and share it with the tutor.

## Completion criteria
The learner answers the checks correctly and can describe the loop of reproduce → failing
test → fix → test passes → full suite → clean up → explain, including why the test must fail
first.

## Going further
- Regression testing and test-driven development (TDD), which share the "fail first" habit.
- Next lesson: what to do when the assistant is stuck or confidently wrong.
