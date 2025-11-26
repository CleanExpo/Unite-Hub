import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';
import { generateCompleteConvexMarketingAnalysis } from '@/lib/agents/ConvexMarketingIntelligenceAgent';
import { generateCompleteConvexSeoAnalysis } from '@/lib/agents/ConvexSEOAgent';
import { generateCompleteMarketShiftAnalysis } from '@/lib/agents/ConvexMarketShiftAgent';
import { generateCompleteConvexCampaign } from '@/lib/agents/ConvexCampaignGeneratorAgent';

/**
 * POST /api/convex/generate-strategy
 *
 * Generate CONVEX-based marketing strategy based on selected framework
 *
 * Request body:
 * {
 *   businessName: string
 *   industry: string
 *   targetAudience: string
 *   currentChallenges: string[]
 *   existingCompetitors: string[]
 *   desiredOutcome: string
 *   framework: 'brand_positioning' | 'funnel_design' | 'seo_patterns' | 'competitor_model' | 'offer_architecture'
 * }
 *
 * Response:
 * {
 *   strategyId: string
 *   strategy: string
 *   score: ConvexScore
 *   frameworks: string[]
 *   executionPlan: string[]
 *   successMetrics: string[]
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      businessName,
      industry,
      targetAudience,
      currentChallenges,
      existingCompetitors,
      desiredOutcome,
      framework,
    } = body;

    // Validate required fields
    if (
      !businessName ||
      !industry ||
      !targetAudience ||
      !desiredOutcome ||
      !framework
    ) {
      logger.warn('[CONVEX-API] Missing required fields in strategy request');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info(`[CONVEX-API] Generating ${framework} strategy for ${businessName}`);

    let strategy = '';
    let analyzedFrameworks: string[] = [];
    let executionPlan: string[] = [];
    let successMetrics: string[] = [];
    let score = {
      overallScore: 0,
      clarity: 0,
      specificity: 0,
      outcomeFocus: 0,
      proof: 0,
      riskRemoval: 0,
      compliance: 'pass' as const,
    };

    // Route to appropriate analysis based on framework
    switch (framework) {
      case 'brand_positioning': {
        // Use Marketing Intelligence Agent for brand positioning
        const analysis = await generateCompleteConvexMarketingAnalysis(
          businessName,
          industry,
          targetAudience,
          currentChallenges,
          desiredOutcome,
          [] // product features (not provided for brand positioning)
        );

        strategy = `Brand Positioning Strategy for ${businessName}:\n\n`;
        strategy += `Target Audience: ${targetAudience}\n`;
        strategy += `Industry: ${industry}\n`;
        strategy += `Desired Outcome: ${desiredOutcome}\n\n`;

        if (analysis.keywordClusters.length > 0) {
          strategy += `Key Message Angles:\n`;
          analysis.keywordClusters.forEach((cluster, idx) => {
            strategy += `${idx + 1}. ${cluster.emotional?.join(', ') || 'positioning'}\n`;
          });
          strategy += '\n';
        }

        if (analysis.audienceSegments.length > 0) {
          strategy += `Audience Segments to Target:\n`;
          analysis.audienceSegments.forEach((segment) => {
            strategy += `- ${segment.name}: ${segment.desiredOutcomes.join(', ')}\n`;
          });
          strategy += '\n';
        }

        strategy += `Implementation: Create positioning framework that resonates with ${targetAudience} addressing ${currentChallenges[0] || 'key challenges'}.`;

        analyzedFrameworks = ['Audience Segmentation', 'Keyword Clustering', 'Micro-Commitment Sequencing'];
        executionPlan = [
          'Define brand positioning statement',
          'Identify emotional, functional, and transactional value props',
          'Develop key message variants per audience segment',
          'Create brand guidelines document',
          'Test messaging with target audience',
        ];
        successMetrics = [
          'Brand awareness lift: +25% in 3 months',
          'Message resonance score: >7/10',
          'Audience engagement: +40%',
        ];
        score = {
          overallScore: 78,
          clarity: 85,
          specificity: 75,
          outcomeFocus: 80,
          proof: 70,
          riskRemoval: 75,
          compliance: 'pass',
        };
        break;
      }

      case 'funnel_design': {
        // Use Campaign Generator for funnel design
        const campaign = await generateCompleteConvexCampaign(
          desiredOutcome,
          targetAudience,
          industry,
          [], // product features
          0, // budget (not specified)
          0 // timeline
        );

        strategy = `Micro-Commitment Funnel Strategy for ${businessName}:\n\n`;
        strategy += `Objective: ${campaign.strategy.objective}\n`;
        strategy += `Target Audience: ${targetAudience}\n\n`;

        if (campaign.funnel) {
          strategy += `Funnel Stages:\n`;
          campaign.funnel.awareness &&
            (strategy += `1. Awareness: ${campaign.funnel.awareness.objective}\n`);
          campaign.funnel.consideration &&
            (strategy += `2. Consideration: ${campaign.funnel.consideration.objective}\n`);
          campaign.funnel.decision &&
            (strategy += `3. Decision: ${campaign.funnel.decision.objective}\n`);
          campaign.funnel.retention &&
            (strategy += `4. Retention: ${campaign.funnel.retention.objective}\n`);
        }

        analyzedFrameworks = ['Funnel Design', 'Micro-Commitment Sequencing', 'Conversion Optimization'];
        executionPlan = [
          'Build awareness content (blog, guides, webinars)',
          'Create consideration stage assets (case studies, demos)',
          'Design decision stage offers (trials, consultations)',
          'Implement retention/upsell sequences',
          'Set up tracking and analytics',
        ];
        successMetrics = [
          'Conversion rate per stage: >10%',
          'Average customer lifetime value: +30%',
          'Repeat purchase rate: >25%',
        ];
        score = {
          overallScore: 82,
          clarity: 88,
          specificity: 80,
          outcomeFocus: 85,
          proof: 78,
          riskRemoval: 80,
          compliance: 'pass',
        };
        break;
      }

      case 'seo_patterns': {
        // Use SEO Agent for SEO patterns
        const seoAnalysis = await generateCompleteConvexSeoAnalysis(
          businessName,
          industry,
          desiredOutcome,
          [],
          'United States'
        );

        strategy = `Topical Authority SEO Strategy for ${businessName}:\n\n`;
        strategy += `Primary Keyword: ${desiredOutcome}\n`;
        strategy += `Industry: ${industry}\n`;
        strategy += `Timeline: 12 months to page 1 rankings\n\n`;

        if (seoAnalysis.semanticClusters.length > 0) {
          strategy += `Semantic Cluster Strategy:\n`;
          seoAnalysis.semanticClusters.forEach((cluster, idx) => {
            strategy += `${idx + 1}. ${cluster.intent}: ${cluster.relatedKeywords.slice(0, 3).join(', ')}\n`;
          });
          strategy += '\n';
        }

        strategy += `Authority Building: 3-tier backlink strategy + topical content expansion`;

        analyzedFrameworks = ['Semantic Clustering', 'Topical Authority', 'SERP Analysis', 'Technical SEO'];
        executionPlan = [
          'Conduct keyword research and semantic clustering',
          'Create pillar content (5,000+ word cornerstone)',
          'Build cluster subtopic content (20+ articles)',
          'Implement internal linking structure',
          'Acquire high-quality backlinks (tier 1)',
          'Optimize technical SEO (Core Web Vitals)',
        ];
        successMetrics = [
          'Primary keyword ranking: Top 10 (6 months), Top 3 (12 months)',
          'Topical authority score: >85/100',
          'Organic traffic: +200% in 12 months',
        ];
        score = {
          overallScore: 85,
          clarity: 90,
          specificity: 85,
          outcomeFocus: 88,
          proof: 82,
          riskRemoval: 80,
          compliance: 'pass',
        };
        break;
      }

      case 'competitor_model': {
        // Use Market Shift Agent for competitor analysis
        const marketAnalysis = await generateCompleteMarketShiftAnalysis(
          businessName,
          industry,
          existingCompetitors,
          currentChallenges,
          [], // strengths
          [] // weaknesses
        );

        strategy = `Competitive Differentiation Strategy for ${businessName}:\n\n`;
        strategy += `Competitors: ${existingCompetitors.join(', ')}\n`;
        strategy += `Current Challenges: ${currentChallenges.join(', ')}\n\n`;

        strategy += `Market Positioning:\n`;
        strategy += `- Identify competitor weaknesses\n`;
        strategy += `- Develop counter-positioning\n`;
        strategy += `- Create unique value proposition\n`;
        strategy += `- Build defensible advantages\n`;

        if (marketAnalysis.actionRecommendations && marketAnalysis.actionRecommendations.length > 0) {
          strategy += `\nRecommendations:\n`;
          marketAnalysis.actionRecommendations.slice(0, 3).forEach((rec) => {
            strategy += `- ${rec}\n`;
          });
        }

        analyzedFrameworks = ['Competitor Analysis', 'Market Positioning', 'Disruption Detection'];
        executionPlan = [
          'Complete competitive landscape mapping',
          'Identify competitor weaknesses and vulnerabilities',
          'Design counter-positioning strategy',
          'Develop unique value proposition',
          'Create differentiation messaging',
          'Build barrier to entry',
        ];
        successMetrics = [
          'Market share gain: +15% in 12 months',
          'Brand differentiation score: >80/100',
          'Customer perception: 40% cite unique positioning',
        ];
        score = {
          overallScore: 80,
          clarity: 82,
          specificity: 78,
          outcomeFocus: 82,
          proof: 78,
          riskRemoval: 80,
          compliance: 'pass',
        };
        break;
      }

      case 'offer_architecture': {
        strategy = `Compelling Offer Architecture for ${businessName}:\n\n`;
        strategy += `Target: ${targetAudience}\n`;
        strategy += `Outcome: ${desiredOutcome}\n\n`;

        strategy += `10-Point Offer Strength Assessment:\n`;
        strategy += `1. Specificity: Define exactly what's being offered\n`;
        strategy += `2. Value: Stack value to exceed price perception\n`;
        strategy += `3. Credibility: Include proof and guarantees\n`;
        strategy += `4. Exclusivity: Create scarcity or limited access\n`;
        strategy += `5. Urgency: Add time-based incentives\n`;
        strategy += `6. Unique Angle: Position against competitors\n`;
        strategy += `7. Risk Reversal: Money-back or performance guarantee\n`;
        strategy += `8. Easy Action: Remove friction from purchase\n`;
        strategy += `9. Social Proof: Include testimonials and results\n`;
        strategy += `10. Clear Outcome: State expected customer result\n`;

        analyzedFrameworks = ['Offer Architecture', 'Value Stacking', 'Risk Reversal', 'Pricing Strategy'];
        executionPlan = [
          'Define core offer with specificity',
          'Stack value propositions and bonuses',
          'Design risk reversal guarantee',
          'Create pricing page and copy',
          'Build sales page with social proof',
          'Set up order fulfillment process',
        ];
        successMetrics = [
          'Conversion rate: 2-5% from traffic',
          'Average order value: +40%',
          'Customer satisfaction: >90% NPS',
        ];
        score = {
          overallScore: 79,
          clarity: 85,
          specificity: 82,
          outcomeFocus: 80,
          proof: 75,
          riskRemoval: 75,
          compliance: 'pass',
        };
        break;
      }

      default: {
        logger.warn(`[CONVEX-API] Unknown framework: ${framework}`);
        return NextResponse.json(
          { error: 'Unknown framework type' },
          { status: 400 }
        );
      }
    }

    // Store strategy in database
    const { saveStrategy } = await import('@/lib/convex/strategy-persistence');
    const strategyId = `strategy-${Date.now()}`;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId') || 'default-workspace';
    const userId = 'system'; // In production, get from auth context

    // Save to database
    const savedStrategy = await saveStrategy(workspaceId, userId, {
      strategyId,
      strategy,
      score,
      frameworks: analyzedFrameworks,
      executionPlan,
      successMetrics,
      metadata: {
        businessName,
        industry,
        targetAudience,
        desiredOutcome,
        framework,
      },
    });

    logger.info(`[CONVEX-API] Strategy generated and saved: ${strategyId}`);

    return NextResponse.json({
      strategyId,
      strategy,
      score,
      frameworks: analyzedFrameworks,
      executionPlan,
      successMetrics,
      databaseId: savedStrategy?.id,
    });
  } catch (error) {
    logger.error('[CONVEX-API] Strategy generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate strategy' },
      { status: 500 }
    );
  }
}
