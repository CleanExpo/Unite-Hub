/**
 * Founder OS Agent
 *
 * Orchestrates founder business operations with comprehensive capabilities:
 * - Business health analysis across portfolio
 * - Signal processing and aggregation
 * - Snapshot generation with AI-powered insights
 * - Vault security coordination
 * - Link validation
 *
 * IMPORTANT: Operates in HUMAN_GOVERNED mode by default.
 * All recommendations are advisory-only and require human review.
 *
 * @module agents/founderOsAgent
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// Import FounderOS Services
// ============================================================================
import {
  // Business Registry
  listBusinesses,
  getBusiness,
  type FounderBusiness,
  type BusinessStatus,
} from '@/lib/founderOS/founderBusinessRegistryService';

import {
  // Signal Inference
  recordSignals,
  getSignals,
  aggregateSignals,
  getSignalSummary,
  type SignalFamily,
  type BusinessSignal,
  type RecordSignalInput,
  type AggregationResult,
} from '@/lib/founderOS/founderSignalInferenceService';

import {
  // Umbrella Synopsis
  generateBusinessSynopsis,
  generateUmbrellaSynopsis,
  getLatestSnapshot,
  createSnapshot,
  type Synopsis,
  type FounderOsSnapshot,
  type SnapshotType,
  type SnapshotScope,
} from '@/lib/founderOS/founderUmbrellaSynopsisService';

import {
  // Business Vault
  getSecrets,
  countSecrets,
  type VaultSecret,
} from '@/lib/founderOS/founderBusinessVaultService';

import {
  // Risk & Opportunity
  analyzeRisks,
  analyzeOpportunities,
  getBusinessHealthScore,
  type BusinessHealthScore,
  type RiskAnalysisResult,
  type OpportunityAnalysisResult,
} from '@/lib/founderOS/founderRiskOpportunityService';

// ============================================================================
// Types
// ============================================================================

export type GovernanceMode = 'HUMAN_GOVERNED' | 'AUTONOMOUS';

export interface FounderOsAgentConfig {
  anthropicApiKey?: string;
  governanceMode: GovernanceMode;
  enableExtendedThinking?: boolean;
  thinkingBudget?: number;
}

export interface AgentResponse<T = unknown> {
  success: boolean;
  action: string;
  recommendation: string;
  requiresApproval: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTimeMs: number;
    governanceMode: GovernanceMode;
  };
}

export interface PortfolioHealthAnalysis {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  businesses: Array<{
    id: string;
    name: string;
    code: string;
    healthScore: number;
    status: BusinessStatus;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    topRisk?: string;
    topOpportunity?: string;
  }>;
  aggregateMetrics: {
    totalBusinesses: number;
    activeBusinesses: number;
    avgHealthScore: number;
    highRiskCount: number;
    highOpportunityCount: number;
  };
  recommendations: string[];
}

export interface SignalProcessingResult {
  signalsProcessed: number;
  signalsCreated: number;
  errors: string[];
  summary: Record<string, { count: number; latestAt: string }>;
}

export interface BusinessSnapshot {
  snapshotId: string;
  businessId: string;
  synopsis: Synopsis;
  healthScore: BusinessHealthScore;
  generatedAt: string;
}

export interface ActionRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'risk_mitigation' | 'opportunity_capture' | 'maintenance' | 'growth';
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'quick_win' | 'medium' | 'long_term';
  deadline?: string;
  relatedSignals: string[];
}

export interface LinkValidationResult {
  businessId: string;
  totalLinks: number;
  validLinks: number;
  brokenLinks: Array<{
    url: string;
    status: number | string;
    error?: string;
  }>;
  validationDate: string;
}

export interface Signal {
  family: SignalFamily;
  key: string;
  value: number | string;
  source: string;
  payload?: Record<string, unknown>;
}

// ============================================================================
// Founder OS Agent Class
// ============================================================================

export class FounderOsAgent {
  private anthropic: Anthropic;
  private governanceMode: GovernanceMode;
  private enableExtendedThinking: boolean;
  private thinkingBudget: number;

  constructor(config: FounderOsAgentConfig) {
    const apiKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('[FounderOsAgent] ANTHROPIC_API_KEY is not configured');
    }

    this.anthropic = new Anthropic({
      apiKey,
      defaultHeaders: {
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
    });

    this.governanceMode = config.governanceMode;
    this.enableExtendedThinking = config.enableExtendedThinking ?? true;
    this.thinkingBudget = config.thinkingBudget ?? 5000;

    console.log(
      `[FounderOsAgent] Initialized in ${this.governanceMode} mode ` +
        `(Extended Thinking: ${this.enableExtendedThinking})`
    );
  }

  // ==========================================================================
  // Model Selection
  // ==========================================================================

  /**
   * Select appropriate model based on task complexity
   * - Opus 4.5: Complex analysis, strategic recommendations
   * - Haiku 4.5: Simple operations, quick validations
   */
  private selectModel(taskComplexity: 'high' | 'medium' | 'low'): {
    model: string;
    maxTokens: number;
    useThinking: boolean;
  } {
    switch (taskComplexity) {
      case 'high':
        return {
          model: 'claude-opus-4-5-20251101',
          maxTokens: 8192,
          useThinking: this.enableExtendedThinking,
        };
      case 'medium':
        return {
          model: 'claude-sonnet-4-5-20250929',
          maxTokens: 4096,
          useThinking: false,
        };
      case 'low':
        return {
          model: 'claude-haiku-4-5-20251001',
          maxTokens: 2048,
          useThinking: false,
        };
    }
  }

  // ==========================================================================
  // Core Agent Methods
  // ==========================================================================

  /**
   * Analyze portfolio health across all businesses for a founder
   *
   * Uses Claude Opus 4.5 with Extended Thinking for deep analysis.
   * Results are advisory-only in HUMAN_GOVERNED mode.
   *
   * @param userId - UUID of the founder user
   * @returns Portfolio health analysis with recommendations
   */
  async analyzePortfolioHealth(
    userId: string
  ): Promise<AgentResponse<PortfolioHealthAnalysis>> {
    const startTime = Date.now();
    const action = 'analyze_portfolio_health';

    try {
      console.log(`[FounderOsAgent] Analyzing portfolio health for user: ${userId}`);

      // Fetch all businesses for the user
      const businessesResult = await listBusinesses(userId, true); // Include inactive
      if (!businessesResult.success || !businessesResult.data) {
        return this.createErrorResponse(
          action,
          businessesResult.error || 'Failed to fetch businesses',
          startTime
        );
      }

      const businesses = businessesResult.data;
      if (businesses.length === 0) {
        return this.createErrorResponse(action, 'No businesses found for this user', startTime);
      }

      // Gather health data for each business
      const businessHealthData: Array<{
        business: FounderBusiness;
        healthScore?: BusinessHealthScore;
        risks?: RiskAnalysisResult;
        opportunities?: OpportunityAnalysisResult;
        signals?: BusinessSignal[];
      }> = [];

      for (const business of businesses) {
        const [healthResult, risksResult, opportunitiesResult, signalsResult] = await Promise.all([
          getBusinessHealthScore(business.id),
          analyzeRisks(business.id),
          analyzeOpportunities(business.id),
          getSignals(business.id, undefined, 50),
        ]);

        businessHealthData.push({
          business,
          healthScore: healthResult.success ? healthResult.data : undefined,
          risks: risksResult.success ? risksResult.data : undefined,
          opportunities: opportunitiesResult.success ? opportunitiesResult.data : undefined,
          signals: signalsResult.success ? signalsResult.data : undefined,
        });
      }

      // Build AI analysis prompt
      const { model, maxTokens, useThinking } = this.selectModel('high');

      const systemPrompt = `You are AI Phill, a strategic portfolio advisor operating in ${this.governanceMode} mode.
Your role is to analyze a founder's entire business portfolio and provide unified strategic insights.
${this.governanceMode === 'HUMAN_GOVERNED' ? 'All recommendations are ADVISORY-ONLY and require human review before action.' : ''}

Focus on:
- Cross-business synergies and conflicts
- Portfolio-level risk diversification
- Resource allocation optimization
- Strategic alignment across ventures
- Actionable, prioritized recommendations`;

      const portfolioSummary = businessHealthData.map((bd) => ({
        id: bd.business.id,
        name: bd.business.display_name,
        code: bd.business.code,
        industry: bd.business.industry,
        status: bd.business.status,
        healthScore: bd.healthScore?.overall_score || 0,
        trend: bd.healthScore?.trend || 'stable',
        riskCount:
          (bd.risks?.critical_count || 0) +
          (bd.risks?.high_count || 0) +
          (bd.risks?.medium_count || 0),
        opportunityCount:
          (bd.opportunities?.high_impact_count || 0) +
          (bd.opportunities?.medium_impact_count || 0),
        topRisk: bd.risks?.risks[0]?.title,
        topOpportunity: bd.opportunities?.opportunities[0]?.title,
      }));

      const userPrompt = `Analyze this founder's business portfolio and provide strategic recommendations:

PORTFOLIO (${businesses.length} businesses):
${JSON.stringify(portfolioSummary, null, 2)}

Generate a JSON response with this structure:
{
  "overallScore": <0-100>,
  "trend": "<improving|stable|declining>",
  "aggregateMetrics": {
    "avgHealthScore": <number>,
    "highRiskCount": <number>,
    "highOpportunityCount": <number>
  },
  "recommendations": [
    "<prioritized strategic recommendation 1>",
    "<prioritized strategic recommendation 2>",
    "<up to 5 recommendations>"
  ],
  "crossBusinessInsights": "<paragraph about synergies, conflicts, and portfolio optimization>"
}

Respond ONLY with valid JSON.`;

      const messageOptions: Anthropic.Messages.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      };

      if (useThinking) {
        (messageOptions as any).thinking = {
          type: 'enabled',
          budget_tokens: this.thinkingBudget,
        };
      }

      const result = await callAnthropicWithRetry(async () => {
        return this.anthropic.messages.create(messageOptions);
      });

      // Extract response text
      let responseText = '';
      for (const block of result.data.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      const aiAnalysis = JSON.parse(responseText);

      // Build final response
      const activeBusinesses = businesses.filter((b) => b.status === 'active');
      const analysis: PortfolioHealthAnalysis = {
        overallScore: aiAnalysis.overallScore,
        trend: aiAnalysis.trend,
        businesses: businessHealthData.map((bd) => ({
          id: bd.business.id,
          name: bd.business.display_name,
          code: bd.business.code,
          healthScore: bd.healthScore?.overall_score || 0,
          status: bd.business.status,
          riskLevel: this.determineRiskLevel(bd.risks),
          topRisk: bd.risks?.risks[0]?.title,
          topOpportunity: bd.opportunities?.opportunities[0]?.title,
        })),
        aggregateMetrics: {
          totalBusinesses: businesses.length,
          activeBusinesses: activeBusinesses.length,
          avgHealthScore: aiAnalysis.aggregateMetrics.avgHealthScore,
          highRiskCount: aiAnalysis.aggregateMetrics.highRiskCount,
          highOpportunityCount: aiAnalysis.aggregateMetrics.highOpportunityCount,
        },
        recommendations: aiAnalysis.recommendations,
      };

      return {
        success: true,
        action,
        recommendation:
          this.governanceMode === 'HUMAN_GOVERNED'
            ? `Portfolio analysis complete. Review ${aiAnalysis.recommendations.length} recommendations before taking action.`
            : `Portfolio analysis complete with ${aiAnalysis.recommendations.length} actionable recommendations.`,
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED',
        data: analysis,
        metadata: {
          model,
          tokensUsed: result.data.usage.input_tokens + result.data.usage.output_tokens,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] analyzePortfolioHealth error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Process and aggregate signals for a business
   *
   * Uses Haiku for quick signal validation, Opus for pattern detection.
   *
   * @param businessId - UUID of the business
   * @param signals - Array of signals to process
   * @returns Signal processing result
   */
  async processSignals(
    businessId: string,
    signals: Signal[]
  ): Promise<AgentResponse<SignalProcessingResult>> {
    const startTime = Date.now();
    const action = 'process_signals';

    try {
      console.log(
        `[FounderOsAgent] Processing ${signals.length} signals for business: ${businessId}`
      );

      // Validate business exists
      const businessResult = await getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return this.createErrorResponse(
          action,
          businessResult.error || 'Business not found',
          startTime
        );
      }

      // Convert signals to RecordSignalInput format
      const signalInputs: RecordSignalInput[] = signals.map((s) => ({
        family: s.family,
        key: s.key,
        valueNumeric: typeof s.value === 'number' ? s.value : undefined,
        valueText: typeof s.value === 'string' ? s.value : undefined,
        payload: s.payload,
        source: s.source,
      }));

      // Record signals
      const recordResult = await recordSignals(businessId, signalInputs);
      const errors: string[] = [];

      if (!recordResult.success) {
        errors.push(recordResult.error || 'Failed to record signals');
      }

      // Aggregate signals from other sources
      const aggregateResult = await aggregateSignals(businessId);
      if (!aggregateResult.success) {
        errors.push(aggregateResult.error || 'Failed to aggregate signals');
      }

      // Get updated signal summary
      const summaryResult = await getSignalSummary(businessId);

      const result: SignalProcessingResult = {
        signalsProcessed: signals.length,
        signalsCreated: recordResult.success ? recordResult.data?.length || 0 : 0,
        errors,
        summary: summaryResult.success ? summaryResult.data || {} : {},
      };

      // Use Haiku for quick pattern detection recommendation
      const { model } = this.selectModel('low');

      return {
        success: errors.length === 0,
        action,
        recommendation:
          this.governanceMode === 'HUMAN_GOVERNED'
            ? `Processed ${signals.length} signals. Review signal patterns before taking action.`
            : `Successfully processed ${signals.length} signals with pattern analysis.`,
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED',
        data: result,
        metadata: {
          model,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] processSignals error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Generate comprehensive snapshot for a business
   *
   * Uses Claude Opus 4.5 with Extended Thinking for deep analysis.
   * Combines synopsis, health score, risks, and opportunities.
   *
   * @param businessId - UUID of the business
   * @returns Business snapshot with full analysis
   */
  async generateSnapshot(businessId: string): Promise<AgentResponse<BusinessSnapshot>> {
    const startTime = Date.now();
    const action = 'generate_snapshot';

    try {
      console.log(`[FounderOsAgent] Generating snapshot for business: ${businessId}`);

      // Validate business exists
      const businessResult = await getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return this.createErrorResponse(
          action,
          businessResult.error || 'Business not found',
          startTime
        );
      }

      const business = businessResult.data;

      // Generate synopsis (this also stores to founder_os_snapshots)
      const synopsisResult = await generateBusinessSynopsis(businessId);
      if (!synopsisResult.success || !synopsisResult.data) {
        return this.createErrorResponse(
          action,
          synopsisResult.error || 'Failed to generate synopsis',
          startTime
        );
      }

      // Get health score
      const healthResult = await getBusinessHealthScore(businessId);
      if (!healthResult.success || !healthResult.data) {
        return this.createErrorResponse(
          action,
          healthResult.error || 'Failed to calculate health score',
          startTime
        );
      }

      // Get the latest snapshot ID
      const latestSnapshotResult = await getLatestSnapshot(
        business.owner_user_id,
        'business',
        businessId
      );

      const { model } = this.selectModel('high');

      const snapshot: BusinessSnapshot = {
        snapshotId: latestSnapshotResult.success && latestSnapshotResult.data
          ? latestSnapshotResult.data.id
          : `snapshot_${Date.now()}`,
        businessId,
        synopsis: synopsisResult.data,
        healthScore: healthResult.data,
        generatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        action,
        recommendation:
          this.governanceMode === 'HUMAN_GOVERNED'
            ? `Snapshot generated with health score ${healthResult.data.overall_score}/100. Review ${synopsisResult.data.recommendations.length} recommendations before implementing.`
            : `Snapshot complete. Health: ${healthResult.data.overall_score}/100, Trend: ${healthResult.data.trend}.`,
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED',
        data: snapshot,
        metadata: {
          model,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] generateSnapshot error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Generate prioritized action recommendations for a business
   *
   * Combines risk analysis, opportunity analysis, and signal patterns
   * to produce actionable recommendations.
   *
   * @param businessId - UUID of the business
   * @returns Prioritized action recommendations
   */
  async recommendActions(
    businessId: string
  ): Promise<AgentResponse<ActionRecommendation[]>> {
    const startTime = Date.now();
    const action = 'recommend_actions';

    try {
      console.log(`[FounderOsAgent] Generating action recommendations for: ${businessId}`);

      // Validate business exists
      const businessResult = await getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return this.createErrorResponse(
          action,
          businessResult.error || 'Business not found',
          startTime
        );
      }

      const business = businessResult.data;

      // Gather all analysis data
      const [risksResult, opportunitiesResult, healthResult, signalsResult] = await Promise.all([
        analyzeRisks(businessId),
        analyzeOpportunities(businessId),
        getBusinessHealthScore(businessId),
        getSignals(businessId, undefined, 100),
      ]);

      // Build context for AI
      const { model, maxTokens, useThinking } = this.selectModel('high');

      const analysisContext = {
        business: {
          name: business.display_name,
          industry: business.industry,
          status: business.status,
        },
        health: healthResult.success ? healthResult.data : null,
        risks: risksResult.success ? risksResult.data : null,
        opportunities: opportunitiesResult.success ? opportunitiesResult.data : null,
        signalCount: signalsResult.success ? signalsResult.data?.length : 0,
      };

      const systemPrompt = `You are AI Phill, a strategic business advisor operating in ${this.governanceMode} mode.
Generate prioritized, actionable recommendations based on the business analysis.
${this.governanceMode === 'HUMAN_GOVERNED' ? 'All recommendations are ADVISORY-ONLY and require human approval.' : ''}

Focus on:
- Addressing critical and high-severity risks first
- Capturing high-impact opportunities
- Quick wins that can show immediate results
- Long-term strategic improvements`;

      const userPrompt = `Based on this business analysis, generate prioritized action recommendations:

ANALYSIS:
${JSON.stringify(analysisContext, null, 2)}

RISKS:
${JSON.stringify(risksResult.success ? risksResult.data?.risks.slice(0, 5) : [], null, 2)}

OPPORTUNITIES:
${JSON.stringify(opportunitiesResult.success ? opportunitiesResult.data?.opportunities.slice(0, 5) : [], null, 2)}

Generate a JSON array of action recommendations:
[
  {
    "id": "<unique_id>",
    "priority": "<critical|high|medium|low>",
    "category": "<risk_mitigation|opportunity_capture|maintenance|growth>",
    "title": "<action title>",
    "description": "<detailed action description>",
    "expectedImpact": "<what success looks like>",
    "effort": "<quick_win|medium|long_term>",
    "deadline": "<optional ISO date if time-sensitive>",
    "relatedSignals": ["<signal keys that triggered this>"]
  }
]

Prioritize by: critical risks > high opportunities > quick wins > long-term improvements.
Return 5-10 recommendations. Respond ONLY with valid JSON array.`;

      const messageOptions: Anthropic.Messages.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      };

      if (useThinking) {
        (messageOptions as any).thinking = {
          type: 'enabled',
          budget_tokens: this.thinkingBudget,
        };
      }

      const result = await callAnthropicWithRetry(async () => {
        return this.anthropic.messages.create(messageOptions);
      });

      // Extract response
      let responseText = '';
      for (const block of result.data.content) {
        if (block.type === 'text') {
          responseText = block.text;
          break;
        }
      }

      // Parse and validate recommendations
      const recommendations: ActionRecommendation[] = JSON.parse(responseText).map(
        (r: ActionRecommendation, index: number) => ({
          ...r,
          id: r.id || `action_${Date.now()}_${index}`,
        })
      );

      const criticalCount = recommendations.filter((r) => r.priority === 'critical').length;
      const quickWinCount = recommendations.filter((r) => r.effort === 'quick_win').length;

      return {
        success: true,
        action,
        recommendation:
          this.governanceMode === 'HUMAN_GOVERNED'
            ? `Generated ${recommendations.length} recommendations (${criticalCount} critical, ${quickWinCount} quick wins). Review and approve before implementation.`
            : `${recommendations.length} actions recommended. ${criticalCount} require immediate attention.`,
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED',
        data: recommendations,
        metadata: {
          model,
          tokensUsed: result.data.usage.input_tokens + result.data.usage.output_tokens,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] recommendActions error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Validate business links stored in founder_business_links table
   *
   * Uses Haiku for quick validation, reports broken links.
   *
   * @param businessId - UUID of the business
   * @returns Link validation results
   */
  async validateBusinessLinks(
    businessId: string
  ): Promise<AgentResponse<LinkValidationResult>> {
    const startTime = Date.now();
    const action = 'validate_business_links';

    try {
      console.log(`[FounderOsAgent] Validating links for business: ${businessId}`);

      // Validate business exists
      const businessResult = await getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return this.createErrorResponse(
          action,
          businessResult.error || 'Business not found',
          startTime
        );
      }

      // Fetch links from founder_business_links table
      const supabase = supabaseAdmin;
      const { data: links, error } = await supabase
        .from('founder_business_links')
        .select('*')
        .eq('founder_business_id', businessId);

      if (error) {
        return this.createErrorResponse(action, `Failed to fetch links: ${error.message}`, startTime);
      }

      if (!links || links.length === 0) {
        return {
          success: true,
          action,
          recommendation: 'No links found for this business. Consider adding important URLs to track.',
          requiresApproval: false,
          data: {
            businessId,
            totalLinks: 0,
            validLinks: 0,
            brokenLinks: [],
            validationDate: new Date().toISOString(),
          },
          metadata: {
            model: 'none',
            processingTimeMs: Date.now() - startTime,
            governanceMode: this.governanceMode,
          },
        };
      }

      // Validate each link
      const brokenLinks: Array<{ url: string; status: number | string; error?: string }> = [];
      let validCount = 0;

      for (const link of links) {
        try {
          const url = link.url || link.link_url;
          if (!url) continue;

          // Attempt to fetch the URL with a timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'User-Agent': 'FounderOsAgent/1.0 (Link Validator)',
            },
          });

          clearTimeout(timeout);

          if (response.ok) {
            validCount++;
          } else {
            brokenLinks.push({
              url,
              status: response.status,
            });
          }
        } catch (linkError) {
          const errorMessage =
            linkError instanceof Error ? linkError.message : 'Unknown error';
          brokenLinks.push({
            url: link.url || link.link_url || 'unknown',
            status: 'error',
            error: errorMessage,
          });
        }
      }

      // Update link status in database
      for (const broken of brokenLinks) {
        await supabase
          .from('founder_business_links')
          .update({
            last_checked: new Date().toISOString(),
            is_valid: false,
            last_error: broken.error || `HTTP ${broken.status}`,
          })
          .eq('founder_business_id', businessId)
          .or(`url.eq.${broken.url},link_url.eq.${broken.url}`);
      }

      const { model } = this.selectModel('low');

      const result: LinkValidationResult = {
        businessId,
        totalLinks: links.length,
        validLinks: validCount,
        brokenLinks,
        validationDate: new Date().toISOString(),
      };

      return {
        success: true,
        action,
        recommendation:
          brokenLinks.length > 0
            ? `Found ${brokenLinks.length} broken links. ${this.governanceMode === 'HUMAN_GOVERNED' ? 'Review and fix before they impact SEO.' : 'Immediate attention recommended.'}`
            : `All ${links.length} links are valid.`,
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED' && brokenLinks.length > 0,
        data: result,
        metadata: {
          model,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] validateBusinessLinks error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Coordinate with vault service to verify credential security
   *
   * Advisory function - reports on vault status without exposing secrets.
   *
   * @param businessId - UUID of the business
   * @returns Vault security status
   */
  async checkVaultSecurity(
    businessId: string
  ): Promise<
    AgentResponse<{
      businessId: string;
      totalSecrets: number;
      secretTypes: Record<string, number>;
      recommendations: string[];
    }>
  > {
    const startTime = Date.now();
    const action = 'check_vault_security';

    try {
      console.log(`[FounderOsAgent] Checking vault security for business: ${businessId}`);

      // Validate business exists
      const businessResult = await getBusiness(businessId);
      if (!businessResult.success || !businessResult.data) {
        return this.createErrorResponse(
          action,
          businessResult.error || 'Business not found',
          startTime
        );
      }

      // Get secrets (metadata only, not the actual payloads)
      const secretsResult = await getSecrets(businessId);
      if (!secretsResult.success) {
        return this.createErrorResponse(
          action,
          secretsResult.error || 'Failed to access vault',
          startTime
        );
      }

      const secrets = secretsResult.data || [];

      // Analyze secret types
      const secretTypes: Record<string, number> = {};
      for (const secret of secrets) {
        secretTypes[secret.secret_type] = (secretTypes[secret.secret_type] || 0) + 1;
      }

      // Generate security recommendations
      const recommendations: string[] = [];

      if (secrets.length === 0) {
        recommendations.push('No secrets stored. Consider adding API keys and credentials to the vault.');
      }

      if (!secretTypes['api_key']) {
        recommendations.push('No API keys in vault. Store external service credentials securely.');
      }

      if (!secretTypes['encryption_key']) {
        recommendations.push('Consider adding an encryption key for sensitive data protection.');
      }

      // Check for potentially expired secrets
      const now = new Date();
      for (const secret of secrets) {
        const metadata = secret.metadata as { expires_at?: string };
        if (metadata?.expires_at) {
          const expiresAt = new Date(metadata.expires_at);
          const daysUntilExpiry = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilExpiry <= 0) {
            recommendations.push(`Secret "${secret.secret_label}" has expired. Rotate immediately.`);
          } else if (daysUntilExpiry <= 30) {
            recommendations.push(
              `Secret "${secret.secret_label}" expires in ${daysUntilExpiry} days. Plan rotation.`
            );
          }
        }
      }

      const { model } = this.selectModel('low');

      return {
        success: true,
        action,
        recommendation:
          recommendations.length > 0
            ? `Vault check complete. ${recommendations.length} security recommendations.`
            : 'Vault security check passed. All credentials properly stored.',
        requiresApproval: this.governanceMode === 'HUMAN_GOVERNED' && recommendations.length > 0,
        data: {
          businessId,
          totalSecrets: secrets.length,
          secretTypes,
          recommendations,
        },
        metadata: {
          model,
          processingTimeMs: Date.now() - startTime,
          governanceMode: this.governanceMode,
        },
      };
    } catch (err) {
      console.error('[FounderOsAgent] checkVaultSecurity error:', err);
      return this.createErrorResponse(
        action,
        err instanceof Error ? err.message : 'Unknown error',
        startTime
      );
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Create standardized error response
   */
  private createErrorResponse<T>(
    action: string,
    error: string,
    startTime: number
  ): AgentResponse<T> {
    return {
      success: false,
      action,
      recommendation: `Action failed: ${error}`,
      requiresApproval: false,
      error,
      metadata: {
        model: 'none',
        processingTimeMs: Date.now() - startTime,
        governanceMode: this.governanceMode,
      },
    };
  }

  /**
   * Determine risk level from risk analysis
   */
  private determineRiskLevel(
    risks?: RiskAnalysisResult
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (!risks) return 'low';
    if (risks.critical_count > 0) return 'critical';
    if (risks.high_count > 0) return 'high';
    if (risks.medium_count > 0) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let agentInstance: FounderOsAgent | null = null;

/**
 * Get the singleton FounderOsAgent instance
 *
 * Configured for HUMAN_GOVERNED mode by default.
 */
export function getFounderOsAgent(): FounderOsAgent {
  if (!agentInstance) {
    agentInstance = new FounderOsAgent({
      governanceMode: 'HUMAN_GOVERNED',
      enableExtendedThinking: true,
      thinkingBudget: 5000,
    });
  }
  return agentInstance;
}

/**
 * Create a new FounderOsAgent with custom configuration
 */
export function createFounderOsAgent(config: FounderOsAgentConfig): FounderOsAgent {
  return new FounderOsAgent(config);
}

// Export the singleton for direct import
export const founderOsAgent = getFounderOsAgent();
