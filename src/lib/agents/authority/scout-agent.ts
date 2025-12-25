/**
 * Scout Agent - Information Vacuum Discovery
 * Finds geographic and content gaps using MCP + Gemini Search Grounding
 * Dual pathway: Geographic (suburb opportunities) + Content (missing proof)
 */

import { BaseAgent, AgentTask } from '../base-agent';
import { getSupabaseServer } from '@/lib/supabase';
import { getGeminiSearchGrounding } from '@/lib/integrations/gemini/search-grounding';
import type {
  ScoutTaskPayload,
  ScoutResult,
  GeographicVacuum,
  ContentVacuum,
  PathwayType
} from './types';

interface SuburbAuthorityData {
  suburb: string;
  state: string;
  authority_score: number;
  total_jobs: number;
  total_photo_count: number;
  verified_review_count: number;
  avg_content_gap_score: number;
}

export class ScoutAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Scout Agent',
      queueName: 'authority-scout',
      concurrency: 3, // Can run 3 concurrent suburb analyses
      prefetchCount: 3,
    });
  }

  /**
   * Process Scout task - find information vacuums
   */
  protected async processTask(task: AgentTask): Promise<any> {
    const payload = task.payload as ScoutTaskPayload;
    const startTime = Date.now();

    console.log(`[Scout] Starting ${payload.pathway} pathway analysis for client ${payload.clientId}`);

    const result: ScoutResult = {
      pathway: payload.pathway,
      totalVacuumsFound: 0,
      analysisComplete: false,
      costUsd: 0,
      processingTimeMs: 0,
    };

    try {
      // Execute pathway-specific analysis
      if (payload.pathway === 'geographic' || payload.pathway === 'hybrid') {
        result.geographicVacuums = await this.findGeographicVacuums(payload);
        result.totalVacuumsFound += result.geographicVacuums.length;
      }

      if (payload.pathway === 'content' || payload.pathway === 'hybrid') {
        result.contentVacuums = await this.findContentVacuums(payload);
        result.totalVacuumsFound += result.contentVacuums.length;
      }

      // Store discovered vacuums in database
      await this.storeVacuums(task.workspace_id, payload.clientId, result);

      result.analysisComplete = true;
      result.processingTimeMs = Date.now() - startTime;

      console.log(`[Scout] Analysis complete: ${result.totalVacuumsFound} vacuums found in ${result.processingTimeMs}ms`);

      return result;
    } catch (error: any) {
      console.error('[Scout] Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Find geographic vacuums (low authority suburbs)
   */
  private async findGeographicVacuums(payload: ScoutTaskPayload): Promise<GeographicVacuum[]> {
    console.log('[Scout] Finding geographic vacuums...');

    // Step 1: Query MCP server for low authority suburbs
    // TODO: Once MCP is integrated, use: await mcp.call('find_geographic_gaps', {...})
    // For now, query Supabase directly
    const supabase = getSupabaseServer();

    const { data: suburbData, error } = await supabase
      .from('suburb_authority_substrate')
      .select('*')
      .eq('workspace_id', this.supabase.auth.getUser().then(u => u.data.user?.id)) // TODO: Fix workspace context
      .lte('authority_score', 50) // Gaps only
      .order('authority_score', { ascending: true })
      .limit(payload.maxGaps || 20);

    if (error) {
      throw new Error(`Failed to query suburb authority: ${error.message}`);
    }

    if (!suburbData || suburbData.length === 0) {
      console.log('[Scout] No geographic gaps found');
      return [];
    }

    console.log(`[Scout] Found ${suburbData.length} low-authority suburbs, analyzing with Gemini...`);

    // Step 2: Analyze each suburb with Gemini Search Grounding
    const gemini = getGeminiSearchGrounding();
    const vacuums: GeographicVacuum[] = [];
    let totalCost = 0;

    for (const suburb of suburbData.slice(0, 5)) { // Limit to 5 for cost control
      try {
        const analysis = await gemini.analyzeCompetitorLandscape({
          service: payload.targetService || 'general contractor',
          suburb: suburb.suburb,
          state: suburb.state,
        });

        totalCost += analysis.costUsd;

        const vacuum: GeographicVacuum = {
          suburb: suburb.suburb,
          state: suburb.state,
          keyword: `${payload.targetService} ${suburb.suburb}`,
          gapSeverity: 100 - suburb.authority_score,
          authorityScore: suburb.authority_score,
          competitorCount: analysis.competitorCount,
          competitionLevel: analysis.competition,
          topCompetitors: analysis.topCompetitors,
          opportunityScore: this.calculateOpportunityScore(suburb, analysis.competition),
          localKeywords: analysis.localKeywords,
        };

        vacuums.push(vacuum);

        // Rate limiting: 2s delay between requests
        if (suburbData.indexOf(suburb) < suburbData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`[Scout] Failed to analyze ${suburb.suburb}:`, error.message);
        // Continue with other suburbs
      }
    }

    console.log(`[Scout] Geographic analysis complete: ${vacuums.length} vacuums, cost: $${totalCost.toFixed(4)}`);

    return vacuums;
  }

  /**
   * Find content vacuums (missing proof points)
   */
  private async findContentVacuums(payload: ScoutTaskPayload): Promise<ContentVacuum[]> {
    console.log('[Scout] Finding content vacuums...');

    // Query MCP server or Supabase directly
    const supabase = getSupabaseServer();

    const { data: suburbData, error } = await supabase
      .from('suburb_authority_substrate')
      .select('*')
      .gte('avg_content_gap_score', 0.7) // High content gap only
      .order('avg_content_gap_score', { ascending: false })
      .limit(payload.maxGaps || 20);

    if (error) {
      throw new Error(`Failed to query content gaps: ${error.message}`);
    }

    if (!suburbData || suburbData.length === 0) {
      console.log('[Scout] No content gaps found');
      return [];
    }

    const vacuums: ContentVacuum[] = suburbData.map((suburb: any) => ({
      suburb: suburb.suburb,
      state: suburb.state,
      totalJobs: suburb.total_jobs,
      missingProofTypes: this.identifyMissingProof(suburb),
      contentGapScore: suburb.avg_content_gap_score,
      schemaReadyJobs: suburb.schema_ready_jobs,
      recommendedActions: this.generateRecommendations(suburb),
    }));

    console.log(`[Scout] Content analysis complete: ${vacuums.length} vacuums found`);

    return vacuums;
  }

  /**
   * Store discovered vacuums in database
   */
  private async storeVacuums(
    workspaceId: string,
    clientId: string,
    result: ScoutResult
  ): Promise<void> {
    const vacuumsToInsert: any[] = [];

    // Store geographic vacuums
    if (result.geographicVacuums) {
      for (const vacuum of result.geographicVacuums) {
        vacuumsToInsert.push({
          workspace_id: workspaceId,
          client_id: clientId,
          vacuum_type: 'geographic',
          pathway: result.pathway,
          target_suburb: vacuum.suburb,
          target_state: vacuum.state,
          target_keyword: vacuum.keyword,
          gap_severity: vacuum.gapSeverity,
          competitor_density: vacuum.competitionLevel,
          scout_analysis: {
            top_competitors: vacuum.topCompetitors,
            serp_density: vacuum.competitorCount,
            opportunity_score: vacuum.opportunityScore,
            local_keywords: vacuum.localKeywords,
          },
          priority: this.calculatePriority(vacuum.opportunityScore),
          discovered_by: 'scout_agent',
        });
      }
    }

    // Store content vacuums
    if (result.contentVacuums) {
      for (const vacuum of result.contentVacuums) {
        vacuumsToInsert.push({
          workspace_id: workspaceId,
          client_id: clientId,
          vacuum_type: 'content',
          pathway: result.pathway,
          target_suburb: vacuum.suburb,
          target_state: vacuum.state,
          target_keyword: `content_gap_${vacuum.suburb}`,
          gap_severity: vacuum.contentGapScore * 100,
          scout_analysis: {
            missing_proof_types: vacuum.missingProofTypes,
            total_jobs: vacuum.totalJobs,
            schema_ready_jobs: vacuum.schemaReadyJobs,
            recommended_actions: vacuum.recommendedActions,
          },
          priority: vacuum.contentGapScore > 0.85 ? 8 : 5,
          discovered_by: 'scout_agent',
        });
      }
    }

    if (vacuumsToInsert.length > 0) {
      const { error } = await this.supabase
        .from('information_vacuums')
        .insert(vacuumsToInsert);

      if (error) {
        console.error('[Scout] Failed to store vacuums:', error);
        throw new Error(`Database insert failed: ${error.message}`);
      }

      console.log(`[Scout] Stored ${vacuumsToInsert.length} vacuums in database`);
    }
  }

  /**
   * Calculate opportunity score from authority data and competition
   */
  private calculateOpportunityScore(
    suburbData: SuburbAuthorityData,
    competition: string
  ): number {
    let score = 0;

    // Gap severity (max 40 points)
    score += (100 - suburbData.authority_score) * 0.4;

    // Competition factor (lower = better, max 30 points)
    const competitionMultiplier = {
      'none': 1.0,
      'low': 0.8,
      'medium': 0.5,
      'high': 0.2,
    }[competition] || 0.5;
    score += 30 * competitionMultiplier;

    // Existing foundation (jobs + photos, max 30 points)
    score += Math.min(suburbData.total_jobs * 2, 15);
    score += Math.min(suburbData.total_photo_count * 3, 15);

    return Math.round(score);
  }

  /**
   * Identify missing proof types from suburb data
   */
  private identifyMissingProof(suburbData: any): string[] {
    const missing: string[] = [];

    if (suburbData.before_after_photo_count === 0) {
      missing.push('before_after_photo');
    }
    if (suburbData.completion_photo_count === 0) {
      missing.push('completion_photo');
    }
    if (suburbData.verified_review_count === 0) {
      missing.push('client_review');
    }
    if (suburbData.schema_ready_jobs === 0) {
      missing.push('schema_markup');
    }

    return missing;
  }

  /**
   * Generate recommended actions for content gaps
   */
  private generateRecommendations(suburbData: any): string[] {
    const actions: string[] = [];
    const missing = this.identifyMissingProof(suburbData);

    if (missing.includes('before_after_photo')) {
      actions.push('Add before/after photos for jobs in ' + suburbData.suburb);
    }
    if (missing.includes('client_review')) {
      actions.push('Request testimonials from ' + suburbData.suburb + ' clients');
    }
    if (missing.includes('schema_markup')) {
      actions.push('Generate LocalBusiness schema markup for ' + suburbData.suburb);
    }
    if (suburbData.total_jobs > 5 && suburbData.schema_ready_jobs === 0) {
      actions.push('Create dedicated service page for ' + suburbData.suburb);
    }

    return actions;
  }

  /**
   * Calculate priority (1-10) based on opportunity score
   */
  private calculatePriority(opportunityScore: number): number {
    if (opportunityScore >= 80) {
return 10;
}
    if (opportunityScore >= 60) {
return 8;
}
    if (opportunityScore >= 40) {
return 6;
}
    if (opportunityScore >= 20) {
return 4;
}
    return 2;
  }
}

/**
 * Create and export singleton instance
 */
let scoutAgentInstance: ScoutAgent | null = null;

export function getScoutAgent(): ScoutAgent {
  if (!scoutAgentInstance) {
    scoutAgentInstance = new ScoutAgent();
  }
  return scoutAgentInstance;
}
