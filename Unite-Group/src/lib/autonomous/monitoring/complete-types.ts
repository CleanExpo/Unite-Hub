/**
 * Autonomous Monitoring & Self-Healing Infrastructure - Complete Types
 * Unite Group - Version 14.0 Phase 1 Implementation
 */

// Core Framework Types
export interface AutonomousMonitoringFramework {
  id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  capabilities: string[];
  configuration: MonitoringConfiguration;
  performance: SystemPerformance;
}

export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  metrics: SystemMetrics;
  anomalies: Anomaly[];
  recommendations: HealthRecommendation[];
  predictions: PredictiveInsight[];
}

// Core Missing Types for Autonomous Monitoring Framework
export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: Date;
}

export interface AnomalyDetection {
  detected: boolean;
  anomalies: Anomaly[];
  confidence: number;
  timestamp: Date;
}

export interface Anomaly {
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HistoricalData {
  metrics: SystemMetrics[];
  timeRange: TimeRange;
  aggregation: 'minute' | 'hour' | 'day';
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface FailurePrediction {
  probability: number;
  timeToFailure: number;
  affectedComponents: string[];
  confidence: number;
  preventionActions: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  mitigationStrategies: string[];
}

export interface Risk {
  type: string;
  probability: number;
  impact: number;
  description: string;
}

export interface DetectedIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  component: string;
  timestamp: Date;
}

export interface HealingResult {
  success: boolean;
  actions: string[];
  timestamp: Date;
  duration: number;
}

export interface FailedDeployment {
  deploymentId: string;
  version: string;
  component: string;
  failureReason: string;
  timestamp: Date;
}

export interface RollbackResult {
  success: boolean;
  previousVersion: string;
  rollbackTime: number;
  affectedServices: string[];
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: Date;
}

export interface OptimizationResult {
  optimized: boolean;
  changes: OptimizationChange[];
  expectedImprovement: number;
}

export interface OptimizationChange {
  resource: string;
  action: string;
  oldValue: number;
  newValue: number;
}

export interface RecoveryPlan {
  steps: RecoveryStep[];
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecoveryStep {
  order: number;
  action: string;
  component: string;
  estimatedTime: number;
}

export interface RecoveryResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  duration: number;
}

export interface MaintenancePrediction {
  component: string;
  maintenanceType: string;
  recommendedDate: Date;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceSchedule {
  id: string;
  tasks: MaintenanceTask[];
  scheduledDate: Date;
  estimatedDuration: number;
}

export interface MaintenanceTask {
  name: string;
  component: string;
  estimatedTime: number;
  dependencies: string[];
}

export interface CapacityForecast {
  component: string;
  currentCapacity: number;
  forecastedUsage: number;
  recommendedCapacity: number;
  timeframe: string;
}

export interface CapacityPlan {
  recommendations: CapacityRecommendation[];
  totalCost: number;
  implementation: ImplementationPlan;
}

export interface CapacityRecommendation {
  component: string;
  action: 'scale_up' | 'scale_down' | 'maintain';
  currentCapacity: number;
  recommendedCapacity: number;
  cost: number;
}

export interface ImplementationPlan {
  phases: PlanPhase[];
  totalDuration: number;
  dependencies: string[];
}

export interface PlanPhase {
  name: string;
  duration: number;
  actions: string[];
  prerequisites: string[];
}

export interface BackupPolicy {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: RetentionPolicy;
  components: string[];
}

export interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  size: number;
  duration: number;
  timestamp: Date;
}

export interface DependencyAnalysis {
  dependencies: Dependency[];
  outdated: OutdatedDependency[];
  vulnerabilities: Vulnerability[];
}

export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'transitive';
  critical: boolean;
}

export interface OutdatedDependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  securityIssues: boolean;
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fixAvailable: boolean;
}

export interface UpdateResult {
  success: boolean;
  updatedDependencies: string[];
  failedUpdates: string[];
  testResults: TestResult[];
}

export interface TestResult {
  test: string;
  passed: boolean;
  duration: number;
  details?: string;
}

export interface PerformanceMetrics {
  response: ResponseMetrics;
  throughput: ThroughputMetrics;
  resource: ResourceMetrics;
  user: UserMetrics;
}

export interface ResponseMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
}

export interface ThroughputMetrics {
  requestsPerSecond: number;
  transactionsPerSecond: number;
  dataProcessed: number;
}

export interface ResourceMetrics {
  cpu: ResourceUsage;
  memory: ResourceUsage;
  disk: ResourceUsage;
  network: ResourceUsage;
}

export interface UserMetrics {
  activeUsers: number;
  sessionDuration: number;
  bounceRate: number;
  satisfaction: number;
}

export interface HealthRecommendation {
  type: 'optimization' | 'security' | 'maintenance' | 'upgrade';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedBenefit: string;
  estimatedEffort: number;
}

export interface PredictiveInsight {
  category: 'performance' | 'capacity' | 'security' | 'maintenance';
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ResolutionAction {
  id: string;
  type: 'immediate' | 'scheduled' | 'manual';
  description: string;
  responsible: string;
  estimatedTime: number;
  dependencies: string[];
}

export interface ResolutionTimeline {
  start: Date;
  estimatedCompletion: Date;
  milestones: Milestone[];
  dependencies: TimelineDependency[];
}

export interface Milestone {
  name: string;
  date: Date;
  deliverables: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface TimelineDependency {
  task: string;
  dependsOn: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
}

export interface RequiredResource {
  type: 'human' | 'system' | 'budget' | 'time';
  description: string;
  quantity: number;
  availability: 'available' | 'limited' | 'unavailable';
  cost?: number;
}

export interface ResolutionRisk {
  description: string;
  probability: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export type CommunicationChannel = 'email' | 'slack' | 'teams' | 'webhook' | 'dashboard' | 'sms';

export interface CommunicationStrategy {
  stakeholders: Stakeholder[];
  channels: CommunicationChannel[];
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  templates: MessageTemplate[];
}

export interface Stakeholder {
  name: string;
  role: string;
  interest: 'high' | 'medium' | 'low';
  influence: 'high' | 'medium' | 'low';
  communication: ContactMethod[];
}

export interface ContactMethod {
  type: 'email' | 'phone' | 'slack' | 'teams' | 'sms';
  address: string;
  priority: number;
}

export interface MessageTemplate {
  type: 'incident' | 'update' | 'resolution' | 'prevention';
  audience: string;
  template: string;
  variables: string[];
}

export interface DecisionMakingProcess {
  framework: 'consensus' | 'autocratic' | 'consultative' | 'delegated';
  decisionMakers: DecisionMaker[];
  criteria: DecisionCriteria[];
  approval: ApprovalProcess;
}

export interface DecisionMaker {
  name: string;
  role: string;
  authority: 'advisory' | 'decision' | 'veto' | 'approval';
  availability: 'always' | 'business_hours' | 'on_call' | 'scheduled';
}

export interface DecisionCriteria {
  factor: string;
  weight: number;
  measurement: string;
  threshold?: number;
}

export interface ApprovalLevel {
  level: number;
  approver: string;
  role: string;
  timeout: number;
  required: boolean;
}

export interface EscalationLevel {
  level: number;
  contact: string;
  method: 'email' | 'phone' | 'slack' | 'sms';
  timeout: number;
}

export interface EscalationTrigger {
  condition: string;
  threshold: number;
  action: string;
  automatic: boolean;
}

export interface ApprovalProcess {
  required: boolean;
  levels: ApprovalLevel[];
  timeline: string;
  escalation: EscalationPath;
}

export interface EscalationPath {
  levels: EscalationLevel[];
  triggers: EscalationTrigger[];
  automation: boolean;
}

// Additional Infrastructure Types
export interface MonitoringConfiguration {
  enabled: boolean;
  interval: number;
  thresholds: MonitoringThreshold[];
  alerts: AlertConfiguration[];
}

export interface MonitoringThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface AlertConfiguration {
  type: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  notifications: NotificationRule[];
}

export interface NotificationRule {
  channel: string;
  recipients: string[];
  template: string;
  delay?: number;
}

export interface SelfHealingConfiguration {
  enabled: boolean;
  actions: HealingAction[];
  safeguards: Safeguard[];
  reporting: ReportingConfiguration;
}

export interface HealingAction {
  trigger: string;
  action: string;
  parameters: Record<string, unknown>;
  timeout: number;
  rollback?: string;
}

export interface Safeguard {
  type: 'rate_limit' | 'approval_required' | 'time_window' | 'resource_limit';
  configuration: Record<string, unknown>;
  enforcement: 'advisory' | 'warning' | 'blocking';
}

export interface ReportingConfiguration {
  enabled: boolean;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  recipients: string[];
  format: 'summary' | 'detailed' | 'dashboard';
}

// Autonomous Operations Core Types
export interface AutonomousSystem {
  id: string;
  name: string;
  type: 'monitoring' | 'healing' | 'optimization' | 'prediction';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  capabilities: SystemCapability[];
  performance: SystemPerformance;
}

export interface SystemCapability {
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
  lastUsed?: Date;
}

export interface SystemPerformance {
  uptime: number;
  accuracy: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

// Model Management Types
export interface ModelEnsemble {
  id: string;
  models: AIModel[];
  strategy: 'voting' | 'weighted' | 'cascade' | 'stacking';
  performance: EnsemblePerformance;
}

export interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'clustering' | 'anomaly_detection';
  status: 'active' | 'training' | 'deprecated' | 'testing';
  metrics: ModelMetrics;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  latency: number;
  throughput: number;
}

export interface EnsemblePerformance {
  accuracy: number;
  reliability: number;
  coverage: number;
  consistency: number;
}

export interface ModelDeployment {
  modelId: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  status: 'deploying' | 'active' | 'rollback' | 'failed';
  configuration: DeploymentConfiguration;
}

export interface DeploymentConfiguration {
  replicas: number;
  resources: ResourceAllocation;
  scaling: ScalingConfiguration;
  monitoring: ModelMonitoring;
}

export interface ResourceAllocation {
  cpu: string;
  memory: string;
  gpu?: string;
  storage: string;
}

export interface ScalingConfiguration {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  targetCPU: number;
  targetMemory: number;
}

export interface ModelMonitoring {
  metrics: string[];
  alerts: ModelAlert[];
  dashboards: string[];
  logging: LoggingConfiguration;
}

export interface ModelAlert {
  metric: string;
  condition: string;
  threshold: number;
  action: string;
}

export interface LoggingConfiguration {
  level: 'debug' | 'info' | 'warning' | 'error';
  destinations: string[];
  retention: string;
  format: 'json' | 'structured' | 'plain';
}
