import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'dist', 'cli.js');
const built = existsSync(cli);

describe.skipIf(!built)('mcp server', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli],
      cwd: join(here, '..'),
    });
    client = new Client({ name: 'flare-test', version: '0.0.0' });
    await client.connect(transport);
  });

  afterAll(async () => {
    if (client) await client.close();
  });

  it('registers the four flare tools', async () => {
    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain('flare_scan');
    expect(names).toContain('flare_redact');
    expect(names).toContain('flare_is_clean');
    expect(names).toContain('flare_policy');
  });

  it('scan returns value-free findings', async () => {
    const res = await client.callTool({
      name: 'flare_scan',
      arguments: { text: `token ${'ghp_'.concat('a'.repeat(36))} alice@corp.com` },
    });
    const report = JSON.parse(res.content[0].text) as { total: number; byDetector: Record<string, number> };
    expect(report.total).toBeGreaterThan(0);
    expect(report.byDetector).toHaveProperty('github_token');
    expect(res.content[0].text).not.toContain('ghp_');
  });

  it('redact masks secrets', async () => {
    const res = await client.callTool({ name: 'flare_redact', arguments: { value: 'contact alice@corp.com' } });
    expect(res.content[0].text).not.toContain('alice@corp.com');
  });

  it('policy exposes surface modes', async () => {
    const res = await client.callTool({ name: 'flare_policy', arguments: {} });
    const body = JSON.parse(res.content[0].text) as { surfaces: Record<string, { mode: string }> };
    expect(body.surfaces.write.mode).toBe('block');
  });
});
