import type { RedactOptions } from 'flare-redact';

export type ActionMode = 'redact' | 'observe' | 'block';

/**
 * The interception surfaces a coding assistant exposes. `tool.input` and
 * `tool.output` map onto pre/post-tool hooks, `prompt` onto the user/assistant
 * text reaching the model, `write` and `sensitiveRead` are refinements of
 * `tool.input` that default to a stricter mode.
 */
export type SurfaceName = 'tool.input' | 'tool.output' | 'prompt' | 'write' | 'sensitiveRead';

export interface SurfaceConfig {
  /** How to respond when a finding is detected on this surface. */
  mode: ActionMode;
  /**
   * Used when the host platform cannot rewrite a value in place (e.g. Codex
   * cannot rewrite tool output). `redact` then degrades to `fallback`.
   */
  fallback: ActionMode;
}

export type SurfaceMap = Record<SurfaceName, SurfaceConfig>;

export interface GuardConfig {
  policy?: RedactOptions;
  surfaces?: Partial<Record<SurfaceName, Partial<SurfaceConfig>>>;
  /** Tool names treated as write tools (default: Write, Edit, apply_patch, ...). */
  sensitiveTools?: string[];
  /**
   * Tools whose arguments must never be rewritten in place (rewriting a shell
   * command changes what executes). If a secret is found there, block instead
   * of redacting (default: Bash, Shell).
   */
  blockInsteadOfRedactTools?: string[];
  /** Glob patterns for paths that must never be read raw (default: .env, *.pem, ...). */
  sensitivePathPatterns?: string[];
  audit?: {
    enabled?: boolean;
    sink?: AuditSink;
  };
}

export interface AuditEvent {
  surface: SurfaceName;
  tool?: string;
  sessionID?: string;
  action: 'allow' | 'redact' | 'block' | 'observe' | 'annotate';
  count: number;
  detectors: string[];
  risks: string[];
  timestamp: string;
}

export type AuditSink = (event: AuditEvent) => void;

export interface GuardMeta {
  tool?: string;
  sessionID?: string;
  filePath?: string;
}

/** Value-free finding metadata, safe for logs and reports. */
export interface SafeFinding {
  detector: string;
  label: string;
  why: string;
  risk: string;
  confidence: number;
  start?: number;
  end?: number;
  line?: number;
  column?: number;
  path?: string;
}

export type ToolInputDecision =
  | { decision: 'allow' }
  | { decision: 'redact'; value: unknown; findings: SafeFinding[] }
  | { decision: 'block'; reason: string; findings: SafeFinding[] }
  | { decision: 'observe'; findings: SafeFinding[] };

export type ToolOutputDecision =
  | { decision: 'allow' }
  | { decision: 'redact'; value: unknown; findings: SafeFinding[] }
  | { decision: 'block'; reason: string; findings: SafeFinding[] }
  | { decision: 'observe'; findings: SafeFinding[] };

export type PromptDecision =
  | { decision: 'allow' }
  | { decision: 'rewrite'; text: string; findings: SafeFinding[] }
  | { decision: 'block'; reason: string; findings: SafeFinding[] }
  | { decision: 'annotate'; note: string; findings: SafeFinding[] };

export interface ScanReport {
  clean: boolean;
  total: number;
  findings: SafeFinding[];
  byDetector: Record<string, number>;
  byRisk: Record<string, number>;
}

/** What a host platform can actually mutate. */
export interface Capabilities {
  canRewriteToolInput: boolean;
  canRewriteToolOutput: boolean;
  canRewritePrompt: boolean;
}

export type AdaptedDecision =
  | { action: 'allow' }
  | { action: 'redact' | 'rewrite'; value: unknown; findings: SafeFinding[] }
  | { action: 'block' | 'annotate'; reason: string; findings: SafeFinding[] };
