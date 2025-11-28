/**
 * Momentum Scoring Service
 *
 * Computes momentum scores across business domains:
 * Marketing, Sales, Delivery, Product, Clients, Engineering, Finance
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';

// Types
export type MomentumDomain =
  | 'marketing'
  | 'sales'
  | 'delivery'
  | 'product'
  | 'clients'
  | 'engineering'
  | 'finance';

export type TrendDirection = -1 | 0 | 1; // -1=declining, 0=stable, 1=improving

export interface MomentumScore {
  id: string;
  founderId: string;
  workspaceId: string;
  periodStart: Date;
  periodEnd: Date;
  marketingScore: number;
  salesScore: number;
  deliveryScore: number;
  productScore: number;
  clientsScore: number;
  engineeringScore: number;
  financeScore: number;
  overallScore: number;
  marketingTrend: TrendDirection;
  salesTrend: TrendDirection;
  deliveryTrend: TrendDirection;
  productTrend: TrendDirection;
  clientsTrend: TrendDirection;
  engineeringTrend: TrendDirection;
  financeTrend: TrendDirection;
  notesJson: DomainNotes;
  inputSignalsJson: InputSignals;
  createdAt: Date;
}

export interface DomainNotes {
  marketing?: string;
  sales?: string;
  delivery?: string;
  product?: string;
  clients?: string;
  engineering?: string;
  finance?: string;
}

export interface InputSignals {
  marketing?: SignalSummary;
  sales?: SignalSummary;
  delivery?: SignalSummary;
  product?: SignalSummary;
  clients?: SignalSummary;
  engineering?: SignalSummary;
  finance?: SignalSummary;
}

export interface SignalSummary {
  sources: string[];
  counts: Record<string, number>;
  highlights: string[];
}

export interface MomentumConfig {
  founderId: string;
  workspaceId: string;
  periodStart?: Date;
  periodEnd?: Date;
  generateNotes?: boolean;
}

export interface DomainMetrics {
  domain: MomentumDomain;
  score: number;
  trend: TrendDirection;
  signals: SignalSummary;
  notes?: string;
}

class MomentumScoringService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Calculate momentum scores for all domains
   */
  async calculateMomentum(config: MomentumConfig): Promise<MomentumScore> {
    const {
      founderId,
      workspaceId,
      periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      periodEnd = new Date(),
      generateNotes = true,
    } = config;

    // Calculate each domain's momentum
    const [marketing, sales, delivery, product, clients, engineering, finance] =
      await Promise.all([
        this.calculateMarketingMomentum(workspaceId, periodStart, periodEnd),
        this.calculateSalesMomentum(workspaceId, periodStart, periodEnd),
        this.calculateDeliveryMomentum(workspaceId, periodStart, periodEnd),
        this.calculateProductMomentum(workspaceId, periodStart, periodEnd),
        this.calculateClientsMomentum(workspaceId, periodStart, periodEnd),
        this.calculateEngineeringMomentum(workspaceId, periodStart, periodEnd),
        this.calculateFinanceMomentum(workspaceId, periodStart, periodEnd),
      ]);

    // Get previous period for trend calculation
    const previousPeriodStart = new Date(periodStart);
    const previousPeriodEnd = new Date(periodStart);
    const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);

    const previousScores = await this.getPreviousMomentum(founderId, workspaceId, previousPeriodEnd);

    // Calculate trends
    const marketingTrend = this.calculateTrend(marketing.score, previousScores?.marketingScore);
    const salesTrend = this.calculateTrend(sales.score, previousScores?.salesScore);
    const deliveryTrend = this.calculateTrend(delivery.score, previousScores?.deliveryScore);
    const productTrend = this.calculateTrend(product.score, previousScores?.productScore);
    const clientsTrend = this.calculateTrend(clients.score, previousScores?.clientsScore);
    const engineeringTrend = this.calculateTrend(engineering.score, previousScores?.engineeringScore);
    const financeTrend = this.calculateTrend(finance.score, previousScores?.financeScore);

    // Generate AI notes if requested
    let notesJson: DomainNotes = {};
    if (generateNotes) {
      notesJson = await this.generateDomainNotes({
        marketing,
        sales,
        delivery,
        product,
        clients,
        engineering,
        finance,
      });
    }

    // Build input signals JSON
    const inputSignalsJson: InputSignals = {
      marketing: marketing.signals,
      sales: sales.signals,
      delivery: delivery.signals,
      product: product.signals,
      clients: clients.signals,
      engineering: engineering.signals,
      finance: finance.signals,
    };

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('founder_momentum_scores')
      .upsert(
        {
          founder_id: founderId,
          workspace_id: workspaceId,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          marketing_score: marketing.score,
          sales_score: sales.score,
          delivery_score: delivery.score,
          product_score: product.score,
          clients_score: clients.score,
          engineering_score: engineering.score,
          finance_score: finance.score,
          marketing_trend: marketingTrend,
          sales_trend: salesTrend,
          delivery_trend: deliveryTrend,
          product_trend: productTrend,
          clients_trend: clientsTrend,
          engineering_trend: engineeringTrend,
          finance_trend: financeTrend,
          notes_json: notesJson,
          input_signals_json: inputSignalsJson,
        },
        {
          onConflict: 'founder_id,workspace_id,period_start,period_end',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[MomentumScoring] Failed to save momentum scores:', error);
      throw new Error(`Failed to save momentum scores: ${error.message}`);
    }

    return this.mapDbToMomentum(data);
  }

  /**
   * Calculate marketing momentum
   */
  private async calculateMarketingMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Campaign activity
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, status, open_rate, click_rate')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const activeCampaigns = campaigns?.filter((c) => c.status === 'active').length || 0;
    const avgOpenRate = this.average(campaigns?.map((c) => c.open_rate || 0) || []);
    const avgClickRate = this.average(campaigns?.map((c) => c.click_rate || 0) || []);

    signals.sources.push('campaigns');
    signals.counts.activeCampaigns = activeCampaigns;
    signals.counts.totalCampaigns = campaigns?.length || 0;

    // Email outreach
    const { count: emailsSent } = await supabaseAdmin
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('direction', 'outbound')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    signals.sources.push('emails');
    signals.counts.emailsSent = emailsSent || 0;

    // Calculate score (0-100)
    let score = 50; // Base score

    // Adjust based on campaign activity
    if (activeCampaigns > 0) score += 10;
    if (avgOpenRate > 0.3) score += 10;
    if (avgClickRate > 0.05) score += 10;
    if ((emailsSent || 0) > 50) score += 10;

    // Penalize low activity
    if (activeCampaigns === 0 && (emailsSent || 0) < 10) score -= 20;

    score = Math.max(0, Math.min(100, score));

    if (avgOpenRate > 0.3) signals.highlights.push(`Strong open rate: ${(avgOpenRate * 100).toFixed(1)}%`);
    if (activeCampaigns > 2) signals.highlights.push(`${activeCampaigns} active campaigns running`);

    return { domain: 'marketing', score, trend: 0, signals };
  }

  /**
   * Calculate sales momentum
   */
  private async calculateSalesMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Hot leads
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, ai_score, status')
      .eq('workspace_id', workspaceId)
      .gte('updated_at', startDate.toISOString());

    const hotLeads = contacts?.filter((c) => (c.ai_score || 0) >= 80).length || 0;
    const warmLeads = contacts?.filter((c) => (c.ai_score || 0) >= 60 && (c.ai_score || 0) < 80).length || 0;
    const convertedCount = contacts?.filter((c) => c.status === 'converted').length || 0;

    signals.sources.push('contacts');
    signals.counts.hotLeads = hotLeads;
    signals.counts.warmLeads = warmLeads;
    signals.counts.converted = convertedCount;

    // Pre-clients showing interest
    const { data: preClients } = await supabaseAdmin
      .from('pre_clients')
      .select('id, engagement_level')
      .eq('workspace_id', workspaceId)
      .in('engagement_level', ['hot', 'active']);

    const hotPreClients = preClients?.length || 0;
    signals.sources.push('pre_clients');
    signals.counts.hotPreClients = hotPreClients;

    // Calculate score
    let score = 50;

    if (hotLeads > 5) score += 15;
    else if (hotLeads > 0) score += 10;

    if (warmLeads > 10) score += 10;
    if (convertedCount > 0) score += 15;
    if (hotPreClients > 3) score += 10;

    if (hotLeads === 0 && warmLeads < 3) score -= 20;

    score = Math.max(0, Math.min(100, score));

    if (hotLeads > 3) signals.highlights.push(`${hotLeads} hot leads ready for conversion`);
    if (convertedCount > 0) signals.highlights.push(`${convertedCount} conversions this period`);

    return { domain: 'sales', score, trend: 0, signals };
  }

  /**
   * Calculate delivery momentum
   */
  private async calculateDeliveryMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Automation success rate
    const { data: automationLogs } = await supabaseAdmin
      .from('automation_logs')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalAutomations = automationLogs?.length || 0;
    const successfulAutomations = automationLogs?.filter((a) => a.status === 'success').length || 0;
    const successRate = totalAutomations > 0 ? successfulAutomations / totalAutomations : 0;

    signals.sources.push('automation_logs');
    signals.counts.totalAutomations = totalAutomations;
    signals.counts.successfulAutomations = successfulAutomations;

    // Email delivery
    const { data: emails } = await supabaseAdmin
      .from('emails')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'outbound')
      .gte('created_at', startDate.toISOString());

    const deliveredEmails = emails?.filter((e) => e.status === 'delivered').length || 0;
    const totalEmails = emails?.length || 0;
    const emailDeliveryRate = totalEmails > 0 ? deliveredEmails / totalEmails : 0;

    signals.sources.push('emails');
    signals.counts.deliveredEmails = deliveredEmails;

    // Calculate score
    let score = 50;

    if (successRate > 0.95) score += 20;
    else if (successRate > 0.8) score += 10;
    else if (successRate < 0.7) score -= 15;

    if (emailDeliveryRate > 0.95) score += 15;
    else if (emailDeliveryRate > 0.85) score += 10;

    if (totalAutomations > 100) score += 5;

    score = Math.max(0, Math.min(100, score));

    if (successRate > 0.9) signals.highlights.push(`${(successRate * 100).toFixed(1)}% automation success rate`);

    return { domain: 'delivery', score, trend: 0, signals };
  }

  /**
   * Calculate product momentum
   */
  private async calculateProductMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Feature usage (based on generated content and automation)
    const { count: contentGenerated } = await supabaseAdmin
      .from('generatedContent')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    signals.sources.push('generatedContent');
    signals.counts.contentGenerated = contentGenerated || 0;

    // AI processing activity
    const { count: aiProcessed } = await supabaseAdmin
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .not('extracted_intent', 'is', null)
      .gte('created_at', startDate.toISOString());

    signals.sources.push('ai_processing');
    signals.counts.aiProcessed = aiProcessed || 0;

    // Calculate score
    let score = 50;

    if ((contentGenerated || 0) > 20) score += 15;
    else if ((contentGenerated || 0) > 5) score += 10;

    if ((aiProcessed || 0) > 50) score += 15;
    else if ((aiProcessed || 0) > 20) score += 10;

    score = Math.max(0, Math.min(100, score));

    if ((contentGenerated || 0) > 10) signals.highlights.push(`${contentGenerated} content pieces generated`);

    return { domain: 'product', score, trend: 0, signals };
  }

  /**
   * Calculate clients momentum
   */
  private async calculateClientsMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Client sentiment from emails
    const { data: emails } = await supabaseAdmin
      .from('emails')
      .select('sentiment_score')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'inbound')
      .gte('created_at', startDate.toISOString())
      .not('sentiment_score', 'is', null);

    const sentiments = emails?.map((e) => e.sentiment_score) || [];
    const avgSentiment = this.average(sentiments);
    const positiveCount = sentiments.filter((s) => s >= 0.6).length;
    const negativeCount = sentiments.filter((s) => s <= 0.4).length;

    signals.sources.push('email_sentiment');
    signals.counts.avgSentiment = Math.round(avgSentiment * 100);
    signals.counts.positiveEmails = positiveCount;
    signals.counts.negativeEmails = negativeCount;

    // Active client count
    const { count: activeClients } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'converted']);

    signals.sources.push('contacts');
    signals.counts.activeClients = activeClients || 0;

    // Calculate score
    let score = 50;

    if (avgSentiment > 0.7) score += 20;
    else if (avgSentiment > 0.5) score += 10;
    else if (avgSentiment < 0.4) score -= 15;

    if (positiveCount > negativeCount * 2) score += 10;
    if (negativeCount > positiveCount) score -= 10;

    if ((activeClients || 0) > 20) score += 10;

    score = Math.max(0, Math.min(100, score));

    if (avgSentiment > 0.65) signals.highlights.push(`${(avgSentiment * 100).toFixed(0)}% positive client sentiment`);

    return { domain: 'clients', score, trend: 0, signals };
  }

  /**
   * Calculate engineering momentum
   */
  private async calculateEngineeringMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // System reliability (automation success)
    const { data: logs } = await supabaseAdmin
      .from('automation_logs')
      .select('status')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate.toISOString());

    const totalLogs = logs?.length || 0;
    const errorLogs = logs?.filter((l) => l.status === 'error').length || 0;
    const errorRate = totalLogs > 0 ? errorLogs / totalLogs : 0;

    signals.sources.push('system_health');
    signals.counts.totalOperations = totalLogs;
    signals.counts.errorCount = errorLogs;

    // Calculate score
    let score = 60; // Engineering baseline

    if (errorRate < 0.02) score += 25;
    else if (errorRate < 0.05) score += 15;
    else if (errorRate > 0.1) score -= 20;

    if (totalLogs > 500) score += 5; // Active system

    score = Math.max(0, Math.min(100, score));

    if (errorRate < 0.03) signals.highlights.push(`${((1 - errorRate) * 100).toFixed(1)}% system reliability`);

    return { domain: 'engineering', score, trend: 0, signals };
  }

  /**
   * Calculate finance momentum
   */
  private async calculateFinanceMomentum(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DomainMetrics> {
    const signals: SignalSummary = {
      sources: [],
      counts: {},
      highlights: [],
    };

    // Since we don't have direct financial tables, estimate from client activity
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('status, ai_score')
      .eq('workspace_id', workspaceId);

    const convertedClients = contacts?.filter((c) => c.status === 'converted').length || 0;
    const highValueLeads = contacts?.filter((c) => (c.ai_score || 0) >= 80).length || 0;

    signals.sources.push('client_value_proxy');
    signals.counts.convertedClients = convertedClients;
    signals.counts.highValueLeads = highValueLeads;

    // Calculate score
    let score = 50;

    if (convertedClients > 10) score += 20;
    else if (convertedClients > 5) score += 10;

    if (highValueLeads > 5) score += 15;

    score = Math.max(0, Math.min(100, score));

    if (convertedClients > 5) signals.highlights.push(`${convertedClients} converted clients (revenue potential)`);

    return { domain: 'finance', score, trend: 0, signals };
  }

  /**
   * Calculate trend from current and previous scores
   */
  private calculateTrend(current: number, previous?: number): TrendDirection {
    if (previous === undefined) return 0;

    const diff = current - previous;
    if (diff > 5) return 1; // Improving
    if (diff < -5) return -1; // Declining
    return 0; // Stable
  }

  /**
   * Get previous momentum scores
   */
  private async getPreviousMomentum(
    founderId: string,
    workspaceId: string,
    beforeDate: Date
  ): Promise<MomentumScore | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_momentum_scores')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .lt('period_end', beforeDate.toISOString().split('T')[0])
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapDbToMomentum(data);
  }

  /**
   * Generate AI notes for each domain
   */
  private async generateDomainNotes(domains: {
    marketing: DomainMetrics;
    sales: DomainMetrics;
    delivery: DomainMetrics;
    product: DomainMetrics;
    clients: DomainMetrics;
    engineering: DomainMetrics;
    finance: DomainMetrics;
  }): Promise<DomainNotes> {
    try {
      const prompt = `Analyze these business momentum scores and provide brief notes (1-2 sentences each) for each domain.

Scores (0-100, higher is better):
- Marketing: ${domains.marketing.score} - Signals: ${JSON.stringify(domains.marketing.signals.counts)}
- Sales: ${domains.sales.score} - Signals: ${JSON.stringify(domains.sales.signals.counts)}
- Delivery: ${domains.delivery.score} - Signals: ${JSON.stringify(domains.delivery.signals.counts)}
- Product: ${domains.product.score} - Signals: ${JSON.stringify(domains.product.signals.counts)}
- Clients: ${domains.clients.score} - Signals: ${JSON.stringify(domains.clients.signals.counts)}
- Engineering: ${domains.engineering.score} - Signals: ${JSON.stringify(domains.engineering.signals.counts)}
- Finance: ${domains.finance.score} - Signals: ${JSON.stringify(domains.finance.signals.counts)}

Return JSON:
{
  "marketing": "brief insight",
  "sales": "brief insight",
  "delivery": "brief insight",
  "product": "brief insight",
  "clients": "brief insight",
  "engineering": "brief insight",
  "finance": "brief insight"
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) return {};

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      return JSON.parse(jsonMatch[0]) as DomainNotes;
    } catch (error) {
      console.error('[MomentumScoring] Failed to generate notes:', error);
      return {};
    }
  }

  /**
   * Get latest momentum scores
   */
  async getLatestMomentum(founderId: string, workspaceId: string): Promise<MomentumScore | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_momentum_scores')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapDbToMomentum(data);
  }

  /**
   * Get momentum history
   */
  async getMomentumHistory(
    founderId: string,
    workspaceId: string,
    limit = 12
  ): Promise<MomentumScore[]> {
    const { data, error } = await supabaseAdmin
      .from('founder_momentum_scores')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .order('period_end', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map(this.mapDbToMomentum);
  }

  /**
   * Helper: calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Map database record to typed object
   */
  private mapDbToMomentum(record: Record<string, unknown>): MomentumScore {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      periodStart: new Date(record.period_start as string),
      periodEnd: new Date(record.period_end as string),
      marketingScore: record.marketing_score as number,
      salesScore: record.sales_score as number,
      deliveryScore: record.delivery_score as number,
      productScore: record.product_score as number,
      clientsScore: record.clients_score as number,
      engineeringScore: record.engineering_score as number,
      financeScore: record.finance_score as number,
      overallScore: record.overall_score as number,
      marketingTrend: record.marketing_trend as TrendDirection,
      salesTrend: record.sales_trend as TrendDirection,
      deliveryTrend: record.delivery_trend as TrendDirection,
      productTrend: record.product_trend as TrendDirection,
      clientsTrend: record.clients_trend as TrendDirection,
      engineeringTrend: record.engineering_trend as TrendDirection,
      financeTrend: record.finance_trend as TrendDirection,
      notesJson: record.notes_json as DomainNotes,
      inputSignalsJson: record.input_signals_json as InputSignals,
      createdAt: new Date(record.created_at as string),
    };
  }
}

export const momentumScoringService = new MomentumScoringService();
