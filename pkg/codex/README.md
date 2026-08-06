# @umbrella-coop/flare-redact-codex

OpenAI Codex CLI hooks that redact secrets and PII, powered by
[`flare-redact`](https://github.com/flare-collection/flare-redact).

## Install

Copy the hooks block from `pkg/codex/plugin/config.example.toml` into
`.codex/config.toml` (project, requires trust) or `~/.codex/config.toml` (user),
replacing `<ABSOLUTE_PATH>` with the package path:

```toml
[features]
hooks = true

[[hooks.PreToolUse]]
matcher = "Bash|apply_patch|Edit|Write|Read|Grep|Glob|mcp__.*"

[[hooks.PreToolUse.hooks]]
type = "command"
command = 'node "<ABSOLUTE_PATH>/pkg/codex/plugin/scripts/guard-hook.mjs" PreToolUse'
timeout = 30
```

Trust the hook the first time Codex asks (`/hooks`).

## What it guards

| Hook | Behaviour |
|---|---|
| `PreToolUse` | Deny write tools / shell commands carrying secrets; allow with `updatedInput` for read-like tools |
| `UserPromptSubmit` | Block prompts containing secrets (Codex cannot rewrite prompts) |
| `PostToolUse` | Non-blocking warning — Codex cannot rewrite tool output |

## Configuration

Put a `flare-redact.config.json` in the project root. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

Optional env vars:

- `FLARE_REDACT_AUDIT_FILE` — append value-free JSONL audit events to a file.

## Security

Findings and audit events never contain raw secret values. Detection is
best-effort — hooks are a guardrail, not a complete enforcement boundary.

## License

MIT
