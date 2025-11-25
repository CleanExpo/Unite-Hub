/**
 * Founder Event Log
 *
 * Comprehensive audit trail of all founder-relevant system events.
 * Used for transparency, debugging, and compliance.
 *
 * Events tracked:
 * - Agent actions and decisions
 * - Approval decisions and overrides
 * - Risk assessments and escalations
 * - Brand changes and campaigns
 * - System health and errors
 */

import type { AuditEventType } from './founderControlConfig';

export interface FounderEventLogItem {
  id: string;
  timestamp: string;
  event: AuditEventType;
  actor: string; // 'email-agent', 'content-agent', 'founder', 'system', etc.
  brand?: string;
  itemId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  data: Record<string, any>;
}

// In-memory event log (should be persisted to Supabase in production)
let eventLog: FounderEventLogItem[] = [];

/**
 * Log an event to the founder event log
 */
export function logFounderEvent(
  event: AuditEventType,
  actor: string,
  data: Record<string, any>,
  options?: {
    brand?: string;
    itemId?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }
): string {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const severity = options?.severity || 'info';

  const logItem: FounderEventLogItem = {
    id,
    timestamp,
    event,
    actor,
    brand: options?.brand,
    itemId: options?.itemId,
    severity,
    data,
  };

  eventLog.push(logItem);

  // Keep only last 1000 events in memory
  if (eventLog.length > 1000) {
    eventLog = eventLog.slice(-1000);
  }

  return id;
}

/**
 * Get recent events from log
 */
export function getFounderEvents(
  options?: {
    limit?: number;
    actor?: string;
    event?: AuditEventType;
    brand?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }
): FounderEventLogItem[] {
  let filtered = [...eventLog];

  if (options?.actor) {
    filtered = filtered.filter((e) => e.actor === options.actor);
  }

  if (options?.event) {
    filtered = filtered.filter((e) => e.event === options.event);
  }

  if (options?.brand) {
    filtered = filtered.filter((e) => e.brand === options.brand);
  }

  if (options?.severity) {
    filtered = filtered.filter((e) => e.severity === options.severity);
  }

  const limit = options?.limit || 50;
  return filtered.slice(-limit).reverse();
}

/**
 * Get event statistics
 */
export function getEventStats() {
  return {
    totalEvents: eventLog.length,
    byEvent: {
      agent_action: eventLog.filter((e) => e.event === 'agent_action').length,
      approval_decision: eventLog.filter((e) => e.event === 'approval_decision').length,
      risk_assessment: eventLog.filter((e) => e.event === 'risk_assessment').length,
      override_decision: eventLog.filter((e) => e.event === 'override_decision').length,
      brand_change: eventLog.filter((e) => e.event === 'brand_change').length,
      campaign_launch: eventLog.filter((e) => e.event === 'campaign_launch').length,
      system_health_check: eventLog.filter((e) => e.event === 'system_health_check').length,
    },
    bySeverity: {
      info: eventLog.filter((e) => e.severity === 'info').length,
      warning: eventLog.filter((e) => e.severity === 'warning').length,
      error: eventLog.filter((e) => e.severity === 'error').length,
      critical: eventLog.filter((e) => e.severity === 'critical').length,
    },
    byActor: {
      'email-agent': eventLog.filter((e) => e.actor === 'email-agent').length,
      'content-agent': eventLog.filter((e) => e.actor === 'content-agent').length,
      'research-agent': eventLog.filter((e) => e.actor === 'research-agent').length,
      'scheduling-agent': eventLog.filter((e) => e.actor === 'scheduling-agent').length,
      'analysis-agent': eventLog.filter((e) => e.actor === 'analysis-agent').length,
      'coordination-agent': eventLog.filter((e) => e.actor === 'coordination-agent').length,
      founder: eventLog.filter((e) => e.actor === 'founder').length,
      system: eventLog.filter((e) => e.actor === 'system').length,
    },
  };
}

/**
 * Get event timeline for specific item
 */
export function getItemTimeline(itemId: string): FounderEventLogItem[] {
  return eventLog.filter((e) => e.itemId === itemId).sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

/**
 * Clear event log (for testing)
 */
export function clearEventLog(): void {
  eventLog = [];
}

/**
 * Export events for compliance/audit
 */
export function exportEvents(options?: {
  startDate?: Date;
  endDate?: Date;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}): FounderEventLogItem[] {
  let filtered = [...eventLog];

  if (options?.startDate) {
    const start = options.startDate.getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= start);
  }

  if (options?.endDate) {
    const end = options.endDate.getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= end);
  }

  if (options?.severity) {
    filtered = filtered.filter((e) => e.severity === options.severity);
  }

  return filtered;
}

/**
 * Helper: Log agent action
 */
export function logAgentAction(
  agent: string,
  action: string,
  details: Record<string, any>,
  brand?: string
): string {
  return logFounderEvent('agent_action', agent, { action, ...details }, { brand });
}

/**
 * Helper: Log approval decision
 */
export function logApprovalDecision(
  approved: boolean,
  itemId: string,
  riskLevel: string,
  reason?: string
): string {
  return logFounderEvent(
    'approval_decision',
    approved ? 'auto' : 'founder',
    { approved, riskLevel, reason },
    { itemId, severity: approved ? 'info' : 'warning' }
  );
}

/**
 * Helper: Log risk assessment
 */
export function logRiskAssessment(
  itemId: string,
  score: number,
  level: string,
  brand?: string
): string {
  return logFounderEvent(
    'risk_assessment',
    'system',
    { score, level },
    { itemId, brand, severity: level === 'critical' ? 'critical' : 'info' }
  );
}
