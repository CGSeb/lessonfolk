---
id: ai-coding-assistants-for-teams/04-commands-skills-and-plugins
title: Commands, skills and plugins
level: intermediate
estimatedMinutes: 20
objectives:
  - Tell always-loaded rules apart from on-demand commands and skills
  - Choose between a command, a skill, a subagent and a plugin for a team workflow
  - Explain how plugins and MCP servers extend an assistant
prerequisites:
  - ai-coding-assistants-for-teams/03-scopes-layers-and-imports
---

## Key ideas
1. **Rules for every task, workflows for some tasks.** The instructions file is loaded every
   time, so it should only hold what applies to every task. A repeatable procedure ("prepare
   a release", "write a migration", "review a PR against our checklist") belongs in something
   loaded only when needed.
2. **Commands: a saved prompt you call by name.** Most tools let you save a prompt in a file
   in the repository and run it as a slash command (`/release-notes`) or prompt file, often
   with arguments. The whole team then runs the same, reviewed prompt instead of retyping
   their own version.
3. **Skills: instructions the assistant picks up when relevant.** A **skill** is a folder with
   a `SKILL.md` file (a name, a one-line description, then instructions) and optionally
   scripts or templates. Only the description sits in context; the assistant reads the rest
   when a task matches it, or when you invoke it. Skills let you add many workflows without
   bloating every request. The `SKILL.md` format is shared by several tools.
4. **Subagents: a helper with its own context.** Some tools let you define specialised agents
   (a reviewer, a test writer) with their own instructions and limited tools. The main
   assistant hands them a task, and they return a result without filling the main
   conversation with their work.
5. **Plugins and MCP: packaging and connecting.** A **plugin** (called an extension in some
   tools) bundles commands, skills, agents, hooks and connections so a team installs them in
   one step, from the repository or a shared catalogue (a "marketplace"). **MCP** (Model
   Context Protocol) servers connect the assistant to outside systems such as the issue
   tracker, a database or documentation; plugins often include them. Anything you install
   runs with your access, so treat it like a dependency (lesson 6).

## Teaching notes
- Live example: open `.claude/skills/` in the LessonFolk repository with the learner. Each
  folder (`learn`, `progress`, `review`, `create-course`, `edit-course`) has a short
  `SKILL.md` whose description says when to use it, and whose body points to a procedure in
  `AGENTS.md`. Show how this keeps the procedures in one shared file (lesson 3) while giving
  Claude Code named, on-demand entry points. `course-builder` in the same folder is a small
  plugin that adds a side pane while a course is being written.
- If you are running inside a tool, show the learner how to list the commands or skills
  available in this session.
- Analogy that works: **the house rules on the fridge versus the binder of recipes**. Rules
  on the fridge apply to everyone, every day; the recipes stay in the binder until someone
  cooks that dish. Plugins are a recipe binder you can buy or share; MCP gives the kitchen
  access to the shop next door.
- How tools name these, as of late 2026 (they change fast; check the documentation, and do
  not present gaps as permanent):

  | Concept | Claude Code | OpenAI Codex | GitHub Copilot | Cursor | Gemini CLI |
  |---|---|---|---|---|---|
  | Saved prompts | slash commands (part of skills) | custom prompts | `.github/prompts/*.prompt.md` | `.cursor/commands/` | `.gemini/commands/*.toml` |
  | Skills (`SKILL.md`) | `.claude/skills/` | supported | supported | check docs | check docs |
  | Subagents | `.claude/agents/` | check docs | custom agents (`.github/agents/`) | check docs | check docs |
  | Bundles | plugins and marketplaces | check docs | check docs | check docs | extensions |
  | MCP servers | yes | yes | yes | yes | yes |

- Misconception: "put every procedure in AGENTS.md". It works for a few, but a long file
  dilutes the rules that matter; move procedures to skills or commands once there are several.
- Misconception: "a skill is code". A skill is mostly text instructions; scripts are
  optional helpers it can run.
- Keep MCP at the level of "what it connects"; how tool calling and MCP work inside is taught
  in the AI Agents and Tools course.
- For learners who prefer doing over reading, write a small command or skill together during
  the lesson and run it.

## Check your understanding
1. Your team has a 30-line procedure for preparing a release. Why put it in a command or skill rather than in AGENTS.md?
   Good answer: AGENTS.md is loaded on every request, so a procedure used occasionally wastes context and dilutes other rules; a command or skill is loaded only when the release task comes up, and the team still shares one reviewed version.
2. What is the difference between a command and a skill?
   Good answer: a command is a saved prompt you call explicitly by name; a skill has a description that stays in context so the assistant can load its instructions (and files) on its own when a task matches, as well as when you call it.
3. What does a plugin add compared with committing a few command files to the repository?
   Good answer: it bundles several pieces (commands, skills, agents, hooks, MCP connections) into one installable, versioned unit that can be shared across projects and teams through a catalogue.

## Exercise
Needs a computer and a coding assistant that supports commands or skills (check its
documentation; a free tier is enough). Pick a task your team repeats (writing release notes,
adding an endpoint, a review checklist) and turn it into a command or a skill in your project.
Run it on a real case, then refine its description or instructions with the tutor.

## Completion criteria
The learner answers the checks correctly and can choose, for a given team workflow, between
the instructions file, a command, a skill, a subagent and a plugin, with a reason.

## Going further
- The AI Agents and Tools course, for tool calling and how agents use outside systems.
- Your assistant's documentation on commands, skills, subagents and plugins.
- The Model Context Protocol documentation: modelcontextprotocol.io
