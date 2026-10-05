---
id: build-with-ai/03-structured-output
title: Structured output (JSON)
level: intermediate
estimatedMinutes: 20
objectives:
  - Ask a model for JSON with a clear shape
  - Parse and validate the output in code
  - Handle invalid output gracefully
prerequisites:
  - build-with-ai/02-system-prompts
---

## Key ideas
1. **Apps need data, not prose.** To use a model's answer in code (store it, show it in a
   form, make a decision), you need a predictable structure. **JSON** (a common text format
   for data, with keys and values) is the usual choice.
2. **Describe the shape and show an example.** Say exactly which fields you want, their
   types and allowed values, and give one example of a valid answer. Ask for JSON only, with
   no explanation around it.
3. **Always parse and validate.** The model generates text that usually matches, not
   guaranteed data. Parse it with a JSON library, then check that required fields exist and
   values make sense before using them.
4. **Plan for failure.** If parsing or validation fails, retry once with the error message
   ("Your answer was not valid JSON: … Answer again with JSON only"), and if it still fails,
   fall back to something safe (an error message, a default value, a human).
5. **Some APIs can enforce the structure.** Many providers and local runners offer a JSON
   mode or let you pass a schema that the output must follow. It reduces errors a lot, but
   keep validating: the structure can be right while the content is still wrong.

## Teaching notes
- Analogy that works: **a form instead of a letter**. Ask someone to write you a letter about
  their holiday and every letter is different; give them a form with boxes and you can put
  the answers straight into a spreadsheet.
- Demo: in this chat, produce a JSON answer for a small extraction task (e.g. extract name,
  date and amount from an invoice sentence), then show a slightly broken version (extra text
  before the JSON, a missing field) and ask the learner how their code should react.
- Do not name provider-specific parameters for JSON or schema modes; tell the learner to
  look for "JSON mode" or "structured output" in the documentation of their tool.
- Misconception: "if I ask for JSON, I get JSON". Usually, not always; small local models
  especially may add text or break the format. Validation is not optional.
- Misconception: "valid JSON means a correct answer". The format can be perfect while a
  value is invented or wrong (link to hallucinations).
- For experienced developers, mention validation libraries (e.g. schema validators) as
  topics, without pushing a specific one.

## Check your understanding
1. Why do apps usually need structured output from a model?
   Good answer: code needs predictable data (fields and values) to store, display or act on, which free-form prose does not provide.
2. Your code asks for JSON and the model returns "Sure! Here is the JSON: {...}". What should your code do?
   Good answer: fail parsing safely (or extract the JSON part), then retry with a clear instruction or fall back, rather than crash or trust it blindly.
3. A JSON mode guarantees valid JSON. Is the data then reliable?
   Good answer: no; the structure is valid but the values can still be wrong or invented, so content still needs validation and checking where it matters.

## Exercise
Needs a computer, Python and your setup — free, code. Ask the model to extract data from a
sentence and validate it:

```python
import json

SYSTEM = (
    "Extract the event from the user's text. Answer with JSON only, no other text, "
    'in this shape: {"title": string, "date": "YYYY-MM-DD" or null, "people": [string]}'
)

def parse_event(text):
    try:
        event = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(event.get("title"), str) or not isinstance(event.get("people"), list):
        return None
    return event
```

Send a few sentences (a clear one, one with no date, one in another language), parse each
reply with `parse_event`, and add one retry when it returns `None`. Tell the tutor how often
the first answer was valid.

## Completion criteria
The learner answers the checks correctly and has code that parses and validates model output,
with a retry or fallback for invalid answers.

## Going further
- Topic: JSON Schema, a standard way to describe the shape of JSON data.
- Next lesson: conversation memory and context limits.
