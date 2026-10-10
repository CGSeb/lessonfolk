---
id: ai-coding-assistants/03-reviewing-ai-code
title: Reviewing AI-written code
level: intermediate
estimatedMinutes: 25
objectives:
  - Recognise the typical failures of AI-written code
  - Review an AI change with a short, repeatable checklist
  - Explain why you stay responsible for code you accept
prerequisites:
  - ai-coding-assistants/02-splitting-the-work
---

## Key ideas
1. **You own every line you accept.** AI-written code goes into your project, your reviews
   and your production under your name. "The AI wrote it" does not explain a bug. Review it at
   least as carefully as code from a new teammate.
2. **Made-up APIs and packages.** The model produces likely text (see
   hallucinations in Using AI Safely and Wisely). In code that means functions, options or whole
   packages that look plausible but do not exist, or exist with a different signature.
   Check every unfamiliar import and API call against the documentation, and never install
   a package just because the assistant named it: an unknown package can even be a malicious
   one registered under a name assistants tend to invent.
3. **Outdated or mixed versions.** The model learned from code written over many years. It
   may use a deprecated API, an old framework pattern, or mix two major versions of a
   library in the same file. Compare with the versions in your project.
4. **Security holes that work fine.** Code can pass every manual test and still be unsafe:
   missing input validation, SQL or HTML built by string concatenation (injection), missing
   authorization checks on an API route, secrets in client-side code, overly permissive
   CORS. Assistants often write the "happy path" and skip these unless asked.
5. **Plausible but wrong, and more than asked.** Watch for logic that looks right but
   mishandles edge cases (empty lists, time zones, off-by-one), errors swallowed silently,
   tests that check nothing meaningful, and unrequested changes: renamed variables,
   reformatted files, "improvements" elsewhere, deleted code. Read the whole diff, not just
   the part you asked for.

## Teaching notes
- Analogy that works: **a confident intern's pull request**. Often good, sometimes subtly
  wrong, always written with the same assurance. You review the intern's work line by line;
  give the assistant the same treatment.
- Suggest a short checklist the learner can reuse: Does it do what I asked, and only that?
  Do all imports and APIs exist in my versions? What happens with bad or empty input? Who is
  allowed to call this? Do the tests test something real?
- Misconception: "if it runs, it's fine". Running proves little about security, edge cases
  or maintainability.
- Misconception: "I can ask the AI to review its own code instead". A second pass by the
  assistant (or another model) can catch some issues and is worth doing, but it shares the
  same blind spots; it complements your review, it does not replace it.
- Keep the "malicious package" point factual and calm: the risk is that attackers publish
  packages under names that assistants commonly invent. Do not name specific incidents or
  give numbers.
- For web developers, pick examples close to their stack (an Express or Next.js route
  without an auth check, `innerHTML` with user input, a fetch without error handling).
- This lesson is the longest; check engagement after idea 2 and after idea 4.

## Check your understanding
1. The assistant uses `import { formatRelative } from "date-utils-pro"`, a package you have never heard of. What do you do before running it?
   Good answer: check that the package exists, is the one you expect and is trustworthy (registry page, documentation, maintainers), and that the function exists with that signature; never install it blindly, since invented names can be squatted by malicious packages.
2. An AI-written API route works perfectly in your manual tests. Name two things that could still be wrong with it.
   Good answer: any two of missing input validation, missing authorization check, injection (SQL or HTML built from user input), swallowed errors, unhandled edge cases, outdated or deprecated API usage, unrequested changes elsewhere.
3. Why should you read the whole diff, not only the function you asked for?
   Good answer: assistants sometimes make unrequested changes (renames, reformatting, deleted code, edits in other files) that can break things or hide in a large change.
4. A bug in AI-written code you merged reaches production. Who answers for it, and what does that mean for how you review?
   Good answer: you do; code you accept goes in under your name and "the AI wrote it" explains nothing, so you review it at least as carefully as a new teammate's code.

## Exercise
Needs a computer and any coding assistant. Ask the assistant for a small web feature that
handles user input, for example "an API route that saves a comment for a blog post". Review
the result with the checklist from the teaching notes and list every issue you find. Share
the list with the tutor; then ask the assistant to fix the issues and review the new diff.

## Completion criteria
The learner answers the checks correctly and can name, without help, at least four kinds of
failure to look for in AI-written code, including one security issue.

## Going further
- The OWASP Top 10, a well-known list of common web application security risks.
- Next lesson: tests and small commits, so reviews are easier and mistakes are cheap to undo.
