import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { server } from '../src/index.js';
import type { Hooks } from '@opencode-ai/plugin';

let dir: string;
let hooks: Hooks;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'flare-opencode-'));
  writeFileSync(
    join(dir, 'flare-redact.config.json'),
    JSON.stringify({ surfaces: { prompt: { mode: 'block' }, 'tool.input': { mode: 'redact' } } }),
  );
  hooks = await server({ directory: dir } as never);
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('opencode adapter', () => {
  it('blocks write tools carrying secrets', async () => {
    const out = { args: { path: 'x.ts', content: 'password=hunter2' } };
    await expect(
      (hooks['tool.execute.before'] as NonNullable<Hooks['tool.execute.before']>).call(
        hooks,
        { tool: 'Write', sessionID: 's1', callID: 'c1' },
        out,
      ),
    ).rejects.toThrow(/flare-redact: blocked/);
  });

  it('redacts non-write tool args', async () => {
    const out = { args: { pattern: 'alice@corp.com' } };
    await (hooks['tool.execute.before'] as NonNullable<Hooks['tool.execute.before']>).call(
      hooks,
      { tool: 'Grep', sessionID: 's1', callID: 'c1' },
      out,
    );
    expect(JSON.stringify(out.args)).not.toContain('alice@corp.com');
  });

  it('redacts tool output before the model sees it', async () => {
    const out = { title: 'read', output: 'user alice@corp.com' };
    await (hooks['tool.execute.after'] as NonNullable<Hooks['tool.execute.after']>).call(
      hooks,
      { tool: 'Read', sessionID: 's1', callID: 'c1', args: {} },
      out,
    );
    expect(out.output).not.toContain('alice@corp.com');
  });

  it('blocks prompts in block mode', async () => {
    const out = {
      messages: [
        {
          info: {} as never,
          parts: [{ id: 'p1', sessionID: 's1', messageID: 'm1', type: 'text', text: 'use key ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }],
        },
      ],
    };
    await (hooks['experimental.chat.messages.transform'] as NonNullable<Hooks['experimental.chat.messages.transform']>).call(hooks, {}, out);
    expect(out.messages[0]!.parts[0]!.text).toMatch(/\[flare-redact\]/);
  });
});
