/**
 * Advanced Predictive Analytics Types
 * Unite Group - AI-Powered Revenue Forecasting and Business Intelligence
 */

export interface RevenueForecasting {
  id: string;
  forecast_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  time_horizon: {
    start_date: Date;
    end_date: Date;
    periods: number;
  };
  forecast_data: RevenueForecastPeriod[];
  confidence_intervals: {
    confidence_level: number; // 0.8, 0.9, 0.95
    lower_bound: number[];
    upper_bound: number[];
  };
  model_metadata: {
    algorithm: 'arima' | 'lstm' | 'prophet' | 'ensemble';
    accuracy_score: number;
    mean_absolute_error: number;
    r_squared: number;
    feature_importance: Record<string, number>;
  };
  business_factors: {
    seasonality_detected: boolean;
    trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    external_factors: ExternalFactor[];
    market_conditions: MarketCondition[];
  };
  scenario_analysis: ScenarioForecast[];
  recommendations: ForecastRecommendation[];
  created_at: Date;
  updated_at: Date;
}

export interface RevenueForecastPeriod {
  period: Date;
  forecasted_revenue: number;
  lower_bound: number;
  upper_bound: number;
  contributing_factors: {
    base_trend: number;
    seasonality: number;
    market_factors: number;
    promotional_impact: number;
  };
  confidence_score: number;
}

export interface ExternalFactor {
  name: string;
  type: 'economic' | 'seasonal' | 'competitive' | 'regulatory' | 'technological';
  impact_strength: number; // -1 to 1
  probability: number; // 0 to 1
  description: string;
}

export interface MarketCondition {
  condition: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // 0 to 1
  duration: 'short_term' | 'medium_term' | 'long_term';
  mitigation_strategies: string[];
}

export interface ScenarioForecast {
  scenario_name: string;
  scenario_type: 'optimistic' | 'pessimistic' | 'realistic' | 'stress_test';
  probability: number;
  revenue_impact: number[];
  key_assumptions: string[];
  risk_factors: string[];
  opportunities: string[];
}

export interface ForecastRecommendation {
  category: 'revenue_optimization' | 'risk_mitigation' | 'growth_opportunity' | 'resource_allocation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  expected_impact: {
    revenue_change: number;
    confidence: number;
    timeframe: string;
  };
  implementation_steps: string[];
  resource_requirements: string[];
  success_metrics: string[];
}

export interface ChurnPrediction {
  id: string;
  customer_id: string;
  churn_probability: number;
  churn_risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_churn_date?: Date;
  time_to_churn_days?: number;
  churn_factors: ChurnFactor[];
  customer_lifetime_value: number;
  retention_value: number;
  prevention_strategies: ChurnPreventionStrategy[];
  similar_customers: SimilarCustomerAnalysis[];
  model_explanation: {
    feature_contributions: Record<string, number>;
    confidence_score: number;
    model_version: string;
  };
  last_updated: Date;
}

export interface ChurnFactor {
  factor: string;
  category: 'behavioral' | 'demographic' | 'transactional' | 'engagement' | 'satisfaction';
  importance: number; // 0 to 1
  value: number;
  trend: 'improving' | 'declining' | 'stable';
  description: string;
}

export interface ChurnPreventionStrategy {
  strategy_id: string;
  strategy_name: string;
  strategy_type: 'retention_offer' | 'engagement_campaign' | 'service_improvement' | 'pricing_adjustment';
  success_probability: number;
  estimated_cost: number;
  expected_value: number;
  roi_estimate: number;
  implementation_timeline: string;
  target_factors: string[];
  personalization_elements: Record<string, unknown>;
}

export interface SimilarCustomerAnalysis {
  customer_id: string;
  similarity_score: number;
  churn_outcome: 'churned' | 'retained';
  retention_strategies_used: string[];
  success_factors: string[];
}

export interface MarketTrendAnalysis {
  id: string;
  analysis_period: {
    start_date: Date;
    end_date: Date;
  };
  market_segment: string;
  trends_identified: MarketTrend[];
  opportunity_analysis: MarketOpportunity[];
  threat_assessment: MarketThreat[];
  competitive_landscape: CompetitiveLandscape;
  consumer_behavior_insights: ConsumerBehaviorInsight[];
  predictive_indicators: PredictiveIndicator[];
  strategic_recommendations: StrategicRecommendation[];
  confidence_score: number;
  data_sources: string[];
  created_at: Date;
}

export interface MarketTrend {
  trend_id: string;
  trend_name: string;
  trend_type: 'technology' | 'consumer_behavior' | 'economic' | 'regulatory' | 'social';
  trend_strength: number; // 0 to 1
  trend_direction: 'emerging' | 'growing' | 'maturing' | 'declining';
  impact_timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  business_impact: {
    revenue_potential: number;
    market_share_impact: number;
    operational_impact: string;
    strategic_importance: 'low' | 'medium' | 'high' | 'critical';
  };
  supporting_evidence: string[];
  related_trends: string[];
}

export interface MarketOpportunity {
  opportunity_id: string;
  opportunity_name: string;
  opportunity_type: 'market_expansion' | 'product_innovation' | 'partnership' | 'acquisition' | 'technology_adoption';
  market_size: number;
  growth_potential: number;
  competitive_intensity: 'low' | 'medium' | 'high';
  entry_barriers: EntryBarrier[];
  success_probability: number;
  investment_required: {
    financial: number;
    time_months: number;
    resources: string[];
  };
  expected_returns: {
    revenue_potential: number;
    market_share_gain: number;
    roi_estimate: number;
    payback_period_months: number;
  };
  risk_factors: string[];
  success_factors: string[];
}

export interface MarketThreat {
  threat_id: string;
  threat_name: string;
  threat_type: 'competitive' | 'technological' | 'regulatory' | 'economic' | 'consumer_shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0 to 1
  impact_timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  potential_impact: {
    revenue_loss: number;
    market_share_loss: number;
    operational_disruption: string;
  };
  early_warning_indicators: string[];
  mitigation_strategies: MitigationStrategy[];
  contingency_plans: string[];
}

export interface EntryBarrier {
  barrier_type: 'financial' | 'regulatory' | 'technological' | 'competitive' | 'operational';
  barrier_description: string;
  difficulty_level: 'low' | 'medium' | 'high';
  overcome_strategies: string[];
}

export interface MitigationStrategy {
  strategy_name: string;
  strategy_type: 'defensive' | 'offensive' | 'adaptive' | 'diversification';
  effectiveness: number; // 0 to 1
  implementation_cost: number;
  implementation_time: string;
  success_metrics: string[];
}

export interface CompetitiveLandscape {
  market_leaders: CompetitorProfile[];
  emerging_competitors: CompetitorProfile[];
  competitive_dynamics: {
    market_concentration: number;
    competitive_intensity: 'low' | 'medium' | 'high';
    price_competition: 'low' | 'medium' | 'high';
    innovation_rate: 'low' | 'medium' | 'high';
  };
  market_positioning: {
    our_position: MarketPosition;
    positioning_gaps: string[];
    differentiation_opportunities: string[];
  };
}

export interface CompetitorProfile {
  company_name: string;
  market_share: number;
  revenue_estimate: number;
  growth_rate: number;
  strengths: string[];
  weaknesses: string[];
  strategies: string[];
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  monitoring_priority: 'low' | 'medium' | 'high';
}

export interface MarketPosition {
  quadrant: 'leader' | 'challenger' | 'follower' | 'niche';
  market_share: number;
  brand_strength: number;
  competitive_advantages: string[];
  vulnerable_areas: string[];
  strategic_moves_needed: string[];
}

export interface ConsumerBehaviorInsight {
  insight_id: string;
  behavior_type: 'purchasing' | 'communication' | 'technology_adoption' | 'brand_preference';
  insight_description: string;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  demographic_segments: string[];
  business_implications: string[];
  adaptation_strategies: string[];
  confidence_level: number;
}

export interface PredictiveIndicator {
  indicator_name: string;
  indicator_type: 'leading' | 'lagging' | 'coincident';
  current_value: number;
  historical_trend: number[];
  predicted_values: {
    next_month: number;
    next_quarter: number;
    next_year: number;
  };
  correlation_strength: number;
  business_impact: string;
  monitoring_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface StrategicRecommendation {
  recommendation_id: string;
  category: 'market_entry' | 'product_development' | 'competitive_response' | 'investment' | 'partnership';
  priority: 'low' | 'medium' | 'high' | 'critical';
  strategic_objective: string;
  recommendation_details: string;
  supporting_rationale: string[];
  implementation_roadmap: {
    phases: ImplementationPhase[];
    total_timeline: string;
    resource_requirements: string[];
    success_criteria: string[];
  };
  risk_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    key_risks: string[];
    mitigation_strategies: string[];
  };
  expected_outcomes: {
    quantitative_benefits: Record<string, number>;
    qualitative_benefits: string[];
    success_probability: number;
  };
}

export interface ImplementationPhase {
  phase_number: number;
  phase_name: string;
  duration: string;
  objectives: string[];
  deliverables: string[];
  resources_needed: string[];
  success_metrics: string[];
  dependencies: string[];
}

export interface PerformanceOptimization {
  optimization_id: string;
  optimization_category: 'revenue' | 'cost' | 'efficiency' | 'customer_satisfaction' | 'market_share';
  current_performance: PerformanceMetrics;
  benchmark_comparison: BenchmarkComparison;
  optimization_opportunities: OptimizationOpportunity[];
  improvement_roadmap: ImprovementRoadmap;
  resource_allocation_optimization: ResourceAllocation[];
  roi_analysis: ROIAnalysis;
  implementation_priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_impact: {
    performance_improvement: number;
    financial_impact: number;
    timeline_to_impact: string;
    confidence_level: number;
  };
  monitoring_framework: MonitoringFramework;
  created_at: Date;
}

export interface PerformanceMetrics {
  metric_name: string;
  current_value: number;
  target_value: number;
  benchmark_value?: number;
  trend: 'improving' | 'declining' | 'stable';
  performance_gap: number;
  business_impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface BenchmarkComparison {
  benchmark_type: 'industry_average' | 'best_in_class' | 'competitor' | 'historical';
  comparison_data: {
    our_performance: number;
    benchmark_value: number;
    percentile_ranking: number;
    performance_gap: number;
  };
  improvement_potential: number;
  contextual_factors: string[];
}

export interface OptimizationOpportunity {
  opportunity_name: string;
  opportunity_type: 'quick_win' | 'strategic_initiative' | 'process_improvement' | 'technology_upgrade';
  effort_required: 'low' | 'medium' | 'high';
  impact_potential: 'low' | 'medium' | 'high';
  implementation_complexity: 'simple' | 'moderate' | 'complex';
  estimated_benefit: number;
  implementation_timeline: string;
  resource_requirements: string[];
  success_probability: number;
  dependencies: string[];
  risk_factors: string[];
}

export interface ImprovementRoadmap {
  roadmap_timeline: string;
  phases: RoadmapPhase[];
  milestones: Milestone[];
  resource_plan: ResourcePlan;
  risk_mitigation: RiskMitigation[];
  success_criteria: string[];
}

export interface RoadmapPhase {
  phase_id: string;
  phase_name: string;
  start_date: Date;
  end_date: Date;
  objectives: string[];
  initiatives: OptimizationOpportunity[];
  expected_outcomes: string[];
  success_metrics: string[];
}

export interface Milestone {
  milestone_name: string;
  target_date: Date;
  success_criteria: string[];
  deliverables: string[];
  stakeholders: string[];
}

export interface ResourcePlan {
  human_resources: {
    roles_needed: string[];
    skill_requirements: string[];
    capacity_allocation: Record<string, number>;
  };
  financial_resources: {
    total_budget: number;
    budget_allocation: Record<string, number>;
    roi_expectations: number;
  };
  technology_resources: {
    tools_needed: string[];
    infrastructure_requirements: string[];
    integration_needs: string[];
  };
}

export interface ResourceAllocation {
  resource_type: 'human' | 'financial' | 'technology' | 'time';
  current_allocation: number;
  optimal_allocation: number;
  reallocation_opportunity: number;
  reallocation_strategy: string;
  expected_benefit: number;
  implementation_barriers: string[];
}

export interface ROIAnalysis {
  investment_required: number;
  expected_returns: {
    year_1: number;
    year_2: number;
    year_3: number;
    total_3_year: number;
  };
  roi_metrics: {
    roi_percentage: number;
    payback_period_months: number;
    net_present_value: number;
    internal_rate_of_return: number;
  };
  sensitivity_analysis: {
    best_case: number;
    worst_case: number;
    most_likely: number;
  };
}

export interface RiskMitigation {
  risk_description: string;
  risk_probability: number;
  risk_impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation_strategy: string;
  contingency_plan: string;
  monitoring_indicators: string[];
}

export interface MonitoringFramework {
  key_performance_indicators: KPI[];
  monitoring_frequency: Record<string, string>;
  reporting_schedule: ReportingSchedule[];
  alert_thresholds: AlertThreshold[];
  review_cycles: ReviewCycle[];
}

export interface KPI {
  kpi_name: string;
  measurement_method: string;
  target_value: number;
  current_value: number;
  trend_direction: 'up' | 'down' | 'stable';
  business_context: string;
}

export interface ReportingSchedule {
  report_type: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  stakeholders: string[];
  content_focus: string[];
}

export interface AlertThreshold {
  metric_name: string;
  threshold_type: 'upper' | 'lower' | 'range';
  threshold_value: number;
  alert_severity: 'info' | 'warning' | 'critical';
  notification_recipients: string[];
}

export interface ReviewCycle {
  review_type: 'performance_review' | 'strategy_adjustment' | 'resource_reallocation';
  frequency: 'monthly' | 'quarterly' | 'bi_annually' | 'annually';
  participants: string[];
  review_criteria: string[];
  decision_authority: string;
}

export interface PredictiveAnalyticsConfig {
  forecasting: {
    default_models: string[];
    retraining_frequency: 'daily' | 'weekly' | 'monthly';
    accuracy_thresholds: {
      minimum_accuracy: number;
      retrain_threshold: number;
      confidence_threshold: number;
    };
    feature_selection: {
      auto_feature_selection: boolean;
      max_features: number;
      feature_importance_threshold: number;
    };
  };
  churn_prediction: {
    prediction_models: string[];
    prediction_frequency: 'daily' | 'weekly' | 'monthly';
    intervention_thresholds: {
      low_risk: number;
      medium_risk: number;
      high_risk: number;
    };
    retention_strategies: {
      auto_trigger_enabled: boolean;
      strategy_selection_criteria: string[];
      max_intervention_cost: number;
    };
  };
  market_analysis: {
    data_sources: string[];
    analysis_frequency: 'weekly' | 'monthly' | 'quarterly';
    trend_detection: {
      sensitivity: number;
      confirmation_threshold: number;
      minimum_trend_duration: number;
    };
  };
  performance_optimization: {
    optimization_frequency: 'monthly' | 'quarterly';
    benchmark_sources: string[];
    improvement_thresholds: {
      minimum_improvement: number;
      investment_roi_threshold: number;
    };
  };
}

export interface PredictiveAnalyticsResponse<T = unknown> {
  success: boolean;
  data?: T;
  forecasts?: RevenueForecasting[];
  churn_predictions?: ChurnPrediction[];
  market_insights?: MarketTrendAnalysis[];
  optimization_recommendations?: PerformanceOptimization[];
  confidence_scores?: Record<string, number>;
  error?: string;
  metadata: {
    timestamp: Date;
    processing_time: number;
    model_versions: Record<string, string>;
    data_freshness: Date;
    prediction_horizon: string;
  };
}
