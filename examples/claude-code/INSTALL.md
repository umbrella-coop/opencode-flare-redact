# Claude Code install (from the monorepo)

# Option A — marketplace
#   /plugin marketplace add umbrella-coop/flare-redact
#   /plugin install flare-redact@umbrella-coop-flare-redact
#   /reload-plugins

# Option B — local directory
#   claude plugin install ./pkg/claude-code/plugin

# Validate before shipping:
#   claude plugin validate ./pkg/claude-code/plugin --strict

# The bundled hook script is self-contained. Verify it runs (use any string that
# contains a secret to observe a block, e.g. a line with `key=actual-value`):
#   echo '{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"content":"example payload"},"cwd":"."}' \
#     | node ./pkg/claude-code/plugin/scripts/guard-hook.mjs PreToolUse
