import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guardFor, preToolUse, postToolUse, userPromptTransformed } from '../src/hook.js';

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'flare-copilot-'));
  writeFileSync(join(dir, 'flare-redact.config.json'), JSON.stringify({}));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const base = { cwd: dir, session_id: 's1' };

function json(out: string | null): Record<string, unknown> | null {
  return out ? (JSON.parse(out) as Record<string, unknown>) : null;
}

describe('copilot preToolUse', () => {
  it('denies write tools carrying secrets', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'edit', tool_input: { filePath: 'x.ts', fileContents: 'password=hunter2' } }, guard));
    expect(out).toMatchObject({ permissionDecision: 'deny' });
  });

  it('allows with modifiedArgs for read-like tools', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, tool_name: 'grep', tool_input: { query: 'alice@corp.com' } }, guard));
    expect(out).toMatchObject({ permissionDecision: 'allow' });
    const modified = (out?.modifiedArgs ?? {}) as { query: string };
    expect(modified.query).not.toContain('alice@corp.com');
  });

  it('accepts camelCase input keys too', () => {
    const guard = guardFor(base);
    const out = json(preToolUse({ ...base, toolName: 'edit', toolInput: { content: 'password=hunter2' } }, guard));
    expect(out).toMatchObject({ permissionDecision: 'deny' });
  });

  it('returns null for clean input', () => {
    const guard = guardFor(base);
    expect(preToolUse({ ...base, tool_name: 'bash', tool_input: { command: 'npm test' } }, guard)).toBeNull();
  });
});

describe('copilot postToolUse', () => {
  it('masks secrets in tool results', () => {
    const guard = guardFor(base);
    const out = json(postToolUse({ ...base, tool_name: 'read', tool_result: 'token ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, guard));
    expect(out?.modifiedResult).toMatchObject({ resultType: 'success' });
    expect((out?.modifiedResult as { textResultForLlm: string }).textResultForLlm).not.toContain('ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});

describe('copilot userPromptTransformed', () => {
  it('rewrites the model-facing prompt (prompt rewriting supported)', () => {
    const guard = guardFor(base);
    const out = json(userPromptTransformed({ ...base, transformedPrompt: 'email alice@corp.com please' }, guard));
    expect(out?.modifiedTransformedPrompt).toBeDefined();
    expect(String(out?.modifiedTransformedPrompt)).not.toContain('alice@corp.com');
  });

  it('leaves clean prompts untouched', () => {
    const guard = guardFor(base);
    expect(userPromptTransformed({ ...base, transformedPrompt: 'write a parser' }, guard)).toBeNull();
  });
});
