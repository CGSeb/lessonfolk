---
id: connecting-ai-with-mcp/01-the-connection-problem
title: The connection problem
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain why an assistant needs connections to your tools and data
  - Explain why one-off integrations do not scale and what a shared standard changes
  - Name the three roles in MCP (host, client, server) and say who does what
prerequisites: []
---

## Key ideas
1. **On its own, an assistant only knows its training and the conversation.** To help with
   real work it needs to read your files, tickets, calendar or database, and sometimes to act:
   create a ticket, send a draft, run a query. Without connections you are the courier,
   copying information in and out by hand.
2. **Custom connections multiply.** If every assistant needs its own connector to every tool,
   the work grows as assistants times tools: three assistants and five tools mean fifteen
   connectors, each built, secured and maintained separately. A connector made for one
   assistant is no use to another.
3. **A shared standard turns a product into a sum.** The **Model Context Protocol (MCP)** is an
   open standard for how an assistant talks to a tool or data source. It was introduced by
   Anthropic and has since been adopted by many assistants and tools. A tool is wrapped once
   as an MCP server, and any assistant that speaks MCP can use it: three assistants and five
   tools need eight pieces instead of fifteen. Think of a common socket shape that every
   plug fits.
4. **There are three roles.** The **host** is the application you use (a chat app, a coding
   assistant). Inside it, a **client** keeps a connection to one server. The **server** is the
   program that offers a tool or a data source. The model does not reach out on its own: as in
   tool calling (covered in *AI Agents and Tools*), the model asks, and the host acts through
   the client.
5. **A standard makes connecting easier, not safer or smarter.** MCP does not make the model
   more capable, and it does not decide what is safe to connect. Every server you add brings its
   own access to your data and its own risks (lesson 5). It is also not the only way: a
   built-in integration, a file you paste, or your own code calling a tool can be simpler.

## Teaching notes
- Analogy: before a shared socket shape, every appliance came with its own plug and every
  country had its own wall socket. A common shape lets any appliance work anywhere.
  MCP plays that role for assistants and tools.
- Scenario to reason through with the learner (nothing to set up): a team uses two assistants and
  wants them to reach the issue tracker, the wiki and the calendar. Ask how many connectors they
  need if each assistant gets its own, and how many if the three tools each had one MCP server.
- Misconception: "MCP is an AI model or a product". It is a protocol, a set of agreed rules for
  messages, like the rules that let any browser talk to any web server.
- Misconception: "the model connects to the server directly". The host application does, on the
  model's request, and can ask you before it acts.
- Misconception: "MCP is only for coding assistants". Coding assistants were early adopters, but
  any assistant or app can speak it.
- Do not name particular servers, assistants, vendors or specification versions: they change fast.
- Beginners to the course: ideas 1 to 4 with the connector-counting scenario. Experienced learners:
  discuss when MCP is the wrong choice (idea 5).
- Pacing: idea 4 is the one to anchor; the next lesson builds on those three roles.

## Check your understanding
1. Why do custom connections between assistants and tools become hard to manage as more of each
   are added?
   Good answer: each assistant would need its own connector for each tool, so the number grows as
   assistants times tools, and each needs building, securing and maintaining; a connector for one
   assistant is no use for another.
2. In your own words, what does a shared standard like MCP change?
   Good answer: a tool is wrapped once as a server and any assistant that speaks the standard can use
   it, so the work grows as assistants plus tools rather than their product.
3. An assistant lists your open tickets from the issue tracker. Which of host, client and server does
   which part?
   Good answer: the model asks for the tool, the host (the app) handles the request through its
   client, and the server for the issue tracker retrieves the tickets and returns them; the model
   does not contact the tracker itself.
4. A colleague says "with MCP the assistant can safely do anything with our tools". What do you answer?
   Good answer: MCP only standardises the connection; it does not make the model more capable or the
   access safe, and each server brings its own permissions and risks that must be chosen and checked.

## Completion criteria
The learner can explain why connections are needed and why one-off connectors do not scale, describe
what a shared standard changes, name the roles of host, client and server, and state that a standard
does not make connections safe by itself (checks 1-4).

## Going further
- The "Tool and function calling" lesson of *AI Agents and Tools* explains the pattern MCP builds on:
  the model asks, the application acts.
- The Model Context Protocol documentation, at modelcontextprotocol.io, is the official reference.
