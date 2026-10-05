---
id: ai-agents-and-tools/04-giving-a-model-your-data
title: Giving a model your data (RAG basics)
level: intermediate
estimatedMinutes: 25
objectives:
  - Explain retrieval-augmented generation (RAG) and why it is needed
  - Retrieve relevant passages from your own documents with keyword search
  - Make the model answer from those passages and cite them
prerequisites:
  - ai-agents-and-tools/03-the-agent-loop
---

## Key ideas
1. **Models do not know your documents.** A model knows what it learned in training, not your
   company handbook or your notes, and your documents are often too large to paste in full.
   **RAG (retrieval-augmented generation)** means: find the relevant parts first, then give
   only those to the model with the question.
2. **Split, retrieve, then generate.** Split documents into **chunks** (a paragraph or a few
   hundred words each). For each question, find the chunks most likely to contain the
   answer. Put them in the prompt with clear instructions, and let the model answer.
3. **Retrieval can be by keywords or by meaning.** Keyword search scores chunks by the words
   they share with the question: simple, transparent, no extra model. **Embeddings** turn text
   into lists of numbers so that texts with similar meaning are close, which finds matches even
   with different words. Real systems often use embeddings, sometimes combined with keywords.
4. **Ground the answer and cite.** Tell the model to answer only from the given passages, to
   say when they do not contain the answer, and to cite which passage it used. Citations let
   the user check (as in Using AI Safely and Wisely).
5. **Retrieval can be a tool.** In an agent, `search_documents(query)` is just another tool: the
   model decides when to search and what to search for, and can search again if the first
   results were not good enough.

## Teaching notes
- Analogy that works: **an open-book exam**. The student (the model) does not memorise the
  book; a good index (retrieval) points to the right pages, and the student answers from them,
  quoting the page.
- Use the learner's own non-confidential text if they have some (notes, a public manual);
  otherwise use the small built-in example in the exercise.
- Keyword search is the required exercise; embeddings are an optional extension. If the
  learner tries embeddings, their local runner or provider must offer an embedding model;
  follow its documentation, and do not name specific models.
- Misconception: "RAG makes answers correct". It helps the model use the right information,
  but retrieval can miss the right chunk, and the model can still misread or add things.
  Citations and "say when you don't know" reduce the risk; they do not remove it.
- Misconception: "just paste all the documents". Too much text is slow, costly, may not fit
  the context window, and can bury the relevant part.
- Remind briefly that documents given to a hosted model leave the learner's computer (privacy
  lesson); a local model keeps them local.

## Check your understanding
1. What problem does RAG solve, and what are its main steps?
   Good answer: models do not know your documents and cannot take them all at once; RAG splits documents into chunks, retrieves the relevant ones for a question, and gives them to the model to answer from.
2. What is the difference between keyword search and embeddings for retrieval?
   Good answer: keyword search matches shared words (simple, transparent, misses synonyms); embeddings represent meaning as numbers so similar meanings match even with different words (needs an embedding model).
3. Why ask the model to cite passages and to say when the answer is not in them?
   Good answer: it keeps the answer grounded in the documents, lets users check the source, and reduces invented answers when retrieval found nothing relevant.

## Exercise
Needs a computer, Python and your setup — free, code. Build a tiny keyword RAG:

```python
import re

DOCS = [
    "Returns: items can be returned within 30 days with the receipt.",
    "Shipping: orders over 50 euros ship for free; smaller orders cost 5 euros.",
    "Opening hours: the shop is open Monday to Saturday, 9:00 to 18:00.",
]

def words(text):
    return set(re.findall(r"\w+", text.lower()))

def search(question, k=2):
    scored = sorted(DOCS, key=lambda d: len(words(d) & words(question)), reverse=True)
    return scored[:k]

def answer(question):
    passages = search(question)
    context = "\n".join(f"[{i + 1}] {p}" for i, p in enumerate(passages))
    messages = [
        {"role": "system", "content": "Answer only from the passages. Cite them like [1]. "
         "If they do not contain the answer, say you don't know."},
        {"role": "user", "content": f"Passages:\n{context}\n\nQuestion: {question}"},
    ]
    return call_model_text(messages)  # your Build with AI call, returning the reply text
```

Ask three questions: one answered by the documents, one with different wording ("Can I send
something back?"), and one not covered at all. Discuss the results with the tutor. Optional:
make `search` a tool for your lesson 3 agent, or try embeddings if your setup offers them.

## Completion criteria
The learner answers the checks correctly and has a working retrieval-then-answer pipeline that
cites passages and handles a question the documents do not cover.

## Going further
- Topics: embeddings, vector search, chunking strategies, hybrid search.
- Next lesson: where agents fail.
