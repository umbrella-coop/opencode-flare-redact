# Cursor install (from the monorepo)

# Option A — local plugin (dev)
#   ln -s <MONOREPO>/pkg/cursor/plugin ~/.cursor/plugins/local/flare-redact
#   then "Developer: Reload Window" in Cursor.

# Option B — copy into the repo as a project plugin:
#   cp -R pkg/cursor/plugin .cursor-plugin/

# The hooks.json already sets failClosed: true on every security hook
# (Cursor is fail-open by default — do not remove it).
