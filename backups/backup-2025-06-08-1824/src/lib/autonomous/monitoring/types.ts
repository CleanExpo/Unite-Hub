/**
 * Autonomous Monitoring & Self-Healing Infrastructure Types
 * Unite Group - Version 14.0 Phase 1 Implementation
 */

export interface AutonomousMonitoringFramework {
  // System Health Monitoring
  monitorSystemHealth(): Promise<SystemHealthReport>;
  detectAnomalies(metrics: SystemMetrics): Promise<AnomalyDetection>;
  predictFailures(data: HistoricalData): Promise<FailurePrediction>;
  assessSystemRisks(): Promise<RiskAssessment>;
  
  // Self-Healing Operations
  initiateAutoHealing(issue: DetectedIssue): Promise<HealingResult>;
  performRollback(deployment: FailedDeployment): Promise<RollbackResult>;
  optimizeResources(usage: ResourceUsage): Promise<OptimizationResult>;
  executeRecoveryPlan(plan: RecoveryPlan): Promise<RecoveryResult>;
  
  // Predictive Maintenance
  scheduleMaintenance(prediction: MaintenancePrediction): Promise<MaintenanceSchedule>;
  optimizeCapacity(forecast: CapacityForecast): Promise<CapacityPlan>;
  manageBackups(policy: BackupPolicy): Promise<BackupResult>;
  updateDependencies(analysis: DependencyAnalysis): Promise<UpdateResult>;
}

// Basic types that are used throughout the system
export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: Date;
}

export interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  metrics: SystemMetrics;
  anomalies: Anomaly[];
  recommendations: HealthRecommendation[];
  predictions: PredictiveInsight[];
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

export interface ApprovalProcess {
  required: boolean;
  levels: ApprovalLevel[];
  timeline: string;
  escalation: EscalationPath;
}

export interface ApprovalLevel {
  level: number;
  approver: string;
  role: string;
  timeout: number;
  required: boolean;
}

export interface EscalationPath {
  levels: EscalationLevel[];
  triggers: EscalationTrigger[];
  automation: boolean;
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
