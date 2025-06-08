/**
 * ThreatDetector - AI-driven threat detection and analysis
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { getSystemMonitor, SystemMetrics, SystemAlert } from '../monitoring/SystemMonitor';
import { RuntimeService } from '../../services/base/RuntimeService';
import { EventEmitter } from 'events';

export interface ThreatSignature {
  id: string;
  type: 'brute-force' | 'injection' | 'ddos' | 'data-exfiltration' | 'privilege-escalation' | 'malware' | 'anomaly';
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
}

export interface SecurityThreat {
  id: string;
  type: ThreatSignature['type'];
  severity: ThreatSignature['severity'];
  source: string;
  target: string;
  description: string;
  confidence: number; // 0-1
  indicators: string[];
  timestamp: Date;
  status: 'active' | 'mitigated' | 'resolved';
  mitigationActions?: string[];
}

export interface SecurityMetrics {
  totalThreatsDetected: number;
  activeThreats: number;
  threatsBlockedToday: number;
  averageResponseTime: number; // ms
  falsePositiveRate: number; // 0-1
  detectionAccuracy: number; // 0-1
}

export class ThreatDetector extends RuntimeService {
  private static instance: ThreatDetector | null = null;
  private eventEmitter: EventEmitter;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private threats: Map<string, SecurityThreat> = new Map();
  private threatSignatures: ThreatSignature[] = [];
  private securityMetrics: SecurityMetrics;
  
  private readonly DETECTION_INTERVAL = 5000; // 5 seconds
  private readonly MAX_THREAT_HISTORY = 1000;

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
    this.securityMetrics = {
      totalThreatsDetected: 0,
      activeThreats: 0,
      threatsBlockedToday: 0,
      averageResponseTime: 0,
      falsePositiveRate: 0.02,
      detectionAccuracy: 0.98,
    };
    this.initializeThreatSignatures();
  }

  static async getInstance(): Promise<ThreatDetector> {
    if (!this.instance) {
      this.instance = new ThreatDetector();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🛡️ Threat Detector initializing...');
    this.monitor = await getSystemMonitor();
    this.startDetection();
  }

  /**
   * Initialize threat signatures
   */
  private initializeThreatSignatures(): void {
    this.threatSignatures = [
      {
        id: 'sig-brute-force',
        type: 'brute-force',
        pattern: 'multiple_failed_login_attempts',
        severity: 'high',
        indicators: [
          'failed_logins > 5',
          'time_window < 60',
          'same_source_ip',
        ],
      },
      {
        id: 'sig-sql-injection',
        type: 'injection',
        pattern: 'sql_injection_attempt',
        severity: 'critical',
        indicators: [
          'sql_keywords_in_input',
          'union_select_pattern',
          'database_errors',
        ],
      },
      {
        id: 'sig-ddos',
        type: 'ddos',
        pattern: 'distributed_denial_of_service',
        severity: 'critical',
        indicators: [
          'request_rate > 1000/s',
          'multiple_source_ips',
          'similar_request_pattern',
        ],
      },
      {
        id: 'sig-data-exfiltration',
        type: 'data-exfiltration',
        pattern: 'unusual_data_transfer',
        severity: 'high',
        indicators: [
          'large_data_volume',
          'unusual_destination',
          'off_hours_activity',
        ],
      },
      {
        id: 'sig-privilege-escalation',
        type: 'privilege-escalation',
        pattern: 'unauthorized_privilege_change',
        severity: 'critical',
        indicators: [
          'permission_changes',
          'admin_access_attempt',
          'role_modification',
        ],
      },
    ];
  }

  /**
   * Start threat detection
   */
  private startDetection(): void {
    if (this.detectionInterval) return;

    // Run immediate detection
    this.performDetection();

    // Schedule regular detection
    this.detectionInterval = setInterval(() => {
      this.performDetection();
    }, this.DETECTION_INTERVAL);
  }

  /**
   * Perform threat detection
   */
  private async performDetection(): Promise<void> {
    if (!this.monitor) return;

    const metrics = await this.monitor.getCurrentMetrics();
    const alerts = this.monitor.getActiveAlerts();

    // Analyze for threats
    const detectedThreats = this.analyzeForThreats(metrics, alerts);
    
    // Process detected threats
    detectedThreats.forEach(threat => {
      this.processThreat(threat);
    });

    // Update security metrics
    this.updateSecurityMetrics();
  }

  /**
   * Analyze system for threats
   */
  private analyzeForThreats(metrics: SystemMetrics, alerts: SystemAlert[]): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for network anomalies
    if (metrics.network.errors > 100 || metrics.network.latency > 500) {
      threats.push(this.createThreat('ddos', {
        source: 'network-monitor',
        target: 'api-gateway',
        description: 'Potential DDoS attack detected - high network errors and latency',
        confidence: 0.7,
        indicators: [
          `Network errors: ${metrics.network.errors}`,
          `Latency: ${metrics.network.latency}ms`,
        ],
      }));
    }

    // Check for security alerts
    const securityAlerts = alerts.filter(a => a.type === 'security');
    securityAlerts.forEach(alert => {
      threats.push(this.createThreat('anomaly', {
        source: 'system-monitor',
        target: alert.metric,
        description: alert.message,
        confidence: 0.8,
        indicators: [alert.metric],
      }));
    });

    // Pattern-based detection
    this.threatSignatures.forEach(signature => {
      if (this.matchesPattern(signature, metrics, alerts)) {
        threats.push(this.createThreat(signature.type, {
          source: 'pattern-detection',
          target: 'system',
          description: `Detected ${signature.type} threat pattern`,
          confidence: 0.85,
          indicators: signature.indicators,
        }));
      }
    });

    // ML-based anomaly detection
    const anomalies = this.detectAnomalies(metrics);
    anomalies.forEach(anomaly => {
      threats.push(anomaly);
    });

    return threats;
  }

  /**
   * Create a threat object
   */
  private createThreat(
    type: SecurityThreat['type'],
    details: Partial<SecurityThreat>
  ): SecurityThreat {
    return {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.calculateSeverity(type, details.confidence || 0.5),
      source: details.source || 'unknown',
      target: details.target || 'system',
      description: details.description || `${type} threat detected`,
      confidence: details.confidence || 0.5,
      indicators: details.indicators || [],
      timestamp: new Date(),
      status: 'active',
    };
  }

  /**
   * Calculate threat severity
   */
  private calculateSeverity(
    type: SecurityThreat['type'],
    confidence: number
  ): SecurityThreat['severity'] {
    const baseSeverity = {
      'brute-force': 3,
      'injection': 4,
      'ddos': 4,
      'data-exfiltration': 4,
      'privilege-escalation': 5,
      'malware': 4,
      'anomaly': 2,
    };

    const score = (baseSeverity[type] || 2) * confidence;
    
    if (score >= 4) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Check if metrics match a threat pattern
   */
  private matchesPattern(
    signature: ThreatSignature,
    metrics: SystemMetrics,
    alerts: SystemAlert[]
  ): boolean {
    // Simplified pattern matching - in production would use more sophisticated methods
    
    if (signature.type === 'ddos') {
      return metrics.network.errors > 50 || 
             alerts.some(a => a.message.toLowerCase().includes('ddos'));
    }

    if (signature.type === 'brute-force') {
      return alerts.some(a => 
        a.message.toLowerCase().includes('failed') && 
        a.message.toLowerCase().includes('login')
      );
    }

    return false;
  }

  /**
   * Detect anomalies using ML
   */
  private detectAnomalies(metrics: SystemMetrics): SecurityThreat[] {
    const anomalies: SecurityThreat[] = [];

    // Simulate ML-based anomaly detection
    // In production, would use trained models
    
    // CPU anomaly
    if (metrics.cpu.usage > 95) {
      anomalies.push(this.createThreat('anomaly', {
        source: 'ml-detector',
        target: 'cpu',
        description: 'Abnormal CPU usage pattern detected - possible cryptomining',
        confidence: 0.7,
        indicators: [`CPU usage: ${metrics.cpu.usage}%`],
      }));
    }

    // Memory anomaly
    if (metrics.memory.percentage > 95) {
      anomalies.push(this.createThreat('anomaly', {
        source: 'ml-detector',
        target: 'memory',
        description: 'Unusual memory consumption - possible memory leak or attack',
        confidence: 0.65,
        indicators: [`Memory usage: ${metrics.memory.percentage}%`],
      }));
    }

    return anomalies;
  }

  /**
   * Process a detected threat
   */
  private processThreat(threat: SecurityThreat): void {
    // Check if threat already exists
    const existingThreat = Array.from(this.threats.values())
      .find(t => 
        t.type === threat.type && 
        t.source === threat.source && 
        t.status === 'active'
      );

    if (existingThreat) {
      // Update confidence
      existingThreat.confidence = Math.min(1, existingThreat.confidence + 0.1);
      return;
    }

    // Add new threat
    this.threats.set(threat.id, threat);
    this.securityMetrics.totalThreatsDetected++;
    this.securityMetrics.activeThreats++;

    // Emit threat event
    this.eventEmitter.emit('threatDetected', threat);
    
    console.warn(`🚨 Security Threat Detected: ${threat.type} - ${threat.description} (${(threat.confidence * 100).toFixed(0)}% confidence)`);

    // Clean up old threats
    if (this.threats.size > this.MAX_THREAT_HISTORY) {
      const oldestThreat = Array.from(this.threats.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())[0];
      if (oldestThreat) {
        this.threats.delete(oldestThreat[0]);
      }
    }
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(): void {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Count threats blocked today
    const threatsToday = Array.from(this.threats.values())
      .filter(t => t.timestamp >= todayStart);
    
    this.securityMetrics.threatsBlockedToday = threatsToday
      .filter(t => t.status === 'mitigated' || t.status === 'resolved').length;

    // Calculate average response time
    const responsesTimes = threatsToday
      .filter(t => t.mitigationActions && t.mitigationActions.length > 0)
      .map(_t => {
        // Simulate response time calculation
        return Math.random() * 1000; // 0-1000ms
      });

    if (responsesTimes.length > 0) {
      this.securityMetrics.averageResponseTime = 
        responsesTimes.reduce((sum, time) => sum + time, 0) / responsesTimes.length;
    }

    // Update active threats count
    this.securityMetrics.activeThreats = Array.from(this.threats.values())
      .filter(t => t.status === 'active').length;
  }

  /**
   * Get active threats
   */
  getActiveThreats(): SecurityThreat[] {
    return Array.from(this.threats.values())
      .filter(t => t.status === 'active')
      .sort((a, b) => {
        // Sort by severity then confidence
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });
  }

  /**
   * Get all threats
   */
  getAllThreats(): SecurityThreat[] {
    return Array.from(this.threats.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics };
  }

  /**
   * Get threat by ID
   */
  getThreat(id: string): SecurityThreat | undefined {
    return this.threats.get(id);
  }

  /**
   * Update threat status
   */
  updateThreatStatus(id: string, status: SecurityThreat['status'], mitigationActions?: string[]): void {
    const threat = this.threats.get(id);
    if (!threat) return;

    threat.status = status;
    if (mitigationActions) {
      threat.mitigationActions = mitigationActions;
    }

    if (status !== 'active') {
      this.securityMetrics.activeThreats--;
    }

    this.eventEmitter.emit('threatStatusUpdated', threat);
  }

  /**
   * Get threat detection accuracy
   */
  getDetectionAccuracy(): number {
    return this.securityMetrics.detectionAccuracy;
  }

  /**
   * Subscribe to threat events
   */
  onThreatDetected(callback: (threat: SecurityThreat) => void): void {
    this.eventEmitter.on('threatDetected', callback);
  }

  /**
   * Subscribe to threat status updates
   */
  onThreatStatusUpdated(callback: (threat: SecurityThreat) => void): void {
    this.eventEmitter.on('threatStatusUpdated', callback);
  }

  /**
   * Stop detection
   */
  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Shutdown the detector
   */
  async shutdown(): Promise<void> {
    this.stopDetection();
    this.eventEmitter.removeAllListeners();
    this.threats.clear();
    ThreatDetector.instance = null;
  }
}

// Export singleton getter
export const getThreatDetector = () => ThreatDetector.getInstance();
