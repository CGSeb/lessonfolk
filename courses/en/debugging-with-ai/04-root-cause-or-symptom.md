---
id: debugging-with-ai/04-root-cause-or-symptom
title: Root cause or symptom?
level: intermediate
estimatedMinutes: 20
objectives:
  - Tell a fix that removes the cause from one that silences the symptom
  - Recognise the common symptom-hiding fixes assistants propose
  - Use repeated "why?" questions to reach the root cause
prerequisites:
  - debugging-with-ai/03-hypotheses-not-guesses
---

## Key ideas
1. **Making the error disappear is not the goal.** The **symptom** is what you see (a crash,
   a wrong value); the **root cause** is the reason it happens (bad data accepted upstream,
   a wrong assumption, a missing case). A fix that removes the symptom without the cause
   leaves the bug in place, usually quieter and harder to find later.
2. **Know the silencers.** Assistants are trained to give you working code, and the fastest
   way to "working" is often to hide the problem. Watch for: catching every exception and
   carrying on; a check that returns early or uses a default value when data is missing;
   removed or loosened validation; type conversions forced everywhere; added retries, delays
   or longer timeouts; and changed tests (covered in AI Coding Assistants in Practice: a
   test edited to pass hides the bug).
3. **Ask "why?" until it stops being about code.** "It crashes because `price` is empty.
   Why is it empty? Because the import keeps rows with no price. Why? Because nobody
   validates the file." The fix belongs at the deepest "why" you can act on, here the
   import validation, not the line that crashed.
4. **Some guards are right, if they are honest.** A default value or a caught exception is a
   valid design when missing data is normal and expected. The difference: a real fix
   handles the case on purpose and says so (a clear error, a log, a documented default); a
   silencer just makes the noise stop.
5. **Ask the assistant to justify the fix.** "Which cause does this change address? What
   happens now to the bad input that caused the crash? Is there a fix closer to the source?"
   A fix that cannot explain what happens to the bad case is probably a silencer.

## Teaching notes
- Analogy that works: **a smoke alarm**. Taking the battery out stops the noise; finding
  what is burning is the fix. Sometimes the alarm is oversensitive and should be moved, but
  you decide that after checking for fire, not instead.
- Show one concrete pair in Python (or the learner's language): `try: ... except Exception:
  pass` around the crashing call, versus validating the data where it is read and raising a
  clear error there.
- Misconception: "defensive code is always good". Guards that hide unexpected states make
  bugs travel further from their cause, which makes them harder to debug later.
- Misconception: "the error went away, so the fix worked". It may only have moved: the bad
  data now reaches a report, a database or a user instead of crashing.
- Do not re-teach weakened tests: one line recalling that a test changed to pass hides the
  bug, then move on. If the learner skipped AI Coding Assistants in Practice, give the idea in
  a sentence and name that course.
- Experienced learners: discuss when a guard is the right design (idea 4) using cases from
  their own work, such as optional fields or unreliable networks.

## Check your understanding
1. The assistant fixes a crash by wrapping the call in a block that catches every exception and does nothing. Why is that a problem?
   Good answer: it hides the symptom without fixing the cause; the bad data or state stays, failures become silent, and the bug resurfaces later somewhere harder to trace.
2. Name three kinds of change that can make an error disappear without fixing its cause.
   Good answer: any three of catching all exceptions, early returns or default values for missing data, removed or loosened validation, forced type conversions, retries, delays or longer timeouts, tests changed to pass.
3. An order total crashes because a discount is `None`. How do you find where the real fix belongs?
   Good answer: ask "why?" repeatedly (why is it `None`, where was it produced, why was that allowed) and fix at the deepest cause you can act on, such as where the discount is computed or the data is validated, not only where it crashed.

## Exercise
Needs a computer and any free assistant, or this chat (Python is optional). The tutor gives
you a crashing function and three candidate fixes, for example one that catches the error,
one that adds a default value, and one that fixes the data where it is created. For each,
say whether it removes the cause or silences the symptom, and what happens to the bad input.
Then ask an assistant to fix the original crash and judge its fix with the same questions.

## Completion criteria
The learner answers the checks correctly, can name the common silencers, and can explain for
a given fix which cause it addresses and what happens to the bad case.

## Going further
- The "five whys" technique, used in root cause analysis.
- "Fail fast", a design principle about surfacing problems close to their cause.
- Next lesson: proving the fix really works.
