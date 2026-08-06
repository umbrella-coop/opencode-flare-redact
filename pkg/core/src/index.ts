export {
  createGuard,
  loadGuard,
  adaptPrompt,
  adaptToolInput,
  adaptToolOutput,
} from './guard.js';
export type { GuardInstance } from './guard.js';
export { isSensitivePath, globToRegExp } from './glob.js';
export {
  findConfigFile,
  readConfigFile,
  normalizeConfig,
  applyEnvOverrides,
  walkUpForConfig,
  CONFIG_FILE_NAMES,
} from './config.js';
export {
  DEFAULT_SENSITIVE_TOOLS,
  DEFAULT_BLOCK_INSTEAD_OF_REDACT_TOOLS,
  DEFAULT_SENSITIVE_PATH_PATTERNS,
  DEFAULT_SURFACES,
  defaultPolicy,
} from './defaults.js';
export type {
  ActionMode,
  SurfaceName,
  SurfaceConfig,
  SurfaceMap,
  GuardConfig,
  AuditEvent,
  AuditSink,
  GuardMeta,
  SafeFinding,
  ToolInputDecision,
  ToolOutputDecision,
  PromptDecision,
  ScanReport,
  Capabilities,
  AdaptedDecision,
} from './types.js';
