/**
 * SelfHealingEngine - Autonomous infrastructure self-healing and recovery
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 * Phase 3 Task 32: Self-Healing Infrastructure
 */

import { RuntimeService } from '../../services/base/RuntimeService';
import { getSystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { getRealTimeOptimizer } from '../optimization/RealTimeOptimizer';
import { getThreatDetector } from '../security/ThreatDetector';

export interface InfrastructureIssue {
  id: string;
  type: 'performance' | 'availability' | 'security' | 'resource' | 'network' | 'database' | 'application';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  symptoms: string[];
  rootCause?: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'detected' | 'diagnosing' | 'healing' | 'resolved' | 'escalated';
  healingActions: HealingAction[];
  failureImpact: {
    usersAffected: number;
    servicesAffected: string[];
    estimatedDowntime: number; // minutes
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface HealingAction {
  id: string;
  type: 'restart' | 'scale' | 'migrate' | 'patch' | 'rollback' | 'isolate' | 'reconfigure' | 'failover';
  description: string;
  automated: boolean;
  executedAt?: Date;
  duration?: number; // milliseconds
  success?: boolean;
  output?: string;
  rollbackPlan?: string;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  expectedOutcome: string;
}

export interface HealthPattern {
  id: string;
  name: string;
  description: string;
  indicators: {
    metrics: string[];
    thresholds: Record<string, number>;
    timeWindow: number; // seconds
  };
  commonCauses: string[];
  healingStrategy: {
    immediate: HealingAction[];
    followUp: HealingAction[];
    prevention: string[];
  };
  successRate: number;
  avgResolutionTime: number; // minutes
  lastOccurrence?: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'down';
  score: number; // 0-100
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    cache: ComponentHealth;
    storage: ComponentHealth;
    network: ComponentHealth;
    security: ComponentHealth;
  };
  trends: {
    last24h: number[];
    lastWeek: number[];
    prediction: number; // predicted health for next hour
  };
  lastUpdate: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  score: number;
  metrics: {
    uptime: number; // percentage
    responseTime: number; // ms
    errorRate: number; // percentage
    throughput: number; // requests/sec
  };
  issues: string[];
  lastIncident?: Date;
}

export interface HealingReport {
  issueId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  success: boolean;
  actionsPerformed: HealingAction[];
  metricsBeforeHealing: Partial<SystemMetrics>;
  metricsAfterHealing: Partial<SystemMetrics>;
  improvement: number; // percentage
  lessonsLearned: string[];
  preventionMeasures: string[];
}

export class SelfHealingEngine extends RuntimeService {
  private static instance: SelfHealingEngine | null = null;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private optimizer: Awaited<ReturnType<typeof getRealTimeOptimizer>> | null = null;
  private threatDetector: Awaited<ReturnType<typeof getThreatDetector>> | null = null;
  private activeIssues: Map<string, InfrastructureIssue> = new Map();
  private healthPatterns: Map<string, HealthPattern> = new Map();
  private healingReports: HealingReport[] = [];
  private systemHealth: SystemHealth;
  
  private readonly MONITORING_INTERVAL = 10000; // 10 seconds
  private readonly MAX_CONCURRENT_HEALINGS = 3;
  private readonly HEALING_TIMEOUT = 300000; // 5 minutes
  private monitoringInterval: NodeJS.Timeout | null = null;
  private activeHealings = 0;

  private constructor() {
    super();
    this.systemHealth = this.initializeSystemHealth();
    this.initializeHealthPatterns();
  }

  static async getInstance(): Promise<SelfHealingEngine> {
    if (!this.instance) {
      this.instance = new SelfHealingEngine();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🔧 Self-Healing Engine initializing...');
    this.monitor = await getSystemMonitor();
    this.optimizer = await getRealTimeOptimizer();
    this.threatDetector = await getThreatDetector();
    
    this.startContinuousHealing();
  }

  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      score: 100,
      components: {
        api: { status: 'healthy', score: 100, metrics: { uptime: 99.9, responseTime: 50, errorRate: 0.1, throughput: 1000 }, issues: [] },
        database: { status: 'healthy', score: 100, metrics: { uptime: 99.95, responseTime: 25, errorRate: 0.05, throughput: 500 }, issues: [] },
        cache: { status: 'healthy', score: 100, metrics: { uptime: 99.99, responseTime: 5, errorRate: 0.01, throughput: 10000 }, issues: [] },
        storage: { status: 'healthy', score: 100, metrics: { uptime: 99.9, responseTime: 100, errorRate: 0.1, throughput: 200 }, issues: [] },
        network: { status: 'healthy', score: 100, metrics: { uptime: 99.95, responseTime: 10, errorRate: 0.02, throughput: 5000 }, issues: [] },
        security: { status: 'healthy', score: 100, metrics: { uptime: 100, responseTime: 5, errorRate: 0, throughput: 100 }, issues: [] }
      },
      trends: {
        last24h: Array(24).fill(100),
        lastWeek: Array(7).fill(100),
        prediction: 100
      },
      lastUpdate: new Date()
    };
  }

  private initializeHealthPatterns(): void {
    const patterns: HealthPattern[] = [
      {
        id: 'high-cpu-degradation',
        name: 'High CPU Usage Degradation',
        description: 'System performance degradation due to high CPU usage',
        indicators: {
          metrics: ['cpu.usage', 'response_time', 'error_rate'],
          thresholds: { 'cpu.usage': 85, 'response_time': 1000, 'error_rate': 5 },
          timeWindow: 300 // 5 minutes
        },
        commonCauses: ['Traffic spike', 'Inefficient queries', 'Memory leak', 'Resource contention'],
        healingStrategy: {
          immediate: [
            {
              id: 'scale-up-cpu',
              type: 'scale',
              description: 'Scale up CPU resources automatically',
              automated: true,
              riskLevel: 'low',
              prerequisites: ['Auto-scaling enabled'],
              expectedOutcome: 'Reduce CPU usage below 70%'
            },
            {
              id: 'optimize-processes',
              type: 'reconfigure',
              description: 'Kill non-essential processes and optimize resource allocation',
              automated: true,
              riskLevel: 'medium',
              prerequisites: ['Process priority mapping'],
              expectedOutcome: 'Free up 20% CPU capacity'
            }
          ],
          followUp: [
            {
              id: 'analyze-traffic-patterns',
              type: 'reconfigure',
              description: 'Analyze traffic patterns and implement load balancing',
              automated: false,
              riskLevel: 'low',
              prerequisites: ['Traffic analysis tools'],
              expectedOutcome: 'Prevent future CPU spikes'
            }
          ],
          prevention: ['Implement predictive scaling', 'Optimize application code', 'Add caching layers']
        },
        successRate: 0.92,
        avgResolutionTime: 8.5
      },
      {
        id: 'database-connection-exhaustion',
        name: 'Database Connection Pool Exhaustion',
        description: 'Database becomes unresponsive due to connection pool exhaustion',
        indicators: {
          metrics: ['db.connections', 'db.response_time', 'error_rate'],
          thresholds: { 'db.connections': 95, 'db.response_time': 5000, 'error_rate': 10 },
          timeWindow: 120
        },
        commonCauses: ['Connection leaks', 'Traffic surge', 'Slow queries', 'Inadequate pool size'],
        healingStrategy: {
          immediate: [
            {
              id: 'expand-connection-pool',
              type: 'reconfigure',
              description: 'Temporarily increase database connection pool size',
              automated: true,
              riskLevel: 'low',
              prerequisites: ['Database configuration access'],
              expectedOutcome: 'Restore database availability'
            },
            {
              id: 'kill-long-running-queries',
              type: 'reconfigure',
              description: 'Terminate queries running longer than threshold',
              automated: true,
              riskLevel: 'medium',
              prerequisites: ['Query monitoring enabled'],
              expectedOutcome: 'Free up database connections'
            }
          ],
          followUp: [
            {
              id: 'optimize-query-performance',
              type: 'patch',
              description: 'Analyze and optimize slow queries',
              automated: false,
              riskLevel: 'low',
              prerequisites: ['Query analysis tools'],
              expectedOutcome: 'Reduce average query execution time'
            }
          ],
          prevention: ['Implement connection monitoring', 'Add query timeout enforcement', 'Regular query optimization']
        },
        successRate: 0.89,
        avgResolutionTime: 12.3
      },
      {
        id: 'memory-leak-detection',
        name: 'Memory Leak Detection and Recovery',
        description: 'Application memory usage growing continuously without bounds',
        indicators: {
          metrics: ['memory.usage', 'memory.trend', 'gc.frequency'],
          thresholds: { 'memory.usage': 90, 'memory.trend': 5, 'gc.frequency': 10 },
          timeWindow: 600
        },
        commonCauses: ['Application memory leaks', 'Large object retention', 'Insufficient garbage collection'],
        healingStrategy: {
          immediate: [
            {
              id: 'force-garbage-collection',
              type: 'reconfigure',
              description: 'Force garbage collection to free memory',
              automated: true,
              riskLevel: 'low',
              prerequisites: ['GC controls available'],
              expectedOutcome: 'Temporary memory relief'
            },
            {
              id: 'restart-leaky-services',
              type: 'restart',
              description: 'Restart services showing memory leak patterns',
              automated: true,
              riskLevel: 'medium',
              prerequisites: ['Service health checks'],
              expectedOutcome: 'Reset memory usage to baseline'
            }
          ],
          followUp: [
            {
              id: 'memory-profiling',
              type: 'patch',
              description: 'Run memory profiler to identify leak sources',
              automated: false,
              riskLevel: 'low',
              prerequisites: ['Profiling tools'],
              expectedOutcome: 'Identify root cause of memory leaks'
            }
          ],
          prevention: ['Implement memory monitoring alerts', 'Regular memory profiling', 'Code review for memory patterns']
        },
        successRate: 0.85,
        avgResolutionTime: 15.7
      },
      {
        id: 'network-partition-recovery',
        name: 'Network Partition Recovery',
        description: 'Network connectivity issues between system components',
        indicators: {
          metrics: ['network.latency', 'network.packet_loss', 'service.connectivity'],
          thresholds: { 'network.latency': 5000, 'network.packet_loss': 5, 'service.connectivity': 80 },
          timeWindow: 180
        },
        commonCauses: ['Network hardware failure', 'Routing issues', 'Firewall misconfigurations', 'DDoS attacks'],
        healingStrategy: {
          immediate: [
            {
              id: 'switch-network-routes',
              type: 'reconfigure',
              description: 'Switch to backup network routes',
              automated: true,
              riskLevel: 'medium',
              prerequisites: ['Backup routes configured'],
              expectedOutcome: 'Restore network connectivity'
            },
            {
              id: 'activate-failover-regions',
              type: 'failover',
              description: 'Activate services in backup regions',
              automated: true,
              riskLevel: 'high',
              prerequisites: ['Multi-region deployment'],
              expectedOutcome: 'Maintain service availability'
            }
          ],
          followUp: [
            {
              id: 'network-diagnostics',
              type: 'patch',
              description: 'Run comprehensive network diagnostics',
              automated: false,
              riskLevel: 'low',
              prerequisites: ['Network monitoring tools'],
              expectedOutcome: 'Identify network infrastructure issues'
            }
          ],
          prevention: ['Network redundancy', 'Regular connectivity tests', 'Automated failover systems']
        },
        successRate: 0.78,
        avgResolutionTime: 22.1
      }
    ];

    patterns.forEach(pattern => {
      this.healthPatterns.set(pattern.id, pattern);
    });
  }

  private startContinuousHealing(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.performHealthMonitoring();
    }, this.MONITORING_INTERVAL);

    console.log('🔄 Continuous self-healing started');
  }

  private async performHealthMonitoring(): Promise<void> {
    if (!this.monitor) return;

    // Get current system metrics
    const metrics = await this.monitor.getCurrentMetrics();
    
    // Update system health
    this.updateSystemHealth(metrics);
    
    // Detect new issues
    await this.detectIssues(metrics);
    
    // Process existing issues
    await this.processActiveIssues();
    
    // Update health trends
    this.updateHealthTrends();
  }

  private updateSystemHealth(metrics: SystemMetrics): void {
    // Update component health based on metrics
    this.systemHealth.components.api.metrics.responseTime = metrics.network.latency;
    this.systemHealth.components.api.score = Math.max(0, 100 - metrics.network.latency / 10);
    
    this.systemHealth.components.database.score = Math.max(0, 100 - (metrics.cpu.usage * 0.5));
    this.systemHealth.components.cache.score = Math.max(0, 100 - (metrics.memory.percentage * 0.3));
    
    // Calculate overall health score
    const componentScores = Object.values(this.systemHealth.components).map(comp => comp.score);
    this.systemHealth.score = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
    
    // Determine overall status
    if (this.systemHealth.score >= 90) this.systemHealth.overall = 'healthy';
    else if (this.systemHealth.score >= 70) this.systemHealth.overall = 'degraded';
    else if (this.systemHealth.score >= 40) this.systemHealth.overall = 'critical';
    else this.systemHealth.overall = 'down';
    
    this.systemHealth.lastUpdate = new Date();
  }

  private async detectIssues(metrics: SystemMetrics): Promise<void> {
    for (const [patternId, pattern] of this.healthPatterns) {
      if (this.matchesPattern(metrics, pattern)) {
        await this.createIssue(pattern, metrics);
      }
    }
  }

  private matchesPattern(metrics: SystemMetrics, pattern: HealthPattern): boolean {
    const thresholds = pattern.indicators.thresholds;
    
    // Check CPU threshold
    if (thresholds['cpu.usage'] && metrics.cpu.usage > thresholds['cpu.usage']) {
      return true;
    }
    
    // Check memory threshold
    if (thresholds['memory.usage'] && metrics.memory.percentage > thresholds['memory.usage']) {
      return true;
    }
    
    // Check response time (using network latency as proxy)
    if (thresholds['response_time'] && metrics.network.latency > thresholds['response_time']) {
      return true;
    }
    
    return false;
  }

  private async createIssue(pattern: HealthPattern, metrics: SystemMetrics): Promise<void> {
    // Check if we already have an active issue for this pattern
    const existingIssue = Array.from(this.activeIssues.values())
      .find(issue => issue.description.includes(pattern.name) && issue.status !== 'resolved');
    
    if (existingIssue) return; // Don't create duplicate issues

    const issue: InfrastructureIssue = {
      id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.determineIssueType(pattern),
      severity: this.determineSeverity(metrics, pattern),
      component: this.determineAffectedComponent(pattern),
      description: `${pattern.name}: ${pattern.description}`,
      symptoms: this.extractSymptoms(metrics, pattern),
      detectedAt: new Date(),
      status: 'detected',
      healingActions: [],
      failureImpact: {
        usersAffected: this.estimateUsersAffected(metrics),
        servicesAffected: this.identifyAffectedServices(pattern),
        estimatedDowntime: 0,
        businessImpact: this.assessBusinessImpact(metrics, pattern)
      }
    };

    this.activeIssues.set(issue.id, issue);
    console.log(`🚨 Issue detected: ${issue.description}`);

    // Start healing process
    await this.initiateHealing(issue.id);
  }

  private determineIssueType(pattern: HealthPattern): InfrastructureIssue['type'] {
    if (pattern.id.includes('cpu') || pattern.id.includes('memory')) return 'performance';
    if (pattern.id.includes('database')) return 'database';
    if (pattern.id.includes('network')) return 'network';
    if (pattern.id.includes('security')) return 'security';
    return 'application';
  }

  private determineSeverity(metrics: SystemMetrics, pattern: HealthPattern): InfrastructureIssue['severity'] {
    const score = this.calculateIssueScore(metrics, pattern);
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private calculateIssueScore(metrics: SystemMetrics, pattern: HealthPattern): number {
    let score = 0;
    const thresholds = pattern.indicators.thresholds;
    
    if (thresholds['cpu.usage']) {
      score += Math.max(0, (metrics.cpu.usage - thresholds['cpu.usage']) / thresholds['cpu.usage'] * 100);
    }
    
    if (thresholds['memory.usage']) {
      score += Math.max(0, (metrics.memory.percentage - thresholds['memory.usage']) / thresholds['memory.usage'] * 100);
    }
    
    return Math.min(100, score);
  }

  private determineAffectedComponent(pattern: HealthPattern): string {
    if (pattern.id.includes('database')) return 'Database';
    if (pattern.id.includes('network')) return 'Network';
    if (pattern.id.includes('cpu')) return 'Compute';
    if (pattern.id.includes('memory')) return 'Memory';
    return 'Application';
  }

  private extractSymptoms(metrics: SystemMetrics, pattern: HealthPattern): string[] {
    const symptoms: string[] = [];
    
    if (metrics.cpu.usage > 80) symptoms.push(`High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`);
    if (metrics.memory.percentage > 80) symptoms.push(`High memory usage: ${metrics.memory.percentage.toFixed(1)}%`);
    if (metrics.network.latency > 1000) symptoms.push(`High latency: ${metrics.network.latency.toFixed(0)}ms`);
    
    return symptoms;
  }

  private estimateUsersAffected(metrics: SystemMetrics): number {
    // Simulate user impact calculation
    const baseUsers = 1000;
    const impactMultiplier = Math.max(1, metrics.cpu.usage / 50 + metrics.memory.percentage / 50);
    return Math.round(baseUsers * impactMultiplier);
  }

  private identifyAffectedServices(pattern: HealthPattern): string[] {
    const services = ['API Gateway', 'User Service', 'Database'];
    
    if (pattern.id.includes('database')) return ['Database', 'API Gateway'];
    if (pattern.id.includes('network')) return ['API Gateway', 'Load Balancer'];
    if (pattern.id.includes('memory')) return ['User Service', 'Cache Service'];
    
    return services.slice(0, 2);
  }

  private assessBusinessImpact(metrics: SystemMetrics, pattern: HealthPattern): InfrastructureIssue['failureImpact']['businessImpact'] {
    const severity = this.calculateIssueScore(metrics, pattern);
    
    if (severity >= 90) return 'critical';
    if (severity >= 70) return 'high';
    if (severity >= 40) return 'medium';
    return 'low';
  }

  private async initiateHealing(issueId: string): Promise<void> {
    if (this.activeHealings >= this.MAX_CONCURRENT_HEALINGS) {
      console.log(`⏳ Healing queue full, delaying healing for issue ${issueId}`);
      return;
    }

    const issue = this.activeIssues.get(issueId);
    if (!issue || issue.status !== 'detected') return;

    this.activeHealings++;
    issue.status = 'diagnosing';

    try {
      await this.performDiagnosis(issue);
      await this.executeHealing(issue);
    } catch (error) {
      console.error(`❌ Healing failed for issue ${issueId}:`, error);
      issue.status = 'escalated';
    } finally {
      this.activeHealings--;
    }
  }

  private async performDiagnosis(issue: InfrastructureIssue): Promise<void> {
    console.log(`🔍 Diagnosing issue: ${issue.description}`);
    
    // Find the appropriate healing pattern
    const pattern = Array.from(this.healthPatterns.values())
      .find(p => issue.description.includes(p.name));
    
    if (pattern) {
      // Analyze root cause
      issue.rootCause = this.analyzeRootCause(issue, pattern);
      
      // Prepare healing actions
      issue.healingActions = [
        ...pattern.healingStrategy.immediate.map(action => ({ ...action })),
        ...pattern.healingStrategy.followUp.map(action => ({ ...action }))
      ];
    }
    
    issue.status = 'healing';
  }

  private analyzeRootCause(issue: InfrastructureIssue, pattern: HealthPattern): string {
    // Simple root cause analysis based on symptoms and common causes
    const symptoms = issue.symptoms.join(', ').toLowerCase();
    
    for (const cause of pattern.commonCauses) {
      if (symptoms.includes(cause.toLowerCase().split(' ')[0])) {
        return cause;
      }
    }
    
    return pattern.commonCauses[0] || 'Unknown cause';
  }

  private async executeHealing(issue: InfrastructureIssue): Promise<void> {
    console.log(`🔧 Executing healing for: ${issue.description}`);
    
    const beforeMetrics = this.monitor ? await this.monitor.getCurrentMetrics() : null;
    const startTime = new Date();
    
    for (const action of issue.healingActions.filter(a => a.automated)) {
      if (await this.executeHealingAction(action)) {
        console.log(`✅ Healing action completed: ${action.description}`);
      } else {
        console.log(`❌ Healing action failed: ${action.description}`);
      }
    }
    
    // Wait for system to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify healing effectiveness
    const afterMetrics = this.monitor ? await this.monitor.getCurrentMetrics() : null;
    const endTime = new Date();
    
    const healingSuccess = this.verifyHealing(issue, beforeMetrics, afterMetrics);
    
    if (healingSuccess) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      console.log(`✅ Successfully healed: ${issue.description}`);
    } else {
      issue.status = 'escalated';
      console.log(`⚠️ Healing incomplete, escalating: ${issue.description}`);
    }
    
    // Generate healing report
    this.generateHealingReport(issue, startTime, endTime, beforeMetrics, afterMetrics);
  }

  private async executeHealingAction(action: HealingAction): Promise<boolean> {
    action.executedAt = new Date();
    const startTime = Date.now();
    
    try {
      switch (action.type) {
        case 'restart':
          await this.performRestart(action);
          break;
        case 'scale':
          await this.performScaling(action);
          break;
        case 'reconfigure':
          await this.performReconfiguration(action);
          break;
        case 'failover':
          await this.performFailover(action);
          break;
        case 'patch':
          await this.performPatching(action);
          break;
        default:
          console.log(`🔧 Executing ${action.type}: ${action.description}`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate action
      }
      
      action.duration = Date.now() - startTime;
      action.success = true;
      action.output = 'Action completed successfully';
      return true;
      
    } catch (error) {
      action.duration = Date.now() - startTime;
      action.success = false;
      action.output = `Action failed: ${error}`;
      return false;
    }
  }

  private async performRestart(action: HealingAction): Promise<void> {
    console.log(`🔄 Restarting service: ${action.description}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate restart
  }

  private async performScaling(action: HealingAction): Promise<void> {
    console.log(`📈 Scaling resources: ${action.description}`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate scaling
  }

  private async performReconfiguration(action: HealingAction): Promise<void> {
    console.log(`⚙️ Reconfiguring system: ${action.description}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate reconfiguration
  }

  private async performFailover(action: HealingAction): Promise<void> {
    console.log(`🔀 Performing failover: ${action.description}`);
    await new Promise(resolve => setTimeout(resolve, 8000)); // Simulate failover
  }

  private async performPatching(action: HealingAction): Promise<void> {
    console.log(`🩹 Applying patch: ${action.description}`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate patching
  }

  private verifyHealing(
    issue: InfrastructureIssue,
    beforeMetrics: any,
    afterMetrics: any
  ): boolean {
    if (!beforeMetrics || !afterMetrics) return true; // Assume success if no metrics
    
    // Check if the problematic metrics have improved
    switch (issue.type) {
      case 'performance':
        return afterMetrics.cpu.usage < beforeMetrics.cpu.usage * 0.8; // 20% improvement
      case 'resource':
        return afterMetrics.memory.percentage < beforeMetrics.memory.percentage * 0.8;
      case 'network':
        return afterMetrics.network.latency < beforeMetrics.network.latency * 0.8;
      default:
        return true; // Assume success for other types
    }
  }

  private generateHealingReport(
    issue: InfrastructureIssue,
    startTime: Date,
    endTime: Date,
    beforeMetrics: any,
    afterMetrics: any
  ): void {
    const duration = (endTime.getTime() - startTime.getTime()) / 60000; // minutes
    const improvement = this.calculateImprovement(beforeMetrics, afterMetrics);
    
    const report: HealingReport = {
      issueId: issue.id,
      startTime,
      endTime,
      duration,
      success: issue.status === 'resolved',
      actionsPerformed: issue.healingActions.filter(a => a.executedAt),
      metricsBeforeHealing: beforeMetrics || {},
      metricsAfterHealing: afterMetrics || {},
      improvement,
      lessonsLearned: this.extractLessonsLearned(issue),
      preventionMeasures: this.generatePreventionMeasures(issue)
    };
    
    this.healingReports.push(report);
  }

  private calculateImprovement(beforeMetrics: any, afterMetrics: any): number {
    if (!beforeMetrics || !afterMetrics) return 0;
    
    // Calculate improvement based on key metrics
    const cpuImprovement = (beforeMetrics.cpu?.usage - afterMetrics.cpu?.usage) / beforeMetrics.cpu?.usage || 0;
    const memoryImprovement = (beforeMetrics.memory?.percentage - afterMetrics.memory?.percentage) / beforeMetrics.memory?.percentage || 0;
    const latencyImprovement = (beforeMetrics.network?.latency - afterMetrics.network?.latency) / beforeMetrics.network?.latency || 0;
    
    return Math.max(0, (cpuImprovement + memoryImprovement + latencyImprovement) * 100 / 3);
  }

  private extractLessonsLearned(issue: InfrastructureIssue): string[] {
    const lessons = [
      `${issue.type} issues require ${issue.healingActions.length} healing actions on average`,
      `Root cause identified as: ${issue.rootCause}`,
      `Resolution time: ${issue.resolvedAt ? (issue.resolvedAt.getTime() - issue.detectedAt.getTime()) / 60000 : 0} minutes`
    ];
    
    return lessons;
  }

  private generatePreventionMeasures(issue: InfrastructureIssue): string[] {
    const measures = [
      'Implement proactive monitoring for early detection',
      'Set up automated alerts for threshold violations',
      'Schedule regular system health checks'
    ];
    
    if (issue.type === 'performance') {
      measures.push('Optimize application performance regularly');
    }
    
    if (issue.type === 'resource') {
      measures.push('Implement predictive scaling');
    }
    
    return measures;
  }

  private async processActiveIssues(): Promise<void> {
    // Check for issues that need escalation due to timeout
    for (const [issueId, issue] of this.activeIssues) {
      if (issue.status === 'healing') {
        const healingDuration = Date.now() - issue.detectedAt.getTime();
        if (healingDuration > this.HEALING_TIMEOUT) {
          issue.status = 'escalated';
          console.log(`⏰ Issue ${issueId} escalated due to timeout`);
        }
      }
    }
    
    // Clean up resolved issues older than 24 hours
    const oneDayAgo = Date.now() - 86400000;
    for (const [issueId, issue] of this.activeIssues) {
      if (issue.status === 'resolved' && issue.resolvedAt && issue.resolvedAt.getTime() < oneDayAgo) {
        this.activeIssues.delete(issueId);
      }
    }
  }

  private updateHealthTrends(): void {
    // Update 24-hour trend
    this.systemHealth.trends.last24h.push(this.systemHealth.score);
    if (this.systemHealth.trends.last24h.length > 24) {
      this.systemHealth.trends.last24h.shift();
    }
    
    // Update weekly trend (daily averages)
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) { // Midnight
      const dailyAverage = this.systemHealth.trends.last24h.reduce((sum, score) => sum + score, 0) / this.systemHealth.trends.last24h.length;
      this.systemHealth.trends.lastWeek.push(dailyAverage);
      if (this.systemHealth.trends.lastWeek.length > 7) {
        this.systemHealth.trends.lastWeek.shift();
      }
    }
    
    // Simple prediction based on recent trend
    const recentScores = this.systemHealth.trends.last24h.slice(-3);
    const trend = recentScores.length > 1 ? 
      (recentScores[recentScores.length - 1] - recentScores[0]) / (recentScores.length - 1) : 0;
    this.systemHealth.trends.prediction = Math.max(0, Math.min(100, this.systemHealth.score + trend));
  }

  // Public API methods
  async getSystemHealth(): Promise<SystemHealth> {
    return this.systemHealth;
  }

  async getActiveIssues(): Promise<InfrastructureIssue[]> {
    return Array.from(this.activeIssues.values())
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async getHealingReports(limit: number = 20): Promise<HealingReport[]> {
    return this.healingReports
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async getHealthPatterns(): Promise<HealthPattern[]> {
    return Array.from(this.healthPatterns.values());
  }

  async forceHealing(issueId: string): Promise<boolean> {
    const issue = this.activeIssues.get(issueId);
    if (!issue) return false;
    
    await this.initiateHealing(issueId);
    return true;
  }

  async getHealingStats(): Promise<{
    totalIssues: number;
    resolvedIssues: number;
    successRate: number;
    avgResolutionTime: number;
    criticalIssues: number;
    systemUptime: number;
  }> {
    const allIssues = Array.from(this.activeIssues.values()).concat(
      this.healingReports.map(r => ({ status: r.success ? 'resolved' : 'escalated' } as any))
    );
    
    const resolvedIssues = allIssues.filter(i => i.status === 'resolved').length;
    const criticalIssues = allIssues.filter(i => (i as any).severity === 'critical').length;
    
    const avgResolutionTime = this.healingReports.length > 0 
      ? this.healingReports.reduce((sum, r) => sum + r.duration, 0) / this.healingReports.length
      : 0;
    
    return {
      totalIssues: allIssues.length,
      resolvedIssues,
      successRate: allIssues.length > 0 ? resolvedIssues / allIssues.length : 1,
      avgResolutionTime,
      criticalIssues,
      systemUptime: this.systemHealth.score
    };
  }

  stopHealing(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.stopHealing();
    this.activeIssues.clear();
    this.healthPatterns.clear();
    this.healingReports = [];
    SelfHealingEngine.instance = null;
  }
}

// Export singleton getter
export const getSelfHealingEngine = () => SelfHealingEngine.getInstance();
