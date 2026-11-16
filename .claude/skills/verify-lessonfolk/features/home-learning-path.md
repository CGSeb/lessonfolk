# Home and learning path

The home page welcomes a new learner, explains how to connect an AI chat and start, and suggests where beginners start. It follows the learner's progress and refreshes when the tutor saves it.

## Sub-features

- `home-welcome` shows the welcome and the "How to start" steps for a learner with no progress.
- `home-start-copy` offers the sentence to say to the tutor, with a copy button.
- `home-beginner-path` suggests where beginners start.
- `home-projects-soon` leads to the Projects "coming soon" page from the navigation.
- `home-live-refresh` updates the page when the tutor saves progress (needs a connected tutor).

## How to get to it (user POV)

- The site address `/`, or the `LessonFolk, home` and `Home` links.

## Driving it with verify

Preconditions:

- Baseline state: a new learner. The page shows the welcome, not a progress dashboard.
- For `home-live-refresh`: a connected AI tutor that saves progress through MCP. The baseline has none, so that sub-feature is **not drivable** here.

States to exercise:

- New learner (drivable); learner with progress and a next lesson (needs seeded progress, see Gotchas); invalid-progress notice and signed-out landing page (not drivable).

- **Welcome.** Run `verify browser goto --url / --feature home-learning-path` then `verify browser expect-visible --role heading --name "Welcome to LessonFolk" --feature home-learning-path`. Level-1 heading `Welcome to LessonFolk`.
- **How to start.** Run `verify browser expect-visible --role region --name "How to start" --feature home-learning-path`. The region lists `Connect your AI chat to LessonFolk` and the sentence to say.
- **Copy button.** Run `verify browser expect-visible --role button --name "Copy “Let's start learning AI”" --feature home-learning-path`.
- **Beginner path.** Run `verify browser expect-visible --role region --name "Where beginners start" --feature home-learning-path`. It lists `AI Foundations`.
- **Projects page.** Run `verify browser click --role link --name "ProjectsSoon" --feature home-learning-path`. The URL is `/projects` and the page announces projects are coming.
- **Proof.** `verify browser snapshot --path home.aria.txt --feature home-learning-path` and `verify browser screenshot --path home.png --feature home-learning-path`. Second view: `verify db "select count(*)::int as lessons from lesson_progress" --feature home-learning-path` returns `0` (nothing stored yet).

## Gotchas

- The `Projects` navigation link's accessible name is `ProjectsSoon` (the badge is part of the name).
- Seeding a learner with progress must go through the app (import a `progress.json` on `/account`) or a real tutor; the harness cannot upload a file yet, so the "next lesson" and path views are unverified by this skill (harness gap).
- `/api/events` (live refresh) only emits when a tutor write happens, which the harness cannot make.
