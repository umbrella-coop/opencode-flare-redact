# Codex CLI install (from the monorepo)

# Copy the hooks block into `.codex/config.toml` (project, requires trust)
# or `~/.codex/config.toml` (user). Replace <ABSOLUTE_PATH> with the package path.
# See pkg/codex/plugin/config.example.toml for the full snippet.

#   [features]
#   hooks = true
#
#   [[hooks.PreToolUse]]
#   matcher = "Bash|apply_patch|Edit|Write|Read|Grep|Glob|mcp__.*"
#
#   [[hooks.PreToolUse.hooks]]
#   type = "command"
#   command = 'node "<ABSOLUTE_PATH>/pkg/codex/plugin/scripts/guard-hook.mjs" PreToolUse'
#   timeout = 30

# Trust the hook the first time Codex asks (/hooks).
