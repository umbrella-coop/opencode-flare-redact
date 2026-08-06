import { appendFileSync } from 'node:fs';
import {
  loadGuard,
  adaptPrompt,
  type AuditEvent,
  type GuardInstance,
} from '@umbrella-coop/flare-redact-core';

export interface CursorHookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: unknown;
  file_path?: string;
  prompt?: string;
  cwd?: string;
  session_id?: string;
  conversation_id?: string;
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

export function guardFor(input: CursorHookInput, cwdHint?: string): GuardInstance {
  const cwd = cwdHint ?? input.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  return loadGuard(cwd, { audit: { sink: auditSinkFromEnv() } });
}

/** preToolUse → deny or allow with updated input. */
export function preToolUse(input: CursorHookInput, guard: GuardInstance): string | null {
  const d = guard.toolInput({ tool: input.tool_name, sessionID: input.session_id }, input.tool_input ?? {});
  switch (d.decision) {
    case 'block':
      return JSON.stringify({ permission: 'deny', user_message: d.reason });
    case 'redact':
      return JSON.stringify({ permission: 'allow', updated_input: d.value });
    default:
      return null;
  }
}

/** beforeReadFile → deny sensitive paths (Cursor cannot redact file reads). */
export function beforeReadFile(input: CursorHookInput, guard: GuardInstance): string | null {
  const filePath = input.file_path;
  if (filePath && guard.isSensitivePath(filePath)) {
    return JSON.stringify({
      permission: 'deny',
      user_message: `flare-redact: blocked — reading sensitive path ${filePath}.`,
    });
  }
  return null;
}

/** beforeSubmitPrompt → Cursor cannot rewrite prompts, so block on secrets. */
export function beforeSubmitPrompt(input: CursorHookInput, guard: GuardInstance): string | null {
  const d = guard.prompt({ sessionID: input.session_id }, input.prompt ?? '');
  const a = adaptPrompt(d, { canRewritePrompt: false });
  if (a.action === 'block') return JSON.stringify({ continue: false, user_message: a.reason });
  return null;
}

/** postToolUse → redact MCP tool results via updated_mcp_tool_output. */
export function postToolUse(input: CursorHookInput, guard: GuardInstance): string | null {
  const toolName = input.tool_name ?? '';
  if (!toolName.toUpperCase().startsWith('MCP:')) return null;
  const raw = input.tool_output;
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      value = raw;
    }
  }
  const d = guard.toolOutput({ tool: toolName, sessionID: input.session_id }, value);
  if (d.decision === 'redact') return JSON.stringify({ updated_mcp_tool_output: d.value });
  if (d.decision === 'block') return JSON.stringify({ updated_mcp_tool_output: guard.sanitize(value) });
  return null;
}
