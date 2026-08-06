import { describe, expect, it } from 'vitest';
import { createGuard, isSensitivePath, globToRegExp, adaptPrompt, adaptToolInput, adaptToolOutput } from '../src/index.js';

const guard = createGuard({});

describe('toolInput', () => {
  it('blocks write tools when a secret is present', () => {
    const d = guard.toolInput({ tool: 'Write' }, { path: 'x.ts', content: 'password=hunter2' });
    expect(d.decision).toBe('block');
    if (d.decision === 'block') expect(d.reason).toMatch(/flare-redact: blocked/);
  });

  it('redacts non-write tool args instead of blocking', () => {
    const d = guard.toolInput({ tool: 'Grep' }, { pattern: 'alice@corp.com' });
    expect(d.decision).toBe('redact');
    if (d.decision === 'redact') {
      expect(JSON.stringify(d.value)).not.toContain('alice@corp.com');
    }
  });

  it('blocks Bash commands that would carry a secret (no rewrite)', () => {
    const d = guard.toolInput({ tool: 'Bash' }, { command: `curl -H "Authorization: Bearer ghp_${'a'.repeat(36)}" https://x` });
    expect(d.decision).toBe('block');
  });

  it('blocks sensitive file reads', () => {
    const d = guard.toolInput({ tool: 'Read', filePath: '/repo/.env' }, { path: '/repo/.env' });
    expect(d.decision).toBe('block');
  });

  it('allows clean input', () => {
    const d = guard.toolInput({ tool: 'Grep' }, { pattern: 'console.log' });
    expect(d.decision).toBe('allow');
  });

  it('does not expose raw values in findings', () => {
    const d = guard.toolInput({ tool: 'Grep' }, { pattern: 'alice@corp.com' });
    if (d.decision === 'redact') {
      for (const f of d.findings) expect(f).not.toHaveProperty('value');
      expect(JSON.stringify(d.findings)).not.toContain('alice@corp.com');
    }
  });
});

describe('toolOutput', () => {
  it('redacts secrets in tool output strings', () => {
    const d = guard.toolOutput({ tool: 'Bash' }, 'token ghp_abcdefghijklmnopqrstuvwxyz1234567890');
    expect(d.decision).toBe('redact');
    if (d.decision === 'redact') expect(String(d.value)).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz1234567890');
  });

  it('redacts nested objects', () => {
    const d = guard.toolOutput({ tool: 'Read' }, { user: 'bob@corp.com', note: 'key AKIAIOSFODNN7EXAMPLE' });
    expect(d.decision).toBe('redact');
    if (d.decision === 'redact') {
      expect(JSON.stringify(d.value)).not.toContain('bob@corp.com');
      expect(JSON.stringify(d.value)).not.toContain('AKIAIOSFODNN7EXAMPLE');
    }
  });

  it('allows clean output', () => {
    const d = guard.toolOutput({ tool: 'Bash' }, 'ok');
    expect(d.decision).toBe('allow');
  });
});

describe('prompt', () => {
  it('rewrites a prompt containing PII', () => {
    const d = guard.prompt({}, 'charge bob@corp.com for the invoice');
    expect(d.decision).toBe('rewrite');
    if (d.decision === 'rewrite') expect(d.text).not.toContain('bob@corp.com');
  });

  it('blocks in block mode', () => {
    const g = createGuard({ surfaces: { prompt: { mode: 'block' } } });
    const d = g.prompt({}, 'my key is ghp_abcdefghijklmnopqrstuvwxyz1234567890');
    expect(d.decision).toBe('block');
  });

  it('annotates in observe mode', () => {
    const g = createGuard({ surfaces: { prompt: { mode: 'observe' } } });
    const d = g.prompt({}, 'email alice@corp.com');
    expect(d.decision).toBe('annotate');
  });

  it('allows clean prompts', () => {
    const d = guard.prompt({}, 'write a test for the parser');
    expect(d.decision).toBe('allow');
  });
});

describe('verify', () => {
  it('reports findings without values', () => {
    const r = guard.verify('aws key AKIAIOSFODNN7EXAMPLE and alice@corp.com');
    expect(r.clean).toBe(false);
    expect(r.total).toBeGreaterThan(0);
    expect(r.byDetector).toHaveProperty('aws_access_key');
    expect(JSON.stringify(r.findings)).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(JSON.stringify(r.findings)).not.toContain('alice@corp.com');
  });

  it('reports clean input', () => {
    const r = guard.verify('nothing here');
    expect(r.clean).toBe(true);
    expect(r.total).toBe(0);
  });
});

describe('sensitive paths', () => {
  it('matches default patterns', () => {
    expect(isSensitivePath('/repo/.env', ['**/.env*'])).toBe(true);
    expect(isSensitivePath('/repo/config/.env.local', ['**/.env*'])).toBe(true);
    expect(isSensitivePath('/repo/keys/private.pem', ['*.pem'])).toBe(true);
    expect(isSensitivePath('/repo/aws/credentials', ['**/.aws/credentials'])).toBe(false);
    expect(isSensitivePath('/repo/.aws/credentials', ['**/.aws/credentials'])).toBe(true);
    expect(isSensitivePath('/repo/.ssh/id_rsa', ['**/.ssh/**'])).toBe(true);
  });

  it('globToRegExp handles ? and *', () => {
    expect(globToRegExp('*.pem').test('x/y/key.pem')).toBe(true);
    expect(globToRegExp('*.pem').test('x/y/key.pem2')).toBe(false);
  });
});

describe('capability adaptation', () => {
  it('degrades prompt rewrite to block without rewrite support', () => {
    const d = guard.prompt({}, 'key ghp_abcdefghijklmnopqrstuvwxyz1234567890');
    if (d.decision !== 'rewrite') throw new Error('expected rewrite');
    const a = adaptPrompt(d, { canRewritePrompt: false });
    expect(a.action).toBe('block');
    const b = adaptPrompt(d, { canRewritePrompt: true });
    expect(b.action).toBe('rewrite');
  });

  it('degrades tool output redact to block without rewrite support', () => {
    const d = guard.toolOutput({ tool: 'Bash' }, 'alice@corp.com');
    if (d.decision !== 'redact') throw new Error('expected redact');
    expect(adaptToolOutput(d, { canRewriteToolOutput: false }).action).toBe('block');
    expect(adaptToolOutput(d, { canRewriteToolOutput: true }).action).toBe('redact');
  });

  it('adapts tool input redact', () => {
    const d = guard.toolInput({ tool: 'Grep' }, 'alice@corp.com');
    if (d.decision !== 'redact') throw new Error('expected redact');
    expect(adaptToolInput(d).action).toBe('redact');
  });
});

describe('audit sink', () => {
  it('emits value-free audit events', () => {
    const events: unknown[] = [];
    const g = createGuard({ audit: { sink: (e) => events.push(e) } });
    g.toolInput({ tool: 'Grep' }, 'alice@corp.com');
    expect(events).toHaveLength(1);
    const ev = events[0] as { detectors: string[] };
    expect(ev.detectors).toContain('email');
    expect(JSON.stringify(events)).not.toContain('alice@corp.com');
  });
});
