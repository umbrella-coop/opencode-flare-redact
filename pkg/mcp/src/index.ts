import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadGuard, type GuardInstance } from '@umbrella-coop/flare-redact-core';

const SURFACE_NAMES = ['tool.input', 'tool.output', 'prompt', 'write', 'sensitiveRead'] as const;

export function createMcpServer(cwd: string = process.cwd()): McpServer {
  const guard: GuardInstance = loadGuard(cwd);
  const server = new McpServer({
    name: 'opencode-flare-redact',
    version: '0.1.0',
  });

  server.registerTool(
    'flare_scan',
    {
      title: 'Scan for secrets and PII',
      description:
        'Scan text or JSON for secrets and PII using flare-redact. Returns detector, risk, confidence and location only — raw values are never included.',
      inputSchema: {
        text: z.string().describe('Text or JSON to scan'),
      },
    },
    async ({ text }) => ({
      content: [{ type: 'text', text: JSON.stringify(guard.verify(text), null, 2) }],
    }),
  );

  server.registerTool(
    'flare_redact',
    {
      title: 'Redact secrets and PII',
      description:
        'Redact secrets and PII from text or JSON using flare-redact. Returns the value with secrets masked.',
      inputSchema: {
        value: z.any().describe('Text, object, or array to redact'),
      },
    },
    async ({ value }) => ({
      content: [{ type: 'text', text: JSON.stringify(guard.sanitize(value), null, 2) }],
    }),
  );

  server.registerTool(
    'flare_is_clean',
    {
      title: 'Check whether input is clean',
      description: 'Return whether the given text contains any secrets or PII.',
      inputSchema: {
        text: z.string().describe('Text to check'),
      },
    },
    async ({ text }) => ({
      content: [{ type: 'text', text: String(guard.verify(text).clean) }],
    }),
  );

  server.registerTool(
    'flare_policy',
    {
      title: 'Show the active redaction policy',
      description: 'Return the active flare-redact policy: redaction mode, surfaces, and configured detectors.',
      inputSchema: {},
    },
    async () => {
      const surfaces = Object.fromEntries(
        SURFACE_NAMES.map((name) => [name, guard.surface(name)]),
      );
      return {
        content: [{ type: 'text', text: JSON.stringify({ policy: guard.policy, surfaces }, null, 2) }],
      };
    },
  );

  return server;
}
