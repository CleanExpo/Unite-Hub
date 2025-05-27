/**
 * Next-Generation Innovation Framework - Advanced Types
 * Unite Group - Version 14.0 Phase 3 Implementation
 */

export interface InnovationFramework {
  // Autonomous Innovation Pipeline
  detectInnovationOpportunities(context: InnovationContext): Promise<InnovationOpportunity[]>;
  generateInnovationConcepts(opportunity: InnovationOpportunity): Promise<InnovationConcept>;
  validateInnovationFeasibility(concept: InnovationConcept): Promise<FeasibilityAssessment>;
  developInnovationPrototype(concept: InnovationConcept): Promise<PrototypeResult>;
  orchestrateInnovationExecution(prototype: PrototypeResult): Promise<ExecutionPlan>;
  
  // Advanced Ecosystem Intelligence
  analyzeEcosystemTrends(ecosystem: EcosystemData): Promise<TrendAnalysis>;
  identifyDisruptiveForces(market: MarketIntelligence): Promise<DisruptiveForce[]>;
  mapInnovationNetworks(connections: NetworkData): Promise<InnovationNetwork>;
  predictTechnologyEvolution(techData: TechnologyData): Promise<TechnologyForecast>;
  assessCompetitiveInnovation(competitive: CompetitiveData): Promise<CompetitiveInnovationAnalysis>;
  
  // Autonomous Research & Development
  generateResearchHypotheses(domain: ResearchDomain): Promise<ResearchHypothesis[]>;
  conductVirtualExperiments(hypothesis: ResearchHypothesis): Promise<ExperimentResult>;
  synthesizeKnowledgeGraphs(knowledge: KnowledgeBase): Promise<KnowledgeGraph>;
  identifyPatentOpportunities(innovation: InnovationConcept): Promise<PatentAnalysis>;
  
  // Next-Generation Capabilities
  simulateInnovationImpact(innovation: InnovationConcept): Promise<ImpactSimulation>;
  optimizeInnovationPortfolio(portfolio: InnovationPortfolio): Promise<PortfolioOptimization>;
  orchestrateCollaborativeInnovation(collaboration: CollaborationRequest): Promise<CollaborationPlan>;
  generateFutureScenarios(parameters: ScenarioParameters): Promise<FutureScenario[]>;
}

// Core Innovation Types
export interface InnovationContext {
  organization: OrganizationProfile;
  market_position: MarketPosition;
  resources: ResourceInventory;
  constraints: InnovationConstraint[];
  objectives: InnovationObjective[];
  timeline: InnovationTimeline;
  risk_tolerance: RiskProfile;
}

export interface OrganizationProfile {
  industry: Industry;
  size: OrganizationSize;
  maturity: OrganizationMaturity;
  culture: InnovationCulture;
  capabilities: CoreCapability[];
  strategic_focus: StrategicFocus[];
  innovation_history: InnovationHistory;
}

export type Industry = 
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'manufacturing'
  | 'retail'
  | 'energy'
  | 'education'
  | 'government'
  | 'agriculture'
  | 'transportation';

export type OrganizationSize = 'startup' | 'scale_up' | 'sme' | 'large_enterprise' | 'multinational';

export type OrganizationMaturity = 'emerging' | 'developing' | 'mature' | 'transforming' | 'declining';

export interface InnovationCulture {
  risk_appetite: 'conservative' | 'moderate' | 'aggressive' | 'disruptive';
  collaboration_style: 'hierarchical' | 'collaborative' | 'networked' | 'autonomous';
  innovation_pace: 'slow' | 'steady' | 'rapid' | 'breakthrough';
  external_openness: 'closed' | 'selective' | 'open' | 'ecosystem_driven';
}

export interface CoreCapability {
  domain: CapabilityDomain;
  level: CapabilityLevel;
  strategic_importance: StrategicImportance;
  development_potential: DevelopmentPotential;
}

export type CapabilityDomain = 
  | 'technology'
  | 'product_development'
  | 'market_access'
  | 'operations'
  | 'data_analytics'
  | 'customer_experience'
  | 'partnerships'
  | 'talent';

export type CapabilityLevel = 'basic' | 'intermediate' | 'advanced' | 'world_class' | 'market_leading';

export type StrategicImportance = 'low' | 'medium' | 'high' | 'critical' | 'differentiating';

export interface DevelopmentPotential {
  current_gap: number;
  improvement_opportunity: number;
  development_difficulty: DifficultyLevel;
  timeline_to_target: TimeHorizon;
}

export type DifficultyLevel = 'trivial' | 'easy' | 'moderate' | 'challenging' | 'transformational';

export type TimeHorizon = 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'visionary';

export interface StrategicFocus {
  area: FocusArea;
  priority: Priority;
  investment_level: InvestmentLevel;
  success_metrics: SuccessMetric[];
}

export type FocusArea = 
  | 'digital_transformation'
  | 'sustainability'
  | 'customer_centricity'
  | 'operational_excellence'
  | 'innovation_leadership'
  | 'market_expansion'
  | 'ecosystem_building';

export type Priority = 'low' | 'medium' | 'high' | 'critical' | 'transformational';

export type InvestmentLevel = 'minimal' | 'moderate' | 'significant' | 'major' | 'bet_the_company';

export interface SuccessMetric {
  metric: string;
  target_value: number;
  measurement_frequency: MeasurementFrequency;
  responsibility: string;
}

export type MeasurementFrequency = 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';

export interface InnovationHistory {
  past_innovations: PastInnovation[];
  success_patterns: SuccessPattern[];
  failure_patterns: FailurePattern[];
  learning_insights: LearningInsight[];
}

export interface PastInnovation {
  name: string;
  type: InnovationType;
  outcome: InnovationOutcome;
  impact: ImpactLevel;
  lessons_learned: string[];
  key_factors: KeyFactor[];
}

export type InnovationType = 
  | 'incremental'
  | 'radical'
  | 'disruptive'
  | 'architectural'
  | 'component'
  | 'business_model'
  | 'process'
  | 'service';

export type InnovationOutcome = 'success' | 'partial_success' | 'failure' | 'pivot' | 'discontinued';

export type ImpactLevel = 'minimal' | 'moderate' | 'significant' | 'transformational' | 'paradigm_shifting';

export interface KeyFactor {
  factor: string;
  influence: InfluenceType;
  strength: number;
  controllability: Controllability;
}

export type InfluenceType = 'positive' | 'negative' | 'neutral' | 'contextual';

export type Controllability = 'fully_controllable' | 'partially_controllable' | 'influenceable' | 'uncontrollable';

export interface SuccessPattern {
  pattern_name: string;
  description: string;
  conditions: PatternCondition[];
  frequency: number;
  reliability: number;
}

export interface PatternCondition {
  condition: string;
  importance: number;
  variability: number;
}

export interface FailurePattern {
  pattern_name: string;
  description: string;
  warning_signs: WarningSSign[];
  mitigation_strategies: string[];
}

export interface WarningSSign {
  sign: string;
  lead_time: number;
  reliability: number;
}

export interface LearningInsight {
  insight: string;
  confidence: number;
  applicability: ApplicabilityScope;
  actionability: ActionabilityLevel;
}

export type ApplicabilityScope = 'specific' | 'category' | 'organizational' | 'industry' | 'universal';

export type ActionabilityLevel = 'principle' | 'guideline' | 'process' | 'tool' | 'metric';

export interface MarketPosition {
  competitive_position: CompetitivePosition;
  market_share: MarketShare;
  brand_strength: BrandStrength;
  customer_loyalty: CustomerLoyalty;
  innovation_reputation: InnovationReputation;
}

export interface CompetitivePosition {
  overall_ranking: number;
  position_trend: TrendDirection;
  competitive_advantages: CompetitiveAdvantage[];
  competitive_vulnerabilities: CompetitiveVulnerability[];
}

export type TrendDirection = 'declining' | 'stable' | 'improving' | 'accelerating';

export interface CompetitiveAdvantage {
  advantage: string;
  strength: AdvantageStrength;
  sustainability: SustainabilityLevel;
  source: AdvantageSource;
}

export type AdvantageStrength = 'weak' | 'moderate' | 'strong' | 'dominant' | 'monopolistic';

export type SustainabilityLevel = 'temporary' | 'short_term' | 'medium_term' | 'long_term' | 'structural';

export type AdvantageSource = 'cost' | 'differentiation' | 'focus' | 'innovation' | 'network_effects' | 'switching_costs';

export interface CompetitiveVulnerability {
  vulnerability: string;
  severity: VulnerabilitySeverity;
  likelihood: VulnerabilityLikelihood;
  mitigation_difficulty: MitigationDifficulty;
}

export type VulnerabilitySeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'existential';

export type VulnerabilityLikelihood = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type MitigationDifficulty = 'easy' | 'moderate' | 'difficult' | 'very_difficult' | 'impossible';

export interface MarketShare {
  current_share: number;
  share_trend: TrendDirection;
  share_volatility: VolatilityLevel;
  target_markets: TargetMarket[];
}

export type VolatilityLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface TargetMarket {
  segment: string;
  share: number;
  growth_rate: number;
  strategic_importance: StrategicImportance;
}

export interface BrandStrength {
  brand_awareness: AwarenessLevel;
  brand_perception: PerceptionRating;
  brand_loyalty: LoyaltyLevel;
  brand_equity: EquityScore;
}

export type AwarenessLevel = 'unknown' | 'low' | 'moderate' | 'high' | 'dominant';

export interface PerceptionRating {
  overall_rating: number;
  perception_dimensions: PerceptionDimension[];
  perception_trend: TrendDirection;
}

export interface PerceptionDimension {
  dimension: string;
  rating: number;
  importance: number;
  competitive_position: RelativePosition;
}

export type RelativePosition = 'lagging' | 'parity' | 'leading' | 'dominant';

export type LoyaltyLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface EquityScore {
  financial_value: number;
  intangible_value: number;
  growth_potential: number;
  risk_level: RiskLevel;
}

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface CustomerLoyalty {
  retention_rate: number;
  advocacy_level: AdvocacyLevel;
  switching_barriers: SwitchingBarrier[];
  loyalty_drivers: LoyaltyDriver[];
}

export type AdvocacyLevel = 'detractor' | 'passive' | 'promoter' | 'advocate' | 'evangelist';

export interface SwitchingBarrier {
  barrier_type: BarrierType;
  barrier_strength: BarrierStrength;
  affected_segments: string[];
}

export type BarrierType = 
  | 'financial'
  | 'technical'
  | 'contractual'
  | 'learning'
  | 'relationship'
  | 'data'
  | 'network';

export type BarrierStrength = 'weak' | 'moderate' | 'strong' | 'very_strong' | 'prohibitive';

export interface LoyaltyDriver {
  driver: string;
  importance: number;
  performance: number;
  improvement_potential: number;
}

export interface InnovationReputation {
  innovation_perception: InnovationPerception;
  thought_leadership: ThoughtLeadership;
  innovation_awards: InnovationAward[];
  media_coverage: MediaCoverage;
}

export interface InnovationPerception {
  perceived_innovativeness: PerceptionLevel;
  innovation_credibility: CredibilityLevel;
  innovation_consistency: ConsistencyLevel;
  future_potential: PotentialLevel;
}

export type PerceptionLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export type CredibilityLevel = 'questionable' | 'emerging' | 'established' | 'strong' | 'unquestionable';

export type ConsistencyLevel = 'inconsistent' | 'somewhat_consistent' | 'consistent' | 'very_consistent' | 'predictable';

export type PotentialLevel = 'limited' | 'moderate' | 'high' | 'exceptional' | 'unlimited';

export interface ThoughtLeadership {
  industry_influence: InfluenceLevel;
  expert_recognition: RecognitionLevel;
  content_impact: ContentImpact;
  speaking_opportunities: SpeakingMetrics;
}

export type InfluenceLevel = 'minimal' | 'emerging' | 'established' | 'significant' | 'dominant';

export type RecognitionLevel = 'unknown' | 'emerging' | 'recognized' | 'respected' | 'authoritative';

export interface ContentImpact {
  reach: number;
  engagement: number;
  sharing: number;
  citation: number;
}

export interface SpeakingMetrics {
  invitations: number;
  audience_size: number;
  feedback_scores: number;
  follow_up_opportunities: number;
}

export interface InnovationAward {
  award_name: string;
  awarding_body: string;
  year: number;
  category: string;
  significance: SignificanceLevel;
}

export type SignificanceLevel = 'local' | 'regional' | 'national' | 'international' | 'global';

export interface MediaCoverage {
  coverage_volume: CoverageVolume;
  coverage_sentiment: SentimentAnalysis;
  coverage_reach: CoverageReach;
  coverage_quality: CoverageQuality;
}

export interface CoverageVolume {
  total_mentions: number;
  trend: TrendDirection;
  frequency: MentionFrequency;
  distribution: CoverageDistribution;
}

export type MentionFrequency = 'rare' | 'occasional' | 'regular' | 'frequent' | 'constant';

export interface CoverageDistribution {
  traditional_media: number;
  digital_media: number;
  social_media: number;
  industry_publications: number;
  academic_sources: number;
}

export interface SentimentAnalysis {
  overall_sentiment: SentimentScore;
  sentiment_trend: TrendDirection;
  sentiment_volatility: VolatilityLevel;
  sentiment_drivers: SentimentDriver[];
}

export interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
  compound: number;
}

export interface SentimentDriver {
  topic: string;
  sentiment_impact: number;
  frequency: number;
  trend: TrendDirection;
}

export interface CoverageReach {
  total_reach: number;
  unique_reach: number;
  reach_quality: ReachQuality;
  audience_alignment: AudienceAlignment;
}

export interface ReachQuality {
  target_audience_percentage: number;
  influence_score: number;
  engagement_rate: number;
  conversion_potential: number;
}

export interface AudienceAlignment {
  demographic_match: number;
  psychographic_match: number;
  behavioral_match: number;
  needs_alignment: number;
}

export interface CoverageQuality {
  source_credibility: CredibilityLevel;
  content_depth: ContentDepth;
  factual_accuracy: AccuracyLevel;
  editorial_tone: EditorialTone;
}

export type ContentDepth = 'superficial' | 'basic' | 'detailed' | 'comprehensive' | 'investigative';

export type AccuracyLevel = 'poor' | 'questionable' | 'acceptable' | 'good' | 'excellent';

export type EditorialTone = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

// Resource and Constraint Types
export interface ResourceInventory {
  financial_resources: FinancialResources;
  human_resources: HumanResources;
  technological_resources: TechnologicalResources;
  knowledge_resources: KnowledgeResources;
  network_resources: NetworkResources;
}

export interface FinancialResources {
  available_capital: number;
  innovation_budget: number;
  funding_sources: FundingSource[];
  financial_constraints: FinancialConstraint[];
}

export interface FundingSource {
  source_type: FundingType;
  amount: number;
  terms: FundingTerms;
  availability_timeline: AvailabilityTimeline;
}

export type FundingType = 
  | 'internal_funds'
  | 'venture_capital'
  | 'angel_investment'
  | 'government_grants'
  | 'corporate_partnerships'
  | 'crowdfunding'
  | 'debt_financing';

export interface FundingTerms {
  duration: number;
  interest_rate?: number;
  equity_stake?: number;
  control_provisions: ControlProvision[];
  milestone_requirements: MilestoneRequirement[];
}

export interface ControlProvision {
  provision_type: ProvisionType;
  scope: ControlScope;
  conditions: string[];
}

export type ProvisionType = 'board_seats' | 'veto_rights' | 'approval_requirements' | 'reporting_obligations';

export type ControlScope = 'strategic' | 'operational' | 'financial' | 'personnel' | 'comprehensive';

export interface MilestoneRequirement {
  milestone: string;
  deadline: Date;
  success_criteria: SuccessCriteria[];
  consequences: MilestoneConsequence[];
}

export interface SuccessCriteria {
  criterion: string;
  measurement_method: MeasurementMethod;
  target_value: number;
  tolerance: number;
}

export type MeasurementMethod = 'quantitative' | 'qualitative' | 'binary' | 'scaled' | 'comparative';

export interface MilestoneConsequence {
  consequence_type: ConsequenceType;
  severity: ConsequenceSeverity;
  mitigation_options: MitigationOption[];
}

export type ConsequenceType = 'funding_reduction' | 'timeline_extension' | 'scope_reduction' | 'termination' | 'renegotiation';

export type ConsequenceSeverity = 'minor' | 'moderate' | 'major' | 'severe' | 'critical';

export interface MitigationOption {
  option: string;
  feasibility: FeasibilityLevel;
  cost: number;
  timeline: number;
}

export type FeasibilityLevel = 'impossible' | 'very_difficult' | 'difficult' | 'possible' | 'easy';

export interface AvailabilityTimeline {
  initial_availability: Date;
  full_availability: Date;
  conditions: AvailabilityCondition[];
}

export interface AvailabilityCondition {
  condition: string;
  probability: number;
  impact_on_timeline: number;
}

export interface FinancialConstraint {
  constraint_type: FinancialConstraintType;
  limitation: number;
  flexibility: FlexibilityLevel;
  workaround_options: WorkaroundOption[];
}

export type FinancialConstraintType = 
  | 'budget_cap'
  | 'cash_flow_timing'
  | 'approval_thresholds'
  | 'reporting_requirements'
  | 'audit_constraints'
  | 'regulatory_limits';

export type FlexibilityLevel = 'rigid' | 'limited' | 'moderate' | 'flexible' | 'highly_flexible';

export interface WorkaroundOption {
  option: string;
  effectiveness: EffectivenessLevel;
  cost: number;
  risk: RiskLevel;
}

export type EffectivenessLevel = 'ineffective' | 'limited' | 'moderate' | 'effective' | 'highly_effective';

export interface HumanResources {
  available_talent: AvailableTalent;
  skill_gaps: SkillGap[];
  capacity_constraints: CapacityConstraint[];
  development_potential: TalentDevelopment;
}

export interface AvailableTalent {
  internal_talent: InternalTalent[];
  external_access: ExternalTalentAccess;
  talent_pipeline: TalentPipeline;
}

export interface InternalTalent {
  role: string;
  skill_level: SkillLevel;
  availability: AvailabilityLevel;
  innovation_experience: ExperienceLevel;
  domain_expertise: DomainExpertise[];
}

export type SkillLevel = 'novice' | 'competent' | 'proficient' | 'expert' | 'master';

export type AvailabilityLevel = 'unavailable' | 'limited' | 'partial' | 'mostly_available' | 'fully_available';

export type ExperienceLevel = 'none' | 'limited' | 'moderate' | 'extensive' | 'expert';

export interface DomainExpertise {
  domain: string;
  depth: ExpertiseDepth;
  breadth: ExpertiseBreadth;
  currency: ExpertiseCurrency;
}

export type ExpertiseDepth = 'surface' | 'basic' | 'intermediate' | 'advanced' | 'world_class';

export type ExpertiseBreadth = 'narrow' | 'focused' | 'broad' | 'comprehensive' | 'universal';

export type ExpertiseCurrency = 'outdated' | 'somewhat_current' | 'current' | 'cutting_edge' | 'pioneering';

export interface ExternalTalentAccess {
  consultant_networks: ConsultantNetwork[];
  academic_partnerships: AcademicPartnership[];
  talent_platforms: TalentPlatform[];
  recruitment_capabilities: RecruitmentCapability;
}

export interface ConsultantNetwork {
  network_name: string;
  expertise_areas: string[];
  quality_level: QualityLevel;
  cost_structure: CostStructure;
  availability: NetworkAvailability;
}

export type QualityLevel = 'poor' | 'below_average' | 'average' | 'above_average' | 'exceptional';

export interface CostStructure {
  pricing_model: PricingModel;
  rate_range: RateRange;
  payment_terms: PaymentTerms;
}

export type PricingModel = 'hourly' | 'daily' | 'project' | 'retainer' | 'outcome_based';

export interface RateRange {
  minimum: number;
  maximum: number;
  average: number;
  currency: string;
}

export interface PaymentTerms {
  payment_schedule: PaymentSchedule;
  advance_requirements: number;
  penalty_clauses: PenaltyClause[];
}

export type PaymentSchedule = 'upfront' | 'milestone_based' | 'monthly' | 'upon_completion' | 'net_terms';

export interface PenaltyClause {
  violation_type: string;
  penalty_amount: number;
  enforcement_likelihood: number;
}

export interface NetworkAvailability {
  current_capacity: CapacityLevel;
  lead_time: number;
  seasonal_variations: SeasonalVariation[];
}

export type CapacityLevel = 'overloaded' | 'limited' | 'moderate' | 'good' | 'excellent';

export interface SeasonalVariation {
  season: string;
  capacity_change: number;
  rate_change: number;
  quality_change: number;
}

export interface AcademicPartnership {
  institution: string;
  partnership_type: PartnershipType;
  research_areas: string[];
  collaboration_history: CollaborationHistory;
}

export type PartnershipType = 'research_collaboration' | 'talent_pipeline' | 'technology_transfer' | 'joint_ventures' | 'comprehensive';

export interface CollaborationHistory {
  past_projects: PastProject[];
  success_rate: number;
  satisfaction_level: SatisfactionLevel;
  relationship_strength: RelationshipStrength;
}

export interface PastProject {
  project_name: string;
  duration: number;
  outcome: ProjectOutcome;
  value_generated: number;
  lessons_learned: string[];
}

export type ProjectOutcome = 'failure' | 'partial_success' | 'success' | 'exceptional_success' | 'breakthrough';

export type SatisfactionLevel = 'very_dissatisfied' | 'dissatisfied' | 'neutral' | 'satisfied' | 'very_satisfied';

export type RelationshipStrength = 'weak' | 'developing' | 'established' | 'strong' | 'strategic';

export interface TalentPlatform {
  platform_name: string;
  talent_categories: TalentCategory[];
  vetting_quality: VettingQuality;
  platform_fees: PlatformFee[];
}

export interface TalentCategory {
  category: string;
  talent_pool_size: number;
  average_quality: QualityLevel;
  average_rate: number;
}

export interface VettingQuality {
  screening_rigor: ScreeningRigor;
  verification_methods: VerificationMethod[];
  quality_consistency: ConsistencyLevel;
}

export type ScreeningRigor = 'minimal' | 'basic' | 'thorough' | 'comprehensive' | 'rigorous';

export type VerificationMethod = 'self_reported' | 'reference_check' | 'skill_test' | 'portfolio_review' | 'interview';

export interface PlatformFee {
  fee_type: FeeType;
  percentage: number;
  minimum_amount?: number;
  maximum_amount?: number;
}

export type FeeType = 'placement_fee' | 'transaction_fee' | 'subscription_fee' | 'success_fee' | 'markup';

export interface RecruitmentCapability {
  internal_recruiting: InternalRecruiting;
  external_agencies: ExternalAgency[];
  employer_brand: EmployerBrand;
}

export interface InternalRecruiting {
  recruiter_count: number;
  recruiter_quality: QualityLevel;
  recruiting_tools: RecruitingTool[];
  process_efficiency: EfficiencyLevel;
}

export interface RecruitingTool {
  tool_name: string;
  functionality: ToolFunctionality[];
  effectiveness: EffectivenessLevel;
  cost: number;
}

export type ToolFunctionality = 
  | 'sourcing'
  | 'screening'
  | 'assessment'
  | 'tracking'
  | 'analytics'
  | 'communication'
  | 'onboarding';

export type EfficiencyLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface ExternalAgency {
  agency_name: string;
  specialization: string[];
  success_rate: number;
  time_to_fill: number;
  cost_structure: AgencyCostStructure;
}

export interface AgencyCostStructure {
  fee_percentage: number;
  guarantee_period: number;
  replacement_terms: ReplacementTerms;
}

export interface ReplacementTerms {
  replacement_period: number;
  fee_refund: number;
  conditions: string[];
}

export interface EmployerBrand {
  brand_strength: BrandStrength;
  value_proposition: ValueProposition;
  market_perception: MarketPerception;
  competitive_position: EmployerCompetitivePosition;
}

export interface ValueProposition {
  compensation_competitiveness: CompetitivenessLevel;
  benefits_attractiveness: AttractivenessLevel;
  culture_appeal: AppealLevel;
  growth_opportunities: OpportunityLevel;
  work_life_balance: BalanceLevel;
}

export type CompetitivenessLevel = 'below_market' | 'market_rate' | 'above_market' | 'top_tier' | 'best_in_class';

export type AttractivenessLevel = 'unattractive' | 'basic' | 'competitive' | 'attractive' | 'highly_attractive';

export type AppealLevel = 'repelling' | 'neutral' | 'appealing' | 'very_appealing' | 'magnetic';

export type OpportunityLevel = 'limited' | 'basic' | 'good' | 'excellent' | 'exceptional';

export type BalanceLevel = 'poor' | 'below_average' | 'average' | 'above_average' | 'exceptional';

export interface MarketPerception {
  awareness_level: AwarenessLevel;
  reputation_score: Reputation
