# LessonFolk documentation

| Document | What it covers |
|---|---|
| [Using LessonFolk](using-lessonfolk.md) | For learners: hosted or self-hosted (Docker), connecting your AI chat, your first session, what to say to your tutor, the Course companion, the dashboard, troubleshooting. |
| [Contributing](../CONTRIBUTING.md) | For contributors: repository map, development setup, every environment variable and npm script, database changes, contributing a course, workflow. |
| [Course format](course-format.md) | The specification of courses, themes, authors and lesson files, and what `npm run check:courses` checks. |
| [Testing](testing.md) | How the automated tests work, and the manual checks with a real tutor and with real sign-in. |
| [Sign-in for developers](auth-dev.md) | The `LESSONFOLK_AUTH` modes, and how to try GitHub and Google sign-in on your machine. |
| [Privacy and personal data](privacy.md) | Data map (what is stored where), download-all and delete-account, retention of logs and backups. |
| [Hosting](hosting.md) | For whoever runs the hosted server: the VPS, domain and OAuth apps, the CI/CD pipeline and its secrets, backups and the restore test, upgrading, rolling back. |
| [Search engines and AI search](seo.md) | What the public pages send to crawlers: robots.txt, sitemap, llms.txt, meta tags, structured data, the AI crawler policy, and how to check it. |
| [Brand](brand.md) | Logo, colours, type, shape and the do's and don'ts of the LessonFolk look. |

The tutor's own instructions are in [`packages/mcp/prompts/`](../packages/mcp/prompts); [`AGENTS.md`](../AGENTS.md) has the course authoring procedures.
The progress import/export format is [`progress.example.json`](progress.example.json).
