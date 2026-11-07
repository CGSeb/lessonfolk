---
id: securing-ai-systems/04-designing-for-containment
title: Designing for containment
level: advanced
estimatedMinutes: 25
objectives:
  - Shrink the blast radius of a fooled model with scoped permissions
  - Explain how separating reading from acting limits prompt injection
  - Choose limits that must be enforced in code
  - Design an approval step that people actually read
prerequisites:
  - securing-ai-systems/03-data-leaks-and-exfiltration
---

## Key ideas
1. **Assume the model is compromised, and shrink what it can reach.** Least privilege
   (covered in *AI Agents and Tools*) goes further than choosing tools. Tools should act with
   the permissions of the person being served, not with a master key: the shop agent handling
   one customer's ticket can only read that customer's orders. Credentials are narrow and
   short-lived. A task that only needs to read gets no tool that writes. The blast radius of a
   fooled model is then the current user's data, not the whole database.
2. **Separate reading untrusted content from acting.** The most effective patterns keep the
   model that reads hostile text away from the power to act. In one pattern (the *dual LLM*),
   a *quarantined* model with no tools reads the email, and the model that holds the tools
   never sees the raw text: it gets only references to the results, or constrained values
   that code can check (a category from a fixed list, an order number in the right format). In another, the plan is fixed before any untrusted content is read
   (*plan, then execute*), so that content can fill in values but cannot add new actions.
   These designs give up some flexibility to gain a guarantee no filter can give.
3. **Put the hard limits in code, after the model.** Whatever the model decides passes through
   checks it cannot talk its way around: a strict output format, allowlists (recipients,
   domains, tools), amount and rate limits, and business rules (one refund per order, only to
   the original payment method). The model proposes; deterministic code decides what is
   allowed.
4. **Isolate what runs.** Code the model writes, pages it browses and files it opens run in a
   sandbox: no access to the host's files and secrets, and network access limited to what the
   task needs. A session that handles untrusted content does not share its environment with
   sensitive tools.
5. **Make approvals worth reading.** A human approval (covered in *AI Agents and Tools*) only
   protects if the person sees the real effect: the actual recipient, the amount, the data
   leaving, taken from the action itself and not from the model's description of it ("sending
   the reply to the customer" can hide a different address). Ask only for high-impact actions,
   so that approvals stay rare enough to be read, and send them to someone able to judge.

## Teaching notes
- Analogy that works: **a ship's watertight compartments**. You do not count on the hull never
  being breached; you make sure a breach floods one compartment, not the ship.
- Running case for the whole lesson: redesign the shop agent with the learner. Start from the
  agent of lesson 1 (reads all orders, sends to any address, refunds freely) and apply one idea
  at a time: per-customer access (1), a quarantined step that turns the email into a category
  and an order number (2), refund limits and reply-to-sender only in code (3), no web browsing
  outside the shop's domain (4), approval above an amount, showing the order, the amount and the
  payment method (5).
- For idea 2, experienced learners may know the "dual LLM" pattern or research systems that
  track where each value came from. Name them as directions, without promising they solve
  everything: they constrain what the agent can do, which is the price of the guarantee.
- Misconception: "containment makes the agent useless". It makes the dangerous paths narrow;
  most of the value (reading, drafting, looking things up) stays.
- Misconception: "an approval prompt solves it". It solves it only if it shows the real effect
  and is rare enough to be read; otherwise people click through.
- Do not describe ways to break sandboxes or bypass limits.
- Pacing: this is the longest lesson. If time is short, spend it on ideas 1 to 3 with the
  redesign and summarise 4 and 5.

## Check your understanding
1. Redesign the shop agent so that a poisoned email cannot leak other customers' data. Name at least two changes and why each works.
   Good answer: two or more of: tools act with the current customer's permissions so other customers' data is out of reach; replies go only to the customer who wrote, enforced in code; a quarantined step turns the email into constrained data so the acting part never sees raw instructions; no outbound channel such as unrestricted web requests or image rendering.
2. Why does fixing the plan before reading untrusted content limit what an injection can do?
   Good answer: the actions are chosen before the hostile text is seen, so the content can at most change values within those actions (which code can still check), not add new actions such as sending data elsewhere.
3. An approval screen says "The agent wants to send the reply to the customer. Approve?" What is wrong, and what should it show?
   Good answer: it shows the model's description, which can be wrong or manipulated; it should show the real effect from the action itself: the actual recipient address, what data or attachments go out, and any amount involved.
4. Which limits for the refund tool would you enforce in code rather than in the prompt?
   Good answer: for example a maximum amount, one refund per order, the order must belong to the customer, payment only to the original method, a daily rate limit, and approval above a threshold; these checks hold even when the model is fooled.

## Completion criteria
The learner answers the checks correctly and redesigns a given agent with scoped permissions,
separation of reading and acting, limits in code and a meaningful approval (checks 1-4).

## Going further
- Topics: the dual LLM pattern, plan-then-execute agents, capability-based security,
  sandboxing.
- Next lesson: attacking your own system to find what the design missed.
