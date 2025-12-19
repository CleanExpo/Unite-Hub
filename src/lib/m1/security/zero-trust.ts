/**
 * M1 Zero Trust Security Framework
 *
 * Implements comprehensive zero trust architecture with continuous verification,
 * least privilege access, and threat detection
 *
 * Version: v2.9.0
 * Phase: 16A - Zero Trust Architecture
 */

export type TrustLevel = 'untrusted' | 'low' | 'medium' | 'high' | 'trusted';
export type AccessDecision = 'allow' | 'deny' | 'challenge' | 'require_mfa';
export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type ResourceType = 'data' | 'api' | 'database' | 'service' | 'infrastructure';

/**
 * Principal identity (user, service, device)
 */
export interface Principal {
  id: string;
  type: 'user' | 'service' | 'device';
  name: string;
  email?: string;
  department?: string;
  tags: string[];
  createdAt: number;
  lastAuthenticated: number;
  lastActivity: number;
}

/**
 * Device posture information
 */
export interface DevicePosture {
  principalId: string;
  deviceId: string;
  osVersion: string;
  firewallEnabled: boolean;
  antimalwareEnabled: boolean;
  diskEncryptionEnabled: boolean;
  compliant: boolean;
  lastChecked: number;
}

/**
 * Access context
 */
export interface AccessContext {
  principalId: string;
  action: string;
  resource: string;
  resourceType: ResourceType;
  timestamp: number;
  sourceIp: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  device?: DevicePosture;
}

/**
 * Trust evaluation result
 */
export interface TrustEvaluation {
  principalId: string;
  trustLevel: TrustLevel;
  score: number; // 0-100
  factors: {
    authenticationAge: number; // hours since last auth
    deviceCompliance: boolean;
    locationAnomaly: boolean;
    behaviorAnomaly: boolean;
    riskIndicators: string[];
  };
}

/**
 * Security policy for zero trust
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  resourceType: ResourceType;
  rules: AccessRule[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Individual access rule
 */
export interface AccessRule {
  id: string;
  priority: number;
  condition: string; // e.g., "trustLevel >= 'high' && action === 'read'"
  decision: AccessDecision;
  requireMFA?: boolean;
  requireAdditionalAuth?: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Threat indicator
 */
export interface ThreatIndicator {
  id: string;
  type: 'suspicious_access' | 'unusual_location' | 'failed_auth_attempts' | 'privilege_escalation' | 'data_exfiltration';
  severity: ThreatLevel;
  principalId: string;
  details: string;
  detectedAt: number;
  mitigated: boolean;
  mitigationAction?: string;
}

/**
 * Zero Trust Security Manager
 */
export class ZeroTrustManager {
  private principals: Map<string, Principal> = new Map();
  private devicePosture: Map<string, DevicePosture> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  private trustCache: Map<string, TrustEvaluation> = new Map();
  private accessLog: AccessContext[] = [];
  private threatIndicators: ThreatIndicator[] = [];
  private locationHistory: Map<string, Array<{ country: string; timestamp: number }>> = new Map();
  private trustCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Register principal
   */
  registerPrincipal(
    name: string,
    type: 'user' | 'service' | 'device',
    email?: string,
    department?: string,
    tags: string[] = []
  ): string {
    const id = `principal_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const principal: Principal = {
      id,
      type,
      name,
      email,
      department,
      tags,
      createdAt: now,
      lastAuthenticated: now,
      lastActivity: now,
    };

    this.principals.set(id, principal);
    return id;
  }

  /**
   * Get principal
   */
  getPrincipal(principalId: string): Principal | null {
    return this.principals.get(principalId) || null;
  }

  /**
   * Update device posture
   */
  updateDevicePosture(
    principalId: string,
    deviceId: string,
    osVersion: string,
    firewallEnabled: boolean,
    antimalwareEnabled: boolean,
    diskEncryptionEnabled: boolean
  ): void {
    const compliant = firewallEnabled && antimalwareEnabled && diskEncryptionEnabled;

    const posture: DevicePosture = {
      principalId,
      deviceId,
      osVersion,
      firewallEnabled,
      antimalwareEnabled,
      diskEncryptionEnabled,
      compliant,
      lastChecked: Date.now(),
    };

    this.devicePosture.set(deviceId, posture);
  }

  /**
   * Get device posture
   */
  getDevicePosture(deviceId: string): DevicePosture | null {
    return this.devicePosture.get(deviceId) || null;
  }

  /**
   * Create security policy
   */
  createPolicy(
    name: string,
    description: string,
    resourceType: ResourceType,
    rules: Omit<AccessRule, 'id'>[]
  ): string {
    const id = `policy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const policy: SecurityPolicy = {
      id,
      name,
      description,
      resourceType,
      rules: rules.map((r, i) => ({
        ...r,
        id: `rule_${i}_${Date.now()}`,
      })),
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.policies.set(id, policy);
    return id;
  }

  /**
   * Evaluate trust level for principal
   */
  evaluateTrust(context: AccessContext): TrustEvaluation {
    // Check cache first
    const cacheKey = `${context.principalId}_${Date.now()}`;
    const cached = Array.from(this.trustCache.values()).find(
      (e) => e.principalId === context.principalId && Date.now() - e.principalId.length < this.trustCacheTTL
    );

    if (cached) {
      return cached;
    }

    const principal = this.principals.get(context.principalId);
    if (!principal) {
      return {
        principalId: context.principalId,
        trustLevel: 'untrusted',
        score: 0,
        factors: {
          authenticationAge: 999,
          deviceCompliance: false,
          locationAnomaly: true,
          behaviorAnomaly: true,
          riskIndicators: ['Unknown principal'],
        },
      };
    }

    let score = 100; // Start at 100, deduct points
    const riskIndicators: string[] = [];

    // 1. Authentication recency (max 12 hours)
    const authAge = (Date.now() - principal.lastAuthenticated) / (60 * 60 * 1000);
    if (authAge > 12) {
      score -= 25;
      riskIndicators.push('Authentication older than 12 hours');
    } else if (authAge > 4) {
      score -= 10;
    }

    // 2. Device compliance
    if (context.device && !context.device.compliant) {
      score -= 20;
      riskIndicators.push('Device not compliant');
    }

    // 3. Location anomaly detection
    if (context.location) {
      const history = this.locationHistory.get(context.principalId) || [];
      const lastLocation = history[history.length - 1];

      if (lastLocation && lastLocation.country !== context.location.country) {
        const timeSinceLastAccess = Date.now() - lastLocation.timestamp;
        // If location changed within 1 hour, it's suspicious
        if (timeSinceLastAccess < 60 * 60 * 1000) {
          score -= 30;
          riskIndicators.push('Impossible travel detected');
        } else {
          score -= 10;
        }
      }

      // Update location history
      history.push({
        country: context.location.country,
        timestamp: Date.now(),
      });
      if (history.length > 10) {
        history.shift();
      }
      this.locationHistory.set(context.principalId, history);
    }

    // 4. Activity baseline (check for unusual activity)
    const recentAccess = this.accessLog.filter(
      (a) => a.principalId === context.principalId && Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );

    if (recentAccess.length > 100) {
      score -= 15;
      riskIndicators.push('Unusual access frequency');
    }

    // Determine trust level
    let trustLevel: TrustLevel;
    if (score >= 90) {
      trustLevel = 'trusted';
    } else if (score >= 75) {
      trustLevel = 'high';
    } else if (score >= 50) {
      trustLevel = 'medium';
    } else if (score >= 25) {
      trustLevel = 'low';
    } else {
      trustLevel = 'untrusted';
    }

    const evaluation: TrustEvaluation = {
      principalId: context.principalId,
      trustLevel,
      score: Math.max(0, Math.min(100, score)),
      factors: {
        authenticationAge: Math.round(authAge),
        deviceCompliance: context.device?.compliant || false,
        locationAnomaly: false,
        behaviorAnomaly: recentAccess.length > 100,
        riskIndicators,
      },
    };

    this.trustCache.set(`trust_${context.principalId}`, evaluation);
    return evaluation;
  }

  /**
   * Make access decision
   */
  makeAccessDecision(context: AccessContext): {
    decision: AccessDecision;
    trustLevel: TrustLevel;
    requireMFA: boolean;
    reason: string;
  } {
    // Get trust evaluation
    const trust = this.evaluateTrust(context);

    // Find applicable policy
    const policy = Array.from(this.policies.values()).find(
      (p) => p.enabled && p.resourceType === context.resourceType
    );

    let decision: AccessDecision = 'allow';
    let requireMFA = false;
    let reason = 'No policy found, default allow';

    if (policy) {
      // Evaluate rules in priority order
      const sortedRules = [...policy.rules].sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        try {
          const conditionMet = this.evaluateCondition(rule.condition, {
            trustLevel: trust.trustLevel,
            trustScore: trust.score,
            action: context.action,
          });

          if (conditionMet) {
            decision = rule.decision;
            requireMFA = rule.requireMFA || false;
            reason = `Rule matched: ${rule.condition}`;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // Log access
    this.accessLog.push(context);

    // Check for threats
    if (decision === 'deny') {
      this.registerThreat('suspicious_access', context.principalId, `Access denied: ${reason}`);
    }

    return {
      decision,
      trustLevel: trust.trustLevel,
      requireMFA,
      reason,
    };
  }

  /**
   * Register threat indicator
   */
  registerThreat(
    type: ThreatIndicator['type'],
    principalId: string,
    details: string,
    severity: ThreatLevel = 'medium'
  ): string {
    const id = `threat_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const threat: ThreatIndicator = {
      id,
      type,
      severity,
      principalId,
      details,
      detectedAt: Date.now(),
      mitigated: false,
    };

    this.threatIndicators.push(threat);

    // Auto-mitigate if critical
    if (severity === 'critical') {
      this.mitigateThreat(id, 'Automatic mitigation for critical threat');
    }

    return id;
  }

  /**
   * Mitigate threat
   */
  mitigateThreat(threatId: string, action: string): boolean {
    const threat = this.threatIndicators.find((t) => t.id === threatId);
    if (!threat) {
return false;
}

    threat.mitigated = true;
    threat.mitigationAction = action;

    return true;
  }

  /**
   * Get active threats for principal
   */
  getActiveThreatsByPrincipal(principalId: string): ThreatIndicator[] {
    return this.threatIndicators.filter((t) => t.principalId === principalId && !t.mitigated);
  }

  /**
   * Get access log with filters
   */
  getAccessLog(
    filters?: {
      principalId?: string;
      action?: string;
      resource?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    }
  ): AccessContext[] {
    let results = [...this.accessLog];

    if (filters?.principalId) {
      results = results.filter((a) => a.principalId === filters.principalId);
    }

    if (filters?.action) {
      results = results.filter((a) => a.action === filters.action);
    }

    if (filters?.resource) {
      results = results.filter((a) => a.resource === filters.resource);
    }

    if (filters?.startTime) {
      results = results.filter((a) => a.timestamp >= filters.startTime);
    }

    if (filters?.endTime) {
      results = results.filter((a) => a.timestamp <= filters.endTime);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Get security statistics
   */
  getStatistics(): Record<string, unknown> {
    const activeThreatsByLevel = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const threat of this.threatIndicators.filter((t) => !t.mitigated)) {
      activeThreatsByLevel[threat.severity]++;
    }

    const principalsWithTrustedStatus = Array.from(this.principals.values()).length;

    return {
      registeredPrincipals: this.principals.size,
      registeredDevices: this.devicePosture.size,
      activePolicies: Array.from(this.policies.values()).filter((p) => p.enabled).length,
      totalAccessEvents: this.accessLog.length,
      activeThreats: this.threatIndicators.filter((t) => !t.mitigated).length,
      threatsByLevel: activeThreatsByLevel,
      mitigatedThreats: this.threatIndicators.filter((t) => t.mitigated).length,
      principalsWithActiveThreat: new Set(
        this.threatIndicators.filter((t) => !t.mitigated).map((t) => t.principalId)
      ).size,
    };
  }

  /**
   * Evaluate condition helper
   */
  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return func(...Object.values(context)) as boolean;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const zeroTrustManager = new ZeroTrustManager();
