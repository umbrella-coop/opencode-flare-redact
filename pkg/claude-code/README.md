# @umbrella-coop/flare-redact-claude-code

Claude Code plugin that redacts secrets and PII before they reach Claude or leak
from tool results, powered by [`flare-redact`](https://github.com/flare-collection/flare-redact).

## Install

```bash
# local directory (from the monorepo)
claude plugin install ./pkg/claude-code/plugin

# or via a marketplace
/plugin marketplace add umbrella-coop/flare-redact-ai-code-assistant
/plugin install flare-redact@umbrella-coop-flare-redact
/reload-plugins
```

Validate before shipping: `claude plugin validate ./pkg/claude-code/plugin --strict`.

The hook script is a single self-contained bundle — no install step, no
`node_modules` in the plugin.

## What it guards

| Hook | Behaviour |
|---|---|
| `PreToolUse` | Deny write tools / shell commands carrying secrets; allow with redacted args for read-like tools |
| `PostToolUse` | Replace tool output with a masked, shape-preserving copy before Claude sees it |
| `UserPromptSubmit` | Block prompts containing secrets (Claude cannot rewrite prompts) |

Slash commands: `/flare-redact:scan`, `/flare-redact:mask`, `/flare-redact:status`
(model invocation disabled — user-invoked only).

## Configuration

Put a `flare-redact.config.json` in the project root. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

Optional env vars:

- `FLARE_REDACT_AUDIT_FILE` — append value-free JSONL audit events to a file.

## Security

Findings and audit events never contain raw secret values. Writes and sensitive
reads (`*.env`, `*.pem`, `secrets/**`, ...) are blocked by default. Detection is
best-effort — hooks are a guardrail, not a complete enforcement boundary.

## License

MIT
