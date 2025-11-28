/**
 * Weekly Digest Service
 *
 * Generates structured weekly digests and stores them in founder_weekly_digests.
 * Supports re-generation and historical browsing.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { momentumScoringService, type MomentumScore } from './momentumScoringService';
import { patternExtractionService, type CrossClientPattern } from './patternExtractionService';
import { opportunityConsolidationService } from './opportunityConsolidationService';
import { riskAnalysisService } from './riskAnalysisService';

// Types
export interface WeeklyDigest {
  id: string;
  founderId: string;
  workspaceId: string;
  weekStart: Date;
  weekEnd: Date;
  headlineSummary: string;
  winsJson: DigestWin[];
  risksJson: DigestRisk[];
  opportunitiesJson: DigestOpportunity[];
  focusRecommendationsJson: DigestRecommendation[];
  momentumSnapshotJson: MomentumSnapshot;
  patternsDetectedJson: PatternSummary[];
  keyMetricsJson: KeyMetrics;
  deliveredAt?: Date;
  deliveryMethod?: 'dashboard' | 'email' | 'both';
  readAt?: Date;
  createdAt: Date;
}

export interface DigestWin {
  title: string;
  description: string;
  impact: string;
  relatedTo?: string;
}

export interface DigestRisk {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

export interface DigestOpportunity {
  title: string;
  description: string;
  value: string;
  nextStep: string;
}

export interface DigestRecommendation {
  area: string;
  recommendation: string;
  priority: number;
  rationale: string;
}

export interface MomentumSnapshot {
  overall: number;
  marketing: number;
  sales: number;
  delivery: number;
  product: number;
  clients: number;
  engineering: number;
  finance: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface PatternSummary {
  type: string;
  title: string;
  strength: number;
}

export interface KeyMetrics {
  totalClients: number;
  newClients: number;
  totalPreClients: number;
  activeCampaigns: number;
  emailsSent: number;
  emailsReceived: number;
  opportunitiesCreated: number;
  risksIdentified: number;
}

export interface DigestConfig {
  founderId: string;
  workspaceId: string;
  weekStart?: Date;
  weekEnd?: Date;
  includeAISummary?: boolean;
  deliveryMethod?: 'dashboard' | 'email' | 'both';
}

class WeeklyDigestService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Generate a weekly digest
   */
  async generateDigest(config: DigestConfig): Promise<WeeklyDigest> {
    const {
      founderId,
      workspaceId,
      weekEnd = new Date(),
      includeAISummary = true,
      deliveryMethod = 'dashboard',
    } = config;

    // Calculate week start (Monday) and end (Sunday)
    const weekStart = config.weekStart || this.getWeekStart(weekEnd);
    const actualWeekEnd = this.getWeekEnd(weekStart);

    // Check for existing digest
    const existing = await this.getDigestByWeek(founderId, workspaceId, weekStart);
    if (existing) {
      // Update and return existing
      return this.regenerateDigest(existing.id, workspaceId);
    }

    // Gather all data for the week
    const [wins, risks, opportunities, momentum, patterns, metrics] = await Promise.all([
      this.gatherWins(workspaceId, weekStart, actualWeekEnd),
      this.gatherRisks(founderId, workspaceId),
      this.gatherOpportunities(founderId, workspaceId),
      this.gatherMomentum(founderId, workspaceId),
      this.gatherPatterns(founderId, workspaceId),
      this.gatherMetrics(workspaceId, weekStart, actualWeekEnd),
    ]);

    // Generate AI summary and recommendations
    let headlineSummary = 'Weekly summary generated';
    let focusRecommendations: DigestRecommendation[] = [];

    if (includeAISummary) {
      const aiContent = await this.generateAIContent(
        wins,
        risks,
        opportunities,
        momentum,
        metrics
      );
      headlineSummary = aiContent.headline;
      focusRecommendations = aiContent.recommendations;
    }

    // Save digest
    const { data, error } = await supabaseAdmin
      .from('founder_weekly_digests')
      .insert({
        founder_id: founderId,
        workspace_id: workspaceId,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: actualWeekEnd.toISOString().split('T')[0],
        headline_summary: headlineSummary,
        wins_json: wins,
        risks_json: risks,
        opportunities_json: opportunities,
        focus_recommendations_json: focusRecommendations,
        momentum_snapshot_json: momentum,
        patterns_detected_json: patterns,
        key_metrics_json: metrics,
        delivery_method: deliveryMethod,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to save digest: ${error?.message}`);
    }

    return this.mapDbToDigest(data);
  }

  /**
   * Get week start (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get week end (Sunday)
   */
  private getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Gather wins from the week
   */
  private async gatherWins(
    workspaceId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<DigestWin[]> {
    const wins: DigestWin[] = [];

    // New clients
    const { data: newContacts } = await supabaseAdmin
      .from('contacts')
      .select('name, email, company')
      .eq('workspace_id', workspaceId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    if (newContacts && newContacts.length > 0) {
      wins.push({
        title: `${newContacts.length} new contact${newContacts.length > 1 ? 's' : ''} added`,
        description: `New contacts: ${newContacts.slice(0, 3).map((c) => c.name || c.email).join(', ')}${newContacts.length > 3 ? '...' : ''}`,
        impact: 'Pipeline growth',
        relatedTo: 'contacts',
      });
    }

    // Completed campaigns
    const { data: completedCampaigns } = await supabaseAdmin
      .from('campaigns')
      .select('name, open_rate, click_rate')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('updated_at', weekStart.toISOString())
      .lte('updated_at', weekEnd.toISOString());

    if (completedCampaigns && completedCampaigns.length > 0) {
      for (const campaign of completedCampaigns.slice(0, 2)) {
        wins.push({
          title: `Campaign completed: ${campaign.name}`,
          description: `Open rate: ${((campaign.open_rate || 0) * 100).toFixed(1)}%, Click rate: ${((campaign.click_rate || 0) * 100).toFixed(1)}%`,
          impact: 'Marketing execution',
          relatedTo: 'campaigns',
        });
      }
    }

    // Positive sentiment emails
    const { count: positiveEmails } = await supabaseAdmin
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('direction', 'inbound')
      .gte('sentiment_score', 0.7)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    if ((positiveEmails || 0) > 5) {
      wins.push({
        title: `${positiveEmails} positive client interactions`,
        description: 'High sentiment score emails received',
        impact: 'Client satisfaction',
        relatedTo: 'emails',
      });
    }

    return wins.slice(0, 5);
  }

  /**
   * Gather active risks
   */
  private async gatherRisks(founderId: string, workspaceId: string): Promise<DigestRisk[]> {
    const risks = await riskAnalysisService.getActiveRisks(founderId, workspaceId, 5);

    return risks.map((r) => ({
      title: r.title,
      description: r.description || 'Risk identified',
      severity: r.riskScore >= 0.7 ? 'critical' : r.riskScore >= 0.5 ? 'high' : r.riskScore >= 0.3 ? 'medium' : 'low',
      status: r.mitigationStatus,
    }));
  }

  /**
   * Gather top opportunities
   */
  private async gatherOpportunities(founderId: string, workspaceId: string): Promise<DigestOpportunity[]> {
    const opportunities = await opportunityConsolidationService.getTopOpportunities(founderId, workspaceId, 5);

    return opportunities.map((o) => ({
      title: o.title,
      description: o.description || 'Opportunity identified',
      value: `Score: ${o.estimatedValueScore}`,
      nextStep: o.status === 'open' ? 'Review and evaluate' : 'Continue evaluation',
    }));
  }

  /**
   * Gather momentum data
   */
  private async gatherMomentum(founderId: string, workspaceId: string): Promise<MomentumSnapshot> {
    const momentum = await momentumScoringService.getLatestMomentum(founderId, workspaceId);

    if (!momentum) {
      return {
        overall: 50,
        marketing: 50,
        sales: 50,
        delivery: 50,
        product: 50,
        clients: 50,
        engineering: 50,
        finance: 50,
        trend: 'stable',
      };
    }

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const trendSum =
      momentum.marketingTrend +
      momentum.salesTrend +
      momentum.deliveryTrend +
      momentum.clientsTrend;
    if (trendSum > 1) trend = 'improving';
    else if (trendSum < -1) trend = 'declining';

    return {
      overall: momentum.overallScore,
      marketing: momentum.marketingScore,
      sales: momentum.salesScore,
      delivery: momentum.deliveryScore,
      product: momentum.productScore,
      clients: momentum.clientsScore,
      engineering: momentum.engineeringScore,
      finance: momentum.financeScore,
      trend,
    };
  }

  /**
   * Gather detected patterns
   */
  private async gatherPatterns(founderId: string, workspaceId: string): Promise<PatternSummary[]> {
    const patterns = await patternExtractionService.getPatterns(founderId, workspaceId, {
      status: 'active',
      minStrength: 0.5,
      limit: 5,
    });

    return patterns.map((p) => ({
      type: p.patternType,
      title: p.title,
      strength: p.strengthScore,
    }));
  }

  /**
   * Gather key metrics
   */
  private async gatherMetrics(
    workspaceId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<KeyMetrics> {
    const [
      { count: totalClients },
      { count: newClients },
      { count: totalPreClients },
      { count: activeCampaigns },
      { count: emailsSent },
      { count: emailsReceived },
    ] = await Promise.all([
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      supabaseAdmin
        .from('pre_clients')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabaseAdmin
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('emails')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('direction', 'outbound')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      supabaseAdmin
        .from('emails')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('direction', 'inbound')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
    ]);

    return {
      totalClients: totalClients || 0,
      newClients: newClients || 0,
      totalPreClients: totalPreClients || 0,
      activeCampaigns: activeCampaigns || 0,
      emailsSent: emailsSent || 0,
      emailsReceived: emailsReceived || 0,
      opportunitiesCreated: 0, // Could track if needed
      risksIdentified: 0,
    };
  }

  /**
   * Generate AI content (headline and recommendations)
   */
  private async generateAIContent(
    wins: DigestWin[],
    risks: DigestRisk[],
    opportunities: DigestOpportunity[],
    momentum: MomentumSnapshot,
    metrics: KeyMetrics
  ): Promise<{ headline: string; recommendations: DigestRecommendation[] }> {
    try {
      const prompt = `Generate a weekly business digest summary.

WINS THIS WEEK:
${wins.map((w) => `- ${w.title}: ${w.description}`).join('\n') || 'No major wins recorded'}

ACTIVE RISKS:
${risks.map((r) => `- [${r.severity}] ${r.title}`).join('\n') || 'No active risks'}

TOP OPPORTUNITIES:
${opportunities.map((o) => `- ${o.title} (${o.value})`).join('\n') || 'No opportunities in backlog'}

MOMENTUM:
- Overall: ${momentum.overall}% (${momentum.trend})
- Key areas: Marketing ${momentum.marketing}%, Sales ${momentum.sales}%, Clients ${momentum.clients}%

METRICS:
- Total clients: ${metrics.totalClients} (+${metrics.newClients} new)
- Emails: ${metrics.emailsSent} sent, ${metrics.emailsReceived} received
- Active campaigns: ${metrics.activeCampaigns}

Generate:
1. A compelling headline summary (1-2 sentences)
2. 3-4 focus recommendations for next week

Return JSON:
{
  "headline": "Your headline here",
  "recommendations": [
    {"area": "Sales", "recommendation": "specific action", "priority": 1, "rationale": "why"},
    {"area": "Marketing", "recommendation": "specific action", "priority": 2, "rationale": "why"}
  ]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) throw new Error('No response');

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');

      const result = JSON.parse(jsonMatch[0]);

      return {
        headline: result.headline,
        recommendations: result.recommendations as DigestRecommendation[],
      };
    } catch (error) {
      console.error('[WeeklyDigest] AI content generation failed:', error);
      return {
        headline: `Week ending ${new Date().toLocaleDateString()}: ${wins.length} wins, ${risks.length} risks to address`,
        recommendations: [
          {
            area: 'General',
            recommendation: 'Review and address active risks',
            priority: 1,
            rationale: 'Risk mitigation is critical for stability',
          },
        ],
      };
    }
  }

  /**
   * Get digest by week
   */
  async getDigestByWeek(founderId: string, workspaceId: string, weekStart: Date): Promise<WeeklyDigest | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_weekly_digests')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single();

    if (error || !data) return null;
    return this.mapDbToDigest(data);
  }

  /**
   * Get latest digest
   */
  async getLatestDigest(founderId: string, workspaceId: string): Promise<WeeklyDigest | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_weekly_digests')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('week_start', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapDbToDigest(data);
  }

  /**
   * List digests
   */
  async listDigests(founderId: string, workspaceId: string, limit = 12): Promise<WeeklyDigest[]> {
    const { data, error } = await supabaseAdmin
      .from('founder_weekly_digests')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapDbToDigest);
  }

  /**
   * Regenerate digest
   */
  async regenerateDigest(digestId: string, workspaceId: string): Promise<WeeklyDigest> {
    const { data: existing } = await supabaseAdmin
      .from('founder_weekly_digests')
      .select('founder_id, week_start, week_end')
      .eq('id', digestId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!existing) {
      throw new Error('Digest not found');
    }

    // Delete existing
    await supabaseAdmin
      .from('founder_weekly_digests')
      .delete()
      .eq('id', digestId);

    // Generate fresh
    return this.generateDigest({
      founderId: existing.founder_id,
      workspaceId,
      weekStart: new Date(existing.week_start),
      weekEnd: new Date(existing.week_end),
    });
  }

  /**
   * Mark digest as read
   */
  async markAsRead(digestId: string, workspaceId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('founder_weekly_digests')
      .update({ read_at: new Date().toISOString() })
      .eq('id', digestId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Handle orchestrator intent
   */
  async handleGenerateWeeklyDigestIntent(
    founderId: string,
    workspaceId: string,
    options?: { weekStart?: Date }
  ): Promise<{
    success: boolean;
    digest?: WeeklyDigest;
    error?: string;
  }> {
    try {
      const digest = await this.generateDigest({
        founderId,
        workspaceId,
        weekStart: options?.weekStart,
        includeAISummary: true,
      });

      return { success: true, digest };
    } catch (error) {
      console.error('[WeeklyDigest] Intent handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map database record to typed object
   */
  private mapDbToDigest(record: Record<string, unknown>): WeeklyDigest {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      weekStart: new Date(record.week_start as string),
      weekEnd: new Date(record.week_end as string),
      headlineSummary: record.headline_summary as string,
      winsJson: record.wins_json as DigestWin[],
      risksJson: record.risks_json as DigestRisk[],
      opportunitiesJson: record.opportunities_json as DigestOpportunity[],
      focusRecommendationsJson: record.focus_recommendations_json as DigestRecommendation[],
      momentumSnapshotJson: record.momentum_snapshot_json as MomentumSnapshot,
      patternsDetectedJson: record.patterns_detected_json as PatternSummary[],
      keyMetricsJson: record.key_metrics_json as KeyMetrics,
      deliveredAt: record.delivered_at ? new Date(record.delivered_at as string) : undefined,
      deliveryMethod: record.delivery_method as WeeklyDigest['deliveryMethod'],
      readAt: record.read_at ? new Date(record.read_at as string) : undefined,
      createdAt: new Date(record.created_at as string),
    };
  }
}

export const weeklyDigestService = new WeeklyDigestService();
