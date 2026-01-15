/**
 * Audit Service - Citation Gap Analysis & Competitive Intelligence
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import type { CitationSource } from './scout-service.js';

export interface CompetitorAnalysis {
  domain: string;
  authority: number;
  totalCitations: number;
  aiOverviewCitations: number;
  citationAdvantage: number;
  topCitationSources: CitationSource[];
}

export interface CitationGap {
  id: string;
  source: CitationSource;
  presentInCompetitors: string[];
  missingFromClient: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  actionableSteps: string[];
}

export interface CitationOpportunity {
  id: string;
  gap: CitationGap;
  type: 'quick_win' | 'strategic' | 'long_term';
  recommendedAction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTimeframe: string;
  potentialImpact: number;
}

export interface CitationGapAnalysis {
  clientDomain: string;
  competitors: CompetitorAnalysis[];
  gaps: CitationGap[];
  opportunities: CitationOpportunity[];
  summary: {
    totalGaps: number;
    highPriorityGaps: number;
    quickWinOpportunities: number;
    opportunityScore: number;
    estimatedCatchUpTime: string;
  };
  completedAt: string;
}

export class AuditService {
  private supabase;
  private workspaceId: string;

  constructor() {
    const config = ConfigManager.getInstance();
    this.workspaceId = config.getWorkspaceId();

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async analyzeCitationGap(
    clientDomain: string,
    competitorLimit: number = 10
  ): Promise<CitationGapAnalysis> {
    console.log(`[Audit] Starting citation gap analysis for ${clientDomain}`);

    // 1. Get client citations
    const clientCitations = await this.getClientCitations(clientDomain);
    console.log(`[Audit] Found ${clientCitations.length} client citations`);

    // 2. Get competitor citations
    const competitors = await this.getCompetitorCitations(clientDomain, competitorLimit);
    console.log(`[Audit] Analyzed ${competitors.length} competitors`);

    // 3. Identify gaps
    const gaps = this.identifyGaps(clientCitations, competitors);
    console.log(`[Audit] Identified ${gaps.length} citation gaps`);

    // 4. Find opportunities
    const opportunities = this.findOpportunities(gaps, competitors);
    console.log(`[Audit] Found ${opportunities.length} opportunities`);

    // 5. Calculate summary
    const summary = this.calculateSummary(gaps, opportunities);

    // 6. Store audit results
    await this.storeAuditResults({
      clientDomain,
      competitors,
      gaps,
      opportunities,
      summary,
    });

    return {
      clientDomain,
      competitors,
      gaps,
      opportunities,
      summary,
      completedAt: new Date().toISOString(),
    };
  }

  private async getClientCitations(clientDomain: string): Promise<CitationSource[]> {
    const { data } = await this.supabase
      .from('citation_sources')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('domain', clientDomain);

    return (data || []).map(this.mapToCitationSource);
  }

  private async getCompetitorCitations(
    clientDomain: string,
    limit: number
  ): Promise<CompetitorAnalysis[]> {
    // Get competitor domains from database or discover them
    const competitorDomains = await this.discoverCompetitors(clientDomain, limit);

    const analyses: CompetitorAnalysis[] = [];

    for (const domain of competitorDomains) {
      const { data } = await this.supabase
        .from('citation_sources')
        .select('*')
        .eq('workspace_id', this.workspaceId)
        .eq('domain', domain);

      const citations = (data || []).map(this.mapToCitationSource);
      const aiOverviewCitations = citations.filter((c) => c.citationType === 'ai_overview');

      const avgAuthority = citations.length > 0
        ? citations.reduce((sum, c) => sum + c.authority, 0) / citations.length
        : 0;

      analyses.push({
        domain,
        authority: Math.round(avgAuthority),
        totalCitations: citations.length,
        aiOverviewCitations: aiOverviewCitations.length,
        citationAdvantage: citations.length,
        topCitationSources: citations
          .sort((a, b) => b.authority - a.authority)
          .slice(0, 10),
      });
    }

    return analyses.sort((a, b) => b.totalCitations - a.totalCitations);
  }

  private async discoverCompetitors(clientDomain: string, limit: number): Promise<string[]> {
    // Mock implementation - in production, use SEO APIs to discover competitors
    const mockCompetitors = [
      'competitor1.com',
      'competitor2.com',
      'competitor3.com',
      'competitor4.com',
      'competitor5.com',
    ];
    return mockCompetitors.slice(0, limit);
  }

  private identifyGaps(
    clientCitations: CitationSource[],
    competitors: CompetitorAnalysis[]
  ): CitationGap[] {
    const gaps: CitationGap[] = [];
    const clientUrls = new Set(clientCitations.map((c) => c.url));

    // Find citations that competitors have but client doesn't
    const competitorCitations = new Map<string, string[]>();

    competitors.forEach((comp) => {
      comp.topCitationSources.forEach((citation) => {
        if (!clientUrls.has(citation.url)) {
          if (!competitorCitations.has(citation.url)) {
            competitorCitations.set(citation.url, []);
          }
          competitorCitations.get(citation.url)!.push(comp.domain);
        }
      });
    });

    // Convert to CitationGap objects
    let gapId = 1;
    competitorCitations.forEach((presentIn, url) => {
      // Find the citation source from competitors
      let source: CitationSource | undefined;
      for (const comp of competitors) {
        source = comp.topCitationSources.find((c) => c.url === url);
        if (source) break;
      }

      if (!source) return;

      const competitorCount = presentIn.length;
      const avgCompetitorCitations = competitors.reduce(
        (sum, c) => sum + c.totalCitations,
        0
      ) / competitors.length;

      // Calculate priority based on how many competitors have it
      let priority: 'high' | 'medium' | 'low';
      if (competitorCount >= 3 && source.authority >= 70) {
        priority = 'high';
      } else if (competitorCount >= 2 || source.authority >= 60) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Estimate impact
      const estimatedImpact = Math.round(
        (source.authority / 100) * (competitorCount / competitors.length) * 100
      );

      // Generate actionable steps
      const actionableSteps = this.generateActionSteps(source, competitorCount);

      gaps.push({
        id: `gap-${gapId++}`,
        source,
        presentInCompetitors: presentIn,
        missingFromClient: true,
        priority,
        estimatedImpact,
        actionableSteps,
      });
    });

    return gaps.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateActionSteps(source: CitationSource, competitorCount: number): string[] {
    const steps: string[] = [];

    if (source.citationType === 'ai_overview') {
      steps.push('Create comprehensive, authoritative content targeting this topic');
      steps.push('Ensure E-E-A-T signals (expertise, authority, trustworthiness)');
      steps.push('Include structured data markup (FAQ, HowTo, etc.)');
    }

    if (source.authority >= 70) {
      steps.push(`Reach out to ${source.domain} for guest posting or collaboration`);
      steps.push('Create linkable assets (infographics, research, tools)');
    }

    if (competitorCount >= 3) {
      steps.push('Priority target - multiple competitors already cited here');
      steps.push('Analyze competitor content strategies on this source');
    }

    steps.push(`Research ${source.domain} content guidelines and audience`);
    steps.push('Develop unique angle or data to pitch');

    return steps;
  }

  private findOpportunities(
    gaps: CitationGap[],
    competitors: CompetitorAnalysis[]
  ): CitationOpportunity[] {
    const opportunities: CitationOpportunity[] = [];
    let oppId = 1;

    gaps.forEach((gap) => {
      let type: 'quick_win' | 'strategic' | 'long_term';
      let difficulty: 'easy' | 'medium' | 'hard';
      let timeframe: string;

      // Classify opportunity
      if (
        gap.priority === 'high' &&
        gap.source.authority >= 70 &&
        gap.presentInCompetitors.length >= 3
      ) {
        type = 'strategic';
        difficulty = 'hard';
        timeframe = '3-6 months';
      } else if (
        gap.priority === 'medium' &&
        gap.source.authority >= 50 &&
        gap.presentInCompetitors.length >= 2
      ) {
        type = 'strategic';
        difficulty = 'medium';
        timeframe = '1-3 months';
      } else {
        type = 'quick_win';
        difficulty = 'easy';
        timeframe = '2-4 weeks';
      }

      // Generate recommendation
      const recommendedAction = this.generateRecommendation(gap, type);

      opportunities.push({
        id: `opp-${oppId++}`,
        gap,
        type,
        recommendedAction,
        difficulty,
        estimatedTimeframe: timeframe,
        potentialImpact: gap.estimatedImpact,
      });
    });

    return opportunities.sort((a, b) => {
      const typeOrder = { quick_win: 3, strategic: 2, long_term: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });
  }

  private generateRecommendation(gap: CitationGap, type: string): string {
    const source = gap.source;

    if (type === 'quick_win') {
      return `Quick win: Create optimized content for ${source.domain}. Focus on ${source.citationType} opportunities. Estimated effort: 2-4 weeks.`;
    } else if (type === 'strategic') {
      return `Strategic initiative: Build relationship with ${source.domain} (DA ${source.authority}). ${gap.presentInCompetitors.length} competitors already cited. Develop comprehensive content strategy.`;
    } else {
      return `Long-term investment: Target ${source.domain} for sustained citation building. Requires ongoing content development and relationship nurturing.`;
    }
  }

  private calculateSummary(gaps: CitationGap[], opportunities: CitationOpportunity[]) {
    const highPriorityGaps = gaps.filter((g) => g.priority === 'high').length;
    const quickWinOpportunities = opportunities.filter((o) => o.type === 'quick_win').length;

    // Calculate opportunity score (0-100)
    const avgImpact = gaps.length > 0
      ? gaps.reduce((sum, g) => sum + g.estimatedImpact, 0) / gaps.length
      : 0;

    const opportunityScore = Math.round(avgImpact * (1 + quickWinOpportunities / 10));

    // Estimate catch-up time
    let estimatedCatchUpTime: string;
    if (highPriorityGaps >= 10) {
      estimatedCatchUpTime = '12-18 months';
    } else if (highPriorityGaps >= 5) {
      estimatedCatchUpTime = '6-12 months';
    } else {
      estimatedCatchUpTime = '3-6 months';
    }

    return {
      totalGaps: gaps.length,
      highPriorityGaps,
      quickWinOpportunities,
      opportunityScore,
      estimatedCatchUpTime,
    };
  }

  private async storeAuditResults(analysis: Omit<CitationGapAnalysis, 'completedAt'>) {
    const auditRecord = {
      workspace_id: this.workspaceId,
      client_domain: analysis.clientDomain,
      total_gaps: analysis.summary.totalGaps,
      high_priority_gaps: analysis.summary.highPriorityGaps,
      opportunity_score: analysis.summary.opportunityScore,
      competitors_analyzed: analysis.competitors.length,
      analysis_data: {
        competitors: analysis.competitors,
        gaps: analysis.gaps,
        opportunities: analysis.opportunities,
        summary: analysis.summary,
      },
      created_at: new Date().toISOString(),
    };

    await this.supabase.from('citation_audits').insert(auditRecord);
  }

  private mapToCitationSource(row: any): CitationSource {
    return {
      id: row.id,
      url: row.url,
      domain: row.domain,
      authority: row.authority || 0,
      citationCount: row.citation_count || 0,
      sectors: row.sectors || [],
      discoveredAt: row.created_at,
      citationType: row.citation_type || 'organic',
      metadata: row.metadata || {},
    };
  }

  async getRecentAudits(limit: number = 10): Promise<any[]> {
    const { data } = await this.supabase
      .from('citation_audits')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
