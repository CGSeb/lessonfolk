---
id: ai-agents-and-tools/02-tool-and-function-calling
title: Tool and function calling
level: intermediate
estimatedMinutes: 15
objectives:
  - Describe a function so a model can ask to call it
  - Explain how code runs the requested call and sends the result back
  - Validate tool arguments like any untrusted input
prerequisites:
  - ai-agents-and-tools/01-from-chatbot-to-agent
---

## Key ideas
1. **You describe tools; the model chooses them.** A tool definition has a name, a
   description of what it does and when to use it, and its parameters (as a **JSON Schema**, a
   standard way to describe the shape of JSON data: the fields, their types and which are
   required). You send these definitions with the messages, and the model can answer with a
   **tool call** instead of text: the tool's name plus arguments.
2. **The model asks, your code acts.** The model never runs anything. Your code reads the tool
   call, runs the matching Python function, and sends the result back as a message with the
   `tool` role. The model then uses that result to continue.
3. **Descriptions are prompts.** The model picks tools from their names and descriptions. Clear
   names, a sentence on when to use the tool, and well-described parameters matter as much as
   the code behind them.
4. **Validate the arguments.** Arguments come from the model, so treat them like user input:
   check types and allowed values, and refuse anything unexpected with a clear error message
   the model can read and correct.
5. **Native tool calling, or a JSON fallback.** Many APIs support tools natively (a `tools`
   parameter in the request). Some models, especially small local ones, do not. Then you can
   describe the tools in the system prompt and ask the model to reply with JSON like
   `{"tool": "check_stock", "arguments": {...}}`, which your code parses and validates as in
   Build with AI.

## Teaching notes
- The lesson needs no setup. If the learner tries it in code and their model does not support
  native tool calling, point them to the JSON fallback of idea 5 rather than spending the
  lesson on setup.
- When you show an example, follow the common chat-completions format for tools (`tools`,
  `tool_calls`, `role: "tool"` with `tool_call_id`). If the learner's API differs, say so;
  the concept is identical.
- Analogy that works: **a manager and an assistant**. The manager (the model) says "please
  check the stock of blue mugs"; the assistant (your code) goes to the warehouse and reports
  back. The manager never touches the shelves.
- Misconception: "the model executes my functions". It only produces a request; nothing happens
  unless your code runs it (and you decide what your code allows).
- Misconception: "if the model called the tool, the arguments are valid". Models can invent
  arguments or values; validation is required (link to lesson 5).
- Keep the tools in examples harmless and local (a dictionary lookup), never real emails or
  payments.

## Check your understanding
1. What happens, step by step, when a model "calls" a tool?
   Good answer: the model returns a tool call (name and arguments); the code validates and runs the function; the code sends the result back as a tool message; the model continues with that result.
2. Why do tool names and descriptions matter so much?
   Good answer: the model chooses tools and fills arguments from their names, descriptions and parameter schemas; unclear descriptions lead to wrong or missed calls.
3. What can you do if your model does not support native tool calling?
   Good answer: describe the tools in the system prompt and ask for a JSON reply naming the tool and arguments, then parse and validate it in code.

## Completion criteria
The learner answers the checks correctly and can walk through one tool call round trip (native
or JSON fallback), including argument validation.

## Going further
- Topic: JSON Schema, used to describe tool parameters.
- Next lesson: the agent loop.
