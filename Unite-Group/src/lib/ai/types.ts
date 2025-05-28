/**
 * AI and Machine Learning Types for UNITE Group
 * 
 * This module defines types for AI-powered features including:
 * - Personalization engine
 * - Predictive analytics
 * - Content recommendations
 * - Customer segmentation
 * - Behavioral analysis
 */

// Base AI Configuration
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

// Quantum and classical layer types
export type ClassicalLayerType = 'dense' | 'convolutional' | 'recurrent' | 'transformer';
export type QuantumLayerType = 'parameterized_circuit' | 'variational_circuit' | 'quantum_data_encoding';

// Activation functions
export interface ActivationFunction {
  type: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';
  parameters?: Record<string, number>;
}

// Layer gradients for neural network training
export interface LayerGradients {
  weights: number[][];
  biases: number[];
}

// Recommendation Engine Types
export enum RecommendationAlgorithm {
  CONTENT_BASED = 'content_based',
  COLLABORATIVE_FILTERING = 'collaborative_filtering',
  POPULARITY_BASED = 'popularity_based',
  HYBRID = 'hybrid'
}

export interface ContentItem {
  id: string;
  type: 'article' | 'service' | 'case_study' | 'blog_post' | 'resource';
  title: string;
  description: string;
  categories: string[];
  serviceTypes?: string[];
  targetAudience?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  relatedPages?: string[];
  timeRelevance?: string[];
  viewCount: number;
  engagementMetrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
  mobileOptimized?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationRequest {
  userProfile: UserProfile;
  context: PersonalizationContext;
  availableContent: ContentItem[];
  maxRecommendations?: number;
  filters?: Record<string, unknown>;
}

export interface RecommendationResult {
  contentId: string;
  content: ContentItem;
  score: number;
  algorithm: RecommendationAlgorithm;
  reasons: string[];
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface RecommendationMetrics {
  userId: string;
  timestamp: string;
  algorithmUsed: RecommendationAlgorithm;
  recommendationCount: number;
  averageScore: number;
  averageConfidence: number;
  topCategory: string;
  context: PersonalizationContext;
}

// User Behavior Tracking (Enhanced)
export interface UserBehavior {
  id: string;
  user_id: string;
  session_id: string;
  event_type: BehaviorEventType;
  page_path: string;
  element_id?: string;
  duration?: number;
  scroll_depth?: number;
  click_coordinates?: { x: number; y: number };
  metadata: Record<string, unknown>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  // Additional fields for recommendation engine
  contentId?: string;
  engagementScore?: number;
  action_type?: string;
  target_id?: string;
  context?: Record<string, unknown>;
  device_type?: string;
  location?: string;
  value?: number;
}

export type BehaviorEventType = 
  | 'page_view'
  | 'click'
  | 'scroll'
  | 'form_submit'
  | 'form_abandon'
  | 'download'
  | 'search'
  | 'video_play'
  | 'video_pause'
  | 'consultation_request'
  | 'pricing_view'
  | 'contact_attempt'
  | 'session_start'
  | 'session_end'
  | 'bounce'
  | 'conversion';

// Enhanced User Profile for Recommendations
export interface UserProfile {
  userId: string;
  user_id: string;
  demographics?: {
    age_range?: string;
    location?: string;
    industry?: string;
    company_size?: string;
    job_title?: string;
  };
  preferences: {
    communication_frequency: 'high' | 'medium' | 'low';
    preferred_contact_method: 'email' | 'phone' | 'sms' | 'chat';
    content_types: string[];
    topics_of_interest: string[];
    consultation_preferences: {
      preferred_time: string;
      timezone: string;
      meeting_type: 'virtual' | 'in-person' | 'phone';
    };
  };
  behavior_patterns: {
    visit_frequency: number;
    avg_session_duration: number;
    pages_per_session: number;
    preferred_content_length: 'short' | 'medium' | 'long';
    engagement_score: number;
    conversion_likelihood: number;
  };
  // Additional fields for recommendation engine
  interests: string[];
  preferredServices: string[];
  experienceLevel: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  created_at: string;
  updated_at: string;
}

// Enhanced Personalization Context
export interface PersonalizationContext {
  user_id?: string;
  session_id: string;
  current_page: string;
  currentPage?: string; // Alternative naming
  referrer?: string;
  utm_parameters?: Record<string, string>;
  device_info: {
    type: 'desktop' | 'tablet' | 'mobile';
    os: string;
    browser: string;
  };
  deviceType?: 'desktop' | 'tablet' | 'mobile'; // Alternative naming
  location?: {
    country: string;
    region: string;
    city: string;
    timezone: string;
  };
  time_context: {
    timestamp: string;
    day_of_week: string;
    hour_of_day: number;
    is_business_hours: boolean;
  };
  timeOfDay?: string; // Alternative naming
  behavioral_signals: {
    pages_viewed_this_session: number;
    time_on_site: number;
    scroll_depth: number;
    interactions: number;
  };
}

// Content Recommendation System
export interface ContentRecommendation {
  id: string;
  user_id: string;
  content_type: 'blog_post' | 'case_study' | 'service' | 'resource' | 'consultation';
  content_id: string;
  title: string;
  description: string;
  url: string;
  relevance_score: number;
  confidence: number;
  reasoning: string[];
  recommendation_type: RecommendationType;
  expires_at?: string;
  created_at: string;
}

export type RecommendationType = 
  | 'trending'
  | 'similar_users'
  | 'content_based'
  | 'collaborative'
  | 'behavioral'
  | 'contextual'
  | 'seasonal'
  | 'follow_up';

// Customer Segmentation
export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  user_count: number;
  characteristics: {
    avg_engagement: number;
    conversion_rate: number;
    avg_value: number;
    preferred_services: string[];
    common_pain_points: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: unknown;
  weight: number;
}

// Predictive Models
export interface PredictionRequest {
  user_id: string;
  prediction_type: PredictionType;
  features: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface PredictionResult {
  prediction_type: PredictionType;
  predicted_value: unknown;
  confidence: number;
  probability_distribution?: Record<string, number>;
  feature_importance: Record<string, number>;
  explanation: string;
  model_version: string;
  created_at: string;
}

export type PredictionType = 
  | 'churn_risk'
  | 'conversion_likelihood'
  | 'lead_quality_score'
  | 'project_success_probability'
  | 'revenue_forecast'
  | 'optimal_pricing'
  | 'next_best_action'
  | 'engagement_prediction';

// Personalization Rules
export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  action: PersonalizationAction;
  priority: number;
  enabled: boolean;
  ab_test_group?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleCondition {
  type: 'segment' | 'behavior' | 'profile' | 'context' | 'prediction';
  field: string;
  operator: string;
  value: unknown;
  logical_operator?: 'AND' | 'OR';
  nested_conditions?: RuleCondition[];
}

export interface PersonalizationAction {
  type: 'content_swap' | 'layout_change' | 'cta_modify' | 'pricing_adjust' | 'recommendation_boost';
  target: string;
  parameters: Record<string, unknown>;
  fallback?: PersonalizationAction;
}

// AI Analytics and Insights
export interface AIInsight {
  id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  data_points: unknown[];
  recommendations: string[];
  affected_users?: number;
  potential_value?: number;
  created_at: string;
  status: 'active' | 'implemented' | 'dismissed';
}

export type InsightType = 
  | 'user_behavior_pattern'
  | 'content_performance'
  | 'conversion_opportunity'
  | 'churn_warning'
  | 'market_trend'
  | 'personalization_success'
  | 'automation_opportunity'
  | 'revenue_optimization';

// Automation Workflows
export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  execution_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: 'behavior' | 'time' | 'data_change' | 'prediction' | 'external_event';
  configuration: Record<string, unknown>;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: unknown;
  required: boolean;
}

export interface WorkflowAction {
  type: 'email_send' | 'notification_create' | 'tag_add' | 'segment_update' | 'task_create';
  configuration: Record<string, unknown>;
  delay?: number;
  retry_count?: number;
}

// ML Model Management
export interface MLModel {
  id: string;
  name: string;
  description: string;
  model_type: ModelType;
  version: string;
  algorithm: string;
  training_data_size: number;
  accuracy_metrics: Record<string, number>;
  feature_schema: Record<string, string>;
  deployment_status: 'training' | 'testing' | 'deployed' | 'deprecated';
  last_trained: string;
  created_at: string;
}

export type ModelType = 
  | 'classification'
  | 'regression'
  | 'clustering'
  | 'recommendation'
  | 'natural_language'
  | 'computer_vision'
  | 'time_series';

// Search and NLP
export interface SearchQuery {
  query: string;
  user_id?: string;
  filters?: Record<string, unknown>;
  context?: string;
  intent?: SearchIntent;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  url: string;
  content_type: string;
  relevance_score: number;
  highlighted_text?: string;
  metadata: Record<string, unknown>;
}

export type SearchIntent = 
  | 'informational'
  | 'navigational'
  | 'transactional'
  | 'commercial'
  | 'support'
  | 'consultation';

// A/B Testing for AI Features
export interface AIExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  feature_type: 'personalization' | 'recommendation' | 'prediction' | 'automation';
  variants: ExperimentVariant[];
  traffic_allocation: Record<string, number>;
  success_metrics: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  start_date: string;
  end_date?: string;
  results?: ExperimentResults;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  configuration: Record<string, unknown>;
  traffic_percentage: number;
}

export interface ExperimentResults {
  variant_results: Record<string, VariantResult>;
  winner?: string;
  confidence_level: number;
  statistical_significance: boolean;
  insights: string[];
}

export interface VariantResult {
  variant_id: string;
  participants: number;
  conversions: number;
  conversion_rate: number;
  metrics: Record<string, number>;
}

// Performance Metrics
export interface AIMetrics {
  model_performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    auc_roc?: number;
  };
  business_impact: {
    conversion_lift: number;
    engagement_improvement: number;
    revenue_impact: number;
    cost_savings: number;
  };
  system_performance: {
    response_time: number;
    throughput: number;
    error_rate: number;
    uptime: number;
  };
  user_satisfaction: {
    relevance_rating: number;
    click_through_rate: number;
    time_to_value: number;
    user_feedback_score: number;
  };
}
