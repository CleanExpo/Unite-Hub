/**
 * Supabase service for querying suburb_authority_substrate view
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  SuburbAuthorityConfig,
  SuburbAuthorityData,
  QuerySuburbAuthorityParams,
  GeographicGap,
  ContentGap
} from '../types/index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('SuburbaseService');

export class SuburbaseService {
  private readonly client: SupabaseClient;

  constructor(config: SuburbAuthorityConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    log.info('Supabase client initialized');
  }

  /**
   * Query suburb_authority_substrate view with flexible filtering
   */
  async querySuburbAuthority(params: QuerySuburbAuthorityParams): Promise<SuburbAuthorityData[]> {
    const {
      workspaceId,
      minAuthorityScore,
      maxAuthorityScore,
      state,
      limit = 50
    } = params;

    let query = this.client
      .from('suburb_authority_substrate')
      .select('*')
      .eq('workspace_id', workspaceId);

    // Filter by authority score (gaps vs strong suburbs)
    if (minAuthorityScore !== undefined) {
      query = query.gte('authority_score', minAuthorityScore);
    }
    if (maxAuthorityScore !== undefined) {
      query = query.lte('authority_score', maxAuthorityScore);
    }

    // Filter by AU state
    if (state) {
      query = query.eq('state', state);
    }

    // Order by authority score (ascending = biggest gaps first)
    query = query.order('authority_score', { ascending: true });

    // Limit results
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      log.error('Failed to query suburb authority:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    log.info(`Found ${data?.length || 0} suburbs matching criteria`);
    return data || [];
  }

  /**
   * Find geographic gaps (low authority suburbs = opportunity)
   */
  async findGeographicGaps(params: {
    workspaceId: string;
    state?: string;
    limit?: number;
  }): Promise<GeographicGap[]> {
    const data = await this.querySuburbAuthority({
      ...params,
      maxAuthorityScore: 50, // Gaps only (low authority)
    });

    return data.map(d => ({
      suburb: d.suburb,
      state: d.state,
      authority_score: d.authority_score,
      gap_severity: 100 - d.authority_score, // Inverse (higher = bigger gap)
      total_jobs: d.total_jobs,
      total_photo_count: d.total_photo_count,
      opportunity_score: this.calculateOpportunityScore(d),
    }));
  }

  /**
   * Find content gaps (high content_gap_score = missing proof points)
   */
  async findContentGaps(params: {
    workspaceId: string;
    state?: string;
    limit?: number;
  }): Promise<ContentGap[]> {
    const data = await this.querySuburbAuthority(params);

    // Filter for high content gap scores
    const contentGaps = data
      .filter(d => d.avg_content_gap_score > 0.7)
      .map(d => ({
        suburb: d.suburb,
        state: d.state,
        authority_score: d.authority_score,
        avg_content_gap_score: d.avg_content_gap_score,
        missing_proof_types: this.identifyMissingProofTypes(d),
        schema_ready_jobs: d.schema_ready_jobs,
        total_jobs: d.total_jobs,
      }));

    return contentGaps;
  }

  /**
   * Get specific suburb authority data
   */
  async getSuburbAuthority(params: {
    workspaceId: string;
    suburb: string;
    state: string;
  }): Promise<SuburbAuthorityData | null> {
    const { data, error } = await this.client
      .from('suburb_authority_substrate')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .eq('suburb', params.suburb)
      .eq('state', params.state)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      log.error('Failed to get suburb authority:', error);
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate opportunity score based on authority data
   * Higher score = better opportunity (considers gap size, proof availability, etc.)
   */
  private calculateOpportunityScore(data: SuburbAuthorityData): number {
    let score = 0;

    // Gap severity (max 40 points)
    score += (100 - data.authority_score) * 0.4;

    // Existing jobs provide foundation (max 20 points, diminishing returns)
    score += Math.min(data.total_jobs * 2, 20);

    // Photo count indicates client has proof (max 20 points)
    score += Math.min(data.total_photo_count * 3, 20);

    // Reviews add credibility (max 20 points)
    score += Math.min(data.verified_review_count * 4, 20);

    return Math.round(score);
  }

  /**
   * Identify missing proof types from authority data
   */
  private identifyMissingProofTypes(data: SuburbAuthorityData): string[] {
    const missing: string[] = [];

    if (data.before_after_photo_count === 0) {
      missing.push('before_after_photo');
    }
    if (data.completion_photo_count === 0) {
      missing.push('completion_photo');
    }
    if (data.verified_review_count === 0) {
      missing.push('client_review');
    }
    if (data.schema_ready_jobs === 0) {
      missing.push('schema_markup');
    }

    return missing;
  }
}
