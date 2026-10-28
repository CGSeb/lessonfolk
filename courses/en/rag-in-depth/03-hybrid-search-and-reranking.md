---
id: rag-in-depth/03-hybrid-search-and-reranking
title: Hybrid search and reranking
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why keyword and meaning search miss different questions
  - Explain how hybrid search merges two rankings
  - Explain what a reranker adds and what it costs
prerequisites:
  - rag-in-depth/02-preparing-documents
---

## Key ideas
1. **Each kind of search has its own blind spot.** Keyword search (covered in *AI Agents and
   Tools*) scores chunks by the words they share with the question, with rare words counting
   more; a common version of it is called BM25. It is excellent for exact names, codes,
   product references and error messages, and fails when the question uses other words.
   Search by meaning compares embeddings (lists of numbers that place texts on a map of
   meaning) and finds "annual leave" for "holiday allowance", but it can miss an exact code
   like an invoice number and tends to pick passages on the right subject that do not contain
   the answer.
2. **Hybrid search runs both and merges the results.** Each search produces its own ranked
   list. Their scores cannot be compared directly (one counts words, the other measures
   distance on a map), so a common approach merges the *positions* instead: a chunk ranked
   high in either list, or fairly high in both, ends up near the top. One widely used method
   for this is called reciprocal rank fusion. The result catches both the exact-term questions
   and the reworded ones, which is why hybrid search is a common default.
3. **Retrieval is a funnel: find wide, then sort carefully.** The first search must be fast
   over the whole collection, so it compares the question with each chunk in a quick, rough
   way. It is good at getting the right chunk somewhere in the top 50, less good at putting
   it first. So the pipeline takes a generous number of candidates, then sorts that short list
   again with a slower, more precise method, and only the best few go to the model.
4. **A reranker reads the question and each candidate together.** Embedding search turns the
   question and the chunk into numbers separately and compares them. A **reranker** (often a
   model called a cross-encoder) reads the question and one candidate side by side and scores
   how well that passage answers that question. It notices things the first pass misses: a
   negation, the right country, the specific case asked about. It is too slow to run on the
   whole collection, which is why it only sorts the shortlist.
5. **Every step trades quality for cost and delay.** A reranker adds a call and some waiting
   time to every question; more candidates mean better chances but more work; more chunks in
   the prompt mean more cost and more noise for the model. Two measures guide the balance:
   **recall** (is the right chunk among the candidates at all?) and **precision** (are the
   chunks sent to the model mostly useful?). The first search is tuned for recall, the
   reranker for precision.
6. **Filters and boosts complete the ranking.** Metadata (lesson 2) can exclude what should
   never appear (other countries, old versions, documents the user may not see) before
   ranking, and can favour what usually matters more (the most recent version, the official
   policy over a forum post). A filter is a rule; a ranking is a guess. Use rules for what
   must always hold.

## Teaching notes
- Analogy that works: **hiring**. Screening CVs by keywords and by overall profile finds a
  long list quickly (hybrid search); interviewing the shortlist one by one is slow but much
  more accurate (reranking). Nobody interviews every applicant, and nobody hires from the
  keyword screen alone.
- Keep the running example. Two questions show idea 1: "What is error code VPN-412?" (keyword
  search wins: the code is rare and exact) and "How do I work from home safely?" (meaning wins:
  the IT guide says "remote access"). Hybrid search finds both.
- For idea 4, a case where the reranker helps: the question "Can contractors claim taxi
  expenses?" The first pass ranks "Employees can claim taxi expenses after 10 pm" first (very
  similar words and meaning). The reranker, reading both together, prefers the chunk that
  actually talks about contractors.
- For experienced learners: reciprocal rank fusion adds, for each chunk, a small score that
  depends only on its position in each list, so no score calibration is needed. Mention it
  only if they ask; no formula is required.
- Misconception: "meaning search is the modern way, keyword search is outdated". Keyword search
  remains strong for exact terms and is easy to explain; most robust systems keep both.
- Misconception: "send more chunks to the model to be safe". More chunks raise cost and can
  bury the right one; the reranker exists so that fewer, better chunks are sent.
- Avoid naming specific reranker or embedding products, and avoid quoting latency or
  benchmark numbers: they change quickly.
- Pacing: ideas 3 and 4 form one story (the funnel); tell them together.

## Check your understanding
1. Give a question where keyword search does better than meaning search, and one where it does worse. Why?
   Good answer: exact codes, names or error messages favour keyword search because the rare term matches exactly; reworded questions ("holiday allowance" vs "annual leave") favour meaning search because no word is shared but the meaning is close.
2. Why can't hybrid search simply add up the scores of the two searches, and what does it do instead?
   Good answer: the scores are on different scales (word matching vs distance in meaning), so they are not comparable; a common approach merges the positions in each ranked list, so chunks ranked high in either or both come first.
3. Why does a pipeline retrieve, say, 50 candidates and then keep only 5, instead of retrieving 5 directly?
   Good answer: the first search is fast but rough, good at getting the right chunk somewhere in a long list (recall) but not at ranking it first; a slower, more precise reranker then sorts the shortlist so only the best few reach the model (precision), keeping cost and noise down.
4. An assistant for a company in France and Germany keeps answering French employees with the German leave policy, which ranks first because it is phrased more like the questions. Would you fix this with a reranker or with a filter? Why?
   Good answer: a filter on country metadata, because it is a rule that must always hold; a reranker might help but remains a guess about relevance and could still let the wrong country through.

## Completion criteria
The learner answers the checks correctly and can describe the retrieval funnel (wide hybrid
search for recall, then reranking for precision), including when a metadata filter is the
right tool instead of better ranking.

## Going further
- Topics: BM25, reciprocal rank fusion, cross-encoders and bi-encoders, recall and precision.
- Next lesson: improving the question itself, and letting an agent search.
