# Course catalog, course pages and authors

Visitors browse every course, search and filter by theme, open a course page with its lessons and the learner's status, and see who wrote each course.

## Sub-features

- `catalog-list` lists the courses in the recommended order with level, status and lesson count.
- `catalog-search` filters the list by a search term.
- `catalog-theme` filters the list by theme, with counts.
- `course-page` shows one course with its progress, prerequisites and lessons.
- `author-pages` lists the authors and one author's courses.
- `not-found` answers 404 for an unknown course or author.

## How to get to it (user POV)

- The `Courses` link in the main navigation, or the course links on the home page.
- The `Authors` link, or the `LessonFolk` byline of a course card.
- A course title on a card.

## Driving it with verify

Preconditions:

- Baseline state: a new learner, so every course shows `Status: Not started` and `0 of N lessons`.
- The repository's `courses/` catalog is served (17 courses at the time of writing; do not assert the total, assert that `AI Foundations` is first).

States to exercise:

- Full list, search with a match, search with no match, theme filter, unknown theme falling back to all, unknown course, unknown author.

- **Open the catalog.** Run `verify browser goto --url /courses --feature course-catalog`, then `verify browser expect-visible --role heading --name "Courses" --feature course-catalog`. The first card is `AI Foundations` with `Status: Not started`.
- **Search with a match.** Run `verify browser fill --role searchbox --name "Search courses" --value "prompting" --submit --feature course-catalog`. The URL becomes `/courses?q=prompting`; `verify browser expect-text --text "Prompting Basics" --feature course-catalog` passes and `verify browser expect-no-text --text "Using AI Safely and Wisely" --feature course-catalog` passes (the list narrowed; other courses that mention prompting, such as the model-adaptation course, may stay).
- **Search with no match.** Run `verify browser fill --role searchbox --name "Search courses" --value "zzzz-nothing" --submit --feature course-catalog`. `verify browser expect-text --text "No course matches your search" --feature course-catalog` passes.
- **Theme filter.** Run `verify browser goto --url /courses --feature course-catalog` then `verify browser click --role link --name "Understanding AI (2 courses)" --feature course-catalog`. Only courses of that theme remain.
- **Unknown theme.** Run `verify browser goto --url "/courses?theme=nope&page=999" --feature course-catalog`. All courses are listed from page 1.
- **Course page.** Run `verify browser goto --url /courses/ai-foundations --feature course-catalog`. Headings `AI Foundations`, `Your progress`, `Before this course`, `Lessons`; the first lesson `What is AI?` is marked `Next up`.
- **Author page.** Run `verify browser goto --url /authors/lessonfolk --feature course-catalog`. Heading `LessonFolk` and a region `Courses by LessonFolk` listing `AI Foundations`.
- **Not found.** Run `verify http GET /courses/nope --header "Accept: text/html" --feature course-catalog --path course-404.json` and `verify http GET /authors/nope --header "Accept: text/html" --feature course-catalog --path author-404.json`. Both status `404`.
- **Proof.** `verify browser snapshot --path course.aria.txt --feature course-catalog` and `verify browser screenshot --path course.png --feature course-catalog` on the course page, plus the two 404 JSON files. Read-only feature: the second view is the 404 status and the page reopened.

## Gotchas

- Status and progress show `Not started` only for a new learner: if a previous drive imported progress, relaunch.
- The no-match message wording belongs to the English UI strings; copy it from the page if it changes.
- Course titles and counts change as courses are added: assert the first card, not the total.
- The `Projects` link in the navigation leads to a "coming soon" page (see `home-learning-path`); it is not part of this catalog.
