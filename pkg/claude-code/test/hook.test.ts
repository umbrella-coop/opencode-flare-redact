import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardFor, preToolUse, postToolUse, userPromptSubmit } from '../src/hook.js';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'flare-claude-'));
  writeFileSync(join(dir, 'flare-redact.config.json'), JSON.stringify({}));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const base = { cwd: dir, session_id: 's1', tool_use_id: 't1' };

function json(out: string | null): Record<string, unknown> | null {
  return out ? (JSON.parse(out) as Record<string, unknown>) : null;
}

describe('claude-code PreToolUse', () => {
  it('denies write tools carrying secrets', () => {
    const guard = guardFor(base);
    const out = json(
      preToolUse({ ...base, tool_name: 'Write', tool_input: { path: 'x.ts', content: 'password=hunter2' } }, guard),
    );
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'deny' });
  });

  it('denies Bash commands that would carry secrets (no rewrite)', () => {
    const guard = guardFor(base);
    const out = json(
      preToolUse({ ...base, tool_name: 'Bash', tool_input: { command: `echo ${'ghp_'.concat('a'.repeat(36))}` } }, guard),
    );
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'deny' });
  });

  it('allows with masked updatedInput for read-like tools', () => {
    const guard = guardFor(base);
    const out = json(
      preToolUse({ ...base, tool_name: 'Grep', tool_input: { pattern: 'alice@corp.com' } }, guard),
    );
    expect(out?.hookSpecificOutput).toMatchObject({ hookEventName: 'PreToolUse', permissionDecision: 'allow' });
    const updated = (out?.hookSpecificOutput as { updatedInput?: unknown }).updatedInput as { pattern: string };
    expect(updated.pattern).not.toContain('alice@corp.com');
  });

  it('returns null (allow) for clean input', () => {
    const guard = guardFor(base);
    const out = preToolUse({ ...base, tool_name: 'Bash', tool_input: { command: 'npm test' } }, guard);
    expect(out).toBeNull();
  });
});

describe('claude-code PostToolUse', () => {
  it('masks secrets in string tool output', () => {
    const guard = guardFor(base);
    const out = json(postToolUse({ ...base, tool_name: 'Read', tool_response: 'user alice@corp.com' }, guard));
    const updated = out?.hookSpecificOutput as { updatedToolOutput?: unknown };
    expect(String(updated.updatedToolOutput)).not.toContain('alice@corp.com');
  });

  it('preserves Bash result shape while masking', () => {
    const guard = guardFor(base);
    const response = { stdout: 'deploy token ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', stderr: '', interrupted: false, isImage: false };
    const out = json(postToolUse({ ...base, tool_name: 'Bash', tool_response: response }, guard));
    const updated = out?.hookSpecificOutput as { updatedToolOutput?: { stdout: string; stderr: string } };
    expect(typeof updated.updatedToolOutput).toBe('object');
    expect(updated.updatedToolOutput?.stdout).not.toContain('ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(updated.updatedToolOutput?.stderr).toBe('');
  });
});

describe('claude-code UserPromptSubmit', () => {
  it('blocks prompts containing secrets (Claude cannot rewrite)', () => {
    const guard = guardFor(base);
    const out = json(userPromptSubmit({ ...base, prompt: `use token ${'ghp_'.concat('a'.repeat(36))}` }, guard));
    expect(out?.decision).toBe('block');
    expect(out?.reason).toMatch(/flare-redact:/);
  });

  it('allows clean prompts', () => {
    const guard = guardFor(base);
    const out = userPromptSubmit({ ...base, prompt: 'refactor the parser' }, guard);
    expect(out).toBeNull();
  });
});
