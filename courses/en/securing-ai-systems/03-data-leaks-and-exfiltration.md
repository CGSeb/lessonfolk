---
id: securing-ai-systems/03-data-leaks-and-exfiltration
title: Data leaks and exfiltration
level: advanced
estimatedMinutes: 20
objectives:
  - Recognise the less obvious ways data can leave an AI system
  - Explain how data leaks between users and how to prevent it
  - Explain why secrets must never be placed in the model's context
  - Name defences that close the outbound channels
prerequisites:
  - securing-ai-systems/02-prompt-injection-in-depth
---

## Key ideas
1. **A leak needs a way out, and there are more ways out than "send".** The risky combination
   of private data, untrusted content and a way to send things out (the "lethal trifecta",
   covered in *Connecting AI to Your Tools with MCP*) is broken by removing one ingredient. The
   hard part is noticing every way out. An email or web request tool is obvious; the others
   are where real leaks happen.
2. **Hidden channels out.** A reply that includes an image or a link whose address carries
   data: when the interface displays the image, the browser fetches that address on its own,
   and the data reaches the attacker's server without anyone clicking. A tool that fetches a
   web page, with data added to the address. Writing into a place the attacker can read: a
   shared document, a public ticket, a comment, a calendar invite. And the answer itself, when
   it is shown to someone other than the person whose data it contains.
3. **Leaks between users.** Data also leaks sideways: one customer's information reaching
   another through shared memory, a shared conversation state, a cache, or a search index that
   ignores who may see what. Asking the model to keep users apart does not work; the rule is to
   filter by the user's rights before anything reaches the context (covered for search indexes
   in *RAG in Depth*), and to keep memory and state per user.
4. **Nothing in the context is secret.** System prompts can be coaxed out of models, and
   anything else in the context can be repeated. API keys, passwords, internal addresses and
   confidential rules do not belong there. Credentials stay in the code that runs the tools,
   where the model can use the tool without ever seeing the key. Write the system prompt as if
   a user will read it one day.
5. **Logs, providers and training data are destinations too.** Full prompts and answers in
   logs, analytics or support tools are copies of private data; so is what the model provider
   keeps under its terms. Collect only what you need, redact what you can, and set retention
   limits. And a model fine-tuned on private data can repeat it later (covered in *Adapting a
   Model*).

## Teaching notes
- Analogy that works: **a building where the guards check the front door only**. Data leaves
  through windows, the post room and the bin. Closing the main exit is not enough; you map every
  exit, then close or watch each one.
- Use the shop agent: it can read every customer's orders, it reads untrusted emails, and its
  replies are shown in a web interface that displays images. Ask the learner to find the ways
  out, then to suggest how to close each.
- For idea 2, the defences to bring out: do not display images or links from domains outside
  a tight allowlist (domains you control: a broad one, such as a whole cloud provider's
  domain, can host an attacker's page too); limit web requests to known domains; restrict where the agent can write; send
  replies only to the customer who wrote.
- Misconception: "the model was told never to reveal its system prompt". That instruction can
  be bypassed like any other; idea 4 says to assume it will be.
- Misconception: "the data stays inside our app". Logs, analytics, error trackers and the model
  provider are all places it goes.
- Keep the image-link channel at the level of how it works. Do not give example addresses or
  working payloads.
- Experienced learners: discuss which channels their own interfaces have (image rendering,
  link previews, file exports).
- Pacing: idea 2 deserves the most time; idea 5 can be one minute.

## Check your understanding
1. The agent's replies are shown in a web page that displays images. Why can this leak data even if nobody clicks anything, and how would you close the channel?
   Good answer: a fooled model can write an image whose address contains private data; the browser fetches the address automatically and the data reaches the attacker's server; close it by not displaying images or links from domains outside an allowlist (or not rendering them at all).
2. The shop agent's search index contains every customer's emails, and the system prompt tells the model to use only the current customer's messages. What is wrong, and what should be done instead?
   Good answer: the rule depends on the model obeying, and it can be fooled or simply mistaken; the index should be filtered by the customer's identity before retrieval, so other customers' data never reaches the context.
3. A developer puts the refund service's API key in the system prompt and adds "never repeat this key". Explain the problem and the fix.
   Good answer: anything in the context can be extracted or repeated, so the key is exposed; the key belongs in the code that calls the refund service, so the model can request a refund through the tool without seeing the key.
4. Name three ways out for data in an AI system other than a "send email" tool.
   Good answer: any three of: rendered images or links carrying data in their address, web requests, writing to shared documents, tickets or comments, answers shown to another user, logs and analytics, the provider's storage, a model trained on the data.

## Completion criteria
The learner answers the checks correctly, maps the ways out of a system they are given,
explains why user separation and secrets must be enforced outside the model, and proposes a
defence for each channel (checks 1-4).

## Going further
- Topics: data exfiltration through markdown images, content security policies, secrets
  management.
- Next lesson: designing the system so that a fooled model can do little harm.
