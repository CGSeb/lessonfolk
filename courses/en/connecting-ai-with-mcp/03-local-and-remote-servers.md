---
id: connecting-ai-with-mcp/03-local-and-remote-servers
title: Local and remote servers
level: intermediate
estimatedMinutes: 15
objectives:
  - Compare a server running on your machine with a remote one
  - Explain what each choice means for your data and for whom you trust
  - Describe how sign-in and permissions limit what a connection can do
prerequisites:
  - connecting-ai-with-mcp/02-servers-tools-and-resources
---

## Key ideas
1. **A local server runs on your own computer.** The assistant app starts it and talks to it on the
   same machine. It can reach what your user account can reach: your files, programs and saved
   credentials. That is useful for working with local files and tools, and it means the server's code
   runs with your access.
2. **A remote server runs somewhere else.** You connect to it by an address on the internet, usually
   signing in to the service it fronts. The provider runs it and can update it at any time. It suits
   cloud services such as calendars, trackers or databases, and your requests and the data they touch
   travel to that provider.
3. **Neither is automatically safer.** With a local server you trust the code you installed and where
   it came from. With a remote one you trust the operator: how it handles your data, its security,
   and the changes it makes. Ask what each server can see, what it can change, and who can change
   the server.
4. **Sign-in and permissions set the limits.** A remote connection normally asks you to approve access
   to your account, often with a choice of what is allowed (for example read only). The connection acts
   with *your* rights: whatever you can read, the assistant can read through it. Choose the narrowest
   permission that does the job, prefer a separate or read-only account for experiments, and know how
   to revoke access. Keep keys and tokens out of files that get shared or committed.
5. **At work, the rules may not be yours to set.** Companies often limit which servers may be used and
   by whom, because a connection can move company data outside. Check the policy before connecting a
   work account, and treat what the assistant can reach as what the person logged in can reach.

## Teaching notes
- Analogy: a local server is like hiring a helper to work inside your house, with the keys you hand
  them. A remote one is like using a service at its own office: you take your papers there, and what
  happens to them depends on that office.
- Scenario to reason through with the learner (nothing to set up): a freelancer wants an assistant to
  tidy files in a folder, and also to read a client's shared project tracker. Ask which would suit a
  local server and which a remote one, and what each would be able to see.
- Second scenario: an employee connects a remote server to their work account to "save time". Ask
  what could be affected and who should be asked first.
- Misconception: "local means private". A local server can still send data out if its code does.
- Misconception: "remote means unsafe". A well-run service with narrow permissions can be safer than
  unknown code with full access to your computer.
- Do not name transports, vendors or products, and avoid protocol details.
- Beginners to the course: ideas 1 to 4 with the freelancer scenario. Experienced learners: discuss
  workplace policy and revoking access.
- Pacing: idea 4 is the most useful in practice: leave time for it.

## Check your understanding
1. What is the main difference between a local and a remote server in terms of where your data goes?
   Good answer: a local server runs on your machine with your access and data stays there unless the
   code sends it out; a remote one runs on someone else's service, so requests and data travel to them.
2. Give one trust question for a local server and one for a remote server.
   Good answer: local: where did the code come from and what can it do with my files and credentials?
   remote: how does the operator handle and store my data and what changes can it make?
3. You connect a remote tracker server using your full admin account. Why is that a concern, and what
   would you do instead?
   Good answer: the connection acts with your rights, so it could read or change everything an admin
   can; use a narrower or read-only account or permission, and know how to revoke it.

## Completion criteria
The learner can contrast local and remote servers, state what each means for data and trust, and
explain how narrow permissions and revocable sign-in limit a connection (checks 1-3).

## Going further
- The "Privacy: what not to paste into a chat" lesson of *Using AI Safely and Wisely* covers what
  data should not leave your hands.
- The "Your team's AI setup" lesson of *AI Coding Assistants for Teams: Rules, Skills and Plugins* applies the same caution to
  plugins and servers at team level.
