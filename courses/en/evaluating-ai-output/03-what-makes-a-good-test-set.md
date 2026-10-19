---
id: evaluating-ai-output/03-what-makes-a-good-test-set
title: What makes a good test set
level: intermediate
estimatedMinutes: 15
objectives:
  - Describe what a good test set contains
  - Spot the weaknesses of a test set that looks fine
  - Explain why cases used to adjust a prompt stop measuring its quality
prerequisites:
  - evaluating-ai-output/02-defining-good
---

## Key ideas
1. **A good test set looks like real use.** Its cases use the wording, the mess and the mix of
   topics that real users bring: typos, half-finished sentences, long pasted text. Tidy
   cases invented by the person who wrote the prompt flatter the result, because they are
   what the prompt was imagined for.
2. **It is varied and includes hard cases.** Besides typical requests, a good set holds
   the awkward ones: ambiguous questions, missing information, very long or very short inputs,
   another language, requests the assistant should refuse, and cases where the right
   behaviour is to say "I don't know". A set of only easy cases says "great" about everything.
3. **Every case says what good looks like.** For some, there is one right answer (a date, a
   category). For others, a short list of points that must appear or must not appear,
   taken from the criteria. Without that, judging each case becomes a fresh debate.
4. **Size matters less than coverage, but small has limits.** A few dozen well-chosen cases
   are a fair start and far better than three. But a small set cannot show small
   differences between two options: a gap of one case out of twenty may be luck. The set
   should grow as you meet new situations.
5. **Do not tune on the cases you test with.** If you keep adjusting a prompt until it passes
   these cases, you are teaching it to pass these cases, and the score no longer says how it
   will do on new ones. Keep some cases aside that you never adjust against, and use them to
   check the final version. Treat real people's data with care when building cases (see
   *Using AI Safely and Wisely*).

## Teaching notes
- Analogy: a driving test held on the empty car park where the learner practised. It tells you
  they can drive there, not on a rainy road with traffic.
- Scenario to reason through with the learner (nothing to collect): a help-desk team has a set of
  eight questions they wrote themselves, all well phrased and about the main product. Ask what
  is missing and which three cases they would add first.
- Second scenario: a prompt was reworded until it passed all ten test cases. Ask what the team may
  conclude from this, and what they cannot.
- Misconception: "more cases is always better". Ten thoughtful cases beat a hundred near-copies.
- Misconception: "the test set is finished once built". New failures in real use should join it
  (lesson 6).
- Beginners to the course: ideas 1, 2 and 5 with the help-desk scenario. Experienced learners:
  discuss the share of hard cases and keeping a held-back group.
- Do not give a specific number of cases as a rule: it depends on the stakes and the variation.
- Pacing: finish with the "reworded until it passed" scenario, it is the one that surprises.

## Check your understanding
1. A team tests its assistant on twenty questions written by its developers, all clear and about the
   main topic. Name two weaknesses of this set.
   Good answer: not like real use (tidy, written by insiders) and no hard cases (ambiguous,
   messy, out of scope), so the results will look better than reality.
2. Name three kinds of hard case a good test set should include for a customer-support assistant.
   Good answer: for example an unclear question, a request outside its remit that should be
   declined, missing information, an angry message, another language, a very long message.
3. A prompt was edited until it passed all fifty test cases. A manager says "fifty out of fifty,
   it is ready". What would you reply?
   Good answer: the prompt was tuned to those cases, so the score no longer shows how it does on
   new ones; check on cases held back that were never used for adjusting.

## Completion criteria
The learner can name the features of a good test set (realistic, varied with hard cases, each
with a definition of good), find the flaws in a described set, and explain why tuned-on cases
cannot confirm quality (checks 1-3).

## Going further
- The "Privacy: what not to paste into a chat" lesson of *Using AI Safely and Wisely* applies to
  real examples used as test cases.
- Topic to explore: why researchers keep a held-out set that is never used for training or tuning.
