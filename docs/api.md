# API Reference

Reference for the guard engine package
[`@umbrella-coop/flare-redact-core`](https://www.npmjs.com/package/@umbrella-coop/flare-redact-core).
All adapters (OpenCode, Claude Code, GitHub Copilot, Codex, Cursor, MCP) are thin
mappings onto this API.

## Factory & loading

```ts
createGuard(config: GuardConfig): GuardInstance
loadGuard(cwd: string, extra?: GuardConfig): GuardInstance
```

- `createGuard` — build a guard from a config object.
- `loadGuard` — discover a `flare-redact.config.json` / `.flare-redact.json` by
  walking up from `cwd`, merge `extra` (e.g. an audit sink), apply `FLARE_REDACT_*`
  env overrides, then `createGuard`.

## GuardInstance

```ts
interface GuardInstance {
  toolInput(meta: GuardMeta, args: unknown): ToolInputDecision;   // before a tool runs
  toolOutput(meta: GuardMeta, output: unknown): ToolOutputDecision; // before the model sees it
  prompt(meta: GuardMeta, text: string): PromptDecision;          // user/assistant text
  verify(input: unknown): ScanReport;                             // value-free scan report
  sanitize(value: unknown): unknown;                              // always-redact copy
  isSensitivePath(path: string): boolean;                         // glob match
  surface(name: SurfaceName): SurfaceConfig;                      // effective surface mode
  policy: RedactOptions;                                          // env-merged policy
  auditSink: AuditSink;
}
```

### Decisions

```ts
type ToolInputDecision =
  | { decision: 'allow' }
  | { decision: 'redact'; value: unknown; findings: SafeFinding[] }
  | { decision: 'block'; reason: string; findings: SafeFinding[] }
  | { decision: 'observe'; findings: SafeFinding[] };

type ToolOutputDecision = ToolInputDecision; // same shape

type PromptDecision =
  | { decision: 'allow' }
  | { decision: 'rewrite'; text: string; findings: SafeFinding[] }
  | { decision: 'block'; reason: string; findings: SafeFinding[] }
  | { decision: 'annotate'; note: string; findings: SafeFinding[] };
```

### SafeFinding

```ts
interface SafeFinding {
  detector: string;   // e.g. 'email', 'github_token'
  label: string;      // human label
  why: string;        // plain-English explanation
  risk: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0..1
  start?: number;
  end?: number;
  line?: number;
  column?: number;
  path?: string;
}
```

Findings are **value-free** — raw matched secrets are never included.

## Capability adaptation

Host platforms differ in what they can rewrite (e.g. Codex/Cursor cannot rewrite
tool output; Claude cannot rewrite prompts). Map a decision onto a platform:

```ts
adaptPrompt(d: PromptDecision, caps: { canRewritePrompt: boolean }): AdaptedDecision
adaptToolInput(d: ToolInputDecision): AdaptedDecision
adaptToolOutput(d: ToolOutputDecision, caps: { canRewriteToolOutput: boolean }): AdaptedDecision

type AdaptedDecision =
  | { action: 'allow' }
  | { action: 'redact' | 'rewrite'; value: unknown; findings: SafeFinding[] }
  | { action: 'block' | 'annotate'; reason: string; findings: SafeFinding[] };
```

## Configuration types

```ts
interface GuardConfig {
  policy?: RedactOptions;                                   // passed to flare-redact
  surfaces?: Partial<Record<SurfaceName, Partial<SurfaceConfig>>>;
  sensitiveTools?: string[];                                // treated as write tools
  blockInsteadOfRedactTools?: string[];                     // blocked, never rewritten
  sensitivePathPatterns?: string[];                         // globs
  audit?: { enabled?: boolean; sink?: AuditSink };
}

type SurfaceName = 'tool.input' | 'tool.output' | 'prompt' | 'write' | 'sensitiveRead';

interface SurfaceConfig { mode: ActionMode; fallback: ActionMode; }
type ActionMode = 'redact' | 'observe' | 'block';
```

Defaults: `write` and `sensitiveRead` **block**; `tool.output`, `tool.input`, and
`prompt` **redact** (fallback `block`); shell commands are never rewritten.

## Helpers

```ts
isSensitivePath(path: string, patterns: string[]): boolean  // glob match (**, *, ?)
globToRegExp(glob: string): RegExp
findConfigFile(cwd: string): string | null
walkUpForConfig(cwd: string): { file: string; dir: string } | null
applyEnvOverrides(config: GuardConfig, env?): GuardConfig   // FLARE_REDACT_* overrides
defaultPolicy(): RedactOptions
```

Environment overrides: `FLARE_REDACT_MODE`, `FLARE_REDACT_ENABLE`,
`FLARE_REDACT_MIN_CONFIDENCE`, `FLARE_REDACT_SURFACE_MODE`.

## Audit

```ts
interface AuditEvent {
  surface: SurfaceName;
  tool?: string;
  sessionID?: string;
  action: 'allow' | 'redact' | 'block' | 'observe' | 'annotate';
  count: number;
  detectors: string[];
  risks: string[];
  timestamp: string;
}
```

Adapters append these to `FLARE_REDACT_AUDIT_FILE` as JSONL when set. Events never
contain raw values.

## Underlying engine

All detection runs through [`flare-redact`](https://github.com/flare-collection/flare-redact)
— see its [LLM-friendly API reference](https://flare-collection.github.io/flare-redact/llms-full.txt)
for the `RedactOptions` policy surface.
