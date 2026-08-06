# @umbrella-coop/flare-redact-mcp

Model Context Protocol server exposing on-demand secret/PII tools backed by
[`flare-redact`](https://github.com/flare-collection/flare-redact).

## Install

```bash
npm install -g @umbrella-coop/flare-redact-mcp
```

Run as a stdio MCP server:

```bash
opencode-flare-redact-mcp
```

`FLARE_REDACT_PROJECT_DIR` selects the project directory for config discovery
(defaults to the current directory).

Add it to your MCP client config, e.g.:

```json
{
  "mcpServers": {
    "flare-redact": {
      "command": "opencode-flare-redact-mcp",
      "args": []
    }
  }
}
```

## Tools

| Tool | Description |
|---|---|
| `flare_scan` | Scan text/JSON for secrets and PII. Returns value-free findings (detector, risk, confidence, location). |
| `flare_redact` | Redact secrets and PII from text or JSON. Returns the value with secrets masked. |
| `flare_is_clean` | Return whether the given text contains any secrets or PII. |
| `flare_policy` | Show the active redaction policy and per-surface modes. |

## Configuration

Put a `flare-redact.config.json` in the project root. See the
[configuration reference](https://github.com/umbrella-coop/flare-redact-ai-code-assistant/blob/main/docs/configuration.md).

## Note

MCP tools are **on-demand** — the model calls them voluntarily. For enforcement
(blocking secrets before they reach the model), use the per-assistant hook
plugins (OpenCode, Claude Code, GitHub Copilot, Codex, Cursor).

## License

MIT
