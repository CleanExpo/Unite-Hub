/**
 * Evolution Engine
 * Phase 64: Central meta-engine for system self-improvement
 */

import { EvolutionSignalsEngine, SignalSource } from './evolutionSignals';
import { SIPGenerator, SystemImprovementProposal } from './sipGenerator';

export interface EvolutionReport {
  generated_at: string;
  period: 'weekly' | 'monthly';
  total_signals: number;
  signals_by_source: Record<SignalSource, number>;
  proposals_generated: number;
  proposals_approved: number;
  proposals_declined: number;
  proposals_implemented: number;
  top_proposals: SystemImprovementProposal[];
  system_health_trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface EvolutionBriefing {
  generated_at: string;
  pending_proposals: number;
  high_priority_signals: number;
  recent_implementations: number;
  evolution_health_score: number;
  action_items: string[];
}

// Evolution constraints
const EVOLUTION_CONSTRAINTS = {
  auto_execute: false,
  founder_approval_required: true,
  read_only_scan_of_codebase: true,
  no_production_changes_without_approval: true,
  rollback_available: true,
};

/**
 * Main Evolution Engine
 * Orchestrates system self-improvement
 */
export class EvolutionEngine {
  private signalsEngine: EvolutionSignalsEngine;
  private sipGenerator: SIPGenerator;

  constructor() {
    this.signalsEngine = new EvolutionSignalsEngine();
    this.sipGenerator = new SIPGenerator();
  }

  /**
   * Scan system for improvement opportunities
   */
  async scanForImprovements(): Promise<{
    signals_detected: number;
    proposals_generated: number;
  }> {
    // Scan various sources
    await this.scanClientUsagePatterns();
    await this.scanRiskTrends();
    await this.scanCreativeInconsistencies();
    await this.scanGovernanceAudits();
    await this.scanPerformance();
    await this.scanCosts();

    // Convert high-priority signals to SIPs
    const signalsForConversion = this.signalsEngine.getSignalsForSIPConversion();
    let proposalsGenerated = 0;

    // Group signals by source for better proposals
    const groupedSignals = this.groupSignalsBySource(signalsForConversion);

    for (const [source, signals] of Object.entries(groupedSignals)) {
      if (signals.length > 0) {
        this.sipGenerator.generateFromSignals(signals);
        signals.forEach((s) => this.signalsEngine.markConverted(s.id));
        proposalsGenerated++;
      }
    }

    return {
      signals_detected: signalsForConversion.length,
      proposals_generated: proposalsGenerated,
    };
  }

  /**
   * Generate weekly evolution report
   */
  generateWeeklyReport(): EvolutionReport {
    const patterns = this.signalsEngine.analyzePatterns();
    const proposals = this.sipGenerator.getAllProposals();

    const signalsBySource: Record<SignalSource, number> = {} as any;
    for (const pattern of patterns) {
      signalsBySource[pattern.source] = pattern.frequency;
    }

    const approved = proposals.filter((p) => p.status === 'approved').length;
    const declined = proposals.filter((p) => p.status === 'declined').length;
    const implemented = proposals.filter((p) => p.status === 'implemented').length;

    const topProposals = this.sipGenerator
      .getPendingProposals()
      .slice(0, 5);

    // Determine health trend
    const increasingTrends = patterns.filter((p) => p.trend === 'increasing').length;
    const decreasingTrends = patterns.filter((p) => p.trend === 'decreasing').length;
    let healthTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (decreasingTrends > increasingTrends + 2) {
      healthTrend = 'improving'; // Less issues = improving
    } else if (increasingTrends > decreasingTrends + 2) {
      healthTrend = 'declining';
    }

    const recommendations = this.generateRecommendations(patterns, proposals);

    return {
      generated_at: new Date().toISOString(),
      period: 'weekly',
      total_signals: this.signalsEngine.getUnacknowledgedSignals().length,
      signals_by_source: signalsBySource,
      proposals_generated: proposals.length,
      proposals_approved: approved,
      proposals_declined: declined,
      proposals_implemented: implemented,
      top_proposals: topProposals,
      system_health_trend: healthTrend,
      recommendations,
    };
  }

  /**
   * Generate evolution briefing
   */
  generateBriefing(): EvolutionBriefing {
    const pendingProposals = this.sipGenerator.getPendingProposals();
    const highPrioritySignals = this.signalsEngine
      .getUnacknowledgedSignals()
      .filter((s) => s.priority === 'high' || s.priority === 'critical');
    const implemented = this.sipGenerator.getProposalsByStatus('implemented');

    // Calculate health score
    const patterns = this.signalsEngine.analyzePatterns();
    const avgPriority = patterns.reduce((sum, p) => sum + p.avg_priority_score, 0) / patterns.length;
    const healthScore = Math.max(0, 100 - avgPriority);

    const actionItems: string[] = [];

    if (pendingProposals.length > 0) {
      actionItems.push(`📋 ${pendingProposals.length} proposal(s) awaiting review`);
    }
    if (highPrioritySignals.length > 0) {
      actionItems.push(`⚠️ ${highPrioritySignals.length} high-priority signal(s) detected`);
    }
    actionItems.push('🔍 Run weekly evolution scan');
    actionItems.push('📊 Review evolution health metrics');

    return {
      generated_at: new Date().toISOString(),
      pending_proposals: pendingProposals.length,
      high_priority_signals: highPrioritySignals.length,
      recent_implementations: implemented.length,
      evolution_health_score: Math.round(healthScore),
      action_items: actionItems,
    };
  }

  /**
   * Approve a proposal
   */
  approveProposal(proposalId: string, rationale?: string): boolean {
    return this.sipGenerator.updateStatus(proposalId, 'approved', rationale);
  }

  /**
   * Decline a proposal
   */
  declineProposal(proposalId: string, rationale: string): boolean {
    return this.sipGenerator.updateStatus(proposalId, 'declined', rationale);
  }

  /**
   * Mark proposal as implemented
   */
  markImplemented(proposalId: string): boolean {
    return this.sipGenerator.updateStatus(proposalId, 'implemented');
  }

  /**
   * Get pending proposals
   */
  getPendingProposals(): SystemImprovementProposal[] {
    return this.sipGenerator.getPendingProposals();
  }

  /**
   * Run weekly maintenance tasks
   */
  async runWeeklyTasks(): Promise<{
    report_generated: boolean;
    signals_reviewed: number;
    proposals_ranked: number;
    stale_archived: number;
  }> {
    // Archive stale proposals
    const staleArchived = this.sipGenerator.archiveStaleProposals(30);

    // Generate report
    const report = this.generateWeeklyReport();

    return {
      report_generated: true,
      signals_reviewed: report.total_signals,
      proposals_ranked: report.top_proposals.length,
      stale_archived: staleArchived,
    };
  }

  // Private scanning methods

  private async scanClientUsagePatterns(): Promise<void> {
    // Simulate detection of usage pattern anomalies
    // In production, would analyze actual usage data
  }

  private async scanRiskTrends(): Promise<void> {
    // Check for increasing risk patterns
  }

  private async scanCreativeInconsistencies(): Promise<void> {
    // Check for brand/creative issues
  }

  private async scanGovernanceAudits(): Promise<void> {
    // Check recent governance audit failures
  }

  private async scanPerformance(): Promise<void> {
    // Check for performance degradation
  }

  private async scanCosts(): Promise<void> {
    // Check for cost anomalies
  }

  private groupSignalsBySource(
    signals: ReturnType<EvolutionSignalsEngine['getSignalsForSIPConversion']>
  ): Record<string, typeof signals> {
    const grouped: Record<string, typeof signals> = {};

    for (const signal of signals) {
      if (!grouped[signal.source]) {
        grouped[signal.source] = [];
      }
      grouped[signal.source].push(signal);
    }

    return grouped;
  }

  private generateRecommendations(
    patterns: ReturnType<EvolutionSignalsEngine['analyzePatterns']>,
    proposals: SystemImprovementProposal[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for increasing trends
    const increasingPatterns = patterns.filter((p) => p.trend === 'increasing');
    if (increasingPatterns.length > 0) {
      recommendations.push(
        `Monitor ${increasingPatterns.map((p) => p.source.replace(/_/g, ' ')).join(', ')} - showing increasing trends`
      );
    }

    // Check pending proposals
    const pending = proposals.filter((p) => p.status === 'pending_review');
    if (pending.length >= 5) {
      recommendations.push('Review backlog - multiple proposals awaiting decision');
    }

    // General recommendations
    recommendations.push('Continue weekly evolution scans');
    recommendations.push('Track implemented improvements for ROI');

    return recommendations;
  }
}

export default EvolutionEngine;
