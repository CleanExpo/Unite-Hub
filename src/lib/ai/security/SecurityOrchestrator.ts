/**
 * SecurityOrchestrator - Automated security response orchestration
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 */

import { getThreatDetector, SecurityThreat } from './ThreatDetector';
import { getSystemMonitor } from '../monitoring/SystemMonitor';
import { getFailurePredictor } from '../predictive/FailurePredictor';
import { RuntimeService } from '../../services/base/RuntimeService';
import { EventEmitter } from 'events';

export interface SecurityResponse {
  id: string;
  threatId: string;
  actions: SecurityAction[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: {
    success: boolean;
    message: string;
    mitigationEffectiveness: number; // 0-1
  };
}

export interface SecurityAction {
  id: string;
  type: 'block-ip' | 'rate-limit' | 'isolate-service' | 'scale-resources' | 'alert-team' | 'rollback' | 'patch';
  target: string;
  parameters: Record<string, string | number | boolean | undefined>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  executed: boolean;
  result?: {
    success: boolean;
    message: string;
  };
}

export interface SecurityPolicy {
  id: string;
  name: string;
  threatType: SecurityThreat['type'];
  severityThreshold: SecurityThreat['severity'];
  confidenceThreshold: number;
  automaticResponse: boolean;
  actions: Omit<SecurityAction, 'id' | 'executed' | 'result'>[];
}

export class SecurityOrchestrator extends RuntimeService {
  private static instance: SecurityOrchestrator | null = null;
  private eventEmitter: EventEmitter;
  private detector: Awaited<ReturnType<typeof getThreatDetector>> | null = null;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private predictor: Awaited<ReturnType<typeof getFailurePredictor>> | null = null;
  private activeResponses: Map<string, SecurityResponse> = new Map();
  private securityPolicies: SecurityPolicy[] = [];
  
  private readonly RESPONSE_CHECK_INTERVAL = 10000; // 10 seconds
  private responseCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
    this.initializeSecurityPolicies();
  }

  static async getInstance(): Promise<SecurityOrchestrator> {
    if (!this.instance) {
      this.instance = new SecurityOrchestrator();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🎯 Security Orchestrator initializing...');
    this.detector = await getThreatDetector();
    this.monitor = await getSystemMonitor();
    this.predictor = await getFailurePredictor();
    
    // Subscribe to threat events
    this.detector.onThreatDetected(threat => this.handleThreatDetected(threat));
    
    this.startResponseMonitoring();
  }

  /**
   * Initialize security policies
   */
  private initializeSecurityPolicies(): void {
    this.securityPolicies = [
      {
        id: 'policy-ddos',
        name: 'DDoS Protection',
        threatType: 'ddos',
        severityThreshold: 'high',
        confidenceThreshold: 0.7,
        automaticResponse: true,
        actions: [
          {
            type: 'rate-limit',
            target: 'api-gateway',
            parameters: { limit: 100, window: 60 },
            priority: 'critical',
            automated: true,
          },
          {
            type: 'scale-resources',
            target: 'load-balancer',
            parameters: { instances: 5 },
            priority: 'high',
            automated: true,
          },
          {
            type: 'alert-team',
            target: 'security-team',
            parameters: { channel: 'security-critical' },
            priority: 'high',
            automated: true,
          },
        ],
      },
      {
        id: 'policy-injection',
        name: 'Injection Attack Prevention',
        threatType: 'injection',
        severityThreshold: 'critical',
        confidenceThreshold: 0.8,
        automaticResponse: true,
        actions: [
          {
            type: 'block-ip',
            target: 'firewall',
            parameters: { duration: 3600 },
            priority: 'critical',
            automated: true,
          },
          {
            type: 'isolate-service',
            target: 'affected-service',
            parameters: {},
            priority: 'critical',
            automated: true,
          },
          {
            type: 'rollback',
            target: 'application',
            parameters: { version: 'last-safe' },
            priority: 'high',
            automated: false,
          },
        ],
      },
      {
        id: 'policy-brute-force',
        name: 'Brute Force Protection',
        threatType: 'brute-force',
        severityThreshold: 'high',
        confidenceThreshold: 0.75,
        automaticResponse: true,
        actions: [
          {
            type: 'block-ip',
            target: 'auth-service',
            parameters: { duration: 7200 },
            priority: 'high',
            automated: true,
          },
          {
            type: 'rate-limit',
            target: 'login-endpoint',
            parameters: { limit: 3, window: 300 },
            priority: 'high',
            automated: true,
          },
        ],
      },
      {
        id: 'policy-anomaly',
        name: 'Anomaly Response',
        threatType: 'anomaly',
        severityThreshold: 'medium',
        confidenceThreshold: 0.6,
        automaticResponse: false,
        actions: [
          {
            type: 'alert-team',
            target: 'ops-team',
            parameters: { channel: 'anomaly-detection' },
            priority: 'medium',
            automated: true,
          },
        ],
      },
    ];
  }

  /**
   * Start response monitoring
   */
  private startResponseMonitoring(): void {
    if (this.responseCheckInterval) return;

    this.responseCheckInterval = setInterval(() => {
      this.checkActiveResponses();
    }, this.RESPONSE_CHECK_INTERVAL);
  }

  /**
   * Handle detected threat
   */
  private async handleThreatDetected(threat: SecurityThreat): Promise<void> {
    console.log(`🔍 Evaluating response for threat: ${threat.id} (${threat.type})`);

    // Find matching policy
    const policy = this.findMatchingPolicy(threat);
    if (!policy) {
      console.log(`No matching policy for threat type: ${threat.type}`);
      return;
    }

    // Check if response should be automated
    if (!policy.automaticResponse || threat.confidence < policy.confidenceThreshold) {
      console.log(`Manual review required for threat: ${threat.id}`);
      this.eventEmitter.emit('manualReviewRequired', { threat, policy });
      return;
    }

    // Create and execute response
    const response = this.createResponse(threat, policy);
    await this.executeResponse(response);
  }

  /**
   * Find matching security policy
   */
  private findMatchingPolicy(threat: SecurityThreat): SecurityPolicy | undefined {
    return this.securityPolicies.find(policy => {
      const typeMatch = policy.threatType === threat.type;
      const severityMatch = this.compareSeverity(threat.severity, policy.severityThreshold) >= 0;
      const confidenceMatch = threat.confidence >= policy.confidenceThreshold;
      
      return typeMatch && severityMatch && confidenceMatch;
    });
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(
    severity1: SecurityThreat['severity'],
    severity2: SecurityThreat['severity']
  ): number {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityOrder[severity1] - severityOrder[severity2];
  }

  /**
   * Create security response
   */
  private createResponse(threat: SecurityThreat, policy: SecurityPolicy): SecurityResponse {
    const actions: SecurityAction[] = policy.actions.map(action => ({
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executed: false,
    }));

    const response: SecurityResponse = {
      id: `response-${Date.now()}`,
      threatId: threat.id,
      actions,
      status: 'pending',
      startTime: new Date(),
    };

    this.activeResponses.set(response.id, response);
    return response;
  }

  /**
   * Execute security response
   */
  private async executeResponse(response: SecurityResponse): Promise<void> {
    console.log(`🚀 Executing security response: ${response.id}`);
    response.status = 'executing';
    
    let successCount = 0;
    const totalActions = response.actions.length;

    // Sort actions by priority
    const sortedActions = [...response.actions].sort((a, b) => {
      const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Execute actions
    for (const action of sortedActions) {
      if (action.automated) {
        const result = await this.executeAction(action);
        action.executed = true;
        action.result = result;
        
        if (result.success) {
          successCount++;
        }
        
        console.log(`  ${result.success ? '✅' : '❌'} ${action.type} on ${action.target}: ${result.message}`);
      } else {
        console.log(`  ⚠️ Manual action required: ${action.type} on ${action.target}`);
        this.eventEmitter.emit('manualActionRequired', { response, action });
      }
    }

    // Update response status
    response.endTime = new Date();
    response.status = successCount === totalActions ? 'completed' : 'failed';
    response.result = {
      success: successCount > totalActions / 2,
      message: `Executed ${successCount}/${totalActions} actions successfully`,
      mitigationEffectiveness: successCount / totalActions,
    };

    // Update threat status if mitigated
    if (response.result.success && this.detector) {
      this.detector.updateThreatStatus(
        response.threatId,
        'mitigated',
        response.actions.map(a => `${a.type}: ${a.result?.message || 'pending'}`)
      );
    }

    this.eventEmitter.emit('responseCompleted', response);
  }

  /**
   * Execute a single security action
   */
  private async executeAction(action: SecurityAction): Promise<{ success: boolean; message: string }> {
    // Simulate action execution
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, would integrate with actual security infrastructure
    switch (action.type) {
      case 'block-ip':
        return {
          success: true,
          message: `Blocked IP for ${action.parameters.duration}s`,
        };

      case 'rate-limit':
        return {
          success: true,
          message: `Applied rate limit: ${action.parameters.limit} requests per ${action.parameters.window}s`,
        };

      case 'isolate-service':
        return {
          success: true,
          message: `Service ${action.target} isolated from network`,
        };

      case 'scale-resources':
        return {
          success: true,
          message: `Scaled ${action.target} to ${action.parameters.instances} instances`,
        };

      case 'alert-team':
        return {
          success: true,
          message: `Alert sent to ${action.target} via ${action.parameters.channel}`,
        };

      case 'rollback':
        return {
          success: Math.random() > 0.2, // 80% success rate for rollbacks
          message: `Rollback to version ${action.parameters.version}`,
        };

      case 'patch':
        return {
          success: Math.random() > 0.1, // 90% success rate for patches
          message: `Security patch applied`,
        };

      default:
        return {
          success: false,
          message: `Unknown action type: ${action.type}`,
        };
    }
  }

  /**
   * Check active responses
   */
  private checkActiveResponses(): void {
    const now = Date.now();
    
    this.activeResponses.forEach((response, id) => {
      if (response.status === 'executing') {
        const duration = now - response.startTime.getTime();
        
        // Timeout after 5 minutes
        if (duration > 300000) {
          response.status = 'failed';
          response.result = {
            success: false,
            message: 'Response timeout',
            mitigationEffectiveness: 0,
          };
          
          console.error(`Response ${id} timed out`);
          this.eventEmitter.emit('responseTimeout', response);
        }
      }
    });

    // Clean up old responses
    const oldResponses = Array.from(this.activeResponses.entries())
      .filter(([_, response]) => {
        const age = now - response.startTime.getTime();
        return response.status !== 'executing' && age > 3600000; // 1 hour
      });

    oldResponses.forEach(([id]) => this.activeResponses.delete(id));
  }

  /**
   * Get active responses
   */
  getActiveResponses(): SecurityResponse[] {
    return Array.from(this.activeResponses.values())
      .filter(r => r.status === 'executing' || r.status === 'pending');
  }

  /**
   * Get all responses
   */
  getAllResponses(): SecurityResponse[] {
    return Array.from(this.activeResponses.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Get response by ID
   */
  getResponse(id: string): SecurityResponse | undefined {
    return this.activeResponses.get(id);
  }

  /**
   * Add security policy
   */
  addSecurityPolicy(policy: SecurityPolicy): void {
    this.securityPolicies.push(policy);
    this.eventEmitter.emit('policyAdded', policy);
  }

  /**
   * Update security policy
   */
  updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>): void {
    const index = this.securityPolicies.findIndex(p => p.id === id);
    if (index !== -1) {
      this.securityPolicies[index] = { ...this.securityPolicies[index], ...updates };
      this.eventEmitter.emit('policyUpdated', this.securityPolicies[index]);
    }
  }

  /**
   * Get security policies
   */
  getSecurityPolicies(): SecurityPolicy[] {
    return [...this.securityPolicies];
  }

  /**
   * Manually trigger response
   */
  async manuallyTriggerResponse(threatId: string, policyId: string): Promise<SecurityResponse | null> {
    if (!this.detector) return null;

    const threat = this.detector.getThreat(threatId);
    const policy = this.securityPolicies.find(p => p.id === policyId);

    if (!threat || !policy) return null;

    const response = this.createResponse(threat, policy);
    await this.executeResponse(response);
    return response;
  }

  /**
   * Subscribe to events
   */
  onManualReviewRequired(callback: (data: { threat: SecurityThreat; policy: SecurityPolicy }) => void): void {
    this.eventEmitter.on('manualReviewRequired', callback);
  }

  onManualActionRequired(callback: (data: { response: SecurityResponse; action: SecurityAction }) => void): void {
    this.eventEmitter.on('manualActionRequired', callback);
  }

  onResponseCompleted(callback: (response: SecurityResponse) => void): void {
    this.eventEmitter.on('responseCompleted', callback);
  }

  /**
   * Stop orchestrator
   */
  stopOrchestrator(): void {
    if (this.responseCheckInterval) {
      clearInterval(this.responseCheckInterval);
      this.responseCheckInterval = null;
    }
  }

  /**
   * Shutdown the orchestrator
   */
  async shutdown(): Promise<void> {
    this.stopOrchestrator();
    this.eventEmitter.removeAllListeners();
    this.activeResponses.clear();
    SecurityOrchestrator.instance = null;
  }
}

// Export singleton getter
export const getSecurityOrchestrator = () => SecurityOrchestrator.getInstance();
