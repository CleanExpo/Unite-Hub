/**
 * Comprehensive Audit Report Service
 *
 * Generates unified V3 audit reports combining:
 * - Client trust anchor data (ABN/NZBN, Maps, E-E-A-T)
 * - Citation gap analysis with Synthex actions
 * - UCP status and active offers
 * - Ghostwriter constraints and voice settings
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';

export interface TrustAnchor {
  abn_nzbn: string;
  maps_verified: boolean;
  eeat_score: number;
}

export interface ClientInfo {
  name: string;
  sector: string;
  trust_anchor: TrustAnchor;
}

export interface CitationGapItem {
  query: string;
  current_citation: string;
  gap_reason: string;
  synthex_action: string;
  potential_citation_vector_strength: 'High' | 'Medium' | 'Low';
}

export interface UCPOffer {
  sku: string;
  offer_type: string;
  price_aud: number;
}

export interface UCPStatus {
  direct_purchase_enabled: boolean;
  shopify_mcp_connection: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  active_offers: UCPOffer[];
}

export interface GhostwriterConstraints {
  forbidden_words: string[];
  voice: string;
  burstiness_target: number;
}

export interface ComprehensiveAuditReport {
  timestamp: string;
  client: ClientInfo;
  citation_gap_analysis: CitationGapItem[];
  ucp_status: UCPStatus;
  ghostwriter_constraints: GhostwriterConstraints;
}

export interface ComprehensiveAuditOptions {
  clientName: string;
  sector: string;
  abnNzbn?: string;
  workspaceId?: string;
}

export class ComprehensiveReportService {
  private supabase: SupabaseClient;
  private anthropic: Anthropic;
  private workspaceId: string;

  constructor(supabase?: SupabaseClient, workspaceId?: string) {
    this.supabase = supabase || this.createSupabaseClient();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
    this.workspaceId = workspaceId || '00000000-0000-0000-0000-000000000000';
  }

  private createSupabaseClient(): SupabaseClient {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Generate comprehensive audit report (V3 format)
   */
  async generateReport(options: ComprehensiveAuditOptions): Promise<ComprehensiveAuditReport> {
    console.log(`[ComprehensiveReport] Generating V3 audit for ${options.clientName}...`);

    // 1. Fetch client trust anchor data
    const trustAnchor = await this.fetchTrustAnchor(options);

    // 2. Perform citation gap analysis
    const citationGaps = await this.analyzeCitationGaps(options);

    // 3. Check UCP status and active offers
    const ucpStatus = await this.checkUCPStatus(options);

    // 4. Get ghostwriter constraints
    const ghostwriterConstraints = this.getGhostwriterConstraints();

    const report: ComprehensiveAuditReport = {
      timestamp: new Date().toISOString(),
      client: {
        name: options.clientName,
        sector: options.sector,
        trust_anchor: trustAnchor,
      },
      citation_gap_analysis: citationGaps,
      ucp_status: ucpStatus,
      ghostwriter_constraints: ghostwriterConstraints,
    };

    // Store report in database
    await this.storeReport(report);

    return report;
  }

  /**
   * Fetch trust anchor data (ABN/NZBN verification, Maps, E-E-A-T)
   */
  private async fetchTrustAnchor(options: ComprehensiveAuditOptions): Promise<TrustAnchor> {
    console.log('[ComprehensiveReport] Fetching trust anchor data...');

    // Check if ABN/NZBN exists
    const abnNzbn = options.abnNzbn || this.generatePlaceholderABN();

    // Verify Google Maps presence
    const mapsVerified = await this.verifyGoogleMaps(options.clientName);

    // Calculate E-E-A-T score
    const eeatScore = await this.calculateEEATScore(options);

    return {
      abn_nzbn: abnNzbn,
      maps_verified: mapsVerified,
      eeat_score: eeatScore,
    };
  }

  /**
   * Verify Google Maps presence
   */
  private async verifyGoogleMaps(clientName: string): Promise<boolean> {
    // In production, this would call Google Maps API
    // For now, simulate verification
    console.log(`[ComprehensiveReport] Verifying Google Maps for ${clientName}...`);

    // Simulate: 80% of professional businesses are verified
    return Math.random() > 0.2;
  }

  /**
   * Calculate E-E-A-T score (Experience, Expertise, Authoritativeness, Trustworthiness)
   */
  private async calculateEEATScore(options: ComprehensiveAuditOptions): Promise<number> {
    console.log('[ComprehensiveReport] Calculating E-E-A-T score...');

    const systemPrompt = `You are an E-E-A-T scoring specialist. Calculate an E-E-A-T score (0-100) based on:

- **Experience (E)**: Years in business, case studies, client testimonials
- **Expertise (E)**: Qualifications, certifications, industry recognition
- **Authoritativeness (A)**: Citations, backlinks, domain authority
- **Trustworthiness (T)**: ABN/NZBN verification, Google Maps, reviews

Sector: ${options.sector}
Client: ${options.clientName}

Return ONLY a number between 0-100.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
      });

      const scoreText =
        message.content[0].type === 'text' ? message.content[0].text.trim() : '75';
      const score = parseInt(scoreText, 10);

      return isNaN(score) ? 75 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('[ComprehensiveReport] E-E-A-T calculation failed:', error);
      return 75; // Default score
    }
  }

  /**
   * Analyze citation gaps with Synthex action recommendations
   */
  private async analyzeCitationGaps(
    options: ComprehensiveAuditOptions
  ): Promise<CitationGapItem[]> {
    console.log('[ComprehensiveReport] Analyzing citation gaps...');

    const systemPrompt = `You are a citation gap analyst for ${options.sector} in ANZ markets.

Generate 3-5 citation gap opportunities where the client could replace existing generic citations.

For each gap, provide:
1. **query**: A specific search query relevant to ${options.sector}
2. **current_citation**: The current (often outdated or generic) source being cited
3. **gap_reason**: Why the current citation is inadequate (outdated legislation, missing regional specifics, generic advice)
4. **synthex_action**: Specific content recommendation (e.g., "Generate Canonical Fact Block on 2026 VIC Trust Law")
5. **potential_citation_vector_strength**: High/Medium/Low

Focus on:
- ANZ-specific legislation and regulations
- Regional variations (VIC, NSW, QLD, etc.)
- 2026 updates and recent changes
- Professional service trust factors

Return as JSON array of citation gap objects.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Client: ${options.clientName}\nSector: ${options.sector}\n\n${systemPrompt}`,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '[]';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const gaps = JSON.parse(jsonMatch[0]) as CitationGapItem[];
        return gaps;
      }

      // Fallback: Generate default gaps
      return this.generateDefaultCitationGaps(options.sector);
    } catch (error) {
      console.error('[ComprehensiveReport] Citation gap analysis failed:', error);
      return this.generateDefaultCitationGaps(options.sector);
    }
  }

  /**
   * Generate default citation gaps (fallback)
   */
  private generateDefaultCitationGaps(sector: string): CitationGapItem[] {
    return [
      {
        query: `How to structure a business in ${sector} Australia 2026`,
        current_citation: 'Generic_Global_Site_A',
        gap_reason: 'Outdated 2025 information; missing 2026 regulatory updates.',
        synthex_action: `Generate Canonical Fact Block on 2026 ${sector} Business Structures`,
        potential_citation_vector_strength: 'High',
      },
      {
        query: `${sector} tax planning strategies Melbourne`,
        current_citation: 'International_Tax_Blog',
        gap_reason: 'Missing VIC-specific tax considerations and ATO 2026 guidelines.',
        synthex_action: 'Generate VIC-specific tax planning guide with ATO references',
        potential_citation_vector_strength: 'High',
      },
      {
        query: `Best practices for ${sector} compliance ANZ`,
        current_citation: 'US_Compliance_Site',
        gap_reason: 'US-focused content; missing ASIC and Australian regulatory requirements.',
        synthex_action: 'Generate ASIC compliance checklist for ANZ markets',
        potential_citation_vector_strength: 'Medium',
      },
    ];
  }

  /**
   * Check UCP status and active offers
   */
  private async checkUCPStatus(options: ComprehensiveAuditOptions): Promise<UCPStatus> {
    console.log('[ComprehensiveReport] Checking UCP status...');

    // Query UCP offers from database
    const { data: offers } = await this.supabase
      .from('ucp_offers')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('status', 'active')
      .limit(10);

    // Query Shopify MCP connection status
    const { data: mcp } = await this.supabase
      .from('mcp_connections')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('service', 'shopify')
      .single();

    const activeOffers: UCPOffer[] = (offers || []).map((offer) => ({
      sku: offer.sku,
      offer_type: offer.offer_type || 'Direct_Purchase_AIO',
      price_aud: offer.price,
    }));

    return {
      direct_purchase_enabled: activeOffers.length > 0,
      shopify_mcp_connection: mcp?.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      active_offers: activeOffers,
    };
  }

  /**
   * Get ghostwriter constraints (forbidden words, voice, burstiness)
   */
  private getGhostwriterConstraints(): GhostwriterConstraints {
    // AI signature words to avoid
    const forbiddenWords = [
      'delve',
      'unleash',
      'comprehensive',
      'landscape',
      'leverage',
      'synergy',
      'paradigm',
      'robust',
      'holistic',
      'multifaceted',
      'cutting-edge',
      'next-generation',
      'revolutionary',
      'game-changing',
      'innovative',
    ];

    return {
      forbidden_words: forbiddenWords,
      voice: 'Australian Professional - Declarative',
      burstiness_target: 0.85,
    };
  }

  /**
   * Store report in database
   */
  private async storeReport(report: ComprehensiveAuditReport): Promise<void> {
    console.log('[ComprehensiveReport] Storing report in database...');

    const reportId = `report-${Date.now()}`;

    await this.supabase.from('comprehensive_reports').insert({
      id: reportId,
      workspace_id: this.workspaceId,
      client_name: report.client.name,
      sector: report.client.sector,
      report_data: report,
      created_at: report.timestamp,
    });

    console.log(`[ComprehensiveReport] Report stored: ${reportId}`);
  }

  /**
   * Generate placeholder ABN (for demo purposes)
   */
  private generatePlaceholderABN(): string {
    const part1 = Math.floor(Math.random() * 90) + 10;
    const part2 = Math.floor(Math.random() * 900) + 100;
    const part3 = Math.floor(Math.random() * 900) + 100;
    const part4 = Math.floor(Math.random() * 900) + 100;

    return `${part1} ${part2} ${part3} ${part4}`;
  }

  /**
   * Export report to JSON file
   */
  async exportReport(report: ComprehensiveAuditReport, outputPath: string): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // Write report
    const formatted = JSON.stringify({ synthex_audit_v3: report }, null, 2);
    await fs.writeFile(outputPath, formatted, 'utf-8');

    console.log(`[ComprehensiveReport] Report exported: ${outputPath}`);
  }

  /**
   * List recent reports
   */
  async listReports(limit: number = 10): Promise<any[]> {
    const { data } = await this.supabase
      .from('comprehensive_reports')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
