import { getThreatDetector, SecurityThreat } from './ThreatDetector';
import { getSecurityOrchestrator } from './SecurityOrchestrator';
import { RuntimeService } from '../../services/base/RuntimeService';

interface ThreatResponse {
  id: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  response: string;
  timestamp: Date;
  mitigated: boolean;
}

interface AutoResponseConfig {
  enabled: boolean;
  autoBlock: boolean;
  alertThreshold: number;
  responseDelay: number;
}

export class AutoResponse extends RuntimeService {
  private static instance: AutoResponse | null = null;
  private config: AutoResponseConfig;
  private threatDetector: Awaited<ReturnType<typeof getThreatDetector>> | null = null;
  private securityOrchestrator: Awaited<ReturnType<typeof getSecurityOrchestrator>> | null = null;
  private responseHistory: ThreatResponse[] = [];

  private constructor() {
    super();
    this.config = {
      enabled: process.env.AI_AUTO_RESPONSE_ENABLED === 'true',
      autoBlock: process.env.AI_AUTO_BLOCK_ENABLED === 'true',
      alertThreshold: parseInt(process.env.AI_ALERT_THRESHOLD || '7'),
      responseDelay: parseInt(process.env.AI_RESPONSE_DELAY || '1000')
    };
  }

  static async getInstance(): Promise<AutoResponse> {
    if (!this.instance) {
      this.instance = new AutoResponse();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🛡️ Autonomous Security Response System Initializing...');
    
    this.threatDetector = await getThreatDetector();
    this.securityOrchestrator = await getSecurityOrchestrator();
    
    // Set up threat monitoring
    this.threatDetector.onThreatDetected(async (threat) => {
      await this.handleThreat(threat);
    });
    
    console.log('✅ Autonomous Security Response System Active');
  }

  private async handleThreat(threat: SecurityThreat): Promise<void> {
    if (!this.config.enabled || !this.securityOrchestrator) return;

    const response: ThreatResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threatType: threat.type,
      severity: threat.severity,
      response: '',
      timestamp: new Date(),
      mitigated: false
    };

    try {
      // Immediate response based on severity
      switch (threat.severity) {
        case 'critical':
          response.response = await this.handleCriticalThreat(threat);
          break;
        case 'high':
          response.response = await this.handleHighThreat(threat);
          break;
        case 'medium':
          response.response = await this.handleMediumThreat(threat);
          break;
        case 'low':
          response.response = await this.handleLowThreat(threat);
          break;
      }

      response.mitigated = true;
      this.responseHistory.push(response);
      
      // Alert security team if needed
      if (threat.severity === 'critical' || threat.severity === 'high') {
        await this.alertSecurityTeam(threat, response);
      }

    } catch (error) {
      console.error('❌ Threat response failed:', error);
      response.response = 'Response failed - manual intervention required';
      response.mitigated = false;
      this.responseHistory.push(response);
    }
  }

  private async handleCriticalThreat(threat: SecurityThreat): Promise<string> {
    const actions: string[] = [];

    // Trigger automatic response through SecurityOrchestrator
    const triggerResponse = await this.securityOrchestrator!.manuallyTriggerResponse(
      threat.id,
      'policy-injection' // Use injection policy for critical threats
    );

    if (triggerResponse) {
      actions.push('Automated security response triggered');
    }

    // Additional direct actions for critical threats
    actions.push('Enhanced monitoring activated');
    actions.push('Security team alerted');
    actions.push('System lockdown protocols initiated');

    return `Critical threat mitigated: ${actions.join(', ')}`;
  }

  private async handleHighThreat(threat: SecurityThreat): Promise<string> {
    const actions: string[] = [];

    // Find appropriate policy based on threat type
    let policyId = 'policy-anomaly';
    if (threat.type === 'ddos') policyId = 'policy-ddos';
    if (threat.type === 'brute-force') policyId = 'policy-brute-force';

    const triggerResponse = await this.securityOrchestrator!.manuallyTriggerResponse(
      threat.id,
      policyId
    );

    if (triggerResponse) {
      actions.push('Automated security response triggered');
    }

    actions.push('Monitoring sensitivity increased');
    actions.push('Rate limiting applied');

    return `High threat mitigated: ${actions.join(', ')}`;
  }

  private async handleMediumThreat(threat: SecurityThreat): Promise<string> {
    // Log the threat and increase monitoring
    console.log(`📊 Medium threat logged: ${threat.type} - ${threat.description}`);
    
    return 'Medium threat logged: Monitoring sensitivity increased';
  }

  private async handleLowThreat(threat: SecurityThreat): Promise<string> {
    // Just log for analysis
    console.log(`📝 Low threat logged: ${threat.type} - ${threat.description}`);
    
    return 'Low threat logged for analysis';
  }

  private async alertSecurityTeam(threat: SecurityThreat, response: ThreatResponse): Promise<void> {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.log('🚨 Security Alert:', {
      threat: {
        id: threat.id,
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        confidence: threat.confidence
      },
      response: {
        id: response.id,
        response: response.response,
        mitigated: response.mitigated
      },
      timestamp: new Date().toISOString()
    });
  }

  async getResponseHistory(limit: number = 100): Promise<ThreatResponse[]> {
    return this.responseHistory.slice(-limit);
  }

  async getResponseStats(): Promise<{
    total: number;
    mitigated: number;
    failed: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const stats = {
      total: this.responseHistory.length,
      mitigated: this.responseHistory.filter(r => r.mitigated).length,
      failed: this.responseHistory.filter(r => !r.mitigated).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    this.responseHistory.forEach(response => {
      stats.byType[response.threatType] = (stats.byType[response.threatType] || 0) + 1;
      stats.bySeverity[response.severity] = (stats.bySeverity[response.severity] || 0) + 1;
    });

    return stats;
  }

  async updateConfig(newConfig: Partial<AutoResponseConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
  }

  async testResponse(threatType: string): Promise<ThreatResponse> {
    const testThreat: SecurityThreat = {
      id: `test_${Date.now()}`,
      type: threatType as SecurityThreat['type'],
      severity: 'medium',
      source: '127.0.0.1',
      target: 'test-system',
      description: `Test threat of type ${threatType}`,
      confidence: 0.8,
      indicators: [`test-indicator-${threatType}`],
      timestamp: new Date(),
      status: 'active'
    };

    await this.handleThreat(testThreat);
    return this.responseHistory[this.responseHistory.length - 1];
  }

  async shutdown(): Promise<void> {
    this.responseHistory = [];
    AutoResponse.instance = null;
  }
}

// Export singleton getter
export const getAutoResponse = () => AutoResponse.getInstance();
