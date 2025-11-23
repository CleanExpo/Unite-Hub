/**
 * AI Director Risk Engine
 * Phase 60: Detect and monitor risks across all clients
 */

import { RiskCategory, DirectorInsight, DataSource } from './aiDirectorEngine';

export interface RiskSignal {
  category: RiskCategory;
  weight: number;
  threshold: number;
  description: string;
}

export interface RiskAssessment {
  client_id: string;
  overall_risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  active_risks: DirectorInsight[];
  risk_trend: 'improving' | 'stable' | 'declining';
  recommended_intervention: string;
}

// Risk detection thresholds
const RISK_THRESHOLDS: Record<RiskCategory, {
  low: number;
  medium: number;
  high: number;
  critical: number;
}> = {
  churn_risk: { low: 20, medium: 40, high: 60, critical: 80 },
  budget_overrun: { low: 80, medium: 90, high: 100, critical: 120 },
  content_stagnation: { low: 5, medium: 3, high: 1, critical: 0 },
  engagement_drop: { low: 4, medium: 2, high: 1, critical: 0 },
  deadline_miss: { low: 1, medium: 2, high: 3, critical: 5 },
  quality_decline: { low: 70, medium: 50, high: 30, critical: 10 },
  compliance_issue: { low: 0, medium: 1, high: 2, critical: 3 },
  resource_constraint: { low: 70, medium: 80, high: 90, critical: 95 },
};

/**
 * Risk Detection Engine
 * Monitors all risk categories and generates alerts
 */
export class AIDirectorRiskEngine {
  /**
   * Assess overall risk for a client
   */
  assessClientRisk(metrics: {
    health_score: number;
    days_inactive: number;
    content_generated_7d: number;
    budget_usage_percent: number;
    deadlines_missed: number;
    quality_score: number;
    compliance_flags: number;
    resource_usage_percent: number;
  }): RiskAssessment {
    const risks: DirectorInsight[] = [];
    let totalRiskScore = 0;

    // Check each risk category
    // 1. Churn Risk (based on health score and inactivity)
    const churnScore = this.calculateChurnRisk(metrics.health_score, metrics.days_inactive);
    if (churnScore > RISK_THRESHOLDS.churn_risk.low) {
      const severity = this.getSeverity('churn_risk', churnScore);
      risks.push({
        id: `churn-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'churn_risk',
        severity,
        title: 'Elevated Churn Risk',
        description: `Churn risk score: ${churnScore}. Health score: ${metrics.health_score}, Days inactive: ${metrics.days_inactive}`,
        data_sources: ['activation_engine', 'performance_insights'],
        metrics: {
          churn_score: churnScore,
          health_score: metrics.health_score,
          days_inactive: metrics.days_inactive,
        },
        recommended_actions: this.getChurnActions(severity),
        created_at: new Date().toISOString(),
      });
      totalRiskScore += churnScore * 0.25;
    }

    // 2. Budget Overrun
    if (metrics.budget_usage_percent > RISK_THRESHOLDS.budget_overrun.low) {
      const severity = this.getSeverity('budget_overrun', metrics.budget_usage_percent);
      risks.push({
        id: `budget-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'budget_overrun',
        severity,
        title: 'Budget Usage Alert',
        description: `Budget usage at ${metrics.budget_usage_percent}% of allocation`,
        data_sources: ['financial_usage'],
        metrics: { budget_usage: `${metrics.budget_usage_percent}%` },
        recommended_actions: this.getBudgetActions(severity),
        created_at: new Date().toISOString(),
      });
      totalRiskScore += (metrics.budget_usage_percent - 80) * 0.5;
    }

    // 3. Content Stagnation
    if (metrics.content_generated_7d <= RISK_THRESHOLDS.content_stagnation.low) {
      const severity = this.getContentSeverity(metrics.content_generated_7d);
      risks.push({
        id: `content-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'content_stagnation',
        severity,
        title: 'Content Production Slowdown',
        description: `Only ${metrics.content_generated_7d} content pieces in past 7 days`,
        data_sources: ['production_jobs', 'visual_generation'],
        metrics: { content_7d: metrics.content_generated_7d },
        recommended_actions: this.getContentActions(severity),
        created_at: new Date().toISOString(),
      });
      totalRiskScore += (5 - metrics.content_generated_7d) * 5;
    }

    // 4. Engagement Drop
    const engagementScore = 7 - metrics.days_inactive;
    if (engagementScore <= RISK_THRESHOLDS.engagement_drop.low) {
      const severity = this.getEngagementSeverity(metrics.days_inactive);
      risks.push({
        id: `engagement-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'engagement_drop',
        severity,
        title: 'Low Platform Engagement',
        description: `Client has been inactive for ${metrics.days_inactive} days`,
        data_sources: ['activation_engine'],
        metrics: { days_inactive: metrics.days_inactive },
        recommended_actions: this.getEngagementActions(severity),
        created_at: new Date().toISOString(),
      });
      totalRiskScore += metrics.days_inactive * 3;
    }

    // 5. Deadline Miss
    if (metrics.deadlines_missed >= RISK_THRESHOLDS.deadline_miss.low) {
      const severity = this.getSeverity('deadline_miss', metrics.deadlines_missed);
      risks.push({
        id: `deadline-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'deadline_miss',
        severity,
        title: 'Missed Deadlines',
        description: `${metrics.deadlines_missed} deadline(s) missed this month`,
        data_sources: ['timecard_data', 'production_jobs'],
        metrics: { deadlines_missed: metrics.deadlines_missed },
        recommended_actions: [
          'Review project timeline',
          'Identify bottlenecks',
          'Adjust resource allocation',
        ],
        created_at: new Date().toISOString(),
      });
      totalRiskScore += metrics.deadlines_missed * 8;
    }

    // 6. Quality Decline
    if (metrics.quality_score < RISK_THRESHOLDS.quality_decline.low) {
      const severity = this.getQualitySeverity(metrics.quality_score);
      risks.push({
        id: `quality-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'quality_decline',
        severity,
        title: 'Quality Score Declining',
        description: `Quality score dropped to ${metrics.quality_score}%`,
        data_sources: ['success_scores', 'performance_insights'],
        metrics: { quality_score: metrics.quality_score },
        recommended_actions: [
          'Review rejected content',
          'Adjust AI prompts',
          'Schedule quality review',
        ],
        created_at: new Date().toISOString(),
      });
      totalRiskScore += (70 - metrics.quality_score) * 0.5;
    }

    // 7. Compliance Issues
    if (metrics.compliance_flags > 0) {
      const severity = this.getSeverity('compliance_issue', metrics.compliance_flags);
      risks.push({
        id: `compliance-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'compliance_issue',
        severity,
        title: 'Compliance Flags Detected',
        description: `${metrics.compliance_flags} compliance issue(s) flagged`,
        data_sources: ['seo_geo_audits'],
        metrics: { flags: metrics.compliance_flags },
        recommended_actions: [
          'Review flagged content immediately',
          'Run truth-layer audit',
          'Update content guidelines',
        ],
        created_at: new Date().toISOString(),
      });
      totalRiskScore += metrics.compliance_flags * 15;
    }

    // 8. Resource Constraint
    if (metrics.resource_usage_percent > RISK_THRESHOLDS.resource_constraint.low) {
      const severity = this.getSeverity('resource_constraint', metrics.resource_usage_percent);
      risks.push({
        id: `resource-${Date.now()}`,
        client_id: '',
        type: 'risk',
        category: 'resource_constraint',
        severity,
        title: 'Resource Constraints',
        description: `Resource usage at ${metrics.resource_usage_percent}%`,
        data_sources: ['financial_usage'],
        metrics: { resource_usage: `${metrics.resource_usage_percent}%` },
        recommended_actions: [
          'Review resource allocation',
          'Consider tier upgrade',
          'Optimize usage patterns',
        ],
        created_at: new Date().toISOString(),
      });
      totalRiskScore += (metrics.resource_usage_percent - 70) * 0.3;
    }

    // Determine overall risk level
    let riskLevel: RiskAssessment['risk_level'] = 'low';
    if (totalRiskScore >= 60) riskLevel = 'critical';
    else if (totalRiskScore >= 40) riskLevel = 'high';
    else if (totalRiskScore >= 20) riskLevel = 'medium';

    return {
      client_id: '',
      overall_risk_score: Math.min(100, Math.round(totalRiskScore)),
      risk_level: riskLevel,
      active_risks: risks,
      risk_trend: 'stable', // Would calculate from historical data
      recommended_intervention: this.getInterventionRecommendation(riskLevel, risks),
    };
  }

  /**
   * Get aggregated risk summary across all clients
   */
  aggregateRisks(assessments: RiskAssessment[]): {
    by_category: Record<RiskCategory, number>;
    by_severity: Record<string, number>;
    total_at_risk: number;
    trending_risks: RiskCategory[];
  } {
    const byCategory: Record<RiskCategory, number> = {
      churn_risk: 0,
      budget_overrun: 0,
      content_stagnation: 0,
      engagement_drop: 0,
      deadline_miss: 0,
      quality_decline: 0,
      compliance_issue: 0,
      resource_constraint: 0,
    };

    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    let totalAtRisk = 0;

    for (const assessment of assessments) {
      if (assessment.risk_level !== 'low') {
        totalAtRisk++;
      }

      for (const risk of assessment.active_risks) {
        byCategory[risk.category as RiskCategory]++;
        bySeverity[risk.severity]++;
      }
    }

    // Find trending risks (most common)
    const trendingRisks = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category as RiskCategory);

    return {
      by_category: byCategory,
      by_severity: bySeverity,
      total_at_risk: totalAtRisk,
      trending_risks: trendingRisks,
    };
  }

  // Private helper methods

  private calculateChurnRisk(healthScore: number, daysInactive: number): number {
    // Formula: Lower health + more inactive days = higher churn risk
    return Math.min(100, (100 - healthScore) * 0.5 + daysInactive * 5);
  }

  private getSeverity(
    category: RiskCategory,
    value: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = RISK_THRESHOLDS[category];
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.high) return 'high';
    if (value >= thresholds.medium) return 'medium';
    return 'low';
  }

  private getContentSeverity(contentCount: number): 'low' | 'medium' | 'high' | 'critical' {
    if (contentCount === 0) return 'critical';
    if (contentCount === 1) return 'high';
    if (contentCount <= 3) return 'medium';
    return 'low';
  }

  private getEngagementSeverity(daysInactive: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysInactive >= 7) return 'critical';
    if (daysInactive >= 5) return 'high';
    if (daysInactive >= 3) return 'medium';
    return 'low';
  }

  private getQualitySeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 10) return 'critical';
    if (score < 30) return 'high';
    if (score < 50) return 'medium';
    return 'low';
  }

  private getChurnActions(severity: string): string[] {
    if (severity === 'critical') {
      return [
        'Executive outreach within 24 hours',
        'Offer emergency support session',
        'Review service delivery issues',
      ];
    }
    if (severity === 'high') {
      return [
        'Schedule urgent check-in call',
        'Review recent interactions',
        'Prepare retention offer',
      ];
    }
    return [
      'Monitor closely for next 7 days',
      'Send value-add content',
      'Schedule routine check-in',
    ];
  }

  private getBudgetActions(severity: string): string[] {
    if (severity === 'critical') {
      return [
        'Pause non-essential operations',
        'Alert client immediately',
        'Review usage optimization',
      ];
    }
    if (severity === 'high') {
      return [
        'Notify client of usage',
        'Suggest budget adjustment',
        'Identify optimization areas',
      ];
    }
    return ['Monitor usage trend', 'Prepare usage report'];
  }

  private getContentActions(severity: string): string[] {
    if (severity === 'critical') {
      return [
        'Check for system issues',
        'Contact client about blockers',
        'Review approval queue',
      ];
    }
    return [
      'Review pending approvals',
      'Suggest content topics',
      'Check training completion',
    ];
  }

  private getEngagementActions(severity: string): string[] {
    if (severity === 'critical') {
      return [
        'Immediate outreach required',
        'Offer hands-on support session',
        'Review onboarding completion',
      ];
    }
    return [
      'Send helpful resource email',
      'Schedule check-in',
      'Review activation progress',
    ];
  }

  private getInterventionRecommendation(
    riskLevel: string,
    risks: DirectorInsight[]
  ): string {
    if (riskLevel === 'critical') {
      return 'Immediate intervention required. Assign dedicated support within 24 hours.';
    }
    if (riskLevel === 'high') {
      return 'Priority attention needed. Schedule support call within 48 hours.';
    }
    if (riskLevel === 'medium') {
      return 'Monitor closely. Review in weekly check-in.';
    }
    return 'Continue standard monitoring.';
  }
}

export default AIDirectorRiskEngine;
