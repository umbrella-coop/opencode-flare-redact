# opencode-flare-redact

**Redact secrets & PII before they reach an AI coding assistant — on every assistant.**

A monorepo of plugins for **OpenCode, Claude Code, GitHub Copilot, OpenAI Codex, and
Cursor**, all built on one assistant-agnostic guard engine that wraps
[`flare-redact`](https://github.com/flare-collection/flare-redact).

The same `flare-redact.config.json` policy applies on every platform: secrets are
masked in tool output, blocked before they reach `Write`/`Edit`/shell commands, and
blocked (or rewritten, where the platform allows) in prompts.

| Package | Directory | Platform | Interception points |
|---|---|---|---|
| `@umbrella-coop/flare-redact-ai-code-assistant-core` | `pkg/core` | — | Guard engine (no platform imports) |
| `...-opencode` | `pkg/opencode` | OpenCode | `tool.execute.before/after`, `experimental.chat.messages.transform`, `.system.transform` |
| `...-claude-code` | `pkg/claude-code` | Claude Code | `PreToolUse`, `PostToolUse`, `UserPromptSubmit` |
| `...-github-copilot` | `pkg/github-copilot` | GitHub Copilot | `preToolUse`, `postToolUse`, `userPromptTransformed` |
| `...-codex` | `pkg/codex` | OpenAI Codex CLI | `PreToolUse`, `UserPromptSubmit`, `PostToolUse` (warning only) |
| `...-cursor` | `pkg/cursor` | Cursor | `preToolUse`, `beforeReadFile`, `beforeSubmitPrompt`, `postToolUse` (MCP) |
| `...-mcp` | `pkg/mcp` | Any MCP client | on-demand `flare_scan` / `flare_redact` / `flare_is_clean` / `flare_policy` tools |

## How it works

Each platform exposes the same four "hook" surfaces, with platform-specific JSON
schemas. One shared engine (`pkg/core`) makes the decision; each adapter maps it to
its platform's schema. Hook scripts are bundled with esbuild into a single
self-contained `.mjs` (flare-redact is zero-dependency), so there is **no install
step, no `node_modules` in the plugin**.

Defaults (override per-surface in config):

| Surface | Default | Behaviour |
|---|---|---|
| `tool.output` | `redact` | Secrets masked before the model sees them |
| `prompt` | `redact` | Rewritten where supported; otherwise blocked |
| `write` (Write/Edit/apply_patch) | `block` | Any secret → tool call denied |
| `sensitiveRead` (`.env`, `*.pem`, `secrets/**`, …) | `block` | Sensitive path → read denied |
| `tool.input` (everything else) | `redact` | Args masked (shell commands are blocked, never rewritten) |

Findings are **value-free** (detector, risk, confidence, location) — raw secrets
never reach logs, audit files, or the model.

## Configuration

One file per project, discovered by walking up from the project root:

```json
// flare-redact.config.json
{
  "policy": {
    "mode": "mask",
    "enable": ["pii", "high_entropy"],
    "minConfidence": 0.6,
    "refineConfidence": true,
    "allow": ["known-safe-value"],
    "terms": ["Project Zeus"]
  },
  "surfaces": {
    "tool.output": "redact",
    "prompt": "redact",
    "write": "block",
    "sensitiveRead": "block",
    "tool.input": "redact"
  },
  "sensitivePathPatterns": ["**/deploy-keys/**"],
  "audit": { "enabled": true }
}
```

Environment overrides: `FLARE_REDACT_MODE`, `FLARE_REDACT_ENABLE`, `FLARE_REDACT_MIN_CONFIDENCE`,
`FLARE_REDACT_SURFACE_MODE`. Hooks write JSONL audit events to `FLARE_REDACT_AUDIT_FILE`
when set. See [`docs/configuration.md`](docs/configuration.md).

## Install

Per-assistant instructions live in each package's README:

- **OpenCode** — `npm i -D @umbrella-coop/flare-redact-ai-code-assistant-opencode`, then add it to `plugin` in `opencode.json`.
- **Claude Code** — marketplace install: `/plugin marketplace add <owner>/<repo>`, then `/plugin install flare-redact@...`. Or `claude plugin install ./pkg/claude-code/plugin`.
- **GitHub Copilot** — `copilot plugin install ./pkg/github-copilot/plugin` (or via marketplace).
- **Codex CLI** — copy the `[hooks]` block from `pkg/codex/plugin/config.example.toml` into `.codex/config.toml`.
- **Cursor** — `~/.cursor/plugins/local/<link>` pointing at `pkg/cursor/plugin`, or copy `.cursor-plugin/` into the repo.
- **MCP** — `npx @umbrella-coop/flare-redact-ai-code-assistant-mcp` as a stdio server (`FLARE_REDACT_PROJECT_DIR` selects the project).

## Development

```bash
pnpm install
pnpm build     # tsc + esbuild bundles for the hook adapters
pnpm test      # 53 unit/contract tests across core + all adapters
pnpm lint      # tsc --noEmit per package
pnpm review-security  # flare-redact self-scan of this repo
```

Packages are pnpm workspaces under `pkg/*`. The hook adapters (`claude-code`,
`github-copilot`, `codex`, `cursor`) produce a bundled `plugin/scripts/guard-hook.mjs`
and ship platform manifests (`plugin.json`, `hooks.json`, marketplace.json).

## Semantic versioning & releases

All packages share one **lockstep** version (enforced by `pnpm check-versions`),
managed with [changesets](https://github.com/changesets/changesets).

**Semantics:** the 7 published packages under `pkg/*` form a single changesets
`fixed` group. A changeset on **any** package bumps **all** of them to the same
version (e.g. a `minor` on `core` bumps `core`, `opencode`, `claude-code`,
`github-copilot`, `codex`, `cursor`, and `mcp` to `0.x+1.0` together). The
private workspace root (`@umbrella-coop/flare-redact-ai-code-assistant`) is
**not** versioned and stays pinned.

### Cut a release

Two paths — automatic (CI) or agent-driven (interactive):

**CI (automatic)** — the **Release** workflow ([`release.yml`](.github/workflows/release.yml))
opens a *"chore(release): version packages"* PR from changesets. Merging it publishes
to npm (needs `NPM_TOKEN`), creates the combined `v<version>` git tag, and creates a
GitHub release. If `NPM_TOKEN` is missing the workflow **fails loudly** instead of
silently tagging without publishing — add the repo secret (`@umbrella-coop` scope,
`access: public`) and re-run.

**Interactive (`pnpm cut-release`)** — stops and asks for input at every block.
Run as an agent (non-TTY), it prints `🛑 BLOCKED` and exits with code `2` at the
first decision point so the user is consulted before anything is mutated.

| Command | Action | Asks |
|---|---|---|
| `pnpm cut-release plan` | Print the release plan (read-only) | no |
| `pnpm cut-release preflight` | check-versions, build, test, lint | no |
| `pnpm cut-release version --bump minor` | Write changeset + apply versions | no |
| `pnpm cut-release commit` | Commit the version bump | no |
| `pnpm cut-release tag` | Create `v<version>` + per-package tags | no |
| `pnpm cut-release push` | Push branch + tags | no |
| `pnpm cut-release publish [--otp C]` | npm publish | **blocks if no `NPM_TOKEN`** |
| `pnpm cut-release release` | `gh release create v<version>` | no |
| `pnpm cut-release ask` | Walk every step | **confirms each step** |

Bump rules: `patch` for fixes, `minor` for features, `major` for breaking changes —
mirroring the conventional-commit types in `AGENTS.md`.

### npm publishing requirements

The workflow publishes with the `NPM_TOKEN` secret (repo or org level). For
unattended CI publishing, the npm account behind that token must **not** require a
one-time password for publishes:

1. npm account 2FA must be set to **"Authorization only"** (not "Authorization and
   writing") — 2FA stays on for logins, but automation tokens can publish without OTP.
2. Use an **Automation** access token (or a granular token scoped to `@umbrella-coop`)
   as the `NPM_TOKEN` value.
3. If the org secret is scoped to selected repositories, include
   `opencode-flare-redact`.

If npm still demands an OTP (e.g. a per-package 2FA check), publish interactively
instead: `pnpm cut-release publish --otp <code>` (or plain `pnpm cut-release publish`
in a terminal to be prompted).

### Versioning scripts

| Script | Purpose |
|---|---|
| `pnpm changeset` | Create a changeset entry |
| `pnpm check-versions` | Fail if packages diverge from the lockstep version |
| `pnpm version-packages` | Apply changesets (bump versions + changelogs) |
| `pnpm release` | CI publish path: npm publish, or fail loudly if `NPM_TOKEN` is absent in CI |
| `pnpm cut-release` | Interactive release orchestrator (asks at every block) |

## Security boundaries

- `scan()` never includes raw values; audit events contain detector/risk/count only.
- Write tools and sensitive-path reads are **blocked** by default; shell commands are
  never rewritten (they are blocked instead).
- Detections are best-effort — a clean scan is not a proof of no PII. Hooks are a
  guardrail, not a complete enforcement boundary (documented platform limits apply,
  e.g. Codex/Cursor cannot rewrite tool output or file reads).
- `flare-redact` is the underlying engine; its security model applies unchanged.

## License

MIT
