/**
 * AI Business Intelligence Types
 * Unite Group - Advanced Business Analytics and Intelligence
 */

export interface BusinessMetrics {
  id: string;
  timestamp: Date;
  revenue: {
    total: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    projected: number;
  };
  clients: {
    total: number;
    active: number;
    new: number;
    churned: number;
    retention_rate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    success_rate: number;
  };
  consultations: {
    total: number;
    conversion_rate: number;
    average_value: number;
    booking_rate: number;
  };
  performance: {
    profit_margin: number;
    roi: number;
    customer_lifetime_value: number;
    acquisition_cost: number;
  };
}

export interface PredictiveAnalysis {
  id: string;
  type: 'revenue' | 'churn' | 'growth' | 'market_opportunity';
  confidence: number;
  time_horizon: '1month' | '3months' | '6months' | '1year';
  prediction: {
    value: number;
    range: {
      min: number;
      max: number;
    };
    factors: string[];
    risks: string[];
    opportunities: string[];
  };
  recommendations: BusinessRecommendation[];
  created_at: Date;
  updated_at: Date;
}

export interface BusinessRecommendation {
  id: string;
  category: 'revenue' | 'efficiency' | 'customer' | 'marketing' | 'operations';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    estimated_value: number;
    effort_required: 'low' | 'medium' | 'high';
    time_to_implement: string;
    success_probability: number;
  };
  implementation: {
    steps: string[];
    resources_required: string[];
    timeline: string;
    dependencies: string[];
  };
  ai_generated: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: Date;
}

export interface WorkflowAutomation {
  id: string;
  name: string;
  description: string;
  type: 'client_onboarding' | 'project_management' | 'consultation_prep' | 'reporting' | 'custom';
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  ai_enhanced: boolean;
  status: 'active' | 'inactive' | 'testing';
  performance: {
    executions: number;
    success_rate: number;
    time_saved: number;
    error_rate: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowTrigger {
  type: 'time' | 'event' | 'condition' | 'manual';
  config: {
    schedule?: string;
    event_type?: string;
    condition?: string;
    webhook_url?: string;
  };
}

export interface WorkflowAction {
  type: 'email' | 'api_call' | 'data_update' | 'notification' | 'ai_analysis' | 'document_generation';
  config: {
    template?: string;
    endpoint?: string;
    data?: Record<string, unknown>;
    recipients?: string[];
    ai_prompt?: string;
  };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: unknown;
  logic?: 'and' | 'or';
}

export interface CustomerIntelligence {
  customer_id: string;
  profile: {
    demographics: {
      business_size: 'startup' | 'small' | 'medium' | 'enterprise';
      industry: string;
      location: string;
      annual_revenue?: number;
      employees?: number;
    };
    behavior: {
      engagement_score: number;
      communication_preference: 'email' | 'phone' | 'chat' | 'video';
      response_time_preference: 'immediate' | 'within_hour' | 'within_day' | 'flexible';
      decision_making_style: 'analytical' | 'collaborative' | 'decisive' | 'cautious';
    };
    preferences: {
      service_types: string[];
      budget_range: {
        min: number;
        max: number;
      };
      timeline_preference: 'urgent' | 'standard' | 'flexible';
      communication_style: 'formal' | 'casual' | 'technical' | 'business';
    };
    history: {
      projects_completed: number;
      total_value: number;
      satisfaction_score: number;
      referrals_made: number;
      last_interaction: Date;
    };
  };
  predictions: {
    churn_risk: number;
    upsell_probability: number;
    referral_likelihood: number;
    next_project_timeline: string;
    lifetime_value: number;
  };
  recommendations: {
    engagement_strategy: string;
    service_recommendations: string[];
    pricing_strategy: string;
    communication_timing: string;
  };
  ai_insights: string[];
  last_updated: Date;
}

export interface MarketIntelligence {
  id: string;
  market_segment: string;
  analysis: {
    market_size: number;
    growth_rate: number;
    competition_level: 'low' | 'medium' | 'high';
    opportunity_score: number;
    trends: MarketTrend[];
    threats: MarketThreat[];
    opportunities: MarketOpportunity[];
  };
  competitive_landscape: {
    direct_competitors: Competitor[];
    indirect_competitors: Competitor[];
    market_share: number;
    positioning: string;
    competitive_advantages: string[];
    weaknesses: string[];
  };
  customer_insights: {
    target_demographics: string[];
    pain_points: string[];
    decision_factors: string[];
    buying_behavior: string[];
    satisfaction_drivers: string[];
  };
  pricing_intelligence: {
    market_average: number;
    premium_pricing: number;
    budget_pricing: number;
    value_perception: number;
    price_sensitivity: number;
  };
  ai_generated: boolean;
  confidence_score: number;
  last_updated: Date;
}

export interface MarketTrend {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  timeline: string;
  relevance_score: number;
}

export interface MarketThreat {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation_strategies: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  description: string;
  potential_value: number;
  effort_required: 'low' | 'medium' | 'high';
  time_to_market: string;
  success_probability: number;
  implementation_plan: string[];
}

export interface Competitor {
  id: string;
  name: string;
  website?: string;
  market_share: number;
  strengths: string[];
  weaknesses: string[];
  pricing_strategy: string;
  service_offerings: string[];
  customer_base: string;
  competitive_score: number;
}

export interface AIBusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend' | 'prediction';
  category: 'revenue' | 'operations' | 'marketing' | 'customer' | 'competitive';
  title: string;
  summary: string;
  detailed_analysis: string;
  confidence: number;
  impact_score: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actionable_recommendations: string[];
  supporting_data: Record<string, unknown>;
  ai_model_used: string;
  generated_at: Date;
  expires_at?: Date;
  status: 'active' | 'acknowledged' | 'acted_upon' | 'dismissed';
}

export interface BusinessIntelligenceConfig {
  data_sources: {
    crm_enabled: boolean;
    analytics_enabled: boolean;
    financial_enabled: boolean;
    external_apis: string[];
  };
  analysis_frequency: {
    metrics_update: 'realtime' | 'hourly' | 'daily' | 'weekly';
    predictions_update: 'daily' | 'weekly' | 'monthly';
    insights_generation: 'continuous' | 'scheduled' | 'manual';
  };
  ai_settings: {
    prediction_models: string[];
    confidence_threshold: number;
    insight_categories: string[];
    auto_action_enabled: boolean;
  };
  notifications: {
    critical_insights: boolean;
    daily_summary: boolean;
    weekly_report: boolean;
    threshold_alerts: boolean;
  };
  permissions: {
    view_insights: string[];
    manage_workflows: string[];
    configure_ai: string[];
    export_data: string[];
  };
}

export interface BusinessIntelligenceResponse<T = unknown> {
  success: boolean;
  data?: T;
  insights?: AIBusinessInsight[];
  predictions?: PredictiveAnalysis[];
  recommendations?: BusinessRecommendation[];
  error?: string;
  metadata: {
    timestamp: Date;
    processing_time: number;
    ai_model_version: string;
    confidence_score: number;
    data_freshness: Date;
  };
}

export interface BusinessProcessAnalysis {
  process_id: string;
  process_name: string;
  current_state: {
    steps: ProcessStep[];
    total_time: number;
    manual_effort: number;
    error_rate: number;
    cost_per_execution: number;
  };
  optimization_opportunities: {
    automation_potential: number;
    time_savings: number;
    cost_reduction: number;
    quality_improvement: number;
    recommended_changes: string[];
  };
  ai_enhancement_suggestions: {
    decision_automation: string[];
    predictive_elements: string[];
    intelligent_routing: string[];
    quality_checks: string[];
  };
  implementation_plan: {
    phases: ImplementationPhase[];
    total_effort: string;
    expected_roi: number;
    risk_assessment: string;
  };
}

export interface ProcessStep {
  id: string;
  name: string;
  type: 'manual' | 'automated' | 'decision' | 'approval';
  duration: number;
  effort_required: number;
  error_prone: boolean;
  automation_candidate: boolean;
  dependencies: string[];
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  success_criteria: string[];
  risks: string[];
}
