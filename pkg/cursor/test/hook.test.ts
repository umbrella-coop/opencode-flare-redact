import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardFor, preToolUse, postToolUse, beforeReadFile, beforeSubmitPrompt } from '../src/hook.js';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'flare-cursor-'));
  writeFileSync(join(dir, 'flare-redact.config.json'), JSON.stringify({}));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const base = { cwd: dir, conversation_id: 'c1' };

function json(out: string | null): Record<string, unknown> | null {
  return out ? (JSON.parse(out) as Record<string, unknown>) : null;
}

describe('cursor preToolUse', () => {
  it('denies write tools carrying secrets', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'Write', tool_input: { filePath: 'x.ts', content: 'password=hunter2' } }, guard));
    expect(out).toMatchObject({ permission: 'deny' });
    expect(String(out?.user_message)).toMatch(/flare-redact: blocked/);
  });

  it('allows with updated_input for read-like tools', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'Grep', tool_input: { query: 'alice@corp.com' } }, guard));
    expect(out).toMatchObject({ permission: 'allow' });
    expect(JSON.stringify(out?.updated_input)).not.toContain('alice@corp.com');
  });

  it('denies Shell commands carrying secrets (failClosed surface)', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'Shell', tool_input: { command: `echo ${'ghp_'.concat('a'.repeat(36))}` } }, guard));
    expect(out).toMatchObject({ permission: 'deny' });
  });
});

describe('cursor beforeReadFile', () => {
  it('denies sensitive paths', () => {
    const guard = guardFor(base);
    const out = json(beforeReadFile({ ...base, file_path: '/repo/.env' }, guard));
    expect(out).toMatchObject({ permission: 'deny' });
  });

  it('allows normal files', () => {
    const guard = guardFor(base);
    expect(beforeReadFile({ ...base, file_path: '/repo/src/parser.ts' }, guard)).toBeNull();
  });
});

describe('cursor beforeSubmitPrompt', () => {
  it('blocks prompts containing secrets (no prompt rewrite)', () => {
    const guard = guardFor(base);
    const out = json(beforeSubmitPrompt({ ...base, prompt: `use ${'ghp_'.concat('a'.repeat(36))}` }, guard));
    expect(out).toMatchObject({ continue: false });
    expect(String(out?.user_message)).toMatch(/flare-redact:/);
  });
});

describe('cursor postToolUse (MCP only)', () => {
  it('redacts MCP tool results', () => {
    const guard = guardFor(base);
    const out = json(
      postToolUse({ ...base, tool_name: 'MCP:github:read_file', tool_output: JSON.stringify({ content: 'key AKIAIOSFODNN7EXAMPLE' }) }, guard),
    );
    expect(out?.updated_mcp_tool_output).toBeDefined();
    expect(JSON.stringify(out?.updated_mcp_tool_output)).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('ignores non-MCP tools', () => {
    const guard = guardFor(base);
    expect(postToolUse({ ...base, tool_name: 'Shell', tool_output: 'alice@corp.com' }, guard)).toBeNull();
  });
});
