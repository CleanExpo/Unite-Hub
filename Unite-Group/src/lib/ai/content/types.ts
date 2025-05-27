/**
 * Smart Content & Communication Types
 * Unite Group - AI-Powered Content Generation and Communication Systems
 */

export interface ContentGenerationRequest {
  id: string;
  type: 'marketing_copy' | 'proposal' | 'blog_post' | 'case_study' | 'email' | 'social_media' | 'landing_page' | 'technical_documentation';
  target_audience: {
    demographics: {
      industry: string;
      company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
      technical_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      decision_maker_role: 'owner' | 'ceo' | 'cto' | 'manager' | 'developer' | 'other';
    };
    psychographics: {
      pain_points: string[];
      goals: string[];
      preferences: string[];
      communication_style: 'formal' | 'casual' | 'technical' | 'friendly';
    };
    context: {
      location: string;
      budget_range?: {
        min: number;
        max: number;
        currency: string;
      };
      urgency: 'low' | 'medium' | 'high' | 'urgent';
      project_scope: string;
    };
  };
  content_requirements: {
    tone: 'professional' | 'friendly' | 'authoritative' | 'conversational' | 'inspirational';
    style: 'informative' | 'persuasive' | 'educational' | 'promotional' | 'storytelling';
    length: 'short' | 'medium' | 'long' | 'custom';
    custom_length?: number; // words
    keywords: string[];
    call_to_action: string;
    include_elements: ('statistics' | 'testimonials' | 'case_studies' | 'pricing' | 'features' | 'benefits')[];
  };
  business_context: {
    services_to_highlight: string[];
    unique_value_propositions: string[];
    competitive_advantages: string[];
    current_promotions?: string[];
    brand_voice_guidelines: string[];
  };
  personalization_data?: {
    user_history: string[];
    previous_interactions: string[];
    preferences: Record<string, unknown>;
    behavioral_insights: string[];
  };
  constraints?: {
    avoid_topics: string[];
    required_disclaimers: string[];
    compliance_requirements: string[];
    brand_guidelines: string[];
  };
  created_at: Date;
  requested_by: string;
}

export interface GeneratedContent {
  id: string;
  request_id: string;
  content_type: string;
  variants: ContentVariant[];
  selected_variant?: string;
  performance_metrics?: ContentPerformanceMetrics;
  personalization_applied: string[];
  ai_model_used: string;
  generation_metadata: {
    processing_time: number;
    token_usage: number;
    confidence_score: number;
    creativity_level: number;
    factual_accuracy_score: number;
  };
  approval_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  feedback?: ContentFeedback[];
  created_at: Date;
  updated_at: Date;
}

export interface ContentVariant {
  id: string;
  name: string;
  content: {
    headline?: string;
    subheadline?: string;
    body: string;
    call_to_action?: string;
    meta_description?: string;
    tags?: string[];
  };
  style_attributes: {
    tone_analysis: {
      professional: number;
      friendly: number;
      authoritative: number;
      engaging: number;
    };
    readability_score: number;
    seo_score?: number;
    sentiment_score: number;
  };
  target_effectiveness: {
    relevance_score: number;
    persuasion_score: number;
    clarity_score: number;
    action_driving_potential: number;
  };
  a_b_test_performance?: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagement_rate: number;
  };
}

export interface ContentFeedback {
  id: string;
  reviewer: string;
  rating: number; // 1-5
  feedback_type: 'approval' | 'revision_request' | 'rejection';
  comments: string;
  specific_suggestions: {
    section: string;
    current_text: string;
    suggested_text: string;
    reason: string;
  }[];
  timestamp: Date;
}

export interface ContentPerformanceMetrics {
  engagement: {
    views: number;
    time_on_page: number;
    scroll_depth: number;
    social_shares: number;
    comments: number;
  };
  conversion: {
    click_through_rate: number;
    conversion_rate: number;
    leads_generated: number;
    sales_attributed: number;
    revenue_attributed: number;
  };
  seo: {
    search_rankings: Record<string, number>;
    organic_traffic: number;
    backlinks_generated: number;
    featured_snippets: number;
  };
  audience_response: {
    sentiment_analysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
    demographic_performance: Record<string, number>;
    feedback_themes: string[];
  };
}

export interface SmartChatbot {
  id: string;
  name: string;
  description: string;
  personality: {
    tone: 'professional' | 'friendly' | 'helpful' | 'expert' | 'casual';
    communication_style: 'direct' | 'conversational' | 'detailed' | 'concise';
    expertise_areas: string[];
    response_patterns: string[];
  };
  knowledge_base: {
    documents: KnowledgeDocument[];
    faqs: FAQ[];
    conversation_flows: ConversationFlow[];
    escalation_rules: EscalationRule[];
  };
  capabilities: {
    natural_language_understanding: boolean;
    multi_language_support: string[];
    sentiment_detection: boolean;
    intent_recognition: boolean;
    context_awareness: boolean;
    learning_enabled: boolean;
  };
  integration_settings: {
    platforms: ('website' | 'email' | 'slack' | 'teams' | 'whatsapp')[];
    crm_integration: boolean;
    calendar_integration: boolean;
    payment_integration: boolean;
    analytics_tracking: boolean;
  };
  performance_metrics: ChatbotMetrics;
  status: 'active' | 'training' | 'inactive' | 'maintenance';
  created_at: Date;
  updated_at: Date;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance_score: number;
  last_updated: Date;
  source: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  usage_count: number;
  effectiveness_score: number;
}

export interface ConversationFlow {
  id: string;
  name: string;
  trigger_conditions: TriggerCondition[];
  steps: ConversationStep[];
  success_criteria: string[];
  fallback_actions: string[];
}

export interface TriggerCondition {
  type: 'keyword' | 'intent' | 'sentiment' | 'user_type' | 'time' | 'page';
  condition: string;
  value: unknown;
}

export interface ConversationStep {
  id: string;
  type: 'message' | 'question' | 'action' | 'handoff' | 'form';
  content: string;
  options?: string[];
  next_steps: Record<string, string>; // option -> next_step_id
  ai_generated: boolean;
}

export interface EscalationRule {
  id: string;
  conditions: string[];
  action: 'human_handoff' | 'supervisor_alert' | 'priority_queue' | 'callback_request';
  target: string;
  message: string;
}

export interface ChatbotMetrics {
  conversations: {
    total: number;
    completed: number;
    abandoned: number;
    escalated: number;
    satisfaction_score: number;
  };
  performance: {
    response_time: number;
    resolution_rate: number;
    accuracy_score: number;
    user_retention: number;
  };
  learning: {
    new_intents_discovered: number;
    knowledge_gaps_identified: number;
    training_iterations: number;
    improvement_rate: number;
  };
}

export interface EmailCampaignTemplate {
  id: string;
  name: string;
  description: string;
  campaign_type: 'welcome' | 'nurture' | 'promotional' | 're_engagement' | 'educational' | 'event' | 'follow_up';
  target_segments: string[];
  personalization_rules: PersonalizationRule[];
  content_variants: EmailContentVariant[];
  automation_settings: {
    trigger_events: string[];
    send_conditions: TriggerCondition[];
    frequency_limits: {
      max_per_day: number;
      max_per_week: number;
      min_interval_hours: number;
    };
    optimization: {
      send_time_optimization: boolean;
      subject_line_testing: boolean;
      content_testing: boolean;
      automatic_optimization: boolean;
    };
  };
  performance_tracking: EmailCampaignMetrics;
  created_at: Date;
  updated_at: Date;
}

export interface PersonalizationRule {
  condition: string;
  content_modifications: Record<string, string>;
  priority: number;
}

export interface EmailContentVariant {
  id: string;
  name: string;
  subject_lines: string[];
  content: {
    preheader: string;
    header: string;
    body: string;
    call_to_action: string;
    footer: string;
  };
  design_settings: {
    template: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
    images: string[];
  };
  a_b_test_weight: number;
}

export interface EmailCampaignMetrics {
  delivery: {
    sent: number;
    delivered: number;
    bounced: number;
    delivery_rate: number;
  };
  engagement: {
    opens: number;
    unique_opens: number;
    clicks: number;
    unique_clicks: number;
    open_rate: number;
    click_rate: number;
  };
  conversion: {
    conversions: number;
    revenue: number;
    conversion_rate: number;
    revenue_per_email: number;
  };
  list_health: {
    unsubscribes: number;
    spam_complaints: number;
    list_growth: number;
    engagement_score: number;
  };
}

export interface DynamicPricingEngine {
  id: string;
  name: string;
  description: string;
  pricing_strategies: PricingStrategy[];
  factors: PricingFactor[];
  rules: PricingRule[];
  optimization_settings: {
    objectives: ('revenue' | 'profit' | 'market_share' | 'customer_acquisition')[];
    constraints: PricingConstraint[];
    update_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    a_b_testing: boolean;
  };
  performance_metrics: PricingMetrics;
  status: 'active' | 'testing' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface PricingStrategy {
  id: string;
  name: string;
  type: 'cost_plus' | 'value_based' | 'competitive' | 'dynamic' | 'penetration' | 'skimming';
  base_price: number;
  modifiers: PricingModifier[];
  target_segments: string[];
  conditions: TriggerCondition[];
}

export interface PricingFactor {
  name: string;
  type: 'demand' | 'competition' | 'cost' | 'seasonality' | 'customer_value' | 'inventory';
  weight: number;
  data_source: string;
  update_frequency: string;
}

export interface PricingRule {
  id: string;
  conditions: TriggerCondition[];
  action: 'increase' | 'decrease' | 'set_fixed' | 'apply_discount' | 'add_premium';
  value: number;
  value_type: 'percentage' | 'fixed_amount';
  priority: number;
}

export interface PricingModifier {
  type: 'discount' | 'premium' | 'tier_based' | 'volume_based' | 'time_based';
  value: number;
  conditions: string[];
}

export interface PricingConstraint {
  type: 'minimum_price' | 'maximum_price' | 'margin_requirement' | 'competitor_parity';
  value: number;
  enforcement: 'hard' | 'soft';
}

export interface PricingMetrics {
  revenue_impact: {
    total_revenue: number;
    revenue_change: number;
    profit_margin: number;
    price_elasticity: number;
  };
  market_response: {
    demand_change: number;
    customer_acquisition: number;
    customer_retention: number;
    market_share: number;
  };
  optimization: {
    price_changes: number;
    successful_optimizations: number;
    revenue_lift: number;
    conversion_impact: number;
  };
}

export interface ContentOptimizationInsight {
  id: string;
  content_id: string;
  insight_type: 'performance' | 'optimization' | 'trend' | 'opportunity' | 'issue';
  category: 'engagement' | 'conversion' | 'seo' | 'readability' | 'personalization';
  title: string;
  description: string;
  recommendations: ContentRecommendation[];
  impact_potential: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  supporting_data: Record<string, unknown>;
  ai_generated: boolean;
  generated_at: Date;
}

export interface ContentRecommendation {
  action: string;
  description: string;
  expected_impact: string;
  implementation_effort: 'low' | 'medium' | 'high';
  timeline: string;
  success_metrics: string[];
  risk_factors: string[];
}

export interface SmartContentConfig {
  content_generation: {
    default_models: string[];
    quality_thresholds: {
      min_readability_score: number;
      min_relevance_score: number;
      min_originality_score: number;
    };
    auto_approval: {
      enabled: boolean;
      confidence_threshold: number;
      content_types: string[];
    };
  };
  chatbot: {
    response_time_target: number; // milliseconds
    escalation_thresholds: {
      sentiment_threshold: number;
      confusion_threshold: number;
      repetition_limit: number;
    };
    learning: {
      auto_learning: boolean;
      feedback_integration: boolean;
      knowledge_update_frequency: string;
    };
  };
  email_campaigns: {
    send_time_optimization: boolean;
    automatic_segmentation: boolean;
    content_personalization: boolean;
    deliverability_optimization: boolean;
  };
  dynamic_pricing: {
    update_frequency: string;
    safety_limits: {
      max_price_change_percent: number;
      min_approval_threshold: number;
    };
    market_data_sources: string[];
  };
}

export interface SmartContentResponse<T = unknown> {
  success: boolean;
  data?: T;
  insights?: ContentOptimizationInsight[];
  recommendations?: ContentRecommendation[];
  performance_metrics?: Record<string, number>;
  optimization_suggestions?: string[];
  error?: string;
  metadata: {
    timestamp: Date;
    processing_time: number;
    ai_model_used: string;
    confidence_score: number;
    personalization_applied: boolean;
  };
}
