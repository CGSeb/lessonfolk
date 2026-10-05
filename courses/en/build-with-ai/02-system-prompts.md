---
id: build-with-ai/02-system-prompts
title: System prompts and behaviour
level: intermediate
estimatedMinutes: 20
objectives:
  - Use a system prompt to set a model's role, rules and tone for an app
  - Write and test a system prompt iteratively
  - Know why a system prompt is not a security boundary
prerequisites:
  - build-with-ai/01-how-an-api-call-works
---

## Key ideas
1. **A system prompt is a standing instruction for the whole conversation.** It is the
   first message, with the `system` role. Your users do not see it, but it shapes every
   answer: who the assistant is, what it does, how it talks.
2. **It is your app's personality and rules.** A good system prompt states the role ("You
   are a cooking assistant for beginners"), the task, the tone, the format of answers, and
   what to do in edge cases ("If asked about something unrelated to cooking, say you can only
   help with cooking").
3. **Everything from Prompting Basics applies, written once.** Context, audience, examples
   and output format now go in the system prompt, so every user gets them without typing
   them. Short, clear rules work better than long lists of "never" and "always".
4. **Test it like code.** Try typical questions, unclear ones, off-topic ones and attempts to
   break the rules. Change one thing at a time and re-run the same test questions to see the
   effect.
5. **It is not a security wall.** Users can sometimes talk a model into ignoring its
   instructions or revealing them ("prompt injection"). Do not put secrets in a system
   prompt, and enforce important rules in your code, not only in the prompt.

## Teaching notes
- Link to Prompting Basics lesson 2 (giving a role): the system prompt is the same idea,
  set by the developer instead of typed by the user.
- Analogy that works: **briefing a new employee on their first day**. The brief sets how they
  greet customers and what they are allowed to do; customers never read it, but they feel
  it. And a determined customer can still sometimes talk an employee into bending a rule.
- Live demo: you can show the effect in this chat by role-playing two system prompts for the
  same user question, then let the learner try it in code.
- Misconception: "the system prompt guarantees behaviour". It strongly influences it; it
  does not guarantee it (idea 5). Models also differ in how closely they follow it.
- Misconception: "longer system prompts are better". Contradictory or bloated instructions
  make behaviour less predictable.
- For learners with a security background, discuss prompt injection a bit more: any text the
  model reads (user input, documents, web pages) can contain instructions.

## Check your understanding
1. What is a system prompt and how does it differ from a user message?
   Good answer: a standing instruction with the system role, set by the developer at the start, that shapes all answers; users do not see it, while user messages are their individual requests.
2. Write a short system prompt for a recipe assistant that only talks about cooking.
   Good answer: states a role, the task, a tone or format, and what to do with off-topic requests.
3. Why should you not put an API key or a secret discount code in a system prompt?
   Good answer: users can sometimes get the model to reveal or ignore its instructions (prompt injection), so the system prompt is not a safe place for secrets; enforce rules in code.

## Exercise
Needs a computer, Python and your setup from lesson 1 — free, code. Add a system message
before the user message:

```python
messages = [
    {"role": "system", "content": "You are a friendly cooking assistant for beginners. "
     "Answer in at most 5 short steps. If asked about anything else, politely say you "
     "only help with cooking."},
    {"role": "user", "content": "How do I boil an egg?"},
]
```

Send it with the lesson 1 code, then test four user messages: a normal one, a vague one, an
off-topic one and one that asks the assistant to ignore its instructions. Change one line of
the system prompt and run the same four again. Share what you observed with the tutor.

## Completion criteria
The learner answers the checks correctly and has written and tested a system prompt against
at least one off-topic or rule-breaking message.

## Going further
- Topic: prompt injection and how apps defend against it.
- Next lesson: getting structured output your code can use.
