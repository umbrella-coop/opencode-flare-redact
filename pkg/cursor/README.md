# @umbrella-coop/flare-redact-cursor

Cursor plugin that redacts secrets and PII before they reach the model, powered by
[`flare-redact`](https://github.com/flare-collection/flare-redact).

## Install

```bash
# local plugin (dev)
ln -s <MONOREPO>/pkg/cursor/plugin ~/.cursor/plugins/local/flare-redact
# then "Developer: Reload Window" in Cursor

# or copy into the repo as a project plugin
cp -R pkg/cursor/plugin .cursor-plugin/
```

Every security hook sets `failClosed: true` — Cursor is fail-open by default, so
do not remove it.

## What it guards

| Hook | Behaviour |
|---|---|
| `preToolUse` | Deny write tools / shell commands carrying secrets; allow with `updated_input` for read-like tools |
| `beforeReadFile` | Deny reads of sensitive paths (`.env`, `*.pem`, `secrets/**`, ...) |
| `beforeSubmitPrompt` | Block prompts containing secrets (Cursor cannot rewrite prompts) |
| `postToolUse` | Redact MCP tool results via `updated_mcp_tool_output` |

## Configuration

Put a `flare-redact.config.json` in the project root. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

Optional env vars:

- `FLARE_REDACT_AUDIT_FILE` — append value-free JSONL audit events to a file.

## Known limits

Cursor hooks cannot rewrite file-read contents or terminal output — only block
them, or redact MCP results. Detection is best-effort; hooks are a guardrail, not
a complete enforcement boundary.

## License

MIT
