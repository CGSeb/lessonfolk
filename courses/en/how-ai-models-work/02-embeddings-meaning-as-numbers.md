---
id: how-ai-models-work/02-embeddings-meaning-as-numbers
title: "Embeddings: meaning as numbers"
level: intermediate
estimatedMinutes: 15
objectives:
  - Explain what an embedding is and why similar meanings end up close together
  - Describe how a model uses embeddings inside, and how search tools use them outside
  - Name what embeddings capture and what they do not
prerequisites:
  - how-ai-models-work/01-text-to-tokens
---

## Key ideas
1. **A token number says nothing about meaning.** The number for "cat" could just as well
   sit next to the number for "tax". To work with meaning, the model first replaces each
   token with a long list of numbers called an *embedding*. Think of it as the token's
   coordinates on a huge map of meaning.
2. **Close on the map means close in meaning.** "Cat" lands near "kitten" and "dog",
   far from "invoice". Nobody places the words by hand: the coordinates are learned during
   training, because words used in similar situations end up needing similar coordinates
   to predict the text around them.
3. **The map has hundreds or thousands of directions, not two.** That is why it can hold
   many kinds of closeness at once (topic, tone, grammar, formality). You cannot picture
   it, but you can still reason with distance: near means similar, far means different.
4. **Context reshapes meaning.** Inside the model, the starting coordinates of a word are
   adjusted by the words around it, so "bank" in "river bank" and in "bank account" end up
   in different places. This is much of what lets a model use the whole conversation.
5. **Embeddings also work outside the model.** A whole text, not just a word, can be turned
   into one embedding. Comparing the embeddings of a question and of many documents finds
   the documents closest in meaning, even with no shared words. This "search by meaning" is
   the engine of the document-answering technique covered in *AI Agents and Tools*.
6. **They capture similarity, not truth.** Two sentences can be close because they discuss
   the same subject while saying opposite things. And embeddings absorb the patterns of
   the text they were learned from, including its biases.

## Teaching notes
- Analogy: a city map where every shop is placed by what it sells. Bakeries cluster, law
  firms cluster. Now imagine the map has 1,000 directions instead of two: shops can be
  close because of what they sell, their prices and their opening hours all at once.
- Demo: give three words ("kitten", "puppy", "mortgage") and ask which two are closest
  and why. Then ask how a computer, which only has numbers, could know that.
- Misconception: "the model stores a dictionary definition for each word". It has
  coordinates learned from usage, not definitions.
- Misconception: "close means true or agreeing". A sentence and its negation are usually
  very close: say it explicitly in idea 6.
- Keep the maths out: no vectors, distances or formulas. "Coordinates" and "near" are
  enough. For advanced learners, mention that "how near" is measured with a simple
  formula, without giving it.
- Do not give embedding sizes of specific models: they change.
- Pacing: spend most time on 2 and 5; 3 and 4 can be one sentence each for a hurried learner.

## Check your understanding
1. Why does a model turn each token into an embedding instead of using the token number
   directly?
   Good answer: the token number carries no meaning; the embedding places the token on a
   map where similar meanings are close, which the model can compute with.
2. A company wants its staff to find the right policy page by typing a question in
   everyday words, even if the page uses different words. How could embeddings help?
   Good answer: turn the question and each page into embeddings and return the pages
   closest in meaning, so shared keywords are not needed.
3. Someone says: "These two sentences are close in embedding space, so they agree." What
   is wrong with that?
   Good answer: closeness reflects similar subject or wording, not agreement or truth;
   opposite claims on the same topic can be very close.

## Completion criteria
The learner can describe an embedding as a learned position on a map of meaning, give one
use inside and one outside the model, and state one limit (checks 1-3).

## Going further
- The "Giving a model your data (RAG basics)" lesson of *AI Agents and Tools* shows
  search by meaning at work.
- Topic to explore: why "meaning" learned from text reflects the biases of that text
  (see *Using AI Safely and Wisely*).
