/**
 * SERP Snapshot Service
 *
 * Service for capturing and storing SERP snapshots including screenshots and parsed results.
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  SearchEngine,
  SerpSnapshot,
  SerpResult,
  SerpFeature,
  SearchKeyword,
} from './searchProviderTypes';
import { searchSuiteConfig } from '../../../config/searchSuite.config';

export interface CaptureOptions {
  engine?: SearchEngine;
  location?: string;
  device?: 'desktop' | 'mobile';
  language?: string;
  captureScreenshot?: boolean;
  captureHtml?: boolean;
}

export interface SerpAnalysis {
  keyword: string;
  engine: SearchEngine;
  ourPosition?: number;
  ourUrl?: string;
  competitorPositions: Array<{ domain: string; position: number; url: string }>;
  features: SerpFeature[];
  totalResults: number;
  difficulty: number;
  opportunity: 'high' | 'medium' | 'low' | 'none';
}

class SerpSnapshotService {
  private config = searchSuiteConfig.serp;

  /**
   * Capture SERP snapshot for a keyword
   */
  async captureSnapshot(
    projectId: string,
    workspaceId: string,
    keyword: string,
    options: CaptureOptions = {}
  ): Promise<SerpSnapshot> {
    const {
      engine = 'google',
      location,
      device = 'desktop',
      language = 'en',
      captureScreenshot = this.config.captureScreenshots,
      captureHtml = this.config.storeHtmlSnapshots,
    } = options;

    const supabase = await getSupabaseServer();

    // Get or create keyword record
    const keywordRecord = await this.getOrCreateKeyword(projectId, workspaceId, keyword);

    // Fetch SERP data (using DataForSEO or similar API)
    const serpData = await this.fetchSerpData(keyword, engine, location, device, language);

    // Capture screenshot if enabled
    let screenshotUrl: string | undefined;
    if (captureScreenshot) {
      screenshotUrl = await this.captureScreenshot(keyword, engine, location, device);
    }

    // Store HTML if enabled
    let htmlSnapshotUrl: string | undefined;
    if (captureHtml && serpData.html) {
      htmlSnapshotUrl = await this.storeHtmlSnapshot(workspaceId, keyword, serpData.html);
    }

    // Parse results
    const organicResults = this.parseOrganicResults(serpData.results, projectId);
    const features = this.detectFeatures(serpData);

    // Store snapshot
    const { data: snapshot, error } = await supabase
      .from('search_serp_snapshots')
      .insert({
        keyword_id: keywordRecord.id,
        project_id: projectId,
        workspace_id: workspaceId,
        engine,
        snapshot_date: new Date().toISOString(),
        location,
        device,
        language,
        total_results: serpData.totalResults,
        organic_results: organicResults,
        features,
        screenshot_url: screenshotUrl,
        html_snapshot_url: htmlSnapshotUrl,
        raw_data: serpData.raw,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update keyword with current rank
    const ourResult = organicResults.find((r) => r.isOurSite);
    if (ourResult) {
      await supabase
        .from('search_keywords')
        .update({
          current_rank: ourResult.position,
          previous_rank: keywordRecord.currentRank,
          best_rank: Math.min(ourResult.position, keywordRecord.bestRank || 100),
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', keywordRecord.id);
    } else {
      await supabase
        .from('search_keywords')
        .update({
          current_rank: null,
          previous_rank: keywordRecord.currentRank,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', keywordRecord.id);
    }

    return this.mapSnapshotFromDb(snapshot);
  }

  /**
   * Batch capture snapshots for multiple keywords
   */
  async batchCaptureSnapshots(
    projectId: string,
    workspaceId: string,
    keywords: string[],
    options: CaptureOptions = {}
  ): Promise<{
    captured: SerpSnapshot[];
    errors: Array<{ keyword: string; error: string }>;
  }> {
    const captured: SerpSnapshot[] = [];
    const errors: Array<{ keyword: string; error: string }> = [];

    // Respect rate limits
    const batchSize = this.config.rateLimits.maxRequestsPerMinute;
    const delayMs = 60000 / batchSize;

    for (const keyword of keywords) {
      try {
        const snapshot = await this.captureSnapshot(projectId, workspaceId, keyword, options);
        captured.push(snapshot);
        await this.delay(delayMs);
      } catch (error) {
        errors.push({ keyword, error: String(error) });
      }
    }

    return { captured, errors };
  }

  /**
   * Analyze SERP for optimization opportunities
   */
  async analyzeSerpOpportunity(
    projectId: string,
    workspaceId: string,
    keyword: string
  ): Promise<SerpAnalysis> {
    const supabase = await getSupabaseServer();

    // Get project to identify our domain
    const { data: project } = await supabase
      .from('search_projects')
      .select('domain, competitors')
      .eq('id', projectId)
      .single();

    // Get latest snapshot
    const { data: latestSnapshot } = await supabase
      .from('search_serp_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .eq('keyword_id', (await this.getKeywordId(projectId, keyword)))
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (!latestSnapshot) {
      throw new Error('No SERP snapshot found for this keyword');
    }

    const organicResults = latestSnapshot.organic_results as SerpResult[];
    const ourResult = organicResults.find((r) => r.isOurSite);
    const competitors = project?.competitors || [];

    // Find competitor positions
    const competitorPositions = organicResults
      .filter((r) => competitors.some((c: string) => r.domain.includes(c)))
      .map((r) => ({
        domain: r.domain,
        position: r.position,
        url: r.url,
      }));

    // Calculate difficulty based on competition
    const difficulty = this.calculateDifficulty(organicResults, competitors);

    // Determine opportunity level
    const opportunity = this.assessOpportunity(ourResult?.position, competitorPositions, difficulty);

    return {
      keyword,
      engine: latestSnapshot.engine as SearchEngine,
      ourPosition: ourResult?.position,
      ourUrl: ourResult?.url,
      competitorPositions,
      features: latestSnapshot.features as SerpFeature[],
      totalResults: latestSnapshot.total_results,
      difficulty,
      opportunity,
    };
  }

  /**
   * Compare SERP changes over time
   */
  async compareSerpChanges(
    projectId: string,
    keywordId: string,
    days = 7
  ): Promise<{
    positionChange: number;
    featuresGained: SerpFeature[];
    featuresLost: SerpFeature[];
    newCompetitors: string[];
    droppedCompetitors: string[];
  }> {
    const supabase = await getSupabaseServer();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: snapshots } = await supabase
      .from('search_serp_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .eq('keyword_id', keywordId)
      .gte('snapshot_date', startDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (!snapshots || snapshots.length < 2) {
      return {
        positionChange: 0,
        featuresGained: [],
        featuresLost: [],
        newCompetitors: [],
        droppedCompetitors: [],
      };
    }

    const oldest = snapshots[0];
    const latest = snapshots[snapshots.length - 1];

    const oldResults = oldest.organic_results as SerpResult[];
    const newResults = latest.organic_results as SerpResult[];
    const oldFeatures = oldest.features as SerpFeature[];
    const newFeatures = latest.features as SerpFeature[];

    // Position change
    const oldOurPosition = oldResults.find((r) => r.isOurSite)?.position;
    const newOurPosition = newResults.find((r) => r.isOurSite)?.position;
    const positionChange = (oldOurPosition || 0) - (newOurPosition || 0); // Positive = improvement

    // Feature changes
    const featuresGained = newFeatures.filter((f) => !oldFeatures.includes(f));
    const featuresLost = oldFeatures.filter((f) => !newFeatures.includes(f));

    // Competitor changes (top 10)
    const oldTop10 = oldResults.slice(0, 10).map((r) => r.domain);
    const newTop10 = newResults.slice(0, 10).map((r) => r.domain);
    const newCompetitors = newTop10.filter((d) => !oldTop10.includes(d));
    const droppedCompetitors = oldTop10.filter((d) => !newTop10.includes(d));

    return {
      positionChange,
      featuresGained,
      featuresLost,
      newCompetitors,
      droppedCompetitors,
    };
  }

  /**
   * Get historical snapshots for a keyword
   */
  async getSnapshotHistory(
    projectId: string,
    keywordId: string,
    limit = 30
  ): Promise<SerpSnapshot[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('search_serp_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .eq('keyword_id', keywordId)
      .order('snapshot_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(this.mapSnapshotFromDb);
  }

  // Private helper methods

  private async fetchSerpData(
    keyword: string,
    engine: SearchEngine,
    location?: string,
    device?: string,
    language?: string
  ): Promise<{
    results: Array<{
      position: number;
      url: string;
      title: string;
      description?: string;
      features?: string[];
    }>;
    totalResults: number;
    features: Record<string, unknown>;
    html?: string;
    raw: Record<string, unknown>;
  }> {
    // In production, this would call DataForSEO or similar SERP API
    // For now, return mock structure
    const mockResults = [];
    for (let i = 1; i <= 10; i++) {
      mockResults.push({
        position: i,
        url: `https://example${i}.com/page`,
        title: `Result ${i} for ${keyword}`,
        description: `Description for result ${i}`,
      });
    }

    return {
      results: mockResults,
      totalResults: 1000000,
      features: {
        featured_snippet: false,
        people_also_ask: true,
        local_pack: false,
      },
      raw: { engine, location, device, language },
    };
  }

  private async captureScreenshot(
    keyword: string,
    engine: SearchEngine,
    location?: string,
    device?: string
  ): Promise<string | undefined> {
    // In production, use Playwright or screenshot service
    // Return storage URL
    return undefined;
  }

  private async storeHtmlSnapshot(
    workspaceId: string,
    keyword: string,
    html: string
  ): Promise<string> {
    const supabase = await getSupabaseServer();
    const filename = `serp-${keyword.replace(/\s+/g, '-')}-${Date.now()}.html`;

    const { data, error } = await supabase.storage
      .from('serp-snapshots')
      .upload(`${workspaceId}/${filename}`, html, {
        contentType: 'text/html',
      });

    if (error) {
      throw error;
    }

    return data.path;
  }

  private parseOrganicResults(
    results: Array<{
      position: number;
      url: string;
      title: string;
      description?: string;
      features?: string[];
    }>,
    projectId: string
  ): SerpResult[] {
    // Get project domain would be async in production
    const ourDomain = 'example.com'; // Placeholder

    return results.map((r) => ({
      position: r.position,
      url: r.url,
      domain: new URL(r.url).hostname.replace('www.', ''),
      title: r.title,
      description: r.description,
      isOurSite: r.url.includes(ourDomain),
      features: r.features as SerpFeature[],
    }));
  }

  private detectFeatures(serpData: {
    features: Record<string, unknown>;
  }): SerpFeature[] {
    const features: SerpFeature[] = [];
    const featureMap: Record<string, SerpFeature> = {
      featured_snippet: 'featured_snippet',
      people_also_ask: 'people_also_ask',
      knowledge_panel: 'knowledge_panel',
      local_pack: 'local_pack',
      image_pack: 'image_pack',
      video_carousel: 'video_carousel',
      shopping_results: 'shopping_results',
      news_box: 'news_box',
      related_searches: 'related_searches',
      ads_top: 'ads_top',
      ads_bottom: 'ads_bottom',
      site_links: 'site_links',
    };

    for (const [key, feature] of Object.entries(featureMap)) {
      if (serpData.features[key]) {
        features.push(feature);
      }
    }

    return features;
  }

  private async getOrCreateKeyword(
    projectId: string,
    workspaceId: string,
    keyword: string
  ): Promise<SearchKeyword> {
    const supabase = await getSupabaseServer();

    // Try to find existing
    const { data: existing } = await supabase
      .from('search_keywords')
      .select('*')
      .eq('project_id', projectId)
      .eq('keyword', keyword)
      .single();

    if (existing) {
      return this.mapKeywordFromDb(existing);
    }

    // Create new
    const { data: created, error } = await supabase
      .from('search_keywords')
      .insert({
        project_id: projectId,
        workspace_id: workspaceId,
        keyword,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapKeywordFromDb(created);
  }

  private async getKeywordId(projectId: string, keyword: string): Promise<string | null> {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('search_keywords')
      .select('id')
      .eq('project_id', projectId)
      .eq('keyword', keyword)
      .single();
    return data?.id || null;
  }

  private calculateDifficulty(results: SerpResult[], competitors: string[]): number {
    // Simple difficulty calculation based on:
    // - Domain authority of top results (estimated)
    // - Presence of major brands
    // - Competitor presence

    const majorBrands = ['wikipedia.org', 'amazon.com', 'youtube.com', 'facebook.com'];
    let difficulty = 50; // Base

    // Check top 10
    const top10 = results.slice(0, 10);

    // Major brands increase difficulty
    const brandCount = top10.filter((r) => majorBrands.some((b) => r.domain.includes(b))).length;
    difficulty += brandCount * 5;

    // Competitors in top 10 increase difficulty
    const competitorCount = top10.filter((r) =>
      competitors.some((c) => r.domain.includes(c))
    ).length;
    difficulty += competitorCount * 3;

    return Math.min(100, Math.max(0, difficulty));
  }

  private assessOpportunity(
    ourPosition: number | undefined,
    competitorPositions: Array<{ position: number }>,
    difficulty: number
  ): 'high' | 'medium' | 'low' | 'none' {
    // Not ranking = potential opportunity if difficulty is low
    if (!ourPosition) {
      if (difficulty < 40) {
return 'high';
}
      if (difficulty < 60) {
return 'medium';
}
      if (difficulty < 80) {
return 'low';
}
      return 'none';
    }

    // Already top 3 = low opportunity for improvement
    if (ourPosition <= 3) {
return 'low';
}

    // Position 4-10 with low difficulty = high opportunity
    if (ourPosition <= 10 && difficulty < 50) {
return 'high';
}
    if (ourPosition <= 10) {
return 'medium';
}

    // Position 11-20 = medium opportunity
    if (ourPosition <= 20) {
return 'medium';
}

    // Beyond page 2 = depends on difficulty
    return difficulty < 60 ? 'medium' : 'low';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapSnapshotFromDb(data: Record<string, unknown>): SerpSnapshot {
    return {
      id: data.id as string,
      keywordId: data.keyword_id as string,
      projectId: data.project_id as string,
      workspaceId: data.workspace_id as string,
      engine: data.engine as SearchEngine,
      snapshotDate: new Date(data.snapshot_date as string),
      location: data.location as string | undefined,
      device: data.device as 'desktop' | 'mobile',
      language: data.language as string | undefined,
      totalResults: data.total_results as number | undefined,
      organicResults: data.organic_results as SerpResult[],
      features: data.features as SerpFeature[],
      screenshotUrl: data.screenshot_url as string | undefined,
      htmlSnapshotUrl: data.html_snapshot_url as string | undefined,
      rawData: data.raw_data as Record<string, unknown> | undefined,
      createdAt: new Date(data.created_at as string),
    };
  }

  private mapKeywordFromDb(data: Record<string, unknown>): SearchKeyword {
    return {
      id: data.id as string,
      projectId: data.project_id as string,
      workspaceId: data.workspace_id as string,
      keyword: data.keyword as string,
      searchVolume: data.search_volume as number | undefined,
      difficulty: data.difficulty as number | undefined,
      cpc: data.cpc as number | undefined,
      status: data.status as 'active' | 'paused' | 'archived',
      tags: data.tags as string[] | undefined,
      targetUrl: data.target_url as string | undefined,
      priority: data.priority as number | undefined,
      currentRank: data.current_rank as number | undefined,
      previousRank: data.previous_rank as number | undefined,
      bestRank: data.best_rank as number | undefined,
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }
}

export const serpSnapshotService = new SerpSnapshotService();
