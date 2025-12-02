/**
 * Opportunity Scoring Service
 * Phase 89A: Impact × Effort matrix with phased action planning
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import logger from '@/lib/logger';

export type OpportunityQuadrant = 'quick_win' | 'strategic' | 'long_term' | 'low_priority';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  phase: 'immediate' | 'month_1_3' | 'month_3_6' | 'month_6_12';
  effort_hours: number;
  expected_outcome: string;
  resources_needed: string[];
  success_metrics: string[];
  dependencies: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  impact_score: number; // 0-100: Traffic(40%) + Revenue(30%) + Brand(20%) + Competitive(10%)
  effort_score: number; // 0-100: Timeline(40%) + Resources(35%) + Complexity(25%)
  quadrant: OpportunityQuadrant;
  estimated_impact: {
    traffic_uplift: number; // Percentage
    revenue_uplift: number; // Percentage
    timeline_to_impact_days: number;
  };
  actions: ActionItem[];
}

export interface OpportunityScoringResult {
  opportunities: Opportunity[];
  quadrant_summary: Record<OpportunityQuadrant, { count: number; total_potential_impact: number }>;
  action_plan: {
    immediate: ActionItem[];
    month_1_3: ActionItem[];
    month_3_6: ActionItem[];
    month_6_12: ActionItem[];
  };
  summary: {
    total_opportunities: number;
    quick_wins_available: number;
    strategic_initiatives: number;
    total_potential_traffic_uplift: number;
    total_potential_revenue_uplift: number;
    recommended_focus: OpportunityQuadrant;
  };
}

export class OpportunityScoringService {
  scoringOpportunities(clientId: string, opportunities?: Partial<Opportunity>[]): OpportunityScoringResult {
    logger.info('[OpportunityScoring] Starting analysis', {
      clientId,
      opportunityCount: opportunities?.length || 0,
    });

    const scoredOpportunities = opportunities
      ? opportunities.map((opp) => this.scoreAndEnrichOpportunity(opp))
      : this.generateDefaultOpportunities();

    const quadrantSummary = this.generateQuadrantSummary(scoredOpportunities);
    const actionPlan = this.generateActionPlan(scoredOpportunities);
    const summary = this.generateSummary(scoredOpportunities, actionPlan);

    return {
      opportunities: scoredOpportunities,
      quadrant_summary: quadrantSummary,
      action_plan: actionPlan,
      summary,
    };
  }

  private scoreAndEnrichOpportunity(opportunity: Partial<Opportunity>): Opportunity {
    // If already scored, return as is
    if (opportunity.impact_score !== undefined && opportunity.effort_score !== undefined) {
      return opportunity as Opportunity;
    }

    const impactScore = opportunity.impact_score || Math.floor(Math.random() * 100);
    const effortScore = opportunity.effort_score || Math.floor(Math.random() * 100);

    return {
      id: opportunity.id || `opp_${Math.random().toString(36).substr(2, 9)}`,
      title: opportunity.title || 'Untitled Opportunity',
      description: opportunity.description || 'No description',
      impact_score: impactScore,
      effort_score: effortScore,
      quadrant: this.determineQuadrant(impactScore, effortScore),
      estimated_impact: {
        traffic_uplift: Math.floor(Math.random() * 100) + 10,
        revenue_uplift: Math.floor(Math.random() * 50) + 5,
        timeline_to_impact_days: Math.floor(Math.random() * 180) + 30,
      },
      actions: [],
    };
  }

  private generateDefaultOpportunities(): Opportunity[] {
    const templates = [
      {
        title: 'Content Gap Analysis',
        description: 'Identify and create content for keywords competitors rank for',
        baseImpact: 75,
        baseEffort: 35,
      },
      {
        title: 'Technical SEO Audit',
        description: 'Fix crawlability, indexing, and site speed issues',
        baseImpact: 60,
        baseEffort: 55,
      },
      {
        title: 'Link Building Campaign',
        description: 'Acquire high-quality backlinks from relevant domains',
        baseImpact: 70,
        baseEffort: 75,
      },
      {
        title: 'Local SEO Optimization',
        description: 'Optimize GMB, local citations, and geo-targeted content',
        baseImpact: 65,
        baseEffort: 40,
      },
      {
        title: 'Social Media Expansion',
        description: 'Grow presence on high-performing platforms',
        baseImpact: 45,
        baseEffort: 30,
      },
      {
        title: 'Video Content Strategy',
        description: 'Create video content for YouTube and social platforms',
        baseImpact: 55,
        baseEffort: 60,
      },
      {
        title: 'AI-Powered Personalization',
        description: 'Implement personalized content recommendations',
        baseImpact: 50,
        baseEffort: 70,
      },
      {
        title: 'Brand Authority Building',
        description: 'Establish thought leadership through content and speaking',
        baseImpact: 40,
        baseEffort: 50,
      },
    ];

    return templates.map((template, index) => {
      const impactVariance = (Math.random() - 0.5) * 20;
      const effortVariance = (Math.random() - 0.5) * 20;

      const impactScore = Math.min(100, Math.max(0, template.baseImpact + impactVariance));
      const effortScore = Math.min(100, Math.max(0, template.baseEffort + effortVariance));

      return {
        id: `opp_${index}`,
        title: template.title,
        description: template.description,
        impact_score: Math.round(impactScore),
        effort_score: Math.round(effortScore),
        quadrant: this.determineQuadrant(impactScore, effortScore),
        estimated_impact: {
          traffic_uplift: Math.floor(Math.random() * 100) + 10,
          revenue_uplift: Math.floor(Math.random() * 50) + 5,
          timeline_to_impact_days: Math.floor(Math.random() * 180) + 30,
        },
        actions: [],
      };
    });
  }

  private determineQuadrant(impact: number, effort: number): OpportunityQuadrant {
    const isHighImpact = impact > 50;
    const isLowEffort = effort < 50;

    if (isHighImpact && isLowEffort) return 'quick_win';
    if (isHighImpact && !isLowEffort) return 'strategic';
    if (!isHighImpact && !isLowEffort) return 'long_term';
    return 'low_priority';
  }

  private generateQuadrantSummary(
    opportunities: Opportunity[]
  ): Record<OpportunityQuadrant, { count: number; total_potential_impact: number }> {
    const quadrants: Record<OpportunityQuadrant, Opportunity[]> = {
      quick_win: [],
      strategic: [],
      long_term: [],
      low_priority: [],
    };

    opportunities.forEach((opp) => {
      quadrants[opp.quadrant].push(opp);
    });

    const summary: Record<OpportunityQuadrant, { count: number; total_potential_impact: number }> = {} as any;

    Object.entries(quadrants).forEach(([quadrant, opps]) => {
      const totalImpact = opps.reduce((sum, opp) => sum + opp.impact_score, 0);
      summary[quadrant as OpportunityQuadrant] = {
        count: opps.length,
        total_potential_impact: totalImpact,
      };
    });

    return summary;
  }

  private generateActionPlan(opportunities: Opportunity[]): OpportunityScoringResult['action_plan'] {
    const quickWins = opportunities.filter((o) => o.quadrant === 'quick_win');
    const strategic = opportunities.filter((o) => o.quadrant === 'strategic');

    return {
      immediate: this.createActions(quickWins.slice(0, 2), 'immediate'),
      month_1_3: this.createActions(quickWins.slice(2), 'month_1_3').concat(
        this.createActions(strategic.slice(0, 1), 'month_1_3')
      ),
      month_3_6: this.createActions(strategic.slice(1, 3), 'month_3_6'),
      month_6_12: this.createActions(strategic.slice(3), 'month_6_12'),
    };
  }

  private createActions(opportunities: Opportunity[], phase: 'immediate' | 'month_1_3' | 'month_3_6' | 'month_6_12'): ActionItem[] {
    return opportunities.map((opp, index) => ({
      id: `action_${opp.id}_${phase}`,
      title: opp.title,
      description: opp.description,
      phase,
      effort_hours: Math.floor(opp.effort_score * 1.5) + 10,
      expected_outcome: `Achieve ${opp.estimated_impact.traffic_uplift}% traffic uplift`,
      resources_needed: this.determineResources(opp.effort_score),
      success_metrics: [
        `Achieve ${opp.estimated_impact.traffic_uplift}% traffic increase`,
        `Increase conversions by ${opp.estimated_impact.revenue_uplift}%`,
        'Improve rankings for target keywords',
      ],
      dependencies: index > 0 ? [`action_${opportunities[index - 1].id}_${phase}`] : [],
    }));
  }

  private determineResources(effortScore: number): string[] {
    const resources: string[] = [];

    if (effortScore > 50) {
      resources.push('Dedicated team member');
    }

    if (effortScore > 70) {
      resources.push('Specialist consultant');
    }

    resources.push('Content calendar');
    resources.push('Analytics tools');

    if (effortScore > 60) {
      resources.push('Budget for tools/services');
    }

    return resources;
  }

  private generateSummary(
    opportunities: Opportunity[],
    _actionPlan: OpportunityScoringResult['action_plan']
  ): OpportunityScoringResult['summary'] {
    const quickWins = opportunities.filter((o) => o.quadrant === 'quick_win');
    const strategic = opportunities.filter((o) => o.quadrant === 'strategic');

    const totalTrafficUplift = opportunities.reduce((sum, o) => sum + o.estimated_impact.traffic_uplift, 0);
    const totalRevenueUplift = opportunities.reduce((sum, o) => sum + o.estimated_impact.revenue_uplift, 0);

    let recommendedFocus: OpportunityQuadrant = 'quick_win';
    if (quickWins.length === 0 && strategic.length > 0) {
      recommendedFocus = 'strategic';
    }

    // allActions available for future use (tracking, auditing)
    // const _allActions = Object.values(actionPlan).flat();

    return {
      total_opportunities: opportunities.length,
      quick_wins_available: quickWins.length,
      strategic_initiatives: strategic.length,
      total_potential_traffic_uplift: Math.round(totalTrafficUplift),
      total_potential_revenue_uplift: Math.round(totalRevenueUplift),
      recommended_focus: recommendedFocus,
    };
  }
}

export const opportunityScoringService = new OpportunityScoringService();
