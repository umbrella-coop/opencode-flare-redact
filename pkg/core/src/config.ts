import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RedactOptions } from 'flare-redact';
import { DEFAULT_SURFACES, defaultPolicy } from './defaults.js';
import type { AuditSink, GuardConfig, SurfaceConfig, SurfaceMap, SurfaceName } from './types.js';

export const CONFIG_FILE_NAMES = ['flare-redact.config.json', '.flare-redact.json'];

export function readConfigFile(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as unknown;
  } catch {
    return {};
  }
}

export interface NormalizedConfig {
  policy: RedactOptions;
  surfaces: SurfaceMap;
  sensitiveTools: string[];
  blockInsteadOfRedactTools: string[];
  sensitivePathPatterns: string[];
  audit: { enabled: boolean; sink?: AuditSink };
}

export function normalizeConfig(config?: GuardConfig): NormalizedConfig {
  const surfaces = {} as SurfaceMap;
  for (const name of Object.keys(DEFAULT_SURFACES) as SurfaceName[]) {
    const base = DEFAULT_SURFACES[name];
    const override = config?.surfaces?.[name] ?? {};
    surfaces[name] = { mode: base.mode, fallback: base.fallback, ...override };
  }
  return {
    policy: { ...defaultPolicy(), ...(config?.policy ?? {}) },
    surfaces,
    sensitiveTools: config?.sensitiveTools ?? [],
    blockInsteadOfRedactTools: config?.blockInsteadOfRedactTools ?? [],
    sensitivePathPatterns: config?.sensitivePathPatterns ?? [],
    audit: { enabled: config?.audit?.enabled ?? true, sink: config?.audit?.sink },
  };
}

/** Apply FLARE_REDACT_* environment overrides on top of a config. */
export function applyEnvOverrides(base: GuardConfig, env: NodeJS.ProcessEnv = process.env): GuardConfig {
  const cfg: GuardConfig = { ...base };
  const policy = { ...(base.policy ?? {}) };

  const mode = env.FLARE_REDACT_MODE;
  if (mode === 'mask' || mode === 'label' || mode === 'hash' || mode === 'pseudonym' || mode === 'surrogate' || mode === 'fpe') {
    policy.mode = mode;
  }
  if (env.FLARE_REDACT_ENABLE) {
    policy.enable = env.FLARE_REDACT_ENABLE.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (env.FLARE_REDACT_MIN_CONFIDENCE) {
    const n = Number(env.FLARE_REDACT_MIN_CONFIDENCE);
    if (Number.isFinite(n)) policy.minConfidence = n;
  }
  const surfaceMode = env.FLARE_REDACT_SURFACE_MODE;
  if (surfaceMode === 'redact' || surfaceMode === 'observe' || surfaceMode === 'block') {
    cfg.surfaces = {
      'tool.input': { mode: surfaceMode },
      'tool.output': { mode: surfaceMode },
      prompt: { mode: surfaceMode },
      write: { mode: surfaceMode },
      sensitiveRead: { mode: surfaceMode },
    };
  }

  cfg.policy = policy;
  return cfg;
}

export function walkUpForConfig(cwd: string): { file: string; dir: string } | null {
  let dir = cwd;
  for (;;) {
    for (const name of CONFIG_FILE_NAMES) {
      const file = join(dir, name);
      try {
        readFileSync(file, 'utf8');
        return { file, dir };
      } catch {
        // continue
      }
    }
    const parent = dir.replace(/[\\/][^\\/]*$/, '') || dir;
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Return the first config file that exists in `cwd` (no parent traversal). */
export function findConfigFile(cwd: string): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const file = join(cwd, name);
    try {
      readFileSync(file, 'utf8');
      return file;
    } catch {
      // continue
    }
  }
  return null;
}
