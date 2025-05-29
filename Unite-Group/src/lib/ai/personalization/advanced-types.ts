/**
 * Advanced AI Personalization Types
 * Unite Group - Version 11.0 Phase 2 Implementation
 */

export interface UserBehaviorEvent {
  id: string;
  userId: string;
  sessionId: string;
  eventType: BehaviorEventType;
  timestamp: Date;
  data: Record<string, unknown>;
  context: {
    page?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    platform?: string;
    location?: {
      country: string;
      region: string;
      city: string;
    };
    referrer?: string;
    userAgent?: string;
  };
  processed: boolean;
}

export type BehaviorEventType = 
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'form_interaction'
  | 'download'
  | 'search'
  | 'consultation_request'
  | 'project_inquiry'
  | 'content_engagement'
  | 'time_on_page'
  | 'exit_intent'
  | 'conversion';

export interface UserBehaviorPattern {
  userId: string;
  patterns: {
    navigationFlow: string[];
    contentPreferences: ContentPreference[];
    timePatterns: TimePattern[];
    deviceUsage: DeviceUsagePattern[];
    engagementMetrics: EngagementMetrics;
    conversionIndicators: ConversionIndicator[];
  };
  confidence: number;
  lastUpdated: Date;
  sampleSize: number;
}

export interface ContentPreference {
  category: string;
  subcategory?: string;
  affinity: number; // 0-1 scale
  viewTime: number; // average seconds spent
  interactions: number;
  lastInteraction: Date;
  trending: 'up' | 'down' | 'stable';
}

export interface TimePattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hourOfDay: number; // 0-23
  activityLevel: number; // 0-1 scale
  typicalActions: BehaviorEventType[];
}

export interface DeviceUsagePattern {
  device: 'desktop' | 'mobile' | 'tablet';
  usagePercentage: number;
  preferredActions: BehaviorEventType[];
  sessionDuration: number; // average minutes
  conversionRate: number;
}

export interface EngagementMetrics {
  overallScore: number; // 0-100
  pageDepth: number; // average pages per session
  sessionDuration: number; // average minutes
  returnVisitFrequency: number; // days between visits
  contentCompletionRate: number; // 0-1 scale
  interactionRate: number; // clicks/views ratio
}

export interface ConversionIndicator {
  action: string;
  probability: number; // 0-1 scale
  timeToConversion: number; // estimated days
  requiredTouchpoints: number;
  criticalPath: string[];
}

export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  conditions: PersonalizationCondition[];
  actions: PersonalizationAction[];
  priority: number;
  isActive: boolean;
  performance: RulePerformance;
  created: Date;
  lastModified: Date;
}

export interface PersonalizationCondition {
  type: 'behavior' | 'demographic' | 'temporal' | 'contextual' | 'ai_prediction';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range' | 'matches_pattern';
  field: string;
  value: unknown;
  weight: number; // importance in decision making
}

export interface PersonalizationAction {
  type: 'content_swap' | 'layout_change' | 'recommendation' | 'cta_modification' | 'pricing_adjustment' | 'messaging_change';
  target: string; // element selector or content ID
  content: string | Record<string, unknown>;
  duration?: number; // how long to apply in minutes
  conditions?: string[]; // additional conditions for this action
}

export interface RulePerformance {
  timesTriggered: number;
  conversionRate: number;
  engagementLift: number; // percentage improvement
  revenueImpact: number;
  userSatisfaction: number; // 0-5 scale
  lastEvaluated: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // traffic allocation percentage
  content: Record<string, unknown>;
  rules: PersonalizationRule[];
  isControl: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  targetAudience: {
    conditions: PersonalizationCondition[];
    estimatedSize: number;
  };
  metrics: ABTestMetrics;
  settings: {
    trafficSplit: Record<string, number>;
    minimumSampleSize: number;
    confidenceLevel: number; // 0.90, 0.95, 0.99
    maximumDuration: number; // days
  };
}

export interface ABTestMetrics {
  participants: Record<string, number>; // variant_id -> user_count
  conversions: Record<string, number>;
  conversionRates: Record<string, number>;
  engagementMetrics: Record<string, EngagementMetrics>;
  statisticalSignificance: Record<string, boolean>;
  winner?: string; // variant_id
  confidenceInterval: Record<string, { lower: number; upper: number }>;
}

export interface PersonalizationContext {
  userId: string;
  sessionId: string;
  currentPage: string;
  userProfile: UserPersonalizationProfile;
  behaviorPatterns: UserBehaviorPattern;
  realTimeContext: {
    device: string;
    location: string;
    timeOfDay: number;
    dayOfWeek: number;
    referrer?: string;
    currentSession: {
      pagesViewed: string[];
      timeSpent: number;
      interactions: number;
    };
  };
  aiPredictions: {
    conversionProbability: number;
    nextLikelyAction: string;
    optimalContent: string[];
    recommendedPersonalization: PersonalizationAction[];
  };
}

export interface UserPersonalizationProfile {
  userId: string;
  segment: string;
  tier: 'new' | 'interested' | 'qualified' | 'customer' | 'advocate';
  preferences: {
    contentTypes: string[];
    communicationChannels: string[];
    contactFrequency: 'low' | 'medium' | 'high';
    businessFocus: string[];
    priceRange?: { min: number; max: number };
  };
  demographics: {
    industry?: string;
    companySize?: string;
    role?: string;
    location?: string;
    timezone?: string;
  };
  journey: {
    stage: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';
    touchpoints: TouchpointHistory[];
    lastInteraction: Date;
    totalValue: number;
    lifetimeValue: number;
  };
  aiInsights: {
    predictedLifetimeValue: number;
    churnRisk: number; // 0-1 scale
    upsellPotential: number;
    contentAffinity: Record<string, number>;
    optimalTiming: TimePattern[];
  };
}

export interface TouchpointHistory {
  timestamp: Date;
  channel: 'website' | 'email' | 'phone' | 'social' | 'advertising' | 'referral';
  type: string;
  outcome: 'positive' | 'neutral' | 'negative';
  value: number;
  notes?: string;
}

export interface PersonalizationEngine {
  // Core functionality
  analyzeUserBehavior(events: UserBehaviorEvent[]): Promise<UserBehaviorPattern>;
  generatePersonalization(context: PersonalizationContext): Promise<PersonalizationAction[]>;
  executePersonalization(actions: PersonalizationAction[], context: PersonalizationContext): Promise<PersonalizationResult>;
  
  // Rule management
  createRule(rule: Omit<PersonalizationRule, 'id' | 'created' | 'lastModified'>): Promise<PersonalizationRule>;
  updateRule(ruleId: string, updates: Partial<PersonalizationRule>): Promise<PersonalizationRule>;
  evaluateRules(context: PersonalizationContext): Promise<PersonalizationRule[]>;
  
  // A/B testing
  createABTest(test: Omit<ABTest, 'id' | 'metrics'>): Promise<ABTest>;
  assignUserToVariant(userId: string, testId: string): Promise<{ variant: ABTestVariant; assigned: boolean }>;
  recordABTestEvent(testId: string, variantId: string, userId: string, event: BehaviorEventType): Promise<void>;
  
  // Analytics and optimization
  generateInsights(userId?: string, timeRange?: { start: Date; end: Date }): Promise<PersonalizationInsights>;
  optimizeRules(): Promise<PersonalizationOptimization>;
  predictUserBehavior(userId: string, horizon: number): Promise<BehaviorPrediction>;
}

export interface PersonalizationResult {
  actions: PersonalizationAction[];
  appliedRules: string[];
  confidence: number;
  estimatedImpact: {
    engagementLift: number;
    conversionLift: number;
  };
  metadata: {
    timestamp: Date;
    processingTime: number;
    dataFreshness: number;
  };
}

export interface PersonalizationInsights {
  summary: {
    totalUsers: number;
    activePersonalizations: number;
    averageEngagementLift: number;
    totalConversions: number;
    revenueImpact: number;
  };
  topPerformingRules: PersonalizationRule[];
  userSegmentPerformance: Array<{
    segment: string;
    users: number;
    conversionRate: number;
    engagementScore: number;
  }>;
  contentPerformance: Array<{
    contentId: string;
    views: number;
    engagementRate: number;
    conversionRate: number;
  }>;
  recommendations: string[];
  trends: {
    engagementTrend: Array<{ date: Date; value: number }>;
    conversionTrend: Array<{ date: Date; value: number }>;
    userGrowth: Array<{ date: Date; value: number }>;
  };
}

export interface PersonalizationOptimization {
  recommendations: Array<{
    type: 'rule_adjustment' | 'new_rule' | 'remove_rule' | 'audience_expansion' | 'content_update';
    description: string;
    estimatedImpact: number;
    implementationEffort: 'low' | 'medium' | 'high';
    priority: number;
  }>;
  underperformingRules: string[];
  opportunityAreas: string[];
  suggestedTests: Array<{
    name: string;
    hypothesis: string;
    variants: string[];
    estimatedDuration: number;
  }>;
}

export interface BehaviorPrediction {
  userId: string;
  timeHorizon: number; // days
  predictions: Array<{
    action: BehaviorEventType;
    probability: number;
    expectedTimestamp: Date;
    confidence: number;
  }>;
  likelyConversionPath: string[];
  riskFactors: string[];
  opportunities: string[];
}

export interface PersonalizationConfig {
  enableRealTimePersonalization: boolean;
  enableABTesting: boolean;
  enableAIPredictions: boolean;
  dataRetentionDays: number;
  minimumDataPoints: number;
  confidenceThreshold: number;
  maxPersonalizationsPerUser: number;
  cacheTTL: number;
  aiModelSettings: {
    predictionModel: string;
    retrainingFrequency: number; // days
    featureImportanceThreshold: number;
  };
  privacySettings: {
    anonymizeData: boolean;
    respectDoNotTrack: boolean;
    gdprCompliant: boolean;
    dataProcessingConsent: boolean;
  };
}
