import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardFor, preToolUse, postToolUse, userPromptSubmit } from '../src/hook.js';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'flare-codex-'));
  writeFileSync(join(dir, 'flare-redact.config.json'), JSON.stringify({}));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const base = { cwd: dir, session_id: 's1' };

function json(out: string | null): Record<string, unknown> | null {
  return out ? (JSON.parse(out) as Record<string, unknown>) : null;
}

describe('codex PreToolUse', () => {
  it('denies apply_patch edits carrying secrets', () => {
    const guard = guardFor(base);
    const out = json(
      preToolUse({ ...base, tool_name: 'apply_patch', tool_input: { command: '*** Update File x.ts\n@@\n password=hunter2' } }, guard),
    );
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'deny' });
  });

  it('denies Bash commands carrying secrets', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'Bash', tool_input: { command: `echo ${'ghp_'.concat('a'.repeat(36))}` } }, guard));
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'deny' });
  });

  it('allows with updatedInput for read-like tools', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'Grep', tool_input: { pattern: 'alice@corp.com' } }, guard));
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'allow' });
    const updated = (out?.hookSpecificOutput as { updatedInput?: { pattern: string } }).updatedInput;
    expect(updated?.pattern).not.toContain('alice@corp.com');
  });
});

describe('codex UserPromptSubmit', () => {
  it('blocks prompts containing secrets (no prompt rewrite)', () => {
    const guard = guardFor(base);
    const out = json(userPromptSubmit({ ...base, prompt: `token ${'ghp_'.concat('a'.repeat(36))}` }, guard));
    expect(out?.decision).toBe('block');
    expect(out?.reason).toMatch(/flare-redact:/);
  });
});

describe('codex PostToolUse', () => {
  it('warns via systemMessage instead of rewriting (no output rewrite)', () => {
    const guard = guardFor(base);
    const out = json(postToolUse({ ...base, tool_name: 'Bash', tool_response: { stdout: 'alice@corp.com' } }, guard));
    expect(out?.systemMessage).toMatch(/finding/);
  });
});
