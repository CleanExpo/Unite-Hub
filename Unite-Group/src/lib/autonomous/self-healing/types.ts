/**
 * Self-Healing Infrastructure Types
 * Unite Group - Version 14.0 Phase 1 Implementation
 */

// Core Self-Healing Types
export interface SelfHealingEngine {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  capabilities: HealingCapability[];
  configuration: HealingConfiguration;
  performance: HealingPerformance;
}

export interface HealingCapability {
  type: 'automatic_recovery' | 'performance_optimization' | 'security_response' | 'capacity_scaling' | 'dependency_management';
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
  successRate: number;
  lastUsed?: Date;
  conditions: HealingCondition[];
}

export interface HealingCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'matches';
  threshold: number | string;
  duration?: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealingConfiguration {
  enabled: boolean;
  automationLevel: 'none' | 'advisory' | 'semi_automated' | 'fully_automated';
  safeguards: HealingSafeguard[];
  restrictions: HealingRestriction[];
  notifications: NotificationConfig[];
  rollbackPolicy: RollbackPolicy;
  learningEnabled: boolean;
}

export interface HealingSafeguard {
  type: 'approval_required' | 'rate_limit' | 'time_window' | 'resource_limit' | 'impact_assessment';
  name: string;
  configuration: Record<string, any>;
  enforcement: 'advisory' | 'warning' | 'blocking';
  override: {
    allowed: boolean;
    roles: string[];
    approval: boolean;
  };
}

export interface HealingRestriction {
  type: 'time_based' | 'resource_based' | 'service_based' | 'environment_based';
  conditions: string[];
  exceptions: string[];
  priority: number;
}

export interface NotificationConfig {
  channel: 'email' | 'slack' | 'teams' | 'webhook' | 'sms';
  events: string[];
  recipients: string[];
  template: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RollbackPolicy {
  enabled: boolean;
  conditions: string[];
  timeout: number; // seconds
  verification: {
    checks: string[];
    timeout: number;
  };
  cascade: boolean;
}

export interface HealingPerformance {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  averageResponseTime: number;
  lastAction?: Date;
  efficiency: {
    preventedIncidents: number;
    costSavings: number;
    downtimePrevented: number; // seconds
    automationRate: number; // percentage
  };
}

// Healing Action Types
export interface HealingAction {
  id: string;
  type: HealingActionType;
  name: string;
  description: string;
  target: HealingTarget;
  parameters: Record<string, any>;
  preconditions: HealingCondition[];
  postconditions: HealingCondition[];
  rollback?: HealingAction;
  risk: RiskLevel;
  estimatedDuration: number;
  dependencies: string[];
}

export type HealingActionType = 
  | 'restart_service'
  | 'scale_resources'
  | 'clear_cache'
  | 'reset_connections'
  | 'update_configuration'
  | 'redistribute_load'
  | 'isolate_component'
  | 'switch_failover'
  | 'optimize_database'
  | 'clean_storage'
  | 'update_dependencies'
  | 'apply_security_patch'
  | 'custom_script';

export interface HealingTarget {
  type: 'service' | 'container' | 'database' | 'cache' | 'load_balancer' | 'api_gateway' | 'storage' | 'network';
  identifier: string;
  scope: 'single' | 'multiple' | 'cluster' | 'global';
  location: string;
}

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Healing Execution Types
export interface HealingExecution {
  id: string;
  actionId: string;
  trigger: HealingTrigger;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result: HealingExecutionResult;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

export interface HealingTrigger {
  type: 'automatic' | 'manual' | 'scheduled' | 'threshold' | 'anomaly';
  source: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
}

export type ExecutionStatus = 
  | 'pending'
  | 'approved'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'cancelled'
  | 'timeout';

export interface HealingExecutionResult {
  success: boolean;
  message: string;
  changes: ChangeRecord[];
  verification: VerificationResult;
  impact: ImpactAssessment;
  recommendations: string[];
}

export interface ChangeRecord {
  component: string;
  property: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  reversible: boolean;
}

export interface VerificationResult {
  passed: boolean;
  checks: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
    timestamp: Date;
  }[];
  overallScore: number;
}

export interface ImpactAssessment {
  performance: {
    improvement: number; // percentage
    degradation: number; // percentage
    stability: number; // 0-1 scale
  };
  availability: {
    uptime: number; // percentage
    downtime: number; // seconds
    serviceImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  };
  resources: {
    cpu: number; // percentage change
    memory: number; // percentage change
    storage: number; // percentage change
    network: number; // percentage change
  };
  cost: {
    immediate: number; // dollars
    ongoing: number; // dollars per month
    savings: number; // dollars
  };
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warning' | 'error';
  component: string;
  message: string;
  context?: Record<string, any>;
}

export interface ExecutionMetrics {
  startTime: Date;
  endTime?: Date;
  duration: number; // milliseconds
  steps: StepMetric[];
  resourceUsage: ResourceUsageMetric;
  performance: PerformanceMetric;
}

export interface StepMetric {
  name: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'skipped';
  output?: any;
}

export interface ResourceUsageMetric {
  cpu: { avg: number; peak: number; unit: string };
  memory: { avg: number; peak: number; unit: string };
  network: { inbound: number; outbound: number; unit: string };
  storage: { read: number; write: number; unit: string };
}

export interface PerformanceMetric {
  throughput: number;
  latency: { avg: number; p95: number; p99: number };
  errorRate: number;
  availability: number;
}

// Learning and Optimization Types
export interface HealingLearning {
  patternRecognition: PatternLearning;
  effectivenessAnalysis: EffectivenessLearning;
  optimizationSuggestions: OptimizationSuggestion[];
  adaptiveThresholds: AdaptiveThreshold[];
}

export interface PatternLearning {
  patterns: IdentifiedPattern[];
  correlations: Correlation[];
  predictions: PredictivePattern[];
  confidence: number;
}

export interface IdentifiedPattern {
  id: string;
  type: 'recurring_issue' | 'cascade_failure' | 'performance_degradation' | 'resource_spike';
  description: string;
  frequency: number;
  conditions: string[];
  outcomes: string[];
  confidence: number;
}

export interface Correlation {
  variables: string[];
  strength: number; // -1 to 1
  type: 'positive' | 'negative' | 'complex';
  significance: number;
}

export interface PredictivePattern {
  pattern: string;
  likelihood: number;
  timeframe: string;
  preventiveActions: string[];
}

export interface EffectivenessLearning {
  actionEffectiveness: ActionEffectiveness[];
  successFactors: SuccessFactor[];
  failureAnalysis: FailureAnalysis[];
  recommendations: LearningRecommendation[];
}

export interface ActionEffectiveness {
  actionType: HealingActionType;
  successRate: number;
  averageImpact: number;
  optimalConditions: string[];
  riskFactors: string[];
  improvementSuggestions: string[];
}

export interface SuccessFactor {
  factor: string;
  impact: number;
  consistency: number;
  applicability: string[];
}

export interface FailureAnalysis {
  failureType: string;
  causes: string[];
  frequency: number;
  impact: string;
  prevention: string[];
}

export interface LearningRecommendation {
  type: 'threshold_adjustment' | 'action_modification' | 'new_capability' | 'process_improvement';
  description: string;
  rationale: string;
  expectedBenefit: string;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OptimizationSuggestion {
  category: 'performance' | 'reliability' | 'cost' | 'security' | 'compliance';
  suggestion: string;
  rationale: string;
  impact: {
    performance: number;
    cost: number;
    risk: number;
    effort: number;
  };
  priority: number;
  timeline: string;
}

export interface AdaptiveThreshold {
  metric: string;
  currentThreshold: number;
  suggestedThreshold: number;
  confidence: number;
  rationale: string;
  testPeriod: number; // days
}

// Predictive Healing Types
export interface PredictiveHealing {
  predictions: HealingPrediction[];
  recommendations: PreventiveAction[];
  scheduling: HealingSchedule;
  monitoring: PredictiveMonitoring;
}

export interface HealingPrediction {
  id: string;
  type: 'failure_prediction' | 'performance_degradation' | 'capacity_limit' | 'security_threat';
  description: string;
  probability: number;
  timeframe: string;
  confidence: number;
  impact: string;
  preventable: boolean;
  actions: string[];
}

export interface PreventiveAction {
  id: string;
  predictionId: string;
  action: HealingAction;
  timing: {
    optimal: Date;
    latest: Date;
    window: number; // hours
  };
  approval: {
    required: boolean;
    approvers: string[];
    deadline?: Date;
  };
  cost: {
    prevention: number;
    remediation: number;
    savings: number;
  };
}

export interface HealingSchedule {
  scheduledActions: ScheduledHealingAction[];
  maintenanceWindows: MaintenanceWindow[];
  conflicts: ScheduleConflict[];
  optimization: ScheduleOptimization;
}

export interface ScheduledHealingAction {
  id: string;
  actionId: string;
  scheduledTime: Date;
  duration: number;
  priority: number;
  dependencies: string[];
  resources: RequiredResource[];
  approval: ApprovalStatus;
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  start: Date;
  end: Date;
  type: 'regular' | 'emergency' | 'planned';
  allowedActions: HealingActionType[];
  restrictions: string[];
  impact: string;
}

export interface ScheduleConflict {
  type: 'resource_conflict' | 'dependency_conflict' | 'timing_conflict';
  actions: string[];
  description: string;
  resolution: string[];
  priority: number;
}

export interface ScheduleOptimization {
  currentEfficiency: number;
  optimizedSchedule: ScheduledHealingAction[];
  improvements: string[];
  savings: {
    time: number;
    cost: number;
    resources: number;
  };
}

export interface RequiredResource {
  type: 'compute' | 'storage' | 'network' | 'human' | 'time';
  amount: number;
  unit: string;
  availability: 'available' | 'limited' | 'unavailable';
  cost: number;
}

export interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approver?: string;
  timestamp?: Date;
  comments?: string;
  conditions?: string[];
}

export interface PredictiveMonitoring {
  indicators: PredictiveIndicator[];
  alerts: PredictiveAlert[];
  thresholds: DynamicThreshold[];
  models: PredictiveModel[];
}

export interface PredictiveIndicator {
  name: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  prediction: {
    shortTerm: number; // next hour
    mediumTerm: number; // next day
    longTerm: number; // next week
  };
  confidence: number;
  accuracy: number;
}

export interface PredictiveAlert {
  id: string;
  type: 'early_warning' | 'trend_alert' | 'anomaly_prediction' | 'threshold_approach';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  prediction: HealingPrediction;
  actions: string[];
  deadline?: Date;
}

export interface DynamicThreshold {
  metric: string;
  baseThreshold: number;
  currentThreshold: number;
  adjustment: {
    factor: number;
    reason: string;
    confidence: number;
  };
  history: ThresholdChange[];
}

export interface ThresholdChange {
  timestamp: Date;
  oldValue: number;
  newValue: number;
  reason: string;
  impact: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'statistical' | 'machine_learning' | 'deep_learning' | 'ensemble';
  accuracy: number;
  predictions: string[];
  lastTrained: Date;
  performance: ModelPerformance;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositives: number;
  falseNegatives: number;
  predictions: number;
}

// Additional interfaces needed for complete-service.ts
export interface SelfHealingConfig {
  monitoring: {
    interval: number;
    enabled: boolean;
  };
  prediction: Record<string, any>;
  recovery: Record<string, any>;
  optimization: Record<string, any>;
  logging: Record<string, any>;
}

export interface SystemHealthMetrics {
  componentId: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical';
  metrics: Record<string, any>;
  trend: 'improving' | 'stable' | 'degrading';
  alertLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  metrics: Record<string, any>;
  suggestions: string[];
}

export interface RecoveryAction {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  component: string;
  description: string;
  estimatedDuration: number;
  automated: boolean;
  rollbackPossible: boolean;
}

export interface FailurePrediction {
  component: string;
  failureType: string;
  confidence: number;
  timeframe: string;
  impact: string;
}

export interface AutomatedResponse {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
  conditions: string[];
}

export interface SystemOptimization {
  id: string;
  type: string;
  description: string;
  impact: string;
  implementation: string;
}

export interface PerformanceMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  availability: number;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  actions: RecoveryAction[];
  conditions: string[];
  priority: number;
}

export interface SelfHealingEvent {
  type: string;
  message: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  component: string;
  data?: any;
}

export interface ComponentHealth {
  componentId: string;
  status: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastCheck: Date;
}
