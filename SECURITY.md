# Security

## Reporting a vulnerability

Please do not open a public issue. Report it privately with GitHub's
[Report a vulnerability](https://github.com/CGSeb/lessonfolk/security/advisories/new) form
(the **Security** tab of the repository). Say what you found, how to reproduce it and what an
attacker could do with it.

You will get an answer as soon as the maintainer has read it. Once it is fixed and released, you
are credited in the advisory unless you would rather not be.

## What is covered

- The dashboard and its sign-in, the MCP server at `/mcp`, and the hosted LessonFolk at
  lessonfolk.com.
- The latest release only. Self-hosters: update with `docker compose pull`.

A mistake in a course is not a security problem: open a
[lesson issue](https://github.com/CGSeb/lessonfolk/issues/new/choose) instead.

What LessonFolk stores about learners, and how they download or delete it, is in
[Privacy and personal data](docs/privacy.md).
