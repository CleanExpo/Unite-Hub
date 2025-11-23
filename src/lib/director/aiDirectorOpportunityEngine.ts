/**
 * AI Director Opportunity Engine
 * Phase 60: Identify growth opportunities across all clients
 */

import { OpportunityCategory, DirectorInsight, DataSource } from './aiDirectorEngine';

export interface OpportunitySignal {
  category: OpportunityCategory;
  indicators: string[];
  confidence: number;
  potential_value: number;
}

export interface OpportunityAssessment {
  client_id: string;
  total_opportunities: number;
  high_value_opportunities: DirectorInsight[];
  estimated_revenue_potential: number;
  recommended_actions: string[];
}

// Opportunity detection criteria
const OPPORTUNITY_CRITERIA: Record<OpportunityCategory, {
  indicators: string[];
  min_confidence: number;
}> = {
  upsell_ready: {
    indicators: ['high_feature_usage', 'frequent_logins', 'positive_feedback'],
    min_confidence: 0.7,
  },
  referral_potential: {
    indicators: ['high_nps', 'active_engagement', 'positive_results'],
    min_confidence: 0.75,
  },
  case_study_candidate: {
    indicators: ['measurable_success', 'compelling_story', 'willing_to_share'],
    min_confidence: 0.8,
  },
  expansion_opportunity: {
    indicators: ['multiple_locations', 'growing_team', 'increased_usage'],
    min_confidence: 0.65,
  },
  efficiency_gain: {
    indicators: ['repetitive_tasks', 'manual_processes', 'time_heavy_workflows'],
    min_confidence: 0.6,
  },
  cross_sell: {
    indicators: ['unused_features', 'complementary_needs', 'budget_available'],
    min_confidence: 0.7,
  },
};

/**
 * Opportunity Detection Engine
 * Identifies growth and value opportunities
 */
export class AIDirectorOpportunityEngine {
  /**
   * Detect opportunities for a specific client
   */
  detectOpportunities(metrics: {
    health_score: number;
    feature_usage_rate: number;
    days_active: number;
    content_approval_rate: number;
    monthly_spend: number;
    team_size: number;
    nps_score?: number;
    has_success_metrics: boolean;
    unused_features: string[];
  }): OpportunityAssessment {
    const opportunities: DirectorInsight[] = [];
    let totalRevenuePotential = 0;

    // 1. Upsell Ready - High engagement, using all features
    if (metrics.feature_usage_rate > 0.8 && metrics.health_score >= 75) {
      const confidence = this.calculateConfidence([
        metrics.feature_usage_rate > 0.8,
        metrics.days_active > 30,
        metrics.health_score >= 75,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.upsell_ready.min_confidence) {
        opportunities.push({
          id: `upsell-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'upsell_ready',
          severity: 'low',
          title: 'Ready for Tier Upgrade',
          description: `Client using ${Math.round(metrics.feature_usage_rate * 100)}% of features with ${metrics.health_score} health score. Likely to benefit from premium tier.`,
          data_sources: ['performance_insights', 'financial_usage'],
          metrics: {
            feature_usage: `${Math.round(metrics.feature_usage_rate * 100)}%`,
            health_score: metrics.health_score,
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Present premium feature demo',
            'Calculate ROI of upgrade',
            'Offer trial period',
          ],
          created_at: new Date().toISOString(),
        });
        totalRevenuePotential += metrics.monthly_spend * 0.5; // 50% upsell potential
      }
    }

    // 2. Referral Potential - High satisfaction and results
    if (metrics.nps_score && metrics.nps_score >= 8 && metrics.has_success_metrics) {
      const confidence = this.calculateConfidence([
        metrics.nps_score >= 8,
        metrics.has_success_metrics,
        metrics.days_active > 60,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.referral_potential.min_confidence) {
        opportunities.push({
          id: `referral-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'referral_potential',
          severity: 'low',
          title: 'Referral Program Candidate',
          description: `High NPS (${metrics.nps_score}/10) with proven success metrics. Strong referral potential.`,
          data_sources: ['success_scores', 'activation_engine'],
          metrics: {
            nps_score: metrics.nps_score,
            has_success: 'Yes',
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Introduce referral program',
            'Request testimonial',
            'Offer referral incentive',
          ],
          created_at: new Date().toISOString(),
        });
        totalRevenuePotential += metrics.monthly_spend; // 1 new client via referral
      }
    }

    // 3. Case Study Candidate - Great results and story
    if (metrics.has_success_metrics && metrics.days_active >= 60 && metrics.health_score >= 85) {
      const confidence = this.calculateConfidence([
        metrics.has_success_metrics,
        metrics.days_active >= 60,
        metrics.health_score >= 85,
        metrics.content_approval_rate > 0.8,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.case_study_candidate.min_confidence) {
        opportunities.push({
          id: `casestudy-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'case_study_candidate',
          severity: 'low',
          title: 'Case Study Opportunity',
          description: `60+ days active with 85+ health score and proven results. Ideal case study candidate.`,
          data_sources: ['success_scores', 'activation_engine', 'performance_insights'],
          metrics: {
            days_active: metrics.days_active,
            health_score: metrics.health_score,
            approval_rate: `${Math.round(metrics.content_approval_rate * 100)}%`,
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Schedule case study interview',
            'Gather before/after metrics',
            'Create industry-specific content',
          ],
          created_at: new Date().toISOString(),
        });
        // Case studies have indirect value (marketing)
      }
    }

    // 4. Expansion Opportunity - Growing team or locations
    if (metrics.team_size > 1 || metrics.monthly_spend > 500) {
      const confidence = this.calculateConfidence([
        metrics.team_size > 1,
        metrics.health_score >= 70,
        metrics.days_active > 30,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.expansion_opportunity.min_confidence) {
        opportunities.push({
          id: `expansion-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'expansion_opportunity',
          severity: 'low',
          title: 'Team Expansion Potential',
          description: `Team size of ${metrics.team_size} with stable engagement. May benefit from additional seats.`,
          data_sources: ['financial_usage', 'performance_insights'],
          metrics: {
            team_size: metrics.team_size,
            monthly_spend: `$${metrics.monthly_spend}`,
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Present team plan options',
            'Offer bulk discount',
            'Demo collaboration features',
          ],
          created_at: new Date().toISOString(),
        });
        totalRevenuePotential += metrics.monthly_spend * (metrics.team_size - 1) * 0.3;
      }
    }

    // 5. Efficiency Gain - Low feature usage, potential optimization
    if (metrics.feature_usage_rate < 0.5 && metrics.health_score >= 60) {
      const confidence = this.calculateConfidence([
        metrics.feature_usage_rate < 0.5,
        metrics.health_score >= 60,
        metrics.days_active > 14,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.efficiency_gain.min_confidence) {
        opportunities.push({
          id: `efficiency-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'efficiency_gain',
          severity: 'low',
          title: 'Efficiency Improvement Available',
          description: `Only using ${Math.round(metrics.feature_usage_rate * 100)}% of features. Training could unlock significant value.`,
          data_sources: ['performance_insights', 'activation_engine'],
          metrics: {
            feature_usage: `${Math.round(metrics.feature_usage_rate * 100)}%`,
            unused_count: metrics.unused_features.length,
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Schedule feature training',
            'Send feature spotlight emails',
            'Create custom workflow',
          ],
          created_at: new Date().toISOString(),
        });
        // Efficiency gains reduce churn, indirect value
      }
    }

    // 6. Cross-Sell - Unused features that match needs
    if (metrics.unused_features.length > 0 && metrics.health_score >= 70) {
      const confidence = this.calculateConfidence([
        metrics.unused_features.length > 0,
        metrics.health_score >= 70,
        metrics.days_active > 30,
      ]);

      if (confidence >= OPPORTUNITY_CRITERIA.cross_sell.min_confidence) {
        opportunities.push({
          id: `crosssell-${Date.now()}`,
          client_id: '',
          type: 'opportunity',
          category: 'cross_sell',
          severity: 'low',
          title: 'Cross-Sell Opportunity',
          description: `${metrics.unused_features.length} unused features that align with client goals.`,
          data_sources: ['performance_insights'],
          metrics: {
            unused_features: metrics.unused_features.slice(0, 3).join(', '),
            health_score: metrics.health_score,
            confidence: `${Math.round(confidence * 100)}%`,
          },
          recommended_actions: [
            'Demo relevant unused features',
            'Create personalized use cases',
            'Offer feature bundle',
          ],
          created_at: new Date().toISOString(),
        });
        totalRevenuePotential += metrics.monthly_spend * 0.3;
      }
    }

    return {
      client_id: '',
      total_opportunities: opportunities.length,
      high_value_opportunities: opportunities,
      estimated_revenue_potential: Math.round(totalRevenuePotential),
      recommended_actions: this.prioritizeActions(opportunities),
    };
  }

  /**
   * Get aggregated opportunity summary
   */
  aggregateOpportunities(assessments: OpportunityAssessment[]): {
    by_category: Record<OpportunityCategory, number>;
    total_revenue_potential: number;
    top_actions: string[];
    pipeline_summary: {
      immediate: number;
      short_term: number;
      long_term: number;
    };
  } {
    const byCategory: Record<OpportunityCategory, number> = {
      upsell_ready: 0,
      referral_potential: 0,
      case_study_candidate: 0,
      expansion_opportunity: 0,
      efficiency_gain: 0,
      cross_sell: 0,
    };

    let totalRevenue = 0;
    const allActions: string[] = [];

    for (const assessment of assessments) {
      totalRevenue += assessment.estimated_revenue_potential;
      allActions.push(...assessment.recommended_actions);

      for (const opp of assessment.high_value_opportunities) {
        byCategory[opp.category as OpportunityCategory]++;
      }
    }

    // Count unique actions and get top ones
    const actionCounts = new Map<string, number>();
    for (const action of allActions) {
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    }
    const topActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action]) => action);

    return {
      by_category: byCategory,
      total_revenue_potential: totalRevenue,
      top_actions: topActions,
      pipeline_summary: {
        immediate: byCategory.upsell_ready + byCategory.cross_sell,
        short_term: byCategory.expansion_opportunity + byCategory.referral_potential,
        long_term: byCategory.case_study_candidate + byCategory.efficiency_gain,
      },
    };
  }

  // Private helper methods

  private calculateConfidence(indicators: boolean[]): number {
    const trueCount = indicators.filter(Boolean).length;
    return trueCount / indicators.length;
  }

  private prioritizeActions(opportunities: DirectorInsight[]): string[] {
    const actions: string[] = [];

    // Prioritize by revenue potential (upsell, cross-sell first)
    const priorityOrder: OpportunityCategory[] = [
      'upsell_ready',
      'cross_sell',
      'expansion_opportunity',
      'referral_potential',
      'case_study_candidate',
      'efficiency_gain',
    ];

    for (const category of priorityOrder) {
      const opp = opportunities.find((o) => o.category === category);
      if (opp) {
        actions.push(opp.recommended_actions[0]);
      }
    }

    return actions.slice(0, 3);
  }
}

export default AIDirectorOpportunityEngine;
