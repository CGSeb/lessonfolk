---
id: small-focused-chatbot
title: Build a small chatbot that does one thing well
level: intermediate
theme: building-with-ai
authors: [lessonfolk]
description: Write a small command-line chatbot for one purpose you choose, with its own system prompt, a conversation that remembers, errors that do not crash it, and one finished feature.
estimatedHours: 4
buildsOn: [how-ai-apps-work, prompting-basics, ai-coding-assistants]
needs:
  - A computer with the programming language of your choice installed
  - A free model to call, either a model running on your own computer with a local model runner or a hosted API on its free tier
  - A code editor
  - An AI coding agent that edits your project from your instructions (optional, if you prefer to direct the work rather than type the code)
---

## Brief
Build a small chatbot that runs in your terminal and does one thing well: a study buddy for
one subject, a recipe helper, a bot that answers the common questions of your club. You
choose the purpose, the programming language and the model, local or hosted.

You also choose how you build it. You can write the code yourself, asking an AI chat app for
help when you need it. Or you can direct an AI coding agent, a tool that writes and edits the
code in your project from your instructions. Either way, you decide what the bot does, you
check what was written, and you must be able to explain every part of your code: each
milestone asks you to.

Your tutor is your coach: it explains the ideas, asks questions, helps you read an error and
reviews your code (or your instructions to the agent) with you, but it will not write the
chatbot or those instructions for you.

Two rules. If you use a hosted API, your key is a password: never paste it into a chat or
into your code. And use made-up questions for your tests, never personal or confidential
information.

## Milestones
1. **Choose the purpose and write the system prompt.** Pick a narrow purpose, write the
   system prompt that sets it, and prepare the questions you will test it with.
   Done when: the learner states the purpose in one sentence, shares a system prompt that
   gives the role, the tone, the format of answers and what to do with off-topic requests, and
   lists five test questions: a typical one, a vague one, an off-topic one, a very long one and
   an attempt to break the rules. The learner also says how they will build it: writing the
   code themselves, or directing an AI coding agent.
2. **Make a first call work.** Send one question with your system prompt to the model from
   your code, and print the reply.
   Done when: the learner shows a question and the model's reply from their program, explains
   what their request contains (the messages with their roles, the model name and any
   setting), and shows that the address, model name and any key are read from settings or
   environment variables, not written in the code.
3. **Keep the conversation going.** Turn the single call into a loop that keeps the history,
   and keep that history from growing without limit.
   Done when: the learner shows an exchange where the bot uses something said earlier in the
   conversation, and explains how their code stores the history and what it drops or
   summarises once the history is too long.
4. **Survive failures.** Make the bot handle a slow or failed call without crashing.
   Done when: the learner shows what the user sees when the model cannot be reached, and
   explains their timeout, which errors they retry (with a growing wait and a maximum number
   of tries) and which they do not.
5. **Test it like a user and add one feature.** Run your test questions again, fix what
   went wrong, then finish one feature.
   Done when: the learner reports what each of the five test questions gave, names at least
   one problem they fixed and how, shows one finished feature (for example a reset command, a
   summary saved as validated JSON, streamed replies), and names two things to settle before
   letting other people use the bot.

## Coaching notes
- **Coach, do not code.** Never write the chatbot, a function of it or a corrected version of
  the learner's code. When they are stuck, go up a ladder of help: first a question ("what
  does the API receive on the second turn?"), then point to the idea (covered in How AI Apps
  Work), and only then a short example of the idea in a different context than their bot. You
  may explain an error message and say where to look, not paste the fix.
- **Ask how they build, in milestone 1, and save it in your notes.** The milestones are the
  same either way; your coaching is not.
  - **Writing the code themselves** (with an AI chat app for help, or none): coach on the code.
    If they paste code an AI chat wrote, ask them to explain it before using it.
  - **Directing an AI coding agent**: the learner's work is the instructions, the checks and
    the decisions. Coach on those, and never write the instructions for them. Ask them to give
    the agent one milestone at a time, to read what it changed before accepting it, and to
    run the bot themselves. Watch for an agent that writes the key into the code, adds
    features nobody asked for, or does several milestones at once. Splitting the work,
    reviewing AI code and keeping secrets out are covered in AI Coding Assistants in
    Practice.
  - In both cases the "Done when:" lines ask the learner to explain their code. If they cannot
    explain a part, ask them to go back to it, or to ask the agent why, before moving on.
- **Never ask for the key.** If the learner pastes an API key, tell them to revoke it and
  create a new one, and never repeat it. Reviewing code is fine; ask them to remove any key or
  secret before pasting it.
- **Milestone 1: a purpose too wide.** "An assistant that helps with anything" cannot be tested.
  Push for one audience and one job. A system prompt that only says who the bot is often
  misses the format and the off-topic behaviour.
- **Milestone 2: setup trouble.** Most blocks here are not about AI: the local runner not
  started, a model not downloaded, a wrong address, a missing environment variable. Ask what
  the error says before anything else. A local model needs no key; a hosted one usually does.
- **Milestone 3: the bot forgets.** The usual cause is sending only the latest message, or not
  adding the reply to the history. Ask them to print what is sent on the second turn. For
  trimming, keeping the system prompt plus the last messages is enough; a summary is a bonus.
- **Milestone 4: retrying everything.** A bad key or an invalid request will not fix itself:
  retrying it only wastes time. Suggest testing by stopping the local runner or cutting the
  network, rather than imagining it.
- **Milestone 5: ten features half done.** Steer toward one feature, finished and tested. If
  they choose JSON output, the code must check it before using it (covered in "Structured
  output (JSON)"). For the two things to settle before sharing, accept for example: keep the key
  on a server, set usage limits, tell users they talk to an AI and what is stored (covered in
  "Before you share an AI app").
- **The system prompt is not a lock.** If the rule-breaking test succeeds, that is a finding,
  not a failure of the project: a system prompt cannot fully stop it, and important rules
  belong in code (covered in "System prompts and behaviour").
- **Privacy** (covered in Using AI Safely and Wisely): if the learner pastes personal data in
  test questions or logs, ask them to replace it with made-up data. Never repeat it back.
- **Learners new to programming** may need a smaller step inside milestone 2: first a program
  that prints text, then the call. Do not move the milestone forward. **Experienced learners**
  can make the bot switch between a local and a hosted model through settings only, or show
  the token usage of each reply.
- **Pacing.** The project fits two or three sessions, often one or two with a coding agent;
  milestones 2 and 3 take the longest.
  Save notes after each milestone so the next session starts where this one stopped. You only
  see what the learner pastes: ask for the code, the output and the errors instead of assuming.

## Review
1. The purpose is narrow, and the system prompt sets the role, the tone, the format and what
   to do off topic.
2. The settings and any key are kept out of the code.
3. The bot keeps the conversation history and keeps it from growing without limit.
4. A failed or slow call gives the user a clear message, with retries only for errors that
   can pass.
5. The five test questions were run again after the changes, and one feature is finished.
6. Nothing shared during the project contained a key or personal information.

## Going further
- Let a friend try the bot on your computer, and turn each answer that went wrong into a new
  test question.
- Make the model and its address a setting, and compare a local model with a hosted one on
  your five test questions.
- Add a second mode to the system prompt (for example a quiz mode for a study buddy) and test
  that each mode keeps its own rules.
