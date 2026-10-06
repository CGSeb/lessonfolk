---
id: debugging-with-ai/02-reading-errors-together
title: Reading errors and stack traces together
level: intermediate
estimatedMinutes: 20
objectives:
  - Ask the assistant to explain an error before asking for a fix
  - Read a stack trace and tell where an error surfaced from where it started
  - Check an explanation against the code instead of taking it on trust
prerequisites:
  - debugging-with-ai/01-giving-the-assistant-what-it-needs
---

## Key ideas
1. **Explain first, fix later.** "Fix this" gets you a patch you may not understand. "Explain
   this error: what does it mean, where does it come from, what could cause it?" gets you
   understanding, which you need to judge any fix. You can always ask for the fix next.
2. **Anatomy of an error.** Most errors have a **type** (the kind of problem, such as a
   missing key or a value of the wrong type), a **message** (the details, often naming the
   value or the name involved) and a **stack trace**: the chain of function calls that were
   running when it happened, each with a file and a line number.
3. **Where it surfaced is not always where it started.** A stack trace shows where the error
   was raised, usually at one end of the trace (the bottom in Python, the top in many other
   languages). The cause is often earlier: a function that returned nothing, bad data read
   from a file, a wrong argument passed three calls up. Read the lines that belong to your
   own code first; the frames inside libraries are rarely where the bug is.
4. **Make the assistant point at evidence.** Ask it to tie its explanation to specific
   lines: "Which line of my code passes the bad value? What value do you think it has
   there?" An explanation that names a line and a value can be checked in seconds; a vague
   one ("probably a configuration issue") cannot.
5. **Learn the error, not just this one.** Ask what the error type usually means and its
   common causes in your language or framework. Next time you meet it, you will recognise it
   yourself, and you will be faster at judging the assistant's answers.

## Teaching notes
- Analogy that works: **a parcel delivered broken**. The damage was found at your door (where
  the error surfaced), but it may have happened at the warehouse (where it started). The
  tracking history, like the stack trace, tells you every stop it went through.
- Walk through one short stack trace with the learner, in the language they use. In Python,
  a `KeyError` or `TypeError: unsupported operand type(s)` raised two functions below the
  real cause works well; read it from the end, then find the first frame in their own code.
- Misconception: "the line in the error is the line to fix". Often it is only where the bad
  value finally caused trouble; the fix belongs where that value was produced.
- Misconception: "if the explanation sounds right, it is right". Assistants explain wrong
  causes with the same confidence as right ones. Check each claim against the code: does
  that line exist, does that variable really hold that value?
- Experienced learners already read stack traces; focus them on idea 4 (making the assistant
  commit to checkable claims) and on errors from unfamiliar frameworks, where the assistant
  helps most.

## Check your understanding
1. Why ask the assistant to explain an error before asking it to fix it?
   Good answer: you need to understand the problem to judge whether a fix is right; an explanation can be checked against the code, while a patch you do not understand may hide the symptom or be wrong.
2. A stack trace shows an error inside a library's date-parsing function, called from your `load_orders` function. Where do you look first, and why?
   Good answer: at the call in your own code (`load_orders`) and the value it passes, because the library is probably fine and the cause is likely the data or argument your code gave it.
3. The assistant says the error is "probably caused by a configuration problem". How do you make this answer useful?
   Good answer: ask it to point to specific evidence (which line, which value, which setting) and how to check it; a vague claim cannot be tested.

## Exercise
Needs a computer with Python (or the language you use) and any free assistant, or this chat.
Run a short buggy script the tutor gives you (for example, a function that builds a report
from a list of dictionaries, where one entry is missing a key). Before asking anything, read
the stack trace yourself and write where you think the error surfaced and where it started.
Then ask the assistant to explain the error, not to fix it, and to name the line and value
involved. Check its claims against the code, and compare with your own reading.

## Completion criteria
The learner answers the checks correctly, can read a stack trace to find the first frame in
their own code, and asks the assistant for a checkable explanation before a fix.

## Going further
- Your language's documentation on its built-in error or exception types.
- Next lesson: turning explanations into hypotheses you can test.
