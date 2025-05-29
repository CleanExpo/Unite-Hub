/**
 * Advanced Security Features for Enterprise-Grade Protection
 * 
 * This module implements enterprise-level security features including:
 * - Advanced threat detection
 * - Security event monitoring
 * - Risk-based authentication
 * - Session management enhancements
 * - Security analytics and reporting
 */

import { createClient } from '@supabase/supabase-js';

// Security event types for comprehensive monitoring
export type SecurityEventType = 
  | 'login_success'
  | 'login_failure' 
  | 'login_suspicious'
  | 'password_change'
  | 'mfa_setup'
  | 'mfa_success'
  | 'mfa_failure'
  | 'session_created'
  | 'session_expired'
  | 'session_terminated'
  | 'permission_granted'
  | 'permission_denied'
  | 'data_access'
  | 'data_export'
  | 'admin_action'
  | 'security_violation'
  | 'brute_force_detected'
  | 'account_locked'
  | 'account_unlocked'
  | 'privilege_escalation'
  | 'suspicious_activity';

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RiskFactors {
  newDevice: boolean;
  newLocation: boolean;
  suspiciousUserAgent: boolean;
  highVelocity: boolean;
  vpnDetected: boolean;
  torDetected: boolean;
  botDetected: boolean;
  previousViolations: number;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'require_mfa' | 'require_approval' | 'log_only';
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters: Record<string, unknown>;
}

interface UserContext {
  role: string;
  created_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  risk_score: number;
  expires_at: string;
  created_at: string;
}

interface UserDevice {
  id: string;
  user_id: string;
  fingerprint: string;
  created_at: string;
}

interface Permission {
  resource: string;
  action: string;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  name: string;
  permissions: RolePermission[];
}

interface UserRole {
  role: Role;
}

interface UserRiskData {
  totalRisk: number;
  count: number;
}

export class AdvancedSecurityService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Log security events for monitoring and compliance
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_events')
        .insert({
          ...event,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Trigger real-time alerts for high-severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.triggerSecurityAlert(event);
      }
    } catch (error) {
      console.error('Security event logging error:', error);
    }
  }

  /**
   * Calculate risk score based on various factors
   */
  calculateRiskScore(factors: RiskFactors, userContext: UserContext): number {
    let score = 0;

    // Device and location factors
    if (factors.newDevice) score += 20;
    if (factors.newLocation) score += 15;
    
    // Network security factors
    if (factors.vpnDetected) score += 10;
    if (factors.torDetected) score += 30;
    if (factors.botDetected) score += 40;
    
    // Behavioral factors
    if (factors.highVelocity) score += 25;
    if (factors.suspiciousUserAgent) score += 15;
    
    // Historical factors
    score += factors.previousViolations * 5;
    
    // User role adjustments
    if (userContext.role === 'admin') score += 10;
    if (userContext.role === 'super_admin') score += 15;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Perform risk-based authentication assessment
   */
  async assessLoginRisk(
    userId: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{
    riskScore: number;
    requireMFA: boolean;
    requireApproval: boolean;
    allowLogin: boolean;
    factors: RiskFactors;
  }> {
    try {
      // Get user's login history
      const { data: loginHistory } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user's device history
      const { data: deviceHistory } = await this.supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId);

      // Calculate risk factors
      const factors: RiskFactors = {
        newDevice: !deviceHistory?.some((d: UserDevice) => d.fingerprint === this.generateDeviceFingerprint(userAgent)),
        newLocation: !loginHistory?.some((l: UserSession) => this.isSameLocation(l.ip_address, ipAddress)),
        suspiciousUserAgent: this.isSuspiciousUserAgent(userAgent),
        highVelocity: this.detectHighVelocityLogin(loginHistory || []),
        vpnDetected: await this.detectVPN(),
        torDetected: await this.detectTor(),
        botDetected: this.detectBot(userAgent),
        previousViolations: await this.getPreviousViolations(userId)
      };

      // Get user context
      const { data: user } = await this.supabase
        .from('users')
        .select('role, created_at')
        .eq('id', userId)
        .single();

      const riskScore = this.calculateRiskScore(factors, user as UserContext);

      // Determine authentication requirements
      const requireMFA = riskScore >= 30;
      const requireApproval = riskScore >= 70;
      const allowLogin = riskScore < 90;

      // Log the risk assessment
      await this.logSecurityEvent({
        user_id: userId,
        event_type: riskScore >= 50 ? 'login_suspicious' : 'login_success',
        severity: this.getRiskSeverity(riskScore),
        description: `Risk-based authentication assessment completed`,
        ip_address: ipAddress,
        user_agent: userAgent,
        risk_score: riskScore,
        metadata: { factors, requireMFA, requireApproval }
      });

      return {
        riskScore,
        requireMFA,
        requireApproval,
        allowLogin,
        factors
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      // Fail secure - require MFA on error
      return {
        riskScore: 50,
        requireMFA: true,
        requireApproval: false,
        allowLogin: true,
        factors: {} as RiskFactors
      };
    }
  }

  /**
   * Monitor for brute force attacks
   */
  async detectBruteForce(
    identifier: string, 
    type: 'ip' | 'email'
  ): Promise<boolean> {
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const threshold = type === 'ip' ? 10 : 5; // Different thresholds
    
    const { data: attempts } = await this.supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'login_failure')
      .gte('created_at', new Date(Date.now() - timeWindow).toISOString())
      .or(type === 'ip' 
        ? `ip_address.eq.${identifier}`
        : `metadata->email.eq.${identifier}`
      );

    const attemptCount = attempts?.length || 0;
    
    if (attemptCount >= threshold) {
      await this.logSecurityEvent({
        event_type: 'brute_force_detected',
        severity: 'high',
        description: `Brute force attack detected from ${type}: ${identifier}`,
        ip_address: type === 'ip' ? identifier : undefined,
        risk_score: 80,
        metadata: { type, identifier, attemptCount, threshold }
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Enhanced session management with security tracking
   */
  async createSecureSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    riskScore: number
  ): Promise<string> {
    const sessionId = this.generateSecureId();
    const expiresAt = new Date();
    
    // Adjust session duration based on risk
    if (riskScore < 30) {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours for low risk
    } else if (riskScore < 60) {
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hours for medium risk
    } else {
      expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours for high risk
    }

    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        risk_score: riskScore,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error('Failed to create secure session');
    }

    await this.logSecurityEvent({
      user_id: userId,
      session_id: sessionId,
      event_type: 'session_created',
      severity: 'low',
      description: 'Secure session created',
      ip_address: ipAddress,
      user_agent: userAgent,
      risk_score: riskScore,
      metadata: { sessionDuration: expiresAt.getTime() - Date.now() }
    });

    return sessionId;
  }

  /**
   * Validate session security and check for anomalies
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    user_id?: string;
    requireReauth?: boolean;
    reason?: string;
  }> {
    const { data: session } = await this.supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (new Date() > new Date(session.expires_at)) {
      await this.logSecurityEvent({
        user_id: session.user_id,
        session_id: sessionId,
        event_type: 'session_expired',
        severity: 'low',
        description: 'Session expired',
        risk_score: 0,
        metadata: { expiredAt: session.expires_at }
      });
      
      return { valid: false, reason: 'Session expired' };
    }

    // Check for session anomalies
    const requireReauth = await this.checkSessionAnomalies(session as UserSession);

    return {
      valid: true,
      user_id: session.user_id,
      requireReauth,
      reason: requireReauth ? 'Session anomaly detected' : undefined
    };
  }

  /**
   * Advanced permission checking with audit logging
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      // Get user roles and permissions
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select(`
          role:roles(
            name,
            permissions:role_permissions(
              permission:permissions(
                resource,
                action
              )
            )
          )
        `)
        .eq('user_id', userId);

      const typedUserRoles = userRoles as UserRole[] | null;

      const hasPermission = typedUserRoles?.some((ur: UserRole) => 
        ur.role.permissions.some((p: RolePermission) => 
          p.permission.resource === resource && 
          p.permission.action === action
        )
      ) || false;

      // Log permission check
      await this.logSecurityEvent({
        user_id: userId,
        event_type: hasPermission ? 'permission_granted' : 'permission_denied',
        severity: hasPermission ? 'low' : 'medium',
        description: `Permission ${hasPermission ? 'granted' : 'denied'} for ${action} on ${resource}`,
        risk_score: hasPermission ? 0 : 20,
        metadata: { resource, action, context }
      });

      return hasPermission;
    } catch (error) {
      console.error('Permission check error:', error);
      
      // Log the error and deny by default
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'permission_denied',
        severity: 'high',
        description: `Permission check failed due to error`,
        risk_score: 50,
        metadata: { 
          resource, 
          action, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      });
      
      return false;
    }
  }

  /**
   * Security analytics and reporting
   */
  async getSecurityMetrics(timeRange: string = '24h'): Promise<{
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    averageRiskScore: number;
    highRiskEvents: number;
    topRiskyUsers: Array<{ user_id: string; riskScore: number; eventCount: number }>;
    trends: Array<{ hour: string; count: number; avgRisk: number }>;
  }> {
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 30d
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: events } = await this.supabase
      .from('security_events')
      .select('*')
      .gte('created_at', since);

    if (!events) return this.getEmptyMetrics();

    const totalEvents = events.length;
    const eventsByType = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const averageRiskScore = events.reduce((sum, event) => sum + event.risk_score, 0) / totalEvents;
    const highRiskEvents = events.filter(event => event.risk_score >= 70).length;

    // Calculate top risky users
    const userRisks = events.reduce((acc, event) => {
      if (event.user_id) {
        if (!acc[event.user_id]) {
          acc[event.user_id] = { totalRisk: 0, count: 0 };
        }
        acc[event.user_id].totalRisk += event.risk_score;
        acc[event.user_id].count++;
      }
      return acc;
    }, {} as Record<string, UserRiskData>);

    const topRiskyUsers = Object.entries(userRisks)
      .map(([user_id, data]) => ({
        user_id,
        riskScore: (data as UserRiskData).totalRisk / (data as UserRiskData).count,
        eventCount: (data as UserRiskData).count
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Calculate hourly trends
    const trends = this.calculateHourlyTrends(events);

    return {
      totalEvents,
      eventsByType,
      averageRiskScore,
      highRiskEvents,
      topRiskyUsers,
      trends
    };
  }

  // Private helper methods

  private async triggerSecurityAlert(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    // Implementation for real-time security alerts
    // Could integrate with email, Slack, PagerDuty, etc.
    console.warn('SECURITY ALERT:', event);
  }

  private generateDeviceFingerprint(userAgent: string): string {
    // Simplified device fingerprinting
    return Buffer.from(userAgent).toString('base64').substring(0, 32);
  }

  private isSameLocation(ip1: string, ip2: string): boolean {
    // Simplified location comparison - in production, use proper geolocation
    return ip1.split('.').slice(0, 2).join('.') === ip2.split('.').slice(0, 2).join('.');
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /curl/i, /wget/i, /python/i, /bot/i, /crawler/i, /spider/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private detectHighVelocityLogin(loginHistory: UserSession[]): boolean {
    if (loginHistory.length < 2) return false;
    
    const recent = loginHistory.slice(0, 2);
    const timeDiff = new Date(recent[0].created_at).getTime() - new Date(recent[1].created_at).getTime();
    
    return timeDiff < 60000; // Less than 1 minute between logins
  }

  private async detectVPN(): Promise<boolean> {
    // Placeholder for VPN detection service integration
    return false;
  }

  private async detectTor(): Promise<boolean> {
    // Placeholder for Tor detection service integration
    return false;
  }

  private detectBot(userAgent: string): boolean {
    const botPatterns = [
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private async getPreviousViolations(userId: string): Promise<number> {
    const { data: violations } = await this.supabase
      .from('security_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'security_violation');

    return violations?.length || 0;
  }

  private getRiskSeverity(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private generateSecureId(): string {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async checkSessionAnomalies(session: UserSession): Promise<boolean> {
    // Check for suspicious session activity
    // This is a simplified implementation
    console.log('Checking session anomalies for:', session.id);
    return false;
  }

  private getEmptyMetrics() {
    return {
      totalEvents: 0,
      eventsByType: {} as Record<SecurityEventType, number>,
      averageRiskScore: 0,
      highRiskEvents: 0,
      topRiskyUsers: [],
      trends: []
    };
  }

  private calculateHourlyTrends(events: SecurityEvent[]) {
    const hourlyData = events.reduce((acc, event) => {
      const hour = new Date(event.created_at).toISOString().substring(0, 13);
      if (!acc[hour]) {
        acc[hour] = { count: 0, totalRisk: 0 };
      }
      acc[hour].count++;
      acc[hour].totalRisk += event.risk_score;
      return acc;
    }, {} as Record<string, { count: number; totalRisk: number }>);

    return Object.entries(hourlyData).map(([hour, data]: [string, { count: number; totalRisk: number }]) => ({
      hour,
      count: data.count,
      avgRisk: data.totalRisk / data.count
    }));
  }
}

// Export singleton instance
export const advancedSecurity = new AdvancedSecurityService();
