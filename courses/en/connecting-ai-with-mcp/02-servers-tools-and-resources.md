---
id: connecting-ai-with-mcp/02-servers-tools-and-resources
title: Servers, tools and resources
level: intermediate
estimatedMinutes: 15
objectives:
  - Distinguish the three things an MCP server can offer and who controls each
  - Follow what happens, step by step, when an assistant uses a server
  - Explain why tool descriptions and tool results matter
prerequisites:
  - connecting-ai-with-mcp/01-the-connection-problem
---

## Key ideas
1. **A server can offer three kinds of things.** *Tools* are actions the model can ask for:
   search tickets, create a calendar event, run a query. *Resources* are data that can be read
   and given to the model as context: a file, a record, a page. *Prompts* are ready-made
   templates that a person can start, such as "summarise this week's tickets". A server may
   offer any mix of the three.
2. **Each kind has a different controller.** The model decides when to call a tool (and the
   application can ask you to approve it). The application or the person chooses which resource
   to attach. The person picks a prompt. Knowing who is in control tells you where a safeguard
   belongs.
3. **The assistant learns what a server offers by asking.** When a client connects, it asks the
   server what it has, and the server answers with a list: each tool's name, a description, and
   the shape of the inputs it expects. The host passes those tool descriptions to the model, as in
   tool calling. That is why a new server can be added without changing the assistant.
4. **A call goes through the host, never straight from the model.** You ask a question; the model
   picks a tool and arguments; the host sends the request to the server through its client; the
   server does the work using its own access to the real system and returns a result; the host
   gives the result to the model, which writes the answer. The model never touches your systems
   itself.
5. **Descriptions and results are text that steers the model.** The model chooses tools from their
   names and descriptions (covered in *AI Agents and Tools*), so vague or misleading ones lead to
   wrong choices. And what a tool returns goes into the conversation, where it uses room in the
   context window and can influence what the model does next. Both come from the server, which is
   why you must trust the server (lesson 5).

## Teaching notes
- Analogy: a restaurant. The menu is the list of tools and their descriptions. The waiter (the host)
  carries your order to the kitchen (the server) and brings back the dish. The customer (the model)
  never goes into the kitchen. Resources are like the bread basket put on the table, and prompts
  like the set menu you can order by name.
- Scenario to reason through with the learner (nothing to set up): an assistant is connected to a
  calendar server that offers "list events", "create event" and "delete event". Ask which of the
  three would need your approval first, who decides to call it, and what the model sees afterwards.
- Misconception: "resources and tools are the same thing". Resources are read, chosen by the app or
  person; tools are actions the model requests.
- Misconception: "the server is where the AI runs". The server is only a connector to the system; the
  model runs in the host's service, wherever the assistant is hosted.
- Do not name particular servers or give protocol message formats: the idea matters, not the syntax.
- Beginners to the course: ideas 1, 3 and 4 with the calendar scenario. Experienced learners: discuss
  who controls each kind and where approval belongs.
- Pacing: idea 4 is the thread of the whole course; make sure it is clear before moving on.

## Check your understanding
1. Name the three things an MCP server can offer and give one example of each.
   Good answer: tools (actions such as creating a calendar event), resources (data to read such as a
   file or record) and prompts (templates a person starts, such as a weekly summary).
2. Who decides when a tool is called, and who chooses which resource is attached?
   Good answer: the model decides to call a tool (with the application able to ask for approval); the
   application or the person chooses a resource.
3. Walk through what happens when you ask an assistant "what is on my calendar tomorrow?" with a
   calendar server connected.
   Good answer: the model picks the "list events" tool and arguments; the host sends the request via
   the client; the server reads the calendar and returns events; the host gives them to the model,
   which writes the answer; the model never touches the calendar itself.
4. Why can a vague tool description cause trouble?
   Good answer: the model picks tools from names and descriptions, so a vague or misleading one can
   lead it to choose the wrong tool or misuse it.

## Completion criteria
The learner can name the three offerings and who controls each, describe the path of a call through
host, client and server, and explain why descriptions and results matter (checks 1-4).

## Going further
- The "Tool and function calling" lesson of *AI Agents and Tools* shows the same pattern from the
  application's side.
- Topic to explore: how a server's list of tools is shown to the model alongside your messages.
