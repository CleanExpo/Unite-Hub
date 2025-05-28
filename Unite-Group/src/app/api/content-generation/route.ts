/**
 * Content Generation API Route
 * Unite Group - Version 11.0 Phase 3 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartContentGenerationService } from '@/lib/ai/content-generation/service';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';
import type { ContentGenerationConfig, ContentType } from '@/lib/ai/content-generation/types';

const config: ContentGenerationConfig = {
  ai: {
    primaryProvider: 'openai',
    fallbackProvider: 'openai',
    maxTokens: 2000,
    temperature: 0.7,
    qualityThreshold: 0.75,
    enableMultipleIterations: true,
    maxIterations: 3
  },
  content: {
    defaultTone: 'professional',
    defaultLength: 'medium',
    enableSEOOptimization: true,
    enableOriginalityCheck: true,
    enableComplianceCheck: true,
    autoGenerateMetaDescriptions: true
  },
  market: {
    enableRealTimeData: true,
    competitorTrackingEnabled: true,
    trendAnalysisDepth: 'detailed',
    updateFrequency: '0 0 * * *', // Daily at midnight
    dataRetentionDays: 90
  },
  templates: {
    enableCustomTemplates: true,
    templateLibraryEnabled: true,
    autoSuggestTemplates: true
  },
  quality: {
    minOriginalityScore: 0.8,
    minReadabilityScore: 70,
    minSEOScore: 75,
    enableHumanReview: false,
    autoPublishThreshold: 0.85
  }
};

let contentService: SmartContentGenerationService | null = null;

function getContentService(): SmartContentGenerationService {
  if (!contentService) {
    const aiGateway = new AIGateway({
      providers: [{
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7
      }],
      cache: {
        enabled: true,
        ttl: 300,
        maxSize: 1000,
        keyStrategy: 'hash'
      },
      monitoring: {
        enabled: true,
        metricsRetentionDays: 30,
        healthCheckIntervalSeconds: 60
      }
    });

    contentService = new SmartContentGenerationService(aiGateway, config);
  }
  return contentService;
}

export async function POST(request: NextRequest) {
  try {
    const service = getContentService();
    const { action, ...data } = await request.json();

    switch (action) {
      case 'generate_content':
        const content = await service.generateContent(data.request);
        return NextResponse.json({ success: true, data: content });

      case 'generate_from_template':
        const templateContent = await service.generateFromTemplate(
          data.templateId,
          data.variables
        );
        return NextResponse.json({ success: true, data: templateContent });

      case 'optimize_content':
        const optimization = await service.optimizeContent(
          data.contentId,
          data.goals
        );
        return NextResponse.json({ success: true, data: optimization });

      case 'improve_readability':
        const readabilityResult = await service.improveReadability(data.content);
        return NextResponse.json({ success: true, data: readabilityResult });

      case 'enhance_seo':
        const seoResult = await service.enhanceSEO(data.content, data.keywords);
        return NextResponse.json({ success: true, data: seoResult });

      case 'create_template':
        const template = await service.createTemplate(data.template);
        return NextResponse.json({ success: true, data: template });

      case 'analyze_quality':
        const quality = await service.analyzeQuality(data.content, data.context);
        return NextResponse.json({ success: true, data: quality });

      case 'check_originality':
        const originality = await service.checkOriginality(data.content);
        return NextResponse.json({ success: true, data: originality });

      case 'validate_compliance':
        const compliance = await service.validateCompliance(
          data.content,
          data.requirements
        );
        return NextResponse.json({ success: true, data: compliance });

      case 'analyze_market':
        const marketAnalysis = await service.analyzeMarket(
          data.industry,
          data.region
        );
        return NextResponse.json({ success: true, data: marketAnalysis });

      case 'track_trends':
        const trends = await service.trackTrends(data.keywords, data.timeframe);
        return NextResponse.json({ success: true, data: trends });

      case 'analyze_competitors':
        const competitors = await service.analyzeCompetitors(
          data.competitors
        );
        return NextResponse.json({ success: true, data: competitors });

      case 'identify_opportunities':
        const opportunities = await service.identifyOpportunities(
          data.industry || 'business consulting',
          data.businessGoals || ['growth', 'efficiency']
        );
        return NextResponse.json({ success: true, data: opportunities });

      case 'assess_threats':
        const threats = await service.assessThreats(
          data.industry || 'business consulting',
          data.businessModel || 'consulting services'
        );
        return NextResponse.json({ success: true, data: threats });

      case 'recommend_content':
        const recommendations = await service.recommendContent(
          data.marketData,
          data.brandContext || {}
        );
        return NextResponse.json({ success: true, data: recommendations });

      case 'generate_calendar':
        const calendar = await service.generateContentCalendar(
          data.goals,
          data.timeframe,
          data.frequency
        );
        return NextResponse.json({ success: true, data: calendar });

      case 'get_content_insights':
        const insights = await service.generateContentInsights();
        return NextResponse.json({ success: true, data: insights });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Content Generation API error:', error);
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
    const service = getContentService();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const contentId = url.searchParams.get('contentId');
    const templateType = url.searchParams.get('type');

    switch (action) {
      case 'list_templates':
        const templates = await service.listTemplates(templateType as ContentType);
        return NextResponse.json({ success: true, data: templates });

      case 'get_content_performance':
        if (!contentId) {
          return NextResponse.json(
            { success: false, error: 'Content ID required' },
            { status: 400 }
          );
        }
        const performance = await service.getContentPerformance(contentId);
        return NextResponse.json({ success: true, data: performance });

      case 'get_intelligence_alerts':
        const alerts = await service.getIntelligenceAlerts(['trends', 'competitors']);
        return NextResponse.json({ success: true, data: alerts });

      case 'get_insights':
        const insights = await service.generateContentInsights();
        return NextResponse.json({ success: true, data: insights });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Content Generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
