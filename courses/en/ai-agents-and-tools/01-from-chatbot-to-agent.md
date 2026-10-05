---
id: ai-agents-and-tools/01-from-chatbot-to-agent
title: From chatbot to agent
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what makes an AI system an agent
  - Place a system on the spectrum from chatbot to workflow to agent
  - Decide when an agent is not needed
prerequisites:
  - build-with-ai/07-sharing-and-next-steps
---

## Key ideas
1. **"Agent" is used loosely, so pin it down.** People call many things agents. A workable
   definition: an **agent** is a system where a model decides which action to take next,
   takes it through tools, looks at the result, and repeats until the task is done.
2. **A spectrum, not a switch.** A **chatbot** only answers with text. A **workflow** uses a
   model inside steps that your code fixes in advance (summarise, then classify, then send).
   An **agent** lets the model choose the steps and their order. Each step along the
   spectrum gives the model more freedom.
3. **Tools are how a model acts.** A model only produces text. It can act in the world (search,
   read a file, send an email) only through functions your code exposes and runs for it. What
   an agent can do is exactly the set of tools you give it.
4. **More freedom, more risk and cost.** Agents can handle open-ended tasks, but they are
   slower, cost more tokens, are harder to test and can go wrong in more ways, because each
   step can add a mistake.
5. **Often you do not need an agent.** If you can write the steps down in advance, a workflow
   is simpler, cheaper and more predictable. Reach for an agent when the steps really depend
   on what is found along the way.

## Teaching notes
- The ticket's goal is to replace hype with a clear mental model: be calm and concrete, and
  avoid claims about what agents will soon do or which products are best.
- You are, in this chat, possibly an agent yourself (you may read files and call tools). If
  so, use it as a live example: say which tools you have and how you choose to use them.
  If not, say so honestly.
- Analogy that works: **a recipe versus a cook**. A workflow follows the recipe step by step;
  an agent is a cook who looks in the fridge, decides what to make, and adjusts as they go.
  The cook is more flexible, and more likely to surprise you.
- Misconception: "an agent is a smarter model". It is usually the same kind of model, in a
  loop, with tools. The difference is the system around it.
- Misconception: "agents act on their own". They act only through tools your code runs, with
  the permissions you give them (lesson 6).
- Do not name agent frameworks or products; the ticket keeps the course framework-free.

## Check your understanding
1. In your own words, what makes a system an agent rather than a chatbot?
   Good answer: the model decides which actions to take, takes them through tools, observes the results and repeats until done, instead of only replying with text.
2. A company always wants to: read a support email, classify it, and draft a reply. Agent or workflow? Why?
   Good answer: a workflow; the steps are known in advance, so fixed steps are simpler, cheaper and more predictable than letting a model choose.
3. Why are agents harder to make reliable than a single model call?
   Good answer: they take many steps, each can go wrong and errors add up; they are less predictable, slower, cost more and are harder to test.

## Exercise
Needs nothing — free. List three tasks from your work or life where AI could help. For each,
decide whether it needs a chatbot, a workflow or an agent, and which tools it would need.
Discuss your choices with the tutor.

## Completion criteria
The learner answers the checks correctly, in particular placing a task on the
chatbot/workflow/agent spectrum with a reason.

## Going further
- Next lesson: tool and function calling, the building block of agents.
