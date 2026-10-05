---
id: ai-agents-and-tools/03-the-agent-loop
title: "The agent loop: plan, act, observe"
level: intermediate
estimatedMinutes: 25
objectives:
  - Explain the plan, act, observe cycle of an agent
  - Build a loop that runs tool calls until the task is done
  - Stop the loop safely with a step limit
prerequisites:
  - ai-agents-and-tools/02-tool-and-function-calling
---

## Key ideas
1. **An agent is a loop around tool calling.** Send the messages and tools. If the model asks
   for tools, run them, add the results to the messages and send again. If it answers with
   text, the task is done. That simple loop is the core of most agents.
2. **Plan, act, observe.** In each turn the model decides what to do next (plan), asks for a
   tool (act), and reads the result (observe). Asking it in the system prompt to state a short
   plan before acting often makes its choices more sensible and easier for you to follow.
3. **The history is the agent's memory.** Every tool call and result is added to the
   messages, so the model can see what it has already tried. This is the history from Build
   with AI, growing faster: long tasks need trimming or summaries, and cost more.
4. **Always set a step limit.** A model can loop: calling the same tool again and again or
   never deciding it is done. A maximum number of steps (and ideally a time or token budget)
   guarantees the loop ends, with a clear message when it hits the limit.
5. **Make every step visible.** Print or log each tool call, its arguments and its result.
   Reading this trace is how you understand, debug and improve an agent (lesson 5).

## Teaching notes
- Build on lesson 2's code: the loop is the round trip from the exercise, repeated.
- Analogy that works: **a detective**. Look at the clues, decide what to check next, check it,
  update the theory, repeat until the case is solved, but with a deadline, or the
  investigation never ends.
- Demo: before coding, walk through a trace on paper for "Can I buy 2 teapots and a red mug?":
  check teapot stock, check red mug stock, then answer. Ask the learner to predict each step.
- Misconception: "the agent plans everything at the start". Usually it decides one step at a
  time based on what it observed; plans change.
- Misconception: "more steps means better results". Long loops add cost and more chances to
  go wrong; a good tool set and prompt lead to short loops.
- Local models may be slow over many steps; keep tasks small (2–4 tool calls).

## Check your understanding
1. Describe the agent loop in a few steps.
   Good answer: send messages and tools; if the reply has tool calls, run them, add the results and repeat; if it is a text answer, stop and return it.
2. Why must an agent loop have a step limit?
   Good answer: the model can repeat calls or never finish; a limit guarantees the loop ends and controls cost and time.
3. How does the agent "remember" what it already tried during a task?
   Good answer: each tool call and its result are added to the message history sent in every turn.

## Exercise
Needs a computer, Python and your setup — free, code. Turn lesson 2 into a loop:

```python
MAX_STEPS = 6
TOOL_FUNCTIONS = {"check_stock": check_stock}

def run_agent(question):
    messages = [
        {"role": "system", "content": "You help shop customers. Use tools to check facts. "
         "Briefly say your plan before calling a tool."},
        {"role": "user", "content": question},
    ]
    for step in range(MAX_STEPS):
        message = call_model(messages, TOOLS)  # returns choices[0].message
        messages.append(message)
        calls = message.get("tool_calls") or []
        if not calls:
            return message.get("content")
        for call in calls:
            name = call["function"]["name"]
            args = json.loads(call["function"]["arguments"])
            function = TOOL_FUNCTIONS.get(name)
            result = function(**args) if function else f"Error: unknown tool {name}."
            print(f"step {step}: {name}({args}) -> {result}")
            messages.append({"role": "tool", "tool_call_id": call["id"], "content": result})
    return "Sorry, I could not finish this task within the step limit."
```

Add a second tool (for example `get_price(item)`), then ask a question that needs both. Read
the printed trace with the tutor. Finally, set `MAX_STEPS = 1` and see what happens.

## Completion criteria
The learner answers the checks correctly and has a working agent loop with at least two tools,
a step limit and a printed trace.

## Going further
- Next lesson: giving the model your own documents (RAG basics).
