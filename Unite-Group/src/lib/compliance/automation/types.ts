/**
 * Compliance Automation & Regulatory Suite Types
 * Unite Group - Version 13.0 Phase 3 Implementation
 */

// Basic shared types
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
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
export type RequirementCategory = 'privacy' | 'security' | 'financial' | 'operational' | 'environmental' | 'safety';
export type EvidenceType = 'document' | 'log' | 'screenshot' | 'recording' | 'certificate' | 'report';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensating';
export type ControlCategory = 'administrative' | 'technical' | 'physical';
export type EffectivenessRating = 'ineffective' | 'partially_effective' | 'effective' | 'highly_effective';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type ViolationSeverity = 'minor' | 'moderate' | 'major' | 'critical';
export type AssessmentMethodology = 'documentary_review' | 'interviews' | 'testing' | 'observation' | 'sampling';

// Core interfaces
export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  location: string;
  collectedDate: Date;
  retentionPeriod: string;
  classification: DataClassification;
}

export interface ImplementationGuidance {
  steps: string[];
  timeline: string;
  resources: string[];
  dependencies: string[];
}

export interface ImplementationMilestone {
  id: string;
  name: string;
  dueDate: Date;
  status: string;
  deliverables: string[];
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

export interface ControlEffectiveness {
  rating: EffectivenessRating;
  lastAssessed: Date;
  assessor: string;
  evidence: Evidence[];
  deficiencies: string[];
}

export interface ControlImplementation {
  status: ImplementationStatus;
  startDate: Date;
  targetDate: Date;
  completionDate?: Date;
  resources: string[];
  milestones: ImplementationMilestone[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  type: ControlType;
  category: ControlCategory;
  effectiveness: ControlEffectiveness;
  implementation: ControlImplementation;
  testing: {
    frequency: string;
    methodology: string;
    lastTested: Date;
    nextTest: Date;
    results: string[];
  };
}

export interface ComplianceAssessment {
  id: string;
  type: string;
  scope: string[];
  methodology: AssessmentMethodology;
  startDate: Date;
  endDate: Date;
  results: string[];
}

export interface AssessmentScope {
  frameworks: string[];
  businessUnits: string[];
  systems: string[];
  processes: string[];
  geographies: string[];
}

export interface ComplianceFramework {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  assessments: ComplianceAssessment[];
}

export interface PolicyGovernance {
  approvalProcess: string[];
  reviewCycle: string;
  stakeholders: string[];
  escalationPath: string[];
}

export interface PolicyContent {
  text: string;
  sections: string[];
  attachments: string[];
  version: string;
}

export interface PolicyApplicability {
  scope: string[];
  exclusions: string[];
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface PolicyEnforcement {
  mechanism: string;
  penalties: string[];
  monitoring: string;
}

export interface ImplementationProgress {
  percentage: number;
  milestones: ImplementationMilestone[];
  blockers: string[];
  nextSteps: string[];
}

export interface ImplementationIssue {
  id: string;
  description: string;
  severity: string;
  impact: string;
  resolution: string;
}

export interface PolicyViolation {
  id: string;
  type: string;
  severity: ViolationSeverity;
  description: string;
  remediation: string;
}

export interface ComplianceTrend {
  metric: string;
  direction: TrendDirection;
  change: number;
  period: string;
}

export interface PolicyChange {
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface ProcessedPolicy {
  policyId: string;
  status: string;
  changes: string[];
  timestamp: Date;
}

export interface PolicyUpdateError {
  policyId: string;
  error: string;
  resolution: string;
}

export interface TrainingModule {
  id: string;
  name: string;
  content: string;
  duration: number;
  prerequisites: string[];
}

export interface TrainingAssessment {
  questions: string[];
  passingScore: number;
  timeLimit: number;
}

export interface TrainingCertification {
  name: string;
  validityPeriod: string;
  renewalRequired: boolean;
  criteria: string[];
}

export interface EffectivenessMetrics {
  knowledgeRetention: number;
  behaviorChange: number;
  complianceImprovement: number;
  costEffectiveness: number;
}

export interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface AwarenessGap {
  area: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
}

export interface MessageContent {
  subject: string;
  body: string;
  attachments: string[];
  priority: PriorityLevel;
}

export interface MessageDelivery {
  channels: string[];
  schedule: string;
  tracking: boolean;
}

export interface ControlChange {
  field: string;
  oldValue: string;
  newValue: string;
  justification: string;
}

export interface ProcessedControl {
  controlId: string;
  status: string;
  changes: string[];
  timestamp: Date;
}

export interface UpdateError {
  controlId: string;
  error: string;
  resolution: string;
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

// Main framework interface
export interface ComplianceAutomationFramework {
  // Automated Compliance Monitoring
  monitorCompliance(frameworks: ComplianceFramework[]): Promise<any>;
  generateComplianceReport(request: any): Promise<any>;
  trackComplianceMetrics(timeframe: string): Promise<any>;
  validateComplianceStatus(entity: any): Promise<any>;
  
  // Automated Regulatory Reporting
  generateRegulatoryReport(regulation: any, data: any): Promise<any>;
  submitRegulatoryFiling(report: any): Promise<any>;
  trackRegulatoryDeadlines(jurisdiction: string): Promise<any[]>;
  validateRegulatoryCompliance(requirement: any): Promise<any>;
  
  // Audit Trail & Evidence Management
  createAuditTrail(activity: any): Promise<any>;
  generateAuditEvidence(scope: any): Promise<any>;
  manageEvidenceRetention(evidence: Evidence[]): Promise<any>;
  conductComplianceAudit(auditPlan: any): Promise<any>;
  
  // Risk & Control Assessment
  assessComplianceRisk(context: any): Promise<any>;
  implementControlFramework(controls: ComplianceControl[]): Promise<ControlImplementation>;
  monitorControlEffectiveness(controlId: string): Promise<ControlEffectiveness>;
  updateComplianceControls(updates: any[]): Promise<any>;
  
  // Policy & Procedure Automation
  generatePolicyFramework(requirements: any[]): Promise<any>;
  automatePolicyImplementation(policy: any): Promise<any>;
  trackPolicyCompliance(policyId: string): Promise<any>;
  updateCompliancePolicies(updates: any[]): Promise<any>;
  
  // Training & Awareness Automation
  generateComplianceTraining(audience: any): Promise<any>;
  trackTrainingCompletion(programId: string): Promise<any>;
  assessComplianceAwareness(assessment: any): Promise<any>;
  automateComplianceCommunication(message: any): Promise<any>;
}
