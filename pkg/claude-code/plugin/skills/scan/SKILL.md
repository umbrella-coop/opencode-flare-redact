---
name: scan
description: Scan selected text or a file for secrets and PII using flare-redact before sending it anywhere.
argument-hint: "[text-or-file]"
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash Read
---

Scan the given text, or read the given file, and run it through the flare-redact
scanner. Never run a scan in a way that echoes raw secret values — the report
contains detector, risk, confidence, and location only.

Use the bundled script:

```bash
node ${CLAUDE_SKILL_DIR}/../../scripts/guard-hook.mjs verify -    # read from stdin
node ${CLAUDE_SKILL_DIR}/../../scripts/guard-hook.mjs verify <file>
```

The command exits with status 1 when findings are present. Summarize the
findings for the user, grouped by detector, and recommend the next step
(mask, block, or allowlist a false positive in `flare-redact.config.json`).
