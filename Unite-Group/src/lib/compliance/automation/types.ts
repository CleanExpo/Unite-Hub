/**
 * Compliance Automation & Regulatory Suite Types
 * Unite Group - Version 13.0 Phase 3 Implementation
 */

// Basic shared types
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type ImpactSeverity = 'minimal' | 'minor' | 'moderate' | 'major' | 'severe';
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'not_started' | 'in_progress' | 'completed' | 'non_compliant' | 'exception';
export type ValidationStatus = 'compliant' | 'non_compliant' | 'partial' | 'pending';
export type ImplementationStatus = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type UpdateStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial';
export type ReportFormat = 'pdf' | 'html' | 'json' | 'excel';
export type EntityType = 'business_unit' | 'system' | 'process' | 'geography' | 'legal_entity';
export type RegulatoryType = 'financial' | 'privacy' | 'security' | 'environmental' | 'safety' | 'tax' | 'employment';
export type SubmissionStatus = 'submitted' | 'accepted' | 'rejected' | 'under_review' | 'approved';
export type DeadlineFrequency = 'one_time' | 'monthly' | 'quarterly' | 'annually' | 'on_demand';
export type DeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'cancelled';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
export type RequirementType = 'reporting' | 'disclosure' | 'compliance' | 'certification' | 'audit';
export type ActivityType = 'data_access' | 'configuration_change' | 'policy_update' | 'user_action' | 'system_event';
export type MessageType = 'announcement' | 'reminder' | 'alert' | 'training' | 'update';
export type ViolationSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type RequirementCategory = 'privacy' | 'security' | 'financial' | 'operational' | 'environmental' | 'safety';
export type EvidenceType = 'document' | 'log' | 'screenshot' | 'recording' | 'certificate' | 'report';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensating';
export type ControlCategory = 'administrative' | 'technical' | 'physical';
export type EffectivenessRating = 'ineffective' | 'partially_effective' | 'effective' | 'highly_effective';
export type DeficiencySeverity = 'low' | 'medium' | 'high' | 'critical';
export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'delayed';
export type ResourceType = 'personnel' | 'technology' | 'infrastructure' | 'training' | 'consulting';
export type TestingFrequency = 'continuous' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
export type TestingMethodology = 'automated' | 'manual' | 'walkthrough' | 'inspection' | 'observation';
export type TestOutcome = 'passed' | 'failed' | 'partial' | 'inconclusive';
export type FindingSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type AssessmentType = 'gap_analysis' | 'maturity_assessment' | 'risk_assessment' | 'audit_readiness' | 'compliance_review';
export type AssessmentMethodology = 'documentary_review' | 'interviews' | 'testing' | 'observation' | 'sampling';
export type ComplianceRating = 'non_compliant' | 'partially_compliant' | 'substantially_compliant' | 'fully_compliant';
export type DataQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AttachmentType = 'supporting_document' | 'evidence' | 'calculation' | 'certification';
export type CertificationType = 'management_certification' | 'auditor_certification' | 'legal_certification';
export type IssueType = 'data_quality' | 'completeness' | 'accuracy' | 'format' | 'compliance';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type ControlProcessingStatus = 'updated' | 'failed' | 'skipped' | 'pending';
export type ChangeType = 'addition' | 'modification' | 'deletion' | 'clarification';
export type PolicyProcessingStatus = 'updated' | 'failed' | 'pending' | 'requires_approval';
export type ComparisonOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
export type ArchivalFormat = 'json' | 'xml' | 'csv' | 'binary' | 'encrypted';
export type AuditApproach = 'risk_based' | 'compliance_based' | 'process_based' | 'system_based';
export type SamplingType = 'random' | 'systematic' | 'stratified' | 'judgmental' | 'statistical';
export type CheckpointStatus = 'pending' | 'completed' | 'failed' | 'skipped';

// Core interfaces
export interface Recommendation {
  priority: PriorityLevel;
  category: string;
  description: string;
  implementation: ImplementationGuidance;
  impact: string;
}

export interface ImplementationGuidance {
  steps: string[];
  timeline: string;
  resources: string[];
  dependencies: string[];
}

export interface AssessmentScope {
  frameworks: string[];
  businessUnits: string[];
  systems: string[];
  processes: string[];
  geographies: string[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  location: string;
  collectedDate: Date;
  retentionPeriod: string;
  classification: DataClassification;
}

export interface ResourceAvailability {
  available: boolean;
  availableFrom?: Date;
  constraints: string[];
}

// Main framework interface
export interface ComplianceAutomationFramework {
  // Automated Compliance Monitoring
  monitorCompliance(frameworks: ComplianceFramework[]): Promise<ComplianceMonitoringResult>;
  generateComplianceReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
  trackComplianceMetrics(timeframe: string): Promise<ComplianceMetrics>;
  validateComplianceStatus(entity: ComplianceEntity): Promise<ComplianceValidation>;
  
  // Automated Regulatory Reporting
  generateRegulatoryReport(regulation: RegulatoryFramework, data: RegulatoryData): Promise<RegulatoryReport>;
  submitRegulatoryFiling(report: RegulatoryReport): Promise<SubmissionResult>;
  trackRegulatoryDeadlines(jurisdiction: string): Promise<RegulatoryDeadline[]>;
  validateRegulatoryCompliance(requirement: RegulatoryRequirement): Promise<RegulatoryValidation>;
  
  // Audit Trail & Evidence Management
  createAuditTrail(activity: AuditableActivity): Promise<AuditTrail>;
  generateAuditEvidence(scope: AuditScope): Promise<AuditEvidence>;
  manageEvidenceRetention(evidence: Evidence[]): Promise<RetentionResult>;
  conductComplianceAudit(auditPlan: AuditPlan): Promise<AuditResult>;
  
  // Risk & Control Assessment
  assessComplianceRisk(context: ComplianceContext): Promise<ComplianceRisk>;
  implementControlFramework(controls: ComplianceControl[]): Promise<ControlImplementation>;
  monitorControlEffectiveness(controlId: string): Promise<ControlEffectiveness>;
  updateComplianceControls(updates: ControlUpdate[]): Promise<ControlUpdateResult>;
  
  // Policy & Procedure Automation
  generatePolicyFramework(requirements: PolicyRequirement[]): Promise<PolicyFramework>;
  automatePolicyImplementation(policy: CompliancePolicy): Promise<PolicyImplementation>;
  trackPolicyCompliance(policyId: string): Promise<PolicyCompliance>;
  updateCompliancePolicies(updates: PolicyUpdate[]): Promise<PolicyUpdateResult>;
  
  // Training & Awareness Automation
  generateComplianceTraining(audience: TrainingAudience): Promise<TrainingProgram>;
  trackTrainingCompletion(programId: string): Promise<TrainingMetrics>;
  assessComplianceAwareness(assessment: AwarenessAssessment): Promise<AwarenessResult>;
  automateComplianceCommunication(message: ComplianceMessage): Promise<CommunicationResult>;
}

// Framework interfaces
export interface ComplianceFramework {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  assessments: ComplianceAssessment[];
}

export interface ComplianceMonitoringResult {
  status: ComplianceStatus;
  violations: ComplianceViolation[];
  recommendations: string[];
  nextReview: Date;
}

export interface ComplianceReportRequest {
  frameworks: string[];
  timeframe: string;
  scope: string[];
  format: ReportFormat;
}

export interface ComplianceReport {
  id: string;
  generatedDate: Date;
  scope: AssessmentScope;
  summary: ComplianceSummary;
  details: ComplianceDetail[];
  recommendations: Recommendation[];
}

export interface ComplianceMetrics {
  period: string;
  overall: OverallMetrics;
  byFramework: FrameworkMetrics[];
  trends: TrendAnalysis;
}

export interface ComplianceEntity {
  id: string;
  type: EntityType;
  name: string;
  scope: string[];
  frameworks: string[];
}

export interface ComplianceValidation {
  entity: string;
  status: ValidationStatus;
  findings: ValidationFinding[];
  score: number;
  recommendations: string[];
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  type: RegulatoryType;
  requirements: RegulatoryRequirement[];
  deadlines: RegulatoryDeadline[];
}

export interface RegulatoryData {
  entity: string;
  period: string;
  data: Record<string, unknown>;
  metadata: DataMetadata;
}

export interface RegulatoryReport {
  id: string;
  framework: string;
  entity: string;
  period: string;
  content: ReportContent;
  validation: ReportValidation;
}

export interface SubmissionResult {
  submissionId: string;
  status: SubmissionStatus;
  timestamp: Date;
  acknowledgment: SubmissionAcknowledgment;
}

export interface RegulatoryDeadline {
  id: string;
  requirement: string;
  deadline: Date;
  frequency: DeadlineFrequency;
  status: DeadlineStatus;
  preparations: PreparationTask[];
}

export interface RegulatoryRequirement {
  id: string;
  description: string;
  type: RequirementType;
  mandatory: boolean;
  deadline: Date;
  evidence: Evidence[];
}

export interface RegulatoryValidation {
  requirement: string;
  compliant: boolean;
  gaps: string[];
  recommendations: string[];
  nextReview: Date;
}

export interface AuditableActivity {
  id: string;
  type: ActivityType;
  description: string;
  actor: string;
  timestamp: Date;
  context: AuditContext;
}

export interface AuditTrail {
  id: string;
  activities: AuditableActivity[];
  integrity: TrailIntegrity;
  retention: AuditRetention;
}

export interface AuditScope {
  systems: string[];
  timeRange: AuditTimeRange;
  activities: ActivityType[];
  criteria: AuditCriteria[];
}

export interface AuditEvidence {
  id: string;
  scope: AuditScope;
  evidence: EvidenceItem[];
  summary: EvidenceSummary;
}

export interface RetentionResult {
  processed: number;
  retained: number;
  archived: number;
  deleted: number;
  errors: RetentionError[];
}

export interface AuditPlan {
  id: string;
  scope: AuditScope;
  objectives: AuditObjective[];
  methodology: AuditMethodology;
  timeline: AuditTimeline;
  resources: AuditResource[];
}

export interface AuditResult {
  id: string;
  plan: AuditPlan;
  findings: AuditFinding[];
  conclusions: AuditConclusion[];
  recommendations: AuditRecommendation[];
}

export interface ComplianceContext {
  entity: string;
  scope: AssessmentScope;
  timeframe: string;
  regulations: string[];
  businessContext: BusinessContext;
}

export interface ComplianceRisk {
  overallRisk: RiskLevel;
  categories: ComplianceRiskCategory[];
  mitigationStrategies: RiskMitigationStrategy[];
  assessment: ComplianceRiskAssessment;
}

export interface ControlUpdate {
  controlId: string;
  changes: ControlChange[];
  reason: string;
  approver: string;
  effectiveDate: Date;
}

export interface ControlUpdateResult {
  updateId: string;
  status: UpdateStatus;
  processedControls: ProcessedControl[];
  errors: UpdateError[];
}

export interface PolicyRequirement {
  id: string;
  name: string;
  description: string;
  regulations: string[];
  priority: PriorityLevel;
  deadline: Date;
}

export interface PolicyFramework {
  id: string;
  policies: CompliancePolicy[];
  implementation: PolicyImplementationPlan;
  governance: PolicyGovernance;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  version: string;
  content: PolicyContent;
  applicability: PolicyApplicability;
  enforcement: PolicyEnforcement;
}

export interface PolicyImplementation {
  id: string;
  policy: string;
  status: ImplementationStatus;
  progress: ImplementationProgress;
  issues: ImplementationIssue[];
}

export interface PolicyCompliance {
  policy: string;
  compliance_rate: number;
  violations: PolicyViolation[];
  trends: ComplianceTrend[];
  recommendations: string[];
}

export interface PolicyUpdate {
  policyId: string;
  version: string;
  changes: PolicyChange[];
  reason: string;
  approver: string;
  effectiveDate: Date;
}

export interface PolicyUpdateResult {
  updateId: string;
  status: UpdateStatus;
  processedPolicies: ProcessedPolicy[];
  errors: PolicyUpdateError[];
}

export interface TrainingAudience {
  group: string;
  size: number;
  requirements: string[];
  schedule: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  modules: TrainingModule[];
  assessment: TrainingAssessment;
  certification: TrainingCertification;
}

export interface TrainingMetrics {
  program: string;
  enrollment: number;
  completion: number;
  pass_rate: number;
  satisfaction: number;
  effectiveness: EffectivenessMetrics;
}

export interface AwarenessAssessment {
  id: string;
  target_audience: string;
  topics: string[];
  methodology: AssessmentMethodology;
  timeline: string;
}

export interface AwarenessResult {
  assessment: string;
  overall_score: number;
  topic_scores: TopicScore[];
  gaps: AwarenessGap[];
  recommendations: string[];
}

export interface ComplianceMessage {
  id: string;
  type: MessageType;
  audience: string[];
  content: MessageContent;
  delivery: MessageDelivery;
}

export interface CommunicationResult {
  messageId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
}

// Supporting interfaces
export interface ComplianceViolation {
  id: string;
  severity: ViolationSeverity;
  description: string;
  framework: string;
  remediation: string;
}

export interface ComplianceSummary {
  overallStatus: ComplianceStatus;
  frameworkStatus: FrameworkStatus[];
  keyMetrics: ComplianceMetric[];
}

export interface FrameworkStatus {
  framework: string;
  status: ComplianceStatus;
  compliance: number;
  violations: number;
}

export interface ComplianceMetric {
  name: string;
  value: number;
  target: number;
  trend: TrendDirection;
}

export interface ComplianceDetail {
  framework: string;
  requirements: RequirementDetail[];
  controls: ControlDetail[];
  evidence: EvidenceDetail[];
}

export interface RequirementDetail {
  id: string;
  status: ComplianceStatus;
  evidence: string[];
  gaps: string[];
}

export interface ControlDetail {
  id: string;
  effectiveness: EffectivenessRating;
  lastTested: Date;
  deficiencies: string[];
}

export interface EvidenceDetail {
  id: string;
  type: EvidenceType;
  quality: EvidenceQuality;
  completeness: number;
}

export interface OverallMetrics {
  complianceScore: number;
  violationCount: number;
  remediationRate: number;
  controlEffectiveness: number;
}

export interface FrameworkMetrics {
  framework: string;
  score: number;
  violations: number;
  controls: number;
  effectiveness: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  velocity: number;
  predictions: TrendPrediction[];
}

export interface TrendPrediction {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
}

export interface ValidationFinding {
  requirement: string;
  status: ComplianceStatus;
  evidence: string[];
  gaps: string[];
}

export interface DataMetadata {
  source: string;
  quality: DataQuality;
  completeness: number;
  lastUpdated: Date;
}

export interface ReportContent {
  sections: ReportSection[];
  attachments: ReportAttachment[];
  certifications: ReportCertification[];
}

export interface ReportSection {
  name: string;
  content: string;
  data: Record<string, unknown>;
  validation: SectionValidation;
}

export interface SectionValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  field: string;
  message: string;
  recommendation: string;
}

export interface ReportAttachment {
  name: string;
  type: AttachmentType;
  location: string;
  required: boolean;
}

export interface ReportCertification {
  type: CertificationType;
  certifier: string;
  date: Date;
  validity: CertificationValidity;
}

export interface CertificationValidity {
  valid: boolean;
  expiryDate: Date;
  conditions: string[];
}

export interface ReportValidation {
  status: ValidationStatus;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  resolution: string;
}

export interface SubmissionAcknowledgment {
  received: boolean;
  referenceNumber: string;
  receivedDate: Date;
  expectedResponse: Date;
}

export interface PreparationTask {
  task: string;
  dueDate: Date;
  responsible: string;
  status: TaskStatus;
}

export interface AuditContext {
  system: string;
  module: string;
  function: string;
  metadata: Record<string, unknown>;
}

export interface TrailIntegrity {
  checksum: string;
  signed: boolean;
  tamperEvident: boolean;
  lastVerified: Date;
}

export interface AuditRetention {
  period: string;
  location: string;
  backup: boolean;
  archival: ArchivalPolicy;
}

export interface ArchivalPolicy {
  enabled: boolean;
  schedule: string;
  location: string;
  format: ArchivalFormat;
}

export interface AuditTimeRange {
  start: Date;
  end: Date;
  timezone: string;
}

export interface AuditCriteria {
  field: string;
  operator: ComparisonOperator;
  value: string;
  required: boolean;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  content: string;
  metadata: EvidenceMetadata;
}

export interface EvidenceMetadata {
  source: string;
  timestamp: Date;
  integrity: EvidenceIntegrity;
  classification: DataClassification;
}

export interface EvidenceIntegrity {
  hash: string;
  signature: string;
  verified: boolean;
}

export interface EvidenceSummary {
  totalItems: number;
  categories: EvidenceCategory[];
  quality: EvidenceQualityAssessment;
}

export interface EvidenceCategory {
  category: string;
  count: number;
  percentage: number;
}

export interface EvidenceQualityAssessment {
  score: number;
  completeness: number;
  accuracy: number;
  timeliness: number;
}

export interface RetentionError {
  evidenceId: string;
  error: string;
  resolution: string;
}

export interface AuditObjective {
  objective: string;
  criteria: string[];
  evidence: string[];
  riskLevel: RiskLevel;
}

export interface AuditMethodology {
  approach: AuditApproach;
  techniques: AuditTechnique[];
  sampling: SamplingMethod;
}

export interface AuditTechnique {
  technique: string;
  description: string;
  applicability: string[];
}

export interface SamplingMethod {
  method: SamplingType;
  sampleSize: number;
  criteria: SamplingCriteria;
}

export interface SamplingCriteria {
  population: string;
  parameters: SamplingParameter[];
  confidence: number;
}

export interface SamplingParameter {
  parameter: string;
  value: string;
  weight: number;
}

export interface AuditTimeline {
  startDate: Date;
  endDate: Date;
  phases: AuditPhase[];
  checkpoints: AuditCheckpoint[];
}

export interface AuditPhase {
  name: string;
  startDate: Date;
  endDate: Date;
  activities: string[];
  deliverables: string[];
  resources: AuditResource[];
}

export interface AuditCheckpoint {
  name: string;
  date: Date;
  criteria: string[];
  status: CheckpointStatus;
}

export interface AuditResource {
  type: ResourceType;
  name: string;
  allocation: number;
  cost: number;
  skills: string[];
}

export interface AuditFinding {
  id: string;
  type: string;
  severity: FindingSeverity;
  description: string;
  evidence: string[];
  recommendations: string[];
}

export interface AuditConclusion {
  area: string;
  conclusion: string;
  confidence: number;
  supporting_evidence: string[];
}

export interface AuditRecommendation {
  priority: PriorityLevel;
  description: string;
  implementation: ImplementationGuidance;
  expected_benefit: string;
}

export interface BusinessContext {
  industry: string;
  jurisdiction: string[];
  businessModel: string;
  riskProfile: string;
}

export interface ComplianceRiskCategory {
  category: string;
  level: RiskLevel;
  probability: number;
  impact: ImpactLevel;
  factors: ComplianceRiskFactor[];
}

export interface ComplianceRiskFactor {
  factor: string;
  weight: number;
  current_level: string;
  target_level: string;
}

export interface RiskMitigationStrategy {
  strategy: string;
  effectiveness: number;
  cost: number;
  timeline: string;
  implementation: ImplementationStatus;
}

export interface ComplianceRiskAssessment {
  methodology: RiskAssessmentMethodology;
  results: RiskAssessmentResult[];
  recommendations: RiskRecommendation[];
}

export interface RiskAssessmentMethodology {
  approach: string;
  criteria: RiskCriteria[];
  scoring: RiskScoringMethod;
}

export interface RiskCriteria {
  criterion: string;
  weight: number;
  scale: string;
}

export interface RiskScoringMethod {
  method: string;
  scale: RiskScale;
  thresholds: RiskThreshold[];
}

export interface RiskScale {
  minimum: number;
  maximum: number;
  intervals: RiskInterval[];
}

export interface RiskInterval {
  level: string;
  min: number;
  max: number;
  description: string;
}

export interface RiskThreshold {
  level: RiskLevel;
  score: number;
  action: string;
}

export interface RiskAssessmentResult {
  area: string;
  score: number;
  level: RiskLevel;
  factors: string[];
  recommendations: string[];
}

export interface RiskRecommendation {
  priority: PriorityLevel;
  description: string;
  implementation: ImplementationGuidance;
  expected_benefit: string;
}

export interface ControlChange {
  field: string;
  oldValue: string;
  newValue: string;
  justification: string;
}

export interface ProcessedControl {
  controlId: string;
  status: ControlProcessingStatus;
  changes: string[];
  timestamp: Date;
}

export interface UpdateError {
  controlId: string;
  error: string;
  resolution: string;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  category: RequirementCategory;
  priority: PriorityLevel;
  dueDate: Date;
  status: ComplianceStatus;
  evidence: Evidence[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  type: ControlType;
  category: ControlCategory;
  effectiveness: ControlEffectiveness;
  implementation: ControlImplementation;
  testing: ControlTesting;
}

export interface ControlEffectiveness {
  rating: EffectivenessRating;
  lastAssessed: Date;
  assessor: string;
  evidence: Evidence[];
  deficiencies: ControlDeficiency[];
}

export interface ControlDeficiency {
  id: string;
  description: string;
  severity: DeficiencySeverity;
  impact: string;
  remediation: RemediationPlan;
}

export interface RemediationPlan {
  actions: RemediationAction[];
  timeline: string;
  responsibleParty: string;
  cost: number;
  approval: ApprovalStatus;
}

export interface RemediationAction {
  id: string;
  description: string;
  deadline: Date;
  status: ActionStatus;
  evidence: Evidence[];
}

export interface ControlImplementation {
  status: ImplementationStatus;
  startDate: Date;
  targetDate: Date;
  completionDate?: Date;
  resources: RequiredResource[];
  milestones: ImplementationMilestone[];
}

export interface ImplementationMilestone {
  id: string;
  name: string;
  dueDate: Date;
  status: MilestoneStatus;
  deliverables: string[];
}

export interface RequiredResource {
  type: ResourceType;
  description: string;
  quantity: number;
  cost: number;
  availability: ResourceAvailability;
}

export interface ControlTesting {
  frequency: TestingFrequency;
  methodology: TestingMethodology;
  lastTested: Date;
  nextTest: Date;
  results: TestResult[];
}

export interface TestResult {
  id: string;
  testDate: Date;
  tester: string;
  outcome: TestOutcome;
  findings: TestFinding[];
  recommendations: string[];
}

export interface TestFinding {
  id: string;
  description: string;
  severity: FindingSeverity;
  impact: string;
  recommendation: string;
}

export interface ComplianceAssessment {
  id: string;
  type: AssessmentType;
  scope: AssessmentScope;
  methodology
