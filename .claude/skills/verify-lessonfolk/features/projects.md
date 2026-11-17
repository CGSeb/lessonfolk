# Practice projects

Learners browse the practice projects, search and filter them by theme, and open a project page with its brief, its milestones and their own progress. A course page lists the projects that build on it. The tutor coaches the project in the chat; the dashboard only shows the project and the progress the tutor saved.

## Sub-features

- `projects-list` lists the projects in the recommended order with theme, level, hours, milestones and the courses they build on.
- `projects-search` narrows the list by a search term, with a no-match state.
- `projects-theme` filters the list by theme, with counts; an unknown theme falls back to all.
- `project-page` shows one project: what you need, the courses it builds on, the brief and the milestones.
- `project-progress` shows the learner's status, milestones reached, the next milestone, the tutor's notes and the sentence to say to the tutor.
- `project-on-course-page` lists, on a course page, the projects that build on that course.
- `project-not-found` answers 404 for an unknown project.

## How to get to it (user POV)

- The `Projects` link in the main navigation (also in the footer `Explore` navigation).
- A project card on `/projects`, or in the `Practise with a project` section of a course page.
- The theme badge of a project card (`Theme: …`), which opens `/projects?theme=…`.

## Driving it with verify

Preconditions:

- Baseline state: a new learner, so no project shows a status and every project page shows `0 of 5 milestones reached`.
- The repository's `projects/` catalog is served (5 projects at the time of writing; assert that `A prompt you can reuse every week` is first, not the total).
- For `project-progress` beyond "not started": project progress seeded through the import step of the Account page (see the seed bullet). That changes the learner state: relaunch before driving other features from the baseline.

States to exercise:

- Full list, search with a match, search with no match, theme filter, project page not started, project page in progress (seeded), unknown project.

- **Open the catalog.** Run `verify browser goto --url / --feature projects`, then `verify browser click --role link --name "Projects" --exact --feature projects`. `verify browser expect-url --url /projects --feature projects` and `verify browser expect-visible --role heading --name "Projects" --feature projects` pass; `verify browser expect-text --text "5 projects" --feature projects` passes and the first card is `A prompt you can reuse every week`, with no status badge.
- **Search with a match.** Run `verify browser fill --role searchbox --name "Search projects" --value "chatbot" --submit --feature projects`. The URL becomes `/projects?q=chatbot`, `verify browser expect-text --text "1 project" --feature projects` passes and `verify browser expect-no-text --text "A prompt you can reuse every week" --feature projects` passes.
- **Search with no match.** Run `verify browser fill --role searchbox --name "Search projects" --value "zzzz-nothing" --submit --feature projects`. `verify browser expect-text --text "No project matches your search." --feature projects` passes and `verify browser expect-visible --role link --name "Clear the search" --feature projects` passes.
- **Theme filter.** Run `verify browser goto --url /projects --feature projects`, then `verify browser click --role link --name "Using AI tools (2 projects)" --feature projects`. The URL is `/projects?theme=using-ai` and `verify browser expect-text --text "2 projects" --feature projects` passes.
- **Unknown theme.** Run `verify browser goto --url "/projects?theme=nope&page=999" --feature projects`. `verify browser expect-text --text "5 projects" --feature projects` passes.
- **Project page.** Run `verify browser goto --url /projects --feature projects`, then `verify browser click --role link --name "A prompt you can reuse every week" --feature projects`. The URL is `/projects/reusable-prompt`; headings `Your progress`, `What you need`, `Courses it builds on`, `The brief` and `Milestones` are visible (`verify browser expect-visible --role heading --name "Milestones" --feature projects`), with `0 of 5 milestones reached` and the link `Prompting Basics`.
- **Projects on a course page.** Run `verify browser goto --url /courses/prompting-basics --feature projects`, then `verify browser expect-visible --role heading --name "Practise with a project" --feature projects` and `verify browser expect-visible --role link --name "A prompt you can reuse every week" --feature projects`. On `/courses/ai-foundations` the section is absent: `verify browser expect-no-text --text "Practise with a project" --feature projects`.
- **Unknown project.** Run `verify http GET /projects/nope --header "Accept: text/html" --feature projects --path project-404.json`: status `404`. Then `verify browser goto --url /projects/nope --feature projects` and `verify browser expect-visible --role heading --name "Project not found" --feature projects`.
- **Seed progress.** Run `verify http POST /api/account/import --form "progress=%7B%22version%22%3A1%2C%22projects%22%3A%7B%22reusable-prompt%22%3A%7B%22status%22%3A%22in_progress%22%2C%22startedAt%22%3A%222026-10-06%22%2C%22milestones%22%3A%5B1%2C2%5D%2C%22notes%22%3A%22Weekly%20team%20update%20chosen.%22%7D%7D%7D" --feature projects --path seed.json`. Status `303` to `/account?imported=0`. Second view: `verify db "select project_id, status, milestones from project_progress" --feature projects` returns `reusable-prompt`, `in_progress`, `[1, 2]`.
- **Progress shown.** Run `verify browser goto --url /projects/reusable-prompt --feature projects`. `verify browser expect-text --text "2 of 5 milestones reached" --feature projects`, `verify browser expect-text --text "In progress" --exact --feature projects` and `verify browser expect-text --text "Tutor’s notes" --feature projects` pass; the third milestone is marked `Next`. On `/projects` the card shows `In progress` (`verify browser expect-text --text "In progress" --exact --feature projects`).
- **Proof.** `verify browser snapshot --path project.aria.txt --feature projects` and `verify browser screenshot --path project.png --feature projects` on the project page (before and after the seed), with `project-404.json`, `seed.json` and the `verify db` output.

## Gotchas

- Two links are named `Projects` (main and footer `Explore` navigation) and project titles contain the word: click it with `--exact`. The footer navigation named `Project` (GitHub, legal pages) is a different one.
- Status badges read `Status: In progress` for a screen reader, but `Status:` is visually hidden and `expect-text` reads the visible text: assert `In progress`.
- The theme link names carry a hidden count (`Using AI tools (2 projects)`); themes with no project (Understanding AI) are not listed.
- There is no level filter and no "recommended for you" filter on `/projects`, unlike `/courses`.
- The seed posts the import step directly: the preview page (`/account/import`) needs a file upload the harness cannot do, and it does not show projects anyway (see `account-data`). Seeded progress makes the learner non-new, which changes the home page: relaunch afterwards.
- The import does not enforce the tutor's rules (milestones in order, review before done): seed only states the tutor could reach.
- Starting, advancing and completing a project happens through the tutor's MCP tools, which this skill cannot call: the done state, the completed message and the reset phrase are unverified unless seeded the same way (`status` `done`, all five milestones, a `completedAt`).
- All projects are translated into French, so the "not yet translated" note of a project page cannot be reached with the repository catalog.
