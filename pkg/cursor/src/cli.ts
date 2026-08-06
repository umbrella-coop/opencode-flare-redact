import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guardFor, preToolUse, postToolUse, beforeReadFile, beforeSubmitPrompt } from './hook.js';

function readStdin(): Promise<string> {
  return new Promise((done, fail) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (c) => chunks.push(Buffer.from(c)));
    process.stdin.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', fail);
  });
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? 'preToolUse';
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    process.exit(0);
  }

  const guard = guardFor(input);

  let out: string | null = null;
  switch (mode) {
    case 'preToolUse':
      out = preToolUse(input, guard);
      break;
    case 'postToolUse':
      out = postToolUse(input, guard);
      break;
    case 'beforeReadFile':
      out = beforeReadFile(input, guard);
      break;
    case 'beforeSubmitPrompt':
      out = beforeSubmitPrompt(input, guard);
      break;
    case 'verify': {
      const target = process.argv[3] ?? '-';
      const text = target === '-' ? raw : readFileSync(resolve(process.cwd(), target), 'utf8');
      const report = guard.verify(text);
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      process.exit(report.clean ? 0 : 1);
      return;
    }
    default:
      process.exit(0);
  }

  if (out) process.stdout.write(out);
  process.exit(0);
}

main().catch(() => process.exit(0));
