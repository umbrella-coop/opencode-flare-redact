# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Semantic versioning & releases: changesets (lockstep versions, `pnpm changeset`,
  `pnpm version-packages`, `pnpm release`, `pnpm check-versions`), a Release GitHub
  Action (`version` PR → publish + `v<version>` tag + GitHub release), and a
  lockstep version check in CI.
- `pnpm cut-release`: interactive release orchestrator that tags `v<version>`,
  publishes to npm (with OTP support), and creates GitHub releases — stopping
  with a `BLOCKED` exit code (2) whenever a step needs user input.

## [0.1.0] - 2026-08-05

Initial release. Multi-assistant secret/PII redaction guard powered by flare-redact.

### Added
- **core** (`pkg/core`): assistant-agnostic guard engine — `toolInput`, `toolOutput`,
  `prompt`, `verify`, `sanitize`, config discovery (`flare-redact.config.json`),
  env overrides, value-free audit events, capability adaptation helpers.
- **opencode** (`pkg/opencode`): plugin with `tool.execute.before/after`,
  `experimental.chat.messages.transform`/`.system.transform`, and
  `flare-redact-scan`/`flare-redact-redact` tools.
- **claude-code** (`pkg/claude-code`): plugin with `PreToolUse`/`PostToolUse`/
  `UserPromptSubmit` hooks (bundled `guard-hook.mjs`, zero-install), slash-command
  skills (`scan`/`mask`/`status`), marketplace manifest.
- **github-copilot** (`pkg/github-copilot`): plugin with `preToolUse`/`postToolUse`/
  `userPromptTransformed` hooks (prompt rewriting supported), marketplace manifest.
- **codex** (`pkg/codex`): hooks for `PreToolUse`/`UserPromptSubmit` (block) and
  `PostToolUse` (non-blocking warning — Codex cannot rewrite tool output).
- **cursor** (`pkg/cursor`): hooks for `preToolUse`, `beforeReadFile`,
  `beforeSubmitPrompt`, and `postToolUse` (MCP results) with `failClosed: true`.
- **mcp** (`pkg/mcp`): MCP server exposing `flare_scan`, `flare_redact`,
  `flare_is_clean`, `flare_policy`.
- CI: build + test, plugin manifest JSON validation, and a `flare-redact --scan`
  self-scan job.

### Security defaults
- `write` and `sensitiveRead` surfaces default to **block**.
- Shell commands are blocked on detection, never rewritten.
- Findings and audit events never contain raw secret values.
