/**
 * Australian Business Intelligence Types
 * Unite Group - Comprehensive Type Definitions
 */

// === CORE BUSINESS TYPES ===

export interface AustralianMarketData {
  cities: AustralianCityData[];
  trends: AustralianMarketTrend[];
  competitors: AustralianCompetitor[];
  opportunities: AustralianMarketOpportunity[];
  lastUpdated: Date;
}

export interface AustralianCityData {
  name: string;
  state: string;
  population: number;
  averageIncome: number;
  businessSectors: string[];
  timezone: 'Australia/Sydney' | 'Australia/Melbourne' | 'Australia/Brisbane' | 'Australia/Perth';
  economicIndicators: {
    gdp: number;
    unemploymentRate: number;
    businessGrowthRate: number;
  };
}

export interface AustralianBusinessHours {
  workingDays: string[];
  startTime: string;
  endTime: string;
  lunchBreak: {
    start: string;
    end: string;
  };
  timezone: string;
}

export interface AustralianFinancialConfig {
  currency: 'AUD';
  gstRate: number;
  financialYearStart: string; // MM-DD format
  quarterDefinitions: {
    Q1: { start: string; end: string };
    Q2: { start: string; end: string };
    Q3: { start: string; end: string };
    Q4: { start: string; end: string };
  };
}

export interface AustralianComplianceFramework {
  privacyAct: {
    year: number;
    requirements: string[];
  };
  consumerLaw: {
    requirements: string[];
  };
  corporationsAct: {
    year: number;
    requirements: string[];
  };
}

export interface AustralianHolidayCalendar {
  year: number;
  holidays: Array<{
    name: string;
    date: string;
    type: 'national' | 'state';
    states?: string[];
  }>;
}

// === MARKET ANALYSIS TYPES ===

export interface AustralianMarketInsights {
  cityData: AustralianCityData;
  trends: AustralianMarketTrend[];
  competitors: AustralianCompetitor[];
  opportunities: AustralianMarketOpportunity[];
  recommendations: string[];
  lastAnalyzed: Date;
}

export interface AustralianCompetitor {
  name: string;
  headquarters: string;
  marketShare: number;
  revenue: number;
  employees: number;
  focusAreas: string[];
  targetMarket: string[];
  pricingStrategy: 'premium' | 'competitive' | 'budget';
  strengths: string[];
  weaknesses: string[];
}

export interface AustralianMarketTrend {
  id: string;
  name: string;
  description: string;
  category: string;
  confidenceScore: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  relevantCities: string[];
}

export interface AustralianMarketOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedValue: number;
  sector: string;
  location: string;
  timeline: string;
  requirements: string[];
  competitionLevel: 'low' | 'medium' | 'high';
}

export interface MarketPenetrationData {
  city: string;
  marketSize: number;
  currentPenetration: number;
  potentialReach: number;
  competitiveDensity: number;
  entryBarriers: string[];
  opportunities: string[];
  recommendedStrategy: string;
}

export interface EntryStrategy {
  targetCities: string[];
  phaseApproach: {
    phase1: { cities: string[]; timeline: string; investment: number };
    phase2: { cities: string[]; timeline: string; investment: number };
    phase3: { cities: string[]; timeline: string; investment: number };
  };
  totalInvestment: number;
  expectedROI: number;
  riskAssessment: string;
  keySuccessFactors: string[];
}

export interface InvestmentRecommendation {
  priority: 'high' | 'medium' | 'low';
  investmentRange: { min: number; max: number };
  expectedROI: number;
  paybackPeriod: string;
  riskLevel: 'low' | 'medium' | 'high';
  rationale: string;
}

// === PERSONALIZATION TYPES ===

export interface AustralianUserProfile {
  id: string;
  location: {
    city: string;
    state: string;
    postcode: string;
    timezone: 'Australia/Sydney' | 'Australia/Melbourne' | 'Australia/Brisbane' | 'Australia/Perth';
  };
  preferences: {
    language: 'en-AU';
    communicationStyle: 'formal' | 'casual' | 'professional';
    contactHours: {
      start: string;
      end: string;
      days: string[];
    };
    industries: string[];
    businessSize: 'startup' | 'sme' | 'enterprise' | 'government';
  };
  behavior: {
    lastActive: Date;
    sessionCount: number;
    averageSessionDuration: number;
    preferredContent: string[];
    engagementScore: number;
  };
  demographics: {
    businessRole: string;
    companySize: number;
    industry: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
  };
}

export interface AustralianPersonalizationContext {
  currentTime: Date;
  isBusinessHours: boolean;
  optimalContactTime: string;
  localWeather?: string;
  marketTrends: string[];
  competitiveInsights: string[];
  recommendations: string[];
  culturalContext: {
    greetingStyle: string;
    communicationTone: string;
    localReferences: string[];
    businessEtiquette: string[];
  };
}

export interface PersonalizedContent {
  greeting: string;
  mainContent: string;
  callToAction: string;
  additionalInfo: string[];
  localContext: string;
  culturalAdaptation: string;
}

export interface AustralianBusinessEtiquette {
  greetings: {
    formal: string[];
    casual: string[];
    professional: string[];
  };
  communication: {
    emailStyle: string[];
    phoneStyle: string[];
    meetingStyle: string[];
  };
  culturalReferences: {
    businessMetaphors: string[];
    localSayings: string[];
    industryTerms: Record<string, string[]>;
  };
  timeReferences: {
    businessHours: string[];
    holidays: string[];
    seasons: string[];
  };
}

// === COMMUNICATION TYPES ===

export interface AustralianCommunicationSettings {
  tone: 'formal' | 'casual' | 'professional';
  urgency: 'low' | 'medium' | 'high';
  businessContext: 'initial_contact' | 'follow_up' | 'proposal' | 'support' | 'partnership';
  includeCulturalElements: boolean;
  respectBusinessHours: boolean;
  includeLocalReferences: boolean;
}

export interface AustralianMessageTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  culturalAdaptations: string[];
  appropriateTiming: string[];
  businessContexts: string[];
}

export interface AustralianCommunicationResponse {
  optimizedMessage: string;
  subject?: string;
  timing: {
    optimal: boolean;
    recommendedTime: string;
    reasoning: string;
  };
  culturalNotes: string[];
  followUpSuggestions: string[];
  compliance: {
    privacyCompliant: boolean;
    gstMentioned: boolean;
    businessHoursRespected: boolean;
  };
}

export interface AustralianEmailSignature {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  disclaimer: string;
  australianBusinessNumber?: string;
}

// === ENHANCED ARCHITECTURE TYPES ===

export interface AustralianServiceConfig {
  environment: 'development' | 'staging' | 'production';
  enabledFeatures: string[];
  dataRetentionDays: number;
  cacheConfig: {
    ttl: number;
    maxSize: number;
  };
  rateLimiting: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface AustralianMetrics {
  businessHours: {
    totalQueries: number;
    averageResponseTime: number;
    successRate: number;
  };
  personalization: {
    profilesCreated: number;
    engagementScoreAverage: number;
    culturalAdaptationSuccess: number;
  };
  communication: {
    emailsGenerated: number;
    templatesUsed: Record<string, number>;
    complianceRate: number;
  };
  marketAnalysis: {
    insightsGenerated: number;
    opportunitiesIdentified: number;
    marketDataFreshness: number;
  };
}

export interface AustralianIntegrationEvent {
  type: 'market_update' | 'user_profile_change' | 'communication_sent' | 'business_hours_change';
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  processed: boolean;
}

export interface AustralianDataValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// === UTILITY TYPES ===

export type AustralianTimezone = 'Australia/Sydney' | 'Australia/Melbourne' | 'Australia/Brisbane' | 'Australia/Perth';
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'NT' | 'ACT';
export type AustralianBusinessSize = 'startup' | 'sme' | 'enterprise' | 'government';
export type AustralianCommunicationTone = 'formal' | 'casual' | 'professional';
export type AustralianUrgencyLevel = 'low' | 'medium' | 'high';
export type AustralianBusinessContext = 'initial_contact' | 'follow_up' | 'proposal' | 'support' | 'partnership';

// === API RESPONSE TYPES ===

export interface AustralianAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
  };
}

export interface AustralianBatchOperation<T> {
  items: T[];
  batchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: Array<{
    item: T;
    success: boolean;
    error?: string;
  }>;
}
