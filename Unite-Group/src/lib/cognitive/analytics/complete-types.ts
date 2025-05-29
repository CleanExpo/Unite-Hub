/**
 * Complete Cognitive Analytics Types
 * Unite Group - Version 14.0 Phase 2 Implementation
 * Advanced Cognitive Business Intelligence Framework
 */

import { AIProvider, AIRequest } from '@/lib/ai/gateway/types';

// =============================================================================
// CORE COGNITIVE ANALYTICS TYPES
// =============================================================================

export type CognitiveAnalyticsCapability = 
  | 'predictive_forecasting'
  | 'pattern_recognition'
  | 'anomaly_detection'
  | 'causal_inference'
  | 'sentiment_analysis'
  | 'behavior_prediction'
  | 'market_simulation'
  | 'risk_assessment'
  | 'optimization_recommendation'
  | 'trend_analysis'
  | 'competitive_intelligence'
  | 'customer_journey_mapping';

export type CognitiveModelType = 
  | 'ensemble_forecast'
  | 'neural_network'
  | 'decision_tree'
  | 'random_forest'
  | 'gradient_boosting'
  | 'time_series'
  | 'deep_learning'
  | 'reinforcement_learning'
  | 'transformer'
  | 'autoencoder'
  | 'gan'
  | 'hybrid_model';

export type CognitiveDataSource = 
  | 'user_behavior'
  | 'business_metrics'
  | 'market_data'
  | 'financial_records'
  | 'customer_feedback'
  | 'system_logs'
  | 'external_apis'
  | 'social_media'
  | 'competitor_data'
  | 'economic_indicators'
  | 'weather_data'
  | 'demographic_data';

export type CognitiveConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type CognitiveTimeframe = 
  | 'real_time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'long_term';

// =============================================================================
// PREDICTIVE ANALYTICS INTERFACES
// =============================================================================

export interface CognitivePrediction {
  id: string;
  type: CognitiveAnalyticsCapability;
  target: string;
  prediction: unknown;
  confidence: CognitiveConfidenceLevel;
  confidenceScore: number; // 0-100
  timeframe: CognitiveTimeframe;
  accuracy?: number;
  variance?: number;
  factors: CognitiveFactor[];
  alternatives: CognitiveAlternative[];
  risks: CognitiveRisk[];
  recommendations: CognitiveRecommendation[];
  metadata: CognitivePredictionMetadata;
  createdAt: string;
  expiresAt: string;
}

export interface CognitiveFactor {
  name: string;
  impact: number; // -100 to 100
  weight: number; // 0-100
  category: string;
  description: string;
  source: CognitiveDataSource;
  confidence: number;
}

export interface CognitiveAlternative {
  scenario: string;
  probability: number; // 0-100
  outcome: unknown;
  impact: number;
  description: string;
  requiredActions: string[];
}

export interface CognitiveRisk {
  id: string;
  type: CognitiveRiskType;
  severity: CognitiveRiskSeverity;
  probability: number; // 0-100
  impact: number; // 0-100
  description: string;
  mitigation: CognitiveRiskMitigation[];
  timeframe: CognitiveTimeframe;
}

export type CognitiveRiskType = 
  | 'market_volatility'
  | 'customer_churn'
  | 'revenue_decline'
  | 'operational_failure'
  | 'competitive_threat'
  | 'regulatory_change'
  | 'technology_disruption'
  | 'supply_chain_risk';

export type CognitiveRiskSeverity = 'negligible' | 'minor' | 'moderate' | 'major' | 'critical';

export interface CognitiveRiskMitigation {
  action: string;
  effectiveness: number; // 0-100
  cost: number;
  timeToImplement: number; // hours
  priority: number; // 1-10
}

export interface CognitiveRecommendation {
  id: string;
  type: CognitiveRecommendationType;
  priority: number; // 1-10
  impact: number; // 0-100
  confidence: number; // 0-100
  title: string;
  description: string;
  rationale: string;
  actions: CognitiveAction[];
  expectedOutcome: CognitiveOutcome;
  resources: CognitiveResource[];
  timeline: CognitiveTimeline;
  kpis: CognitiveKPI[];
}

export type CognitiveRecommendationType = 
  | 'optimization'
  | 'risk_mitigation'
  | 'growth_opportunity'
  | 'cost_reduction'
  | 'efficiency_improvement'
  | 'customer_retention'
  | 'market_expansion'
  | 'innovation_initiative';

export interface CognitiveAction {
  id: string;
  name: string;
  description: string;
  type: CognitiveActionType;
  priority: number;
  estimatedEffort: number; // hours
  estimatedCost: number;
  expectedROI: number;
  dependencies: string[];
  assignee?: string;
  deadline?: string;
}

export type CognitiveActionType = 
  | 'immediate'
  | 'strategic'
  | 'operational'
  | 'marketing'
  | 'product'
  | 'technology'
  | 'financial'
  | 'hr';

export interface CognitiveOutcome {
  metric: string;
  currentValue: number;
  targetValue: number;
  improvement: number; // percentage
  timeToAchieve: number; // days
  probability: number; // 0-100
}

export interface CognitiveResource {
  type: CognitiveResourceType;
  name: string;
  quantity: number;
  cost: number;
  availability: string;
  required: boolean;
}

export type CognitiveResourceType = 
  | 'personnel'
  | 'budget'
  | 'technology'
  | 'data'
  | 'infrastructure'
  | 'partners'
  | 'tools'
  | 'time';

export interface CognitiveTimeline {
  phases: CognitivePhase[];
  totalDuration: number; // days
  criticalPath: string[];
  milestones: CognitiveMilestone[];
}

export interface CognitivePhase {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number; // days
  dependencies: string[];
  deliverables: string[];
}

export interface CognitiveMilestone {
  name: string;
  date: string;
  description: string;
  criteria: string[];
  importance: number; // 1-10
}

export interface CognitiveKPI {
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  frequency: CognitiveTimeframe;
  threshold: CognitiveThreshold;
  trend: CognitiveTrend;
}

export interface CognitiveThreshold {
  warning: number;
  critical: number;
  optimal: number;
}

export type CognitiveTrend = 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'unknown';

export interface CognitivePredictionMetadata {
  modelType: CognitiveModelType;
  modelVersion: string;
  trainingData: CognitiveTrainingData;
  features: CognitiveFeature[];
  performance: CognitiveModelPerformance;
  lastTrained: string;
  nextUpdate: string;
}

export interface CognitiveTrainingData {
  sources: CognitiveDataSource[];
  recordCount: number;
  timeRange: {
    start: string;
    end: string;
  };
  quality: number; // 0-100
  completeness: number; // 0-100
}

export interface CognitiveFeature {
  name: string;
  type: CognitiveFeatureType;
  importance: number; // 0-100
  correlation: number; // -100 to 100
  transformation: string;
  description: string;
}

export type CognitiveFeatureType = 
  | 'numerical'
  | 'categorical'
  | 'temporal'
  | 'textual'
  | 'boolean'
  | 'ordinal'
  | 'nominal'
  | 'derived';

export interface CognitiveModelPerformance {
  accuracy: number; // 0-100
  precision: number; // 0-100
  recall: number; // 0-100
  f1Score: number; // 0-100
  auc: number; // 0-1
  rmse?: number;
  mae?: number;
  r2?: number;
  crossValidation: CognitiveCrossValidation;
}

export interface CognitiveCrossValidation {
  folds: number;
  scores: number[];
  mean: number;
  standardDeviation: number;
}

// =============================================================================
// BUSINESS INTELLIGENCE INTERFACES
// =============================================================================

export interface CognitiveBusinessInsight {
  id: string;
  type: CognitiveInsightType;
  severity: CognitiveInsightSeverity;
  title: string;
  summary: string;
  description: string;
  confidence: number; // 0-100
  impact: CognitiveBusinessImpact;
  timeframe: CognitiveTimeframe;
  categories: CognitiveInsightCategory[];
  metrics: CognitiveMetricInsight[];
  trends: CognitiveTrendInsight[];
  anomalies: CognitiveAnomalyInsight[];
  correlations: CognitiveCorrelationInsight[];
  recommendations: CognitiveRecommendation[];
  sources: CognitiveInsightSource[];
  createdAt: string;
  relevantUntil: string;
}

export type CognitiveInsightType = 
  | 'opportunity'
  | 'threat'
  | 'optimization'
  | 'trend'
  | 'anomaly'
  | 'correlation'
  | 'prediction'
  | 'recommendation';

export type CognitiveInsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CognitiveInsightCategory = 
  | 'revenue'
  | 'customer'
  | 'operational'
  | 'market'
  | 'competitive'
  | 'financial'
  | 'risk'
  | 'strategic';

export interface CognitiveBusinessImpact {
  financial: CognitiveFinancialImpact;
  operational: CognitiveOperationalImpact;
  strategic: CognitiveStrategicImpact;
  customer: CognitiveCustomerImpact;
  market: CognitiveMarketImpact;
}

export interface CognitiveFinancialImpact {
  revenue: CognitiveImpactMeasure;
  cost: CognitiveImpactMeasure;
  profit: CognitiveImpactMeasure;
  cashFlow: CognitiveImpactMeasure;
  roi: CognitiveImpactMeasure;
}

export interface CognitiveOperationalImpact {
  efficiency: CognitiveImpactMeasure;
  productivity: CognitiveImpactMeasure;
  quality: CognitiveImpactMeasure;
  resources: CognitiveImpactMeasure;
  processes: CognitiveImpactMeasure;
}

export interface CognitiveStrategicImpact {
  marketPosition: CognitiveImpactMeasure;
  competitiveAdvantage: CognitiveImpactMeasure;
  innovation: CognitiveImpactMeasure;
  growth: CognitiveImpactMeasure;
  sustainability: CognitiveImpactMeasure;
}

export interface CognitiveCustomerImpact {
  satisfaction: CognitiveImpactMeasure;
  retention: CognitiveImpactMeasure;
  acquisition: CognitiveImpactMeasure;
  lifetime_value: CognitiveImpactMeasure;
  loyalty: CognitiveImpactMeasure;
}

export interface CognitiveMarketImpact {
  share: CognitiveImpactMeasure;
  penetration: CognitiveImpactMeasure;
  expansion: CognitiveImpactMeasure;
  positioning: CognitiveImpactMeasure;
  timing: CognitiveImpactMeasure;
}

export interface CognitiveImpactMeasure {
  current: number;
  projected: number;
  change: number; // percentage
  confidence: number; // 0-100
  timeframe: CognitiveTimeframe;
}

export interface CognitiveMetricInsight {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage
  trend: CognitiveTrend;
  benchmark: number;
  target: number;
  variance: number;
  significance: number; // 0-100
}

export interface CognitiveTrendInsight {
  metric: string;
  direction: CognitiveTrendDirection;
  strength: number; // 0-100
  duration: number; // days
  acceleration: number;
  seasonality: CognitiveSeasonal;
  forecast: CognitiveForecast[];
}

export type CognitiveTrendDirection = 'upward' | 'downward' | 'sideways' | 'cyclical';

export interface CognitiveSeasonal {
  detected: boolean;
  pattern: string;
  strength: number; // 0-100
  period: number; // days
}

export interface CognitiveForecast {
  date: string;
  value: number;
  confidence: number; // 0-100
  range: {
    lower: number;
    upper: number;
  };
}

export interface CognitiveAnomalyInsight {
  metric: string;
  timestamp: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: CognitiveAnomalySeverity;
  type: CognitiveAnomalyType;
  explanation: string;
  possibleCauses: string[];
}

export type CognitiveAnomalySeverity = 'minor' | 'moderate' | 'major' | 'critical';

export type CognitiveAnomalyType = 
  | 'point'
  | 'contextual'
  | 'collective'
  | 'seasonal'
  | 'trend'
  | 'pattern';

export interface CognitiveCorrelationInsight {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  strength: CognitiveCorrelationStrength;
  significance: number; // 0-100
  causality: CognitiveCausality;
  lag: number; // days
  explanation: string;
}

export type CognitiveCorrelationStrength = 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';

export interface CognitiveCausality {
  direction: CognitiveCausalDirection;
  confidence: number; // 0-100
  evidence: string[];
  tests: CognitiveCausalTest[];
}

export type CognitiveCausalDirection = 'none' | 'x_causes_y' | 'y_causes_x' | 'bidirectional' | 'common_cause';

export interface CognitiveCausalTest {
  name: string;
  result: number;
  pValue: number;
  interpretation: string;
}

export interface CognitiveInsightSource {
  type: CognitiveDataSource;
  name: string;
  reliability: number; // 0-100
  recency: number; // hours ago
  coverage: number; // 0-100
  quality: number; // 0-100
}

// =============================================================================
// ANALYTICS ENGINE CONFIGURATION
// =============================================================================

export interface CognitiveAnalyticsConfig {
  capabilities: CognitiveAnalyticsCapability[];
  models: CognitiveModelConfig[];
  dataSources: CognitiveDataSourceConfig[];
  updateFrequency: CognitiveTimeframe;
  retentionPeriod: number; // days
  qualityThresholds: CognitiveQualityThresholds;
  alerting: CognitiveAlertingConfig;
  reporting: CognitiveReportingConfig;
  integration: CognitiveIntegrationConfig;
}

export interface CognitiveModelConfig {
  type: CognitiveModelType;
  enabled: boolean;
  parameters: Record<string, unknown>;
  retraining: CognitiveRetrainingConfig;
  performance: CognitivePerformanceConfig;
  validation: CognitiveValidationConfig;
}

export interface CognitiveRetrainingConfig {
  frequency: CognitiveTimeframe;
  triggerConditions: CognitiveTriggerCondition[];
  dataRequirements: CognitiveDataRequirements;
  validation: CognitiveModelValidation;
}

export interface CognitiveTriggerCondition {
  metric: string;
  threshold: number;
  operator: CognitiveOperator;
  timeframe: CognitiveTimeframe;
}

export type CognitiveOperator = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';

export interface CognitiveDataRequirements {
  minimumRecords: number;
  maximumAge: number; // days
  qualityScore: number; // 0-100
  completeness: number; // 0-100
  sources: CognitiveDataSource[];
}

export interface CognitiveModelValidation {
  holdoutPercentage: number; // 0-100
  crossValidationFolds: number;
  minimumAccuracy: number; // 0-100
  performanceMetrics: string[];
}

export interface CognitivePerformanceConfig {
  targets: CognitivePerformanceTarget[];
  monitoring: CognitiveMonitoringConfig;
  optimization: CognitiveOptimizationConfig;
}

export interface CognitivePerformanceTarget {
  metric: string;
  target: number;
  weight: number; // 0-100
  tolerance: number;
}

export interface CognitiveMonitoringConfig {
  enabled: boolean;
  frequency: CognitiveTimeframe;
  metrics: string[];
  alerts: CognitiveAlertConfig[];
}

export interface CognitiveAlertConfig {
  name: string;
  condition: CognitiveTriggerCondition;
  severity: CognitiveInsightSeverity;
  recipients: string[];
  actions: CognitiveAlertAction[];
}

export interface CognitiveAlertAction {
  type: CognitiveActionType;
  description: string;
  automated: boolean;
  parameters: Record<string, unknown>;
}

export interface CognitiveOptimizationConfig {
  enabled: boolean;
  strategy: CognitiveOptimizationStrategy;
  parameters: CognitiveOptimizationParameters;
  constraints: CognitiveOptimizationConstraint[];
}

export type CognitiveOptimizationStrategy = 
  | 'bayesian'
  | 'genetic_algorithm'
  | 'gradient_descent'
  | 'random_search'
  | 'grid_search'
  | 'evolutionary';

export interface CognitiveOptimizationParameters {
  maxIterations: number;
  convergenceThreshold: number;
  populationSize?: number;
  mutationRate?: number;
  crossoverRate?: number;
  learningRate?: number;
}

export interface CognitiveOptimizationConstraint {
  parameter: string;
  min?: number;
  max?: number;
  values?: unknown[];
  condition: string;
}

export interface CognitiveValidationConfig {
  enabled: boolean;
  methods: CognitiveValidationMethod[];
  thresholds: CognitiveValidationThreshold[];
  reporting: boolean;
}

export type CognitiveValidationMethod = 
  | 'holdout'
  | 'cross_validation'
  | 'bootstrap'
  | 'time_series_split'
  | 'stratified'
  | 'leave_one_out';

export interface CognitiveValidationThreshold {
  metric: string;
  minimum: number;
  target: number;
  maximum?: number;
}

export interface CognitiveDataSourceConfig {
  source: CognitiveDataSource;
  enabled: boolean;
  connection: CognitiveConnectionConfig;
  transformation: CognitiveTransformationConfig;
  quality: CognitiveQualityConfig;
  security: CognitiveSecurityConfig;
}

export interface CognitiveConnectionConfig {
  endpoint?: string;
  authentication: CognitiveAuthConfig;
  rateLimit: CognitiveRateLimitConfig;
  retry: CognitiveRetryConfig;
  timeout: number; // milliseconds
}

export interface CognitiveAuthConfig {
  type: CognitiveAuthType;
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: string;
}

export type CognitiveAuthType = 
  | 'none'
  | 'api_key'
  | 'oauth'
  | 'jwt'
  | 'basic'
  | 'custom';

export interface CognitiveRateLimitConfig {
  enabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

export interface CognitiveRetryConfig {
  enabled: boolean;
  maxRetries: number;
  backoffStrategy: CognitiveBackoffStrategy;
  retryableErrors: string[];
}

export type CognitiveBackoffStrategy = 'linear' | 'exponential' | 'fixed' | 'random';

export interface CognitiveTransformationConfig {
  enabled: boolean;
  steps: CognitiveTransformationStep[];
  validation: boolean;
  errorHandling: CognitiveErrorHandling;
}

export interface CognitiveTransformationStep {
  name: string;
  type: CognitiveTransformationType;
  parameters: Record<string, unknown>;
  required: boolean;
  order: number;
}

export type CognitiveTransformationType = 
  | 'cleaning'
  | 'normalization'
  | 'standardization'
  | 'encoding'
  | 'aggregation'
  | 'filtering'
  | 'mapping'
  | 'derivation';

export interface CognitiveErrorHandling {
  strategy: CognitiveErrorStrategy;
  fallback: CognitiveFallbackStrategy;
  logging: boolean;
  alerting: boolean;
}

export type CognitiveErrorStrategy = 'fail_fast' | 'continue' | 'retry' | 'fallback';
export type CognitiveFallbackStrategy = 'skip' | 'default_value' | 'interpolate' | 'previous_value';

export interface CognitiveQualityConfig {
  enabled: boolean;
  checks: CognitiveQualityCheck[];
  thresholds: CognitiveQualityThresholds;
  reporting: boolean;
}

export interface CognitiveQualityCheck {
  name: string;
  type: CognitiveQualityCheckType;
  parameters: Record<string, unknown>;
  severity: CognitiveInsightSeverity;
  enabled: boolean;
}

export type CognitiveQualityCheckType = 
  | 'completeness'
  | 'accuracy'
  | 'consistency'
  | 'validity'
  | 'uniqueness'
  | 'timeliness'
  | 'conformity'
  | 'integrity';

export interface CognitiveQualityThresholds {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  validity: number; // 0-100
  uniqueness: number; // 0-100
  timeliness: number; // hours
  overall: number; // 0-100
}

export interface CognitiveSecurityConfig {
  enabled: boolean;
  encryption: CognitiveEncryptionConfig;
  access: CognitiveAccessConfig;
  auditing: CognitiveAuditingConfig;
  compliance: CognitiveComplianceConfig;
}

export interface CognitiveEncryptionConfig {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyRotation: CognitiveKeyRotationConfig;
}

export interface CognitiveKeyRotationConfig {
  enabled: boolean;
  frequency: CognitiveTimeframe;
  provider: string;
  backup: boolean;
}

export interface CognitiveAccessConfig {
  authentication: boolean;
  authorization: boolean;
  roleBasedAccess: boolean;
  ipWhitelist: string[];
  sessionTimeout: number; // minutes
}

export interface CognitiveAuditingConfig {
  enabled: boolean;
  events: CognitiveAuditEvent[];
  retention: number; // days
  compliance: boolean;
}

export type CognitiveAuditEvent = 
  | 'access'
  | 'modification'
  | 'deletion'
  | 'export'
  | 'analysis'
  | 'prediction'
  | 'configuration';

export interface CognitiveComplianceConfig {
  frameworks: CognitiveComplianceFramework[];
  dataLocalization: boolean;
  rightToForgotten: boolean;
  consentManagement: boolean;
  privacyByDesign: boolean;
}

export type CognitiveComplianceFramework = 
  | 'GDPR'
  | 'CCPA'
  | 'HIPAA'
  | 'SOC2'
  | 'ISO27001'
  | 'AICPA'
  | 'AUSTRALIAN_PRIVACY';

export interface CognitiveAlertingConfig {
  enabled: boolean;
  channels: CognitiveAlertChannel[];
  escalation: CognitiveEscalationConfig;
  throttling: CognitiveThrottlingConfig;
}

export interface CognitiveAlertChannel {
  type: CognitiveChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  priority: number;
}

export type CognitiveChannelType = 
  | 'email'
  | 'sms'
  | 'slack'
  | 'webhook'
  | 'dashboard'
  | 'mobile';

export interface CognitiveEscalationConfig {
  enabled: boolean;
  levels: CognitiveEscalationLevel[];
  timeout: number; // minutes
}

export interface CognitiveEscalationLevel {
  level: number;
  recipients: string[];
  delay: number; // minutes
  channels: CognitiveChannelType[];
}

export interface CognitiveThrottlingConfig {
  enabled: boolean;
  maxAlertsPerHour: number;
  groupingSimilar: boolean;
  suppressDuplicates: boolean;
}

export interface CognitiveReportingConfig {
  enabled: boolean;
  schedule: CognitiveReportSchedule[];
  templates: CognitiveReportTemplate[];
  distribution: CognitiveDistributionConfig;
}

export interface CognitiveReportSchedule {
  name: string;
  frequency: CognitiveTimeframe;
  time: string; // HH:MM
  timezone: string;
  recipients: string[];
  template: string;
}

export interface CognitiveReportTemplate {
  name: string;
  type: CognitiveReportType;
  sections: CognitiveReportSection[];
  format: CognitiveReportFormat;
  customization: Record<string, unknown>;
}

export type CognitiveReportType = 
  | 'executive_summary'
  | 'detailed_analysis'
  | 'performance_dashboard'
  | 'trend_analysis'
  | 'anomaly_report'
  | 'forecast_report'
  | 'custom';

export interface CognitiveReportSection {
  name: string;
  type: CognitiveReportSectionType;
  content: unknown;
  visualization: CognitiveVisualizationConfig;
  order: number;
}

export type CognitiveReportSectionType = 
  | 'summary'
  | 'metrics'
  | 'charts'
  | 'tables'
  | 'insights'
  | 'recommendations'
  | 'appendix';

export interface CognitiveVisualizationConfig {
  type: CognitiveVisualizationType;
  options: Record<string, unknown>;
  interactivity: boolean;
  responsive: boolean;
}

export type CognitiveVisualizationType = 
  | 'line_chart'
  | 'bar_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'pie_chart'
  | 'gauge'
  | 'table'
  | 'text';

export type CognitiveReportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'excel';

export interface CognitiveDistributionConfig {
  channels: CognitiveChannelType[];
  storage: CognitiveStorageConfig;
  access: CognitiveAccessConfig;
  retention: number; // days
}

export interface CognitiveStorageConfig {
  enabled: boolean;
  location: string;
  encryption: boolean;
  compression: boolean;
  backup: boolean;
}

export interface CognitiveIntegrationConfig {
  apis: CognitiveAPIIntegration[];
  webhooks: CognitiveWebhookConfig[];
  streaming: CognitiveStreamingConfig;
  batch: CognitiveBatchConfig;
  monitoring: CognitiveIntegrationMonitoring;
}

export interface CognitiveAPIIntegration {
  name: string;
  endpoint: string;
  authentication: CognitiveAuthConfig;
  operations: CognitiveAPIOperation[];
  rateLimit: CognitiveRateLimitConfig;
  fallback: CognitiveFallbackConfig;
  enabled: boolean;
}

export interface CognitiveAPIOperation {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  parameters: CognitiveAPIParameter[];
  responseMapping: Record<string, string>;
  timeout: number;
}

export interface CognitiveAPIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  validation?: string;
}

export interface CognitiveFallbackConfig {
  enabled: boolean;
  strategy: 'cache' | 'mock' | 'alternative_api' | 'graceful_degradation';
  configuration: Record<string, unknown>;
}

export interface CognitiveWebhookConfig {
  name: string;
  url: string;
  events: string[];
  authentication: CognitiveAuthConfig;
  retries: CognitiveRetryConfig;
  enabled: boolean;
}

export interface CognitiveStreamingConfig {
  enabled: boolean;
  protocols: CognitiveStreamingProtocol[];
  bufferSize: number;
  compression: boolean;
  encryption: boolean;
}

export type CognitiveStreamingProtocol = 'websocket' | 'sse' | 'grpc' | 'kafka' | 'rabbitmq';

export interface CognitiveBatchConfig {
  enabled: boolean;
  batchSize: number;
  frequency: CognitiveTimeframe;
  compression: boolean;
  encryption: boolean;
  retries: CognitiveRetryConfig;
}

export interface CognitiveIntegrationMonitoring {
  enabled: boolean;
  metrics: CognitiveIntegrationMetric[];
  alerting: CognitiveAlertingConfig;
  logging: CognitiveLoggingConfig;
}

export interface CognitiveIntegrationMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  labels: string[];
  threshold?: CognitiveThreshold;
}

export interface CognitiveLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'external';
  retention: number; // days
}

// =============================================================================
// SERVICE INTERFACES
// =============================================================================

export interface CognitiveAnalyticsEngine {
  // Core analytics methods
  generatePrediction(request: CognitivePredictionRequest): Promise<CognitivePrediction>;
  analyzeData(data: unknown[], options: CognitiveAnalysisOptions): Promise<CognitiveBusinessInsight[]>;
  detectAnomalies(metrics: CognitiveMetricData[], options?: CognitiveAnomalyOptions): Promise<CognitiveAnomalyInsight[]>;
  generateInsights(context: CognitiveAnalysisContext): Promise<CognitiveBusinessInsight[]>;
  
  // Model management
  trainModel(modelConfig: CognitiveModelConfig, data: CognitiveTrainingData): Promise<CognitiveModelResult>;
  validateModel(modelId: string, validationData: unknown[]): Promise<CognitiveModelPerformance>;
  deployModel(modelId: string, config: CognitiveDeploymentConfig): Promise<boolean>;
  
  // Configuration and monitoring
  updateConfiguration(config: Partial<CognitiveAnalyticsConfig>): Promise<void>;
  getHealth(): Promise<CognitiveEngineHealth>;
  getMetrics(): Promise<CognitiveEngineMetrics>;
}

export interface CognitivePredictionRequest {
  type: CognitiveAnalyticsCapability;
  target: string;
  data: unknown[];
  options?: CognitivePredictionOptions;
  timeframe: CognitiveTimeframe;
  confidence?: number;
}

export interface CognitivePredictionOptions {
  modelType?: CognitiveModelType;
  features?: string[];
  parameters?: Record<string, unknown>;
  validation?: boolean;
  explanation?: boolean;
}

export interface CognitiveAnalysisOptions {
  capabilities: CognitiveAnalyticsCapability[];
  depth: 'basic' | 'standard' | 'comprehensive';
  timeRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, unknown>;
  groupBy?: string[];
}

export interface CognitiveAnomalyOptions {
  sensitivity: number; // 0-100
  methods: CognitiveAnomalyType[];
  timeWindow: number; // hours
  threshold?: number;
}

export interface CognitiveAnalysisContext {
  businessContext: CognitiveBusinessContext;
  dataContext: CognitiveDataContext;
  userContext?: CognitiveUserContext;
  timeContext: CognitiveTimeContext;
}

export interface CognitiveBusinessContext {
  industry: string;
  businessModel: string;
  marketSegment: string;
  objectives: string[];
  constraints: string[];
}

export interface CognitiveDataContext {
  sources: CognitiveDataSource[];
  quality: CognitiveQualityThresholds;
  completeness: number;
  freshness: number; // hours
  volume: number; // records
}

export interface CognitiveUserContext {
  role: string;
  permissions: string[];
  preferences: Record<string, unknown>;
  history: CognitiveUserHistory[];
}

export interface CognitiveUserHistory {
  action: string;
  timestamp: string;
  context: Record<string, unknown>;
  outcome?: string;
}

export interface CognitiveTimeContext {
  current: string;
  timezone: string;
  businessHours: CognitiveBusinessHours;
  seasonality: CognitiveSeasonal;
}

export interface CognitiveBusinessHours {
  start: string; // HH:MM
  end: string; // HH:MM
  days: number[]; // 0-6, Sunday-Saturday
  timezone: string;
}

export interface CognitiveMetricData {
  name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CognitiveModelResult {
  modelId: string;
  status: 'training' | 'completed' | 'failed';
  performance?: CognitiveModelPerformance;
  artifacts: CognitiveModelArtifact[];
  errors?: string[];
}

export interface CognitiveModelArtifact {
  type: 'model_file' | 'metadata' | 'performance_report' | 'feature_importance';
  path: string;
  size: number;
  checksum: string;
  createdAt: string;
}

export interface CognitiveDeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  scaling: CognitiveScalingConfig;
  monitoring: CognitiveMonitoringConfig;
  rollback: CognitiveRollbackConfig;
}

export interface CognitiveScalingConfig {
  minInstances: number;
  maxInstances: number;
  targetCPU: number; // percentage
  targetMemory: number; // percentage
  scaleUpCooldown: number; // seconds
  scaleDownCooldown: number; // seconds
}

export interface CognitiveRollbackConfig {
  enabled: boolean;
  conditions: CognitiveTriggerCondition[];
  strategy: 'immediate' | 'gradual' | 'canary';
  preserveData: boolean;
}

export interface CognitiveEngineHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: CognitiveServiceHealth[];
  dependencies: CognitiveDependencyHealth[];
  lastChecked: string;
  uptime: number; // seconds
}

export interface CognitiveServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  details?: Record<string, unknown>;
}

export interface CognitiveDependencyHealth {
  name: string;
  type: 'database' | 'api' | 'cache' | 'queue' | 'file_system';
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number; // milliseconds
  availability: number; // percentage
}

export interface CognitiveEngineMetrics {
  performance: CognitivePerformanceMetrics;
  usage: CognitiveUsageMetrics;
  quality: CognitiveQualityMetrics;
  costs: CognitiveCostMetrics;
  trends: CognitiveTrendMetrics;
}

export interface CognitivePerformanceMetrics {
  averageResponseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  availability: number; // percentage
  resourceUtilization: CognitiveResourceUtilization;
}

export interface CognitiveResourceUtilization {
  cpu: number; // percentage
  memory: number; // percentage
  storage: number; // percentage
  network: number; // percentage
}

export interface CognitiveUsageMetrics {
  totalRequests: number;
  activeUsers: number;
  topCapabilities: CognitiveCapabilityUsage[];
  geographic: CognitiveGeographicUsage[];
  temporal: CognitiveTemporalUsage[];
}

export interface CognitiveCapabilityUsage {
  capability: CognitiveAnalyticsCapability;
  requests: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface CognitiveGeographicUsage {
  region: string;
  requests: number;
  users: number;
  averageResponseTime: number;
}

export interface CognitiveTemporalUsage {
  period: string;
  requests: number;
  users: number;
  peakHour: string;
  trends: CognitiveTrend;
}

export interface CognitiveQualityMetrics {
  dataQuality: CognitiveQualityThresholds;
  modelAccuracy: number;
  predictionReliability: number;
  insightRelevance: number;
  userSatisfaction: number;
}

export interface CognitiveCostMetrics {
  totalCost: number;
  costPerRequest: number;
  costByCapability: CognitiveCapabilityCost[];
  costTrends: CognitiveCostTrend[];
  optimization: CognitiveCostOptimization;
}

export interface CognitiveCapabilityCost {
  capability: CognitiveAnalyticsCapability;
  cost: number;
  volume: number;
  efficiency: number;
}

export interface CognitiveCostTrend {
  period: string;
  cost: number;
  change: number; // percentage
  drivers: string[];
}

export interface CognitiveCostOptimization {
  opportunities: CognitiveOptimizationOpportunity[];
  potentialSavings: number;
  recommendations: CognitiveRecommendation[];
}

export interface CognitiveOptimizationOpportunity {
  area: string;
  impact: number; // percentage
  effort: 'low' | 'medium' | 'high';
  savings: number;
  description: string;
}

export interface CognitiveTrendMetrics {
  growth: CognitiveGrowthMetrics;
  adoption: CognitiveAdoptionMetrics;
  satisfaction: CognitiveSatisfactionMetrics;
  innovation: CognitiveInnovationMetrics;
}

export interface CognitiveGrowthMetrics {
  userGrowth: number; // percentage
  usageGrowth: number; // percentage
  revenueGrowth: number; // percentage
  marketShare: number; // percentage
}

export interface CognitiveAdoptionMetrics {
  featureAdoption: CognitiveFeatureAdoption[];
  userSegmentation: CognitiveUserSegment[];
  churnRate: number; // percentage
  retentionRate: number; // percentage
}

export interface CognitiveFeatureAdoption {
  feature: string;
  adoptionRate: number; // percentage
  timeToAdopt: number; // days
  userFeedback: number; // 1-5 scale
}

export interface CognitiveUserSegment {
  segment: string;
  size: number;
  characteristics: Record<string, unknown>;
  behavior: CognitiveUserBehavior;
}

export interface CognitiveUserBehavior {
  frequency: number; // requests per day
  duration: number; // average session minutes
  features: string[];
  satisfaction: number; // 1-5 scale
}

export interface CognitiveSatisfactionMetrics {
  overallSatisfaction: number; // 1-5 scale
  nps: number; // Net Promoter Score
  featureSatisfaction: CognitiveFeatureSatisfaction[];
  supportSatisfaction: number; // 1-5 scale
}

export interface CognitiveFeatureSatisfaction {
  feature: string;
  satisfaction: number; // 1-5 scale
  usage: number; // percentage of users
  feedback: string[];
}

export interface CognitiveInnovationMetrics {
  experimentCount: number;
  successRate: number; // percentage
  timeToMarket: number; // days
  impactScore: number; // 1-10 scale
}
