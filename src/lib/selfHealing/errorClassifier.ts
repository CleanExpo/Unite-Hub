/**
 * Error Classifier for Self-Healing Mode
 *
 * Pattern-based error categorization for automatic triage
 * and routing to appropriate self-healing workflows.
 */

import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export type ErrorCategory =
  | 'RLS_VIOLATION'
  | 'AUTH_FAILURE'
  | 'SSR_HYDRATION'
  | 'API_SCHEMA'
  | 'PERFORMANCE'
  | 'UI_BUG'
  | 'REDIRECT_LOOP'
  | 'DB_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT'
  | 'UNKNOWN';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ClassifiedError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  signature: string;
  summary: string;
  context: Record<string, unknown>;
  suggestedAction?: string;
}

// ============================================
// INPUT SCHEMA
// ============================================

const errorInputSchema = z.object({
  route: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  errorMessage: z.string().optional(),
  stack: z.string().optional(),
  payload: z.any().optional(),
  headers: z.record(z.string()).optional(),
  latencyMs: z.number().optional(),
});

export type ErrorInput = z.infer<typeof errorInputSchema>;

// ============================================
// PATTERN MATCHERS
// ============================================

interface ErrorPattern {
  category: ErrorCategory;
  severity: ErrorSeverity;
  patterns: RegExp[];
  statusCodes?: number[];
  suggestedAction?: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // RLS Violations
  {
    category: 'RLS_VIOLATION',
    severity: 'HIGH',
    patterns: [
      /row level security/i,
      /rls/i,
      /policy.*violation/i,
      /permission denied for table/i,
      /new row violates row-level security/i,
    ],
    suggestedAction: 'Check RLS policies for the affected table. Verify user role and workspace membership.',
  },

  // Authentication Failures
  {
    category: 'AUTH_FAILURE',
    severity: 'HIGH',
    patterns: [
      /jwt.*expired/i,
      /invalid.*token/i,
      /unauthorized/i,
      /auth.*failed/i,
      /session.*expired/i,
      /invalid.*refresh.*token/i,
    ],
    statusCodes: [401],
    suggestedAction: 'Check token validity and session refresh logic. May need to re-authenticate.',
  },

  // SSR Hydration Errors
  {
    category: 'SSR_HYDRATION',
    severity: 'MEDIUM',
    patterns: [
      /hydration/i,
      /text content did not match/i,
      /expected server html/i,
      /server.*client.*mismatch/i,
      /useLayoutEffect does nothing on the server/i,
    ],
    suggestedAction: 'Add isHydrated check or use dynamic import with ssr: false.',
  },

  // API Schema / Validation Errors
  {
    category: 'API_SCHEMA',
    severity: 'MEDIUM',
    patterns: [
      /zod.*error/i,
      /validation.*failed/i,
      /invalid.*schema/i,
      /required.*field/i,
      /type.*mismatch/i,
      /expected.*but.*received/i,
    ],
    statusCodes: [400, 422],
    suggestedAction: 'Update API schema or client payload to match expected format.',
  },

  // Performance Issues
  {
    category: 'PERFORMANCE',
    severity: 'HIGH',
    patterns: [
      /timeout/i,
      /took too long/i,
      /exceeded.*limit/i,
      /slow.*query/i,
      /connection.*pool.*exhausted/i,
    ],
    statusCodes: [504, 408],
    suggestedAction: 'Optimize query or add caching. Consider connection pooling.',
  },

  // Redirect Loops
  {
    category: 'REDIRECT_LOOP',
    severity: 'CRITICAL',
    patterns: [
      /too many redirects/i,
      /infinite redirect/i,
      /redirect loop/i,
      /err_too_many_redirects/i,
    ],
    suggestedAction: 'Check middleware redirect conditions and auth callback logic.',
  },

  // Database Errors
  {
    category: 'DB_ERROR',
    severity: 'HIGH',
    patterns: [
      /23505/i, // Unique violation
      /duplicate key/i,
      /constraint.*violation/i,
      /syntax error at/i,
      /relation.*does not exist/i,
      /column.*does not exist/i,
      /undefined.*table/i,
      /deadlock/i,
      /connection.*refused/i,
    ],
    statusCodes: [500],
    suggestedAction: 'Check database schema, constraints, and connection settings.',
  },

  // Network Errors
  {
    category: 'NETWORK_ERROR',
    severity: 'MEDIUM',
    patterns: [
      /econnrefused/i,
      /enotfound/i,
      /fetch.*failed/i,
      /network.*error/i,
      /dns.*lookup.*failed/i,
    ],
    suggestedAction: 'Check external service availability and network configuration.',
  },

  // Rate Limiting
  {
    category: 'RATE_LIMIT',
    severity: 'MEDIUM',
    patterns: [
      /rate.*limit/i,
      /too many requests/i,
      /throttled/i,
      /quota.*exceeded/i,
    ],
    statusCodes: [429],
    suggestedAction: 'Implement backoff strategy or request rate limiting.',
  },

  // UI/JavaScript Bugs
  {
    category: 'UI_BUG',
    severity: 'MEDIUM',
    patterns: [
      /undefined is not a function/i,
      /cannot read properties of undefined/i,
      /cannot read property.*of null/i,
      /is not a function/i,
      /maximum call stack/i,
      /typeerror/i,
      /referenceerror/i,
    ],
    suggestedAction: 'Add null checks or default values. Review component lifecycle.',
  },
];

// ============================================
// CLASSIFIER
// ============================================

/**
 * Classify an error into a category with severity and suggested action
 */
export function classifyError(raw: unknown): ClassifiedError {
  // Parse input safely
  let data: ErrorInput;
  try {
    data = errorInputSchema.parse(raw ?? {});
  } catch {
    data = {};
  }

  const msg = (data.errorMessage || '').toLowerCase();
  const stack = (data.stack || '').toLowerCase();
  const route = data.route || 'unknown';
  const combinedText = `${msg} ${stack}`;

  // Generate signature for deduplication
  const signature = generateSignature(route, data.statusCode, msg);

  // Default classification
  const base: ClassifiedError = {
    category: 'UNKNOWN',
    severity: 'MEDIUM',
    signature,
    summary: data.errorMessage || 'Unknown error',
    context: { route, method: data.method, statusCode: data.statusCode },
  };

  // Match against patterns
  for (const pattern of ERROR_PATTERNS) {
    // Check status code match
    if (pattern.statusCodes?.includes(data.statusCode || 0)) {
      return {
        ...base,
        category: pattern.category,
        severity: pattern.severity,
        suggestedAction: pattern.suggestedAction,
      };
    }

    // Check regex patterns
    for (const regex of pattern.patterns) {
      if (regex.test(combinedText)) {
        return {
          ...base,
          category: pattern.category,
          severity: pattern.severity,
          suggestedAction: pattern.suggestedAction,
        };
      }
    }
  }

  // Fallback severity based on status code
  if (data.statusCode) {
    if (data.statusCode >= 500) {
      base.severity = 'HIGH';
    } else if (data.statusCode === 401 || data.statusCode === 403) {
      base.severity = 'HIGH';
    }
  }

  return base;
}

/**
 * Generate a unique signature for error deduplication
 */
function generateSignature(route: string, statusCode?: number, message?: string): string {
  // Normalize route (remove dynamic segments)
  const normalizedRoute = route.replace(/\/[0-9a-f-]{36}/gi, '/:id');

  // Extract key error phrase
  const errorPhrase = (message || '')
    .slice(0, 80)
    .replace(/[0-9a-f-]{36}/gi, ':uuid')
    .replace(/\d+/g, ':n')
    .trim();

  return `${normalizedRoute}:${statusCode ?? 'NA'}:${errorPhrase}`;
}

/**
 * Bulk classify multiple errors
 */
export function classifyErrors(errors: unknown[]): ClassifiedError[] {
  return errors.map(classifyError);
}

/**
 * Get severity priority (for sorting)
 */
export function getSeverityPriority(severity: ErrorSeverity): number {
  const priorities: Record<ErrorSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };
  return priorities[severity];
}

/**
 * Check if error is production-critical
 */
export function isProductionCritical(error: ClassifiedError): boolean {
  return (
    error.severity === 'CRITICAL' ||
    (error.severity === 'HIGH' && ['AUTH_FAILURE', 'REDIRECT_LOOP', 'DB_ERROR'].includes(error.category))
  );
}
