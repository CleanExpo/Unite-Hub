/**
 * AI Communication Systems Types
 * Unite Group - Version 11.0 Phase 2 Implementation
 */

export interface ChatbotMessage {
  id: string;
  sessionId: string;
  userId?: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    entities?: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
}

export interface ChatbotSession {
  id: string;
  userId?: string;
  status: 'active' | 'waiting' | 'ended' | 'transferred';
  startTime: Date;
  endTime?: Date;
  messages: ChatbotMessage[];
  context: {
    userProfile?: {
      name?: string;
      email?: string;
      company?: string;
      industry?: string;
      previousInteractions?: number;
    };
    currentPage?: string;
    referrer?: string;
    intent?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high';
  };
  handoffToHuman?: {
    requested: boolean;
    reason?: string;
    timestamp?: Date;
    assignedAgent?: string;
  };
}

export interface ChatbotIntent {
  name: string;
  description: string;
  patterns: string[];
  entities: string[];
  responses: ChatbotResponse[];
  actions?: ChatbotAction[];
  confidence_threshold: number;
  context_required?: string[];
}

export interface ChatbotResponse {
  type: 'text' | 'quick_reply' | 'card' | 'list' | 'form';
  content: string;
  options?: {
    quick_replies?: string[];
    cards?: Array<{
      title: string;
      subtitle?: string;
      image?: string;
      buttons?: Array<{
        title: string;
        type: 'url' | 'postback';
        value: string;
      }>;
    }>;
    form_fields?: Array<{
      name: string;
      type: 'text' | 'email' | 'phone' | 'select';
      label: string;
      required: boolean;
      options?: string[];
    }>;
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than';
    value: unknown;
  }>;
}

export interface ChatbotAction {
  type: 'collect_lead' | 'schedule_consultation' | 'transfer_human' | 'send_email' | 'create_ticket';
  parameters: Record<string, unknown>;
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'welcome' | 'nurture' | 'promotional' | 'follow_up' | 'educational';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  targetAudience: {
    segments: string[];
    filters: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
    estimatedSize: number;
  };
  content: {
    subject: string;
    preheader?: string;
    htmlBody: string;
    textBody: string;
    personalizations: Array<{
      field: string;
      defaultValue?: string;
    }>;
  };
  schedule?: {
    sendAt?: Date;
    timezone?: string;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
    endDate?: Date;
  };
  abTest?: {
    enabled: boolean;
    variants: Array<{
      name: string;
      subject: string;
      content: string;
      percentage: number;
    }>;
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  };
  analytics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    conversions: number;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: 'transactional' | 'marketing' | 'notification';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    description: string;
    required: boolean;
    defaultValue?: unknown;
  }>;
  aiOptimizations?: {
    subjectLineVariants: string[];
    contentSuggestions: string[];
    personalizations: Array<{
      segment: string;
      modifications: Record<string, string>;
    }>;
  };
}

export interface CommunicationInsight {
  id: string;
  type: 'sentiment_analysis' | 'intent_detection' | 'topic_analysis' | 'engagement_prediction';
  source: 'chatbot' | 'email' | 'phone' | 'social';
  timestamp: Date;
  data: {
    sentiment?: {
      score: number; // -1 to 1
      label: 'positive' | 'neutral' | 'negative';
      confidence: number;
    };
    intent?: {
      primary: string;
      secondary?: string[];
      confidence: number;
    };
    topics?: Array<{
      name: string;
      relevance: number;
      keywords: string[];
    }>;
    engagement?: {
      predicted_score: number;
      factors: string[];
      recommendations: string[];
    };
  };
  actionRecommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    reasoning: string;
  }>;
}

export interface CommunicationChannel {
  id: string;
  type: 'chatbot' | 'email' | 'sms' | 'push' | 'in_app';
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  config: {
    provider?: string;
    credentials?: Record<string, string>;
    settings?: Record<string, unknown>;
  };
  analytics: {
    totalMessages: number;
    successRate: number;
    responseTime: number; // average in milliseconds
    userSatisfaction: number; // 0-5 scale
    conversionRate: number;
  };
}

export interface SmartNotification {
  id: string;
  userId: string;
  type: 'promotional' | 'transactional' | 'reminder' | 'alert';
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  content: {
    title: string;
    body: string;
    actionUrl?: string;
    actionText?: string;
  };
  personalization: {
    timezone: string;
    preferredChannel: string;
    contentVariant: string;
  };
  scheduling: {
    sendAt: Date;
    optimalTiming: boolean;
    frequency_cap?: {
      max_per_day: number;
      max_per_week: number;
    };
  };
  tracking: {
    sent: boolean;
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
    converted: boolean;
  };
}

export interface AIAssistant {
  // Core conversation handling
  processMessage(message: string, sessionId: string, context?: Record<string, unknown>): Promise<ChatbotMessage>;
  
  // Intent and entity recognition
  detectIntent(message: string): Promise<{ intent: string; confidence: number; entities: Record<string, unknown> }>;
  
  // Conversation management
  createSession(userId?: string, context?: Record<string, unknown>): Promise<ChatbotSession>;
  getSession(sessionId: string): Promise<ChatbotSession | null>;
  updateSession(sessionId: string, updates: Partial<ChatbotSession>): Promise<ChatbotSession>;
  endSession(sessionId: string, reason?: string): Promise<void>;
  
  // Knowledge base
  addKnowledge(topic: string, content: string, metadata?: Record<string, unknown>): Promise<void>;
  searchKnowledge(query: string): Promise<Array<{ content: string; relevance: number }>>;
  
  // Analytics and insights
  getSessionAnalytics(timeRange?: { start: Date; end: Date }): Promise<{
    totalSessions: number;
    averageDuration: number;
    resolutionRate: number;
    handoffRate: number;
    userSatisfaction: number;
  }>;
}

export interface EmailAutomation {
  // Campaign management
  createCampaign(campaign: Omit<EmailCampaign, 'id' | 'analytics'>): Promise<EmailCampaign>;
  updateCampaign(campaignId: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign>;
  sendCampaign(campaignId: string): Promise<{ success: boolean; messageId?: string; errors?: string[] }>;
  scheduleCampaign(campaignId: string, sendAt: Date): Promise<void>;
  
  // Template management
  createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate>;
  optimizeTemplate(templateId: string): Promise<EmailTemplate>;
  
  // Personalization
  personalizeContent(content: string, userContext: Record<string, unknown>): Promise<string>;
  optimizeSubjectLine(subject: string, audience: string[]): Promise<string[]>;
  
  // Analytics
  getCampaignAnalytics(campaignId: string): Promise<EmailCampaign['analytics']>;
  generateInsights(timeRange?: { start: Date; end: Date }): Promise<Array<{
    metric: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
    recommendations: string[];
  }>>;
}

export interface CommunicationOrchestrator {
  // Multi-channel coordination
  sendMessage(userId: string, content: string, channels: string[], options?: {
    priority?: 'low' | 'medium' | 'high';
    timing?: 'immediate' | 'optimal' | Date;
    personalization?: boolean;
  }): Promise<{ success: boolean; results: Record<string, unknown> }>;
  
  // Smart routing
  routeToOptimalChannel(userId: string, messageType: string): Promise<string>;
  
  // Conversation handoff
  escalateToHuman(sessionId: string, reason: string): Promise<{ success: boolean; agentId?: string }>;
  
  // Analytics and insights
  generateCommunicationInsights(userId?: string, timeRange?: { start: Date; end: Date }): Promise<CommunicationInsight[]>;
  
  // Optimization
  optimizeCommunicationFlow(userId: string): Promise<Array<{
    channel: string;
    timing: Date;
    content: string;
    expectedResponse: number;
  }>>;
}

export interface CommunicationConfig {
  chatbot: {
    enabled: boolean;
    aiProvider: string;
    model: string;
    maxTokens: number;
    temperature: number;
    fallbackToHuman: boolean;
    humanHandoffTriggers: string[];
    responseTimeout: number;
    maxConversationLength: number;
  };
  email: {
    provider: string;
    fromName: string;
    fromEmail: string;
    replyTo: string;
    trackingEnabled: boolean;
    optimizationEnabled: boolean;
    abTestingEnabled: boolean;
    personalizedSendTimes: boolean;
  };
  channels: {
    priority: string[];
    fallbackChain: string[];
    rateLimits: Record<string, { maxPerHour: number; maxPerDay: number }>;
  };
  ai: {
    sentimentAnalysis: boolean;
    intentDetection: boolean;
    autoPersonalization: boolean;
    contentOptimization: boolean;
    predictiveInsights: boolean;
  };
  compliance: {
    gdprCompliant: boolean;
    unsubscribeLinks: boolean;
    dataRetentionDays: number;
    consentTracking: boolean;
  };
}
