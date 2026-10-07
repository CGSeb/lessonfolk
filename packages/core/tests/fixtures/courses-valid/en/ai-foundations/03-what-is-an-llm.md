---
id: ai-foundations/03-what-is-an-llm
title: What is a large language model?
level: beginner
estimatedMinutes: 20
objectives:
  - Explain what an LLM does at a high level
  - Understand "predicting the next word"
  - Know why LLMs can be wrong while sounding confident
prerequisites:
  - ai-foundations/02-how-machines-learn
---

## Key ideas
1. **An LLM is a model trained on a huge amount of text** (books, websites, code…) to
   produce text. Chat assistants are built on LLMs.
2. **Its core skill is predicting what comes next.** Given some text, it predicts a likely
   next piece of text (a "token", roughly a word or part of a word), adds it, and repeats.
   Doing this extremely well produces answers, summaries, code and more.
3. **Training happens in stages**: first on lots of general text, then further training to
   follow instructions and be helpful and safe in a conversation.
4. **Fluent is not the same as correct.** Because it generates likely text, an LLM can state
   wrong things confidently ("hallucinations"). Important facts should be checked.
5. **Context matters**: the model only sees what is in the conversation (and any tools or
   files it is given). Clear instructions and examples get better results.

## Teaching notes
- You are an LLM: it is fine and engaging to say so, and to use yourself as the live example.
- Demo idea: give the learner a sentence start ("The cat sat on the…") and ask what comes next — that is next-token prediction.
- Misconception: "it searches the internet for every answer". Usually not; it generates from what it learned, unless connected to a search tool.
- Keep claims about model sizes and dates out — they age quickly.

## Check your understanding
1. In one sentence, what does an LLM do?
   Good answer: generates text by repeatedly predicting a likely next token, after training on lots of text.
2. Why can an LLM give a wrong answer that sounds very sure?
   Good answer: it produces plausible text, not verified facts; plausibility ≠ truth.
3. Give one tip to get a better answer from a chat assistant.
   Good answer: give context, be specific, give examples, ask it to show its reasoning or sources, etc.

## Exercise
Ask a chat assistant (this one works) a question you already know the answer to in detail,
from your job or hobby. Look for anything inaccurate or vague and discuss it with the tutor.

## Completion criteria
The learner can explain next-token prediction in their own words and why outputs should be checked.

## Going further
- Next course idea: "Prompting basics — talking to AI effectively".
