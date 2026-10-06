---
id: ai-coding-assistants/05-secrets-and-private-code
title: Secrets and private code
level: intermediate
estimatedMinutes: 20
objectives:
  - Identify where secrets and private data can reach a coding assistant
  - Keep secrets out of prompts and out of AI-written code
  - Know what to do when a secret leaks
prerequisites:
  - ai-coding-assistants/04-tests-and-small-commits
---

## Key ideas
1. **Coding assistants see more than what you type.** What you send goes somewhere (covered in
   Using AI Safely and Wisely). With code, the tool may also send open files, files
   it searches or reads, and the output of commands it runs. A `.env` file, a config with a
   database password, or a log full of customer emails can reach the model without you ever
   pasting it.
2. **Know what your tool can read and what your company allows.** Check which files the tool
   can access, whether it can be told to exclude some (many tools offer an ignore setting or
   follow `.gitignore`, but check yours), and how your plan or account handles your code.
   Many companies have rules on which AI tools may see which code; follow them.
3. **Strip secrets and personal data before sharing.** Stack traces, logs, request dumps and
   failing test outputs often contain tokens, cookies, emails or IDs. Replace them with fake
   values before pasting. Use fake or generated data in fixtures and examples, never real
   customer records.
4. **Don't let secrets into the code it writes.** Assistants sometimes hardcode a key "to
   make it work", put it in client-side code, or log it. For web apps, remember that anything
   shipped to the browser (including environment variables exposed to the front end by your
   framework) is public. Keys belong in server-side environment variables or a secrets
   manager, and secret files belong in `.gitignore`.
5. **If a secret leaks, revoke it.** A key that was pasted into a chat, committed or shipped
   to the browser must be treated as compromised. Revoke or rotate it at the provider, then
   clean up. Deleting the commit is not enough: the key stays in git history, forks, caches
   and possibly logs.

## Teaching notes
- Analogy that works: **a contractor working in your office**. You are happy for them to see
  the code they work on, but you would not leave the safe open or hand them the customer
  files "just in case". Decide what is in the room before they start.
- Do not repeat the general privacy lesson; recall it in one sentence and focus on what is
  specific to code: files read automatically, command output, logs, `.env`, front-end
  exposure, git history.
- Never state what a specific tool or plan does with data: it differs and changes. Point the
  learner to their tool's documentation and their company's policy.
- Misconception: "it's fine, I deleted the commit". The secret is still in history and may
  already be copied; revoking is the only real fix.
- Misconception: "environment variables are always secret". Only server-side ones; values
  bundled into front-end code are visible to anyone who opens the browser tools.
- For learners at a company, ask whether they know their AI usage policy; if not, finding it
  is a useful action point.
- Secret-scanning tools exist (in git hosts and as pre-commit hooks); mention them as a
  safety net, without naming or ranking products.

## Check your understanding
1. You never paste secrets into the chat. Name two ways a secret could still reach an agent-style assistant.
   Good answer: any two of it reads a `.env` or config file, it runs a command whose output shows a secret, it reads logs or test output containing tokens, an open file contains a key.
2. The assistant suggests putting your payment provider's secret key in a front-end environment variable so the checkout page can call the API directly. What is wrong, and what should you do instead?
   Good answer: anything sent to the browser is public, so the key would be exposed; keep it on the server and have the front end call your own server route.
3. You notice an API key was committed and pushed an hour ago. What is the first thing to do, and why is deleting the commit not enough?
   Good answer: revoke or rotate the key at the provider first; the old key stays in git history, clones, forks or caches, so removing the commit does not make it safe.

## Exercise
Needs a computer and one of your projects (no assistant required). Check three things:
which files in the project hold secrets and whether they are in `.gitignore`; whether your
coding assistant can be told to exclude files, and how; and whether any secret is used in
front-end code. Note one fix and discuss it with the tutor. Never share real secret values
with the tutor while doing this.

## Completion criteria
The learner answers the checks correctly and can name where secrets hide in a project, how to
keep them out of prompts and AI-written code, and the first step after a leak.

## Going further
- Your git host's documentation on secret scanning and removing sensitive data from history.
- Your coding assistant's documentation on data use and file exclusion.
- Next lesson: deciding when to drive and when to delegate.
