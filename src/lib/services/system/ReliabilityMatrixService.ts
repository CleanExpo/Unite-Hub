/**
 * ReliabilityMatrixService - Pass/Fail Rate Analysis
 * Phase 14 Week 1-2: Finalization
 *
 * Calculates reliability metrics across:
 * - All 14 phases
 * - All subsystems
 * - Historical trends
 */

export interface PhaseReliability {
  phase: number;
  name: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  passRate: number;
  avgDuration: number;
  lastRun: Date | null;
}

export interface SubsystemReliability {
  subsystem: string;
  category: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
  avgLatency: number;
  p95Latency: number;
  errorTypes: Record<string, number>;
}

export interface ReliabilityTrend {
  date: string;
  passRate: number;
  totalRuns: number;
  avgDuration: number;
}

export interface ReliabilityMatrix {
  generatedAt: Date;
  overall: {
    totalRuns: number;
    passRate: number;
    avgDuration: number;
    uptimePercent: number;
  };
  byPhase: PhaseReliability[];
  bySubsystem: SubsystemReliability[];
  trends: ReliabilityTrend[];
  alerts: string[];
}

export class ReliabilityMatrixService {
  private phaseNames: Record<number, string> = {
    1: 'Foundation',
    2: 'Auth & Users',
    3: 'Database Schema',
    4: 'API Routes',
    5: 'Dashboard UI',
    6: 'Email Integration',
    7: 'AI Agents',
    8: 'Campaign Builder',
    9: 'Lead Scoring',
    10: 'Content Generation',
    11: 'Orchestrator',
    12: 'Cloud Deployment',
    13: 'Leviathan System',
    14: 'Finalization',
  };

  private subsystems = [
    { name: 'fabrication', category: 'content' },
    { name: 'cloud_aws', category: 'deployment' },
    { name: 'cloud_gcs', category: 'deployment' },
    { name: 'cloud_azure', category: 'deployment' },
    { name: 'cloud_netlify', category: 'deployment' },
    { name: 'blogger', category: 'social' },
    { name: 'gsite', category: 'social' },
    { name: 'daisy_chain', category: 'linking' },
    { name: 'health_check', category: 'monitoring' },
    { name: 'orchestrator', category: 'coordination' },
    { name: 'email_agent', category: 'ai' },
    { name: 'content_agent', category: 'ai' },
    { name: 'contact_intelligence', category: 'ai' },
  ];

  /**
   * Generate complete reliability matrix
   */
  async generateMatrix(): Promise<ReliabilityMatrix> {
    const byPhase = this.calculatePhaseReliability();
    const bySubsystem = this.calculateSubsystemReliability();
    const trends = this.calculateTrends();
    const alerts = this.generateAlerts(byPhase, bySubsystem);

    // Calculate overall metrics
    const totalRuns = byPhase.reduce((sum, p) => sum + p.totalRuns, 0);
    const passedRuns = byPhase.reduce((sum, p) => sum + p.passedRuns, 0);
    const totalDuration = byPhase.reduce((sum, p) => sum + (p.avgDuration * p.totalRuns), 0);

    return {
      generatedAt: new Date(),
      overall: {
        totalRuns,
        passRate: totalRuns > 0 ? (passedRuns / totalRuns) * 100 : 0,
        avgDuration: totalRuns > 0 ? totalDuration / totalRuns : 0,
        uptimePercent: this.calculateUptime(bySubsystem),
      },
      byPhase,
      bySubsystem,
      trends,
      alerts,
    };
  }

  /**
   * Calculate reliability by phase
   */
  private calculatePhaseReliability(): PhaseReliability[] {
    const results: PhaseReliability[] = [];

    for (let phase = 1; phase <= 14; phase++) {
      // Simulate data - in production, query from run_logs
      const totalRuns = Math.floor(Math.random() * 100) + 10;
      const passedRuns = Math.floor(totalRuns * (0.85 + Math.random() * 0.15));
      const avgDuration = 1000 + Math.random() * 5000;

      results.push({
        phase,
        name: this.phaseNames[phase],
        totalRuns,
        passedRuns,
        failedRuns: totalRuns - passedRuns,
        passRate: (passedRuns / totalRuns) * 100,
        avgDuration,
        lastRun: new Date(Date.now() - Math.random() * 86400000),
      });
    }

    return results;
  }

  /**
   * Calculate reliability by subsystem
   */
  private calculateSubsystemReliability(): SubsystemReliability[] {
    return this.subsystems.map(sub => {
      // Simulate data - in production, query from audit_logs
      const totalOperations = Math.floor(Math.random() * 500) + 50;
      const successRate = 0.90 + Math.random() * 0.10;
      const successfulOperations = Math.floor(totalOperations * successRate);
      const avgLatency = 100 + Math.random() * 2000;

      return {
        subsystem: sub.name,
        category: sub.category,
        totalOperations,
        successfulOperations,
        failedOperations: totalOperations - successfulOperations,
        successRate: successRate * 100,
        avgLatency,
        p95Latency: avgLatency * 1.5,
        errorTypes: this.generateErrorTypes(totalOperations - successfulOperations),
      };
    });
  }

  /**
   * Generate error type distribution
   */
  private generateErrorTypes(failures: number): Record<string, number> {
    if (failures === 0) {
return {};
}

    const types: Record<string, number> = {};
    const errorCategories = ['timeout', 'auth_failure', 'rate_limit', 'network', 'validation'];

    let remaining = failures;
    for (const category of errorCategories) {
      if (remaining <= 0) {
break;
}
      const count = Math.floor(Math.random() * remaining);
      if (count > 0) {
        types[category] = count;
        remaining -= count;
      }
    }

    if (remaining > 0) {
      types['unknown'] = remaining;
    }

    return types;
  }

  /**
   * Calculate reliability trends over time
   */
  private calculateTrends(): ReliabilityTrend[] {
    const trends: ReliabilityTrend[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        passRate: 85 + Math.random() * 15,
        totalRuns: Math.floor(20 + Math.random() * 30),
        avgDuration: 2000 + Math.random() * 3000,
      });
    }

    return trends;
  }

  /**
   * Calculate overall uptime percentage
   */
  private calculateUptime(subsystems: SubsystemReliability[]): number {
    if (subsystems.length === 0) {
return 100;
}

    const avgSuccessRate = subsystems.reduce((sum, s) => sum + s.successRate, 0) / subsystems.length;
    return Math.min(avgSuccessRate, 100);
  }

  /**
   * Generate alerts based on reliability data
   */
  private generateAlerts(phases: PhaseReliability[], subsystems: SubsystemReliability[]): string[] {
    const alerts: string[] = [];

    // Check phases with low pass rates
    for (const phase of phases) {
      if (phase.passRate < 80) {
        alerts.push(`Phase ${phase.phase} (${phase.name}) has low pass rate: ${phase.passRate.toFixed(1)}%`);
      }
    }

    // Check subsystems with high failure rates
    for (const sub of subsystems) {
      if (sub.successRate < 90) {
        alerts.push(`Subsystem ${sub.subsystem} has degraded reliability: ${sub.successRate.toFixed(1)}%`);
      }
      if (sub.p95Latency > 5000) {
        alerts.push(`Subsystem ${sub.subsystem} has high P95 latency: ${sub.p95Latency.toFixed(0)}ms`);
      }
    }

    // Check for specific error patterns
    for (const sub of subsystems) {
      const rateLimit = sub.errorTypes['rate_limit'] || 0;
      if (rateLimit > 5) {
        alerts.push(`${sub.subsystem} experiencing rate limiting (${rateLimit} occurrences)`);
      }
    }

    if (alerts.length === 0) {
      alerts.push('All systems operating within normal parameters');
    }

    return alerts;
  }

  /**
   * Get reliability for specific phase
   */
  async getPhaseReliability(phase: number): Promise<PhaseReliability | null> {
    const matrix = await this.generateMatrix();
    return matrix.byPhase.find(p => p.phase === phase) || null;
  }

  /**
   * Get reliability for specific subsystem
   */
  async getSubsystemReliability(subsystem: string): Promise<SubsystemReliability | null> {
    const matrix = await this.generateMatrix();
    return matrix.bySubsystem.find(s => s.subsystem === subsystem) || null;
  }

  /**
   * Get critical alerts only
   */
  async getCriticalAlerts(): Promise<string[]> {
    const matrix = await this.generateMatrix();
    return matrix.alerts.filter(alert =>
      alert.includes('low pass rate') ||
      alert.includes('degraded reliability')
    );
  }
}

export default ReliabilityMatrixService;
