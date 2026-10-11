---
id: build-with-ai/01-how-an-api-call-works
title: How an AI API call works
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what an API is and what a model API call contains
  - Read a request to a model and its response, part by part
  - Keep an API key out of the code
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
- Learner profile: intermediate, can read a short Python script. If they cannot, explain
  in plain words every line of code you show.
- The lesson needs no setup. If the learner wants to try a call themselves, help them choose:
  a local model runner by default (free, no account; needs a reasonably capable computer and
  a download), or a provider's free API tier if their computer is limited. Do not name
  specific runners, providers, models, prices or limits, since they change quickly; if the
  learner asks for options, describe what to look for (free, supports the chat-messages
  format, documented) and let them pick, and be honest that you may not know the latest
  details. Follow the official documentation of the tool they pick for installation.
- When you show a request, use the widely supported "chat completions" style endpoint. If
  the learner's provider uses a different format or its own SDK, say so; the concepts do not
  change.
- Analogy that works: **ordering by mail**. You fill in a form (model, messages, settings),
  send it, and get a parcel back (the reply) with a receipt (usage).
- Misconception: "the model is inside my app". With a hosted API, your app only sends text
  and receives text; the model runs elsewhere.
- Misconception: "temperature 0 makes answers correct". It makes them more repeatable, not
  more accurate.
- In examples, use `requests` (a common Python HTTP library) so the learner sees the raw
  request; mention that provider SDKs wrap the same thing.

## Check your understanding
1. What does a chat API request contain, and what comes back?
   Good answer: a model name, a list of messages with roles and content, and optional settings like temperature or max length; the response contains the model's reply message and token usage.
2. Why does the example code read the address, model and key from environment variables?
   Good answer: to keep the secret key out of the code and repository, and to switch between a local model and a hosted provider without changing code.
3. What are the trade-offs between a local model and a hosted one?
   Good answer: local is free, private and needs no account but depends on their hardware and is usually smaller; hosted gives larger models on any computer but needs an account and key, has free-tier limits, and sends data to the provider.

## Completion criteria
The learner answers the checks correctly and can explain each part of a request to a model
and of its response.

## Going further
- The official API documentation of the local runner or provider you chose.
- Next lesson: system prompts.
