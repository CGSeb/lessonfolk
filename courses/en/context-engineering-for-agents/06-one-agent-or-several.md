---
id: context-engineering-for-agents/06-one-agent-or-several
title: One agent or several?
level: advanced
estimatedMinutes: 20
objectives:
  - Name the reasons for which several agents help
  - Explain how several agents hurt through cost, coordination and conflicting decisions
  - Choose a design for a long task and justify it
prerequisites:
  - context-engineering-for-agents/05-sub-agents
---

## Key ideas
1. **Start with one agent.** One agent with a well-kept context (a budget, compaction, notes
   outside the window) handles most long tasks. Every extra agent adds cost, hand-offs and
   places where things can go wrong. Add agents for a reason you can name, not because the
   task is big.
2. **Three reasons hold up.** **Isolation**: a bulky exploration stays out of the main
   context (lesson 5). **Parallelism**: independent pieces run at the same time, so the task
   finishes sooner. **Fresh eyes**: an agent with different instructions, or one that has not
   seen how the work was done, judges the result and not the intention. A reviewer that
   starts from the diff alone catches what its author talks itself past.
3. **Independence is the test.** Work splits well when the pieces do not need each other's
   intermediate results: separate research questions, the same check on many items, changes
   in modules with a fixed interface. It splits badly when decisions are coupled: each agent
   makes a reasonable choice that does not fit the others' (two naming schemes, two designs
   of the same thing), because none sees the others' context.
4. **Reading splits more easily than writing.** Agents that only read cannot get in each
   other's way. Agents that write can: the same file edited twice, changes that each work
   alone and break together. Two shapes are safe: many agents read and one writes, or
   writers get areas that do not overlap, with the shared decisions made before they start.
5. **Coordination is paid in context and in errors.** Someone must split the work, write the
   briefs, read the reports and merge the results. Each brief and each report is a lossy
   hand-off, like a summary. The total cost multiplies with the number of agents, and a wrong
   result is harder to trace when it crossed three contexts. Agents that must share state
   should do it through files (lesson 4), not through long messages to each other.
6. **Five questions before you split.** Can each piece be written as a brief that stands on
   its own? Do the pieces need each other's results? Are the shared decisions made, and
   written down, before the work starts? How will the results be checked and merged, and by
   whom? Is finishing sooner, or a cleaner main context, worth the extra cost? One shaky
   answer means: one agent, or sub-agents used one after the other.

## Teaching notes
- Analogy that works: **a kitchen**. One cook makes a dish alone, and adding a second cook to
  the same pot ruins it: each one seasons it. A banquet works with a brigade because the
  stations are independent (sauces, pastry, grill) and the chef fixed the menu and the
  timings before service. The brigade is faster; it also needs a chef who does nothing but
  coordinate and check the plates.
- This lesson is about judgement. Teach ideas 1 to 5 briskly, then spend most of the time on
  cases: the learner's own tasks first, the exercise after.
- For learners who build agents: the usual shape is one orchestrating agent that starts
  workers as tools and merges their reports. Ask what in their design decides shared things
  (names, interfaces, formats) before the workers start.
- For learners who drive an assistant: the same questions apply when they run several
  sessions side by side, or ask an assistant to start parallel sub-agents. The practical
  form of idea 4: never let two sessions edit the same files at once; give each its own
  working copy or its own area.
- Misconception: "more agents are smarter". Several agents do not know more than one; they
  each know less, since each sees only its brief. What they gain is room and speed.
- Misconception: "the agents can sort it out by talking to each other". Every exchange
  spends context on both sides and is a hand-off that loses detail. Decisions made before
  the split are cheaper and more reliable than negotiations during it.
- Misconception: "parallel means cheaper". Parallel means sooner. The cost is the sum of all
  the agents plus the coordination.
- Do not present a design as "the standard architecture", and do not name frameworks: they
  change quickly. The questions of idea 6 outlast them.
- This is the last lesson. Leave a few minutes to recap the course as one chain: the context
  only grows (lesson 1), so spend it carefully (lesson 2), compress it deliberately (lesson
  3), keep what must last outside (lesson 4), and hand whole pieces to a fresh context
  (lessons 5 and 6) when the work is independent enough. Congratulate the learner.

## Check your understanding
1. Give two good reasons to use more than one agent, and one bad reason.
   Good answer: good: isolation of a bulky exploration, parallel work on independent pieces, a fresh reviewer; bad: "the task is big", "more agents are smarter" or "it will be cheaper".
2. Why do two agents working on coupled parts of a design tend to produce a result that does not fit together?
   Good answer: each sees only its own brief and context, so each makes locally reasonable but incompatible choices (names, interfaces, approaches); the shared decisions were not made before the split.
3. Why is parallel reading safer than parallel writing, and what are two safe shapes for writing?
   Good answer: readers cannot conflict, writers can edit the same things or make changes that break together; safe shapes are many readers with one writer, or writers with non-overlapping areas and shared decisions fixed beforehand.
4. Name three costs of coordination between agents.
   Good answer: any three of the work of splitting, briefing and merging, information lost at each brief and report, total cost multiplied by the number of agents, and errors that are harder to trace across contexts.

## Exercise
Needs nothing. Give the learner these three tasks. For each, ask whether they would use one
agent or several, in which shape, and what they would decide before starting.

1. "Find every place where our thirty services write personal data to their logs."
2. "Redesign the data model of the billing module and update all the code that uses it."
3. "Add input validation to twelve API endpoints, each in its own file, following the
   example already written for the first one."

A good discussion: task 1 suits several agents, since it is read-only and the pieces are
independent (one per service, or per group of services), with a fixed report format agreed
first and one agent merging the reports. Task 2 suits one agent, because the decisions are
coupled; at most a read-only sub-agent first lists where the model is used. Task 3 can go
either way: one agent doing the endpoints in sequence is simple and safe; parallel writers
work because the files do not overlap, provided the example and the conventions are in every
brief, and a fresh agent or the learner reviews the result. In each case the learner should
use the questions of idea 6 and name the cost they accept.

## Completion criteria
The learner answers the checks correctly, and in the exercise justifies each choice with
independence (or coupling) and with reading versus writing, and names what must be decided
before any split.

## Going further
- Topics: evaluating agents on long tasks, orchestration patterns, tracing systems with
  several agents.
- AI Coding Assistants for Teams: Rules, Skills and Plugins, for the shared instructions and
  guardrails that every agent in a project loads.
