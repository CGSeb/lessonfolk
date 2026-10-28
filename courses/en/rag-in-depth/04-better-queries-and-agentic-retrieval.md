---
id: rag-in-depth/04-better-queries-and-agentic-retrieval
title: Better queries and agentic retrieval
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why the user's question is often a poor search query
  - Choose between rewriting, splitting and searching several times for a given question
  - Judge the risks of letting an agent decide when to search and when to stop
prerequisites:
  - rag-in-depth/03-hybrid-search-and-reranking
---

## Key ideas
1. **The question is not always a good search.** People ask in conversation: "and for
   contractors?", "what about the one we discussed?", "it says I can't, why?". Sent as is,
   these find nothing useful, because the search only sees the last message. Questions can
   also be vague, full of internal slang, or ask several things at once. Improving what is
   searched, before searching, is often cheaper than improving the search.
2. **Rewrite the question into a standalone query.** A model call can turn the conversation's
   last message into a complete, explicit query: "and for contractors?" becomes "taxi expense
   rules for contractors after 10 pm". It can also expand acronyms and internal terms. The
   risk: the rewrite can drift from what the user meant, so the original question should still
   be the one the final answer addresses.
3. **Split questions that ask several things.** "Compare the leave rules in France and
   Germany" needs passages from two policies; a single search tends to bring back mostly one
   of them. Splitting it into sub-questions, searching for each and giving the model all the
   results lets every part be covered. The same applies to questions that need one fact to
   find another ("Who approves my expenses, and what is their limit?").
4. **Search with a draft answer, not only the question.** A question and the passage that
   answers it are often worded very differently. One technique asks the model to write a
   short hypothetical answer first, then searches with that draft, because it looks more like
   the documents than the question does (the technique is known as HyDE). The draft is only a
   search key: it may contain invented facts and must never be shown as the answer.
5. **Agentic retrieval: let the model search as many times as it needs.** Instead of one search
   before answering, retrieval becomes a tool in an agent loop (covered in *AI Agents and
   Tools*): the model searches, reads the results, decides whether they are enough, and
   searches again with other words or for a missing piece. This handles open, multi-step
   questions that a fixed pipeline cannot, and lets the model skip searching for questions
   that do not need it.
6. **More freedom means more ways to fail.** An agent can stop too early and answer from thin
   results, keep searching in circles, or take many steps and cost far more than a single
   search. It needs a step limit, a clear rule for when the evidence is enough (and for saying
   "not found"), and traces you can read. Choose the simplest approach that answers the
   questions people actually ask: a fixed pipeline for simple factual questions, agentic
   retrieval for the harder ones.

## Teaching notes
- Analogy that works: **a reference librarian**. A good one does not type your exact words into
  the catalogue: they ask what you mean, translate it into the catalogue's terms, look in
  several places for a two-part question, and keep looking until they have enough (or tell
  you the library does not have it).
- Keep the running example. Use the conversation "Can I take a taxi home after a late
  meeting?" → "Yes, after 10 pm." → "And for contractors?" to show idea 2: the last message
  alone retrieves nothing about taxis.
- For idea 4, make the point concrete: the question "How long do I have to send receipts?"
  shares few words with the policy sentence "Supporting documents must be submitted within 30
  days of the expense"; a draft answer like "Receipts must be submitted within N days of the
  expense" is much closer to it.
- For experienced learners: discuss routing (a cheap first step that decides whether a
  question needs retrieval, which source to search, or agentic retrieval), and the cost of
  each extra model call before the search.
- Misconception: "agentic retrieval is always better". It is more flexible, but slower, more
  expensive and harder to predict; for a simple factual question a single good search wins.
- Misconception: "the rewritten query can replace the question". The rewrite is for search;
  the answer must address what the user asked, in their words.
- Keep it to understanding and judgement: the learner chooses a technique for a described
  question, they do not implement it.
- Pacing: ideas 2 and 3 are quick with examples. Spend time on 5 and 6, the trade-off is what
  advanced learners need.

## Check your understanding
1. Why does a follow-up message like "and for contractors?" often retrieve nothing useful, and how can the system fix it?
   Good answer: the search only sees the short follow-up, which lacks the subject of the conversation; a model call can rewrite it into a standalone query using the conversation ("taxi expense rules for contractors"), while the answer still addresses the original question.
2. What is the idea behind searching with a hypothetical answer, and what is its main risk?
   Good answer: a draft answer is worded more like the documents than the question is, so it matches the right passage better; but the draft may contain invented facts, so it is used only as a search key and never shown as the answer.
3. For each question, would you use a single search, splitting, or agentic retrieval? (a) "What is the VPN error code VPN-412?" (b) "Compare parental leave in France and Germany." (c) "I am moving to Spain next year; what changes for my contract, my expenses and my IT access?"
   Good answer: (a) a single search: one exact fact; (b) splitting into one sub-question per country, so both policies are retrieved; (c) agentic retrieval (or splitting plus several searches), because it spans several sources and may need follow-up searches depending on what is found.
4. What can go wrong when an agent decides when to search and when to stop, and what limits would you put in place?
   Good answer: it can stop too early on thin evidence, loop or search in circles, or take many costly steps; limits include a maximum number of steps, a rule for when evidence is sufficient and for answering "not found", and readable traces to check its behaviour.

## Completion criteria
The learner answers the checks correctly, can match a described question to rewriting,
splitting, a draft-answer search or agentic retrieval, and can name the controls an agentic
retriever needs.

## Going further
- Topics: query rewriting, query decomposition, HyDE (hypothetical document embeddings),
  routing, agentic RAG.
- Next lesson: evaluating retrieval and answers separately.
