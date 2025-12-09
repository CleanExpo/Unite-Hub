/**
 * Risk Analysis Service
 *
 * Detects and updates founder_risk_register entries from negative signals,
 * delays, missed follow-ups, or campaign underperformance.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Types
export type RiskSourceType =
  | 'email_sentiment'
  | 'missed_followup'
  | 'campaign_underperformance'
  | 'client_delay'
  | 'churn_signal'
  | 'manual';

export type RiskCategory =
  | 'client_churn'
  | 'delivery_delay'
  | 'revenue'
  | 'reputation'
  | 'operational'
  | 'compliance';

export type MitigationStatus =
  | 'identified'
  | 'analyzing'
  | 'mitigating'
  | 'accepted'
  | 'resolved'
  | 'escalated';

export interface FounderRisk {
  id: string;
  founderId: string;
  workspaceId: string;
  relatedClientId?: string;
  relatedPreClientId?: string;
  sourceType: RiskSourceType;
  sourceId?: string;
  title: string;
  description?: string;
  likelihoodScore: number;
  impactScore: number;
  riskScore: number;
  category?: RiskCategory;
  mitigationStatus: MitigationStatus;
  mitigationPlan?: string;
  ownerUserId?: string;
  dueDate?: Date;
  detectedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAnalysisConfig {
  founderId: string;
  workspaceId: string;
  sources?: RiskSourceType[];
  lookbackDays?: number;
  minRiskScore?: number;
}

export interface RiskAnalysisResult {
  newRisks: number;
  updatedRisks: number;
  resolvedRisks: number;
  totalActiveRisks: number;
  topRisks: FounderRisk[];
  riskSummary: {
    byCategory: Record<string, number>;
    avgRiskScore: number;
    criticalCount: number;
  };
}

class RiskAnalysisService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Analyze and detect risks from all sources
   */
  async analyzeRisks(config: RiskAnalysisConfig): Promise<RiskAnalysisResult> {
    const {
      founderId,
      workspaceId,
      sources = ['email_sentiment', 'missed_followup', 'campaign_underperformance', 'client_delay', 'churn_signal'],
      lookbackDays = 30,
      minRiskScore = 0.2,
    } = config;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    let newCount = 0;
    let updatedCount = 0;

    // Detect risks from each source
    if (sources.includes('email_sentiment')) {
      const result = await this.detectSentimentRisks(founderId, workspaceId, lookbackDate);
      newCount += result.new;
      updatedCount += result.updated;
    }

    if (sources.includes('missed_followup')) {
      const result = await this.detectMissedFollowupRisks(founderId, workspaceId, lookbackDate);
      newCount += result.new;
      updatedCount += result.updated;
    }

    if (sources.includes('campaign_underperformance')) {
      const result = await this.detectCampaignRisks(founderId, workspaceId, lookbackDate);
      newCount += result.new;
      updatedCount += result.updated;
    }

    if (sources.includes('client_delay')) {
      const result = await this.detectClientDelayRisks(founderId, workspaceId, lookbackDate);
      newCount += result.new;
      updatedCount += result.updated;
    }

    if (sources.includes('churn_signal')) {
      const result = await this.detectChurnSignals(founderId, workspaceId, lookbackDate);
      newCount += result.new;
      updatedCount += result.updated;
    }

    // Auto-resolve old risks that are no longer relevant
    const resolvedCount = await this.autoResolveOldRisks(founderId, workspaceId);

    // Get active risk stats
    const activeRisks = await this.getActiveRisks(founderId, workspaceId);
    const topRisks = activeRisks.slice(0, 5);

    // Build summary
    const byCategory: Record<string, number> = {};
    let totalRiskScore = 0;
    let criticalCount = 0;

    activeRisks.forEach((r) => {
      if (r.category) {
        byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      }
      totalRiskScore += r.riskScore;
      if (r.riskScore >= 0.7) {
criticalCount++;
}
    });

    return {
      newRisks: newCount,
      updatedRisks: updatedCount,
      resolvedRisks: resolvedCount,
      totalActiveRisks: activeRisks.length,
      topRisks,
      riskSummary: {
        byCategory,
        avgRiskScore: activeRisks.length > 0 ? totalRiskScore / activeRisks.length : 0,
        criticalCount,
      },
    };
  }

  /**
   * Detect risks from negative email sentiment
   */
  private async detectSentimentRisks(
    founderId: string,
    workspaceId: string,
    sinceDate: Date
  ): Promise<{ new: number; updated: number }> {
    const { data: emails } = await supabaseAdmin
      .from('emails')
      .select('id, contact_id, subject, sentiment_score, sender_email')
      .eq('workspace_id', workspaceId)
      .eq('direction', 'inbound')
      .lte('sentiment_score', 0.3) // Negative sentiment
      .gte('created_at', sinceDate.toISOString());

    if (!emails || emails.length === 0) {
return { new: 0, updated: 0 };
}

    let newCount = 0;
    let updatedCount = 0;

    for (const email of emails) {
      const result = await this.upsertRisk(founderId, workspaceId, {
        sourceType: 'email_sentiment',
        sourceId: email.id,
        relatedClientId: email.contact_id,
        title: `Negative sentiment from ${email.sender_email || 'client'}`,
        description: `Email "${email.subject}" shows negative sentiment (score: ${email.sentiment_score})`,
        likelihoodScore: 0.6,
        impactScore: 0.5,
        category: 'client_churn',
      });

      if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Detect risks from missed follow-ups
   */
  private async detectMissedFollowupRisks(
    founderId: string,
    workspaceId: string,
    sinceDate: Date
  ): Promise<{ new: number; updated: number }> {
    // Look for contacts with no recent outbound emails
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, email, last_contacted_at')
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'warm', 'hot']);

    if (!contacts) {
return { new: 0, updated: 0 };
}

    let newCount = 0;
    let updatedCount = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const contact of contacts) {
      const lastContact = contact.last_contacted_at ? new Date(contact.last_contacted_at) : null;

      if (!lastContact || lastContact < thirtyDaysAgo) {
        const result = await this.upsertRisk(founderId, workspaceId, {
          sourceType: 'missed_followup',
          relatedClientId: contact.id,
          title: `No follow-up with ${contact.name || contact.email}`,
          description: `Last contact was ${lastContact ? lastContact.toLocaleDateString() : 'never'}. Risk of losing engagement.`,
          likelihoodScore: 0.7,
          impactScore: 0.4,
          category: 'client_churn',
        });

        if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Detect risks from underperforming campaigns
   */
  private async detectCampaignRisks(
    founderId: string,
    workspaceId: string,
    sinceDate: Date
  ): Promise<{ new: number; updated: number }> {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, open_rate, click_rate, status')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .gte('created_at', sinceDate.toISOString());

    if (!campaigns) {
return { new: 0, updated: 0 };
}

    let newCount = 0;
    let updatedCount = 0;

    for (const campaign of campaigns) {
      const openRate = campaign.open_rate || 0;
      const clickRate = campaign.click_rate || 0;

      if (openRate < 0.1 || clickRate < 0.01) {
        const result = await this.upsertRisk(founderId, workspaceId, {
          sourceType: 'campaign_underperformance',
          sourceId: campaign.id,
          title: `Low performance: ${campaign.name}`,
          description: `Campaign has ${(openRate * 100).toFixed(1)}% open rate and ${(clickRate * 100).toFixed(1)}% click rate`,
          likelihoodScore: 0.8,
          impactScore: 0.3,
          category: 'revenue',
        });

        if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Detect risks from client delays (inactive pre-clients)
   */
  private async detectClientDelayRisks(
    founderId: string,
    workspaceId: string,
    sinceDate: Date
  ): Promise<{ new: number; updated: number }> {
    const { data: preClients } = await supabaseAdmin
      .from('pre_clients')
      .select('id, name, email, engagement_level, last_contact_date')
      .eq('workspace_id', workspaceId)
      .in('engagement_level', ['hot', 'warm']);

    if (!preClients) {
return { new: 0, updated: 0 };
}

    let newCount = 0;
    let updatedCount = 0;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    for (const pc of preClients) {
      const lastContact = pc.last_contact_date ? new Date(pc.last_contact_date) : null;

      if (lastContact && lastContact < twoWeeksAgo) {
        const result = await this.upsertRisk(founderId, workspaceId, {
          sourceType: 'client_delay',
          relatedPreClientId: pc.id,
          title: `Stalled engagement with ${pc.name || pc.email}`,
          description: `${pc.engagement_level} pre-client hasn't responded since ${lastContact.toLocaleDateString()}`,
          likelihoodScore: 0.6,
          impactScore: 0.5,
          category: 'revenue',
        });

        if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Detect churn signals from declining engagement
   */
  private async detectChurnSignals(
    founderId: string,
    workspaceId: string,
    sinceDate: Date
  ): Promise<{ new: number; updated: number }> {
    // Look for contacts with declining AI scores or status changes
    const { data: contacts } = await supabaseAdmin
      .from('contacts')
      .select('id, name, email, ai_score, status')
      .eq('workspace_id', workspaceId)
      .lte('ai_score', 30); // Low engagement score

    if (!contacts) {
return { new: 0, updated: 0 };
}

    let newCount = 0;
    let updatedCount = 0;

    for (const contact of contacts) {
      if (contact.status !== 'churned' && contact.status !== 'archived') {
        const result = await this.upsertRisk(founderId, workspaceId, {
          sourceType: 'churn_signal',
          relatedClientId: contact.id,
          title: `Churn risk: ${contact.name || contact.email}`,
          description: `Low engagement score (${contact.ai_score}) indicates potential churn`,
          likelihoodScore: 0.7,
          impactScore: 0.6,
          category: 'client_churn',
        });

        if (result === 'new') {
newCount++;
} else if (result === 'updated') {
updatedCount++;
}
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  /**
   * Upsert a risk record
   */
  private async upsertRisk(
    founderId: string,
    workspaceId: string,
    risk: {
      sourceType: RiskSourceType;
      sourceId?: string;
      relatedClientId?: string;
      relatedPreClientId?: string;
      title: string;
      description?: string;
      likelihoodScore: number;
      impactScore: number;
      category?: RiskCategory;
    }
  ): Promise<'new' | 'updated' | 'skipped'> {
    // Check for existing similar risk
    let query = supabaseAdmin
      .from('founder_risk_register')
      .select('id, mitigation_status')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .eq('source_type', risk.sourceType)
      .not('mitigation_status', 'in', '("resolved","accepted")');

    if (risk.sourceId) {
      query = query.eq('source_id', risk.sourceId);
    } else if (risk.relatedClientId) {
      query = query.eq('related_client_id', risk.relatedClientId);
    } else if (risk.relatedPreClientId) {
      query = query.eq('related_pre_client_id', risk.relatedPreClientId);
    }

    const { data: existing } = await query.limit(1).single();

    if (existing) {
      // Update existing risk
      await supabaseAdmin
        .from('founder_risk_register')
        .update({
          title: risk.title,
          description: risk.description,
          likelihood_score: risk.likelihoodScore,
          impact_score: risk.impactScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return 'updated';
    }

    // Insert new risk
    await supabaseAdmin.from('founder_risk_register').insert({
      founder_id: founderId,
      workspace_id: workspaceId,
      source_type: risk.sourceType,
      source_id: risk.sourceId,
      related_client_id: risk.relatedClientId,
      related_pre_client_id: risk.relatedPreClientId,
      title: risk.title,
      description: risk.description,
      likelihood_score: risk.likelihoodScore,
      impact_score: risk.impactScore,
      category: risk.category,
      mitigation_status: 'identified',
      detected_at: new Date().toISOString(),
    });

    return 'new';
  }

  /**
   * Auto-resolve old risks that haven't been updated
   */
  private async autoResolveOldRisks(founderId: string, workspaceId: string): Promise<number> {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: oldRisks } = await supabaseAdmin
      .from('founder_risk_register')
      .select('id')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .eq('mitigation_status', 'identified')
      .lt('updated_at', sixtyDaysAgo.toISOString());

    if (!oldRisks || oldRisks.length === 0) {
return 0;
}

    await supabaseAdmin
      .from('founder_risk_register')
      .update({
        mitigation_status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in(
        'id',
        oldRisks.map((r) => r.id)
      );

    return oldRisks.length;
  }

  /**
   * Get active risks sorted by risk score
   */
  async getActiveRisks(founderId: string, workspaceId: string, limit = 50): Promise<FounderRisk[]> {
    const { data, error } = await supabaseAdmin
      .from('founder_risk_register')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId)
      .not('mitigation_status', 'in', '("resolved","accepted")')
      .order('risk_score', { ascending: false })
      .limit(limit);

    if (error || !data) {
return [];
}
    return data.map(this.mapDbToRisk);
  }

  /**
   * Update risk mitigation status
   */
  async updateRiskStatus(
    riskId: string,
    workspaceId: string,
    status: MitigationStatus,
    mitigationPlan?: string
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      mitigation_status: status,
      updated_at: new Date().toISOString(),
    };

    if (mitigationPlan) {
updateData.mitigation_plan = mitigationPlan;
}
    if (status === 'resolved') {
updateData.resolved_at = new Date().toISOString();
}

    const { error } = await supabaseAdmin
      .from('founder_risk_register')
      .update(updateData)
      .eq('id', riskId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Add manual risk
   */
  async addManualRisk(
    founderId: string,
    workspaceId: string,
    data: {
      title: string;
      description?: string;
      likelihoodScore: number;
      impactScore: number;
      category?: RiskCategory;
      relatedClientId?: string;
      relatedPreClientId?: string;
      mitigationPlan?: string;
      dueDate?: Date;
    }
  ): Promise<FounderRisk | null> {
    const { data: result, error } = await supabaseAdmin
      .from('founder_risk_register')
      .insert({
        founder_id: founderId,
        workspace_id: workspaceId,
        source_type: 'manual',
        title: data.title,
        description: data.description,
        likelihood_score: data.likelihoodScore,
        impact_score: data.impactScore,
        category: data.category,
        related_client_id: data.relatedClientId,
        related_pre_client_id: data.relatedPreClientId,
        mitigation_status: 'identified',
        mitigation_plan: data.mitigationPlan,
        due_date: data.dueDate?.toISOString().split('T')[0],
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !result) {
return null;
}
    return this.mapDbToRisk(result);
  }

  /**
   * Map database record to typed object
   */
  private mapDbToRisk(record: Record<string, unknown>): FounderRisk {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      relatedClientId: record.related_client_id as string | undefined,
      relatedPreClientId: record.related_pre_client_id as string | undefined,
      sourceType: record.source_type as RiskSourceType,
      sourceId: record.source_id as string | undefined,
      title: record.title as string,
      description: record.description as string | undefined,
      likelihoodScore: record.likelihood_score as number,
      impactScore: record.impact_score as number,
      riskScore: record.risk_score as number,
      category: record.category as RiskCategory | undefined,
      mitigationStatus: record.mitigation_status as MitigationStatus,
      mitigationPlan: record.mitigation_plan as string | undefined,
      ownerUserId: record.owner_user_id as string | undefined,
      dueDate: record.due_date ? new Date(record.due_date as string) : undefined,
      detectedAt: new Date(record.detected_at as string),
      resolvedAt: record.resolved_at ? new Date(record.resolved_at as string) : undefined,
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
    };
  }
}

export const riskAnalysisService = new RiskAnalysisService();
