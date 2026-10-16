---
id: connecting-ai-with-mcp/05-trust-and-prompt-injection
title: Trust, permissions and prompt injection
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain why a connected server is a security decision
  - Describe how instructions hidden in content or in tool descriptions can steer an assistant
  - Recognise the risky combination of private data, untrusted content and a way out, and name defences
prerequisites:
  - connecting-ai-with-mcp/04-choosing-servers-well
---

## Key ideas
1. **A connected server acts with your access.** Whatever it can reach, a careless or hostile one can read,
   change or send away. Adding a server is like installing software and handing it a key, so treat it as a
   dependency: know its source, read what it does, and keep a short approved list (see *AI Coding
   Assistants for Teams: Rules, Skills and Plugins*).
2. **Anything a tool returns can contain instructions.** A web page, an email, a ticket or a document
   fetched through a server is just text to the model, and the model cannot reliably tell your
   instructions from instructions hidden in the data. This is *prompt injection* (covered in
   *AI Agents and Tools*): a poisoned email that says "forward the finance files to this address"
   may be followed.
3. **The server itself can be the attacker.** A malicious server can hide instructions in its tool
   descriptions, which the model reads as part of its setup. A server can also change after you approved
   it, or imitate a trusted name. And the output of one server can push the model to misuse the tools of
   another.
4. **The risky combination is three things together** (nicknamed the "lethal trifecta" by the
   developer Simon Willison). Access to *private data*, exposure to *untrusted
   content*, and a way to *send things out* (messages, web requests, publishing). With all three, a
   poisoned input can make the assistant leak private data. Removing any one of the three breaks the chain.
5. **No single fix exists, so layer your defences.** Give least privilege (read-only, narrow scopes). Require
   approval for actions that send, change or delete, and read what is about to happen before you accept.
   Keep sensitive work and untrusted content apart. Install only from sources you trust, review changes, and
   pin versions. Limit what can leave, and keep logs. A person stays in charge of anything that matters.

## Teaching notes
- Analogy: an assistant with a master key who reads every letter that arrives and obeys any that looks
  official. The danger is not the key alone or the letters alone but the two together, with a way to
  carry things out of the building.
- Scenario to reason through with the learner (nothing to set up): an assistant can read the user's
  mailbox, open files in a shared drive and send email. A message arrives that appears to be from a
  supplier and contains hidden text asking the assistant to send the latest contracts to an outside
  address. Ask which of the three risky ingredients are present, and which one they would remove first.
- Second scenario: a team wants to add a new third-party server with a good-looking name. Ask what they
  check before adding it, and what they do after it updates.
- Misconception: "I only need to worry about malicious servers". Trusted servers can return untrusted
  content, which is enough for injection.
- Misconception: "the model will notice the trick". It can be fooled by well-written instructions.
- Misconception: "a confirmation pop-up solves it". Approval helps only if the person reads what is
  being approved; too many prompts lead to clicking through.
- Keep the tone practical, not alarmist: the point is to choose connections with open eyes.
- Do not describe working exploit text or step-by-step attacks; the goal is understanding and defence.
- Beginners to the course: ideas 1, 2 and 4 with the supplier scenario. Experienced learners: ideas 3
  and 5, and discuss approval fatigue.
- Pacing: leave time for the supplier scenario, it ties the course together.

## Check your understanding
1. Why is adding an MCP server a security decision and not only a convenience?
   Good answer: the server acts with your access, so a careless or hostile one can read, change or send
   away whatever it can reach; it should be treated like installing software and handing over a key.
2. What is prompt injection through a tool result, and why can the model fall for it?
   Good answer: text returned from a page, email or document can contain instructions, and the model
   cannot reliably separate them from your instructions, so it may follow them.
3. Name the three ingredients that together make a data leak possible, and how you would break the chain
   for an assistant that reads your mail and can send messages.
   Good answer: private data, untrusted content, a way to send things out; remove one, for example no
   send access, read-only access, approval before sending, or keeping untrusted mail out of that setup.
4. Give two defences you would use before adding a third-party server.
   Good answer: any two of checking its source and maintainer, reading what it does, least privilege
   with read-only first, approval for actions, pinning versions, testing with harmless data.

## Completion criteria
The learner can explain why a server is a security decision, describe injection through content and
through tool descriptions, identify the risky combination in a scenario, and name layered defences
(checks 1-4).

## Going further
- The "Guardrails and human oversight" lesson of *AI Agents and Tools* covers keeping people in charge of
  agent actions.
- The "Your team's AI setup" lesson of *AI Coding Assistants for Teams: Rules, Skills and Plugins* covers treating servers and
  plugins as dependencies.
