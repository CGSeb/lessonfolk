# Home and learning path

The home page welcomes a new learner, explains how to connect an AI chat and start, and suggests where beginners start. It follows the learner's progress and refreshes when the tutor saves it.

## Sub-features

- `home-welcome` shows the welcome and the "How to start" steps for a learner with no progress.
- `home-start-copy` offers the sentence to say to the tutor, with a copy button.
- `home-beginner-path` suggests where beginners start.
- `home-projects-nav` leads to the practice projects catalog from the navigation (the catalog has its own sheet, `projects`).
- `home-live-refresh` updates the page when the tutor saves progress or the course and project files change (needs a connected tutor).

## How to get to it (user POV)

- The site address `/`, or the `LessonFolk, home` and `Home` links.

## Driving it with verify

Preconditions:

- Baseline state: a new learner. The page shows the welcome, not a progress dashboard.
- For `home-live-refresh`: a connected AI tutor that saves progress through MCP. The baseline has none, so that sub-feature is **not drivable** here.

States to exercise:

- New learner (drivable); learner with progress and a next lesson, including a learner who only started a project (needs seeded progress, see Gotchas); invalid-progress notice and signed-out landing page (not drivable).

- **Welcome.** Run `verify browser goto --url / --feature home-learning-path` then `verify browser expect-visible --role heading --name "Welcome to LessonFolk" --feature home-learning-path`. Level-1 heading `Welcome to LessonFolk`.
- **How to start.** Run `verify browser expect-visible --role region --name "How to start" --feature home-learning-path`. The region has the link `Connect your AI chat to LessonFolk` (to `/connect`) and the sentence to say.
- **Copy button.** Run `verify browser expect-visible --role button --name "Copy “Let's start learning AI”" --feature home-learning-path`.
- **Beginner path.** Run `verify browser expect-visible --role region --name "Where beginners start" --feature home-learning-path`, then `verify browser expect-visible --role heading --name "What is AI?" --feature home-learning-path` and `verify browser expect-visible --role link --name "AI Foundations" --feature home-learning-path`.
- **Projects page.** Run `verify browser click --role link --name "Projects" --exact --feature home-learning-path`. `verify browser expect-url --url /projects --feature home-learning-path` passes and `verify browser expect-visible --role searchbox --name "Search projects" --feature home-learning-path` passes: the catalog, not a "coming soon" page.
- **Proof.** `verify browser snapshot --path home.aria.txt --feature home-learning-path` and `verify browser screenshot --path home.png --feature home-learning-path`. Second view: `verify db "select count(*)::int as lessons from lesson_progress" --feature home-learning-path` returns `0` and `verify db "select count(*)::int as projects from project_progress" --feature home-learning-path` returns `0` (nothing stored yet).

## Gotchas

- Two links are named `Projects` (main and footer `Explore` navigation), and other names contain the word: click with `--exact`. The first match is the main navigation.
- Seeding a learner with progress must go through the app: the import step `verify http POST /api/account/import --form "progress=<url-encoded progress.json>"` (see `projects` for an example), or a real tutor. The preview page needs a file upload the harness cannot do.
- The home page never shows projects: a learner who only started a project through the tutor gets the returning-learner view (`Welcome back`, the `Next up` lesson, `Get a path made for you`) with nothing about the project (possible product gap).
- `/api/events` (live refresh) only emits when a tutor write happens, which the harness cannot make.
