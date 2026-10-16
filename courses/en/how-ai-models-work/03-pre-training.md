---
id: how-ai-models-work/03-pre-training
title: "Pre-training: learning from a mountain of text"
level: intermediate
estimatedMinutes: 15
objectives:
  - Describe how pre-training works and what the model ends up knowing
  - Explain a knowledge cutoff and why hallucinations follow from how knowledge is stored
  - Say why scale matters and why training is done rarely
prerequisites:
  - how-ai-models-work/02-embeddings-meaning-as-numbers
---

## Key ideas
1. **Pre-training is a huge fill-in-the-blank game.** The model is shown text with the
   next token hidden and asked to guess it. At first it guesses badly. Each time, the
   many adjustable numbers inside it (its *parameters*) are nudged a little so the right
   answer becomes more likely. Repeat over an enormous amount of text, from books, websites,
   code and more.
2. **Nobody writes the knowledge in.** Grammar, facts, styles and reasoning habits are
   all by-products of getting better at that one game. To predict the end of a sentence
   about a capital city, it helps to have absorbed which city is the capital.
3. **What is learned is compressed and blurry, not a database.** The model keeps patterns,
   not a copy of its sources. Well-covered facts are usually reliable, rare or obscure ones
   are fuzzy. When the model fills a gap with something plausible instead of "I don't
   know", you get a hallucination (covered in *Using AI Safely and Wisely*).
4. **Training stops on a date.** Everything after the *knowledge cutoff* is unknown to the
   model unless a tool such as web search or a pasted document provides it. The model also
   often does not know precisely where its own cutoff is.
5. **Scale matters.** In general, more parameters, more and better text, and more computing
   power give a more capable model, up to a point. Pre-training takes a huge amount of
   computing power, so it is done rarely and by few organisations. Everyone else reuses
   the result.
6. **The result is a base model, not an assistant.** It continues any text, like a very
   good autocomplete: give it a question and it may continue with more questions. Turning
   it into something you chat with is the next lesson.

## Teaching notes
- Analogy: someone who read a giant library once, fast, and kept the gist of everything
  but not the page numbers. Ask them for a famous fact and they answer well; ask them for an
  exact quote from page 212 and they may make something up that sounds right.
- Misconception: "the model stores all the internet and looks things up". It cannot
  quote most of its sources, and the model is far smaller than the text it saw.
- Misconception: "it learns from my chats while we talk". Pre-training is over; during a
  conversation the model's numbers do not change. Whether a provider uses chats for later
  training is a separate, privacy question (see *Using AI Safely and Wisely*).
- Keep claims about sizes, data volumes, costs and dates out: they age quickly.
- Beginners: stick to ideas 1, 3 and 4. Experienced learners can discuss why scale helps
  and the role of data quality.
- Pacing: idea 3 connects to hallucinations the learner has already met; use their own
  experience if they have one.

## Check your understanding
1. What task does a model practise during pre-training, and how does it get better?
   Good answer: it guesses hidden next tokens in lots of text and its parameters are
   adjusted a little after each guess to make the right answer more likely.
2. Why is it a poor idea to expect an exact quotation or a precise figure from the model's
   memory alone?
   Good answer: knowledge is stored as compressed patterns, not a copy of sources, so
   details can be fuzzy and filled in with plausible but wrong text.
3. You ask an assistant with no web access about "the latest" release of a tool and it
   describes one confidently. What might be going on and what would you do?
   Good answer: knowledge cutoff, it only knows the world up to training; it may present
   an older or invented release; check an up-to-date source or give it the information.

## Completion criteria
The learner can explain pre-training as learning by guessing the next token, and link the
blurry storage of knowledge and the cutoff to wrong or outdated answers (checks 1-3).

## Going further
- Topic to explore: why data quality and not only quantity matters in training.
- The "What prompting cannot fix" lesson of *Prompting Basics* shows the practical side
  of these limits.
