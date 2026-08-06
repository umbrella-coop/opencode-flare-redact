import type { RedactOptions } from 'flare-redact';
import type { SurfaceConfig, SurfaceMap, SurfaceName } from './types.js';

export const DEFAULT_SENSITIVE_TOOLS = ['Write', 'Edit', 'apply_patch', 'NotebookEdit', 'CreateFile'];

export const DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS = ['Bash', 'bash', 'Shell'];

export const DEFAULT_SENSITIVE_PATH_PATTERNS = [
  '.env',
  '.env.*',
  '**/.env*',
  '*.pem',
  '*.key',
  '*.p12',
  '*.pfx',
  'id_rsa',
  'id_ed25519',
  '.npmrc',
  '.netrc',
  '.pgpass',
  '.ssh/**',
  '**/.ssh/**',
  '**/secrets/**',
  '**/credentials*',
  '**/service-account*.json',
  '**/.aws/credentials',
  '**/.aws/config',
  '**/.azure/*',
  '**/settings_local.py',
];

export const DEFAULT_SURFACES: Record<SurfaceName, SurfaceConfig> = {
  'tool.input': { mode: 'redact', fallback: 'block' },
  'tool.output': { mode: 'redact', fallback: 'block' },
  prompt: { mode: 'redact', fallback: 'block' },
  write: { mode: 'block', fallback: 'block' },
  sensitiveRead: { mode: 'block', fallback: 'block' },
};

export function defaultPolicy(): RedactOptions {
  return {
    mode: 'mask',
    minConfidence: 0.6,
    refineConfidence: true,
  };
}

export function defaultSurfaceMap(): SurfaceMap {
  return { ...DEFAULT_SURFACES };
}
