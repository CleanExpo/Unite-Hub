/**
 * Security Monitor
 * Phase 63: Monitor security events and threats
 */

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'info' | 'warning' | 'high' | 'critical';
  description: string;
  source: string;
  user_id?: string;
  ip_address?: string;
  timestamp: string;
  resolved: boolean;
}

export type SecurityEventType =
  | 'failed_login'
  | 'unauthorized_access'
  | 'data_exposure_attempt'
  | 'rate_limit_exceeded'
  | 'suspicious_query'
  | 'api_abuse'
  | 'permission_violation';

export interface SecurityStatus {
  overall: 'secure' | 'warning' | 'threat';
  events_24h: number;
  critical_events: number;
  active_threats: SecurityEvent[];
}

/**
 * Security Monitor
 * Tracks and responds to security events
 */
export class SecurityMonitor {
  private events: SecurityEvent[] = [];

  /**
   * Log a security event
   */
  logEvent(
    type: SecurityEventType,
    severity: SecurityEvent['severity'],
    description: string,
    metadata: Partial<SecurityEvent> = {}
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      description,
      source: metadata.source || 'system',
      user_id: metadata.user_id,
      ip_address: metadata.ip_address,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    this.events.push(event);
    return event;
  }

  /**
   * Get current security status
   */
  getStatus(): SecurityStatus {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.events.filter(
      (e) => new Date(e.timestamp).getTime() > oneDayAgo
    );

    const criticalEvents = recentEvents.filter(
      (e) => e.severity === 'critical' && !e.resolved
    );

    const activeThreats = this.events.filter(
      (e) => !e.resolved && (e.severity === 'high' || e.severity === 'critical')
    );

    let overall: SecurityStatus['overall'] = 'secure';
    if (criticalEvents.length > 0) {
      overall = 'threat';
    } else if (activeThreats.length > 0) {
      overall = 'warning';
    }

    return {
      overall,
      events_24h: recentEvents.length,
      critical_events: criticalEvents.length,
      active_threats: activeThreats,
    };
  }

  /**
   * Check for data isolation violations
   */
  checkDataIsolation(query: {
    table: string;
    filters: Record<string, any>;
    workspace_id?: string;
  }): boolean {
    // Tables that require workspace isolation
    const isolatedTables = [
      'contacts',
      'campaigns',
      'generatedContent',
      'emails',
      'integrations',
    ];

    if (isolatedTables.includes(query.table)) {
      if (!query.workspace_id && !query.filters.workspace_id) {
        this.logEvent(
          'suspicious_query',
          'high',
          `Query to ${query.table} without workspace filter`,
          { source: 'data_isolation_check' }
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Check for rate limit violations
   */
  checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentRequests = this.events.filter(
      (e) =>
        e.source === identifier &&
        new Date(e.timestamp).getTime() > windowStart
    );

    if (recentRequests.length >= limit) {
      this.logEvent(
        'rate_limit_exceeded',
        'warning',
        `Rate limit exceeded for ${identifier}`,
        { source: identifier }
      );
      return false;
    }

    return true;
  }

  /**
   * Resolve an event
   */
  resolveEvent(eventId: string): boolean {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter((e) => e.type === type);
  }
}

export default SecurityMonitor;
