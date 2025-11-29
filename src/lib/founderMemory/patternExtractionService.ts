/**
 * Pattern Extraction Service
 *
 * Identifies recurring patterns across clients, pre-clients, campaigns,
 * and channels. Writes to cross_client_patterns table.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';

// Types
export type PatternType =
  | 'communication'
  | 'project'
  | 'opportunity'
  | 'risk'
  | 'behavior'
  | 'sentiment'
  | 'timing';

export type PatternStatus = 'active' | 'resolved' | 'dismissed' | 'archived';

export interface PatternEvidence {
  clientId?: string;
  preClientId?: string;
  sourceType: string;
  sourceId: string;
  snippet: string;
  timestamp: Date;
}

export interface CrossClientPattern {
  id: string;
  founderId: string;
  workspaceId: string;
  patternType: PatternType;
  title: string;
  description: string;
  evidenceJson: PatternEvidence[];
  affectedClientIds: string[];
  affectedPreClientIds: string[];
  strengthScore: number;
  recurrenceCount: number;
  firstDetectedAt: Date;
  lastSeenAt: Date;
  status: PatternStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternExtractionConfig {
  founderId: string;
  workspaceId: string;
  patternTypes?: PatternType[];
  minStrengthScore?: number;
  lookbackDays?: number;
}

export interface PatternAnalysis {
  patterns: CrossClientPattern[];
  summary: {
    totalPatterns: number;
    byType: Record<PatternType, number>;
    avgStrength: number;
    mostCommonType: PatternType | null;
    emergingPatterns: CrossClientPattern[];
  };
}

class PatternExtractionService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Extract patterns from all data sources
   */
  async extractPatterns(config: PatternExtractionConfig): Promise<PatternAnalysis> {
    const {
      founderId,
      workspaceId,
      patternTypes = ['communication', 'project', 'opportunity', 'risk', 'behavior', 'sentiment', 'timing'],
      minStrengthScore = 0.3,
      lookbackDays = 90,
    } = config;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

    // Gather data for pattern detection
    const [clientData, preClientData, emailData, campaignData] = await Promise.all([
      this.gatherClientData(workspaceId, lookbackDate),
      this.gatherPreClientData(workspaceId, lookbackDate),
      this.gatherEmailData(workspaceId, lookbackDate),
      this.gatherCampaignData(workspaceId, lookbackDate),
    ]);

    // Use AI to identify patterns
    const detectedPatterns = await this.detectPatternsWithAI(
      founderId,
      workspaceId,
      {
        clients: clientData,
        preClients: preClientData,
        emails: emailData,
        campaigns: campaignData,
      },
      patternTypes
    );

    // Filter by strength and save to database
    const qualifiedPatterns = detectedPatterns.filter((p) => p.strengthScore >= minStrengthScore);
    const savedPatterns = await this.savePatterns(founderId, workspaceId, qualifiedPatterns);

    // Build analysis summary
    const summary = this.buildSummary(savedPatterns);

    return {
      patterns: savedPatterns,
      summary,
    };
  }

  /**
   * Gather client data for pattern detection
   */
  private async gatherClientData(
    workspaceId: string,
    sinceDate: Date
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('id, name, email, company, status, ai_score, tags, notes, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .gte('updated_at', sinceDate.toISOString());

    if (error) {
      console.error('[PatternExtraction] Failed to gather client data:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Gather pre-client data for pattern detection
   */
  private async gatherPreClientData(
    workspaceId: string,
    sinceDate: Date
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabaseAdmin
      .from('pre_clients')
      .select('id, name, email, company, status, engagement_level, sentiment_score, first_contact_date, last_contact_date')
      .eq('workspace_id', workspaceId)
      .gte('updated_at', sinceDate.toISOString());

    if (error) {
      console.error('[PatternExtraction] Failed to gather pre-client data:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Gather email data for pattern detection
   */
  private async gatherEmailData(
    workspaceId: string,
    sinceDate: Date
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('id, contact_id, subject, direction, status, sentiment_score, extracted_intent, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceDate.toISOString())
      .limit(500);

    if (error) {
      console.error('[PatternExtraction] Failed to gather email data:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Gather campaign data for pattern detection
   */
  private async gatherCampaignData(
    workspaceId: string,
    sinceDate: Date
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, type, open_rate, click_rate, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceDate.toISOString());

    if (error) {
      console.error('[PatternExtraction] Failed to gather campaign data:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Detect patterns using AI analysis
   */
  private async detectPatternsWithAI(
    founderId: string,
    workspaceId: string,
    data: {
      clients: Record<string, unknown>[];
      preClients: Record<string, unknown>[];
      emails: Record<string, unknown>[];
      campaigns: Record<string, unknown>[];
    },
    patternTypes: PatternType[]
  ): Promise<Omit<CrossClientPattern, 'id' | 'createdAt' | 'updatedAt'>[]> {
    try {
      const prompt = `You are analyzing business data to identify recurring patterns across clients and communications.

Data Summary:
- Clients: ${data.clients.length} records
- Pre-Clients: ${data.preClients.length} records
- Emails: ${data.emails.length} records
- Campaigns: ${data.campaigns.length} records

Client Status Distribution: ${JSON.stringify(this.getDistribution(data.clients, 'status'))}
Pre-Client Engagement: ${JSON.stringify(this.getDistribution(data.preClients, 'engagement_level'))}
Email Sentiment: ${JSON.stringify(this.getDistribution(data.emails, 'sentiment_score'))}

Sample client data (first 5): ${JSON.stringify(data.clients.slice(0, 5))}
Sample email subjects: ${data.emails.slice(0, 10).map((e) => e.subject).join(', ')}

Identify patterns in these categories: ${patternTypes.join(', ')}

For each pattern found, provide:
1. type: one of [${patternTypes.join(', ')}]
2. title: brief descriptive title
3. description: detailed explanation
4. strength: 0.0-1.0 confidence score
5. affected_entities: list of client/pre-client IDs if identifiable

Return as JSON array:
[{ "type": "...", "title": "...", "description": "...", "strength": 0.7, "evidence": "..." }]

Focus on actionable, meaningful patterns. Return empty array if no significant patterns found.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) return [];

      // Parse AI response
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const rawPatterns = JSON.parse(jsonMatch[0]) as Array<{
        type: PatternType;
        title: string;
        description: string;
        strength: number;
        evidence?: string;
        affected_entities?: string[];
      }>;

      // Convert to CrossClientPattern format
      return rawPatterns.map((p) => ({
        founderId,
        workspaceId,
        patternType: p.type,
        title: p.title,
        description: p.description,
        evidenceJson: p.evidence
          ? [
              {
                sourceType: 'ai_analysis',
                sourceId: 'pattern_extraction',
                snippet: p.evidence,
                timestamp: new Date(),
              },
            ]
          : [],
        affectedClientIds: p.affected_entities?.filter((id) => data.clients.some((c) => c.id === id)) || [],
        affectedPreClientIds: p.affected_entities?.filter((id) => data.preClients.some((pc) => pc.id === id)) || [],
        strengthScore: Math.min(Math.max(p.strength, 0), 1),
        recurrenceCount: 1,
        firstDetectedAt: new Date(),
        lastSeenAt: new Date(),
        status: 'active' as PatternStatus,
      }));
    } catch (error) {
      console.error('[PatternExtraction] AI pattern detection failed:', error);
      return [];
    }
  }

  /**
   * Get distribution of values for a field
   */
  private getDistribution(data: Record<string, unknown>[], field: string): Record<string, number> {
    const distribution: Record<string, number> = {};
    data.forEach((item) => {
      const value = String(item[field] || 'unknown');
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Save patterns to database (upsert logic)
   */
  private async savePatterns(
    founderId: string,
    workspaceId: string,
    patterns: Omit<CrossClientPattern, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<CrossClientPattern[]> {
    const savedPatterns: CrossClientPattern[] = [];

    for (const pattern of patterns) {
      // Check for existing similar pattern
      const { data: existing } = await supabaseAdmin
        .from('cross_client_patterns')
        .select('*')
        .eq('founder_id', founderId)
        .eq('workspace_id', workspaceId)
        .eq('pattern_type', pattern.patternType)
        .ilike('title', `%${pattern.title.slice(0, 50)}%`)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (existing) {
        // Update existing pattern
        const { data: updated, error } = await supabaseAdmin
          .from('cross_client_patterns')
          .update({
            description: pattern.description,
            evidence_json: [
              ...(existing.evidence_json as PatternEvidence[] || []),
              ...pattern.evidenceJson,
            ],
            strength_score: Math.max(existing.strength_score, pattern.strengthScore),
            recurrence_count: existing.recurrence_count + 1,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (!error && updated) {
          savedPatterns.push(this.mapDbToPattern(updated));
        }
      } else {
        // Insert new pattern
        const { data: inserted, error } = await supabaseAdmin
          .from('cross_client_patterns')
          .insert({
            founder_id: founderId,
            workspace_id: workspaceId,
            pattern_type: pattern.patternType,
            title: pattern.title,
            description: pattern.description,
            evidence_json: pattern.evidenceJson,
            affected_client_ids: pattern.affectedClientIds,
            affected_pre_client_ids: pattern.affectedPreClientIds,
            strength_score: pattern.strengthScore,
            recurrence_count: 1,
            first_detected_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            status: 'active',
          })
          .select()
          .single();

        if (!error && inserted) {
          savedPatterns.push(this.mapDbToPattern(inserted));
        }
      }
    }

    return savedPatterns;
  }

  /**
   * Build summary from patterns
   */
  private buildSummary(
    patterns: CrossClientPattern[]
  ): PatternAnalysis['summary'] {
    const byType: Record<PatternType, number> = {
      communication: 0,
      project: 0,
      opportunity: 0,
      risk: 0,
      behavior: 0,
      sentiment: 0,
      timing: 0,
    };

    let totalStrength = 0;

    patterns.forEach((p) => {
      byType[p.patternType]++;
      totalStrength += p.strengthScore;
    });

    // Find most common type
    let mostCommonType: PatternType | null = null;
    let maxCount = 0;
    (Object.entries(byType) as [PatternType, number][]).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    });

    // Find emerging patterns (new and strong)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const emergingPatterns = patterns
      .filter((p) => p.firstDetectedAt >= oneWeekAgo && p.strengthScore >= 0.6)
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 5);

    return {
      totalPatterns: patterns.length,
      byType,
      avgStrength: patterns.length > 0 ? totalStrength / patterns.length : 0,
      mostCommonType,
      emergingPatterns,
    };
  }

  /**
   * Get patterns for a founder
   */
  async getPatterns(
    founderId: string,
    workspaceId: string,
    options?: {
      patternTypes?: PatternType[];
      minStrength?: number;
      status?: PatternStatus;
      limit?: number;
    }
  ): Promise<CrossClientPattern[]> {
    let query = supabaseAdmin
      .from('cross_client_patterns')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId);

    if (options?.patternTypes?.length) {
      query = query.in('pattern_type', options.patternTypes);
    }

    if (options?.minStrength !== undefined) {
      query = query.gte('strength_score', options.minStrength);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query
      .order('strength_score', { ascending: false })
      .limit(options?.limit || 50);

    const { data, error } = await query;

    if (error) {
      console.error('[PatternExtraction] Failed to get patterns:', error);
      return [];
    }

    return (data || []).map(this.mapDbToPattern);
  }

  /**
   * Update pattern status
   */
  async updatePatternStatus(
    patternId: string,
    workspaceId: string,
    status: PatternStatus
  ): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('cross_client_patterns')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Map database record to typed object
   */
  private mapDbToPattern(record: Record<string, unknown>): CrossClientPattern {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      patternType: record.pattern_type as PatternType,
      title: record.title as string,
      description: record.description as string,
      evidenceJson: record.evidence_json as PatternEvidence[],
      affectedClientIds: record.affected_client_ids as string[],
      affectedPreClientIds: record.affected_pre_client_ids as string[],
      strengthScore: record.strength_score as number,
      recurrenceCount: record.recurrence_count as number,
      firstDetectedAt: new Date(record.first_detected_at as string),
      lastSeenAt: new Date(record.last_seen_at as string),
      status: record.status as PatternStatus,
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
    };
  }
}

export const patternExtractionService = new PatternExtractionService();
