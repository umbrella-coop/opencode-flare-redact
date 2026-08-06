import { appendFileSync } from 'node:fs';
import {
  loadGuard,
  type AuditEvent,
  type GuardInstance,
} from '@umbrella-coop/flare-redact-ai-code-assistant-core';

export interface CopilotHookInput {
  tool_name?: string;
  toolName?: string;
  tool_input?: Record<string, unknown>;
  toolInput?: Record<string, unknown>;
  tool_result?: unknown;
  toolResult?: unknown;
  transformedPrompt?: string;
  prompt?: string;
  cwd?: string;
  session_id?: string;
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

export function guardFor(input: CopilotHookInput, cwdHint?: string): GuardInstance {
  const cwd = cwdHint ?? input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  return loadGuard(cwd, { audit: { sink: auditSinkFromEnv() } });
}

function pickTool(input: CopilotHookInput): string | undefined {
  return input.tool_name ?? input.toolName;
}

function pickArgs(input: CopilotHookInput): Record<string, unknown> {
  return (input.tool_input ?? input.toolInput ?? {}) as Record<string, unknown>;
}

function pickResult(input: CopilotHookInput): unknown {
  return input.tool_result ?? input.toolResult;
}

export function preToolUse(input: CopilotHookInput, guard: GuardInstance): string | null {
  const d = guard.toolInput({ tool: pickTool(input), sessionID: input.session_id }, pickArgs(input));
  switch (d.decision) {
    case 'block':
      return JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: d.reason });
    case 'redact':
      return JSON.stringify({ permissionDecision: 'allow', modifiedArgs: d.value });
    default:
      return null;
  }
}

export function postToolUse(input: CopilotHookInput, guard: GuardInstance): string | null {
  const d = guard.toolOutput({ tool: pickTool(input), sessionID: input.session_id }, pickResult(input));
  switch (d.decision) {
    case 'redact':
      return JSON.stringify({
        modifiedResult: { resultType: 'success', textResultForLlm: String(d.value) },
      });
    case 'block':
      return JSON.stringify({
        modifiedResult: {
          resultType: 'success',
          textResultForLlm: String(guard.sanitize(pickResult(input))),
        },
        additionalContext: d.reason,
      });
    default:
      return null;
  }
}

/** Rewrite the model-facing prompt. Copilot supports prompt rewriting. */
export function userPromptTransformed(input: CopilotHookInput, guard: GuardInstance): string | null {
  const text = input.transformedPrompt ?? input.prompt ?? '';
  const d = guard.prompt({ sessionID: input.session_id }, text);
  if (d.decision === 'rewrite') {
    return JSON.stringify({ modifiedTransformedPrompt: d.text });
  }
  if (d.decision === 'block') {
    return JSON.stringify({ modifiedTransformedPrompt: String(guard.sanitize(text)) });
  }
  return null;
}
