---
id: build-with-ai/04-conversation-memory
title: Conversation memory and context limits
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain why a model API keeps no memory between calls
  - Keep a conversation going by sending its history
  - Handle the context window limit
prerequisites:
  - build-with-ai/03-structured-output
---

## Key ideas
1. **The API does not remember you.** Each call is independent: the model only sees the
   messages in that request. A chat app feels like it remembers because the app resends the
   conversation every time.
2. **Your code keeps the history.** Store the list of messages: the system prompt, then each
   user message and each assistant reply in order. Append the new user message, send the whole
   list, then append the reply.
3. **The context window is the limit.** A model can only take a certain number of tokens per
   request (its **context window**), shared between the history you send and the reply it
   writes. Long conversations eventually do not fit, and every resent token adds time and,
   for hosted models, cost.
4. **Trim or summarise the history.** Common strategies: keep the system prompt plus only the
   last N messages; or ask the model to summarise older messages and replace them with the
   summary. Each loses some detail, so choose what your app can afford to forget.
5. **Memory across sessions is just data you store.** To remember a user next week, your app
   must save something (the history, a summary, preferences) and send it again later. That
   is user data: store only what you need and tell users about it.

## Teaching notes
- Analogy that works: **a friend with no short-term memory who reads a notebook**. Before
  every reply they read the whole notebook of your conversation. You write in the notebook;
  when it gets too thick, you tear out old pages or write a summary page.
- This explains the AI Foundations idea "the model only sees what is in the conversation":
  now the learner is the one building the conversation.
- Do not give context window sizes for specific models; they vary widely and change.
- Misconception: "the model learns from my conversations as I talk to it". During a
  conversation nothing in the model changes; only the messages sent change.
- Misconception: "more history is always better". Very long contexts are slower, cost more
  and can make the model lose track of details.
- For experienced learners, mention that apps can also fetch only the relevant past
  information when needed (retrieval, covered in the AI Agents and Tools course), without
  going deeper here.

## Check your understanding
1. If the API keeps no memory, how does a chatbot remember what you said three messages ago?
   Good answer: the app stores the conversation and sends the full history (or a trimmed or summarised version) with every request.
2. What happens as a conversation keeps growing, and why is it a problem?
   Good answer: the history uses more tokens each turn, so requests get slower and costlier and eventually exceed the context window.
3. Describe one strategy to keep a long conversation within limits, and its downside.
   Good answer: keep only the last N messages (forgets early details) or summarise older messages (loses some detail, costs an extra call); the system prompt is always kept.

## Exercise
Needs a computer, Python and your setup — free, code. Build a conversation loop that keeps
history and trims it:

```python
MAX_MESSAGES = 10
history = [{"role": "system", "content": "You are a helpful assistant."}]

def chat(user_text):
    history.append({"role": "user", "content": user_text})
    recent = [history[0]] + history[1:][-MAX_MESSAGES:]
    reply = call_model(recent)  # your lesson 1 request, returning the reply text
    history.append({"role": "assistant", "content": reply})
    return reply
```

Tell the model your name, chat for a while, and see when it forgets it. Then lower
`MAX_MESSAGES` and try again. Discuss with the tutor what you would keep or summarise for a
real app.

## Completion criteria
The learner answers the checks correctly and has a working loop that sends history and keeps
it within a limit.

## Going further
- Topic: tokenizers, to see how text is split into tokens.
- Next lesson: errors, cost and latency.
