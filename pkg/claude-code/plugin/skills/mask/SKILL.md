---
name: mask
description: Redact secrets and PII from text using flare-redact and show the masked result.
argument-hint: "[text]"
disable-model-invocation: true
user-invocable: true
---

Mask secrets and PII in the given text using the flare-redact policy for this
project. Do not log or persist the original text anywhere except the user's
clipboard/output.

Use the bundled script with a temporary file:

```bash
printf '%s' "$ARGUMENTS" > /tmp/flare-mask-input.txt
node ${CLAUDE_SKILL_DIR}/../../scripts/guard-hook.mjs verify /tmp/flare-mask-input.txt
```

Present the masked output to the user. If the policy is in `block` mode,
inform the user that masking is not available for their configured surfaces.
