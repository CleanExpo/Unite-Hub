/**
 * Advanced AI Personalization Types
 * Unite Group - Intelligent User Experience Personalization
 */

export interface UserProfile {
  id: string;
  user_id: string;
  demographics: {
    age_group?: 'under_25' | '25_34' | '35_44' | '45_54' | '55_64' | 'over_65';
    location?: {
      country: string;
      region: string;
      city: string;
      timezone: string;
    };
    business_info?: {
      company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
      industry: string;
      role: 'owner' | 'ceo' | 'cto' | 'manager' | 'developer' | 'other';
      budget_range: {
        min: number;
        max: number;
        currency: string;
      };
    };
    technical_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  behavioral_data: {
    visit_patterns: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
      avg_session_duration: number; // seconds
      pages_per_session: number;
      most_active_times: string[]; // hour ranges
      device_preferences: ('desktop' | 'mobile' | 'tablet')[];
    };
    interaction_history: {
      clicks: InteractionEvent[];
      form_submissions: FormSubmissionEvent[];
      downloads: DownloadEvent[];
      consultations: ConsultationEvent[];
      content_engagement: ContentEngagementEvent[];
    };
    communication_preferences: {
      channels: ('email' | 'phone' | 'chat' | 'video')[];
      frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
      content_types: ('technical' | 'business' | 'case_studies' | 'tutorials')[];
      tone: 'formal' | 'casual' | 'technical' | 'friendly';
    };
  };
  preferences: {
    services_of_interest: string[];
    content_categories: string[];
    ui_preferences: {
      theme: 'light' | 'dark' | 'auto';
      layout: 'compact' | 'standard' | 'spacious';
      language: string;
      accessibility_features: string[];
    };
    notification_settings: {
      marketing: boolean;
      product_updates: boolean;
      blog_posts: boolean;
      case_studies: boolean;
      webinars: boolean;
    };
  };
  ai_insights: {
    personality_traits: PersonalityTrait[];
    decision_making_style: 'analytical' | 'intuitive' | 'consensus' | 'decisive';
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
    innovation_adoption: 'early_adopter' | 'early_majority' | 'late_majority' | 'laggard';
    communication_style: 'direct' | 'detailed' | 'visual' | 'story_driven';
  };
  lifecycle_stage: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';
  created_at: Date;
  updated_at: Date;
}

export interface InteractionEvent {
  timestamp: Date;
  element: string;
  page: string;
  context: Record<string, unknown>;
}

export interface FormSubmissionEvent {
  timestamp: Date;
  form_type: string;
  fields_submitted: string[];
  completion_time: number; // seconds
  successful: boolean;
}

export interface DownloadEvent {
  timestamp: Date;
  resource_type: string;
  resource_name: string;
  source_page: string;
}

export interface ConsultationEvent {
  timestamp: Date;
  type: 'booking' | 'completion' | 'cancellation';
  service_type: string;
  outcome?: string;
  satisfaction_score?: number;
}

export interface ContentEngagementEvent {
  timestamp: Date;
  content_type: 'blog' | 'case_study' | 'documentation' | 'video';
  content_id: string;
  engagement_duration: number; // seconds
  engagement_depth: number; // scroll percentage
  actions_taken: string[]; // likes, shares, comments
}

export interface PersonalityTrait {
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  score: number; // 0-1
  confidence: number; // 0-1
}

export interface PersonalizationContext {
  user_profile: UserProfile;
  current_session: {
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    location: {
      country: string;
      region: string;
      city: string;
    };
    referrer?: string;
    utm_parameters?: Record<string, string>;
    time_of_day: number; // hour 0-23
    day_of_week: number; // 0-6
  };
  business_context: {
    current_promotions: string[];
    service_availability: Record<string, boolean>;
    seasonal_factors: string[];
    competitive_landscape: string[];
  };
  real_time_data: {
    website_traffic: number;
    server_load: number;
    current_consultations: number;
    popular_content: string[];
  };
}

export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: PersonalizationCondition[];
  actions: PersonalizationAction[];
  audience: AudienceSegment;
  active: boolean;
  ab_test?: {
    enabled: boolean;
    variant: 'A' | 'B';
    traffic_split: number; // 0-100
    metrics: string[];
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversion_rate: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface PersonalizationCondition {
  type: 'demographic' | 'behavioral' | 'contextual' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface PersonalizationAction {
  type: 'content' | 'layout' | 'messaging' | 'redirect' | 'popup' | 'form' | 'cta';
  target: string;
  parameters: Record<string, unknown>;
  weight?: number; // for A/B testing
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: PersonalizationCondition[];
  size: number;
  characteristics: string[];
  value_score: number; // business value 0-100
  engagement_score: number; // 0-100
  conversion_potential: number; // 0-100
}

export interface PersonalizedContent {
  id: string;
  original_content_id: string;
  user_id: string;
  content_type: 'hero_section' | 'cta_button' | 'testimonial' | 'case_study' | 'pricing' | 'form' | 'navigation';
  personalized_elements: {
    headline?: string;
    subheadline?: string;
    body_text?: string;
    cta_text?: string;
    images?: string[];
    videos?: string[];
    layout?: Record<string, unknown>;
    styling?: Record<string, unknown>;
  };
  personalization_reasons: string[];
  confidence_score: number;
  a_b_variant?: 'A' | 'B';
  generated_at: Date;
  expires_at?: Date;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  variants: ABTestVariant[];
  traffic_allocation: Record<string, number>; // variant_id -> percentage
  audience_targeting: AudienceSegment[];
  success_metrics: ABTestMetric[];
  duration: {
    start_date: Date;
    end_date: Date;
    auto_end: boolean;
  };
  statistical_significance: {
    required_confidence: number; // 0.95 = 95%
    minimum_sample_size: number;
    current_significance?: number;
    winning_variant?: string;
  };
  results?: ABTestResults;
  created_at: Date;
  updated_at: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  changes: PersonalizationAction[];
  is_control: boolean;
  weight: number; // traffic percentage
}

export interface ABTestMetric {
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'time' | 'custom';
  target_value?: number;
  comparison: 'increase' | 'decrease' | 'maintain';
  importance: 'primary' | 'secondary';
}

export interface ABTestResults {
  total_participants: number;
  variant_performance: Record<string, VariantPerformance>;
  statistical_analysis: {
    confidence_level: number;
    p_value: number;
    effect_size: number;
    winning_variant?: string;
    improvement_percentage?: number;
  };
  business_impact: {
    revenue_impact?: number;
    conversion_lift?: number;
    engagement_improvement?: number;
  };
  recommendations: string[];
}

export interface VariantPerformance {
  participants: number;
  conversions: number;
  conversion_rate: number;
  average_value?: number;
  total_revenue?: number;
  engagement_metrics: Record<string, number>;
}

export interface PersonalizationInsight {
  id: string;
  type: 'performance' | 'opportunity' | 'segment' | 'content' | 'timing';
  category: 'conversion' | 'engagement' | 'retention' | 'revenue' | 'experience';
  title: string;
  description: string;
  insights: string[];
  recommendations: PersonalizationRecommendation[];
  impact_potential: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  supporting_data: Record<string, unknown>;
  segments_affected: string[];
  generated_at: Date;
}

export interface PersonalizationRecommendation {
  action: string;
  description: string;
  expected_impact: string;
  effort_required: 'low' | 'medium' | 'high';
  implementation_steps: string[];
  success_metrics: string[];
}

export interface PersonalizationEngine {
  // Core methods
  analyzeUser(userId: string, sessionData: Record<string, unknown>): Promise<UserProfile>;
  generatePersonalizedContent(context: PersonalizationContext): Promise<PersonalizedContent[]>;
  runABTest(experimentId: string, userId: string): Promise<string>; // returns variant ID
  
  // Segmentation
  identifySegments(users: UserProfile[]): Promise<AudienceSegment[]>;
  assignUserToSegments(userProfile: UserProfile): Promise<string[]>;
  
  // Optimization
  optimizePersonalizationRules(): Promise<PersonalizationRule[]>;
  generateInsights(timeframe: string): Promise<PersonalizationInsight[]>;
  
  // Real-time
  getPersonalizedExperience(userId: string, pageContext: Record<string, unknown>): Promise<PersonalizedContent[]>;
  trackInteraction(userId: string, interaction: InteractionEvent): Promise<void>;
  
  // Management
  createPersonalizationRule(rule: Omit<PersonalizationRule, 'id' | 'created_at' | 'updated_at'>): Promise<PersonalizationRule>;
  updatePersonalizationRule(id: string, updates: Partial<PersonalizationRule>): Promise<PersonalizationRule>;
  deletePersonalizationRule(id: string): Promise<void>;
}

export interface PersonalizationConfig {
  ai_models: {
    user_profiling: string[];
    content_generation: string[];
    ab_testing: string[];
    segmentation: string[];
  };
  real_time_processing: {
    enabled: boolean;
    batch_size: number;
    processing_interval: number; // seconds
  };
  ab_testing: {
    default_confidence_level: number;
    minimum_sample_size: number;
    auto_winner_selection: boolean;
    max_concurrent_tests: number;
  };
  content_generation: {
    max_variants_per_element: number;
    content_refresh_interval: number; // hours
    fallback_to_default: boolean;
  };
  data_retention: {
    user_profiles: number; // days
    interaction_events: number; // days
    ab_test_results: number; // days
    personalized_content: number; // days
  };
  privacy: {
    anonymize_data: boolean;
    respect_do_not_track: boolean;
    gdpr_compliance: boolean;
    data_deletion_on_request: boolean;
  };
}

export interface PersonalizationResponse<T = unknown> {
  success: boolean;
  data?: T;
  insights?: PersonalizationInsight[];
  recommendations?: PersonalizationRecommendation[];
  ab_test_assignments?: Record<string, string>;
  personalization_applied?: string[];
  error?: string;
  metadata: {
    timestamp: Date;
    processing_time: number;
    user_segment?: string[];
    confidence_score: number;
    cache_hit: boolean;
  };
}
