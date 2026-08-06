import { tool } from '@opencode-ai/plugin/tool';
import type { Plugin } from '@opencode-ai/plugin';
import { loadGuard } from '@umbrella-coop/flare-redact-ai-code-assistant-core';

/**
 * OpenCode plugin. Runs in-process, so the guard is loaded once per session
 * from the project directory (config discovery walks up from there).
 */
export const server: Plugin = async ({ directory }) => {
  const guard = loadGuard(directory);

  return {
    'tool.execute.before': async (input, output) => {
      const d = guard.toolInput({ tool: input.tool, sessionID: input.sessionID }, output.args);
      switch (d.decision) {
        case 'block':
          throw new Error(d.reason);
        case 'redact':
          output.args = d.value;
          break;
        default:
          break;
      }
    },

    'tool.execute.after': async (input, output) => {
      const d = guard.toolOutput({ tool: input.tool, sessionID: input.sessionID }, output.output);
      switch (d.decision) {
        case 'block':
          output.output = `[flare-redact] ${d.reason}`;
          break;
        case 'redact':
          output.output = String(d.value);
          break;
        default:
          break;
      }
    },

    'experimental.chat.messages.transform': async (_input, out) => {
      for (const message of out.messages) {
        for (const part of message.parts) {
          if (part.type === 'text') {
            const d = guard.prompt({}, part.text);
            if (d.decision === 'rewrite') part.text = d.text;
            else if (d.decision === 'block') part.text = `[flare-redact] ${d.reason}`;
          }
        }
      }
    },

    'experimental.chat.system.transform': async (_input, out) => {
      out.system = out.system.map((s) => {
        const d = guard.prompt({}, s);
        return d.decision === 'rewrite' ? d.text : s;
      });
    },

    tool: {
      'flare-redact-scan': tool({
        description:
          'Scan text or JSON for secrets and PII using flare-redact. Returns findings (raw values are never included) and a per-detector summary.',
        args: {
          text: tool.schema.string().describe('The text or JSON to scan'),
        },
        async execute({ text }) {
          return JSON.stringify(guard.verify(text), null, 2);
        },
      }),
      'flare-redact-redact': tool({
        description:
          'Redact secrets and PII from text or JSON using flare-redact. Returns the value with secrets masked. Do NOT use this to mask secrets before calling Write/Edit — the guard already blocks those.',
        args: {
          value: tool.schema.any().describe('The text, object, or array to redact'),
        },
        async execute({ value }) {
          const d = guard.toolOutput({ tool: 'flare-redact-redact' }, value);
          return JSON.stringify(d.decision === 'redact' ? d.value : value, null, 2);
        },
      }),
    },
  };
};
