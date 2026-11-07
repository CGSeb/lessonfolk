---
id: securing-ai-systems/01-threat-modelling-an-ai-system
title: Threat modelling an AI system
level: advanced
estimatedMinutes: 20
objectives:
  - Identify what an AI system must protect and who might attack it
  - Find every place where untrusted text enters the model's context
  - Judge the worst case of a fooled model from what it can read and do
  - Rank threats and choose a response for each
prerequisites: []
---

## Key ideas
1. **Start from what you protect, and from whom.** A threat model answers four questions: what
   are we building, what can go wrong, what are we going to do about it, and did we do a good
   job. For an AI system, the things to protect are the data it can read, the actions it can
   take, money (including the bill for model calls), the service staying up, and trust in the
   product. The attackers are not only outsiders: a user of the app, someone who only sends it
   content (an email, a web page, a document), a compromised tool or server, and careless
   insiders all count.
2. **Every place text enters the context is an entry point.** Draw how data flows through the
   system and mark where it crosses from untrusted to trusted. In an AI system the entry points
   are many: the user's messages, retrieved documents, tool results, web pages, emails, uploaded
   files, saved memory, and the tool descriptions themselves. The model reads all of them as one
   stream of text, so each one is a way to give it instructions (prompt injection, covered in
   *AI Agents and Tools* and *Connecting AI to Your Tools with MCP*).
3. **The model is a deputy that can be confused.** The system gives the model its own access:
   tools, credentials, data. Whoever manages to write text the model reads can try to borrow
   that access. Security people call this the *confused deputy* problem. So the useful question
   is not "can the model be fooled?" (assume it can) but "if an attacker controls this input,
   what is the worst it can make the system do with everything in reach?". The worst case is
   roughly everything the model can read combined with everything it can do.
4. **AI adds threats to the classic ones; it does not replace them.** Beyond injection, watch
   for: private data leaking through the model's answers or actions; model output passed
   unchecked to other code (into a database query, a web page or a command), which turns an
   injection into a classic attack; an agent with more tools or permissions than its task
   needs; abuse that runs up the bill or exhausts quotas; and poisoned inputs upstream, such as
   tampered models, plugins or datasets. The OWASP Top 10 for LLM Applications is a widely used
   checklist of these. Authentication, secrets and patching still matter as much as ever.
5. **Rank, then decide one response per threat.** Score each threat by how likely it is and how
   bad it would be, and work on the top of the list. For each, choose: *remove* the capability
   (no send tool at all), *contain* it (limits, isolation, approval), *detect* it (logs and
   alerts), or *accept* it knowingly and write down why. A threat model is never finished:
   revisit it whenever you add a tool, a data source, a new group of users or a new model.

## Teaching notes
- Use one running example through the course: **a support agent for an online shop**. It reads
  incoming customer emails, looks up orders and customer accounts, can issue refunds up to a
  limit, and drafts and sends replies. It has private data, untrusted content and ways to act,
  which makes it a good case for every lesson.
- Analogy that works: **a bank teller who follows written notes**. The teller has access to the
  vault and can make transfers. Anyone who can slip a note into the pile on the counter can try
  to get the teller to act for them. The threat model is the list of piles, what the teller can
  reach, and which actions need a manager.
- Walk through idea 2 with the shop agent: ask the learner to list every entry point. Expect
  the customer email; help them find the order notes written by other customers, attachments,
  the product pages it may fetch, its saved memory and the descriptions of its tools.
- Then idea 3: "a customer email contains hidden instructions. What is the worst that can
  happen?" Reading other customers' data plus sending email means data can leave; refunds mean
  money can leave. That is the ranking for idea 5.
- Misconception: "our system prompt tells the model to ignore instructions in emails, so we
  are safe". Lesson 2 shows why that is not a boundary. In a threat model, a prompt rule is at
  best a way to lower likelihood, never a way to remove a capability.
- Misconception: "AI security is a new field, so classic security does not apply". Most real
  incidents still involve classic weaknesses (leaked keys, missing access checks); AI adds a
  new way to reach them.
- Experienced learners may know STRIDE or similar methods: any method works, as long as model
  inputs are treated as entry points and model actions as capabilities.
- Do not quote incident statistics or name vendors. Do not describe working attack text.
- Pacing: ideas 1 and 4 can be brisk. Spend the time on the shop agent for ideas 2, 3 and 5.

## Check your understanding
1. List the entry points of the shop's support agent where untrusted text can reach the model.
   Good answer: several of: customer emails and their attachments, order notes or messages written by customers, web or product pages it fetches, retrieved documents, saved memory, tool results, and the tool descriptions themselves; and the reason they matter: the model reads them all as text it might follow.
2. Why is "can the model be fooled?" the wrong question for a threat model, and what should you ask instead?
   Good answer: you should assume it can be fooled; the useful question is what an attacker who controls an input could make the system do with everything the model can read and every action it can take (the confused deputy).
3. The shop agent's replies are inserted into a web page without any escaping. Why is this a security problem even though the model "only writes text"?
   Good answer: model output can be steered by an attacker, so passing it unchecked into a page (or a query, or a command) turns an injection into a classic attack such as script injection; model output must be treated as untrusted and validated or escaped.
4. For the threat "a poisoned email makes the agent send other customers' data to an outside address", give one way to remove, one to contain and one to detect it.
   Good answer: remove, for example no free-form send tool or replies only to the sender's own address; contain, for example the agent reads only the current customer's data, or sending needs approval, or recipients are restricted; detect, for example logging and alerting on unusual recipients or volumes.

## Completion criteria
The learner answers the checks correctly, can list the entry points of a system they are given,
states the worst case from what the model can read and do, and assigns remove, contain, detect
or accept to a threat (checks 1-4).

## Going further
- Topics: the OWASP Top 10 for LLM Applications, STRIDE, the confused deputy problem.
- Next lesson: why prompt injection has no complete fix, and what that means for design.
