/**
 * SIP Generator
 * Phase 64: System Improvement Proposal generator
 */

import { EvolutionSignal, SignalSource } from './evolutionSignals';

export type SIPStatus = 'draft' | 'pending_review' | 'approved' | 'declined' | 'implemented' | 'archived';

export interface SystemImprovementProposal {
  id: string;
  title: string;
  description: string;
  affected_subsystems: string[];
  urgency_score: number; // 0-100
  effort_estimate: 'low' | 'medium' | 'high';
  founder_value_score: number; // 0-100
  risk_score: number; // 0-100
  truth_layer_compliance: boolean;
  recommended_action: string;
  confidence: number; // 0-100
  source_signals: string[]; // signal IDs
  status: SIPStatus;
  created_at: string;
  reviewed_at?: string;
  decision_rationale?: string;
}

// Subsystem mapping
const SUBSYSTEM_MAP: Record<SignalSource, string[]> = {
  client_usage_patterns: ['success_engine', 'agency_director'],
  risk_trends: ['agency_director', 'governance_engine'],
  creative_inconsistencies: ['creative_director', 'production_engine'],
  brand_mismatches: ['creative_director'],
  governance_audit_failures: ['governance_engine'],
  performance_slowdowns: ['executive_brain', 'production_engine'],
  cost_anomalies: ['financial_director'],
  token_usage_spikes: ['financial_director', 'production_engine'],
  agent_mission_failures: ['executive_brain'],
  founder_manual_overrides: ['founder_assistant'],
};

/**
 * SIP Generator
 * Creates structured improvement proposals from signals
 */
export class SIPGenerator {
  private proposals: SystemImprovementProposal[] = [];

  /**
   * Generate SIP from signals
   */
  generateFromSignals(signals: EvolutionSignal[]): SystemImprovementProposal {
    if (signals.length === 0) {
      throw new Error('At least one signal required to generate SIP');
    }

    const primarySignal = signals.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })[0];

    // Collect affected subsystems
    const subsystems = new Set<string>();
    for (const signal of signals) {
      const mapped = SUBSYSTEM_MAP[signal.source] || [];
      mapped.forEach((s) => subsystems.add(s));
    }

    // Calculate scores
    const urgencyScore = this.calculateUrgency(signals);
    const riskScore = this.calculateRisk(signals);
    const valueScore = this.calculateFounderValue(signals);
    const confidence = this.calculateConfidence(signals);

    const proposal: SystemImprovementProposal = {
      id: `sip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateTitle(primarySignal),
      description: this.generateDescription(signals),
      affected_subsystems: Array.from(subsystems),
      urgency_score: urgencyScore,
      effort_estimate: this.estimateEffort(signals),
      founder_value_score: valueScore,
      risk_score: riskScore,
      truth_layer_compliance: true, // Always compliant
      recommended_action: this.generateRecommendation(primarySignal, urgencyScore),
      confidence,
      source_signals: signals.map((s) => s.id),
      status: 'pending_review',
      created_at: new Date().toISOString(),
    };

    this.proposals.push(proposal);
    return proposal;
  }

  /**
   * Get all proposals
   */
  getAllProposals(): SystemImprovementProposal[] {
    return this.proposals;
  }

  /**
   * Get proposals by status
   */
  getProposalsByStatus(status: SIPStatus): SystemImprovementProposal[] {
    return this.proposals.filter((p) => p.status === status);
  }

  /**
   * Get pending proposals for review
   */
  getPendingProposals(): SystemImprovementProposal[] {
    return this.getProposalsByStatus('pending_review')
      .sort((a, b) => b.founder_value_score - a.founder_value_score);
  }

  /**
   * Update proposal status
   */
  updateStatus(
    proposalId: string,
    status: SIPStatus,
    rationale?: string
  ): boolean {
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (proposal) {
      proposal.status = status;
      proposal.reviewed_at = new Date().toISOString();
      if (rationale) {
        proposal.decision_rationale = rationale;
      }
      return true;
    }
    return false;
  }

  /**
   * Archive stale proposals
   */
  archiveStaleProposals(daysOld: number = 30): number {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let archived = 0;

    for (const proposal of this.proposals) {
      if (
        proposal.status === 'pending_review' &&
        new Date(proposal.created_at).getTime() < cutoff
      ) {
        proposal.status = 'archived';
        archived++;
      }
    }

    return archived;
  }

  // Private calculation methods

  private calculateUrgency(signals: EvolutionSignal[]): number {
    const priorityScores = signals.map((s) => {
      switch (s.priority) {
        case 'critical': return 100;
        case 'high': return 75;
        case 'medium': return 50;
        case 'low': return 25;
      }
    });

    return Math.round(
      priorityScores.reduce((a, b) => a + b, 0) / signals.length
    );
  }

  private calculateRisk(signals: EvolutionSignal[]): number {
    // Higher risk for governance and security signals
    const riskySources: SignalSource[] = [
      'governance_audit_failures',
      'agent_mission_failures',
      'cost_anomalies',
    ];

    const riskySignals = signals.filter((s) =>
      riskySources.includes(s.source)
    );

    if (riskySignals.length === 0) return 20;
    return Math.min(100, 30 + riskySignals.length * 20);
  }

  private calculateFounderValue(signals: EvolutionSignal[]): number {
    // Value based on impact potential
    const valueMap: Partial<Record<SignalSource, number>> = {
      client_usage_patterns: 80,
      cost_anomalies: 90,
      performance_slowdowns: 85,
      governance_audit_failures: 95,
      founder_manual_overrides: 100,
    };

    const values = signals.map((s) => valueMap[s.source] || 50);
    return Math.round(values.reduce((a, b) => a + b, 0) / signals.length);
  }

  private calculateConfidence(signals: EvolutionSignal[]): number {
    // More signals = higher confidence
    const baseConfidence = 50;
    const signalBonus = Math.min(40, signals.length * 10);
    const priorityBonus = signals.some((s) => s.priority === 'critical') ? 10 : 0;

    return Math.min(100, baseConfidence + signalBonus + priorityBonus);
  }

  private estimateEffort(signals: EvolutionSignal[]): 'low' | 'medium' | 'high' {
    const subsystems = new Set<string>();
    for (const signal of signals) {
      const mapped = SUBSYSTEM_MAP[signal.source] || [];
      mapped.forEach((s) => subsystems.add(s));
    }

    if (subsystems.size <= 1) return 'low';
    if (subsystems.size <= 3) return 'medium';
    return 'high';
  }

  private generateTitle(signal: EvolutionSignal): string {
    const prefix = {
      critical: 'Critical:',
      high: 'Important:',
      medium: 'Improve:',
      low: 'Consider:',
    };

    return `${prefix[signal.priority]} ${signal.title}`;
  }

  private generateDescription(signals: EvolutionSignal[]): string {
    const descriptions = signals.map((s) => s.description);
    return descriptions.join(' ') +
      ` (Based on ${signals.length} signal${signals.length > 1 ? 's' : ''})`;
  }

  private generateRecommendation(
    signal: EvolutionSignal,
    urgency: number
  ): string {
    if (urgency >= 80) {
      return 'Immediate action recommended. Schedule for next sprint.';
    }
    if (urgency >= 60) {
      return 'High priority. Review and plan within one week.';
    }
    if (urgency >= 40) {
      return 'Medium priority. Include in monthly planning.';
    }
    return 'Low priority. Add to backlog for future consideration.';
  }
}

export default SIPGenerator;
