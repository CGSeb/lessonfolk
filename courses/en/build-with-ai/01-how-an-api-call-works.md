---
id: build-with-ai/01-how-an-api-call-works
title: How an AI API call works
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain what an API is and what a model API call contains
  - Send a first request to a model from Python and read the response
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
- Learner profile: intermediate, can write and run a short Python script. If they cannot,
  slow down and help them set up Python first, or suggest coming back after learning the
  basics of a programming language.
- **Setup is the main hurdle of this lesson.** Help the learner choose: a local model runner
  by default (free, no account; needs a reasonably capable computer and a download), or a
  provider's free API tier if their computer is limited. Do not name specific runners,
  providers, models, prices or limits in your explanations, since they change quickly; if the
  learner asks for options, describe what to look for (free, supports the chat-messages
  format, documented) and let them pick, and be honest that you may not know the latest
  details. Follow the official documentation of the tool they pick for installation.
- The code uses the widely supported "chat completions" style endpoint. If the learner's
  provider uses a different format or its own SDK, adapt the request with them; the concepts
  do not change.
- Analogy that works: **ordering by mail**. You fill in a form (model, messages, settings),
  send it, and get a parcel back (the reply) with a receipt (usage).
- Misconception: "the model is inside my app". With a hosted API, your app only sends text
  and receives text; the model runs elsewhere.
- Misconception: "temperature 0 makes answers correct". It makes them more repeatable, not
  more accurate.
- Use `requests` (a common Python HTTP library) so the learner sees the raw request;
  mention that provider SDKs wrap the same thing.

## Check your understanding
1. What does a chat API request contain, and what comes back?
   Good answer: a model name, a list of messages with roles and content, and optional settings like temperature or max length; the response contains the model's reply message and token usage.
2. Why does the example code read the address, model and key from environment variables?
   Good answer: to keep the secret key out of the code and repository, and to switch between a local model and a hosted provider without changing code.
3. What are the trade-offs between a local model and a hosted one?
   Good answer: local is free, private and needs no account but depends on their hardware and is usually smaller; hosted gives larger models on any computer but needs an account and key, has free-tier limits, and sends data to the provider.

## Exercise
Needs a computer, Python and either a local model runner or a free API tier — free, code.
Set three environment variables (`BASE_URL`, `MODEL`, `API_KEY`; the key can be any text for
most local runners), install `requests`, then run:

```python
import os
import requests

BASE_URL = os.environ["BASE_URL"]  # e.g. your local runner's or provider's API address
MODEL = os.environ["MODEL"]
API_KEY = os.environ.get("API_KEY", "")

response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": MODEL,
        "messages": [{"role": "user", "content": "Explain an API in one sentence."}],
        "temperature": 0.7,
    },
    timeout=60,
)
response.raise_for_status()
data = response.json()
print(data["choices"][0]["message"]["content"])
print(data.get("usage"))
```

Change the question and the temperature a few times and tell the tutor what changed.

## Completion criteria
The learner answers the checks correctly and has made at least one successful API call (or,
if setup is blocked, can explain each part of the request and response in the code).

## Going further
- The official API documentation of the local runner or provider you chose.
- Next lesson: system prompts.
