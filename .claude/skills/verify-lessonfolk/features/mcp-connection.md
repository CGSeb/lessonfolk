# AI tutor connection (MCP)

The Connect page tells the learner how to plug their AI chat app into this LessonFolk through MCP, with a tab per app and a command to copy. The `/mcp` endpoint is what the chat app talks to.

## Sub-features

- `connect-page` shows the setup steps with a tab per app.
- `connect-command` gives the exact command with this server's address.
- `mcp-endpoint-refusals` refuses requests that are not valid MCP calls.
- `mcp-tutor-tools` lets a connected tutor read courses and save progress (not drivable here).
- `mcp-oauth-consent` asks the learner to approve an app (OAuth mode, not drivable here).

## How to get to it (user POV)

- The `Connect` link in the navigation and the `Connect your AI chat to LessonFolk` link on the home page.

## Driving it with verify

Preconditions:

- Baseline state. A real MCP client (the tutor) is not part of the baseline, so the tools are not exercised.

States to exercise:

- Default tab (Claude Code), another tab selected, the endpoint answering a plain GET.

- **Open the page.** Run `verify browser goto --url /connect --feature mcp-connection` then `verify browser expect-visible --role heading --name "Connect your AI chat" --feature mcp-connection`.
- **Tabs.** Run `verify browser expect-visible --role tab --name "Claude Code" --feature mcp-connection`, then `verify browser click --role tab --name "ChatGPT" --feature mcp-connection`. The `ChatGPT` tab shows its panel.
- **Command carries this address.** On the Claude Code tab, `verify browser expect-text --text "claude mcp add --transport http lessonfolk http://127.0.0.1" --feature mcp-connection` passes.
- **Endpoint refuses a plain GET.** Run `verify http GET /mcp --feature mcp-connection --path mcp-get.json`. Status `405` and a JSON-RPC error body with the message `Method not allowed.`
- **Proof.** `verify browser snapshot --path connect.aria.txt --feature mcp-connection` and `verify browser screenshot --path connect.png --feature mcp-connection`, with `mcp-get.json`.

## Gotchas

- The tab list changes as apps are added: assert `Claude Code` and `ChatGPT` only.
- Tool calls, OAuth consent and token revocation need an MCP client or OAuth mode and are unverified by this skill.
