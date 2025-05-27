/**
 * Market Intelligence Platform Types
 * Unite Group - Version 12.0 Implementation
 */

export interface MarketIntelligencePlatform {
  // Real-time market analysis
  analyzeMarket(industry: string, region: string): Promise<MarketAnalysis>;
  trackCompetitors(competitors: string[]): Promise<CompetitorIntelligence[]>;
  identifyTrends(keywords: string[], timeframe: string): Promise<MarketTrend[]>;
  scoreOpportunities(criteria: OpportunityFilters): Promise<MarketOpportunity[]>;
  generateMarketReport(parameters: MarketReportParameters): Promise<MarketReport>;
  
  // Competitive intelligence
  monitorCompetitorActivity(competitorId: string): Promise<CompetitorActivity>;
  analyzeCompetitorPositioning(industry: string): Promise<CompetitivePositioning>;
  detectMarketDisruptions(industry: string): Promise<MarketDisruption[]>;
  benchmarkPerformance(metrics: string[]): Promise<BenchmarkAnalysis>;
  
  // Market opportunity management
  subscribeToOpportunities(filters: OpportunityFilters): Promise<void>;
  getOpportunityAlerts(): Promise<OpportunityAlert[]>;
  assessOpportunityFeasibility(opportunityId: string): Promise<FeasibilityAssessment>;
  prioritizeOpportunities(opportunities: MarketOpportunity[]): Promise<OpportunityRanking>;
}

export interface MarketAnalysis {
  id: string;
  industry: string;
  region: string;
  analyzedAt: Date;
  marketSize: {
    total: number;
    serviceable: number;
    addressable: number;
    currency: string;
  };
  growthMetrics: {
    yearOverYear: number;
    quarterOverQuarter: number;
    projectedAnnual: number;
    compoundAnnualGrowthRate: number;
  };
  marketSegments: MarketSegment[];
  keyPlayers: MarketPlayer[];
  trends: MarketTrend[];
  threats: MarketThreat[];
  opportunities: MarketOpportunity[];
  regulatoryEnvironment: RegulatoryInfo;
  economicFactors: EconomicIndicator[];
  insights: MarketInsight[];
  confidence: number;
  sources: DataSource[];
}

export interface MarketSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  growthRate: number;
  characteristics: string[];
  keyCustomers: string[];
  competitionLevel: 'low' | 'medium' | 'high';
  barriers: string[];
  opportunities: string[];
}

export interface MarketPlayer {
  id: string;
  name: string;
  type: 'incumbent' | 'challenger' | 'disruptor' | 'startup';
  marketShare: number;
  revenue: number;
  employees: number;
  foundedYear: number;
  headquarters: string;
  strengths: string[];
  weaknesses: string[];
  recentActivities: PlayerActivity[];
  partnerships: Partnership[];
  funding: FundingInfo[];
  technologies: string[];
  geographicPresence: string[];
}

export interface PlayerActivity {
  id: string;
  type: 'product_launch' | 'acquisition' | 'funding' | 'partnership' | 'expansion' | 'leadership_change';
  title: string;
  description: string;
  date: Date;
  impact: 'low' | 'medium' | 'high';
  sources: string[];
}

export interface Partnership {
  id: string;
  partnerName: string;
  type: 'technology' | 'distribution' | 'strategic' | 'investment';
  announcedDate: Date;
  description: string;
  expectedValue: number;
  status: 'active' | 'announced' | 'terminated';
}

export interface FundingInfo {
  id: string;
  round: string;
  amount: number;
  currency: string;
  date: Date;
  investors: string[];
  valuation?: number;
  purpose: string;
}

export interface MarketTrend {
  id: string;
  name: string;
  description: string;
  category: 'technology' | 'consumer' | 'regulatory' | 'economic' | 'social';
  strength: number; // 0-1 scale
  direction: 'emerging' | 'growing' | 'mature' | 'declining';
  timeline: 'short_term' | 'medium_term' | 'long_term';
  impactAreas: string[];
  drivingFactors: string[];
  implications: TrendImplication[];
  relatedTrends: string[];
  confidence: number;
  sources: DataSource[];
}

export interface TrendImplication {
  type: 'opportunity' | 'threat' | 'requirement';
  description: string;
  likelihood: number;
  impact: number;
  timeframe: string;
  actionable: boolean;
  recommendations: string[];
}

export interface MarketThreat {
  id: string;
  name: string;
  description: string;
  category: 'competitive' | 'technological' | 'regulatory' | 'economic' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number; // 0-1 scale
  timeframe: string;
  affectedAreas: string[];
  indicators: ThreatIndicator[];
  mitigationStrategies: string[];
  monitoringMetrics: string[];
}

export interface ThreatIndicator {
  metric: string;
  currentValue: number;
  thresholdValue: number;
  trend: 'improving' | 'stable' | 'deteriorating';
  lastUpdated: Date;
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  category: 'product' | 'service' | 'market' | 'technology' | 'partnership';
  marketSize: number;
  potentialRevenue: number;
  timeToMarket: string;
  investmentRequired: number;
  riskLevel: 'low' | 'medium' | 'high';
  competitionLevel: 'low' | 'medium' | 'high';
  strategicFit: number; // 0-1 scale
  feasibilityScore: number; // 0-1 scale
  priorityScore: number; // 0-1 scale
  requirements: OpportunityRequirement[];
  successFactors: string[];
  risks: string[];
  timeline: OpportunityTimeline;
  keyMetrics: OpportunityMetric[];
}

export interface OpportunityRequirement {
  type: 'technology' | 'resource' | 'partnership' | 'regulatory' | 'financial';
  description: string;
  status: 'available' | 'acquirable' | 'gap';
  timeToAcquire?: string;
  cost?: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface OpportunityTimeline {
  phases: OpportunityPhase[];
  totalDuration: string;
  criticalPath: string[];
  dependencies: string[];
  milestones: OpportunityMilestone[];
}

export interface OpportunityPhase {
  name: string;
  description: string;
  duration: string;
  startDate?: Date;
  endDate?: Date;
  deliverables: string[];
  resources: string[];
  risks: string[];
}

export interface OpportunityMilestone {
  name: string;
  description: string;
  targetDate: Date;
  criteria: string[];
  dependencies: string[];
}

export interface OpportunityMetric {
  name: string;
  description: string;
  targetValue: number;
  unit: string;
  timeline: string;
  importance: 'low' | 'medium' | 'high';
}

export interface RegulatoryInfo {
  jurisdiction: string;
  keyRegulations: Regulation[];
  upcomingChanges: RegulatoryChange[];
  complianceRequirements: ComplianceRequirement[];
  regulatoryRisks: string[];
  opportunitiesFromRegulation: string[];
}

export interface Regulation {
  name: string;
  description: string;
  effectiveDate: Date;
  impactLevel: 'low' | 'medium' | 'high';
  applicableSegments: string[];
  requirements: string[];
  penalties: string[];
}

export interface RegulatoryChange {
  name: string;
  description: string;
  proposedDate: Date;
  expectedEffectiveDate: Date;
  status: 'proposed' | 'under_review' | 'approved' | 'implemented';
  impactAssessment: string;
  preparationRequired: string[];
}

export interface ComplianceRequirement {
  regulation: string;
  requirement: string;
  deadline: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  assignee?: string;
  estimatedEffort: string;
  dependencies: string[];
}

export interface EconomicIndicator {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  impactOnMarket: 'positive' | 'negative' | 'neutral';
  forecastDirection: 'improving' | 'stable' | 'declining';
  sources: string[];
  lastUpdated: Date;
}

export interface MarketInsight {
  id: string;
  category: 'opportunity' | 'threat' | 'trend' | 'competitive' | 'customer';
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  actionability: number; // 0-1 scale
  recommendations: InsightRecommendation[];
  supportingEvidence: Evidence[];
  relatedInsights: string[];
}

export interface InsightRecommendation {
  action: string;
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
  resources: string[];
  expectedOutcome: string;
  riskLevel: 'low' | 'medium' | 'high';
  successMetrics: string[];
}

export interface Evidence {
  type: 'data' | 'research' | 'expert_opinion' | 'case_study' | 'survey';
  source: string;
  description: string;
  reliability: number; // 0-1 scale
  date: Date;
  url?: string;
}

export interface DataSource {
  name: string;
  type: 'primary' | 'secondary' | 'proprietary' | 'public';
  reliability: number; // 0-1 scale
  lastUpdated: Date;
  coverage: string;
  limitations: string[];
  url?: string;
}

export interface CompetitorIntelligence {
  competitorId: string;
  name: string;
  overview: CompetitorOverview;
  products: CompetitorProduct[];
  pricing: CompetitorPricing;
  marketing: CompetitorMarketing;
  technology: CompetitorTechnology;
  financials: CompetitorFinancials;
  strategy: CompetitorStrategy;
  swotAnalysis: SWOTAnalysis;
  recentDevelopments: PlayerActivity[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  lastAnalyzed: Date;
}

export interface CompetitorOverview {
  description: string;
  businessModel: string;
  targetMarkets: string[];
  geographicPresence: string[];
  customerSegments: string[];
  valueProposition: string[];
  keyDifferentiators: string[];
}

export interface CompetitorProduct {
  name: string;
  description: string;
  category: string;
  features: string[];
  targetCustomers: string[];
  pricing?: PricingTier[];
  marketPosition: 'premium' | 'mid_market' | 'budget';
  lifecycle: 'development' | 'launch' | 'growth' | 'mature' | 'decline';
  competitiveAdvantages: string[];
  weaknesses: string[];
}

export interface PricingTier {
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'quarterly' | 'annually' | 'one_time';
  features: string[];
  limitations?: string[];
  targetSegment: string;
}

export interface CompetitorPricing {
  strategy: 'premium' | 'competitive' | 'penetration' | 'skimming' | 'value_based';
  positionVsMarket: 'above' | 'at' | 'below';
  flexibilityLevel: 'rigid' | 'moderate' | 'flexible';
  discountingPractices: string[];
  pricingTransparency: 'transparent' | 'moderate' | 'opaque';
  recentChanges: PricingChange[];
}

export interface PricingChange {
  product: string;
  changeType: 'increase' | 'decrease' | 'restructure' | 'new_tier';
  oldPrice?: number;
  newPrice: number;
  effectiveDate: Date;
  reasoning?: string;
  marketReaction?: string;
}

export interface CompetitorMarketing {
  channels: MarketingChannel[];
  messaging: MarketingMessage[];
  campaigns: MarketingCampaign[];
  digitalPresence: DigitalPresence;
  brandPositioning: BrandPositioning;
  contentStrategy: ContentStrategy;
}

export interface MarketingChannel {
  type: 'digital' | 'traditional' | 'events' | 'partnerships' | 'direct';
  specific: string;
  usage: 'primary' | 'secondary' | 'experimental';
  effectiveness: 'high' | 'medium' | 'low';
  investment: 'heavy' | 'moderate' | 'light';
}

export interface MarketingMessage {
  theme: string;
  targetAudience: string;
  keyPoints: string[];
  tone: string;
  frequency: 'high' | 'medium' | 'low';
  effectiveness: 'high' | 'medium' | 'low';
}

export interface MarketingCampaign {
  name: string;
  objective: string;
  startDate: Date;
  endDate?: Date;
  channels: string[];
  targetAudience: string;
  budget?: number;
  kpis: string[];
  performance?: CampaignPerformance;
}

export interface CampaignPerformance {
  reach: number;
  engagement: number;
  conversions: number;
  cost: number;
  roi: number;
  effectiveness: 'high' | 'medium' | 'low';
}

export interface DigitalPresence {
  website: WebsiteAnalysis;
  socialMedia: SocialMediaPresence[];
  seo: SEOAnalysis;
  contentMarketing: ContentMarketingAnalysis;
  paidAdvertising: PaidAdvertisingAnalysis;
}

export interface WebsiteAnalysis {
  url: string;
  traffic: TrafficMetrics;
  userExperience: UXMetrics;
  contentQuality: ContentQuality;
  conversionOptimization: ConversionAnalysis;
  technicalSEO: TechnicalSEOMetrics;
}

export interface TrafficMetrics {
  monthlyVisitors: number;
  trafficSources: TrafficSource[];
  bounceRate: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  conversionRate: number;
}

export interface TrafficSource {
  source: 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email';
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface UXMetrics {
  pageLoadSpeed: number;
  mobileOptimization: number; // 0-100 score
  navigationClarity: number; // 0-100 score
  designQuality: number; // 0-100 score
  accessibility: number; // 0-100 score
}

export interface ContentQuality {
  relevance: number; // 0-100 score
  freshness: number; // 0-100 score
  depth: number; // 0-100 score
  uniqueness: number; // 0-100 score
  engagement: number; // 0-100 score
}

export interface ConversionAnalysis {
  conversionFunnels: ConversionFunnel[];
  callToActions: CTAAnalysis[];
  formOptimization: FormAnalysis;
  trustSignals: TrustSignal[];
}

export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  overallConversionRate: number;
  dropOffPoints: string[];
  optimizationOpportunities: string[];
}

export interface FunnelStep {
  name: string;
  conversionRate: number;
  dropOffRate: number;
  issues: string[];
}

export interface CTAAnalysis {
  text: string;
  placement: string;
  visibility: number; // 0-100 score
  effectiveness: number; // 0-100 score
  suggestions: string[];
}

export interface FormAnalysis {
  fields: number;
  completion: number;
  abandonment: number;
  optimizations: string[];
}

export interface TrustSignal {
  type: 'testimonial' | 'certification' | 'security' | 'guarantee' | 'social_proof';
  presence: boolean;
  quality: number; // 0-100 score
  placement: string;
}

export interface TechnicalSEOMetrics {
  crawlability: number; // 0-100 score
  indexability: number; // 0-100 score
  siteStructure: number; // 0-100 score
  schemaMarkup: number; // 0-100 score
  pagespeed: number; // 0-100 score
}

export interface SocialMediaPresence {
  platform: string;
  followers: number;
  engagement: number;
  postFrequency: string;
  contentTypes: string[];
  influence: number; // 0-100 score
}

export interface SEOAnalysis {
  organicVisibility: number; // 0-100 score
  keywordRankings: KeywordRanking[];
  backlinks: BacklinkProfile;
  contentGaps: ContentGap[];
  technicalIssues: string[];
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface BacklinkProfile {
  totalBacklinks: number;
  uniqueDomains: number;
  domainAuthority: number;
  quality: number; // 0-100 score
  growthRate: number;
}

export interface ContentGap {
  keyword: string;
  searchVolume: number;
  competitorRanking: number;
  ourRanking?: number;
  opportunity: number; // 0-100 score
}

export interface ContentMarketingAnalysis {
  contentVolume: number;
  contentTypes: string[];
  publishingFrequency: string;
  engagement: ContentEngagement;
  themes: string[];
  qualityScore: number; // 0-100 score
}

export interface ContentEngagement {
  averageShares: number;
  averageComments: number;
  averageLikes: number;
  viralContent: string[];
  topPerformingTopics: string[];
}

export interface PaidAdvertisingAnalysis {
  platforms: AdPlatform[];
  estimatedSpend: number;
  adTypes: string[];
  targeting: TargetingAnalysis;
  creativeAnalysis: CreativeAnalysis;
  performance: AdPerformance;
}

export interface AdPlatform {
  name: string;
  usage: 'heavy' | 'moderate' | 'light';
  adTypes: string[];
  estimatedSpend: number;
}

export interface TargetingAnalysis {
  demographics: string[];
  interests: string[];
  behaviors: string[];
  geography: string[];
  precision: number; // 0-100 score
}

export interface CreativeAnalysis {
  formats: string[];
  messages: string[];
  callToActions: string[];
  visualStyles: string[];
  effectiveness: number; // 0-100 score
}

export interface AdPerformance {
  estimatedCTR: number;
  estimatedCPC: number;
  estimatedCPM: number;
  adFrequency: number;
  competitiveness: 'low' | 'medium' | 'high';
}

export interface BrandPositioning {
  brandPersonality: string[];
  brandValues: string[];
  brandPromise: string;
  brandDifferentiation: string[];
  brandPerception: BrandPerception;
  brandEvolution: BrandEvolution[];
}

export interface BrandPerception {
  attributes: BrandAttribute[];
  sentiment: 'positive' | 'neutral' | 'negative';
  awareness: number; // 0-100 score
  consideration: number; // 0-100 score
  preference: number; // 0-100 score
  loyalty: number; // 0-100 score
}

export interface BrandAttribute {
  attribute: string;
  score: number; // 0-100 score
  comparison: 'above' | 'at' | 'below'; // vs market average
}

export interface BrandEvolution {
  timeframe: string;
  changes: string[];
  reasoning: string;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface ContentStrategy {
  contentPillars: string[];
  contentTypes: string[];
  publishingSchedule: string;
  distributionChannels: string[];
  contentGoals: string[];
  contentMetrics: string[];
  contentQuality: number; // 0-100 score
}

export interface CompetitorTechnology {
  techStack: TechnologyStack;
  innovations: TechInnovation[];
  patents: Patent[];
  rdInvestment: RDInvestment;
  techPartnerships: TechPartnership[];
  digitalMaturity: DigitalMaturity;
}

export interface TechnologyStack {
  frontend: string[];
  backend: string[];
  database: string[];
  infrastructure: string[];
  analytics: string[];
  security: string[];
  aiMl: string[];
}

export interface TechInnovation {
  name: string;
  description: string;
  category: string;
  maturity: 'research' | 'development' | 'testing' | 'deployment' | 'scaled';
  competitiveAdvantage: 'high' | 'medium' | 'low';
  timeline: string;
}

export interface Patent {
  id: string;
  title: string;
  description: string;
  filingDate: Date;
  status: 'pending' | 'granted' | 'expired' | 'abandoned';
  jurisdiction: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface RDInvestment {
  annualSpend: number;
  percentageOfRevenue: number;
  focusAreas: string[];
  teamSize: number;
  facilities: string[];
  partnerships: string[];
}

export interface TechPartnership {
  partner: string;
  type: 'integration' | 'development' | 'research' | 'licensing';
  description: string;
  value: number;
  startDate: Date;
  status: 'active' | 'planned' | 'terminated';
}

export interface DigitalMaturity {
  overallScore: number; // 0-100
  automation: number; // 0-100
  dataAnalytics: number; // 0-100
  customerExperience: number; // 0-100
  operationalEfficiency: number; // 0-100
  innovation: number; // 0-100
}

export interface CompetitorFinancials {
  revenue: RevenueAnalysis;
  profitability: ProfitabilityAnalysis;
  funding: FundingAnalysis;
  valuation: ValuationAnalysis;
  financialHealth: FinancialHealthMetrics;
  growth: GrowthMetrics;
}

export interface RevenueAnalysis {
  totalRevenue: number;
  currency: string;
  year: number;
  revenueStreams: RevenueStream[];
  geographicSplit: GeographicRevenue[];
  seasonality: SeasonalityPattern[];
  growth: RevenueGrowth;
}

export interface RevenueStream {
  source: string;
  amount: number;
  percentage: number;
  growth: number;
  stability: 'stable' | 'growing' | 'declining';
}

export interface GeographicRevenue {
  region: string;
  amount: number;
  percentage: number;
  growth: number;
}

export interface SeasonalityPattern {
  quarter: string;
  percentage: number;
  factors: string[];
}

export interface RevenueGrowth {
  quarterOverQuarter: number;
  yearOverYear: number;
  compoundAnnualGrowthRate: number;
  forecast: RevenueForecast[];
}

export interface RevenueForecast {
  year: number;
  amount: number;
  confidence: number;
  assumptions: string[];
}

export interface ProfitabilityAnalysis {
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  ebitda: number;
  trends: ProfitabilityTrend[];
  benchmarks: ProfitabilityBenchmark[];
}

export interface ProfitabilityTrend {
  metric: string;
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  factors: string[];
}

export interface ProfitabilityBenchmark {
  metric: string;
  value: number;
  industryAverage: number;
  position: 'above' | 'at' | 'below';
}

export interface FundingAnalysis {
  totalFunding: number;
  fundingRounds: FundingRound[];
  investors: Investor[];
  fundingStage: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo' | 'private';
  nextFundingProjected?: Date;
}

export interface FundingRound {
  round: string;
  amount: number;
  date: Date;
  leadInvestor: string;
  participants: string[];
  valuation: number;
  purpose: string;
}

export interface Investor {
  name: string;
  type: 'vc' | 'pe' | 'angel' | 'strategic' | 'government';
  totalInvestment: number;
  influence: 'high' | 'medium' | 'low';
  boardSeat: boolean;
}

export interface ValuationAnalysis {
  currentValuation: number;
  valuationMethod: string;
  valuationMultiples: ValuationMultiple[];
  valuationTrend: 'increasing' | 'stable' | 'decreasing';
  comparableCompanies: ComparableCompany[];
}

export interface ValuationMultiple {
  metric: string;
  multiple: number;
  industryAverage: number;
  comparison: 'premium' | 'discount' | 'in_line';
}

export interface ComparableCompany {
  name: string;
  valuation: number;
  multiple: number;
  similarity: number; // 0-100 score
}

export interface FinancialHealthMetrics {
  cashPosition: number;
  burnRate: number;
  runway: number; // months
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  healthScore: number; // 0-100
}

export interface GrowthMetrics {
  userGrowth: number;
  revenueGrowth: number;
  marketShareGrowth: number;
  geographicExpansion: number;
  productPortfolioGrowth: number;
  teamGrowth: number;
  overallGrowthScore: number; // 0-100
}

export interface CompetitorStrategy {
  businessStrategy: BusinessStrategy;
  marketStrategy: MarketStrategy;
  productStrategy: ProductStrategy;
  competitiveStrategy: CompetitiveStrategy;
  growthStrategy: GrowthStrategy;
  strategicChanges: StrategicChange[];
}

export interface BusinessStrategy {
  vision: string;
  mission: string;
  coreValues: string[];
  strategicPillars: string[];
  businessModel: string;
  revenueModel: string[];
  competitiveAdvantage: string[];
  riskFactors: string[];
}

export interface MarketStrategy {
  targetMarkets: string[];
  marketEntry: MarketEntryStrategy[];
  positioning: string;
  segmentation: string[];
  expansion: MarketExpansionPlan[];
  partnerships: StrategicPartnership[];
}

export interface MarketEntryStrategy {
  market: string;
  approach: 'organic' | 'acquisition' | 'partnership' | 'joint_venture';
  timeline: string;
  investment: number;
  expectedReturn: number;
  risks: string[];
}

export interface MarketExpansionPlan {
  region: string;
  approach: string;
  timeline: string;
  requirements: string[];
  milestones: string[];
  success_metrics: string[];
}

export interface StrategicPartnership {
  partner: string;
  type: string;
  objective: string;
  value: number;
  timeline: string;
  status: string;
}

export interface ProductStrategy {
  productPortfolio: ProductPortfolio;
  innovation: InnovationStrategy;
  lifecycle: ProductLifecycleManagement;
  roadmap: ProductRoadmap[];
  differentiation: ProductDifferentiation;
}

export interface ProductPortfolio {
  coreProducts: string[];
  newProducts: string[];
  sunsettingProducts: string[];
  portfolioBalance: number; // 0-100 score
  synergies: string[];
  gaps: string[];
}

export interface InnovationStrategy {
  approach: 'disruptive' | 'incremental' | 'breakthrough' | 'sustaining';
  focusAreas: string[];
  timeline: string;
  investment: number;
  partnerships: string[];
  metrics: string[];
}

export interface ProductLifecycleManagement {
  development: string[];
  launch: string[];
  growth: string[];
  maturity: string[];
  decline: string[];
  retirement: string[];
}

export interface ProductRoadmap {
  timeframe: string;
  initiatives: RoadmapInitiative[];
  dependencies: string[];
  milestones: string[];
  resources: string[];
}

export interface RoadmapInitiative {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  resources: string[];
  outcomes: string[];
}

export interface ProductDifferentiation {
  features: string[];
  performance: string[];
  service: string[];
  brand: string[];
  cost: string[];
  uniqueness: number; // 0-100 score
}

export interface CompetitiveStrategy {
  positioning: 'cost_leader' | 'differentiator' | 'focus_cost' | 'focus_differentiation';
  competitiveAdvantages: string[];
  defensiveStrategies: string[];
  offensiveStrategies: string[];
  partnerships: string[];
  threats: string[];
}

export interface GrowthStrategy {
  organic: OrganicGrowth;
  inorganic: InorganicGrowth;
  international: InternationalGrowth;
  digital: DigitalGrowth;
  priorities: string[];
}

export interface OrganicGrowth {
  newProducts: string[];
  marketExpansion: string[];
  customerSegments: string[];
  channels: string[];
  capabilities: string[];
}

export interface InorganicGrowth {
  acquisitions: AcquisitionTarget[];
  mergers: string[];
  partnerships: string[];
  licensing: string[];
  investments: string[];
}

export interface AcquisitionTarget {
  company: string;
  rationale: string;
  synergies: string[];
  valuation: number;
  timeline: string;
  risks: string[];
}

export interface InternationalGrowth {
  targetMarkets: string[];
  entryModes: string[];
  timeline: string;
  localization: string[];
  partnerships: string[];
  challenges: string[];
}

export interface DigitalGrowth {
  digitalChannels: string[];
  technologies: string[];
  capabilities: string[];
  investments: string[];
  metrics: string[];
  timeline: string;
}

export interface StrategicChange {
  type: 'pivot' | 'expansion' | 'consolidation' | 'transformation' | 'restructuring';
  description: string;
  reasoning: string;
  timeline: string;
  impact: string[];
  risks: string[];
  success_metrics: string[];
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  strategicMatches: StrategicMatch[];
}

export interface SWOTItem {
  factor: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
  recommendations: string[];
}

export interface StrategicMatch {
  type: 'SO' | 'WO' | 'ST' | 'WT'; // Strengths-Opportunities, etc.
  description: string;
  strategies: string[];
  priority: 'high' | 'medium' | 'low';
}

// Additional missing interfaces for the main platform interface
export interface OpportunityFilters {
  categories: string[];
  marketSize: { min: number; max: number };
  riskLevel: ('low' | 'medium' | 'high')[];
  timeframe: string[];
  regions: string[];
  investmentRange: { min: number; max: number };
}

export interface MarketReportParameters {
  industry: string;
  region: string;
  timeframe: string;
  sections: string[];
  format: 'pdf' | 'html' | 'docx';
  includeBenchmarks: boolean;
  includeForecasts: boolean;
}

export interface MarketReport {
  id: string;
  title: string;
  generatedAt: Date;
  parameters: MarketReportParameters;
  executiveSummary: string;
  sections: ReportSection[];
  appendices: ReportAppendix[];
  metadata: ReportMetadata;
}

export interface ReportSection {
  title: string;
  content: string;
  charts: ReportChart[];
  tables: ReportTable[];
  insights: string[];
}

export interface ReportChart {
  type: string;
  title: string;
  data: unknown;
  insights: string[];
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: unknown[][];
  notes: string[];
}

export interface ReportAppendix {
  title: string;
  content: string;
  type: 'methodology' | 'data_sources' | 'definitions' | 'additional_analysis';
}

export interface ReportMetadata {
  version: string;
  confidenceLevel: number;
  sources: DataSource[];
  limitations: string[];
  nextUpdate: Date;
}

export interface CompetitorActivity {
  competitorId: string;
  activities: PlayerActivity[];
  summary: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  monitoringFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface CompetitivePositioning {
  industry: string;
  positioningMap: PositioningMap;
  competitiveGaps: CompetitiveGap[];
  whitespaceOpportunities: WhitespaceOpportunity[];
  recommendations: PositioningRecommendation[];
}

export interface PositioningMap {
  dimensions: PositioningDimension[];
  players: PositionedPlayer[];
  clusters: PlayerCluster[];
  trends: PositioningTrend[];
}

export interface PositioningDimension {
  name: string;
  description: string;
  scale: 'numeric' | 'categorical';
  range?: { min: number; max: number };
  categories?: string[];
}

export interface PositionedPlayer {
  playerId: string;
  name: string;
  position: Record<string, number | string>;
  movementVector?: Record<string, number>;
  cluster?: string;
}

export interface PlayerCluster {
  name: string;
  description: string;
  players: string[];
  characteristics: string[];
  competitiveIntensity: 'low' | 'medium' | 'high';
}

export interface PositioningTrend {
  dimension: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  drivingFactors: string[];
  implications: string[];
}

export interface CompetitiveGap {
  area: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  difficulty: 'easy' | 'moderate' | 'hard';
  timeToFill: string;
  requiredCapabilities: string[];
}

export interface WhitespaceOpportunity {
  area: string;
  description: string;
  marketSize: number;
  entryBarriers: string[];
  timeToMarket: string;
  competitionRisk: 'low' | 'medium' | 'high';
}

export interface PositioningRecommendation {
  type: 'move' | 'defend' | 'attack' | 'retreat';
  description: string;
  rationale: string;
  requiredActions: string[];
  timeline: string;
  expectedOutcome: string;
}

export interface MarketDisruption {
  id: string;
  name: string;
  description: string;
  type: 'technology' | 'business_model' | 'regulatory' | 'consumer' | 'economic';
  stage: 'emerging' | 'developing' | 'accelerating' | 'mature';
  probability: number; // 0-1 scale
  timeline: string;
  impactAreas: string[];
  affectedPlayers: string[];
  opportunities: string[];
  threats: string[];
  indicators: DisruptionIndicator[];
  scenarios: DisruptionScenario[];
}

export interface DisruptionIndicator {
  metric: string;
  currentValue: number;
  trendDirection: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
  source: string;
}

export interface DisruptionScenario {
  name: string;
  probability: number;
  timeline: string;
  impacts: string[];
  preparationActions: string[];
  riskMitigation: string[];
}

export interface BenchmarkAnalysis {
  industry: string;
  benchmarkDate: Date;
  metrics: BenchmarkMetric[];
  peerGroup: BenchmarkPeer[];
  positionSummary: PositionSummary;
  gapAnalysis: GapAnalysis[];
  improvementOpportunities: ImprovementOpportunity[];
}

export interface BenchmarkMetric {
  name: string;
  description: string;
  unit: string;
  ourValue: number;
  industryAverage: number;
  topQuartile: number;
  bestInClass: number;
  position: 'leading' | 'above_average' | 'average' | 'below_average' | 'lagging';
  trend: 'improving' | 'stable' | 'declining';
}

export interface BenchmarkPeer {
  name: string;
  similarity: number; // 0-100 score
  values: Record<string, number>;
  strengths: string[];
  learnings: string[];
}

export interface PositionSummary {
  overallRanking: number;
  strengthAreas: string[];
  improvementAreas: string[];
  competitiveAdvantages: string[];
  vulnerabilities: string[];
}

export interface GapAnalysis {
  metric: string;
  gap: number;
  gapType: 'performance' | 'capability' | 'resource';
  priority: 'high' | 'medium' | 'low';
  closureTime: string;
  requiredActions: string[];
  estimatedCost: number;
}

export interface ImprovementOpportunity {
  area: string;
  description: string;
  potentialGain: number;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  riskFactors: string[];
  successMetrics: string[];
}

export interface OpportunityAlert {
  id: string;
  type: 'new_opportunity' | 'opportunity_change' | 'threat_to_opportunity' | 'deadline_approaching';
  title: string;
  description: string;
  opportunity: MarketOpportunity;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expirationDate?: Date;
  recommendedActions: string[];
  createdAt: Date;
}

export interface FeasibilityAssessment {
  opportunityId: string;
  overallFeasibility: number; // 0-100 score
  technicalFeasibility: FeasibilityDimension;
  marketFeasibility: FeasibilityDimension;
  financialFeasibility: FeasibilityDimension;
  strategicFeasibility: FeasibilityDimension;
  operationalFeasibility: FeasibilityDimension;
  riskAssessment: OpportunityRiskAssessment;
  recommendations: FeasibilityRecommendation[];
  nextSteps: string[];
}

export interface FeasibilityDimension {
  score: number; // 0-100
  factors: FeasibilityFactor[];
  risks: string[];
  requirements: string[];
  confidence: number; // 0-100
}

export interface FeasibilityFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
  evidence: string[];
}

export interface OpportunityRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: OpportunityRiskFactor[];
  mitigationStrategies: RiskMitigation[];
  contingencyPlans: ContingencyPlan[];
}

export interface OpportunityRiskFactor {
  category: 'market' | 'technology' | 'financial' | 'competitive' | 'regulatory' | 'operational';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // probability * impact
  indicators: string[];
  triggers: string[];
}

export interface RiskMitigation {
  riskFactor: string;
  strategy: string;
  actions: string[];
  timeline: string;
  cost: number;
  effectiveness: number; // 0-1
}

export interface ContingencyPlan {
  scenario: string;
  triggers: string[];
  actions: string[];
  resources: string[];
  timeline: string;
  successCriteria: string[];
}

export interface FeasibilityRecommendation {
  type: 'proceed' | 'proceed_with_conditions' | 'defer' | 'abandon';
  reasoning: string;
  conditions?: string[];
  timeline?: string;
  requiredActions: string[];
  successProbability: number; // 0-1
}

export interface OpportunityRanking {
  opportunities: RankedOpportunity[];
  rankingCriteria: RankingCriterion[];
  methodology: string;
  confidence: number; // 0-100
  recommendations: RankingRecommendation[];
  lastUpdated: Date;
}

export interface RankedOpportunity {
  opportunity: MarketOpportunity;
  rank: number;
  totalScore: number;
  scores: Record<string, number>;
  rationale: string;
  nextActions: string[];
}

export interface RankingCriterion {
  name: string;
  description: string;
  weight: number; // 0-1
  scale: 'linear' | 'logarithmic' | 'exponential';
  direction: 'higher_better' | 'lower_better';
}

export interface RankingRecommendation {
  priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  opportunities: string[];
  rationale: string;
  resourceAllocation: string[];
  timeline: string;
  expectedOutcomes: string[];
}
