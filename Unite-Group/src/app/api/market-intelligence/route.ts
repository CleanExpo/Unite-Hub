/**
 * Market Intelligence API Route
 * Unite Group - Version 12.0 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { MarketIntelligenceService } from '@/lib/market-intelligence/service';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';

let marketIntelligenceService: MarketIntelligenceService | null = null;

function getMarketIntelligenceService(): MarketIntelligenceService {
  if (!marketIntelligenceService) {
    const aiGateway = new AIGateway({
      providers: [{
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.3
      }]
    });

    marketIntelligenceService = new MarketIntelligenceService(aiGateway);
  }
  return marketIntelligenceService;
}

export async function POST(request: NextRequest) {
  try {
    const service = getMarketIntelligenceService();
    const { action, ...data } = await request.json();

    switch (action) {
      case 'analyze_market':
        const analysis = await service.analyzeMarket(data.industry, data.region);
        return NextResponse.json({ success: true, data: analysis });

      case 'track_competitors':
        const competitorData = await service.trackCompetitors(data.competitors);
        return NextResponse.json({ success: true, data: competitorData });

      case 'identify_trends':
        const trends = await service.identifyTrends(data.keywords, data.timeframe);
        return NextResponse.json({ success: true, data: trends });

      case 'score_opportunities':
        const opportunities = await service.scoreOpportunities(data.criteria);
        return NextResponse.json({ success: true, data: opportunities });

      case 'generate_market_report':
        const report = await service.generateMarketReport(data.parameters);
        return NextResponse.json({ success: true, data: report });

      case 'monitor_competitor_activity':
        const activity = await service.monitorCompetitorActivity(data.competitorId);
        return NextResponse.json({ success: true, data: activity });

      case 'analyze_competitor_positioning':
        const positioning = await service.analyzeCompetitorPositioning(data.industry);
        return NextResponse.json({ success: true, data: positioning });

      case 'detect_market_disruptions':
        const disruptions = await service.detectMarketDisruptions(data.industry);
        return NextResponse.json({ success: true, data: disruptions });

      case 'benchmark_performance':
        const benchmark = await service.benchmarkPerformance(data.metrics);
        return NextResponse.json({ success: true, data: benchmark });

      case 'subscribe_to_opportunities':
        await service.subscribeToOpportunities(data.filters);
        return NextResponse.json({ success: true, message: 'Subscribed to opportunity alerts' });

      case 'assess_opportunity_feasibility':
        const feasibility = await service.assessOpportunityFeasibility(data.opportunityId);
        return NextResponse.json({ success: true, data: feasibility });

      case 'prioritize_opportunities':
        const ranking = await service.prioritizeOpportunities(data.opportunities);
        return NextResponse.json({ success: true, data: ranking });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Market Intelligence API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const service = getMarketIntelligenceService();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const industry = url.searchParams.get('industry');
    const region = url.searchParams.get('region');
    const competitorId = url.searchParams.get('competitorId');

    switch (action) {
      case 'get_opportunity_alerts':
        const alerts = await service.getOpportunityAlerts();
        return NextResponse.json({ success: true, data: alerts });

      case 'analyze_market':
        if (!industry || !region) {
          return NextResponse.json(
            { success: false, error: 'Industry and region required' },
            { status: 400 }
          );
        }
        const analysis = await service.analyzeMarket(industry, region);
        return NextResponse.json({ success: true, data: analysis });

      case 'monitor_competitor_activity':
        if (!competitorId) {
          return NextResponse.json(
            { success: false, error: 'Competitor ID required' },
            { status: 400 }
          );
        }
        const activity = await service.monitorCompetitorActivity(competitorId);
        return NextResponse.json({ success: true, data: activity });

      case 'detect_market_disruptions':
        if (!industry) {
          return NextResponse.json(
            { success: false, error: 'Industry required' },
            { status: 400 }
          );
        }
        const disruptions = await service.detectMarketDisruptions(industry);
        return NextResponse.json({ success: true, data: disruptions });

      case 'analyze_competitor_positioning':
        if (!industry) {
          return NextResponse.json(
            { success: false, error: 'Industry required' },
            { status: 400 }
          );
        }
        const positioning = await service.analyzeCompetitorPositioning(industry);
        return NextResponse.json({ success: true, data: positioning });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Market Intelligence API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
