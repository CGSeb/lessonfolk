---
id: build-with-ai/05-errors-cost-and-latency
title: Handling errors, cost and latency
level: intermediate
estimatedMinutes: 20
objectives:
  - Handle common API errors with timeouts and retries
  - Explain what drives cost and response time
  - Keep API keys and usage under control
prerequisites:
  - build-with-ai/04-conversation-memory
---

## Key ideas
1. **Calls fail, so plan for it.** Networks drop, servers are busy, free tiers hit **rate
   limits** (a cap on requests or tokens per minute or per day), and local models can run out
   of memory. Always set a timeout, catch errors, and show the user a clear message instead of
   crashing.
2. **Retry the right errors, with waiting.** Temporary errors (timeouts, rate limits, server
   errors) are worth retrying after a pause that grows each time (**exponential backoff**:
   wait 1 s, then 2 s, then 4 s…), with a maximum number of tries. Errors in your request
   (bad key, invalid parameters) will not fix themselves: do not retry those.
3. **Tokens drive cost and time.** Hosted APIs usually charge per token in and out, and every
   token takes time to process or generate. Long system prompts, long histories and long
   answers all add up. Limit the reply length, trim history, and check the usage numbers the
   API returns.
4. **Streaming makes waiting feel shorter.** Instead of waiting for the full reply, an API can
   send it piece by piece as it is generated, so the user starts reading at once. The total
   time is similar; the experience is much better for long answers.
5. **Protect your key and your budget.** Keep keys in environment variables, never in code,
   screenshots or repositories; if a key leaks, revoke it and create a new one. Use the
   spending or usage limits your provider offers, so a bug or a leak cannot run up a bill.

## Teaching notes
- Never quote prices, free-tier limits or rate-limit numbers: they change often and differ
  between providers. Point the learner to their provider's documentation and usage page.
- With a local model there is no bill, but the same ideas apply as time and hardware limits:
  long prompts are slow, and the machine can run out of memory.
- Analogy that works: **calling a busy restaurant to book a table**. If the line is busy, you
  wait a bit and call again, waiting longer each time; if they say they are closed on that
  day, calling again will not help.
- Misconception: "retrying immediately and repeatedly is the fastest way". It makes rate
  limits worse; backoff is the polite and effective way.
- Misconception: "streaming makes the model faster". It improves perceived speed, not
  generation speed.
- Streaming code varies by tool; describe the concept and let the learner follow their tool's
  documentation if they want to try it. The exercise does not require it.
- For learners who have built web services, connect to what they know: timeouts, retries,
  idempotency, secrets management.

## Check your understanding
1. Your app gets a "too many requests" error. What should it do?
   Good answer: wait and retry with exponential backoff and a maximum number of tries, and show a clear message if it still fails; not retry immediately in a loop.
2. Which errors should you not retry, and why?
   Good answer: errors caused by the request itself, such as an invalid key or bad parameters, because sending the same request again will fail the same way.
3. Name two ways to reduce the cost or response time of an AI feature.
   Good answer: any two of shorter system prompts, trimming or summarising history, limiting reply length, choosing a smaller model, streaming for perceived speed (time only), caching repeated answers.

## Exercise
Needs a computer, Python and your setup — free, code. Wrap your model call with a timeout
and retries:

```python
import time
import requests

RETRYABLE = {429, 500, 502, 503, 504}

def call_with_retries(payload, tries=4):
    for attempt in range(tries):
        try:
            response = requests.post(URL, headers=HEADERS, json=payload, timeout=60)
            if response.status_code not in RETRYABLE:
                response.raise_for_status()
                return response.json()
        except (requests.Timeout, requests.ConnectionError):
            pass
        time.sleep(2 ** attempt)
    raise RuntimeError("The model is not responding, please try again later.")
```

Test it by pointing `URL` at a wrong address or stopping your local runner. Then print the
usage numbers of a short and a long conversation and compare them with the tutor.

## Completion criteria
The learner answers the checks correctly and has a model call with a timeout, retries with
backoff for temporary errors, and a clear error message.

## Going further
- Your provider's documentation on rate limits, usage and spending limits.
- Next lesson: building a small chatbot.
