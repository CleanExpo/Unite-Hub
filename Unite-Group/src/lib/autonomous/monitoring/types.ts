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

// Core System Health Types
export interface SystemHealthReport {
  id: string;
  timestamp: Date;
  overallHealth: HealthStatus;
  componentHealth: ComponentHealthMap;
  criticalIssues: CriticalIssue[];
  performanceMetrics: PerformanceMetrics;
  recommendations: HealthRecommendation[];
  predictiveInsights: PredictiveInsight[];
}

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'failure';

export interface ComponentHealthMap {
  [componentId: string]: ComponentHealth;
}

export interface ComponentHealth {
  componentId: string;
  componentType: ComponentType;
  status: HealthStatus;
  metrics: ComponentMetrics;
  alerts: Alert[];
  dependencies: ComponentDependency[];
  lastCheck: Date;
  uptime: UptimeMetrics;
}

export type ComponentType = 
  | 'api_gateway'
  | 'database'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'compute'
  | 'network'
  | 'security'
  | 'monitoring'
  | 'ai_service';

export interface ComponentMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  disk: ResourceMetric;
  network: NetworkMetric;
  requests: RequestMetric;
  errors: ErrorMetric;
  latency: LatencyMetric;
  throughput: ThroughputMetric;
}

export interface ResourceMetric {
  current: number;
  average: number;
  peak: number;
  threshold: number;
  unit: string;
  trend: TrendDirection;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export interface NetworkMetric {
  bandwidth: ResourceMetric;
  connections: number;
  packets: PacketMetric;
  latency: number;
  jitter: number;
}

export interface PacketMetric {
  sent: number;
  received: number;
  dropped: number;
  retransmitted: number;
}

export interface RequestMetric {
  total: number;
  successful: number;
  failed: number;
  rate: number;
  concurrency: number;
}

export interface ErrorMetric {
  count: number;
  rate: number;
  types: ErrorTypeCount[];
  severity: ErrorSeverityDistribution;
  recent: RecentError[];
}

export interface ErrorTypeCount {
  type: ErrorType;
  count: number;
  percentage: number;
}

export type ErrorType = 
  | 'timeout'
  | 'connection'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'business_logic'
  | 'system'
  | 'external_service';

export interface ErrorSeverityDistribution {
  critical: number;
  major: number;
  minor: number;
  warning: number;
  info: number;
}

export interface RecentError {
  timestamp: Date;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context: ErrorContext;
  resolved: boolean;
}

export type ErrorSeverity = 'critical' | 'major' | 'minor' | 'warning' | 'info';

export interface ErrorContext {
  component: string;
  operation: string;
  user?: string;
  requestId?: string;
  metadata: Record<string, any>;
}

export interface LatencyMetric {
  p50: number;
  p95: number;
  p99: number;
  average: number;
  max: number;
  distribution: LatencyDistribution;
}

export interface LatencyDistribution {
  buckets: LatencyBucket[];
  outliers: LatencyOutlier[];
}

export interface LatencyBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface LatencyOutlier {
  value: number;
  timestamp: Date;
  context: string;
}

export interface ThroughputMetric {
  current: number;
  average: number;
  peak: number;
  unit: string;
  capacity: number;
  utilization: number;
}

export interface UptimeMetrics {
  percentage: number;
  totalTime: number;
  downtime: number;
  incidents: UptimeIncident[];
  slaCompliance: SLACompliance;
}

export interface UptimeIncident {
  start: Date;
  end?: Date;
  duration?: number;
  severity: IncidentSeverity;
  cause: string;
  resolution: string;
  impact: IncidentImpact;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentImpact {
  affectedUsers: number;
  affectedComponents: string[];
  businessImpact: BusinessImpact;
  financialImpact: number;
}

export interface BusinessImpact {
  revenue: number;
  reputation: ReputationImpact;
  operations: OperationalImpact;
  compliance: ComplianceImpact;
}

export type ReputationImpact = 'none' | 'minor' | 'moderate' | 'significant' | 'severe';

export interface OperationalImpact {
  processesAffected: string[];
  productivityLoss: number;
  customerImpact: CustomerImpact;
}

export interface CustomerImpact {
  affectedCustomers: number;
  severityLevel: CustomerImpactSeverity;
  communicationSent: boolean;
  compensationRequired: boolean;
}

export type CustomerImpactSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'critical';

export interface ComplianceImpact {
  regulationsAffected: string[];
  reportingRequired: boolean;
  penaltyRisk: PenaltyRisk;
  auditImplications: string[];
}

export interface PenaltyRisk {
  likelihood: RiskLikelihood;
  estimatedAmount: number;
  mitigationActions: string[];
}

export type RiskLikelihood = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface SLACompliance {
  target: number;
  actual: number;
  status: SLAStatus;
  breaches: SLABreach[];
  creditsDue: number;
}

export type SLAStatus = 'compliant' | 'at_risk' | 'breached' | 'critical';

export interface SLABreach {
  timestamp: Date;
  duration: number;
  severity: BreachSeverity;
  impact: string;
  resolution: string;
}

export type BreachSeverity = 'minor' | 'major' | 'critical';

export interface Alert {
  id: string;
  timestamp: Date;
  type: AlertType;
  severity: AlertSeverity;
  component: string;
  message: string;
  details: AlertDetails;
  status: AlertStatus;
  acknowledged: boolean;
  assignee?: string;
}

export type AlertType = 
  | 'performance'
  | 'error_rate'
  | 'capacity'
  | 'security'
  | 'availability'
  | 'compliance'
  | 'prediction'
  | 'anomaly';

export type AlertSeverity = 'info' | 'warning' | 'minor' | 'major' | 'critical';

export interface AlertDetails {
  metric: string;
  threshold: number;
  actualValue: number;
  trend: TrendDirection;
  affectedResources: string[];
  suggestedActions: string[];
}

export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'closed' | 'suppressed';

export interface ComponentDependency {
  dependentComponent: string;
  dependencyType: DependencyType;
  criticality: DependencyCriticality;
  healthImpact: HealthImpact;
  failoverOptions: FailoverOption[];
}

export type DependencyType = 'required' | 'optional' | 'preferred' | 'fallback';
export type DependencyCriticality = 'low' | 'medium' | 'high' | 'critical';

export interface HealthImpact {
  performanceDegradation: number;
  availabilityImpact: number;
  functionalityLoss: string[];
  recoveryTime: number;
}

export interface FailoverOption {
  type: FailoverType;
  target: string;
  activationTime: number;
  capacityImpact: number;
  costImpact: number;
}

export type FailoverType = 'automatic' | 'manual' | 'circuit_breaker' | 'load_balancer';

export interface CriticalIssue {
  id: string;
  timestamp: Date;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  affectedComponents: string[];
  impact: IssueImpact;
  rootCause: RootCause;
  resolution: IssueResolution;
  escalation: EscalationLevel;
}

export type IssueSeverity = 'p1_critical' | 'p2_high' | 'p3_medium' | 'p4_low';

export type IssueCategory = 
  | 'performance'
  | 'availability'
  | 'security'
  | 'data_integrity'
  | 'functionality'
  | 'capacity'
  | 'compliance'
  | 'integration';

export interface IssueImpact {
  userImpact: UserImpact;
  businessImpact: BusinessImpact;
  systemImpact: SystemImpact;
  estimatedResolutionTime: number;
}

export interface UserImpact {
  affectedUsers: number;
  impactLevel: UserImpactLevel;
  features: string[];
  workaroundAvailable: boolean;
}

export type UserImpactLevel = 'none' | 'minor_inconvenience' | 'functionality_loss' | 'service_unavailable';

export interface SystemImpact {
  componentsDegraded: string[];
  performanceImpact: number;
  cascadingFailures: CascadingFailure[];
  recoveryComplexity: RecoveryComplexity;
}

export interface CascadingFailure {
  component: string;
  probability: number;
  timeToFailure: number;
  preventionActions: string[];
}

export type RecoveryComplexity = 'simple' | 'moderate' | 'complex' | 'critical';

export interface RootCause {
  category: RootCauseCategory;
  description: string;
  confidence: ConfidenceLevel;
  evidences: Evidence[];
  contributingFactors: ContributingFactor[];
}

export type RootCauseCategory = 
  | 'code_defect'
  | 'configuration_error'
  | 'infrastructure_failure'
  | 'external_dependency'
  | 'capacity_limit'
  | 'security_breach'
  | 'data_corruption'
  | 'human_error';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'confirmed';

export interface Evidence {
  type: EvidenceType;
  source: string;
  timestamp: Date;
  content: string;
  reliability: EvidenceReliability;
}

export type EvidenceType = 'log' | 'metric' | 'trace' | 'user_report' | 'monitoring_alert' | 'test_result';
export type EvidenceReliability = 'low' | 'medium' | 'high' | 'verified';

export interface ContributingFactor {
  factor: string;
  contribution: number;
  likelihood: number;
  mitigation: string;
}

export interface IssueResolution {
  status: ResolutionStatus;
  strategy: ResolutionStrategy;
  actions: ResolutionAction[];
  timeline: ResolutionTimeline;
  resources: RequiredResource[];
  risks: ResolutionRisk[];
}

export type ResolutionStatus = 
  | 'identified'
  | 'planning'
  | 'implementing'
  | 'testing'
  | 'deploying'
  | 'monitoring'
  | 'resolved'
  | 'verified';

export interface ResolutionStrategy {
  approach: ResolutionApproach;
  priority: ResolutionPriority;
  coordination: CoordinationPlan;
  communication: CommunicationStrategy;
}

export type ResolutionApproach = 
  | 'immediate_fix'
  | 'workaround'
  | 'gradual_recovery'
  | 'complete_rebuild'
  | 'fallback_activation';

export type ResolutionPriority = 'emergency' | 'urgent' | 'high' | 'normal' | 'low';

export interface CoordinationPlan {
  teams: ResponsibleTeam[];
  communication: TeamCommunication;
  escalation: TeamEscalation;
  decisionMaking: DecisionMakingProcess;
}

export interface ResponsibleTeam {
  team: string;
  role: TeamRole;
  members: TeamMember[];
  responsibilities: string[];
  availability: TeamAvailability;
}

export type TeamRole = 'incident_commander' | 'technical_lead' | 'communications' | 'subject_matter_expert' | 'support';

export interface TeamMember {
  name: string;
  role: string;
  skills: string[];
  availability: MemberAvailability;
  contactInfo: ContactInfo;
}

export interface MemberAvailability {
  status: AvailabilityStatus;
  timezone: string;
  workingHours: WorkingHours;
  onCallSchedule: OnCallSchedule;
}

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable' | 'on_call';

export interface WorkingHours {
  start: string;
  end: string;
  days: DayOfWeek[];
  exceptions: WorkingHourException[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WorkingHourException {
  date: Date;
  reason: string;
  alternativeAvailability?: AlternativeAvailability;
}

export interface AlternativeAvailability {
  start: string;
  end: string;
  contactMethod: string;
}

export interface OnCallSchedule {
  isOnCall: boolean;
  schedule: OnCallPeriod[];
  backupPersons: string[];
  escalationPath: string[];
}

export interface OnCallPeriod {
  start: Date;
  end: Date;
  level: OnCallLevel;
  responsibilities: string[];
}

export type OnCallLevel = 'primary' | 'secondary' | 'escalation' | 'manager';

export interface ContactInfo {
  email: string;
  phone: string;
  slack?: string;
  teams?: string;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  phone: string;
  relationship: string;
  availability: string;
}

export interface TeamAvailability {
  coverage: CoverageLevel;
  timezone: string;
  capacity: TeamCapacity;
  currentLoad: WorkloadLevel;
}

export type CoverageLevel = 'none' | 'limited' | 'business_hours' | 'extended' | 'twenty_four_seven';

export interface TeamCapacity {
  totalMembers: number;
  availableMembers: number;
  skillGaps: SkillGap[];
  maxConcurrentIncidents: number;
}

export interface SkillGap {
  skill: string;
  required: SkillLevel;
  available: SkillLevel;
  impact: SkillGapImpact;
}

export type SkillLevel = 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface SkillGapImpact {
  severity: ImpactSeverity;
  consequences: string[];
  mitigations: string[];
  trainingNeeded: TrainingNeed[];
}

export type ImpactSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface TrainingNeed {
  skill: string;
  duration: string;
  provider: string;
  cost: number;
  priority: TrainingPriority;
}

export type TrainingPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkloadLevel = 'idle' | 'light' | 'moderate' | 'heavy' | 'overloaded';

export interface TeamCommunication {
  channels: CommunicationChannel[];
  frequency: CommunicationFrequency;
  protocols: CommunicationProtocol[];
  escalation: CommunicationEscalation;
}

export interface CommunicationChannel {
  type: ChannelType;
  primary: boolean;
  participants: string[];
  purpose: ChannelPurpose;
}

export type ChannelType = 
  | 'slack'
  | 'teams'
  | 'email'
  | 'conference_call'
  | 'war_room'
  | 'incident_management'
  | 'status_page';

export type ChannelPurpose = 
  | 'coordination'
  | 'status_updates'
  | 'technical_discussion'
  | 'customer_communication'
  | 'management_updates'
  | 'external_communication';

export interface CommunicationFrequency {
  regular: UpdateFrequency;
  urgent: UpdateFrequency;
  milestone: boolean;
  stakeholderUpdates: StakeholderUpdateFrequency;
}

export interface UpdateFrequency {
  interval: string;
  conditions: UpdateCondition[];
  format: UpdateFormat;
}

export interface UpdateCondition {
  trigger: UpdateTrigger;
  threshold: number;
  action: string;
}

export type UpdateTrigger = 
  | 'time_elapsed'
  | 'status_change'
  | 'escalation'
  | 'customer_impact'
  | 'progress_milestone'
  | 'risk_change';

export type UpdateFormat = 'brief' | 'detailed' | 'executive_summary' | 'technical_report';

export interface StakeholderUpdateFrequency {
  executives: UpdateFrequency;
  customers: UpdateFrequency;
  partners: UpdateFrequency;
  regulators?: UpdateFrequency;
}

export interface CommunicationProtocol {
  situation: ProtocolSituation;
  steps: ProtocolStep[];
  templates: CommunicationTemplate[];
  approvals: ApprovalRequirement[];
}

export type ProtocolSituation = 
  | 'incident_declaration'
  | 'escalation'
  | 'customer_notification'
  | 'media_response'
  | 'regulatory_notification'
  | 'resolution_announcement';

export interface ProtocolStep {
  order: number;
  action: string;
  responsible: string;
  timeline: string;
  dependencies: string[];
}

export interface CommunicationTemplate {
  type: TemplateType;
  audience: TemplateAudience;
  content: string;
  variables: TemplateVariable[];
}

export type TemplateType = 
  | 'initial_notification'
  | 'status_update'
  | 'resolution_notice'
  | 'post_mortem'
  | 'apology'
  | 'compensation_offer';

export type TemplateAudience = 
  | 'internal_team'
  | 'customers'
  | 'executives'
  | 'media'
  | 'regulators'
  | 'partners';

export interface TemplateVariable {
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: string;
}

export type VariableType = 'string' | 'number' | 'date' | 'boolean' | 'list';

export interface ApprovalRequirement {
  level: ApprovalLevel;
  approver: string;
  timeframe: string;
  escalation: ApprovalEscalation;
}

export type ApprovalLevel = 'team_lead' | 'manager' | 'director' | 'executive' | 'legal' | 'compliance';

export interface ApprovalEscalation {
  timeToEscalate: string;
  escalationPath: string[];
  autoApprovalConditions: AutoApprovalCondition[];
}

export interface AutoApprovalCondition {
  condition: string;
  threshold: number;
  rationale: string;
}

export interface CommunicationEscalation {
  triggers: EscalationTrigger[];
  levels: CommunicationEscalationLevel[];
  automation: EscalationAutomation;
}

export interface EscalationTrigger {
  condition: string;
  threshold: number;
  timeframe: string;
  severity: TriggerSeverity;
}

export type TriggerSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CommunicationEscalationLevel {
  level: number;
  participants: string[];
  channels: ChannelType[];
  frequency: UpdateFrequency;
  authority: EscalationAuthority;
}

export interface EscalationAuthority {
  decisions: DecisionAuthority[];
  resources: ResourceAuthority[];
  communication: CommunicationAuthority[];
}

export interface DecisionAuthority {
  type: DecisionType;
  scope: string;
  limitations: string[];
}

export type DecisionType = 
  | 'technical_approach'
  | 'resource_allocation'
  | 'timeline_adjustment'
  | 'scope_change'
  | 'communication_strategy'
  | 'escalation_decision';

export interface ResourceAuthority {
  type: ResourceType;
  limit: ResourceLimit;
  approvalRequired: boolean;
}

export type ResourceType = 
  | 'personnel'
  | 'budget'
  | 'infrastructure'
  | 'vendor_services'
  | 'emergency_resources';

export interface ResourceLimit {
  amount: number;
  unit: string;
  timeframe: string;
  conditions: string[];
}

export interface CommunicationAuthority {
  audience: TemplateAudience;
  approval: boolean;
  restrictions: string[];
}

export interface EscalationAutomation {
  enabled: boolean;
  rules: AutomationRule[];
  notifications: AutomatedNotification[];
  actions: AutomatedAction[];
}

export interface AutomationRule {
  condition: string;
  action: string;
  delay: string;
  overrides: RuleOverride[];
}

export interface RuleOverride {
  condition: string;
  action: OverrideAction;
  authority: string;
}

export type OverrideAction = 'skip' | 'delay' | 'modify' | 'escalate' | 'abort';

export interface AutomatedNotification {
  trigger: NotificationTrigger;
  recipients: NotificationRecipient[];
  content: NotificationContent;
  delivery: DeliveryMethod[];
}

export interface NotificationTrigger {
  event: string;
  conditions: string[];
  delay: string;
  repeats: RepeatConfiguration;
}

export interface RepeatConfiguration {
  enabled: boolean;
  interval: string;
  maxRepeats: number;
  escalation: boolean;
}

export interface NotificationRecipient {
  type: RecipientType;
  identifier: string;
  role: string;
  conditions: RecipientCondition[];
}

export type RecipientType = 'individual' | 'team' | 'role' | 'distribution_list' | 'external';

export interface RecipientCondition {
  field: string;
  operator: string;
  value: string;
}

export interface NotificationContent {
  template: string;
  priority: NotificationPriority;
  format: ContentFormat;
  attachments: ContentAttachment[];
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
export type ContentFormat = 'text' | 'html' | 'markdown' | 'json';

export interface ContentAttachment {
  type: AttachmentType;
  source: string;
  required: boolean;
}

export type AttachmentType = 'log' | 'metric' | 'screenshot' | 'report' | 'document';

export interface DeliveryMethod {
  type: DeliveryType;
  priority: number;
  fallback: boolean;
  configuration: DeliveryConfiguration;
}

export type DeliveryType = 
  | 'email'
  | 'sms'
  | 'push_notification'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'phone_call';

export interface DeliveryConfiguration {
  endpoint?: string;
  credentials?: string;
  retries: number;
  timeout: string;
  formatting: FormatConfiguration;
}

export interface FormatConfiguration {
  template: string;
  variables: TemplateVariable[];
  encoding: string;
}

export interface AutomatedAction {
  trigger: ActionTrigger;
  action: ActionDefinition;
  conditions: ActionCondition[];
  safeguards: ActionSafeguard[];
}

export interface ActionTrigger {
  event: string;
  criteria: TriggerCriteria[];
  dependencies: ActionDependency[];
}

export interface TriggerCriteria {
  metric: string;
  operator: ComparisonOperator;
  value: number;
  duration: string;
}

export type ComparisonOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';

export interface ActionDependency {
  type: DependencyType;
  target: string;
  condition: string;
}

export interface ActionDefinition {
  type: ActionType;
  parameters: ActionParameter[];
  timeout: string;
  rollback: RollbackDefinition;
}

export type ActionType = 
  | 'scale_resource'
  | 'restart_service'
  | 'failover'
  | 'circuit_breaker'
  | 'rate_limit'
  | 'cache_clear'
  | 'config_update'
  | 'notification';

export interface ActionParameter {
  name: string;
  value: any;
  type: ParameterType;
  validation: ParameterValidation;
}

export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ParameterValidation {
  required: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  allowedValues?: any[];
}

export interface RollbackDefinition {
  enabled: boolean;
  conditions: RollbackCondition[];
  actions: RollbackAction[];
  timeout: string;
}

export interface RollbackCondition {
  metric: string;
  threshold: number;
  timeframe: string;
}

export interface RollbackAction {
  type: ActionType;
  parameters: ActionParameter[];
  order: number;
}

export interface ActionCondition {
  type: ConditionType;
  expression: string;
  required: boolean;
}

export type ConditionType = 'pre_condition' | 'post_condition' | 'ongoing_condition';

export interface ActionSafeguard {
  type: SafeguardType;
  configuration: SafeguardConfiguration;
  enforcement: EnforcementLevel;
}

export type SafeguardType = 
  | 'approval_required'
  | 'rate_limit'
  | 'resource_limit'
  | 'time_window'
  | 'dependency_check'
  | 'rollback_plan';

export interface SafeguardConfiguration {
  parameters: Record<string, any>;
  overrides: SafeguardOverride[];
  monitoring: SafeguardMonitoring;
}

export interface SafeguardOverride {
  condition: string;
  action: OverrideAction;
  authority: string;
  justification: string;
}

export interface SafeguardMonitoring {
  enabled: boolean;
  metrics: string[];
  alerts: SafeguardAlert[];
}

export interface SafeguardAlert {
  condition: string;
  severity: AlertSeverity;
  recipients: string[];
}

export type EnforcementLevel = 'advisory' | 'warning' | 'blocking' | 'strict';

export interface TeamEscalation {
  levels: EscalationLevel[];
  criteria: EscalationCriteria[];
  automation: EscalationAutomation;
}

export interface EscalationLevel {
  level: number;
  name: string;
  authority: EscalationAuthority;
  participants: EscalationParticipant[];
  timeframe: string;
}

export interface EscalationParticipant {
  role: string;
  name: string;
  contact: ContactInfo;
  availability: MemberAvailability;
  authority: ParticipantAuthority;
}

export interface ParticipantAuthority {
  decisions: string[];
  resources: ResourceAuthority[];
  approvals: string[];
}

export interface EscalationCriteria {
  trigger: string;
  threshold: number;
  timeframe: string;
  automatic: boolean;
}

export interface DecisionMakingProcess {
  framework:
