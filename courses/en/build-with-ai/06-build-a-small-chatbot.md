---
id: build-with-ai/06-build-a-small-chatbot
title: Build a small chatbot
level: intermediate
estimatedMinutes: 25
objectives:
  - Combine a system prompt, history and error handling in one program
  - Build and test a small terminal chatbot with a clear purpose
  - Add one feature of your choice
prerequisites:
  - build-with-ai/05-errors-cost-and-latency
---

## Key ideas
1. **Start from a clear, narrow purpose.** A chatbot that does one thing well (a study
   buddy for one subject, a recipe helper, a support bot for a club's questions) is easier to
   prompt, test and trust than a "does everything" assistant.
2. **The core is a loop.** Read the user's message, add it to the history, send the trimmed
   history with the system prompt, show the reply, add it to the history, repeat until the
   user quits. Every earlier lesson is one part of this loop.
3. **Put the pieces together.** The system prompt from lesson 2 sets the purpose; the history
   and trimming from lesson 4 keep the conversation going; the retries and messages from
   lesson 5 keep it from crashing; structured output from lesson 3 is useful if the bot must
   produce data (a saved shopping list, a quiz score).
4. **Test it like a user would.** Try normal questions, vague ones, off-topic ones, very long
   ones, an attempt to break the rules, and a pulled network cable. Write down what went
   wrong and fix one thing at a time.
5. **Add one feature, not ten.** Pick one improvement: a `/reset` command, saving the
   conversation to a file, a JSON summary at the end, streaming replies, or a second
   "mode" in the system prompt. Small, finished features beat large, half-done ones.

## Teaching notes
- This lesson is mostly building. Let the learner choose the chatbot's purpose, and keep
  your explanations short; act as a pair programmer who reviews their code and asks
  questions rather than writing everything for them.
- If the learner's earlier exercises are done, reuse their functions; if not, start from the
  scaffold in the exercise.
- Analogy that works: **assembling furniture**. Every part was made in an earlier lesson; now
  you follow the order and tighten the screws. Test it before putting weight on it.
- Misconception: "it works on my three questions, so it works". Idea 4: systematic testing
  with awkward inputs finds most problems early.
- Watch for common bugs: forgetting to append the assistant reply to the history, trimming
  away the system prompt, retrying non-retryable errors, printing the API key in logs.
- For fast learners, suggest a second feature or a simple evaluation: a list of ten test
  messages they rerun after each change.
- Allow more time if needed; it is fine to split this lesson across two sessions and save a
  note about where the learner stopped.

## Check your understanding
1. Describe the main loop of your chatbot step by step.
   Good answer: read input, append it to the history, send the system prompt plus trimmed history, handle errors, show the reply, append it to the history, repeat until quit.
2. Which kinds of messages did you test, and what did one of the tests reveal?
   Good answer: names several kinds (normal, vague, off-topic, long, rule-breaking, network failure) and describes one concrete problem found and how they fixed or would fix it.
3. Why is it better to give a chatbot one narrow purpose at first?
   Good answer: a narrow purpose is easier to describe in the system prompt, test thoroughly and trust, and its failures are easier to spot.

## Exercise
Needs a computer, Python and your setup — free, code. Required for this lesson. Start from
this scaffold, using your functions from lessons 4 and 5:

```python
SYSTEM = "You are ..."  # your chatbot's purpose, tone and rules

def main():
    history = [{"role": "system", "content": SYSTEM}]
    print("Type 'quit' to stop.")
    while True:
        user_text = input("> ").strip()
        if user_text.lower() == "quit":
            break
        if not user_text:
            continue
        history.append({"role": "user", "content": user_text})
        try:
            reply = ask(history)  # trims history and calls the model with retries
        except RuntimeError as error:
            print(error)
            history.pop()
            continue
        history.append({"role": "assistant", "content": reply})
        print(reply)

main()
```

Give it a purpose, test it with at least five kinds of messages, fix what breaks, and add one
feature. Show the tutor your system prompt, a sample conversation and your feature.

## Completion criteria
The learner has a working chatbot with a system prompt, history, error handling and one added
feature, tested with several kinds of input, and answers the checks correctly.

## Going further
- Next lesson: sharing your chatbot safely, and where to go next.
