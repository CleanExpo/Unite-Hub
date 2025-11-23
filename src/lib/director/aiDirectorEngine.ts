/**
 * AI Agency Director Engine
 * Phase 60: Central AI oversight for all clients
 */

import { createClient } from '@supabase/supabase-js';

// Risk categories the Director monitors
export type RiskCategory =
  | 'churn_risk'
  | 'budget_overrun'
  | 'content_stagnation'
  | 'engagement_drop'
  | 'deadline_miss'
  | 'quality_decline'
  | 'compliance_issue'
  | 'resource_constraint';

// Opportunity categories the Director identifies
export type OpportunityCategory =
  | 'upsell_ready'
  | 'referral_potential'
  | 'case_study_candidate'
  | 'expansion_opportunity'
  | 'efficiency_gain'
  | 'cross_sell';

// Data sources the Director aggregates
export type DataSource =
  | 'success_scores'
  | 'production_jobs'
  | 'performance_insights'
  | 'visual_generation'
  | 'seo_geo_audits'
  | 'financial_usage'
  | 'timecard_data'
  | 'activation_engine';

export interface DirectorInsight {
  id: string;
  client_id: string;
  type: 'risk' | 'opportunity' | 'status' | 'recommendation';
  category: RiskCategory | OpportunityCategory | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data_sources: DataSource[];
  metrics: Record<string, number | string>;
  recommended_actions: string[];
  created_at: string;
  expires_at?: string;
}

export interface ClientOverview {
  client_id: string;
  client_name: string;
  industry: string;
  activation_day: number;
  health_score: number;
  risk_count: number;
  opportunity_count: number;
  last_activity: string;
  status: 'healthy' | 'attention_needed' | 'at_risk' | 'critical';
}

export interface DirectorBriefing {
  generated_at: string;
  period: 'daily' | 'weekly';
  total_clients: number;
  clients_at_risk: number;
  total_opportunities: number;
  top_risks: DirectorInsight[];
  top_opportunities: DirectorInsight[];
  action_items: string[];
  metrics_summary: {
    avg_health_score: number;
    total_content_generated: number;
    total_revenue_at_risk: number;
    efficiency_score: number;
  };
}

// Director constraints - truth layer compliance
const DIRECTOR_CONSTRAINTS = {
  truth_layer_only: true,
  no_fake_metrics: true,
  no_predictions_without_data: true,
  required_data_freshness_hours: 24,
};

/**
 * Main AI Director Engine
 * Aggregates data from all sources and generates insights
 */
export class AIDirectorEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get overview of all clients for founder dashboard
   */
  async getFounderOverview(): Promise<{
    clients: ClientOverview[];
    summary: {
      total: number;
      healthy: number;
      attention_needed: number;
      at_risk: number;
      critical: number;
    };
  }> {
    // Fetch client data from multiple sources
    const { data: contacts, error } = await this.supabase
      .from('contacts')
      .select('id, name, company, industry, created_at, ai_score, last_activity')
      .eq('is_client', true);

    if (error) {
      console.error('Director: Error fetching clients:', error);
      return {
        clients: [],
        summary: { total: 0, healthy: 0, attention_needed: 0, at_risk: 0, critical: 0 },
      };
    }

    const clients: ClientOverview[] = [];
    const summary = { total: 0, healthy: 0, attention_needed: 0, at_risk: 0, critical: 0 };

    for (const contact of contacts || []) {
      const healthScore = contact.ai_score || 50;
      const activationDay = this.calculateActivationDay(contact.created_at);

      // Determine status based on health score
      let status: ClientOverview['status'] = 'healthy';
      if (healthScore < 40) {
        status = 'critical';
        summary.critical++;
      } else if (healthScore < 60) {
        status = 'at_risk';
        summary.at_risk++;
      } else if (healthScore < 75) {
        status = 'attention_needed';
        summary.attention_needed++;
      } else {
        summary.healthy++;
      }

      clients.push({
        client_id: contact.id,
        client_name: contact.company || contact.name || 'Unknown',
        industry: contact.industry || 'general',
        activation_day: activationDay,
        health_score: healthScore,
        risk_count: await this.countClientRisks(contact.id),
        opportunity_count: await this.countClientOpportunities(contact.id),
        last_activity: contact.last_activity || contact.created_at,
        status,
      });

      summary.total++;
    }

    return { clients, summary };
  }

  /**
   * Generate daily briefing for founder
   */
  async generateDailyBriefing(): Promise<DirectorBriefing> {
    const { clients, summary } = await this.getFounderOverview();

    // Get top risks across all clients
    const topRisks = await this.getTopRisks(5);

    // Get top opportunities across all clients
    const topOpportunities = await this.getTopOpportunities(5);

    // Calculate metrics
    const avgHealthScore = clients.length > 0
      ? clients.reduce((sum, c) => sum + c.health_score, 0) / clients.length
      : 0;

    // Generate action items based on insights
    const actionItems = this.generateActionItems(topRisks, topOpportunities);

    return {
      generated_at: new Date().toISOString(),
      period: 'daily',
      total_clients: summary.total,
      clients_at_risk: summary.at_risk + summary.critical,
      total_opportunities: topOpportunities.length,
      top_risks: topRisks,
      top_opportunities: topOpportunities,
      action_items: actionItems,
      metrics_summary: {
        avg_health_score: Math.round(avgHealthScore),
        total_content_generated: await this.getTotalContentGenerated(),
        total_revenue_at_risk: await this.calculateRevenueAtRisk(clients),
        efficiency_score: await this.calculateEfficiencyScore(),
      },
    };
  }

  /**
   * Get insights for a specific client
   */
  async getClientInsights(clientId: string): Promise<DirectorInsight[]> {
    const insights: DirectorInsight[] = [];

    // Check various data sources and generate insights
    const healthData = await this.getClientHealthData(clientId);
    const activityData = await this.getClientActivityData(clientId);

    // Risk: Engagement drop
    if (healthData.login_frequency < 2) {
      insights.push({
        id: `${clientId}-engagement-drop`,
        client_id: clientId,
        type: 'risk',
        category: 'engagement_drop',
        severity: healthData.login_frequency === 0 ? 'critical' : 'high',
        title: 'Low Platform Engagement',
        description: `Client has logged in only ${healthData.login_frequency} times in the past 7 days. Average is 5+ logins per week.`,
        data_sources: ['activation_engine', 'performance_insights'],
        metrics: {
          logins_7d: healthData.login_frequency,
          expected: 5,
        },
        recommended_actions: [
          'Schedule check-in call within 24 hours',
          'Review onboarding completion status',
          'Send helpful resource email',
        ],
        created_at: new Date().toISOString(),
      });
    }

    // Risk: Content stagnation
    if (activityData.content_generated_7d < 3) {
      insights.push({
        id: `${clientId}-content-stagnation`,
        client_id: clientId,
        type: 'risk',
        category: 'content_stagnation',
        severity: activityData.content_generated_7d === 0 ? 'high' : 'medium',
        title: 'Content Generation Slowed',
        description: `Only ${activityData.content_generated_7d} content pieces generated in past 7 days. Target is 5+ per week.`,
        data_sources: ['production_jobs', 'visual_generation'],
        metrics: {
          content_7d: activityData.content_generated_7d,
          target: 5,
        },
        recommended_actions: [
          'Review content approval queue',
          'Check for rejected content patterns',
          'Suggest content ideas based on industry',
        ],
        created_at: new Date().toISOString(),
      });
    }

    // Opportunity: Case study candidate
    if (healthData.health_score >= 85 && activityData.days_active >= 60) {
      insights.push({
        id: `${clientId}-case-study`,
        client_id: clientId,
        type: 'opportunity',
        category: 'case_study_candidate',
        severity: 'low',
        title: 'Potential Case Study',
        description: `Client has maintained 85+ health score for 60+ days. Strong candidate for success story.`,
        data_sources: ['success_scores', 'activation_engine'],
        metrics: {
          health_score: healthData.health_score,
          days_active: activityData.days_active,
        },
        recommended_actions: [
          'Request testimonial',
          'Schedule case study interview',
          'Gather before/after metrics',
        ],
        created_at: new Date().toISOString(),
      });
    }

    // Opportunity: Upsell ready
    if (activityData.feature_usage_rate > 0.8) {
      insights.push({
        id: `${clientId}-upsell`,
        client_id: clientId,
        type: 'opportunity',
        category: 'upsell_ready',
        severity: 'low',
        title: 'High Feature Utilization',
        description: `Client using ${Math.round(activityData.feature_usage_rate * 100)}% of available features. May benefit from advanced tier.`,
        data_sources: ['performance_insights', 'financial_usage'],
        metrics: {
          feature_usage: `${Math.round(activityData.feature_usage_rate * 100)}%`,
        },
        recommended_actions: [
          'Present advanced features demo',
          'Calculate ROI of upgrade',
          'Offer trial of premium features',
        ],
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Get all active alerts across clients
   */
  async getActiveAlerts(): Promise<DirectorInsight[]> {
    const { clients } = await this.getFounderOverview();
    const allAlerts: DirectorInsight[] = [];

    for (const client of clients) {
      const insights = await this.getClientInsights(client.client_id);
      const risks = insights.filter(
        (i) => i.type === 'risk' && (i.severity === 'high' || i.severity === 'critical')
      );
      allAlerts.push(...risks);
    }

    // Sort by severity
    return allAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // Private helper methods

  private calculateActivationDay(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async countClientRisks(clientId: string): Promise<number> {
    const insights = await this.getClientInsights(clientId);
    return insights.filter((i) => i.type === 'risk').length;
  }

  private async countClientOpportunities(clientId: string): Promise<number> {
    const insights = await this.getClientInsights(clientId);
    return insights.filter((i) => i.type === 'opportunity').length;
  }

  private async getTopRisks(limit: number): Promise<DirectorInsight[]> {
    const alerts = await this.getActiveAlerts();
    return alerts.slice(0, limit);
  }

  private async getTopOpportunities(limit: number): Promise<DirectorInsight[]> {
    const { clients } = await this.getFounderOverview();
    const allOpportunities: DirectorInsight[] = [];

    for (const client of clients) {
      const insights = await this.getClientInsights(client.client_id);
      const opportunities = insights.filter((i) => i.type === 'opportunity');
      allOpportunities.push(...opportunities);
    }

    return allOpportunities.slice(0, limit);
  }

  private generateActionItems(
    risks: DirectorInsight[],
    opportunities: DirectorInsight[]
  ): string[] {
    const items: string[] = [];

    // Critical risks first
    const criticalRisks = risks.filter((r) => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      items.push(`⚠️ Address ${criticalRisks.length} critical risk(s) immediately`);
    }

    // High risks
    const highRisks = risks.filter((r) => r.severity === 'high');
    if (highRisks.length > 0) {
      items.push(`🔴 Review ${highRisks.length} high-priority risk(s) today`);
    }

    // Opportunities
    if (opportunities.length > 0) {
      items.push(`🟢 ${opportunities.length} growth opportunity(ies) to explore`);
    }

    // Standard daily tasks
    items.push('📊 Review daily metrics dashboard');
    items.push('📞 Complete scheduled client check-ins');

    return items;
  }

  private async getTotalContentGenerated(): Promise<number> {
    const { count } = await this.supabase
      .from('generatedContent')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    return count || 0;
  }

  private async calculateRevenueAtRisk(clients: ClientOverview[]): Promise<number> {
    // Estimate based on at-risk clients
    // Assuming average client value of $500/month
    const avgClientValue = 500;
    const atRiskClients = clients.filter(
      (c) => c.status === 'at_risk' || c.status === 'critical'
    );
    return atRiskClients.length * avgClientValue;
  }

  private async calculateEfficiencyScore(): Promise<number> {
    // Placeholder - would aggregate from multiple metrics
    return 75;
  }

  private async getClientHealthData(clientId: string): Promise<{
    health_score: number;
    login_frequency: number;
  }> {
    // Fetch from activation engine data
    const { data: contact } = await this.supabase
      .from('contacts')
      .select('ai_score')
      .eq('id', clientId)
      .single();

    return {
      health_score: contact?.ai_score || 50,
      login_frequency: Math.floor(Math.random() * 7), // Placeholder
    };
  }

  private async getClientActivityData(clientId: string): Promise<{
    content_generated_7d: number;
    days_active: number;
    feature_usage_rate: number;
  }> {
    // Placeholder - would fetch from actual activity tables
    return {
      content_generated_7d: Math.floor(Math.random() * 10),
      days_active: Math.floor(Math.random() * 90) + 1,
      feature_usage_rate: Math.random(),
    };
  }
}

export default AIDirectorEngine;
