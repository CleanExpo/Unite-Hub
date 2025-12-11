/**
 * Guardian I10: QA Audit Logger
 *
 * Light-weight audit event logging for cross-I-series operations.
 * Only records IDs, counts, severities, and labels — never raw payloads or PII.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianQaAuditEventInput {
  tenantId: string;
  actorId?: string;
  source: string; // 'simulation', 'regression', 'chaos', 'gatekeeper', 'training', 'performance', 'coverage', 'qa_scheduler'
  sourceId?: string; // referenced entity id
  eventType: string; // 'qa_run_started', 'qa_run_completed', 'gate_decision', 'slo_failed', etc.
  severity?: 'info' | 'warning' | 'critical';
  summary: string;
  details?: Record<string, unknown>;
}

// Helper: truncate long strings
function truncateString(str: string, maxLength: number = 500): string {
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// Helper: sanitize details to remove suspicious fields
function sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!details) {
return {};
}

  const sanitized: Record<string, unknown> = {};
  const maxDetailSize = 10000; // 10KB max for entire details blob
  let currentSize = 0;

  for (const [key, value] of Object.entries(details)) {
    // Skip suspicious keys
    if (key.match(/password|secret|token|apikey|key|credential|auth|email|phone|ssn|pii/i)) {
      continue;
    }

    let sanitizedValue: unknown = value;

    // If value is a large string, truncate it
    if (typeof value === 'string') {
      sanitizedValue = truncateString(value, 500);
    }

    // Track size
    const valueSize = JSON.stringify(sanitizedValue).length;
    if (currentSize + valueSize > maxDetailSize) {
      break; // Stop adding if we exceed max detail size
    }

    sanitized[key] = sanitizedValue;
    currentSize += valueSize;
  }

  return sanitized;
}

/**
 * Log a QA audit event
 *
 * Normalizes severity, truncates overly long fields, strips suspicious data,
 * and inserts into guardian_qa_audit_events.
 *
 * Safe to call from any I-series handler — failures log to console but don't throw.
 */
export async function logQaEvent(input: GuardianQaAuditEventInput): Promise<void> {
  const severity = input.severity || 'info';
  const summary = truncateString(input.summary, 500);
  const details = sanitizeDetails(input.details);

  try {
    const supabase = getSupabaseServer();

    const { error } = await supabase.from('guardian_qa_audit_events').insert({
      tenant_id: input.tenantId,
      actor_id: input.actorId || null,
      source: input.source,
      source_id: input.sourceId || null,
      event_type: input.eventType,
      severity,
      summary,
      details,
      metadata: {}, // Can be populated by callers if needed
    });

    if (error) {
      console.error(`[Guardian QA Audit] Failed to log event: ${error.message}`, {
        source: input.source,
        eventType: input.eventType,
      });
    }
  } catch (err) {
    console.error('[Guardian QA Audit] Error logging event', err, {
      source: input.source,
      eventType: input.eventType,
    });
  }
}

/**
 * Batch log multiple QA events
 */
export async function logQaEventsBatch(events: GuardianQaAuditEventInput[]): Promise<void> {
  await Promise.all(events.map((event) => logQaEvent(event)));
}

/**
 * Helper: Log a QA run completion event
 */
export async function logQaRunCompleted(
  tenantId: string,
  source: string,
  sourceId: string,
  status: 'success' | 'failed',
  summary: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source,
    sourceId,
    eventType: 'qa_run_completed',
    severity: status === 'success' ? 'info' : 'warning',
    summary,
    details,
  });
}

/**
 * Helper: Log a gatekeeper decision
 */
export async function logGatekeeperDecision(
  tenantId: string,
  sourceId: string,
  decision: 'allow' | 'block' | 'warn',
  summary: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source: 'gatekeeper',
    sourceId,
    eventType: 'gate_decision',
    severity: decision === 'block' ? 'critical' : decision === 'warn' ? 'warning' : 'info',
    summary,
    details: {
      ...details,
      decision,
    },
  });
}

/**
 * Helper: Log an SLO failure (performance)
 */
export async function logSloFailure(
  tenantId: string,
  sourceId: string,
  failedCriteria: string[],
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source: 'performance',
    sourceId,
    eventType: 'performance_slo_failed',
    severity: 'warning',
    summary: `SLO failure: ${failedCriteria.join(', ')}`,
    details: {
      ...details,
      failedCriteria,
    },
  });
}

/**
 * Helper: Log coverage snapshot creation
 */
export async function logCoverageSnapshot(
  tenantId: string,
  sourceId: string,
  summary: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source: 'coverage',
    sourceId,
    eventType: 'coverage_snapshot_created',
    severity: 'info',
    summary,
    details,
  });
}

/**
 * Helper: Log drift report creation
 */
export async function logDriftReport(
  tenantId: string,
  sourceId: string,
  severity: 'info' | 'warning' | 'critical',
  summary: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source: 'qa_scheduler',
    sourceId,
    eventType: 'drift_report_created',
    severity,
    summary,
    details,
  });
}

/**
 * Helper: Log drill completion
 */
export async function logDrillCompleted(
  tenantId: string,
  sourceId: string,
  status: 'success' | 'failed',
  summary: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logQaEvent({
    tenantId,
    source: 'training',
    sourceId,
    eventType: 'drill_completed',
    severity: status === 'success' ? 'info' : 'warning',
    summary,
    details,
  });
}
