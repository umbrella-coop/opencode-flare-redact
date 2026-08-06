import { appendFileSync } from 'node:fs';
import {
  loadGuard,
  adaptPrompt,
  type AuditEvent,
  type GuardInstance,
} from '@umbrella-coop/flare-redact-ai-code-assistant-core';

export interface CodexHookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  prompt?: string;
  cwd?: string;
  session_id?: string;
  hook_event_name?: string;
  [key: string]: unknown;
}

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

export function guardFor(input: CodexHookInput, cwdHint?: string): GuardInstance {
  const cwd = cwdHint ?? input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  return loadGuard(cwd, { audit: { sink: auditSinkFromEnv() } });
}

/** PreToolUse → deny or allow with rewritten input. */
export function preToolUse(input: CodexHookInput, guard: GuardInstance): string | null {
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

/**
 * UserPromptSubmit → Codex cannot rewrite prompts, so a secret means block.
 */
export function userPromptSubmit(input: CodexHookInput, guard: GuardInstance): string | null {
  const d = guard.prompt({ sessionID: input.session_id }, input.prompt ?? '');
  const a = adaptPrompt(d, { canRewritePrompt: false });
  if (a.action === 'block') return JSON.stringify({ decision: 'block', reason: a.reason });
  return null;
}

/**
 * PostToolUse → Codex cannot rewrite tool output. Emit a non-blocking
 * systemMessage warning instead of disrupting the agent loop.
 */
export function postToolUse(input: CodexHookInput, guard: GuardInstance): string | null {
  const d = guard.toolOutput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_response);
  switch (d.decision) {
    case 'block':
      return JSON.stringify({ systemMessage: d.reason });
    case 'redact':
      return JSON.stringify({ systemMessage: `${d.findings.length} secret/PII finding(s) were present in tool output; redaction is not supported on Codex.` });
    default:
      return null;
  }
}
