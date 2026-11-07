---
id: securing-ai-systems/05-red-teaming-your-own-system
title: Red teaming your own system
level: advanced
estimatedMinutes: 20
objectives:
  - Define the goals and rules of a red-teaming exercise from the threat model
  - Explain why defences must be tested against an attacker who adapts
  - Read red-teaming results as rates and impact, not as single attempts
  - Turn findings into design fixes and regression tests
prerequisites:
  - securing-ai-systems/04-designing-for-containment
---

## Key ideas
1. **Red teaming tests the whole system against goals, not the model against prompts.** A red
   team plays the attacker on purpose. Its goals come from the threat model: "get a refund for
   an order that is not yours", "read another customer's address", "make the agent contact an
   outside address". It targets the real system (tools, permissions, interface), in a test
   environment with fake data and accounts, under written rules about what is in scope.
2. **Cover every entry point and every kind of harm.** Vary where the attack comes from (the
   chat, an email, an attachment, a document in the index, a saved memory) and what it aims at
   (overriding instructions, extracting data, unwanted actions, unsafe output reaching other
   code, running up costs, content that breaks the product's policies). Attacks over several
   turns or several steps of an agent count too: many failures need more than one message.
3. **Test against an attacker who adapts.** Replaying a list of known attack prompts gives false
   comfort: they are the ones defences were tuned on. A real attacker knows (or guesses) your
   defences and keeps adjusting. Research on injection defences has repeatedly found that
   measures which stopped fixed attack sets failed against adaptive ones. Combine people's
   creativity with automated generation of many variants.
4. **Measure rates and impact.** Model answers vary from run to run, so one failed attempt
   proves nothing. Run each attack many times and report how often it succeeds, and above all
   what a success achieves: an odd sentence, a leaked record, money moved. A rare success
   with high impact is a serious finding.
5. **Fix the design, then keep the test.** Patching the exact phrase that worked ("never do X")
   invites the next variant. Trace each finding to the capability that made it harmful and fix
   it there (lesson 4). Then add the attack to your regression tests (comparing versions and
   catching regressions is covered in *Evaluating AI Output*) and run them again after every
   change of model, prompt or tools.

## Teaching notes
- Analogy that works: **a fire drill with a real arsonist's mindset**. You do not test the fire
  doors by checking that last year's fire would be stopped; you look for the door someone
  propped open.
- Ask the learner to plan a red-team exercise for the shop agent: three goals from the threat
  model, the entry points to try for each, what counts as success, and the test environment.
  Keep it at the level of goals and channels.
- For idea 4, a useful number to reason with: an attack that works one time in thirty may look
  rare, but an attacker who can send thirty emails gets it. What matters is what one success
  does.
- Misconception: "we tried the famous jailbreaks and none worked, so we are safe". Those prove
  only that the known prompts fail; the defence has not met an adaptive attacker.
- Misconception: "red teaming is a one-off before launch". Every model update, new tool or
  prompt change can reopen a hole, which is why findings become regression tests.
- Do not write attack prompts or step-by-step attack methods, and do not help the learner
  attack systems they do not own. Red teaming is done on your own system, with permission.
- Experienced learners: mention that some organisations run bug bounties for AI features, and
  that automated attack generation is itself an AI system that needs checking.
- Pacing: give most of the time to the exercise plan and idea 5.

## Check your understanding
1. Why should a red-team exercise run in a test environment with fake data, and where do its goals come from?
   Good answer: real attacks on the live system could leak real data or move real money and affect real users; the goals come from the threat model, as concrete harms to achieve such as reading another customer's data or getting an unauthorised refund.
2. A team replayed 50 well-known jailbreak prompts and none worked. What can they conclude?
   Good answer: only that those known prompts fail; defences are often tuned on them, and an attacker who adapts may still succeed, so they need adaptive testing (people and automated variants) aimed at their own goals and entry points.
3. An injection makes the agent email a customer's address to an outside account in 1 out of 30 attempts. Is that a serious finding? Why?
   Good answer: yes: an attacker can simply repeat the attempt, and the impact of a success is a data leak; findings are judged by rate and impact together, and high impact makes even a low rate serious.
4. The team fixes that finding by adding "never send emails to outside addresses" to the system prompt. Is this a good fix? What would you do?
   Good answer: no: a prompt rule can be bypassed by the next variant; fix the capability in code (recipients only from the customer record or an allowlist, approval for new recipients), then add the attack to the regression tests and re-run them after each change.

## Completion criteria
The learner answers the checks correctly, plans a red-team exercise with goals, entry points
and success criteria, and turns a finding into a design fix and a regression test (checks 1-4).

## Going further
- Topics: adaptive attacks on injection defences, automated red teaming, AI bug bounties.
- Next lesson: watching a system in use and responding when something goes wrong.
