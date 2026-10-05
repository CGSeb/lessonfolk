---
id: prompting-basics/02-role-examples-and-format
title: Role, examples and output format
level: beginner
estimatedMinutes: 20
objectives:
  - Use a role to set the perspective of an answer
  - Show an example to get the style or structure you want
  - Ask for a precise output format, length and tone
prerequisites:
  - prompting-basics/01-why-wording-matters
---

## Key ideas
1. **A role sets the perspective.** Starting with "Act as a patient math teacher" or "You
   are a travel agent who knows budget trips" tells the assistant which point of view,
   vocabulary and priorities to use. It does not give the assistant new knowledge; it
   points it at the right style of answer.
2. **One example is worth many adjectives.** Instead of describing the style you want
   ("short, friendly, a bit funny"), paste an example of it and say "write it like this".
   Giving one or a few examples in the prompt is called **few-shot prompting** ("shot" just
   means example).
3. **Ask for the format you need.** A bulleted list, a table with named columns, numbered
   steps, a single paragraph, an email with a subject line… If you do not say, you get
   whatever format the assistant finds most likely.
4. **Set length and tone.** "In 3 sentences", "under 100 words", "formal", "warm and
   simple", "no jargon". These are cheap to add and change the answer a lot.
5. **Add constraints for what to avoid or include.** "Do not use technical terms",
   "include a price estimate", "only use the ingredients I listed". Constraints keep the
   answer inside the box you need.

## Teaching notes
- Analogy that works: **ordering at a café**. "A coffee" gets you something; "a large oat
  latte, not too hot, to take away" gets you what you wanted. Role, example, format, length
  and tone are the details of the order.
- Demo: take one request (e.g. "explain what a budget is") and answer it three ways in the
  chat: with no extras, with a role ("as a friendly bank advisor talking to a teenager"), and
  with a format ("a 3-row table: income, spending, savings"). Let the learner say which
  helped most.
- Misconception: "giving a role makes the AI an expert" — e.g. "act as a doctor" does not
  make medical answers reliable. The role changes the style, not the accuracy. Keep this to
  one sentence here; lesson 5 covers limits.
- Misconception: "examples will be copied word for word". The assistant usually follows the
  pattern (length, tone, structure), not the content. If it copies too closely, say so.
- Keep the jargon to one term: "few-shot". Define it once, then just say "examples".
- For experienced learners, have them combine all five ideas in one prompt and critique it
  together.
- Pacing: ideas 3–5 go quickly; spend most time on examples (idea 2), which beginners rarely
  think of.

## Check your understanding
1. What does giving the assistant a role change, and what does it not change?
   Good answer: it changes the perspective, vocabulary and style of the answer; it does not add knowledge or make the answer more correct.
2. You want product descriptions in the same style as one you already like. What is the most effective thing to put in your prompt?
   Good answer: paste the description they like as an example and ask for new ones in the same style (few-shot), rather than only describing the style in adjectives.
3. Improve this prompt so the answer is easy to use: "Tell me about the pros and cons of working from home."
   Good answer: asks for a specific format (e.g. a two-column table or two bulleted lists), and adds at least one of length, tone, audience or a constraint.

## Exercise
Needs a chat assistant (this one works) — free. Choose a task you repeat often (a weekly
update, a social post, a shopping list). Write one prompt that uses a role, an example of a
past version you liked, and a clear format and length. Run it, then remove the example and
run it again. Discuss the difference with the tutor.

## Completion criteria
The learner answers the checks correctly, including that a role changes style but not
accuracy, and writes a prompt that specifies at least a format plus one of example, length,
tone or constraint.

## Going further
- Next lesson: what to do when the answer misses the mark.
