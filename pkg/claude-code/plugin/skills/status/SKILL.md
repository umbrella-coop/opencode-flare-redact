---
name: status
description: Show the current flare-redact policy and which surfaces are active.
disable-model-invocation: true
user-invocable: true
---

Show the active flare-redact configuration for this project:

- The config file location (`flare-redact.config.json` or `.flare-redact.json`),
  or note that the default policy is in use.
- The policy mode, enabled detectors, and `minConfidence`.
- The per-surface mode: `tool.input`, `tool.output`, `prompt`, `write`,
  `sensitiveRead`.

Report this concisely as a table. Never print values from `.env` or other
sensitive files while inspecting configuration.
