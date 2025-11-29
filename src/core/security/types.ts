/**
 * Core Security Types
 *
 * Type definitions for rate limiting and audit logging.
 *
 * @module core/security/types
 */

/**
 * Rate limit tiers based on route category
 */
export type RateLimitTier =
  | 'public'      // 10/min - Health checks, public pages
  | 'webhook'     // 1000/min - External webhooks (Stripe, Gmail)
  | 'client'      // 50/min - Synthex client routes
  | 'staff'       // 100/min - Unite-Hub staff routes
  | 'agent'       // 200/min - AI agent internal routes
  | 'admin';      // 500/min - Admin operations

/**
 * Rate limit configuration per tier
 */
export interface RateLimitConfig {
  tier: RateLimitTier;
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Redis key prefix
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  public: {
    tier: 'public',
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 10,
  },
  webhook: {
    tier: 'webhook',
    windowMs: 60 * 1000,
    maxRequests: 1000,
    skipFailedRequests: true,  // Don't count failed webhook attempts
  },
  client: {
    tier: 'client',
    windowMs: 60 * 1000,
    maxRequests: 50,
  },
  staff: {
    tier: 'staff',
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  agent: {
    tier: 'agent',
    windowMs: 60 * 1000,
    maxRequests: 200,
  },
  admin: {
    tier: 'admin',
    windowMs: 60 * 1000,
    maxRequests: 500,
  },
};

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;  // Timestamp when limit resets
  retryAfter?: number;  // Seconds until retry allowed
}

/**
 * Audit log severity levels
 */
export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

/**
 * Audit log categories
 */
export type AuditCategory =
  | 'AUTH'          // Authentication events
  | 'ACCESS'        // Access control events
  | 'DATA'          // Data operations
  | 'AGENT'         // AI agent operations
  | 'INTEGRATION'   // External integrations
  | 'BILLING'       // Billing/subscription events
  | 'ADMIN'         // Admin operations
  | 'SECURITY';     // Security events (rate limit, suspicious activity)

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  severity: AuditSeverity;
  category: AuditCategory;
  action: string;
  userId?: string;
  workspaceId?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;  // Operation duration in ms
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit log filter options
 */
export interface AuditLogFilter {
  userId?: string;
  workspaceId?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Security error codes
 */
export const SECURITY_ERROR_CODES = {
  RATE_LIMITED: 'SECURITY_RATE_LIMITED',
  SUSPICIOUS_ACTIVITY: 'SECURITY_SUSPICIOUS_ACTIVITY',
  IP_BLOCKED: 'SECURITY_IP_BLOCKED',
  INVALID_SIGNATURE: 'SECURITY_INVALID_SIGNATURE',
} as const;

export type SecurityErrorCode = typeof SECURITY_ERROR_CODES[keyof typeof SECURITY_ERROR_CODES];
