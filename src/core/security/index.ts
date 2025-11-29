/**
 * Core Security Module
 *
 * Rate limiting and audit logging for Unite-Hub/Synthex.
 *
 * @module core/security
 *
 * @example
 * // Rate limiting
 * import { withRateLimit } from '@/core/security';
 *
 * export const POST = withRateLimit('staff', async (request) => {
 *   // Handler with 100/min rate limit
 * });
 *
 * @example
 * // Audit logging
 * import { logAuth, logData } from '@/core/security';
 *
 * await logAuth('login_success', userId, { ipAddress });
 * await logData('contact_created', 'contact', contactId, { workspaceId });
 */

// Types
export type {
  RateLimitTier,
  RateLimitConfig,
  RateLimitResult,
  AuditSeverity,
  AuditCategory,
  AuditLogEntry,
  AuditLogFilter,
  SecurityErrorCode,
} from './types';

export { RATE_LIMIT_CONFIGS, SECURITY_ERROR_CODES } from './types';

// Rate Limiter
export {
  checkRateLimit,
  withRateLimit,
  createRateLimiter,
  resetRateLimit,
  clearAllRateLimits,
  stopCleanup,
} from './rate-limiter';

// Audit Logger
export {
  AuditLogger,
  auditLogger,
  createAuditEntry,
  extractRequestMetadata,
  logAuth,
  logAccess,
  logData,
  logAgent,
  logSecurity,
} from './audit-logger';
