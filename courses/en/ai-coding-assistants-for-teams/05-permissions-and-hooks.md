---
id: ai-coding-assistants-for-teams/05-permissions-and-hooks
title: "Guardrails: permissions and hooks"
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain why instructions alone cannot guarantee a rule is followed
  - Use permissions to limit what an assistant may do
  - Use hooks and CI to enforce rules automatically
prerequisites:
  - ai-coding-assistants-for-teams/04-commands-skills-and-plugins
---

## Key ideas
1. **Instructions guide, configuration enforces.** "Never edit `.env`" in AGENTS.md is a
   request the model will usually follow, and sometimes miss. For rules that must hold every
   time, use something the tool or the pipeline checks, which does not depend on the model
   paying attention.
2. **Permissions decide what the assistant may do.** Agent-style tools ask before risky
   actions, and let you set rules: commands it may run without asking (`npm test`), actions
   that are always refused (reading secret files, `git push`, deleting folders), folders it may
   edit. Many also run commands in a **sandbox** that limits file and network access. Fewer
   prompts for safe actions and hard limits for dangerous ones beat clicking "allow" on
   everything.
3. **Hooks run your scripts at fixed moments.** A **hook** is a command the tool runs
   automatically at a given point: before a tool is used, after a file is edited, at the end
   of a task. Typical uses: format a file after each edit, block edits to protected paths,
   run the fast tests before the assistant reports "done", send a notification. A hook does
   not rely on the model remembering.
4. **Shared settings and personal settings.** Most tools have a settings file you can commit
   so the whole team gets the same permissions and hooks, and a personal or local file for
   individual preferences. Team guardrails go in the committed file and are reviewed like
   code.
5. **CI is the last gate.** Whatever happens on a laptop, the continuous integration pipeline
   (tests, linter, secret scanning, required reviews) checks every change before it merges,
   whoever or whatever wrote it. Local guardrails catch problems early; CI makes sure none
   slips through.

## Teaching notes
- Analogy that works: **a sign versus a lock**. "Staff only" on a door is an instruction most
  people respect; a badge reader is enforcement. Use signs for preferences, locks for what
  must never happen.
- Live example: in the LessonFolk repository, `CLAUDE.md` asks the assistant to run
  `npm test` before committing. That is an instruction, not enforcement. Show it, then ask the
  learner what would make it reliable (a hook that runs the tests before the task ends, a CI
  workflow on every pull request) and which they would trust more. Check `.github/` first: do
  not claim the repository has CI unless you see a workflow there.
- If you are running inside a tool with permission prompts, point out the ones the learner
  has seen in this session: they are idea 2 in action.
- How tools do it, as of late 2026 (check the documentation before stating details):

  | Tool | Permissions and sandbox | Hooks |
  |---|---|---|
  | Claude Code | allow / ask / deny rules in `.claude/settings.json` (shared) and a local settings file; sandbox mode | hooks in settings (before and after tool use, at stop…), also shipped by plugins |
  | OpenAI Codex | approval modes and sandbox settings in `config.toml` | check docs |
  | GitHub Copilot | tool approvals in the editor; the cloud agent runs in a restricted environment | check docs |
  | Cursor | allow list and auto-run settings for terminal commands | `hooks.json` |
  | Gemini CLI | trusted folders, tool allow / exclude settings, sandbox | check docs |

- Misconception: "the assistant asks before everything, so it is safe". Permission fatigue is
  real: people click "allow" without reading. Allow the safe, frequent actions explicitly so
  the remaining prompts are rare and taken seriously.
- Misconception: "hooks replace CI". Hooks run on one person's machine and can be turned off;
  CI runs for everyone. Use both.
- Hooks run real commands with your access: review hook scripts, especially ones that come
  with a plugin, as carefully as any code (lesson 6).
- The AI Agents and Tools course covers guardrails and human oversight from the builder's
  side; here, stay on configuring the tool the learner uses.

## Check your understanding
1. Your AGENTS.md says "never modify files in `migrations/`", yet the assistant edited one. What would make the rule reliable?
   Good answer: enforce it outside the model: a deny permission or a hook that blocks edits to that folder, plus a CI check; the instruction alone is guidance the model can miss.
2. Give one example of a rule that fits a permission, and one that fits a hook.
   Good answer: a permission limits an action (e.g. deny reading `.env`, deny `git push`, allow `npm test` without asking); a hook runs a script at a moment (e.g. format after each edit, run tests before finishing, block edits to a path).
3. Why commit the team's permissions and hooks to the repository, and what should stay personal?
   Good answer: so everyone gets the same guardrails and changes are reviewed like code; personal preferences, convenience allowances and machine-specific paths stay in the personal or local settings.

## Exercise
Needs a computer and an agent-style coding assistant that supports permissions or hooks
(check its documentation). In a project of yours, add one permission rule (allow your test
command, or deny reading a secret file) and one hook (format files after edit, or block edits
to a protected folder). Try a task that triggers each, and show the result to the tutor.

## Completion criteria
The learner answers the checks correctly and can decide, for a given rule, whether it belongs
in the instructions, a permission, a hook or CI.

## Going further
- The AI Agents and Tools course, lesson on guardrails and human oversight.
- Your assistant's documentation on permissions, sandboxing and hooks.
