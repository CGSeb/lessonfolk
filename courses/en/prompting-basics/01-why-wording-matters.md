---
id: prompting-basics/01-why-wording-matters
title: Why wording matters
level: beginner
estimatedMinutes: 15
objectives:
  - Explain what a prompt is
  - Turn a vague request into a clear one by adding context, goal and audience
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **A prompt is simply the message you send to an AI assistant.** It can be a question,
   an instruction, or a piece of text to work on. "Prompting" just means writing that
   message well.
2. **The assistant only knows what is in the conversation.** It cannot see your screen,
   your situation or what you have in mind. If something matters for the answer and you
   did not say it, the assistant has to guess — and it will usually guess the most generic
   option.
3. **Give context**: the background the assistant needs. Who you are, what situation you
   are in, what you have already tried. "Write an email to my landlord" becomes "Write an
   email to my landlord: the heating has been broken for a week and I reported it twice."
4. **Say your goal and your audience.** What is the answer for, and who will read it? A
   summary for your boss, an explanation for a 10-year-old and notes for yourself are three
   very different answers to the same request.
5. **Specific beats short.** A few extra sentences of context, goal and audience usually
   save several rounds of back-and-forth. A clear prompt does not need special words, just
   the information a helpful person would ask you for.

## Teaching notes
- Briefly recall from AI Foundations that the model predicts likely text from what it is
  given: a vague prompt gets a "likely", average answer. One sentence is enough; do not
  re-teach the lesson.
- Analogy that works: **briefing a new colleague or a stranger** on the phone. They are
  smart but know nothing about your situation. What would they need to ask you before
  helping? Those answers belong in the prompt.
- Live demo: ask the learner for something they need (a message, a plan, an explanation).
  Answer a deliberately vague version first, then a version with context, goal and audience,
  and let them compare. You are the assistant, so you can do this directly in the chat.
- Misconception: "good prompts use secret keywords or a special formula". No — plain,
  clear language works best. (Lesson 5 comes back to "magic phrases".)
- Misconception: "the AI knows me / remembers what I meant". It only has the current
  conversation (and whatever memory or files a given tool explicitly provides).
- For learners who already use chat assistants a lot, go faster and focus on the goal and
  audience, which they most often leave out.
- Keep it light and practical; most of the lesson should be the learner rewriting prompts.

## Check your understanding
1. Why does a vague request often get a generic answer?
   Good answer: the assistant only knows what is in the conversation, so it has to guess the missing details and falls back on the most common, average answer.
2. Rewrite this prompt to make it clearer: "Give me ideas for dinner."
   Good answer: adds at least two of context (e.g. ingredients at hand, diet, time available), goal (e.g. quick weeknight meal) and audience (e.g. two kids who dislike spicy food).
3. Name the three things this lesson suggests adding to a prompt, and say why the audience matters.
   Good answer: context, goal and audience; the audience changes the vocabulary, level of detail and tone of the right answer.

## Exercise
Needs a chat assistant (this one works) — free. Pick something you really need this week
(an email, a plan, an explanation). Ask for it in one short sentence, then ask again with
context, goal and audience. Compare the two answers with the tutor: what changed, and why?

## Completion criteria
The learner answers the checks correctly, and in particular rewrites a vague prompt by adding
at least two of context, goal and audience.

## Going further
- Next lesson: giving a role, examples and an output format.
