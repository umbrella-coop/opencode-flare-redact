# @umbrella-coop/flare-redact-core

Assistant-agnostic secret/PII redaction guard engine, built on
[`flare-redact`](https://github.com/flare-collection/flare-redact).

Used by the platform adapters in this monorepo (OpenCode, Claude Code, GitHub
Copilot, Codex CLI, Cursor, MCP). No platform imports — a clean boundary that
any coding assistant integration can call.

## Install

```bash
npm install @umbrella-coop/flare-redact-core
```

## Quick start

```ts
import { createGuard, loadGuard } from '@umbrella-coop/flare-redact-core';

// Load with config discovery (walks up from the given directory)
const guard = loadGuard(process.cwd());

// Before a tool runs
const d = guard.toolInput({ tool: 'Write' }, { content: 'password=hunter2' });
if (d.decision === 'block') throw new Error(d.reason);

// Before tool output reaches the model
const out = guard.toolOutput({ tool: 'Bash' }, 'token ghp_...');
if (out.decision === 'redact') sendToModel(out.value);

// Prompts
const p = guard.prompt({}, 'email alice@corp.com');
// → { decision: 'rewrite', text: 'email a***@***' }
```

## API

```ts
createGuard(config: GuardConfig): GuardInstance
loadGuard(cwd: string, extra?: GuardConfig): GuardInstance   // config discovery + env overrides

guard.toolInput(meta, args)     // → allow | redact | block | observe
guard.toolOutput(meta, output)  // → allow | redact | block | observe
guard.prompt(meta, text)        // → allow | rewrite | block | annotate
guard.verify(input)             // → { clean, total, findings, byDetector, byRisk } (value-free)
guard.sanitize(value)           // always-redact copy, regardless of surface mode
guard.isSensitivePath(path)     // glob-match against sensitivePathPatterns

// Map a decision to a host platform's capabilities (rewrite vs block)
adaptPrompt(d, { canRewritePrompt })
adaptToolInput(d)
adaptToolOutput(d, { canRewriteToolOutput })
```

## Configuration

A `flare-redact.config.json` (or `.flare-redact.json`) in the project is
discovered automatically. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md)
for the full option list.

Defaults: `write` and `sensitiveRead` surfaces **block**; `tool.output`,
`tool.input`, and `prompt` **redact**; shell commands are never rewritten.

Findings and audit events are **value-free** (detector, risk, confidence,
location) — raw secrets never reach logs, audit files, or the model.

## Security

Detection is best-effort — a clean scan is not proof of no PII. The guard is a
guardrail, not a complete enforcement boundary. See the upstream
[flare-redact security model](https://github.com/flare-collection/flare-redact).

## License

MIT
