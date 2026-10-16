---
id: how-ai-apps-work/01-how-an-api-call-works
title: How an AI API call works
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what an API is and what a model API call contains
  - Read a request to a model and its response, part by part
  - Explain why an API key must be kept secret
prerequisites:
  - prompting-basics/05-what-prompting-cannot-fix
---

## Key ideas
1. **An API lets your code talk to a model.** An API (application programming interface) is
   a defined way for one program to ask another for something. A model API receives your
   messages over the network (or from your own machine) and sends back the model's reply.
   A chat assistant is itself an app built on such an API.
2. **A request is a list of messages plus settings.** Each message has a `role` (`system`,
   `user` or `assistant`) and `content` (the text). You also name the `model` and can set
   options such as `temperature` (how varied the answers are) and a maximum length for the
   reply. Many providers and local model runners accept this same chat-messages format.
3. **The response contains the reply and usage.** The reply is the model's message. Usage
   tells you how many **tokens** (pieces of text, roughly parts of words) went in and came
   out, which drives speed and, for hosted models, cost.
4. **Local and hosted models work the same way.** A local model runner serves a model on
   your own computer: free, private, no account, but limited by your hardware. A hosted
   provider runs larger models on its servers, usually behind an account, an API key and a
   free tier with limits. Code that reads the address, model name and key from settings can
   switch between them without changes.
5. **An API key is a password.** Hosted APIs identify you with a secret key. Keep it in an
   environment variable, never in your code or in a git repository; anyone with the key can
   use your account.

## Teaching notes
- Learner profile: intermediate, comfortable with technical ideas but not required to code.
  This is a concept lesson: the learner installs nothing, writes no code and needs no
  account. Never ask them to run a call.
- To show a request, write it out in the chat as a small annotated example (model, a list
  of messages with roles, a setting or two) and then the reply and its usage, and explain each
  part in plain words. Use the widely supported "chat completions" style. If the learner's
  provider uses a different format, say so; the concepts do not change.
- Do not name specific runners, providers, models, prices or limits, since they change
  quickly. If the learner asks what to use, describe what to look for (free, supports the
  chat-messages format, documented) and be honest that you may not know the latest details.
- If the learner wants to try a call for real, tell them hands-on practice lives in the
  projects section of the LessonFolk website, not in this lesson.
- Analogy that works: **ordering by mail**. You fill in a form (model, messages, settings),
  send it, and get a parcel back (the reply) with a receipt (usage).
- Misconception: "the model is inside my app". With a hosted API, your app only sends text
  and receives text; the model runs elsewhere.
- Misconception: "temperature 0 makes answers correct". It makes them more repeatable, not
  more accurate.
- Mention that provider SDKs (ready-made libraries) wrap the same raw request, so the
  learner recognises it whatever tool an app uses.

## Check your understanding
1. What does a chat API request contain, and what comes back?
   Good answer: a model name, a list of messages with roles and content, and optional settings like temperature or max length; the response contains the model's reply message and token usage.
2. Why do apps read the address, model and key from settings (environment variables) instead of writing them in the code?
   Good answer: to keep the secret key out of the code and repository, and to switch between a local model and a hosted provider without changing code.
3. What are the trade-offs between a local model and a hosted one?
   Good answer: local is free, private and needs no account but depends on their hardware and is usually smaller; hosted gives larger models on any computer but needs an account and key, has free-tier limits, and sends data to the provider.

## Completion criteria
The learner answers the checks correctly and can explain each part of a request to a model
and of its response.

## Going further
- The official API documentation of the local runner or provider you chose.
- Next lesson: system prompts.
