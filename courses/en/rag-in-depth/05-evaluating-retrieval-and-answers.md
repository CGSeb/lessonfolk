---
id: rag-in-depth/05-evaluating-retrieval-and-answers
title: Evaluating retrieval and answers separately
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why a RAG system must be evaluated stage by stage
  - Describe what measures retrieval quality and what measures answer quality
  - Describe what a good RAG test set contains
prerequisites:
  - rag-in-depth/04-better-queries-and-agentic-retrieval
---

## Key ideas
1. **One overall score hides where the problem is.** *Evaluating AI Output* covers the general
   method: define what "good" means, build a test set, score answers and compare versions. For
   RAG, a single "was the answer right?" score is not enough: when it drops, you cannot tell
   whether retrieval or generation got worse, and you risk tuning the wrong stage (the
   diagnosis order of lesson 1). Evaluate retrieval and generation separately, with the same
   test questions.
2. **Retrieval is measured against the passages that should be found.** For each test
   question, note which document or passage contains the answer. Then ask: is that passage
   among the retrieved ones (often called recall at k, where k is the number of chunks kept)?
   How high does it rank? How many of the retrieved chunks are actually relevant (precision)?
   These checks need no judge and run quickly, so they are ideal for comparing chunking,
   search or reranking settings.
3. **Generation is measured on two separate qualities.** **Faithfulness** (or groundedness):
   is every claim in the answer supported by the retrieved passages? An answer can be true
   but unfaithful, using knowledge from training that the documents do not support, which is
   a problem when the documents are meant to be the authority. **Relevance and
   completeness**: does the answer address the question, and all of it? Citations add a third
   check: does the cited passage really say what the answer claims?
4. **A RAG test set has its own special cases.** Besides ordinary questions with their
   expected source and the points a good answer contains, include: questions the documents do
   not answer (the good answer says so), questions worded differently from the documents,
   questions with exact codes or names, questions needing two passages, questions where an
   old and a current version both exist, and questions a given user should not get answers to
   (lesson 6). Collect real questions when possible; they are worded the way people really
   ask.
5. **AI judges help, within limits.** Checking faithfulness by hand on many answers is slow, so
   an AI judge is often asked: "Is each claim supported by these passages?" As covered in
   *Evaluating AI Output*, judges need clear criteria and must be checked against people on a
   sample. They are better at "is this claim in the text?" than at "is this the best possible
   answer?".
6. **Read failures by stage, then fix the right stage.** When a test fails, look at what was
   retrieved. Missing right passage: fix ingestion or retrieval. Right passage present but
   unfaithful or incomplete answer: fix generation (instructions, the number of chunks, the
   model). Keep every failure as a test case, and rerun the whole set after each change: a
   better chunking can fix ten questions and break three others.

## Teaching notes
- Analogy that works: **a student's essay with a reading list**. You can check whether they
  found the right books (retrieval), and separately whether what they wrote is supported by
  those books and answers the essay question (generation). A bad grade alone does not tell you
  which to work on.
- Keep the running example. Show one test case in full: question "Can I expense a taxi after
  10 pm?", expected source "Expense policy > Taxi after 10 pm", key points "yes, for
  employees, with a receipt, within 30 days". Then show three outcomes: source not retrieved;
  source retrieved but the answer forgets the receipt; source retrieved and answer adds a
  limit the policy does not mention (unfaithful).
- Restate briefly from *Evaluating AI Output* what a test set and an AI judge are if the
  learner skipped it; do not teach them again.
- For experienced learners: mention that dedicated RAG evaluation tools and public benchmarks
  exist, and that what they measure overlaps with ideas 2 and 3 under various names. Do not
  name products or quote benchmark results.
- Misconception: "if the final answer is right, the system is fine". A right answer from the
  wrong passage, or from the model's memory, will fail on the next question where memory is
  wrong.
- Misconception: "faithful means true". Faithful means supported by the passages; if the
  passages are outdated, a faithful answer is faithfully wrong, which is a retrieval or
  ingestion problem.
- Keep it descriptive: the learner says what they would measure and include; they do not
  build a test set.
- Pacing: ideas 2 and 3 are the heart of the lesson. Idea 5 can be short if the learner knows
  AI judges.

## Check your understanding
1. Why is a single "correct answer" score not enough to improve a RAG system?
   Good answer: when it drops, it does not show whether retrieval or generation failed, so you may tune the wrong stage; measuring retrieval and generation separately points to the stage to fix.
2. How do you measure retrieval quality, and what do you need in the test set for it?
   Good answer: for each question, note the passage(s) that contain the answer; then check whether they are among the retrieved chunks (recall at k), how high they rank, and how many retrieved chunks are relevant (precision).
3. What is the difference between a faithful answer and a correct one? Give a case where they differ.
   Good answer: faithful means every claim is supported by the retrieved passages; correct means true. An answer can be correct but unfaithful (the model used its own knowledge, not the documents) or faithful but wrong (the passages were outdated).
4. Name three kinds of questions a RAG test set should include beyond ordinary factual questions.
   Good answer: any three of questions the documents do not answer, questions worded differently from the documents, exact codes or names, questions needing several passages, old vs current versions, and questions a given user should not get answers to.

## Completion criteria
The learner answers the checks correctly, can name a measure for retrieval and one for
generation, and can explain what to fix when a test fails with the right passage missing
versus present.

## Going further
- Topics: recall and precision at k, faithfulness and groundedness, citation accuracy, RAG
  benchmarks.
- Next lesson: running a RAG system in production.
