/**
 * AI Communication API Route
 * Unite Group - Version 11.0 Phase 2 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AICommunicationService } from '@/lib/ai/communication/service';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';
import type { CommunicationConfig } from '@/lib/ai/communication/types';

const config: CommunicationConfig = {
  chatbot: {
    enabled: true,
    aiProvider: 'openai',
    model: 'gpt-4',
    maxTokens: 500,
    temperature: 0.7,
    fallbackToHuman: true,
    humanHandoffTriggers: ['complex_inquiry', 'complaint', 'escalation'],
    responseTimeout: 10000,
    maxConversationLength: 20
  },
  email: {
    provider: 'sendgrid',
    fromName: 'Unite Group',
    fromEmail: 'noreply@unitegroup.com.au',
    replyTo: 'support@unitegroup.com.au',
    trackingEnabled: true,
    optimizationEnabled: true,
    abTestingEnabled: true,
    personalizedSendTimes: true
  },
  channels: {
    priority: ['chatbot', 'email', 'sms'],
    fallbackChain: ['email', 'sms'],
    rateLimits: {
      email: { maxPerHour: 100, maxPerDay: 1000 },
      sms: { maxPerHour: 10, maxPerDay: 50 },
      chatbot: { maxPerHour: 1000, maxPerDay: 10000 }
    }
  },
  ai: {
    sentimentAnalysis: true,
    intentDetection: true,
    autoPersonalization: true,
    contentOptimization: true,
    predictiveInsights: true
  },
  compliance: {
    gdprCompliant: true,
    unsubscribeLinks: true,
    dataRetentionDays: 365,
    consentTracking: true
  }
};

let communicationService: AICommunicationService | null = null;

function getCommunicationService(): AICommunicationService {
  if (!communicationService) {
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
        ttl: 300000,
        maxSize: 1000,
        keyStrategy: 'hash'
      },
      monitoring: {
        enabled: true,
        metricsRetentionDays: 30,
        healthCheckIntervalSeconds: 60
      }
    });

    communicationService = new AICommunicationService(aiGateway, config);
  }
  return communicationService;
}

export async function POST(request: NextRequest) {
  try {
    const service = getCommunicationService();
    const { action, ...data } = await request.json();

    switch (action) {
      case 'create_session':
        const session = await service.createSession(data.userId, data.context);
        return NextResponse.json({ success: true, data: session });

      case 'process_message':
        const response = await service.processMessage(
          data.message,
          data.sessionId,
          data.context
        );
        return NextResponse.json({ success: true, data: response });

      case 'detect_intent':
        const intent = await service.detectIntent(data.message);
        return NextResponse.json({ success: true, data: intent });

      case 'create_campaign':
        const campaign = await service.createCampaign(data.campaign);
        return NextResponse.json({ success: true, data: campaign });

      case 'send_campaign':
        const sendResult = await service.sendCampaign(data.campaignId);
        return NextResponse.json({ success: true, data: sendResult });

      case 'personalize_content':
        const personalizedContent = await service.personalizeContent(
          data.content,
          data.userContext
        );
        return NextResponse.json({ success: true, data: { content: personalizedContent } });

      case 'optimize_subject_line':
        const optimizedSubjects = await service.optimizeSubjectLine(
          data.subject,
          data.audience
        );
        return NextResponse.json({ success: true, data: { variants: optimizedSubjects } });

      case 'send_message':
        const messageResult = await service.sendMessage(
          data.userId,
          data.content,
          data.channels,
          data.options
        );
        return NextResponse.json({ success: true, data: messageResult });

      case 'get_insights':
        const insights = await service.generateCommunicationInsights(
          data.userId,
          data.timeRange
        );
        return NextResponse.json({ success: true, data: insights });

      case 'get_session_analytics':
        const analytics = await service.getSessionAnalytics(data.timeRange);
        return NextResponse.json({ success: true, data: analytics });

      case 'escalate_to_human':
        const escalationResult = await service.escalateToHuman(
          data.sessionId,
          data.reason
        );
        return NextResponse.json({ success: true, data: escalationResult });

      case 'optimize_communication_flow':
        const optimizedFlow = await service.optimizeCommunicationFlow(data.userId);
        return NextResponse.json({ success: true, data: optimizedFlow });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Communication API error:', error);
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
    const service = getCommunicationService();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const sessionId = url.searchParams.get('sessionId');

    switch (action) {
      case 'get_session':
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'Session ID required' },
            { status: 400 }
          );
        }
        const session = await service.getSession(sessionId);
        return NextResponse.json({ success: true, data: session });

      case 'get_analytics':
        const analytics = await service.getSessionAnalytics();
        return NextResponse.json({ success: true, data: analytics });

      case 'get_insights':
        const insights = await service.generateInsights();
        return NextResponse.json({ success: true, data: insights });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Communication API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
