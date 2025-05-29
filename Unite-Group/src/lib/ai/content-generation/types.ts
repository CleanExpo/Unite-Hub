/**
 * Smart Content Generation Types
 * Unite Group - Version 11.0 Phase 3 Implementation
 */

export interface ContentRequest {
  id: string;
  type: ContentType;
  topic: string;
  audience: string;
  tone: ContentTone;
  length: ContentLength;
  keywords?: string[];
  context?: ContentContext;
  constraints?: ContentConstraints;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export type ContentType = 
  | 'blog_post'
  | 'case_study'
  | 'white_paper'
  | 'email_newsletter'
  | 'social_media'
  | 'landing_page'
  | 'product_description'
  | 'press_release'
  | 'proposal'
  | 'marketing_copy'
  | 'technical_documentation'
  | 'seo_content';

export type ContentTone = 
  | 'professional'
  | 'conversational'
  | 'authoritative'
  | 'friendly'
  | 'technical'
  | 'persuasive'
  | 'educational'
  | 'inspirational';

export type ContentLength = 
  | 'short' // 100-300 words
  | 'medium' // 300-800 words
  | 'long' // 800-1500 words
  | 'extended'; // 1500+ words

export interface ContentContext {
  industry?: string;
  targetMarket?: string;
  competitorAnalysis?: string[];
  brandGuidelines?: BrandGuidelines;
  previousContent?: string[];
  userPersona?: UserPersona;
  businessGoals?: string[];
}

export interface BrandGuidelines {
  voice: string;
  values: string[];
  messaging: string[];
  doNotUse: string[];
  preferredTerms: Record<string, string>;
  styleGuide?: {
    headingStyle: string;
    paragraphLength: string;
    bulletPointStyle: string;
  };
}

export interface UserPersona {
  name: string;
  demographics: {
    age: string;
    occupation: string;
    location: string;
    income: string;
  };
  psychographics: {
    interests: string[];
    painPoints: string[];
    goals: string[];
    values: string[];
  };
  behaviorPatterns: {
    contentPreferences: string[];
    purchasingBehavior: string[];
    communicationStyle: string;
  };
}

export interface ContentConstraints {
  maxWords?: number;
  minWords?: number;
  requiredSections?: string[];
  excludeTopics?: string[];
  compliance?: ComplianceRequirements;
  seoRequirements?: SEORequirements;
}

export interface ComplianceRequirements {
  gdprCompliant: boolean;
  medicalClaims: boolean;
  financialAdvice: boolean;
  legalDisclaimer: boolean;
  industrySpecific?: string[];
}

export interface SEORequirements {
  primaryKeyword: string;
  secondaryKeywords: string[];
  metaDescription?: string;
  targetKeywordDensity?: number;
  includeSchema?: boolean;
  internalLinks?: number;
  externalLinks?: number;
}

export interface GeneratedContent {
  id: string;
  requestId: string;
  content: {
    title: string;
    body: string;
    summary?: string;
    metaDescription?: string;
    tags?: string[];
    sections?: ContentSection[];
  };
  seoAnalysis: SEOAnalysis;
  qualityMetrics: QualityMetrics;
  aiMetadata: {
    model: string;
    provider: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
    iterationCount: number;
  };
  variations?: ContentVariation[];
  createdAt: Date;
  lastModified: Date;
}

export interface ContentSection {
  heading: string;
  content: string;
  type: 'introduction' | 'body' | 'conclusion' | 'cta' | 'custom';
  keywords?: string[];
  wordCount: number;
}

export interface SEOAnalysis {
  keywordDensity: Record<string, number>;
  readabilityScore: number;
  seoScore: number;
  suggestions: SEOSuggestion[];
  competitorComparison?: {
    betterThan: number; // percentage
    suggestions: string[];
  };
}

export interface SEOSuggestion {
  type: 'keyword' | 'structure' | 'readability' | 'meta' | 'links';
  message: string;
  priority: 'low' | 'medium' | 'high';
  impact: number; // 0-1 scale
}

export interface QualityMetrics {
  originality: number; // 0-1 scale
  relevance: number; // 0-1 scale
  engagement: number; // 0-1 scale
  clarity: number; // 0-1 scale
  brandAlignment: number; // 0-1 scale
  overallScore: number; // 0-1 scale
  feedback: QualityFeedback[];
}

export interface QualityFeedback {
  aspect: string;
  score: number;
  comments: string[];
  suggestions: string[];
}

export interface ContentVariation {
  id: string;
  type: 'tone' | 'length' | 'angle' | 'audience';
  title: string;
  summary: string;
  differences: string[];
  useCase: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  type: ContentType;
  description: string;
  structure: TemplateSection[];
  defaultTone: ContentTone;
  suggestedLength: ContentLength;
  variables: TemplateVariable[];
  seoGuidelines?: SEORequirements;
  brandRequirements?: BrandGuidelines;
}

export interface TemplateSection {
  name: string;
  description: string;
  required: boolean;
  placeholder: string;
  wordCountGuidance?: {
    min: number;
    max: number;
    optimal: number;
  };
  examples?: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    options?: string[];
  };
}

export interface MarketIntelligence {
  id: string;
  topic: string;
  industry: string;
  analysisDate: Date;
  trends: MarketTrend[];
  competitors: CompetitorAnalysis[];
  opportunities: MarketOpportunity[];
  threats: MarketThreat[];
  keyInsights: string[];
  contentRecommendations: ContentRecommendation[];
  nextUpdateDate: Date;
}

export interface MarketTrend {
  name: string;
  description: string;
  trajectory: 'rising' | 'stable' | 'declining';
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  relevanceScore: number; // 0-1 scale
  keywords: string[];
  sources: string[];
}

export interface CompetitorAnalysis {
  name: string;
  domain?: string;
  marketPosition: string;
  strengths: string[];
  weaknesses: string[];
  contentStrategy: {
    types: ContentType[];
    frequency: string;
    themes: string[];
    performance: {
      engagement: number;
      reach: number;
      quality: number;
    };
  };
  keyMessages: string[];
  differentiators: string[];
}

export interface MarketOpportunity {
  title: string;
  description: string;
  marketSize: string;
  difficulty: 'low' | 'medium' | 'high';
  timeToRealize: string;
  requiredActions: string[];
  contentAngles: string[];
  estimatedImpact: number; // 0-1 scale
}

export interface MarketThreat {
  title: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  mitigationStrategies: string[];
  contentCounterStrategies: string[];
}

export interface ContentRecommendation {
  priority: 'low' | 'medium' | 'high';
  type: ContentType;
  topic: string;
  reasoning: string;
  targetAudience: string;
  suggestedTone: ContentTone;
  keyMessages: string[];
  competitiveAdvantage: string;
  estimatedPerformance: {
    engagement: number;
    reach: number;
    conversion: number;
  };
}

export interface ContentOptimization {
  contentId: string;
  originalMetrics: QualityMetrics;
  optimizations: OptimizationSuggestion[];
  optimizedContent?: {
    title?: string;
    body?: string;
    metaDescription?: string;
  };
  projectedImprovement: {
    seo: number;
    engagement: number;
    conversion: number;
  };
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface OptimizationSuggestion {
  type: 'keyword' | 'structure' | 'readability' | 'engagement' | 'conversion';
  description: string;
  impact: number; // 0-1 scale
  effort: number; // 0-1 scale
  priority: number; // 0-1 scale
  implementation: string;
  examples?: string[];
}

export interface ContentCalendar {
  id: string;
  name: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  items: ContentCalendarItem[];
  themes: string[];
  targetAudiences: string[];
  channels: string[];
  goals: string[];
  analytics: {
    totalContent: number;
    contentByType: Record<ContentType, number>;
    estimatedReach: number;
    estimatedEngagement: number;
  };
}

export interface ContentCalendarItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  publishDate: Date;
  status: 'planned' | 'in_progress' | 'review' | 'approved' | 'published';
  assignee?: string;
  channels: string[];
  keywords: string[];
  expectedMetrics: {
    views: number;
    engagement: number;
    conversions: number;
  };
  dependencies?: string[];
  notes?: string;
}

export interface ContentGenerator {
  // Core content generation
  generateContent(request: ContentRequest): Promise<GeneratedContent>;
  generateFromTemplate(templateId: string, variables: Record<string, unknown>): Promise<GeneratedContent>;
  generateVariations(contentId: string, variationTypes: string[]): Promise<ContentVariation[]>;
  
  // Content optimization
  optimizeContent(contentId: string, goals: string[]): Promise<ContentOptimization>;
  improveReadability(content: string): Promise<{ content: string; improvements: string[] }>;
  enhanceSEO(content: string, keywords: string[]): Promise<{ content: string; seoAnalysis: SEOAnalysis }>;
  
  // Template management
  createTemplate(template: Omit<ContentTemplate, 'id'>): Promise<ContentTemplate>;
  updateTemplate(templateId: string, updates: Partial<ContentTemplate>): Promise<ContentTemplate>;
  listTemplates(type?: ContentType): Promise<ContentTemplate[]>;
  
  // Quality analysis
  analyzeQuality(content: string, context?: ContentContext): Promise<QualityMetrics>;
  checkOriginality(content: string): Promise<{ score: number; sources: string[] }>;
  validateCompliance(content: string, requirements: ComplianceRequirements): Promise<{ compliant: boolean; issues: string[] }>;
  
  // Analytics and insights
  getContentPerformance(contentId: string): Promise<{
    views: number;
    engagement: number;
    conversions: number;
    trends: Array<{ date: Date; metric: string; value: number }>;
  }>;
  generateContentInsights(timeRange?: { start: Date; end: Date }): Promise<Array<{
    insight: string;
    data: Record<string, unknown>;
    recommendations: string[];
  }>>;
}

export interface MarketIntelligenceEngine {
  // Market analysis
  analyzeMarket(industry: string, region?: string): Promise<MarketIntelligence>;
  trackTrends(keywords: string[], timeframe: string): Promise<MarketTrend[]>;
  analyzeCompetitors(competitors: string[], analysisDepth: 'basic' | 'detailed'): Promise<CompetitorAnalysis[]>;
  
  // Opportunity identification
  identifyOpportunities(industry: string, businessGoals: string[]): Promise<MarketOpportunity[]>;
  assessThreats(industry: string, businessModel: string): Promise<MarketThreat[]>;
  
  // Content recommendations
  recommendContent(marketData: MarketIntelligence, brandContext: BrandGuidelines): Promise<ContentRecommendation[]>;
  generateContentCalendar(goals: string[], timeframe: string, frequency: string): Promise<ContentCalendar>;
  
  // Intelligence updates
  updateMarketIntelligence(industryId: string): Promise<MarketIntelligence>;
  getIntelligenceAlerts(subscriptions: string[]): Promise<Array<{
    type: 'trend' | 'competitor' | 'opportunity' | 'threat';
    message: string;
    priority: 'low' | 'medium' | 'high';
    actionItems: string[];
  }>>;
}

export interface ContentGenerationConfig {
  ai: {
    primaryProvider: string;
    fallbackProvider: string;
    maxTokens: number;
    temperature: number;
    qualityThreshold: number;
    enableMultipleIterations: boolean;
    maxIterations: number;
  };
  content: {
    defaultTone: ContentTone;
    defaultLength: ContentLength;
    enableSEOOptimization: boolean;
    enableOriginalityCheck: boolean;
    enableComplianceCheck: boolean;
    autoGenerateMetaDescriptions: boolean;
  };
  market: {
    enableRealTimeData: boolean;
    competitorTrackingEnabled: boolean;
    trendAnalysisDepth: 'basic' | 'detailed';
    updateFrequency: string; // cron expression
    dataRetentionDays: number;
  };
  templates: {
    enableCustomTemplates: boolean;
    templateLibraryEnabled: boolean;
    autoSuggestTemplates: boolean;
  };
  quality: {
    minOriginalityScore: number;
    minReadabilityScore: number;
    minSEOScore: number;
    enableHumanReview: boolean;
    autoPublishThreshold: number;
  };
}
