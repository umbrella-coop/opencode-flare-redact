# GitHub Copilot install (from the monorepo)

# Option A — plugin directory
#   copilot plugin install ./pkg/github-copilot/plugin

# Option B — marketplace
#   copilot plugin marketplace add umbrella-coop/flare-redact
#   copilot plugin install flare-redact@umbrella-coop-flare-redact

# The bundled hook script is self-contained. Verify it runs (use any string that
# contains a secret to observe a block, e.g. a line with `key=actual-value`):
#   echo '{"tool_name":"edit","tool_input":{"content":"example payload"},"cwd":"."}' \
#     | node ./pkg/github-copilot/plugin/scripts/guard-hook.mjs preToolUse
