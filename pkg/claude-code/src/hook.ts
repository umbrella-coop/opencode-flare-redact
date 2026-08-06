import { appendFileSync } from 'node:fs';
import { loadGuard, adaptPrompt, type AuditEvent, type GuardInstance } from '@umbrella-coop/flare-redact-core';

export interface HookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  prompt?: string;
  tool_use_id?: string;
  [key: string]: unknown;
}

/** Wire a JSONL audit sink to FLARE_REDACT_AUDIT_FILE when set. */
export function auditSinkFromEnv(): ((event: AuditEvent) => void) | undefined {
  const file = process.env.FLARE_REDACT_AUDIT_FILE;
  if (!file) return undefined;
  return (event) => {
    try {
      appendFileSync(file, `${JSON.stringify(event)}\n`);
    } catch {
      // audit must never break the agent loop
    }
  };
}

export function guardFor(input: HookInput, cwdHint?: string): GuardInstance {
  const cwd =
    cwdHint ??
    input.cwd ??
    process.env.CLAUDE_PROJECT_DIR ??
    process.env.CLAUDE_PLUGIN_ROOT ??
    process.cwd();
  return loadGuard(cwd, { audit: { sink: auditSinkFromEnv() } });
}

/** PreToolUse → deny (block) or allow with updated input. */
export function preToolUse(input: HookInput, guard: GuardInstance): string | null {
  const d = guard.toolInput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_input ?? {});
  switch (d.decision) {
    case 'block':
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: d.reason,
        },
      });
    case 'redact':
      return JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          updatedInput: d.value,
        },
      });
    default:
      return null;
  }
}

/** PostToolUse → replace the tool result before Claude sees it. */
export function postToolUse(input: HookInput, guard: GuardInstance): string | null {
  const d = guard.toolOutput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_response);
  switch (d.decision) {
    case 'redact':
      return JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PostToolUse', updatedToolOutput: d.value },
      });
    case 'block': {
      // Shape-preserving mask plus a non-blocking warning.
      return JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PostToolUse', updatedToolOutput: guard.sanitize(input.tool_response) },
        systemMessage: d.reason,
      });
    }
    default:
      return null;
  }
}

/** UserPromptSubmit → block on detected secrets (Claude cannot rewrite prompts). */
export function userPromptSubmit(input: HookInput, guard: GuardInstance): string | null {
  const d = guard.prompt({ sessionID: input.session_id }, input.prompt ?? '');
  const a = adaptPrompt(d, { canRewritePrompt: false });
  if (a.action === 'block') {
    return JSON.stringify({ decision: 'block', reason: a.reason });
  }
  return null;
}
