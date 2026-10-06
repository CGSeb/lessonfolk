---
id: ai-coding-assistants-for-teams/03-scopes-layers-and-imports
title: Scopes, layers and one source of truth
level: intermediate
estimatedMinutes: 15
objectives:
  - Tell personal, project and folder-level instructions apart
  - Use path-scoped rules for parts of a codebase
  - Keep one shared source of truth across several tools
prerequisites:
  - ai-coding-assistants-for-teams/02-writing-agents-md
---

## Key ideas
1. **Three layers.** **Personal** instructions live in your home folder or your tool's
   settings and apply to all your projects (your language, your preferred style of
   explanation). **Project** instructions live in the repository and are shared with the team.
   Some tools also support **local** project files that are not committed, for your own
   notes on one project. Team rules go in the project layer; personal taste stays personal.
2. **Rules for one part of the codebase.** A monorepo's frontend and backend need different
   rules. Tools handle this with **nested files** (an `AGENTS.md` in a sub-folder, read when
   the assistant works there) or with **path-scoped rules** that declare which files they apply
   to (a pattern such as `src/api/**`). Scoped rules keep the root file short and only load
   what is relevant.
3. **Know what wins.** When layers disagree, tools usually let the most specific instruction
   win (the nearest folder over the root, the project over your personal file), but the exact
   order differs between tools. Avoid conflicts rather than relying on the order: one rule,
   one place.
4. **One source of truth.** A team using several assistants should not keep five copies of
   the same rules: they drift apart. Write the shared rules once, in AGENTS.md, and make each
   tool read it: natively, through an **import** line in the tool's own file, a setting that
   changes which file name the tool reads, or a symbolic link. Keep only tool-specific extras
   in the tool's own file.

## Teaching notes
- Live example: Apprentice does exactly idea 4. `AGENTS.md` holds the shared rules, and
  `CLAUDE.md` starts with `@AGENTS.md` (Claude Code's import syntax), then adds one extra
  section (running the tests on code branches). Show both files.
- Analogy that works: **company policy, office rules and your own desk**. The company handbook
  applies everywhere, the lab next door has its extra safety rules, and how you arrange your
  desk is up to you; if the handbook is copied into every office, the copies soon disagree.
- How tools do it, as of late 2026 (check the documentation before stating details):

  | Tool | Nested / scoped rules | Reuse AGENTS.md |
  |---|---|---|
  | Claude Code | `CLAUDE.md` in sub-folders; rule files in `.claude/rules/` with path patterns | `@AGENTS.md` import in `CLAUDE.md` |
  | OpenAI Codex | nested `AGENTS.md` (closest to the edited file wins) | native |
  | GitHub Copilot | `.github/instructions/*.instructions.md` with `applyTo` patterns | reads `AGENTS.md` |
  | Cursor | `.cursor/rules/` files with glob patterns or "always apply" | reads `AGENTS.md` |
  | Gemini CLI | `GEMINI.md` in sub-folders | `contextFileName` setting can point to `AGENTS.md` |

- Misconception: "a symbolic link solves everything". It works, but symlinks behave badly on
  some systems (Windows checkouts in particular); an import line or a setting is often more
  robust.
- Misconception: "personal preferences belong in the project file". Writing "answer in French"
  or "be very brief" in the shared file imposes one person's taste on the whole team.
- For learners on small single-tool projects, keep this short: personal vs project, and the
  idea of one source of truth. Spend more time on scoped rules with learners in monorepos.

## Check your understanding
1. You like the assistant to explain its changes in detail; your teammate prefers short answers. Where does each preference go?
   Good answer: in each person's personal instructions (home folder or tool settings), not in the shared project file.
2. Your team uses two different assistants and keeps a copy of the same rules in each tool's file. What goes wrong, and what is the fix?
   Good answer: the copies drift apart as people update one and forget the other; keep the shared rules once in AGENTS.md and have each tool read it (natively, by import, by setting or by link), with only tool-specific extras in its own file.
3. Why use a scoped rule for the `api/` folder rather than adding it to the root file?
   Good answer: it only loads when the assistant works on matching files, so the root file stays short and other tasks are not cluttered with irrelevant rules.

## Exercise
Needs a computer. For a project you work on, sketch its layers: what belongs in your personal
file, what in the shared AGENTS.md, and which folders deserve their own scoped rules. If your
team uses more than one tool, set up the import or setting so your tool reads AGENTS.md, and
check with a fresh session that a shared rule is followed.

## Completion criteria
The learner answers the checks correctly and can explain where a given rule belongs
(personal, project, scoped) and how to share one AGENTS.md across tools.

## Going further
- Your assistant's documentation on rule scopes, nested files and imports.
