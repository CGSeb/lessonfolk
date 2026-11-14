---
id: build-your-own-rag
title: Build your own RAG and make it trustworthy
level: advanced
theme: building-with-ai
authors: [lessonfolk]
description: Build your own retrieval-augmented generation pipeline over documents you choose, from extraction to cited answers, then measure retrieval and answers separately and fix the stage that fails most.
estimatedHours: 5
buildsOn: [rag-in-depth, how-ai-apps-work, evaluating-ai-output]
needs:
  - A computer with the programming language of your choice installed, and a code editor
  - A free model for answers and a free embedding model, run on your own computer or through a hosted API on its free tier
  - 5 to 30 documents that are not confidential (rules of a club, product manuals, course notes, public reports)
  - A spreadsheet to record test results
  - An AI coding agent that edits your project from your instructions (optional, if you prefer to direct the work rather than type the code)
---

## Brief
Build a system that answers questions from a set of documents you choose, and that you can
trust: it finds the right passages, answers from them, cites them, and says when the
documents do not cover a question. You build the whole pipeline yourself: extract the text,
cut it into chunks, index them, retrieve the best ones for a question, and generate an answer
from them. Then you measure where it fails and fix it.

You choose the documents, the programming language and the models, local or hosted. You also
choose how you build: you can write the code yourself, asking an AI chat app for help when
you need it, or direct an AI coding agent that writes and edits the code from your
instructions. Either way, you decide how each stage works, you check what was written, and you
must be able to explain every stage: each milestone asks you to.

Your tutor is your coach: it explains the ideas, asks questions, helps you read your results
and reviews your choices, but it will not write the pipeline, the test set or the fixes for
you.

Use documents that are not confidential and contain no personal data. If you use a hosted
API, your key is a password: never paste it into a chat or into your code.

## Milestones
1. **Choose the documents and design the pipeline.** Pick the collection and decide what
   each stage of the pipeline will do.
   Done when: the learner names the collection and confirms it holds nothing confidential or
   personal, explains why it needs retrieval rather than fitting whole in the model's context,
   says for each stage (extraction, chunking, search, generation) what they plan and why, and
   says how they will build it: writing the code themselves, or directing an AI coding agent.
2. **Prepare and search the documents.** Turn the documents into chunks that make sense on
   their own, index them, and retrieve the best ones for a question.
   Done when: the learner shows the extracted text and the chunks of one real document, each
   chunk understandable alone and carrying its source (and its heading or other context), then
   shows a question returning ranked chunks with their sources, and explains their chunking
   choice and their kind of search (by keywords, by meaning, or both).
3. **Generate answers grounded in the passages.** Send the retrieved chunks and the question
   to the model, and get an answer that relies on them.
   Done when: the learner shows what their code sends to the model, an answer that cites the
   chunks it used, and a question the documents do not answer, with what the system does then.
4. **Build a test set and measure stage by stage.** Write questions with the passages that
   should answer them, and measure retrieval and answers separately.
   Done when: the learner shares at least 10 questions, each with its expected passage,
   including one the documents do not answer, one that needs two passages and one worded
   differently from the documents; reports how often the expected passage was retrieved and
   whether each answer was faithful to the retrieved passages; and sorts every failure by
   stage: ingestion, retrieval or generation.
5. **Fix the weakest stage and say what it can be trusted for.** Improve the stage that fails
   most, measure again, and state the system's limits.
   Done when: the learner shows one change at a time on the weakest stage, with the results of
   the whole test set before and after (including any question that got worse), says which
   kinds of questions they trust the system for and which need checking, and explains how
   the index will follow when documents are added, changed or deleted.

## Coaching notes
- **Coach, do not build.** Never write the pipeline, a stage of it, the test questions or a
  corrected version of the learner's code. When they are stuck, go up a ladder of help: first
  a question ("was the right chunk among the ones the model received?"), then point to the
  idea (covered in RAG in Depth), and only then a short example of the idea on other documents
  than theirs. You may explain an error message and say where to look, not paste the fix.
- **Ask how they build, in milestone 1, and save it in your notes.** The milestones are the
  same either way; your coaching is not.
  - **Writing the code themselves**: coach on the code and the choices. If they paste code an
    AI chat wrote, ask them to explain it before using it.
  - **Directing an AI coding agent**: the learner's work is the design, the instructions, the
    checks and the decisions. Coach on those, and never write the instructions for them. Ask
    them to give the agent one stage at a time and to look at the actual chunks, retrieved
    passages and prompts, not only at the final answers. Watch for an agent that picks every
    setting silently, writes the key into the code, or adds stages nobody asked for.
  - In both cases the "Done when:" lines ask the learner to explain each stage. If they cannot,
    ask them to go back to it before moving on.
- **Milestone 1: too few documents.** If the whole collection fits easily in the model's
  context, RAG may not be needed (covered in "Where a RAG system goes wrong"). Suggest a larger
  or more varied collection, or accept it as a learning exercise if the learner says so.
- **Milestone 2: nobody looks at the extracted text.** Ask them to open the extracted text of
  a real document before chunking: scanned pages without text, repeated headers and flattened
  tables are common (covered in "Preparing documents: chunks and metadata"). Chunks cut at a
  fixed length that split a rule from its heading are the next usual miss. For search, a
  keyword search, a meaning search with embeddings, or both are all valid; ask what each would
  miss on their documents (covered in "Hybrid search and reranking").
- **Milestone 3: the model answers from its own knowledge.** If answers are right but not in
  the passages, the system is not grounded. Ask what their instructions say about using only
  the passages, citing them, and saying when the answer is not there. Retrieved text is data,
  not instructions: a document can contain text that tries to steer the model.
- **Milestone 4: one overall score.** "8 out of 10 answers were right" hides where it fails.
  Insist on two measures: was the expected passage retrieved, and was the answer faithful to
  what was retrieved (covered in "Evaluating retrieval and answers separately"). If they use an
  AI judge for faithfulness, ask them to check it against their own reading on a few answers.
- **Milestone 5: fixing the wrong stage.** Changing the prompt cannot fix a passage that was
  never retrieved, and a better search cannot fix a chunk that lost its meaning. Follow the
  diagnosis order: in the documents in a readable chunk, then retrieved, then used correctly.
  One change at a time, and rerun the whole set: a new chunking can fix some questions and
  break others. Better queries (rewriting or splitting the question) are covered in "Better
  queries and agentic retrieval".
- **Freshness.** Deleted documents are the usual blind spot: a document removed from the
  source but still in the index keeps being quoted (covered in "RAG in production: freshness,
  access and cost").
- **Never ask for the key, and no private data.** If the learner pastes an API key, tell them
  to revoke it and create a new one, and never repeat it. If their documents turn out to hold
  personal or confidential data, ask them to switch to other documents.
- **Experienced learners** can add metadata filters (date, version), a reranking step, or the
  date of the source in each answer, and measure whether each one pays off on the test set.
- **Pacing.** The project fits two or three sessions, often fewer with a coding agent;
  milestones 2 and 4 take the longest. Save notes after each milestone so the next session
  starts where this one stopped. You only see what the learner pastes: ask for the chunks, the
  retrieved passages, the prompts and the results instead of assuming.

## Review
1. The pipeline covers extraction, chunking, search and generation, and the learner can explain
   each stage.
2. Chunks make sense on their own and carry their source.
3. Answers rely on the retrieved passages, cite them, and say when the documents do not answer.
4. Retrieval and answers were measured separately on a test set with expected passages and the
   special cases of RAG, and failures were sorted by stage.
5. The fix targeted the weakest stage, the whole test set was run again, and the limits and the
   way the index stays up to date are written down.
6. Nothing shared during the project contained a key, personal data or confidential documents.

## Going further
- Add a second kind of search and merge the results, then measure whether retrieval improves
  on your test set.
- Store the date and version of each chunk, and show in every answer how recent its source is.
- Keep the test set and run it again after every change of documents, chunking or model.
