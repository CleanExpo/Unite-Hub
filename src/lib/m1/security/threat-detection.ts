/**
 * M1 Threat Detection & Response System
 *
 * Real-time detection of security threats, anomalies, and attack patterns
 * with automated response and forensic analysis
 *
 * Version: v2.9.0
 * Phase: 16B - Threat Detection & Response
 */

export type AnomalyType =
  | 'brute_force'
  | 'credential_stuffing'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'lateral_movement'
  | 'command_injection'
  | 'ddos'
  | 'malware';

export type ResponseAction = 'log' | 'alert' | 'block' | 'quarantine' | 'revoke_session' | 'escalate';

/**
 * Anomaly detection result
 */
export interface DetectedAnomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  principalId: string;
  evidence: string[];
  confidence: number; // 0-1
  detectedAt: number;
  responseActions: ResponseAction[];
  mitigated: boolean;
}

/**
 * Attack pattern
 */
export interface AttackPattern {
  id: string;
  name: string;
  type: string;
  indicators: string[];
  description: string;
  ttps: string[]; // Tactics, Techniques, Procedures
}

/**
 * Threat intelligence
 */
export interface ThreatIntelligence {
  id: string;
  ioc: string; // Indicator of Compromise (IP, hash, domain, etc)
  type: 'ip' | 'hash' | 'domain' | 'email' | 'file';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  firstSeen: number;
  lastSeen: number;
  active: boolean;
}

/**
 * Alert
 */
export interface SecurityAlert {
  id: string;
  type: 'anomaly' | 'threat_intel' | 'policy_violation' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  principalId?: string;
  resource?: string;
  createdAt: number;
  resolvedAt?: number;
  resolved: boolean;
  assignedTo?: string;
}

/**
 * Forensic analysis result
 */
export interface ForensicAnalysis {
  id: string;
  anomalyId: string;
  timeline: Array<{
    timestamp: number;
    event: string;
    actor: string;
  }>;
  impactAssessment: {
    datasetsAffected: string[];
    systemsAffected: string[];
    estimatedDataCompromised: number;
  };
  rootCause: string;
  recommendations: string[];
}

/**
 * Threat Detection & Response Manager
 */
export class ThreatDetectionManager {
  private anomalies: Map<string, DetectedAnomaly> = new Map();
  private patterns: Map<string, AttackPattern> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private forensicReports: Map<string, ForensicAnalysis> = new Map();
  private failedAttempts: Map<string, Array<{ timestamp: number }>> = new Map();
  private apiCallFrequency: Map<string, Array<{ timestamp: number }>> = new Map();
  private dataAccessPatterns: Map<string, Set<string>> = new Map(); // principalId -> accessed resources

  /**
   * Detect brute force attack
   */
  detectBruteForce(principalId: string, attemptTimestamps: number[]): DetectedAnomaly | null {
    // Check for 5+ failed attempts within 5 minutes
    const recentAttempts = attemptTimestamps.filter((t) => Date.now() - t < 5 * 60 * 1000);

    if (recentAttempts.length < 5) {
      return null;
    }

    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const anomaly: DetectedAnomaly = {
      id,
      type: 'brute_force',
      severity: recentAttempts.length > 20 ? 'critical' : 'high',
      principalId,
      evidence: [
        `${recentAttempts.length} failed authentication attempts`,
        'Within 5-minute window',
        `Time range: ${new Date(recentAttempts[0]).toISOString()} to ${new Date(recentAttempts[recentAttempts.length - 1]).toISOString()}`,
      ],
      confidence: Math.min(1, recentAttempts.length / 20),
      detectedAt: Date.now(),
      responseActions: ['log', 'alert', recentAttempts.length > 10 ? 'block' : 'alert'],
      mitigated: false,
    };

    this.anomalies.set(id, anomaly);
    this.createAlert('anomaly', anomaly.severity, `Brute force attack detected for ${principalId}`, anomaly.evidence.join('; '), principalId);

    return anomaly;
  }

  /**
   * Detect privilege escalation
   */
  detectPrivilegeEscalation(
    principalId: string,
    fromRole: string,
    toRole: string,
    unauthorized: boolean
  ): DetectedAnomaly | null {
    if (!unauthorized) {
      return null; // Expected behavior
    }

    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const anomaly: DetectedAnomaly = {
      id,
      type: 'privilege_escalation',
      severity: 'critical',
      principalId,
      evidence: [
        `Unauthorized escalation from ${fromRole} to ${toRole}`,
        'Privilege escalation without authorization',
      ],
      confidence: 1.0,
      detectedAt: Date.now(),
      responseActions: ['log', 'alert', 'revoke_session'],
      mitigated: false,
    };

    this.anomalies.set(id, anomaly);
    this.createAlert(
      'anomaly',
      'critical',
      `Unauthorized privilege escalation: ${fromRole} → ${toRole}`,
      `Principal ${principalId} attempted unauthorized privilege escalation`,
      principalId
    );

    return anomaly;
  }

  /**
   * Detect data exfiltration
   */
  detectDataExfiltration(principalId: string, accessedResources: string[]): DetectedAnomaly | null {
    // Check if accessing more resources than typical baseline
    const history = this.dataAccessPatterns.get(principalId) || new Set();
    const newResources = accessedResources.filter((r) => !history.has(r));

    // If accessing 10+ new resources in a short time = suspicious
    if (newResources.length < 10) {
      // Update baseline
      accessedResources.forEach((r) => history.add(r));
      this.dataAccessPatterns.set(principalId, history);
      return null;
    }

    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const anomaly: DetectedAnomaly = {
      id,
      type: 'data_exfiltration',
      severity: newResources.length > 50 ? 'critical' : 'high',
      principalId,
      evidence: [
        `Accessing ${newResources.length} previously unaccessed resources`,
        `New resources: ${newResources.slice(0, 5).join(', ')}${newResources.length > 5 ? '...' : ''}`,
      ],
      confidence: Math.min(1, newResources.length / 50),
      detectedAt: Date.now(),
      responseActions: ['log', 'alert', 'quarantine'],
      mitigated: false,
    };

    this.anomalies.set(id, anomaly);
    this.createAlert(
      'anomaly',
      anomaly.severity,
      `Potential data exfiltration detected for ${principalId}`,
      anomaly.evidence.join('; '),
      principalId
    );

    return anomaly;
  }

  /**
   * Detect DDoS attack
   */
  detectDDoS(targetResource: string, requestsInWindow: number, timeWindowMs: number = 60000): DetectedAnomaly | null {
    // 1000+ requests in 1 minute = suspicious
    if (requestsInWindow < 1000) {
      return null;
    }

    const id = `anomaly_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const anomaly: DetectedAnomaly = {
      id,
      type: 'ddos',
      severity: requestsInWindow > 10000 ? 'critical' : 'high',
      principalId: 'unknown',
      evidence: [
        `${requestsInWindow} requests to ${targetResource}`,
        `Within ${timeWindowMs}ms window`,
        'Exceeds normal threshold by >100x',
      ],
      confidence: Math.min(1, requestsInWindow / 10000),
      detectedAt: Date.now(),
      responseActions: ['log', 'alert', 'block'],
      mitigated: false,
    };

    this.anomalies.set(id, anomaly);
    this.createAlert(
      'anomaly',
      anomaly.severity,
      `DDoS attack detected on ${targetResource}`,
      anomaly.evidence.join('; ')
    );

    return anomaly;
  }

  /**
   * Check against threat intelligence
   */
  checkThreatIntelligence(ioc: string, iocType: string): ThreatIntelligence | null {
    for (const threat of this.threatIntelligence.values()) {
      if (threat.ioc === ioc && threat.type === iocType && threat.active) {
        threat.lastSeen = Date.now();
        return threat;
      }
    }
    return null;
  }

  /**
   * Add threat intelligence
   */
  addThreatIntelligence(
    ioc: string,
    type: ThreatIntelligence['type'],
    severity: ThreatIntelligence['severity'],
    source: string,
    description: string
  ): string {
    const id = `threat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const threat: ThreatIntelligence = {
      id,
      ioc,
      type,
      severity,
      source,
      description,
      firstSeen: now,
      lastSeen: now,
      active: true,
    };

    this.threatIntelligence.set(id, threat);
    return id;
  }

  /**
   * Analyze attack pattern
   */
  analyzePattern(pattern: Omit<AttackPattern, 'id'>): string {
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const fullPattern: AttackPattern = {
      ...pattern,
      id,
    };

    this.patterns.set(id, fullPattern);
    return id;
  }

  /**
   * Create security alert
   */
  createAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    title: string,
    description: string,
    principalId?: string,
    resource?: string
  ): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const alert: SecurityAlert = {
      id,
      type,
      severity,
      title,
      description,
      principalId,
      resource,
      createdAt: Date.now(),
      resolved: false,
    };

    this.alerts.set(id, alert);
    return id;
  }

  /**
   * Get active anomalies
   */
  getActiveAnomalies(filters?: { type?: AnomalyType; severity?: string; principalId?: string }): DetectedAnomaly[] {
    let results = Array.from(this.anomalies.values()).filter((a) => !a.mitigated);

    if (filters?.type) {
      results = results.filter((a) => a.type === filters.type);
    }

    if (filters?.severity) {
      results = results.filter((a) => a.severity === filters.severity);
    }

    if (filters?.principalId) {
      results = results.filter((a) => a.principalId === filters.principalId);
    }

    return results;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filters?: { severity?: string; type?: string }): SecurityAlert[] {
    let results = Array.from(this.alerts.values()).filter((a) => !a.resolved);

    if (filters?.severity) {
      results = results.filter((a) => a.severity === filters.severity);
    }

    if (filters?.type) {
      results = results.filter((a) => a.type === filters.type);
    }

    return results;
  }

  /**
   * Mitigate anomaly
   */
  mitigateAnomaly(anomalyId: string, responseAction: ResponseAction): boolean {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) {
return false;
}

    anomaly.mitigated = true;
    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, assignedTo?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
return false;
}

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    alert.assignedTo = assignedTo;
    return true;
  }

  /**
   * Perform forensic analysis
   */
  performForensicAnalysis(anomalyId: string, timeline: Array<{ timestamp: number; event: string; actor: string }>): string {
    const id = `forensic_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const analysis: ForensicAnalysis = {
      id,
      anomalyId,
      timeline,
      impactAssessment: {
        datasetsAffected: [],
        systemsAffected: [],
        estimatedDataCompromised: 0,
      },
      rootCause: 'Analysis pending',
      recommendations: [],
    };

    this.forensicReports.set(id, analysis);
    return id;
  }

  /**
   * Get security statistics
   */
  getStatistics(): Record<string, unknown> {
    const criticalAnomalies = Array.from(this.anomalies.values()).filter((a) => a.severity === 'critical' && !a.mitigated);
    const criticalAlerts = Array.from(this.alerts.values()).filter((a) => a.severity === 'critical' && !a.resolved);

    return {
      totalAnomalies: this.anomalies.size,
      activeAnomalies: Array.from(this.anomalies.values()).filter((a) => !a.mitigated).length,
      mitigatedAnomalies: Array.from(this.anomalies.values()).filter((a) => a.mitigated).length,
      anomaliesBySeverity: {
        critical: criticalAnomalies.length,
        high: Array.from(this.anomalies.values()).filter((a) => a.severity === 'high' && !a.mitigated).length,
        medium: Array.from(this.anomalies.values()).filter((a) => a.severity === 'medium' && !a.mitigated).length,
        low: Array.from(this.anomalies.values()).filter((a) => a.severity === 'low' && !a.mitigated).length,
      },
      totalAlerts: this.alerts.size,
      activeAlerts: Array.from(this.alerts.values()).filter((a) => !a.resolved).length,
      criticalAlerts: criticalAlerts.length,
      threatIntelligence: this.threatIntelligence.size,
      activeThreatIntelligence: Array.from(this.threatIntelligence.values()).filter((t) => t.active).length,
      attackPatterns: this.patterns.size,
      forensicReports: this.forensicReports.size,
    };
  }
}

// Export singleton
export const threatDetectionManager = new ThreatDetectionManager();
