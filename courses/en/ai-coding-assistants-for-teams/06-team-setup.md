---
id: ai-coding-assistants-for-teams/06-team-setup
title: Your team's AI setup
level: intermediate
estimatedMinutes: 20
objectives:
  - Decide what of the AI setup is shared and what stays personal
  - Maintain instructions, skills and plugins like code
  - Agree on team conventions for AI-assisted work and roll them out
prerequisites:
  - ai-coding-assistants-for-teams/05-permissions-and-hooks
---

## Key ideas
1. **The setup is part of the codebase.** AGENTS.md, scoped rules, commands, skills, shared
   settings and the list of approved plugins live in the repository. Changes to them go
   through pull requests and review like any code, because they change how every teammate's
   assistant behaves. Personal files and local settings stay out of git.
2. **Keep the rules alive.** When the assistant makes the same mistake twice, add or fix a
   rule (or a check, if it must never happen). When a rule no longer matters, delete it.
   Test a change with a fresh session on a real task. Name an owner so the file does not rot,
   and point to it in the README so newcomers find it.
3. **Treat plugins and MCP servers as dependencies.** A third-party plugin, skill, hook or MCP
   server runs with your access and can read your code, run commands or send data elsewhere.
   Install them from sources you trust, read what they do, pin versions, and keep a short
   approved list. A malicious instructions file or skill in a dependency is a known attack
   path.
4. **Agree on team conventions.** A one-page AI working agreement answers a few questions:
   which tools are approved and what code or data may be sent to them; that AI-written code
   meets the same review bar, and the person who opens the pull request owns it; how
   AI help is credited (for example a commit trailer, if the team wants one); and the size
   of pull requests reviewers will accept.
5. **Roll it out gently.** Start with one repository and a small AGENTS.md, show teammates
   the commands and skills that save time, and pair with those who are less comfortable.
   Review what works at a retro and adjust. Shared defaults help; forcing one personal
   workflow on everyone does not.

## Teaching notes
- Live example: the LessonFolk repository is a full small setup. `AGENTS.md` is shared,
  `CLAUDE.md` imports it and adds a test rule, skills live in `.claude/skills/`, the commit
  format is agreed in `AGENTS.md`, and `.progress/` stays personal and gitignored. Ask the
  learner to point out each piece, then what is missing (for example enforcement of the test
  rule, lesson 5); it is a good recap of the course.
- Analogy that works: **a shared kitchen**. Labelled shelves, a cleaning rota and an agreed
  list of suppliers keep it working for everyone; a new appliance from an unknown seller gets
  checked before it is plugged in.
- Misconception: "set it up once and you are done". Code, tools and the team change; an
  outdated rule is worse than none because the assistant follows it confidently.
- Misconception: "AI-written code needs a special review process". The bar is the same; what
  changes is the volume, so keep pull requests small (from the previous course).
- Data rules (what may go to which tool) build on the Using AI Safely and Wisely course and
  lesson 5 of AI Coding Assistants in Practice; recap them in one line, do not reteach them.
- Ask about the learner's real team (size, tools, how much is set up today) and build ideas
  4 and 5 from their answers. Learners working alone can apply ideas 1–3 to their own
  projects and keep idea 4 for later.
- This is the last lesson: recap the course (instructions, scopes, commands and skills,
  guardrails, team setup) and celebrate. Suggest next steps: Build with AI to add AI to their
  own apps, and AI Agents and Tools to understand how their assistant works inside.

## Check your understanding
1. A teammate changes AGENTS.md directly on the main branch to add a rule. Why is that a problem, and what should happen instead?
   Good answer: the file changes how everyone's assistant behaves, so the change should go through a pull request and review like code, and be tested on a real task.
2. Someone suggests installing a popular third-party MCP server for the team. What do you check first?
   Good answer: who publishes it and whether the source is trusted, what access it needs and what it does with data (it runs with your access), that it is pinned to a version, and that it is added to the approved list after review.
3. What would you put in your team's AI working agreement? Give at least three points.
   Good answer: any three of approved tools and what code or data may go to them, the same review bar and ownership of AI-written code by the person who opens the pull request, how AI help is credited, pull request size, where the shared setup lives and who maintains it, how changes to it are reviewed.

## Exercise
Needs nothing (a computer is optional). Write your team's AI setup checklist on one page:
what is committed (instructions, scoped rules, commands or skills, shared settings, approved
plugins), what stays personal, who maintains it, and a five-point AI working agreement.
Discuss it with the tutor, then share it with your team if you want to.

## Completion criteria
The learner answers the checks correctly and has written, or can describe, a team setup that
covers shared files, maintenance, plugin vetting and a working agreement.

## Going further
- Build with AI: Your First AI App, to add AI features to your own projects.
- AI Agents and Tools, to understand how agent-style assistants work inside.
- Your assistant's documentation on team and organisation settings.
