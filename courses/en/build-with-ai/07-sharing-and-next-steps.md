---
id: build-with-ai/07-sharing-and-next-steps
title: Sharing and next steps
level: intermediate
estimatedMinutes: 15
objectives:
  - Know what to check before letting others use your AI app
  - Choose a simple way to share it
  - Plan what to learn next
prerequisites:
  - build-with-ai/06-build-a-small-chatbot
---

## Key ideas
1. **Keys stay on a server, never with users.** If your app runs in a browser or on someone
   else's device, any key inside it can be extracted. Put the model call behind a small
   server (a backend) that holds the key, and have the app talk to your server instead.
2. **Set limits before sharing.** Use the provider's spending or usage limits, and add your
   own: a maximum message length, a maximum number of messages per user, a rate limit. A
   shared bot can be used far more than you expect, sometimes on purpose.
3. **Tell users what happens to their data.** Say that they are talking to an AI, that it can
   be wrong, what you store (conversations, if anything) and for how long, and whether data
   goes to a model provider. Store as little as you need.
4. **Start with a few real users.** Share with a few people you trust, watch how they use it,
   and collect the conversations that went wrong (with their permission). Real users find
   problems your tests did not.
5. **Simple ways to share, and where to go next.** You can start with a terminal app a friend
   runs on their machine with their own setup, a small web page in front of your backend, or
   a free hosting option for small projects. Next, the AI Agents and Tools course shows how to
   let a model call functions and take actions.

## Teaching notes
- Do not name hosting services, web frameworks or prices; describe the options and let the
  learner research the current free options in their stack.
- Analogy that works: **opening a small café**. Before the first customers come in, you lock
  the safe (keys), set opening hours (limits), put up a sign about allergens (data and AI
  disclosure), and invite friends for a soft opening (a few real users).
- Misconception: "hiding the key in the frontend code is fine if it's minified". Anything that
  ships to the user's device can be read.
- Misconception: "it's a small project, nobody will abuse it". Public endpoints get found and
  used; limits protect both your budget and your users.
- Do not give legal advice on privacy rules; tell the learner that rules differ by country
  and to check them before collecting other people's data.
- Close the course: recap the path from a single API call to a tested chatbot, and suggest
  next steps that fit their goals (AI Agents and Tools, deeper evaluation, retrieval over
  documents as topics).

## Check your understanding
1. Why must the API key not be in the code of a web page that calls the model directly?
   Good answer: anything sent to the user's browser can be read, so the key could be stolen and used; the call should go through a backend that keeps the key secret.
2. Name two limits you would set before sharing your chatbot publicly, and why.
   Good answer: any two of a spending or usage cap at the provider, per-user message or rate limits, a maximum message length; they protect the budget and prevent abuse.
3. What should users of your chatbot be told?
   Good answer: that it is an AI and can be wrong, what data is stored and for how long, and whether their messages are sent to a model provider.

## Exercise
Needs nothing (or a computer to start building) — free. Write a one-page sharing plan for
your chatbot: who will use it, how they will access it, where the key lives, which limits you
will set, the data notice you will show, how you will collect feedback, and what you plan to
learn next and why. Review it with the tutor. Optionally, share the terminal version with one person and note what they struggled
with.

## Completion criteria
The learner answers the checks correctly and writes a sharing plan that covers key storage,
limits, a data notice and what to learn next.

## Going further
- AI Agents and Tools: letting models call functions and take actions.
- Topics: evaluating AI apps with test sets, retrieval over your own documents.
