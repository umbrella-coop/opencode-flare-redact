# Development & Testing on AI Code Assistants

How to build, run, and validate the plugins for **OpenCode, Claude Code, GitHub
Copilot, Codex CLI, and Cursor** in this monorepo.

## Layout & prerequisites

```
pkg/
  core/          guard engine (no platform imports)
  opencode/      in-process @opencode-ai/plugin
  claude-code/   .claude-plugin + hooks + bundled hook script
  github-copilot/plugin.json + hooks
  codex/         hooks.json + config.example.toml
  cursor/        .cursor-plugin + hooks
  mcp/           stdio MCP server
```

Prerequisites: Node.js 22+, pnpm 11.

```bash
pnpm install
pnpm build     # tsc (core/opencode/mcp) + esbuild bundles (hook adapters)
pnpm test      # 57 unit/contract tests
pnpm lint      # tsc --noEmit per package
pnpm check-versions   # lockstep version gate
pnpm review-security  # flare-redact self-scan
```

## How an adapter works

Every hook adapter follows the same pattern:

1. **`src/hook.ts`** — maps a platform hook event onto the guard engine and formats
   the platform's JSON response (e.g. `permissionDecision: "deny"` for Claude/Copilot
   pre-tool, `updated_mcp_tool_output` for Cursor MCP results).
2. **`src/cli.ts`** — reads one JSON object from stdin, dispatches on the event
   name, writes the response JSON to stdout. Malformed input → exit 0 (fail open,
   never crash the agent).
3. **`scripts/build.mjs`** — esbuild-bundles `src/cli.ts` into
   `plugin/scripts/guard-hook.mjs` (single file, flare-redact inlined, zero
   runtime deps).
4. **`plugin/`** — the distributable payload (manifest + `hooks.json` + skills +
   the bundle).

To add a new event or platform: extend `src/hook.ts` with the event handler,
wire it in `src/cli.ts`, and add a contract test fixture.

## Testing

### Unit / contract tests

`pnpm -r test` runs vitest in each package. The core test suite covers detection,
surface modes, sensitive paths, and capability adaptation. Each adapter has
**contract tests** that assert its exact platform JSON output (e.g. Claude
`hookSpecificOutput`, Copilot `modifiedTransformedPrompt`, Cursor flat
`permission`/`user_message`).

Add a fixture per platform event when you change a handler.

### End-to-end hook smoke (no assistant needed)

The bundled scripts speak the real hook protocol over stdin/stdout, so you can
drive them directly:

```bash
# Claude Code — PreToolUse deny
echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"content":"example payload"},"cwd":"."}' \
  | node pkg/claude-code/plugin/scripts/guard-hook.mjs PreToolUse

# Copilot — prompt rewrite
echo '{"transformedPrompt":"email alice@corp.com","cwd":"."}' \
  | node pkg/github-copilot/plugin/scripts/guard-hook.mjs userPromptTransformed

# Cursor — sensitive read deny
echo '{"file_path":".env","cwd":"."}' \
  | node pkg/cursor/plugin/scripts/guard-hook.mjs beforeReadFile

# Codex — UserPromptSubmit block
echo '{"prompt":"use a token here","cwd":"."}' \
  | node pkg/codex/plugin/scripts/guard-hook.mjs UserPromptSubmit
```

### Per-assistant install & validation

**OpenCode** (in-process)
```bash
npm i -D @umbrella-coop/flare-redact-opencode
# opencode.json → "plugin": ["@umbrella-coop/flare-redact-opencode"]
```

**Claude Code**
```bash
claude plugin install ./pkg/claude-code/plugin
claude plugin validate ./pkg/claude-code/plugin --strict   # pre-submission gate
```

**GitHub Copilot**
```bash
copilot plugin install ./pkg/github-copilot/plugin
```

**Codex CLI**
```bash
# copy the [hooks] block from pkg/codex/plugin/config.example.toml into
# .codex/config.toml; trust the hook via /hooks
```

**Cursor**
```bash
ln -s <MONOREPO>/pkg/cursor/plugin ~/.cursor/plugins/local/flare-redact
# then "Developer: Reload Window" — hooks already set failClosed: true
```

**MCP** (any client)
```bash
opencode-flare-redact-mcp   # stdio; FLARE_REDACT_PROJECT_DIR selects the project
```

## Configuring behavior

One file, all platforms: `flare-redact.config.json` at the project root. See
[`configuration.md`](configuration.md). Hook scripts log value-free audit JSONL to
`FLARE_REDACT_AUDIT_FILE` when set.

## Release & CI

- `pnpm changeset` → version PR → merge → `publish.yml` publishes to npm, tags
  `v<version>`, creates a GitHub release. See
  [`npm-publishing.md`](npm-publishing.md) for the `NPM_TOKEN` setup.
- CI (`ci.yml`) runs build, lint, tests, the lockstep version check, plugin-manifest
  JSON validation, and the self-scan on every PR/push.
