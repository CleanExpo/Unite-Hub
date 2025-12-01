/**
 * Research Agent
 *
 * Autonomous intelligence gathering with competitive analysis, trend detection, risk scoring.
 * Features:
 * - Multi-source data gathering (competitors, industry, technology, algorithms, AI models)
 * - Risk assessment and founder alert routing
 * - Threat level detection
 * - Actionable recommendations
 * - Comprehensive audit logging
 *
 * Integrates with:
 * - Research pipelines (data sources)
 * - Founder risk engine (risk scoring)
 * - Founder approval engine (escalation routing)
 * - Event log (audit trail)
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import { researchPipelines } from './researchPipelines';
import { scoreRisk } from '@/lib/founder/founderRiskEngine';
import { evaluateApproval, addToApprovalQueue } from '@/lib/founder/founderApprovalEngine';
import { logFounderEvent, logAgentAction, logRiskAssessment } from '@/lib/founder/founderEventLog';
import {
  summariseInsights,
  detectThreatLevel,
  generateRecommendations,
} from './researchInsights';

export type ResearchCategory = 'competitor' | 'industry' | 'technology' | 'algorithm' | 'ai_models';

export interface ResearchQuery {
  brand: BrandId;
  query: string;
  category: ResearchCategory;
  urgency?: 'routine' | 'important' | 'critical';
}

export interface ResearchInsight {
  source: string;
  insight: string;
  confidence?: number;
  timestamp?: string;
}

export interface ResearchResult {
  id: string;
  query: ResearchQuery;
  insights: ResearchInsight[];
  summary: string;
  threatLevel: 'low' | 'medium' | 'high';
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations: string[];
  requiresFounderReview: boolean;
  timestamp: string;
}

/**
 * Research Agent Class
 * Gathers intelligence and detects opportunities/threats
 */
export class ResearchAgent {
  private agentId = 'research-agent';

  /**
   * Run a research query
   */
  async runQuery(queryRequest: ResearchQuery): Promise<ResearchResult> {
    const resultId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Log agent action
    logAgentAction(this.agentId, 'research_query', {
      brand: queryRequest.brand,
      query: queryRequest.query,
      category: queryRequest.category,
      urgency: queryRequest.urgency || 'routine',
    });

    // Step 1: Gather insights from pipeline
    const pipeline = researchPipelines[queryRequest.category];
    if (!pipeline) {
      throw new Error(`Unknown research category: ${queryRequest.category}`);
    }

    const insights = await pipeline(queryRequest.query);

    // Step 2: Analyze and summarize
    const summary = summariseInsights(insights);
    const threatLevel = detectThreatLevel(insights);
    const recommendations = generateRecommendations(insights);

    // Step 3: Risk Assessment
    const riskAssessment = scoreRisk({
      brand: queryRequest.brand,
      claim: summary,
      context: 'internal',
    });

    logRiskAssessment(resultId, riskAssessment.score, riskAssessment.level, queryRequest.brand);

    // Step 4: Approval Routing
    const requiresFounderReview =
      threatLevel === 'high' || riskAssessment.level === 'high' || riskAssessment.level === 'critical';

    if (requiresFounderReview) {
      addToApprovalQueue({
        id: resultId,
        createdAt: timestamp,
        createdByAgent: 'research',
        riskLevel: riskAssessment.level,
        itemType: 'analysis_report',
        brand: queryRequest.brand,
        summary: `${queryRequest.category.toUpperCase()}: ${queryRequest.query}`,
        details: {
          query: queryRequest.query,
          category: queryRequest.category,
          insights,
          summary,
          threatLevel,
          recommendations,
          riskScore: riskAssessment.score,
        },
      });
    }

    const result: ResearchResult = {
      id: resultId,
      query: queryRequest,
      insights,
      summary,
      threatLevel,
      riskAssessment,
      recommendations,
      requiresFounderReview,
      timestamp,
    };

    // Log final result
    logFounderEvent('agent_action', this.agentId, {
      action: 'research_complete',
      resultId,
      category: queryRequest.category,
      threatLevel,
      requiresReview: requiresFounderReview,
    });

    return result;
  }

  /**
   * Run multiple research queries in batch
   */
  async runBatch(queries: ResearchQuery[]): Promise<ResearchResult[]> {
    return Promise.all(queries.map((q) => this.runQuery(q)));
  }

  /**
   * Get research by category
   */
  async researchCategory(
    brand: BrandId,
    category: ResearchCategory,
    topics: string[]
  ): Promise<ResearchResult[]> {
    return this.runBatch(
      topics.map((topic) => ({
        brand,
        query: topic,
        category,
        urgency: 'routine',
      }))
    );
  }

  /**
   * Monitor competitors
   */
  async monitorCompetitors(brand: BrandId, competitorNames: string[]): Promise<ResearchResult[]> {
    return this.researchCategory(brand, 'competitor', competitorNames);
  }

  /**
   * Track industry trends
   */
  async trackIndustryTrends(brand: BrandId, trends: string[]): Promise<ResearchResult[]> {
    return this.researchCategory(brand, 'industry', trends);
  }

  /**
   * Monitor new technologies
   */
  async monitorTechnology(brand: BrandId, technologies: string[]): Promise<ResearchResult[]> {
    return this.researchCategory(brand, 'technology', technologies);
  }

  /**
   * Track algorithm changes
   */
  async trackAlgorithmChanges(brand: BrandId, keywords: string[]): Promise<ResearchResult[]> {
    return this.researchCategory(brand, 'algorithm', keywords);
  }

  /**
   * Monitor AI model developments
   */
  async monitorAIModels(brand: BrandId, modelNames: string[]): Promise<ResearchResult[]> {
    return this.researchCategory(brand, 'ai_models', modelNames);
  }
}

/**
 * Singleton instance
 */
export const researchAgent = new ResearchAgent();
