import { redact, scan, isClean, summary } from 'flare-redact';
import { walkUpForConfig, readConfigFile, normalizeConfig, applyEnvOverrides, type NormalizedConfig } from './config.js';
import { DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS, DEFAULT_SENSITIVE_PATH_PATTERNS, DEFAULT_SENSITIVE_TOOLS } from './defaults.js';
import { isSensitivePath } from './glob.js';
import {
  type AdaptedDecision,
  type AuditEvent,
  type AuditSink,
  type Capabilities,
  type GuardConfig,
  type GuardMeta,
  type PromptDecision,
  type SafeFinding,
  type ScanReport,
  type SurfaceName,
  type ToolInputDecision,
  type ToolOutputDecision,
} from './types.js';

export interface GuardInstance {
  toolInput(meta: GuardMeta, args: unknown): ToolInputDecision;
  toolOutput(meta: GuardMeta, output: unknown): ToolOutputDecision;
  prompt(meta: GuardMeta, text: string): PromptDecision;
  verify(input: unknown): ScanReport;
  /** Always-redact copy of a value, regardless of surface mode. */
  sanitize(value: unknown): unknown;
  isSensitivePath(path: string): boolean;
  surface(name: SurfaceName): import('./types.js').SurfaceConfig;
  /** The effective (env-merged) flare-redact policy options. */
  policy: import('flare-redact').RedactOptions;
  auditSink: AuditSink;
}

export function createGuard(config: GuardConfig): GuardInstance {
  const normalized: NormalizedConfig = normalizeConfig(applyEnvOverrides(config));
  const policy = normalized.policy;
  const sensitiveTools = new Set(
    [...DEFAULT_SENSITIVE_TOOLS, ...normalized.sensitiveTools].map((t) => t.toLowerCase()),
  );
  const blockTools = new Set(
    [...DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS, ...normalized.blockInsteadOfRedactTools].map((t) => t.toLowerCase()),
  );
  const pathPatterns = [...DEFAULT_SENSITIVE_PATH_PATTERNS, ...normalized.sensitivePathPatterns];

  const audit: AuditSink = (event) => {
    if (!normalized.audit.enabled) return;
    normalized.audit.sink?.(event);
  };

  function toSafe(findings: import('flare-redact').Finding[]): SafeFinding[] {
    return findings.map((f) => ({
      detector: f.detector,
      label: f.label,
      why: f.why,
      risk: f.risk,
      confidence: f.confidence,
      start: f.start,
      end: f.end,
      line: f.line,
      column: f.column,
      path: f.path,
    }));
  }

  function detect(input: unknown): SafeFinding[] {
    return toSafe(scan(input, { ...policy, includeValues: false }));
  }

  function blockReason(findings: SafeFinding[]): string {
    const labels = [...new Set(findings.map((f) => f.label))];
    return `flare-redact: blocked — detected ${labels.join(', ')} (${findings.length} finding${findings.length === 1 ? '' : 's'}). Review before proceeding.`;
  }

  function noteFor(findings: SafeFinding[]): string {
    const labels = [...new Set(findings.map((f) => f.label))];
    return `flare-redact: ${labels.join(', ')} detected and redacted (${findings.length} finding${findings.length === 1 ? '' : 's'}).`;
  }

  function surfaceMode(name: SurfaceName): 'redact' | 'observe' | 'block' {
    return normalized.surfaces[name].mode;
  }

  function surfaceForInput(meta: GuardMeta): SurfaceName {
    const tool = (meta.tool ?? '').toLowerCase();
    if (sensitiveTools.has(tool)) return 'write';
    if (tool === 'read' && meta.filePath && isSensitivePath(meta.filePath, pathPatterns)) return 'sensitiveRead';
    return 'tool.input';
  }

  function emit(surface: SurfaceName, meta: GuardMeta, action: AuditEvent['action'], findings: SafeFinding[]) {
    audit({
      surface,
      tool: meta.tool,
      sessionID: meta.sessionID,
      action,
      count: findings.length,
      detectors: [...new Set(findings.map((f) => f.detector))],
      risks: [...new Set(findings.map((f) => f.risk))],
      timestamp: new Date().toISOString(),
    });
  }

  function toolInput(meta: GuardMeta, args: unknown): ToolInputDecision {
    const surface = surfaceForInput(meta);
    if (surface === 'sensitiveRead') {
      emit(surface, meta, 'block', []);
      return {
        decision: 'block',
        reason: `flare-redact: blocked — reading sensitive path ${meta.filePath ?? '(unknown)'}.`,
        findings: [],
      };
    }
    const findings = detect(args);
    if (findings.length === 0) return { decision: 'allow' };
    const tool = (meta.tool ?? '').toLowerCase();
    const mode = surfaceMode(surface);
    const effective: 'redact' | 'observe' | 'block' =
      mode === 'redact' && blockTools.has(tool) ? 'block' : mode;
    switch (effective) {
      case 'observe':
        emit(surface, meta, 'observe', findings);
        return { decision: 'observe', findings };
      case 'block':
        emit(surface, meta, 'block', findings);
        return { decision: 'block', reason: blockReason(findings), findings };
      default:
        emit(surface, meta, 'redact', findings);
        return { decision: 'redact', value: redact(args, policy), findings };
    }
  }

  function toolOutput(meta: GuardMeta, output: unknown): ToolOutputDecision {
    const findings = detect(output);
    if (findings.length === 0) return { decision: 'allow' };
    const mode = surfaceMode('tool.output');
    switch (mode) {
      case 'observe':
        emit('tool.output', meta, 'observe', findings);
        return { decision: 'observe', findings };
      case 'block':
        emit('tool.output', meta, 'block', findings);
        return { decision: 'block', reason: blockReason(findings), findings };
      default:
        emit('tool.output', meta, 'redact', findings);
        return { decision: 'redact', value: redact(output, policy), findings };
    }
  }

  function prompt(meta: GuardMeta, text: string): PromptDecision {
    const findings = detect(text);
    if (findings.length === 0) return { decision: 'allow' };
    const mode = surfaceMode('prompt');
    switch (mode) {
      case 'observe':
        emit('prompt', meta, 'observe', findings);
        return { decision: 'annotate', note: noteFor(findings), findings };
      case 'block':
        emit('prompt', meta, 'block', findings);
        return { decision: 'block', reason: blockReason(findings), findings };
      default:
        emit('prompt', meta, 'redact', findings);
        return { decision: 'rewrite', text: redact(text, policy) as string, findings };
    }
  }

  function verify(input: unknown): ScanReport {
    const findings = detect(input);
    const s = summary(input, policy);
    return {
      clean: isClean(input, policy),
      total: s.total,
      findings,
      byDetector: s.byDetector,
      byRisk: s.byRisk,
    };
  }

  return {
    toolInput,
    toolOutput,
    prompt,
    verify,
    sanitize: (value) => redact(value, policy),
    isSensitivePath: (path) => isSensitivePath(path, pathPatterns),
    surface: (name) => normalized.surfaces[name],
    policy,
    auditSink: audit,
  };
}

/** Load a Guard, discovering config from a working directory upward. */
export function loadGuard(cwd: string, extra?: GuardConfig): GuardInstance {
  const found = walkUpForConfig(cwd);
  const raw = found ? (readConfigFile(found.file) as GuardConfig) : {};
  return createGuard({
    ...raw,
    ...extra,
    policy: { ...(raw.policy ?? {}), ...(extra?.policy ?? {}) },
    audit: { ...(raw.audit ?? {}), ...(extra?.audit ?? {}) },
  });
}

/** Map a decision to a host platform's capabilities. */
export function adaptPrompt(decision: PromptDecision, caps: Pick<Capabilities, 'canRewritePrompt'>): AdaptedDecision {
  switch (decision.decision) {
    case 'allow':
      return { action: 'allow' };
    case 'rewrite':
      if (caps.canRewritePrompt) return { action: 'rewrite', value: decision.text, findings: decision.findings };
      return { action: 'block', reason: fallbackReason(decision.findings), findings: decision.findings };
    case 'block':
      return { action: 'block', reason: decision.reason, findings: decision.findings };
    case 'annotate':
      return { action: 'annotate', reason: decision.note, findings: decision.findings };
  }
}

export function adaptToolInput(decision: ToolInputDecision): AdaptedDecision {
  switch (decision.decision) {
    case 'allow':
      return { action: 'allow' };
    case 'observe':
      return { action: 'annotate', reason: '', findings: decision.findings };
    case 'redact':
      return { action: 'redact', value: decision.value, findings: decision.findings };
    case 'block':
      return { action: 'block', reason: decision.reason, findings: decision.findings };
  }
}

export function adaptToolOutput(decision: ToolOutputDecision, caps: Pick<Capabilities, 'canRewriteToolOutput'>): AdaptedDecision {
  switch (decision.decision) {
    case 'allow':
      return { action: 'allow' };
    case 'observe':
      return { action: 'annotate', reason: '', findings: decision.findings };
    case 'redact':
      return caps.canRewriteToolOutput
        ? { action: 'redact', value: decision.value, findings: decision.findings }
        : { action: 'block', reason: fallbackReason(decision.findings), findings: decision.findings };
    case 'block':
      return { action: 'block', reason: decision.reason, findings: decision.findings };
  }
}

function fallbackReason(findings: SafeFinding[]): string {
  const labels = [...new Set(findings.map((f) => f.label))];
  return `flare-redact: ${labels.join(', ')} detected; redaction not supported on this platform.`;
}
