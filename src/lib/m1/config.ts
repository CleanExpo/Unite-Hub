/**
 * M1 Configuration - Phase 5+
 *
 * Centralized configuration for M1 Agent Control Layer
 * Environment variables take precedence over defaults
 */

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  // Secret key for signing tokens (should be from env in production)
  secret: process.env.M1_JWT_SECRET || "m1-development-secret-key",

  // Algorithm for token signing (HS256 for HMAC, RS256 for RSA)
  algorithm: (process.env.M1_JWT_ALGORITHM || "HS256") as "HS256" | "RS256",

  // Token expiration time in minutes
  expirationMinutes: parseInt(process.env.M1_JWT_EXPIRATION_MINUTES || "5", 10),

  // Token issuer claim
  issuer: "m1-agent-control",

  // Token subject claim
  subject: "approval",
} as const;

/**
 * Approval Configuration
 */
export const APPROVAL_CONFIG = {
  // Whether to require JWT token for execute scope
  requireTokenForExecute: true,

  // Whether to require JWT token for write scope
  requireTokenForWrite: true,

  // Whether to require JWT token for read scope
  requireTokenForRead: false,

  // Maximum number of tokens that can be pre-authorized
  maxPreAuthTokens: 100,
} as const;

/**
 * Execution Limits
 */
export const EXECUTION_LIMITS = {
  // Maximum tool calls per agent run
  maxToolCallsPerRun:
    parseInt(process.env.M1_MAX_TOOL_CALLS || "50", 10),

  // Maximum execution steps per run
  maxStepsPerRun: parseInt(process.env.M1_MAX_STEPS || "100", 10),

  // Maximum runtime in seconds
  maxRuntimeSeconds: parseInt(process.env.M1_MAX_RUNTIME || "300", 10),

  // Maximum concurrent tool executions
  maxConcurrentExecutions: 5,
} as const;

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  // Log level (error, warn, info, debug)
  level: (process.env.M1_LOG_LEVEL || "info") as
    | "error"
    | "warn"
    | "info"
    | "debug",

  // Whether to log to file
  logToFile: process.env.M1_LOG_TO_FILE === "1",

  // Log file directory
  logDirectory: process.env.M1_LOG_DIR || "./logs",

  // Whether to include timestamps
  includeTimestamps: true,

  // Whether to include stack traces for errors
  includeStackTraces: process.env.M1_INCLUDE_STACK_TRACES === "1",
} as const;

/**
 * Storage Configuration
 */
export const STORAGE_CONFIG = {
  // Enable persistent storage (Convex)
  enablePersistence: process.env.M1_ENABLE_PERSISTENCE !== "0",

  // Convex API URL
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || "",

  // Maximum in-memory records before cleanup
  maxInMemoryRecords: 1000,
} as const;

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  // Enable audit logging
  enableAuditLog: true,

  // Enable policy enforcement
  enablePolicyEngine: true,

  // Enable token verification
  enableTokenVerification: true,

  // Allowed token issuers
  allowedTokenIssuers: ["m1-agent-control"],
} as const;

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  // Require tool name validation
  requireToolNameValidation: true,

  // Require scope validation
  requireScopeValidation: true,

  // Require argument validation
  requireArgumentValidation: true,

  // Maximum argument size in KB
  maxArgumentSizeKB: 100,
} as const;

/**
 * Get all M1 configuration
 */
export function getM1Config() {
  return {
    jwt: JWT_CONFIG,
    approval: APPROVAL_CONFIG,
    limits: EXECUTION_LIMITS,
    logging: LOGGING_CONFIG,
    storage: STORAGE_CONFIG,
    security: SECURITY_CONFIG,
    validation: VALIDATION_CONFIG,
  };
}
