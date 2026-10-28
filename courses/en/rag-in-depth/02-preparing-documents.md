---
id: rag-in-depth/02-preparing-documents
title: "Preparing documents: chunks and metadata"
level: advanced
estimatedMinutes: 20
objectives:
  - Explain why text extraction is the first thing to check
  - Judge a chunking strategy for a given collection of documents
  - Explain how added context and metadata make a chunk findable and usable
prerequisites:
  - rag-in-depth/01-where-rag-goes-wrong
---

## Key ideas
1. **Extraction comes before everything.** Before any chunking, the text must be pulled out of
   PDFs, slides, web pages and spreadsheets. This step quietly loses a lot: a scanned page
   with no text layer comes out empty unless it goes through OCR (optical character
   recognition, software that reads text in an image); headers and footers repeat on every
   chunk; two-column layouts get their lines mixed; a table becomes a row of numbers with no
   column names. Looking at the extracted text of a few real documents is the cheapest check
   in the whole pipeline, and the most often skipped.
2. **A good chunk can be understood on its own.** Retrieval returns chunks, not documents, so
   each chunk must carry enough to be useful alone. Too small, and it loses its meaning
   ("This does not apply to contractors." Which rule?). Too large, and it mixes several
   subjects: it matches many questions vaguely and fills the context window with text that
   does not help. There is no universal right size; the right size is the one that keeps one
   idea, rule or answer together for these documents.
3. **Cut along the structure, not at a fixed length.** Cutting every N words is simple but
   splits sentences, lists and tables in the middle. Cutting along the document's own
   structure (headings, sections, paragraphs, list items, table rows) keeps related text
   together. A small **overlap** (repeating the end of one chunk at the start of the next)
   reduces the damage when a cut still falls in a bad place. Some content needs its own
   handling: a table is better kept whole, or turned into one sentence per row with its
   column names; a FAQ is naturally one chunk per question and answer.
4. **Give each chunk its context back.** A chunk often depends on where it came from: "The
   limit is 50 euros" means nothing without "Expense policy > Meals > Business trips abroad".
   Adding the document title and the heading path to each chunk, or a short sentence written
   (often by a model) that situates the chunk in its document, makes it both easier to find
   and safer to use. Some providers call this contextual retrieval; the idea is simply that a
   chunk should not arrive as an orphan.
5. **Metadata lets you filter before you search.** Store facts about each chunk alongside its
   text: source document, date, version, department, language, country, who may see it.
   Retrieval can then be restricted ("only the current policy for France") instead of hoping
   the right version ranks first. Metadata is also what makes citations, freshness and access
   control possible later.
6. **Clean the collection, not only the chunks.** Three versions of the same policy, drafts
   next to final documents and copies in several folders all compete in search, and the
   wrong one sometimes wins. Deciding which documents belong in the index, and which version
   is current, often improves answers more than any search technique.

## Teaching notes
- Analogy that works: **index cards for a talk**. Each card must make sense when you pick it
  up alone, so you write the topic at the top. A card with half a sentence is useless; a card
  covering three topics is hard to find and hard to use.
- Keep the running example: the company assistant with HR policies, IT guides and expense
  rules. Show the "This does not apply to contractors." chunk, then the same chunk with
  "Expense policy > Taxi after 10 pm" added: the learner should see that the second one can
  be found by a question about taxis and correctly understood by the model.
- For idea 1, a vivid case: a scanned expense policy indexed without OCR is an empty
  document. Every question about expenses then gets an answer from the wrong documents, and
  nothing in the answer reveals it.
- For experienced learners: discuss the trade-off of chunk size with retrieval in mind
  (smaller chunks are more precise to match, larger ones carry more context), and techniques
  that separate the two, such as matching on a small chunk but giving the model its
  surrounding section. Keep it conceptual.
- Misconception: "there is a best chunk size". Sizes quoted online come from someone else's
  documents. Avoid giving numbers as rules; what matters is whether a chunk holds one usable
  idea for this collection.
- Misconception: "metadata is optional housekeeping". Filtering by version or by country
  prevents errors that no ranking can fix reliably, and lesson 6 depends on it for access
  rights.
- Keep everything descriptive: the learner judges strategies for described documents; they
  do not chunk anything themselves.
- Pacing: ideas 2 to 4 are the core. Ideas 5 and 6 can be shorter if the learner already
  works with metadata.

## Check your understanding
1. Why should someone look at the extracted text of a few documents before tuning anything else?
   Good answer: extraction can silently lose content (scans without OCR, mixed columns, tables without column names, repeated headers); if the text is wrong or missing, no chunking or search can recover it, and the check is cheap.
2. What goes wrong with chunks that are too small, and with chunks that are too large?
   Good answer: too small, they lose their meaning or the context that makes them understandable; too large, they mix several subjects, match questions vaguely and fill the context window with unhelpful text.
3. An HR handbook is chunked every 300 words. The chunk "Employees on probation are not eligible." keeps being retrieved for questions about remote work, but the model cannot tell what it refers to. What would you change, and why?
   Good answer: cut along the document's headings instead of a fixed length, and/or add the heading path or a short situating sentence to each chunk (for example "Remote work policy > Eligibility"), so the chunk can be understood and matched correctly on its own.
4. The assistant sometimes quotes an old expense policy that was replaced last year. Give two preparation steps that would prevent it.
   Good answer: remove outdated versions from the index or mark only the current one as active, and store metadata such as version and date so retrieval can filter for the current policy (rather than hoping it ranks first).

## Completion criteria
The learner answers the checks correctly, can explain what makes a chunk usable on its own,
and can name both a chunking change and a metadata or collection change for a described
problem.

## Going further
- Topics: OCR and document parsing, structure-aware chunking, contextual retrieval, parent and
  child chunks.
- Next lesson: combining keyword and meaning search, then reranking.
