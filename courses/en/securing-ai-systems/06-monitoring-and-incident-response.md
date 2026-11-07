---
id: securing-ai-systems/06-monitoring-and-incident-response
title: Monitoring and incident response
level: advanced
estimatedMinutes: 15
objectives:
  - Choose what to log and which signals to watch in an AI system
  - Prepare emergency controls before they are needed
  - Order the steps of a response when an incident happens
prerequisites:
  - securing-ai-systems/05-red-teaming-your-own-system
---

## Key ideas
1. **Log what you need to reconstruct an incident.** For each run: who it served, where each
   piece of content came from, every tool call with its arguments and result, approvals, and
   the versions of model, prompt and tools. Logs from the guardrails of *AI Agents and Tools*
   become your evidence here. They contain private data, so protect them, limit who reads them
   and delete them on schedule.
2. **Watch for patterns, not just errors.** Useful signals: unusual sequences of actions
   (reading many records, then sending something out); a new recipient or domain; spikes in
   calls, tokens or cost; repeated blocked actions or flagged injections from one source; and
   *canary* values (unique fake records or markers planted in data) that should never appear in
   an output. One signal is rarely proof; combinations are worth an alert.
3. **Prepare the emergency controls in advance.** During an incident you will not have time to
   build them. Have a switch to disable a tool or the whole agent, a read-only mode, a way to
   revoke and rotate the credentials it uses, and a way to roll back to a previous version of
   prompt, model or configuration (which requires keeping them versioned).
4. **When it happens: contain, preserve, assess, fix, learn.** First stop the damage (disable
   the tool, revoke access). Keep the evidence before anything is cleaned up. Work out what
   data and actions were affected and whose. Follow your legal and contractual duties to inform
   people, which vary by country and sector. Fix the root cause in the design, add the attack
   to the regression tests, and update the threat model. Then write down what happened without
   blame, so the next incident is handled faster.

## Teaching notes
- Analogy that works: **a shop's alarm and fire procedures**. Cameras record (logs), sensors
  watch for odd patterns (signals), fire extinguishers sit by the door before any fire
  (emergency controls), and everyone knows the order: get people out, call for help, then
  investigate.
- Ask the learner to prepare the shop agent's emergency kit: which switches, which credentials
  to rotate, which signals would wake someone at night.
- Scenario for idea 4: a customer reports receiving another customer's order details. Walk
  through the steps with the learner, in order.
- Misconception: "logging everything is always safer". Logs are copies of private data and a
  target in themselves; log what you need, protect it, and delete it on time.
- Misconception: "if no alert fired, nothing happened". Monitoring catches what you thought of;
  red teaming (lesson 5) and user reports find the rest.
- Do not give legal advice about notification duties: say that they exist, depend on the
  country and sector, and should be checked with the people responsible.
- This lesson closes the course: link the steps back to threat model (1), containment (4) and
  regression tests (5) in a sentence.
- Pacing: short lesson; leave time for the scenario.

## Check your understanding
1. Which combination of signals would suggest that the lethal trifecta is being exploited in the shop agent?
   Good answer: something like an untrusted email followed by reads of many or unrelated customer records, then an outbound action to a new recipient or domain; or a canary record appearing in an output.
2. Name three emergency controls you would prepare for the shop agent before launch.
   Good answer: three of: a switch to disable the send or refund tool, a switch to stop the agent, a read-only mode, revoking and rotating its credentials, rolling back to a previous prompt, model or configuration version.
3. A customer reports that they received another customer's order details. Put the response steps in order.
   Good answer: contain first (disable sending or the agent), preserve the logs and evidence, assess what data and which customers were affected, follow the duties to inform people, fix the root cause in the design, add a regression test and update the threat model, then review what happened.

## Completion criteria
The learner answers the checks correctly, names useful signals and emergency controls for a
given system, and orders the steps of an incident response with containment first (checks 1-3).

## Going further
- Topics: canary tokens, incident response playbooks, blameless post-mortems.
- Ask the tutor to "quiz me" on this course to revisit threat models and containment.
