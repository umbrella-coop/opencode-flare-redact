# @umbrella-coop/flare-redact-opencode

OpenCode plugin that redacts secrets and PII before they reach the model, using
[`flare-redact`](https://github.com/flare-collection/flare-redact) via the shared
[`@umbrella-coop/flare-redact-core`](https://github.com/umbrella-coop/flare-redact-ai-code-assistant).

## Install

```bash
npm install -D @umbrella-coop/flare-redact-opencode
```

Add it to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@umbrella-coop/flare-redact-opencode"]
}
```

## What it guards

| Surface | Hook | Behaviour |
|---|---|---|
| Tool args | `tool.execute.before` | Redact non-write args; block write tools and shell commands carrying secrets |
| Tool output | `tool.execute.after` | Mask secrets before the model sees the result |
| Chat messages | `experimental.chat.messages.transform` | Redact user/assistant text |
| System prompt | `experimental.chat.system.transform` | Redact system prompt text |

It also registers two on-demand tools:

- `flare-redact-scan` — scan text/JSON, returns value-free findings.
- `flare-redact-redact` — mask secrets in a value.

## Configuration

Drop a `flare-redact.config.json` in the project root (or `.flare-redact.json`).
See the [configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

```json
{
  "policy": { "mode": "mask", "minConfidence": 0.6, "refineConfidence": true },
  "surfaces": {
    "tool.output": "redact",
    "prompt": "redact",
    "write": "block",
    "sensitiveRead": "block",
    "tool.input": "redact"
  }
}
```

## License

MIT
