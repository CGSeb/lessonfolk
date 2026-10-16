---
id: how-ai-models-work/01-text-to-tokens
title: From text to tokens
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what a token is and why a model reads tokens, not letters or words
  - Use tokens to explain odd behaviours such as miscounting letters
  - Connect tokens to the context window and to the size of a request
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **A model never sees your text as letters or words. It sees tokens.** A token is a
   piece of text from a fixed list the model was built with. Common words are often one
   token ("house"), rarer words are cut into several ("unbelievably" might become
   "un", "believ", "ably"), and spaces, punctuation and emoji count too.
2. **Each token is just a number to the model.** Before the model does anything, a simple
   program (the *tokenizer*) turns your text into a list of token numbers. The model
   predicts the next number, and the tokenizer turns the answer back into text. The
   model does not "read" in the human sense.
3. **That explains some famous oddities.** Asked how many times a letter appears in a
   word, a model may get it wrong: the word reached it as one or two tokens, with the
   letters hidden inside. The same goes for reversing words, rhymes and exact character
   counts, and for long numbers, which are often split in uneven chunks.
4. **Tokens are the unit for size.** A rough rule of thumb in English is that a token is
   about three-quarters of a word. The same text in other languages usually takes more
   tokens, because token lists are built mostly from the languages that dominate the
   training text. Code and unusual formatting also cost more.
5. **The context window is counted in tokens.** The amount of text a model can handle at
   once (your messages, its answers, any pasted documents) is limited in tokens, not
   pages. Services also usually price their use per token. This is why a long
   conversation can "forget" its beginning and why a short question in one language can
   cost more than in another.

## Teaching notes
- Analogy: tokens are like Lego bricks from a fixed box. Common shapes come as one big
  brick, unusual things are built from small ones. The model only ever handles bricks,
  never the "drawing" of the letters on them.
- Demo: ask the learner to count the letters of a long word out loud, then ask them how
  a model that only sees two number-bricks could do it. If the learner has access to a
  tokenizer demo page from a model provider, they can paste a sentence and see the pieces;
  do not require it.
- Misconception: "the model is bad at counting letters, so it must be stupid". It is a
  limit of the input form, not of its general ability. Recent assistants often get such
  tasks right by spelling the word out step by step or by using a tool, which is itself
  a good lesson.
- Misconception: tokens equal words. Keep the "about three-quarters of a word" figure
  clearly labelled as a rough English average.
- Do not give exact token counts for particular models or exact prices: they change.
- Beginners to the course after the level check may not remember next-token prediction:
  restate it in one sentence (covered in AI Foundations) before starting.
- Pacing: ideas 1-2 are quick; spend the time on 3 (it is the "aha") and on applying 4-5.

## Check your understanding
1. In your own words, what is a token, and why does a model work with tokens rather than
   letters?
   Good answer: a token is a piece of text (a word, part of a word, punctuation) from a
   fixed list, turned into a number; models work on these numbers, so letters inside a
   token are not directly visible to them.
2. A friend says: "This AI cannot even count the r's in 'strawberry', so it is not
   intelligent." What would you answer?
   Good answer: the model sees a few tokens, not individual letters, so letter counting
   is awkward for it; it is a limit of how text is fed in, not proof about its general
   ability, and asking it to spell the word out helps.
3. You paste a long report in your own language and the assistant says it has run out of
   room, although it looks short to you. Give two reasons why.
   Good answer: the context window is counted in tokens, not pages; some languages, code
   or odd formatting use more tokens per word; the conversation so far and the answer also
   take room.

## Completion criteria
The learner can explain what a token is, use it to explain why a model miscounts letters,
and say why context limits and costs are measured in tokens (checks 1-3).

## Going further
- The "Conversation memory and context limits" lesson of *How AI Apps Work* shows how
  developers manage the token budget.
- Search for a "tokenizer" demo page from a model provider to see your own text cut into
  tokens.
