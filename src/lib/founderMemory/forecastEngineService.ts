/**
 * Forecast Engine Service
 *
 * Performs 6-week, 12-week, and 1-year forecasting using current
 * momentum, risk, and opportunity data.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { momentumScoringService, type MomentumScore } from './momentumScoringService';
import { opportunityConsolidationService, type FounderOpportunity } from './opportunityConsolidationService';
import { riskAnalysisService, type FounderRisk } from './riskAnalysisService';

// Types
export type ForecastHorizon = '6_week' | '12_week' | '1_year';

export interface ForecastScenario {
  label: string;
  probability: number;
  description: string;
  projectedMomentum: Record<string, number>;
  keyDrivers: string[];
}

export interface Forecast {
  horizon: ForecastHorizon;
  generatedAt: Date;
  inputSnapshot: ForecastInputs;
  bestCase: ForecastScenario;
  expectedCase: ForecastScenario;
  worstCase: ForecastScenario;
  keyAssumptions: string[];
  confidenceScore: number;
  recommendedActions: string[];
}

export interface ForecastInputs {
  currentMomentum: MomentumScore | null;
  topOpportunities: FounderOpportunity[];
  activeRisks: FounderRisk[];
  clientCount: number;
  preClientCount: number;
  activeCampaigns: number;
}

export interface ForecastConfig {
  founderId: string;
  workspaceId: string;
  horizons?: ForecastHorizon[];
  includeRecommendations?: boolean;
}

export interface ForecastResult {
  forecasts: Forecast[];
  summary: {
    overallOutlook: 'positive' | 'neutral' | 'challenging';
    primaryDrivers: string[];
    criticalWatchItems: string[];
  };
}

class ForecastEngineService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Generate forecasts for all horizons
   */
  async generateForecasts(config: ForecastConfig): Promise<ForecastResult> {
    const {
      founderId,
      workspaceId,
      horizons = ['6_week', '12_week', '1_year'],
      includeRecommendations = true,
    } = config;

    // Gather current state
    const inputs = await this.gatherInputs(founderId, workspaceId);

    // Generate forecasts for each horizon
    const forecasts: Forecast[] = [];

    for (const horizon of horizons) {
      const forecast = await this.generateSingleForecast(
        horizon,
        inputs,
        includeRecommendations
      );
      forecasts.push(forecast);
    }

    // Build overall summary
    const summary = this.buildSummary(forecasts);

    return { forecasts, summary };
  }

  /**
   * Gather all inputs needed for forecasting
   */
  private async gatherInputs(founderId: string, workspaceId: string): Promise<ForecastInputs> {
    const [momentum, opportunities, risks, clientStats, campaignStats] = await Promise.all([
      momentumScoringService.getLatestMomentum(founderId, workspaceId),
      opportunityConsolidationService.getTopOpportunities(founderId, workspaceId, 10),
      riskAnalysisService.getActiveRisks(founderId, workspaceId, 10),
      this.getClientStats(workspaceId),
      this.getCampaignStats(workspaceId),
    ]);

    return {
      currentMomentum: momentum,
      topOpportunities: opportunities,
      activeRisks: risks,
      clientCount: clientStats.total,
      preClientCount: clientStats.preClientCount,
      activeCampaigns: campaignStats.active,
    };
  }

  /**
   * Get client statistics
   */
  private async getClientStats(workspaceId: string): Promise<{ total: number; preClientCount: number }> {
    const [{ count: clientCount }, { count: preClientCount }] = await Promise.all([
      supabaseAdmin
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabaseAdmin
        .from('pre_clients')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
    ]);

    return {
      total: clientCount || 0,
      preClientCount: preClientCount || 0,
    };
  }

  /**
   * Get campaign statistics
   */
  private async getCampaignStats(workspaceId: string): Promise<{ active: number }> {
    const { count } = await supabaseAdmin
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    return { active: count || 0 };
  }

  /**
   * Generate a single forecast for a specific horizon
   */
  private async generateSingleForecast(
    horizon: ForecastHorizon,
    inputs: ForecastInputs,
    includeRecommendations: boolean
  ): Promise<Forecast> {
    const horizonLabel = horizon === '6_week' ? '6 weeks' : horizon === '12_week' ? '12 weeks' : '1 year';
    const horizonWeeks = horizon === '6_week' ? 6 : horizon === '12_week' ? 12 : 52;

    // Use AI to generate scenarios
    const scenarios = await this.generateScenariosWithAI(horizonLabel, horizonWeeks, inputs);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(inputs, horizon);

    // Generate recommendations if requested
    let recommendedActions: string[] = [];
    if (includeRecommendations) {
      recommendedActions = await this.generateRecommendations(scenarios, inputs);
    }

    return {
      horizon,
      generatedAt: new Date(),
      inputSnapshot: inputs,
      bestCase: scenarios.bestCase,
      expectedCase: scenarios.expectedCase,
      worstCase: scenarios.worstCase,
      keyAssumptions: scenarios.assumptions,
      confidenceScore: confidence,
      recommendedActions,
    };
  }

  /**
   * Generate forecast scenarios using AI
   */
  private async generateScenariosWithAI(
    horizonLabel: string,
    horizonWeeks: number,
    inputs: ForecastInputs
  ): Promise<{
    bestCase: ForecastScenario;
    expectedCase: ForecastScenario;
    worstCase: ForecastScenario;
    assumptions: string[];
  }> {
    try {
      const currentMomentum = inputs.currentMomentum;
      const momentumSummary = currentMomentum
        ? `Marketing: ${currentMomentum.marketingScore}, Sales: ${currentMomentum.salesScore}, Delivery: ${currentMomentum.deliveryScore}, Clients: ${currentMomentum.clientsScore}, Overall: ${currentMomentum.overallScore}`
        : 'No momentum data available';

      const opportunitySummary = inputs.topOpportunities
        .slice(0, 5)
        .map((o) => `- ${o.title} (value: ${o.estimatedValueScore}, effort: ${o.effortScore})`)
        .join('\n');

      const riskSummary = inputs.activeRisks
        .slice(0, 5)
        .map((r) => `- ${r.title} (risk score: ${(r.riskScore * 100).toFixed(0)}%)`)
        .join('\n');

      const prompt = `As a business analyst, forecast the next ${horizonLabel} for this founder's business.

CURRENT STATE:
- Clients: ${inputs.clientCount}
- Pre-clients: ${inputs.preClientCount}
- Active campaigns: ${inputs.activeCampaigns}
- Momentum scores: ${momentumSummary}

TOP OPPORTUNITIES:
${opportunitySummary || 'None identified'}

ACTIVE RISKS:
${riskSummary || 'None identified'}

Generate three scenarios (best, expected, worst) for the next ${horizonLabel}.

Return JSON:
{
  "best_case": {
    "probability": 0.2,
    "description": "Brief description",
    "projected_momentum": {"marketing": 75, "sales": 80, "delivery": 70, "clients": 75},
    "key_drivers": ["driver1", "driver2"]
  },
  "expected_case": {
    "probability": 0.6,
    "description": "Brief description",
    "projected_momentum": {"marketing": 60, "sales": 65, "delivery": 60, "clients": 65},
    "key_drivers": ["driver1", "driver2"]
  },
  "worst_case": {
    "probability": 0.2,
    "description": "Brief description",
    "projected_momentum": {"marketing": 40, "sales": 35, "delivery": 50, "clients": 45},
    "key_drivers": ["driver1", "driver2"]
  },
  "assumptions": ["assumption1", "assumption2", "assumption3"]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) throw new Error('No response');

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      const result = JSON.parse(jsonMatch[0]);

      return {
        bestCase: {
          label: 'Best Case',
          probability: result.best_case.probability,
          description: result.best_case.description,
          projectedMomentum: result.best_case.projected_momentum,
          keyDrivers: result.best_case.key_drivers,
        },
        expectedCase: {
          label: 'Expected Case',
          probability: result.expected_case.probability,
          description: result.expected_case.description,
          projectedMomentum: result.expected_case.projected_momentum,
          keyDrivers: result.expected_case.key_drivers,
        },
        worstCase: {
          label: 'Worst Case',
          probability: result.worst_case.probability,
          description: result.worst_case.description,
          projectedMomentum: result.worst_case.projected_momentum,
          keyDrivers: result.worst_case.key_drivers,
        },
        assumptions: result.assumptions,
      };
    } catch (error) {
      console.error('[ForecastEngine] AI scenario generation failed:', error);

      // Return default scenarios
      return {
        bestCase: {
          label: 'Best Case',
          probability: 0.2,
          description: 'Optimistic scenario with strong execution',
          projectedMomentum: { marketing: 70, sales: 70, delivery: 70, clients: 70 },
          keyDrivers: ['Successful opportunity conversion', 'Risk mitigation'],
        },
        expectedCase: {
          label: 'Expected Case',
          probability: 0.6,
          description: 'Steady progress with current trajectory',
          projectedMomentum: { marketing: 55, sales: 55, delivery: 55, clients: 55 },
          keyDrivers: ['Continued operations', 'Market stability'],
        },
        worstCase: {
          label: 'Worst Case',
          probability: 0.2,
          description: 'Challenging scenario with setbacks',
          projectedMomentum: { marketing: 40, sales: 40, delivery: 40, clients: 40 },
          keyDrivers: ['Unmitigated risks', 'Market headwinds'],
        },
        assumptions: [
          'Current team capacity remains stable',
          'No major market disruptions',
          'Existing client relationships maintained',
        ],
      };
    }
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(inputs: ForecastInputs, horizon: ForecastHorizon): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (inputs.currentMomentum) confidence += 0.15;
    if (inputs.topOpportunities.length > 3) confidence += 0.1;
    if (inputs.activeRisks.length > 0) confidence += 0.05; // Having risk data is good
    if (inputs.clientCount > 10) confidence += 0.1;

    // Longer horizons = lower confidence
    if (horizon === '12_week') confidence -= 0.1;
    if (horizon === '1_year') confidence -= 0.2;

    return Math.max(0.2, Math.min(0.9, confidence));
  }

  /**
   * Generate actionable recommendations
   */
  private async generateRecommendations(
    scenarios: {
      bestCase: ForecastScenario;
      expectedCase: ForecastScenario;
      worstCase: ForecastScenario;
    },
    inputs: ForecastInputs
  ): Promise<string[]> {
    try {
      const prompt = `Based on these forecast scenarios:

EXPECTED CASE: ${scenarios.expectedCase.description}
Key drivers: ${scenarios.expectedCase.keyDrivers.join(', ')}

WORST CASE RISKS: ${scenarios.worstCase.description}
Key drivers: ${scenarios.worstCase.keyDrivers.join(', ')}

CURRENT RISKS: ${inputs.activeRisks.slice(0, 3).map((r) => r.title).join(', ') || 'None'}
TOP OPPORTUNITIES: ${inputs.topOpportunities.slice(0, 3).map((o) => o.title).join(', ') || 'None'}

Provide 3-5 specific, actionable recommendations to:
1. Increase likelihood of best case
2. Mitigate worst case risks

Return JSON array of strings:
["recommendation1", "recommendation2", "recommendation3"]`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) return [];

      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]) as string[];
    } catch (error) {
      console.error('[ForecastEngine] Recommendation generation failed:', error);
      return [
        'Focus on converting top opportunities',
        'Address highest-impact risks',
        'Maintain consistent client communication',
      ];
    }
  }

  /**
   * Build overall summary from all forecasts
   */
  private buildSummary(forecasts: Forecast[]): ForecastResult['summary'] {
    // Determine overall outlook from expected cases
    let positiveCount = 0;
    let challengingCount = 0;
    const allDrivers: string[] = [];
    const watchItems: string[] = [];

    forecasts.forEach((f) => {
      const expectedMomentum = Object.values(f.expectedCase.projectedMomentum);
      const avgMomentum = expectedMomentum.reduce((a, b) => a + b, 0) / expectedMomentum.length;

      if (avgMomentum >= 60) positiveCount++;
      else if (avgMomentum < 45) challengingCount++;

      allDrivers.push(...f.expectedCase.keyDrivers);
      watchItems.push(...f.worstCase.keyDrivers);
    });

    const overallOutlook: 'positive' | 'neutral' | 'challenging' =
      positiveCount > challengingCount
        ? 'positive'
        : challengingCount > positiveCount
          ? 'challenging'
          : 'neutral';

    // Get unique drivers
    const uniqueDrivers = [...new Set(allDrivers)].slice(0, 5);
    const uniqueWatchItems = [...new Set(watchItems)].slice(0, 5);

    return {
      overallOutlook,
      primaryDrivers: uniqueDrivers,
      criticalWatchItems: uniqueWatchItems,
    };
  }

  /**
   * Handle orchestrator intent
   */
  async handleForecastFounderOutcomesIntent(
    founderId: string,
    workspaceId: string,
    options?: { horizons?: ForecastHorizon[] }
  ): Promise<{
    success: boolean;
    result?: ForecastResult;
    error?: string;
  }> {
    try {
      const result = await this.generateForecasts({
        founderId,
        workspaceId,
        horizons: options?.horizons,
        includeRecommendations: true,
      });

      return { success: true, result };
    } catch (error) {
      console.error('[ForecastEngine] Intent handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const forecastEngineService = new ForecastEngineService();
