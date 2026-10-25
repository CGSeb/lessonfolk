---
id: ai-agents-and-tools/04-giving-a-model-your-data
title: Giving a model your data (RAG basics)
level: intermediate
estimatedMinutes: 20
objectives:
  - Explain retrieval-augmented generation (RAG) and why it is needed
  - Explain how keyword search and search by meaning (embeddings) each find relevant passages in your own documents
  - Make the model answer from those passages and cite them
prerequisites:
  - ai-agents-and-tools/03-the-agent-loop
---

## Key ideas
1. **Models do not know your documents.** A model knows what it learned in training, not your
   company handbook or your notes. The obvious fix, pasting everything into the prompt (the
   text you send to the model), often fails: a model can only read a limited amount of text at
   once, called its **context window**, and a long document may not fit. Even when it fits,
   it is slower, costs more, and the useful sentence can get lost in the pile.
2. **RAG: retrieve, then generate.** **RAG (retrieval-augmented generation)** means: first
   *retrieve* (look up) the few passages that matter for this question, then *generate* an
   answer from them. Think of asking a colleague about a 200-page handbook: they do not
   reread it all, they open the index, find two pages and answer from those. The pipeline has
   three steps: prepare the documents once (cut them into **chunks**, a paragraph or a few
   hundred words each, small enough to be useful on their own), retrieve the best chunks for
   each question, then put them in the prompt with clear instructions and let the model answer.
3. **Retrieval by keywords.** The simplest way to find the best chunks is to score each one by
   the words it shares with the question, giving more weight to rare words ("relocation")
   than to common ones ("the"). It needs no extra model, and you can see exactly why a chunk
   was picked. Its weakness: it only matches the words themselves. A question about
   "holiday allowance" finds nothing in a chunk that says "annual leave", even though they
   mean the same thing.
4. **Retrieval by meaning (embeddings).** To match meaning instead of words, a separate
   program, an **embedding model**, turns a piece of text into a list of numbers called an
   **embedding**. Think of those numbers as the text's coordinates on a map of meaning:
   texts about the same thing get nearby coordinates, even with different words. Turn every
   chunk into an embedding once and keep them; when a question arrives, turn it into an
   embedding too and pick the chunks closest to it. "Holiday allowance" then lands near
   "annual leave". You never read the numbers yourself. The idea is explained in
   *How AI Models Really Work* ("Embeddings: meaning as numbers"). Limits: "close" means "about the
   same subject", not "contains the answer", and exact names or codes (an invoice number)
   are often better found by keywords. That is why real systems often combine both.
5. **Ground the answer and cite.** Tell the model to answer only from the given passages, to
   say when they do not contain the answer, and to name the passage it used. Citations let the
   user check the source (as in Using AI Safely and Wisely).
6. **Retrieval can be a tool.** In an agent, `search_documents(query)` is just another tool:
   the model decides when to search and what to search for, and can search again with other
   words if the first results were not good enough.

## Teaching notes
- Analogy that works: **an open-book exam**. The student (the model) does not memorise the
  book; a good index (retrieval) points to the right pages, and the student answers from them,
  quoting the page.
- Use one running example through the whole lesson: a small company handbook with three
  short passages, for instance "Annual leave: employees get 25 days of paid leave per year",
  "Moving house: you get 2 extra days of leave", "Expenses: send receipts within 30 days".
  Ask "How many days off do I get when I move?" and walk through each step: which chunk
  scores best by keywords (shared words: "days", "move"/"moving"), what changes if the
  question says "holiday allowance" (keywords fail, meaning still works).
- Before idea 4, check whether the learner knows what an embedding is, without assuming it.
  If they did *How AI Models Really Work*, remind them in one sentence. If not, use the map analogy
  (a city map where shops are placed by what they sell: bakeries cluster together) and keep
  maths out: no vectors, formulas or sizes. "Coordinates" and "nearby" are enough.
- Define each term the first time it appears: prompt, context window, chunk, retrieve,
  embedding. Do not use two of them in one sentence before the learner has met both.
- Both ways of retrieving matter. Do not present embeddings as an advanced extra the learner
  can skip. If they try it, their local runner or provider must offer an embedding model;
  follow its documentation, and do not name specific models.
- Misconception: "RAG makes answers correct". It helps the model use the right information,
  but retrieval can miss the right chunk, and the model can still misread or add things.
  Citations and "say when you don't know" reduce the risk; they do not remove it.
- Misconception: "just paste all the documents". Too much text is slow, costly, may not fit
  the context window, and can bury the relevant part.
- Misconception: "embeddings understand the question like a person". They only place text
  near similar text; two passages on the same subject can be close even if only one has the
  answer.
- Remind briefly that documents given to a hosted model leave the learner's computer (privacy
  lesson); a local model keeps them local.
- Pacing: ideas 3 and 4 deserve the most time. A hurried learner can take 5 and 6 in a sentence each.

## Check your understanding
1. What problem does RAG solve, and what are its main steps?
   Good answer: models do not know your documents and cannot take them all at once; RAG cuts documents into chunks, retrieves the relevant ones for a question, and gives them to the model to answer from.
2. A staff member asks about the "holiday allowance", but the handbook only says "annual leave". Would keyword search find the right passage? Would search by meaning? Why?
   Good answer: keyword search probably misses it because the words differ; search by meaning (embeddings) finds it because both phrases have nearby positions on the map of meaning, so no shared word is needed.
3. In your own words, what is an embedding, and how is it used to pick passages for a question?
   Good answer: a list of numbers that places a text on a map of meaning, so similar meanings are close; the chunks and the question are each turned into embeddings and the chunks closest to the question are retrieved.
4. Why ask the model to cite passages and to say when the answer is not in them?
   Good answer: it keeps the answer grounded in the documents, lets users check the source, and reduces invented answers when retrieval found nothing relevant.

## Completion criteria
The learner answers the checks correctly and can describe a retrieval-then-answer pipeline
that uses keywords or meaning to pick passages, cites them, and handles a question the
documents do not cover.

## Going further
- Topics: embeddings, vector search, chunking strategies, hybrid search.
- Next lesson: where agents fail.
