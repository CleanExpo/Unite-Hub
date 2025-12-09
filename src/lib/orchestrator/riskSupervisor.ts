/**
 * Risk Supervisor - Cross-Agent Risk Assessment and Escalation
 *
 * Monitors risk across orchestrator steps, escalates high-risk actions,
 * enforces approval gates, and manages risk-aware execution oversight.
 */

export interface RiskAssessment {
  overallRisk: number;
  riskFactors: Array<{
    factor: string;
    contribution: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  requiresApproval: boolean;
  approvalReason?: string;
  recommendations: string[];
}

export class RiskSupervisor {
  /**
   * Estimate risk for a single orchestrator step
   */
  estimateStepRisk(agent: string, context: Record<string, any>): number {
    let baseRisk = this.getAgentBaseRisk(agent);

    // Increase risk based on context factors
    if (context.targetCount && context.targetCount > 1000) {
      baseRisk += 15; // Large-scale actions riskier
    }

    if (context.highValueContacts) {
      baseRisk += 10; // High-value targets increase risk
    }

    if (context.urgentFlag) {
      baseRisk += 5; // Urgency increases risk
    }

    return Math.min(baseRisk, 100);
  }

  /**
   * Get base risk profile for each agent type
   */
  private getAgentBaseRisk(agent: string): number {
    const baseRisks: Record<string, number> = {
      'email-agent': 25, // Sending emails is relatively safe
      'content-agent': 35, // Generation can be off-target
      'contact-intelligence': 20, // Scoring is low-risk
      'analysis': 30, // Analysis can be wrong
      'reasoning': 40, // Reasoning can have logical flaws
      'orchestrator': 50, // Orchestration is highest risk (broad impact)
    };

    return baseRisks[agent] || 50;
  }

  /**
   * Assess overall task risk from step risks
   */
  assessTaskRisk(steps: Array<{ riskScore: number; assignedAgent: string }>): number {
    if (steps.length === 0) {
return 0;
}

    // Weighted average (later steps weighted more)
    const weights = steps.map((_, idx) => (idx + 1) / steps.length);
    const weightedSum = steps.reduce(
      (sum, step, idx) => sum + step.riskScore * weights[idx],
      0
    );

    return Math.min(Math.round(weightedSum / weights.length), 100);
  }

  /**
   * Full risk assessment with detailed breakdown
   */
  assessRisk(
    agent: string,
    context: Record<string, any>,
    previousRisks: number[] = []
  ): RiskAssessment {
    const stepRisk = this.estimateStepRisk(agent, context);
    const cumulativeRisk = previousRisks.length > 0
      ? (previousRisks.reduce((a, b) => a + b) + stepRisk) / (previousRisks.length + 1)
      : stepRisk;

    const riskFactors = this.identifyRiskFactors(agent, context);
    const requiresApproval = cumulativeRisk >= 60;

    const recommendations: string[] = [];
    if (cumulativeRisk >= 80) {
      recommendations.push('⚠️ CRITICAL: Requires founder approval before execution');
    } else if (cumulativeRisk >= 60) {
      recommendations.push('🚨 HIGH: Consider founder review before broad execution');
    }

    if (riskFactors.some((f) => f.severity === 'critical')) {
      recommendations.push('⛔ Critical risk factors detected');
    }

    return {
      overallRisk: Math.round(cumulativeRisk),
      riskFactors,
      requiresApproval,
      approvalReason: requiresApproval
        ? `Risk score ${Math.round(cumulativeRisk)}% exceeds threshold`
        : undefined,
      recommendations,
    };
  }

  /**
   * Identify specific risk factors in context
   */
  private identifyRiskFactors(
    agent: string,
    context: Record<string, any>
  ): RiskAssessment['riskFactors'] {
    const factors: RiskAssessment['riskFactors'] = [];

    // Agent-specific risks
    if (agent === 'orchestrator' && context.multiAgentCount > 3) {
      factors.push({
        factor: 'Multi-agent coordination complexity',
        contribution: 20,
        severity: 'high',
      });
    }

    if (agent === 'content-agent' && context.personalizedContent) {
      factors.push({
        factor: 'Personalized content generation (hallucination risk)',
        contribution: 15,
        severity: 'medium',
      });
    }

    // Volume-based risks
    if (context.targetCount > 10000) {
      factors.push({
        factor: 'Large-scale targeting (10K+)',
        contribution: 25,
        severity: 'high',
      });
    } else if (context.targetCount > 1000) {
      factors.push({
        factor: 'Medium-scale targeting (1K-10K)',
        contribution: 15,
        severity: 'medium',
      });
    }

    // Data quality risks
    if (context.dataQuality && context.dataQuality < 60) {
      factors.push({
        factor: 'Low data quality',
        contribution: 20,
        severity: 'high',
      });
    }

    // Automation risks
    if (context.autonomousExecution) {
      factors.push({
        factor: 'Autonomous execution without preview',
        contribution: 15,
        severity: 'medium',
      });
    }

    // External integration risks
    if (context.externalAPI) {
      factors.push({
        factor: 'External API dependency',
        contribution: 10,
        severity: 'medium',
      });
    }

    return factors;
  }

  /**
   * Determine if action requires founder approval
   */
  requiresApproval(riskScore: number): boolean {
    return riskScore >= 60;
  }

  /**
   * Determine if action should be completely halted
   */
  shouldHalt(riskScore: number): boolean {
    return riskScore >= 90;
  }

  /**
   * Get risk mitigation strategies
   */
  getMitigationStrategies(riskScore: number): string[] {
    const strategies: string[] = [];

    if (riskScore >= 80) {
      strategies.push('Require founder approval');
      strategies.push('Add validation step before execution');
      strategies.push('Limit scope to pilot group');
    } else if (riskScore >= 60) {
      strategies.push('Add review step');
      strategies.push('Monitor execution closely');
      strategies.push('Set up rollback plan');
    } else if (riskScore >= 40) {
      strategies.push('Enable detailed logging');
      strategies.push('Set up alerts for anomalies');
    }

    strategies.push('Archive execution for audit trail');

    return strategies;
  }
}
