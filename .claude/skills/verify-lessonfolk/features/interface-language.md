# Interface language

The dashboard speaks English or French. The language comes from the `lessonfolk-lang` cookie (set by the footer switcher), else from the browser's language, else English. Pages state their language, and a choice is kept for a year.

## Sub-features

- `lang-default` shows English when the browser asks for nothing else.
- `lang-browser` follows the browser language (`fr`) when no choice was made.
- `lang-switch` saves the choice made with the footer switcher and returns to the same page.
- `lang-cookie` keeps the choice in a cookie that scripts cannot read, for one year, on every path.
- `lang-headers` tells the page language and what it varies on.
- `lang-reject` ignores an unknown language and a return address outside the site.

## How to get to it (user POV)

- Open any page and use the **Language** group in the footer: the buttons `English` and `Français`.
- Open the site with a browser set to French (no click needed).

## Driving it with verify

Preconditions:

- Baseline state (no cookie, English browser). `verify doctor` is healthy.
- The French course list is not fully translated: some titles stay in English. Assert interface words, not course titles.

States to exercise:

- Default (English), chosen French, browser French, chosen English over a French browser, invalid language rejected.

- **Default language.** Open the courses page. Run `verify browser goto --url /courses --feature interface-language` then `verify browser expect-visible --role heading --name "Courses" --feature interface-language`. The heading reads `Courses` and the footer button `English` is pressed.
- **Page language header.** Run `verify http GET /courses --header "Accept: text/html" --feature interface-language --path default-headers.json`. `headers.content-language` is `en` and `headers.vary` contains `Cookie` and `Accept-Language`.
- **Browser language.** Run `verify http GET /courses --header "Accept: text/html" --header "Accept-Language: fr" --feature interface-language --path browser-fr.json`. `content-language` is `fr`.
- **Choose French.** Run `verify browser set-language --lang fr --feature interface-language`. The same page reloads in French: the footer button `Français` is pressed and `verify browser expect-visible --role heading --name "Cours" --feature interface-language` passes (take the ARIA snapshot with `verify browser snapshot --path fr.aria.txt --feature interface-language`).
- **Cookie.** Run `verify browser cookies --feature interface-language`. One cookie `lessonfolk-lang` with value `fr`, path `/`, `httpOnly: true`, `sameSite: Lax`, `secure: false`, `expiresInDays` 365 (the run is plain http).
- **Choice survives navigation.** Run `verify browser goto --url /authors --feature interface-language` and `verify browser expect-visible --role button --name "Français" --feature interface-language`; the `Français` button is still pressed and the heading is `Auteurs`.
- **Cookie wins over the browser.** Run `verify http GET /courses --header "Cookie: lessonfolk-lang=en" --header "Accept-Language: fr" --header "Accept: text/html" --feature interface-language --path cookie-wins.json`. `content-language` is `en`.
- **Rejected input.** Run `verify http POST /api/language --form "lang=xx&next=//evil.example/" --feature interface-language --path rejected.json`. Status `303`, `headers.location` is `/`, `setCookie` is empty.
- **Proof.** Keep `evidence/interface-language/`: headers JSON, cookie JSON, and the ARIA snapshot and screenshot of the French page (`verify browser screenshot --path fr.png --feature interface-language`). The language is browser-side state, so the cookie output is the second view; there is no database row.

## Gotchas

- The switcher is a plain form post: run `set-language` from a real page, not the 404 page, or the return address is the 404.
- After `set-language` the cookie persists for the whole run: `teardown` then `launch` before re-checking English as a default.
- The `--header "Accept: text/html"` matters: the middleware only sets `Content-Language` on HTML responses.
- `Secure` appears only over https in sign-in mode; it cannot be driven in this run (reported unreachable, not verified).
- A GET on `/api/language` must not change the language: `verify http GET "/api/language?lang=fr&next=/"` answers `404` and sets no `lessonfolk-lang` cookie.
