---
id: rag-in-depth/01-where-rag-goes-wrong
title: Where a RAG system goes wrong
level: advanced
estimatedMinutes: 20
objectives:
  - Name the stages of a RAG pipeline and what can fail at each
  - Trace a wrong answer back to the stage that caused it
  - Judge when a RAG pipeline is not needed at all
prerequisites: []
---

## Key ideas
1. **A RAG answer passes through three stages, and each can fail.** RAG (retrieval-augmented
   generation, covered in *AI Agents and Tools*) means: find the passages that matter in your
   documents, then let the model answer from them. In practice there are three stages.
   **Ingestion** turns the documents into searchable chunks, once, ahead of time. **Retrieval**
   picks a few chunks for each question. **Generation** writes the answer from those chunks.
   A wrong answer at the end says nothing about where it went wrong: the same symptom can
   come from any of the three.
2. **Ingestion failures: the answer was never there to be found.** The text extraction lost
   the content (a scanned PDF read as empty, a table flattened into a jumble of numbers). The
   chunking split a rule from its exception, or cut a sentence from the heading that gave it
   meaning ("Not allowed." from which policy?). The document is out of date, duplicated in
   three versions, or was never added. No search, however clever, finds what the index does
   not contain in a usable form.
3. **Retrieval failures: the answer exists but was not picked.** The question uses other words
   than the document, the right chunk ranks sixth when only five are kept, a near-duplicate
   crowds it out, or a passage on the same subject but without the answer wins. Retrieval
   failures are the most common, and the most invisible: the model receives plausible
   passages and writes a fluent answer from them.
4. **Generation failures: the right passage was there, the answer is still wrong.** The model
   ignores the passage and answers from its training, misreads a number, merges two passages
   that apply to different cases, cites a passage that does not say what it claims, or
   answers instead of saying "the documents do not cover this". These are the failures
   people usually blame first, often wrongly.
5. **Diagnose by looking at what the model received.** For a bad answer, ask in order: is the
   right information in the documents at all, in a readable chunk? Was that chunk among the
   retrieved ones? If yes, did the answer use it correctly? The first "no" is the stage to
   fix. Improving the prompt cannot repair a retrieval failure, and a better search cannot
   repair a chunk that lost its meaning at ingestion.
6. **Sometimes RAG is not needed.** If the documents are few and short enough to fit in the
   model's context window (the amount of text it can read at once) with room to spare, giving
   them all may be simpler and miss less. RAG earns its complexity when the collection is too
   large, changes often, mixes documents people may or may not see, or when the cost and
   delay of sending everything each time are too high. Even a large window has limits:
   models tend to use information buried in the middle of a long context less reliably.

## Teaching notes
- Analogy that works: **a library with a librarian and a writer**. Ingestion is the
  cataloguing (a book shelved under the wrong subject, or with pages missing, will never be
  found). Retrieval is the librarian who brings five books. Generation is the writer who
  answers from them. When the answer is wrong, you check the shelves, then the books brought,
  then the writing, in that order.
- Use one running example through the course: an internal assistant answering employees'
  questions from the company's HR policies, IT guides and expense rules. Keep it here and in
  the following lessons.
- Walk through idea 5 with a case: an employee asks "Can I expense a taxi after 10 pm?" and
  the assistant says "No". Show three different causes: the policy PDF was a scan and came out
  empty (ingestion); the chunk with the night-time exception ranked below the general rule
  (retrieval); the exception was retrieved but the model stated the general rule
  (generation). Same answer, three different fixes.
- For learners who have built a RAG: ask what they checked first the last time it answered
  badly. Most changed the prompt or the model; the point of the lesson is to look at the
  retrieved chunks first.
- Misconception: "a better model will fix the answers". It only helps at the generation stage.
  If the right chunk was never retrieved, a stronger model writes a more convincing wrong
  answer.
- Misconception: "with big context windows, RAG is dead". Small, stable collections may not
  need it, but cost, delay, access rights and very large collections keep it useful. Avoid
  quoting window sizes: they change quickly.
- Do not promise figures on how often each stage fails: they depend on the system. What holds
  is the order of diagnosis.
- Pacing: ideas 2 to 4 can go quickly with one example each. Spend the time on idea 5,
  ideally letting the learner diagnose the taxi case before you explain it.

## Check your understanding
1. Name the three stages of a RAG pipeline and one way each can fail.
   Good answer: ingestion (bad extraction, chunks that lose their meaning, missing or outdated documents), retrieval (the right chunk not picked or ranked too low, different wording, a same-subject passage winning), and generation (ignoring or misreading the passage, wrong citation, answering instead of admitting the gap).
2. Why is it a mistake to fix every bad answer by changing the prompt or the model?
   Good answer: those only act on generation; if the information was lost at ingestion or never retrieved, the model cannot use it, and a better model just writes a more convincing wrong answer. You must first find which stage failed.
3. The assistant says employees get 20 days of leave; the handbook says 25. The retrieved chunks contain only an old 2019 policy that says 20. Which stage failed, and what would you look at next?
   Good answer: the answer follows its passage, so generation did its job; the problem is upstream: the outdated policy is still in the index (ingestion) and/or the current one was not retrieved (retrieval). Next, check whether the current policy is indexed and readable, then why it ranked below the old one.
4. A team has a 15-page product guide that rarely changes and wants a question-answering assistant. Do they need a RAG pipeline? What would change your answer?
   Good answer: probably not: the guide fits easily in the context window, so giving it whole is simpler and misses less. RAG becomes worth it if the collection grows large, changes often, contains documents only some users may see, or if sending everything each time costs too much or is too slow.

## Completion criteria
The learner answers the checks correctly, can trace a wrong answer to ingestion, retrieval or
generation by asking the questions of idea 5 in order, and can say when giving the whole text
is enough.

## Going further
- Topics: the "lost in the middle" effect of long contexts, document parsing and OCR.
- Next lesson: preparing documents so that ingestion keeps the meaning.
