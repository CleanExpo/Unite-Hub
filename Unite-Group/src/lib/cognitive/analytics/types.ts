/**
 * Cognitive Business Intelligence - Advanced Analytics Types
 * Unite Group - Version 14.0 Phase 2 Implementation
 */

export interface CognitiveBIFramework {
  // Predictive Business Analytics
  generateRevenueForecasting(data: BusinessData): Promise<RevenueForecast>;
  analyzeCustomerLifetime(customers: CustomerData[]): Promise<CustomerLifetimeAnalysis>;
  predictChurnRisk(customerData: CustomerData): Promise<ChurnPrediction>;
  identifyMarketOpportunities(marketData: MarketData): Promise<MarketOpportunity[]>;
  generateBusinessInsights(data: ComprehensiveBusinessData): Promise<BusinessInsight[]>;
  
  // Autonomous Customer Experience
  optimizeCustomerJourney(journeyData: CustomerJourneyData): Promise<JourneyOptimization>;
  providePredictiveSupport(customerContext: CustomerContext): Promise<PredictiveSupport>;
  personalizeDynamicExperience(userProfile: UserProfile): Promise<PersonalizedExperience>;
  optimizePricing(pricingContext: PricingContext): Promise<PricingOptimization>;
  
  // Advanced Financial Intelligence
  generateFinancialForecasting(financialData: FinancialData): Promise<FinancialForecast>;
  optimizeCosts(operationalData: OperationalData): Promise<CostOptimization>;
  analyzeInvestmentOpportunities(investmentData: InvestmentData): Promise<InvestmentAnalysis>;
  assessFinancialRisks(financialProfile: FinancialProfile): Promise<FinancialRiskAssessment>;
}

// Core Analytics Types
export interface BusinessData {
  revenue: RevenueData[];
  customers: CustomerMetrics[];
  products: ProductMetrics[];
  market: MarketMetrics[];
  operations: OperationalMetrics[];
  timeRange: DateRange;
  segments: BusinessSegment[];
}

export interface RevenueData {
  timestamp: Date;
  amount: number;
  source: RevenueSource;
  segment: string;
  recurring: boolean;
  customer: string;
  product: string;
  region: string;
}

export type RevenueSource = 
  | 'subscription'
  | 'one_time'
  | 'consulting'
  | 'partnerships'
  | 'licensing'
  | 'marketplace';

export interface CustomerMetrics {
  customerId: string;
  acquisitionDate: Date;
  totalRevenue: number;
  monthlyRevenue: number;
  churnRisk: number;
  engagementScore: number;
  supportTickets: number;
  satisfaction: number;
  segment: CustomerSegment;
  lifecycle: CustomerLifecycleStage;
}

export type CustomerSegment = 
  | 'enterprise'
  | 'mid_market'
  | 'small_business'
  | 'startup'
  | 'individual';

export type CustomerLifecycleStage = 
  | 'prospect'
  | 'trial'
  | 'onboarding'
  | 'active'
  | 'growth'
  | 'at_risk'
  | 'churned';

export interface ProductMetrics {
  productId: string;
  name: string;
  revenue: number;
  users: number;
  growth: number;
  churn: number;
  satisfaction: number;
  features: FeatureMetrics[];
}

export interface FeatureMetrics {
  featureId: string;
  name: string;
  adoption: number;
  engagement: number;
  revenue_impact: number;
}

export interface MarketMetrics {
  segment: string;
  size: number;
  growth: number;
  competition: number;
  opportunity: number;
  trends: MarketTrend[];
}

export interface MarketTrend {
  trend: string;
  impact: TrendImpact;
  confidence: number;
  timeframe: string;
}

export type TrendImpact = 'positive' | 'negative' | 'neutral' | 'disruptive';

export interface OperationalMetrics {
  efficiency: number;
  costs: OperationalCost[];
  performance: PerformanceMetric[];
  quality: QualityMetric[];
}

export interface OperationalCost {
  category: CostCategory;
  amount: number;
  trend: TrendDirection;
  optimization_potential: number;
}

export type CostCategory = 
  | 'infrastructure'
  | 'personnel'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'development'
  | 'support';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export interface PerformanceMetric {
  metric: string;
  value: number;
  target: number;
  trend: TrendDirection;
}

export interface QualityMetric {
  metric: string;
  score: number;
  benchmark: number;
  improvement_areas: string[];
}

export interface DateRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface BusinessSegment {
  name: string;
  revenue_share: number;
  growth_rate: number;
  profitability: number;
  strategic_importance: SegmentImportance;
}

export type SegmentImportance = 'low' | 'medium' | 'high' | 'critical';

// Revenue Forecasting Types
export interface RevenueForecast {
  id: string;
  timestamp: Date;
  timeframe: ForecastTimeframe;
  predictions: RevenuePrediction[];
  confidence: number;
  accuracy_metrics: AccuracyMetrics;
  scenarios: ForecastScenario[];
  drivers: RevenueDriver[];
  recommendations: ForecastRecommendation[];
}

export interface ForecastTimeframe {
  start: Date;
  end: Date;
  intervals: ForecastInterval[];
}

export interface ForecastInterval {
  period: Date;
  predicted_revenue: number;
  confidence_interval: ConfidenceInterval;
  contributing_factors: string[];
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence_level: number;
}

export interface RevenuePrediction {
  segment: string;
  amount: number;
  growth_rate: number;
  confidence: number;
  key_factors: string[];
}

export interface AccuracyMetrics {
  historical_accuracy: number;
  mean_absolute_error: number;
  root_mean_square_error: number;
  directional_accuracy: number;
}

export interface ForecastScenario {
  name: string;
  probability: number;
  revenue_impact: number;
  description: string;
  key_assumptions: string[];
}

export interface RevenueDriver {
  factor: string;
  impact: number;
  confidence: number;
  category: DriverCategory;
  trend: TrendDirection;
}

export type DriverCategory = 
  | 'market'
  | 'product'
  | 'customer'
  | 'competitive'
  | 'economic'
  | 'operational';

export interface ForecastRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  description: string;
  expected_impact: number;
  implementation_effort: ImplementationEffort;
  timeframe: string;
}

export type RecommendationType = 
  | 'optimization'
  | 'investment'
  | 'risk_mitigation'
  | 'market_expansion'
  | 'product_development'
  | 'operational_efficiency';

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export type ImplementationEffort = 'minimal' | 'moderate' | 'significant' | 'major';

// Customer Analytics Types
export interface CustomerData {
  customerId: string;
  profile: CustomerProfile;
  behavior: CustomerBehavior;
  transactions: TransactionHistory[];
  interactions: CustomerInteraction[];
  support: SupportHistory;
  preferences: CustomerPreferences;
}

export interface CustomerProfile {
  demographics: Demographics;
  firmographics?: Firmographics;
  psychographics: Psychographics;
  technographics: Technographics;
}

export interface Demographics {
  age?: number;
  gender?: string;
  location: Location;
  income_range?: IncomeRange;
  education?: EducationLevel;
}

export interface Location {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export type IncomeRange = 
  | 'under_25k'
  | '25k_50k'
  | '50k_75k'
  | '75k_100k'
  | '100k_150k'
  | '150k_250k'
  | 'over_250k';

export type EducationLevel = 
  | 'high_school'
  | 'some_college'
  | 'bachelors'
  | 'masters'
  | 'doctorate'
  | 'professional';

export interface Firmographics {
  company_size: CompanySize;
  industry: Industry;
  revenue: CompanyRevenue;
  growth_stage: GrowthStage;
  technology_adoption: TechAdoption;
}

export type CompanySize = 
  | 'startup'
  | 'small'
  | 'medium'
  | 'large'
  | 'enterprise';

export type Industry = 
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'retail'
  | 'manufacturing'
  | 'education'
  | 'government'
  | 'other';

export type CompanyRevenue = 
  | 'under_1m'
  | '1m_10m'
  | '10m_50m'
  | '50m_100m'
  | '100m_500m'
  | 'over_500m';

export type GrowthStage = 
  | 'seed'
  | 'early'
  | 'growth'
  | 'mature'
  | 'decline';

export type TechAdoption = 'early' | 'mainstream' | 'late' | 'laggard';

export interface Psychographics {
  values: string[];
  interests: string[];
  lifestyle: string[];
  personality_traits: PersonalityTrait[];
}

export interface PersonalityTrait {
  trait: string;
  score: number;
  confidence: number;
}

export interface Technographics {
  devices: DeviceUsage[];
  platforms: PlatformUsage[];
  software_preferences: SoftwarePreference[];
  adoption_behavior: AdoptionBehavior;
}

export interface DeviceUsage {
  device_type: DeviceType;
  usage_frequency: UsageFrequency;
  primary: boolean;
}

export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'smart_tv' | 'iot';

export type UsageFrequency = 'never' | 'rarely' | 'sometimes' | 'often' | 'always';

export interface PlatformUsage {
  platform: string;
  engagement_level: EngagementLevel;
  influence: InfluenceLevel;
}

export type EngagementLevel = 'passive' | 'active' | 'power_user' | 'advocate';

export type InfluenceLevel = 'follower' | 'participant' | 'influencer' | 'thought_leader';

export interface SoftwarePreference {
  category: SoftwareCategory;
  preferences: string[];
  switching_cost: SwitchingCost;
}

export type SoftwareCategory = 
  | 'productivity'
  | 'communication'
  | 'development'
  | 'design'
  | 'analytics'
  | 'security';

export type SwitchingCost = 'low' | 'medium' | 'high' | 'very_high';

export interface AdoptionBehavior {
  innovation_adoption: InnovationAdoption;
  decision_speed: DecisionSpeed;
  risk_tolerance: RiskTolerance;
  influence_factors: InfluenceFactor[];
}

export type InnovationAdoption = 'innovator' | 'early_adopter' | 'early_majority' | 'late_majority' | 'laggard';

export type DecisionSpeed = 'impulsive' | 'quick' | 'deliberate' | 'slow';

export type RiskTolerance = 'risk_averse' | 'cautious' | 'moderate' | 'risk_taking';

export interface InfluenceFactor {
  factor: string;
  weight: number;
  category: InfluenceCategory;
}

export type InfluenceCategory = 'social' | 'economic' | 'functional' | 'emotional' | 'situational';

export interface CustomerBehavior {
  engagement: EngagementBehavior;
  usage: UsageBehavior;
  purchasing: PurchasingBehavior;
  communication: CommunicationBehavior;
}

export interface EngagementBehavior {
  frequency: EngagementFrequency;
  duration: EngagementDuration;
  depth: EngagementDepth;
  patterns: EngagementPattern[];
}

export interface EngagementFrequency {
  daily_sessions: number;
  weekly_sessions: number;
  monthly_sessions: number;
  trend: TrendDirection;
}

export interface EngagementDuration {
  average_session: number;
  total_time: number;
  peak_times: TimeOfDay[];
}

export type TimeOfDay = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface EngagementDepth {
  pages_per_session: number;
  feature_adoption: FeatureAdoption[];
  content_consumption: ContentConsumption;
}

export interface FeatureAdoption {
  feature: string;
  adoption_date: Date;
  usage_frequency: UsageFrequency;
  proficiency: ProficiencyLevel;
}

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ContentConsumption {
  content_types: ContentType[];
  consumption_rate: number;
  preferences: ContentPreference[];
}

export type ContentType = 'articles' | 'videos' | 'tutorials' | 'webinars' | 'documentation';

export interface ContentPreference {
  type: ContentType;
  topics: string[];
  format: string[];
  difficulty: DifficultyLevel;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface EngagementPattern {
  pattern_type: PatternType;
  description: string;
  frequency: number;
  predictability: number;
}

export type PatternType = 'temporal' | 'behavioral' | 'contextual' | 'seasonal';

export interface UsageBehavior {
  feature_usage: FeatureUsageMetrics[];
  workflow_patterns: WorkflowPattern[];
  efficiency_metrics: EfficiencyMetrics;
}

export interface FeatureUsageMetrics {
  feature: string;
  usage_count: number;
  time_spent: number;
  success_rate: number;
  error_rate: number;
}

export interface WorkflowPattern {
  workflow: string;
  frequency: number;
  efficiency: number;
  pain_points: PainPoint[];
}

export interface PainPoint {
  area: string;
  severity: PainPointSeverity;
  frequency: number;
  impact: PainPointImpact;
}

export type PainPointSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface PainPointImpact {
  productivity: number;
  satisfaction: number;
  retention_risk: number;
}

export interface EfficiencyMetrics {
  task_completion_rate: number;
  average_task_time: number;
  error_recovery_time: number;
  help_seeking_frequency: number;
}

export interface PurchasingBehavior {
  decision_journey: DecisionJourney;
  spending_patterns: SpendingPattern[];
  price_sensitivity: PriceSensitivity;
  loyalty_indicators: LoyaltyIndicator[];
}

export interface DecisionJourney {
  touchpoints: Touchpoint[];
  decision_factors: DecisionFactor[];
  influencers: Influencer[];
  timeline: DecisionTimeline;
}

export interface Touchpoint {
  channel: TouchpointChannel;
  timestamp: Date;
  interaction_type: InteractionType;
  influence_score: number;
}

export type TouchpointChannel = 
  | 'website'
  | 'email'
  | 'social_media'
  | 'search'
  | 'referral'
  | 'direct'
  | 'advertisement'
  | 'event';

export type InteractionType = 
  | 'awareness'
  | 'consideration'
  | 'evaluation'
  | 'purchase'
  | 'support'
  | 'advocacy';

export interface DecisionFactor {
  factor: string;
  importance: number;
  satisfaction: number;
  category: DecisionFactorCategory;
}

export type DecisionFactorCategory = 
  | 'functional'
  | 'emotional'
  | 'social'
  | 'economic'
  | 'convenience';

export interface Influencer {
  type: InfluencerType;
  influence_level: InfluenceLevel;
  relationship: RelationshipType;
}

export type InfluencerType = 
  | 'colleague'
  | 'industry_expert'
  | 'thought_leader'
  | 'peer'
  | 'customer_success'
  | 'sales_rep';

export type RelationshipType = 'direct' | 'indirect' | 'social' | 'professional';

export interface DecisionTimeline {
  awareness_to_consideration: number;
  consideration_to_evaluation: number;
  evaluation_to_purchase: number;
  total_cycle_time: number;
}

export interface SpendingPattern {
  category: SpendingCategory;
  amount: number;
  frequency: PurchaseFrequency;
  seasonality: Seasonality;
}

export type SpendingCategory = 
  | 'core_subscription'
  | 'add_ons'
  | 'professional_services'
  | 'training'
  | 'support';

export type PurchaseFrequency = 
  | 'one_time'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'irregular';

export interface Seasonality {
  seasonal: boolean;
  peak_periods: string[];
  low_periods: string[];
  variation_factor: number;
}

export interface PriceSensitivity {
  elasticity: number;
  value_perception: ValuePerception;
  willingness_to_pay: WillingnessToPayRange;
  discount_responsiveness: DiscountResponsiveness;
}

export interface ValuePerception {
  perceived_value: number;
  value_drivers: ValueDriver[];
  value_barriers: ValueBarrier[];
}

export interface ValueDriver {
  driver: string;
  impact: number;
  importance: number;
}

export interface ValueBarrier {
  barrier: string;
  severity: number;
  frequency: number;
}

export interface WillingnessToPayRange {
  minimum: number;
  optimal: number;
  maximum: number;
  confidence: number;
}

export interface DiscountResponsiveness {
  threshold: number;
  elasticity: number;
  preferred_types: DiscountType[];
}

export type DiscountType = 
  | 'percentage'
  | 'fixed_amount'
  | 'bundled'
  | 'loyalty'
  | 'volume'
  | 'early_bird';

export interface LoyaltyIndicator {
  indicator: string;
  score: number;
  trend: TrendDirection;
  benchmark: number;
}

export interface CommunicationBehavior {
  preferences: CommunicationPreferences;
  responsiveness: Responsiveness;
  feedback_patterns: FeedbackPattern[];
}

export interface CommunicationPreferences {
  channels: PreferredChannel[];
  frequency: CommunicationFrequency;
  timing: PreferredTiming;
  content_style: ContentStyle;
}

export interface PreferredChannel {
  channel: CommunicationChannel;
  preference_score: number;
  context: CommunicationContext[];
}

export type CommunicationChannel = 
  | 'email'
  | 'phone'
  | 'chat'
  | 'sms'
  | 'push_notification'
  | 'in_app'
  | 'social_media';

export type CommunicationContext = 
  | 'marketing'
  | 'support'
  | 'product_updates'
  | 'billing'
  | 'emergency'
  | 'educational';

export interface CommunicationFrequency {
  preferred_frequency: FrequencyPreference;
  tolerance: FrequencyTolerance;
  fatigue_threshold: number;
}

export type FrequencyPreference = 'minimal' | 'low' | 'moderate' | 'high' | 'very_high';

export interface FrequencyTolerance {
  marketing: number;
  product: number;
  support: number;
  administrative: number;
}

export interface PreferredTiming {
  days_of_week: DayOfWeek[];
  times_of_day: TimeOfDay[];
  timezone: string;
  seasonal_preferences: SeasonalPreference[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface SeasonalPreference {
  season: Season;
  preference_change: number;
  reasons: string[];
}

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface ContentStyle {
  tone: CommunicationTone;
  complexity: ComplexityLevel;
  length: LengthPreference;
  format: ContentFormat[];
}

export type CommunicationTone = 'formal' | 'casual' | 'friendly' | 'professional' | 'technical';

export type ComplexityLevel = 'simple' | 'moderate' | 'detailed' | 'comprehensive';

export type LengthPreference = 'brief' | 'moderate' | 'detailed' | 'comprehensive';

export type ContentFormat = 'text' | 'html' | 'video' | 'audio' | 'interactive' | 'infographic';

export interface Responsiveness {
  response_rate: number;
  response_time: ResponseTime;
  engagement_level: ResponseEngagement;
}

export interface ResponseTime {
  immediate: number;
  within_hour: number;
  within_day: number;
  within_week: number;
  never: number;
}

export interface ResponseEngagement {
  opens: number;
  clicks: number;
  replies: number;
  forwards: number;
  conversions: number;
}

export interface FeedbackPattern {
  feedback_type: FeedbackType;
  frequency: number;
  sentiment: SentimentDistribution;
  topics: FeedbackTopic[];
}

export type FeedbackType = 'positive' | 'negative' | 'suggestion' | 'question' | 'complaint';

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
}

export interface FeedbackTopic {
  topic: string;
  frequency: number;
  sentiment: number;
  importance: number;
}

// Additional supporting types
export interface TransactionHistory {
  transactionId: string;
  date: Date;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  products: ProductPurchase[];
  payment_method: PaymentMethod;
}

export type TransactionType = 'purchase' | 'refund' | 'upgrade' | 'downgrade' | 'renewal';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled' | 'refunded';

export interface ProductPurchase {
  product: string;
  quantity: number;
  price: number;
  discount: number;
}

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'invoice';

export interface CustomerInteraction {
  interactionId: string;
  timestamp: Date;
  channel: CommunicationChannel;
  type: InteractionType;
  duration: number;
  outcome: InteractionOutcome;
  satisfaction: number;
  notes: string;
}

export type InteractionOutcome = 'resolved' | 'escalated' | 'pending' | 'cancelled' | 'follow_up_required';

export interface SupportHistory {
  tickets: SupportTicket[];
  satisfaction_scores: SatisfactionScore[];
  resolution_metrics: ResolutionMetrics;
}

export interface SupportTicket {
  ticketId: string;
  created: Date;
  resolved?: Date;
  category: SupportCategory;
  priority: SupportPriority;
  status: TicketStatus;
  resolution_time: number;
  satisfaction: number;
}

export type SupportCategory = 
  | 'technical'
  | 'billing'
  | 'feature_request'
  | 'bug_report'
  | 'account'
  | 'training'
  | 'general';

export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface SatisfactionScore {
  date: Date;
  score: number;
  category: string;
  feedback: string;
}

export interface ResolutionMetrics {
  average_resolution_time: number;
  first_contact_resolution: number;
  escalation_rate: number;
  satisfaction_average: number;
}

export interface CustomerPreferences {
  product_preferences: ProductPreference[];
  feature_preferences: FeaturePreference[];
  service_preferences: ServicePreference[];
  communication_preferences: CommunicationPreferences;
}

export interface ProductPreference {
  category: string;
  preferences: string[];
  weights: number[];
  last_updated: Date;
}

export interface FeaturePreference {
  feature: string;
  preference_level: PreferenceLevel;
  usage_frequency: UsageFrequency;
  importance: number;
}

export type PreferenceLevel = 'dislike' | 'neutral' | 'like' | 'love' | 'essential';

export interface ServicePreference {
  service_type: ServiceType;
  delivery_preference: DeliveryPreference;
  timing_preference: TimingPreference;
  quality_expectations: QualityExpectation[];
}

export type ServiceType = 
  | 'self_service'
  | 'assisted_service'
  | 'managed_service'
  | 'premium_service'
  | 'enterprise_service';

export type DeliveryPreference = 'online' | 'phone' | 'in_person' | 'hybrid' | 'automated';

export interface TimingPreference {
  urgency: UrgencyLevel;
  availability: AvailabilityWindow[];
  scheduling_flexibility: SchedulingFlexibility;
}

export type UrgencyLevel = 'immediate' | 'same_day' | 'within_week' | 'flexible' | 'scheduled';

export interface AvailabilityWindow {
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  timezone: string;
}

export type SchedulingFlexibility = 'rigid' | 'somewhat_flexible' | 'flexible' | 'very_flexible';

export interface QualityExpectation {
  dimension: QualityDimension;
  expectation_level: ExpectationLevel;
  importance: number;
}

export type QualityDimension = 
  | 'accuracy'
  | 'completeness'
  | 'timeliness'
  | 'professionalism'
  | 'expertise'
  | 'empathy';

export type ExpectationLevel = 'basic' | 'standard' | 'high' | 'exceptional' | 'world_class';

// Customer Lifetime Analytics
export interface CustomerLifetimeAnalysis {
  id: string;
  timestamp: Date;
  segment_analysis: SegmentLifetimeAnalysis[];
  cohort_analysis: CohortAnalysis[];
  predictive_metrics: PredictiveLifetimeMetrics;
  value_optimization: ValueOptimization;
  churn_insights: ChurnInsights;
}

export interface SegmentLifetimeAnalysis {
  segment: CustomerSegment;
  customer_count: number;
  average_lifetime_value: number;
  median_lifetime_value: number;
  lifetime_distribution: LifetimeDistribution;
  value_drivers: ValueDriver[];
  retention_rates: RetentionRate[];
}

export interface LifetimeDistribution {
  percentiles: LifetimePercentile[];
  quartiles: LifetimeQuartile;
  outliers: LifetimeOutlier[];
}

export interface LifetimePercentile {
  percentile: number;
  value: number;
}

export interface LifetimeQuartile {
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
}

export interface LifetimeOutlier {
  customer_id: string;
  lifetime_value: number;
  characteristics: string[];
}

export interface RetentionRate {
  period: number;
  rate: number;
  confidence_interval: ConfidenceInterval;
}

export interface CohortAnalysis {
  cohort_definition: CohortDefinition;
  cohort_size: number;
  retention_matrix: RetentionMatrix;
  revenue_matrix: RevenueMatrix;
  behavior_evolution: BehaviorEvolution;
}

export interface CohortDefinition {
  type: CohortType;
  period: Date;
  criteria: CohortCriteria[];
}

export type CohortType = 'acquisition' | 'behavioral' | 'revenue' | 'product' | 'channel';

export interface CohortCriteria {
  dimension: string;
  value: string;
  operator: ComparisonOperator;
}

export type ComparisonOperator = 'equals' | 'greater_than' | 'less
