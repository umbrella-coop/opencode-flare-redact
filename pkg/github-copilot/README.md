# @umbrella-coop/flare-redact-github-copilot

GitHub Copilot plugin that redacts secrets and PII before they reach the model,
powered by [`flare-redact`](https://github.com/flare-collection/flare-redact).

## Install

```bash
# plugin directory (from the monorepo)
copilot plugin install ./pkg/github-copilot/plugin

# or via a marketplace
copilot plugin marketplace add umbrella-coop/flare-redact-ai-code-assistant
copilot plugin install flare-redact@umbrella-coop-flare-redact
```

The hook script is a single self-contained bundle — no install step, no
`node_modules` in the plugin.

## What it guards

| Hook | Behaviour |
|---|---|
| `preToolUse` | Deny write tools / shell commands carrying secrets; allow with `modifiedArgs` for read-like tools |
| `postToolUse` | Replace tool results with a masked copy via `modifiedResult.textResultForLlm` |
| `userPromptTransformed` | Rewrite the model-facing prompt with secrets masked (prompt rewriting supported) |

## Configuration

Put a `flare-redact.config.json` in the project root. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

Optional env vars:

- `FLARE_REDACT_AUDIT_FILE` — append value-free JSONL audit events to a file.

## Security

Findings and audit events never contain raw secret values. Writes and sensitive
reads are blocked by default. Detection is best-effort — hooks are a guardrail,
not a complete enforcement boundary.

## License

MIT
