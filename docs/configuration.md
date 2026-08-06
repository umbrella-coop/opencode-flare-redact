# Configuration

All platforms read the **same** `flare-redact.config.json` (or `.flare-redact.json`),
discovered by walking up from the working directory / project root.

## Policy

The `policy` object is passed straight to flare-redact. See the
[flare-redact API](https://flare-collection.github.io/flare-redact/llms-full.txt)
for the full option list. Common options:

| Key | Type | Meaning |
|---|---|---|
| `mode` | `"mask" \| "label" \| "hash" \| "pseudonym" \| "surrogate"` | How secrets are replaced (default `mask`) |
| `enable` | `string[]` | Detectors/tags to enable (e.g. `["pii", "high_entropy", "phone"]`) |
| `disable` | `string[]` | Detectors to disable |
| `minConfidence` | `number` | Drop findings below this confidence (default `0.6`) |
| `refineConfidence` | `boolean` | Apply the learned classifier to generic detectors (default `true`) |
| `allow` | `string[]` | Exact values to never redact |
| `terms` | `string[] \| Record<string,string>` | Your own words/phrases to always catch |
| `transformSecret` | `string` | Key for `hash`/`pseudonym`/`surrogate` modes (never hard-code it) |

## Surfaces

| Surface | Default | Behaviour |
|---|---|---|
| `tool.output` | `redact` | Mask secrets in tool results before the model sees them |
| `prompt` | `redact` | Rewrite where the platform supports it; otherwise block |
| `write` | `block` | Deny `Write`/`Edit`/`apply_patch` calls containing secrets |
| `sensitiveRead` | `block` | Deny reads of sensitive paths |
| `tool.input` | `redact` | Mask args for all other tools (shell commands are blocked, never rewritten) |

Modes: `redact` (mask in place), `block` (deny/replace), `observe` (dry-run: audit
only, change nothing).

## Tool classification

```json
{
  "sensitiveTools": ["SecretStore.Write"],
  "blockInsteadOfRedactTools": ["Bash", "shell", "run"],
  "sensitivePathPatterns": ["**/deploy-keys/**", "*.pgpass"]
}
```

- `sensitiveTools` — treated as write surfaces (blocked on findings).
- `blockInsteadOfRedactTools` — args are never rewritten in place (blocked instead).
- `sensitivePathPatterns` — glob patterns (supports `**`, `*`, `?`) for sensitive
  paths; basename patterns like `.env` match at any depth.

Defaults for all three are in `pkg/core/src/defaults.ts`.

## Audit

```json
{ "audit": { "enabled": true } }
```

Findings emit value-free events (surface, tool, action, counts, detectors, risks).
Hook adapters write JSONL to `FLARE_REDACT_AUDIT_FILE` when that env var is set.

## Environment overrides

| Variable | Effect |
|---|---|
| `FLARE_REDACT_MODE` | Override `policy.mode` |
| `FLARE_REDACT_ENABLE` | Comma-separated detectors to enable |
| `FLARE_REDACT_MIN_CONFIDENCE` | Override `policy.minConfidence` |
| `FLARE_REDACT_SURFACE_MODE` | Override every surface's mode (`redact`/`observe`/`block`) |
| `FLARE_REDACT_AUDIT_FILE` | Append JSONL audit events to this file |
| `FLARE_REDACT_PROJECT_DIR` | (MCP only) Project directory for config discovery |
