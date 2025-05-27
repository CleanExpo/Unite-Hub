/**
 * Compliance Automation & Regulatory Suite Types
 * Unite Group - Version 13.0 Phase 3 Implementation
 */

export interface ComplianceAutomationFramework {
  // Automated Compliance Monitoring
  monitorCompliance(frameworks: ComplianceFramework[]): Promise<ComplianceMonitoringResult>;
  generateComplianceReport(request: ComplianceReportRequest): Promise<ComplianceReport>;
  trackComplianceMetrics(timeframe: string): Promise<ComplianceMetrics>;
  validateComplianceStatus(entity: ComplianceEntity): Promise<ComplianceValidation>;
  
  // Automated Regulatory Reporting
  generateRegulatoryReport(regulation: RegulatoryFramework, data: any): Promise<RegulatoryReport>;
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

// Core Compliance Types
export interface ComplianceFramework {
  id: string;
  name: string;
  jurisdiction: string;
  version: string;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  assessments: ComplianceAssessment[];
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

export type RequirementCategory = 'privacy' | 'security' | 'financial' | 'operational' | 'environmental' | 'safety';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'not_started' | 'in_progress' | 'completed' | 'non_compliant' | 'exception';

export interface Evidence {
  id: string;
  type: EvidenceType;
  description: string;
  location: string;
  collectedDate: Date;
  retentionPeriod: string;
  classification: DataClassification;
}

export type EvidenceType = 'document' | 'log' | 'screenshot' | 'recording' | 'certificate' | 'report';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ComplianceControl {
  id: string;
  name: string;
  type: ControlType;
  category: ControlCategory;
  effectiveness: ControlEffectiveness;
  implementation: ControlImplementation;
  testing: ControlTesting;
}

export type ControlType = 'preventive' | 'detective' | 'corrective' | 'compensating';
export type ControlCategory = 'administrative' | 'technical' | 'physical';

export interface ControlEffectiveness {
  rating: EffectivenessRating;
  lastAssessed: Date;
  assessor: string;
  evidence: Evidence[];
  deficiencies: ControlDeficiency[];
}

export type EffectivenessRating = 'ineffective' | 'partially_effective' | 'effective' | 'highly_effective';

export interface ControlDeficiency {
  id: string;
  description: string;
  severity: DeficiencySeverity;
  impact: string;
  remediation: RemediationPlan;
}

export type DeficiencySeverity = 'low' | 'medium' | 'high' | 'critical';

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

export type ActionStatus = 'planned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional';

export interface ControlImplementation {
  status: ImplementationStatus;
  startDate: Date;
  targetDate: Date;
  completionDate?: Date;
  resources: RequiredResource[];
  milestones: ImplementationMilestone[];
}

export type ImplementationStatus = 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

export interface ImplementationMilestone {
  id: string;
  name: string;
  dueDate: Date;
  status: MilestoneStatus;
  deliverables: string[];
}

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'delayed';

export interface RequiredResource {
  type: ResourceType;
  description: string;
  quantity: number;
  cost: number;
  availability: ResourceAvailability;
}

export type ResourceType = 'personnel' | 'technology' | 'infrastructure' | 'training' | 'consulting';

export interface ResourceAvailability {
  available: boolean;
  availableFrom?: Date;
  constraints: string[];
}

export interface ControlTesting {
  frequency: TestingFrequency;
  methodology: TestingMethodology;
  lastTested: Date;
  nextTest: Date;
  results: TestResult[];
}

export type TestingFrequency = 'continuous' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
export type TestingMethodology = 'automated' | 'manual' | 'walkthrough' | 'inspection' | 'observation';

export interface TestResult {
  id: string;
  testDate: Date;
  tester: string;
  outcome: TestOutcome;
  findings: TestFinding[];
  recommendations: string[];
}

export type TestOutcome = 'passed' | 'failed' | 'partial' | 'inconclusive';

export interface TestFinding {
  id: string;
  description: string;
  severity: FindingSeverity;
  impact: string;
  recommendation: string;
}

export type FindingSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';

export interface ComplianceAssessment {
  id: string;
  type: AssessmentType;
  scope: AssessmentScope;
  methodology: AssessmentMethodology;
  timeline: AssessmentTimeline;
  resources: AssessmentResource[];
  results: AssessmentResult;
}

export type AssessmentType = 'gap_analysis' | 'maturity_assessment' | 'risk_assessment' | 'audit_readiness' | 'compliance_review';

export interface AssessmentScope {
  frameworks: string[];
  businessUnits: string[];
  systems: string[];
  processes: string[];
  geographies: string[];
}

export type AssessmentMethodology = 'documentary_review' | 'interviews' | 'testing' | 'observation' | 'sampling';

export interface AssessmentTimeline {
  startDate: Date;
  endDate: Date;
  phases: AssessmentPhase[];
  milestones: AssessmentMilestone[];
}

export interface AssessmentPhase {
  name: string;
  startDate: Date;
  endDate: Date;
  activities: string[];
  deliverables: string[];
}

export interface AssessmentMilestone {
  name: string;
  date: Date;
  criteria: string[];
  dependencies: string[];
}

export interface AssessmentResource {
  role: string;
  name: string;
  allocation: number;
  skills: string[];
  availability: ResourceAvailability;
}

export interface AssessmentResult {
  overallRating: ComplianceRating;
  gapAnalysis: GapAnalysisResult;
  recommendations: Recommendation[];
  actionPlan: ActionPlan;
  riskProfile: RiskProfile;
}

export type ComplianceRating = 'non_compliant' | 'partially_compliant' | 'substantially_compliant' | 'fully_compliant';

export interface GapAnalysisResult {
  identifiedGaps: ComplianceGap[];
  prioritization: GapPrioritization;
  remediation: GapRemediation;
}

export interface ComplianceGap {
  id: string;
  requirement: string;
  currentState: string;
  targetState: string;
  gapDescription: string;
  impact: GapImpact;
  effort: RemediationEffort;
}

export interface GapImpact {
  business: BusinessImpact;
  regulatory: RegulatoryImpact;
  reputational: ReputationalImpact;
  financial: FinancialImpact;
}

export interface BusinessImpact {
  severity: ImpactSeverity;
  description: string;
  affectedProcesses: string[];
  mitigationOptions: string[];
}

export interface RegulatoryImpact {
  enforcementRisk: RiskLevel;
  penaltyExposure: PenaltyExposure;
  reportingRequirements: string[];
  timeToRemediate: string;
}

export interface PenaltyExposure {
  monetary: MonetaryPenalty;
  operational: OperationalPenalty;
  reputational: ReputationalPenalty;
}

export interface MonetaryPenalty {
  minimum: number;
  maximum: number;
  currency: string;
  calculation: PenaltyCalculation;
}

export interface PenaltyCalculation {
  method: CalculationMethod;
  factors: PenaltyFactor[];
  mitigatingFactors: MitigatingFactor[];
}

export type CalculationMethod = 'fixed' | 'percentage' | 'per_record' | 'per_day' | 'turnover_based';

export interface PenaltyFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface MitigatingFactor {
  factor: string;
  reduction: number;
  requirements: string[];
}

export interface OperationalPenalty {
  type: OperationalPenaltyType;
  duration: string;
  conditions: string[];
  appealOptions: string[];
}

export type OperationalPenaltyType = 'license_suspension' | 'operations_halt' | 'oversight_program' | 'consent_decree';

export interface ReputationalPenalty {
  publicDisclosure: boolean;
  mediaAttention: MediaAttentionLevel;
  stakeholderImpact: StakeholderImpact;
  recoveryTimeframe: string;
}

export type MediaAttentionLevel = 'minimal' | 'moderate' | 'significant' | 'extensive';

export interface StakeholderImpact {
  customers: CustomerImpact;
  investors: InvestorImpact;
  partners: PartnerImpact;
  employees: EmployeeImpact;
}

export interface CustomerImpact {
  confidenceLoss: ConfidenceLevel;
  churnRisk: ChurnRisk;
  acquisitionImpact: AcquisitionImpact;
}

export type ConfidenceLevel = 'minimal' | 'moderate' | 'significant' | 'severe';

export interface ChurnRisk {
  percentage: number;
  segments: CustomerSegment[];
  timeline: string;
}

export interface CustomerSegment {
  segment: string;
  riskLevel: RiskLevel;
  mitigationStrategies: string[];
}

export interface AcquisitionImpact {
  costIncrease: number;
  conversionReduction: number;
  channelImpact: ChannelImpact[];
}

export interface ChannelImpact {
  channel: string;
  impactLevel: ImpactLevel;
  duration: string;
}

export interface InvestorImpact {
  valuationImpact: ValuationImpact;
  fundingImpact: FundingImpact;
  governanceRequirements: string[];
}

export interface ValuationImpact {
  discount: number;
  duration: string;
  recoveryFactors: string[];
}

export interface FundingImpact {
  costIncrease: number;
  availabilityReduction: number;
  covenantChanges: string[];
}

export interface PartnerImpact {
  relationshipStrain: RelationshipStrain;
  contractualConsequences: string[];
  futureOpportunities: OpportunityImpact;
}

export interface RelationshipStrain {
  severity: StrainSeverity;
  duration: string;
  repairActions: string[];
}

export type StrainSeverity = 'minimal' | 'moderate' | 'significant' | 'severe' | 'relationship_ending';

export interface OpportunityImpact {
  lostOpportunities: number;
  delayedOpportunities: number;
  enhancedDueDiligence: boolean;
}

export interface EmployeeImpact {
  morale: MoraleImpact;
  retention: RetentionImpact;
  recruitment: RecruitmentImpact;
}

export interface MoraleImpact {
  severity: ImpactSeverity;
  duration: string;
  mitigationActions: string[];
}

export interface RetentionImpact {
  atRiskEmployees: number;
  keyPersonRisk: KeyPersonRisk[];
  retentionStrategies: string[];
}

export interface KeyPersonRisk {
  role: string;
  riskLevel: RiskLevel;
  impactIfLost: string;
  retentionPlan: string;
}

export interface RecruitmentImpact {
  difficultyIncrease: DifficultyLevel;
  salaryPremium: number;
  timeToHire: TimeImpact;
}

export type DifficultyLevel = 'minimal' | 'moderate' | 'significant' | 'severe';

export interface TimeImpact {
  increase: number;
  unit: TimeUnit;
  variability: number;
}

export type TimeUnit = 'days' | 'weeks' | 'months';

export interface ReputationalImpact {
  brandDamage: BrandDamage;
  marketPosition: MarketPositionImpact;
  trustRecovery: TrustRecovery;
}

export interface BrandDamage {
  severity: DamageSeverity;
  duration: string;
  affectedMarkets: string[];
  recoveryInvestment: number;
}

export type DamageSeverity = 'minimal' | 'moderate' | 'significant' | 'severe' | 'catastrophic';

export interface MarketPositionImpact {
  competitiveAdvantage: CompetitiveAdvantageImpact;
  marketShare: MarketShareImpact;
  pricingPower: PricingPowerImpact;
}

export interface CompetitiveAdvantageImpact {
  lostAdvantages: string[];
  competitorGains: string[];
  recoveryActions: string[];
}

export interface MarketShareImpact {
  lossPercentage: number;
  timeframe: string;
  recoveryProbability: number;
}

export interface PricingPowerImpact {
  discountRequired: number;
  duration: string;
  segmentImpact: PricingSegmentImpact[];
}

export interface PricingSegmentImpact {
  segment: string;
  impact: number;
  alternatives: string[];
}

export interface TrustRecovery {
  timeline: TrustRecoveryTimeline;
  actions: TrustRecoveryAction[];
  metrics: TrustMetric[];
}

export interface TrustRecoveryTimeline {
  immediate: string[];
  shortTerm: string[];
  mediumTerm: string[];
  longTerm: string[];
}

export interface TrustRecoveryAction {
  action: string;
  timeline: string;
  investment: number;
  successProbability: number;
}

export interface TrustMetric {
  metric: string;
  baseline: number;
  target: number;
  timeline: string;
}

export interface FinancialImpact {
  directCosts: DirectCost[];
  indirectCosts: IndirectCost[];
  opportunityCosts: OpportunityCost[];
  timeline: FinancialTimeline;
}

export interface DirectCost {
  category: DirectCostCategory;
  amount: number;
  currency: string;
  timing: CostTiming;
}

export type DirectCostCategory = 'penalties' | 'legal_fees' | 'consulting' | 'remediation' | 'compliance_program';

export interface CostTiming {
  oneTime: boolean;
  recurring: boolean;
  frequency?: CostFrequency;
  duration?: string;
}

export type CostFrequency = 'monthly' | 'quarterly' | 'annually';

export interface IndirectCost {
  category: IndirectCostCategory;
  amount: number;
  currency: string;
  probability: number;
}

export type IndirectCostCategory = 'revenue_loss' | 'operational_disruption' | 'insurance_premium' | 'financing_cost';

export interface OpportunityCost {
  opportunity: string;
  value: number;
  currency: string;
  probability: number;
  timeframe: string;
}

export interface FinancialTimeline {
  immediate: FinancialPeriod;
  shortTerm: FinancialPeriod;
  mediumTerm: FinancialPeriod;
  longTerm: FinancialPeriod;
}

export interface FinancialPeriod {
  period: string;
  costs: number;
  benefits: number;
  netImpact: number;
}

export interface RemediationEffort {
  complexity: ComplexityLevel;
  timeframe: string;
  resources: EffortResource[];
  dependencies: string[];
  risks: ImplementationRisk[];
}

export type ComplexityLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface EffortResource {
  type: ResourceType;
  quantity: number;
  duration: string;
  skillLevel: SkillLevel;
}

export type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface ImplementationRisk {
  risk: string;
  probability: number;
  impact: ImpactLevel;
  mitigation: string;
}

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type ImpactSeverity = 'minimal' | 'minor' | 'moderate' | 'major' | 'severe';
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Additional missing interfaces for completeness
export interface ComplianceMonitoringResult {
  status: ComplianceStatus;
  violations: ComplianceViolation[];
  recommendations: string[];
  nextReview: Date;
}

export interface ComplianceViolation {
  id: string;
  severity: ViolationSeverity;
  description: string;
  framework: string;
  remediation: string;
}

export type ViolationSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface ComplianceReportRequest {
  frameworks: string[];
  timeframe: string;
  scope: string[];
  format: ReportFormat;
}

export type ReportFormat = 'pdf' | 'html' | 'json' | 'excel';

export interface ComplianceReport {
  id: string;
  generatedDate: Date;
  scope: AssessmentScope;
  summary: ComplianceSummary;
  details: ComplianceDetail[];
  recommendations: Recommendation[];
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

export type TrendDirection = 'improving' | 'stable' | 'declining';

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

export type EvidenceQuality = 'poor' | 'fair' | 'good' | 'excellent';

export interface Recommendation {
  priority: PriorityLevel;
  category: RecommendationCategory;
  description: string;
  implementation: ImplementationGuidance;
  impact: RecommendationImpact;
}

export type RecommendationCategory = 'policy' | 'process' | 'technology' | 'training' | 'governance';

export interface ImplementationGuidance {
  steps: string[];
  timeline: string;
  resources: string[];
  dependencies: string[];
}

export interface RecommendationImpact {
  riskReduction: number;
  complianceImprovement: number;
  cost: number;
  effort: EffortLevel;
}

export type EffortLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface ComplianceMetrics {
  period: string;
  overall: OverallMetrics;
  byFramework: FrameworkMetrics[];
  trends: TrendAnalysis;
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

export interface ComplianceEntity {
  id: string;
  type: EntityType;
  name: string;
  scope: string[];
  frameworks: string[];
}

export type EntityType = 'business_unit' | 'system' | 'process' | 'geography' | 'legal_entity';

export interface ComplianceValidation {
  entity: string;
  status: ValidationStatus;
  findings: ValidationFinding[];
  score: number;
  recommendations: string[];
}

export type ValidationStatus = 'compliant' | 'non_compliant' | 'partial' | 'pending';

export interface ValidationFinding {
  requirement: string;
  status: ComplianceStatus;
  evidence: string[];
  gaps: string[];
}

// Australian Regulatory Framework Types
export interface AustralianRegulatoryFramework {
  privacyAct: PrivacyActCompliance;
  corporationsAct: CorporationsActCompliance;
  australianSecuritiesExchange: ASXCompliance;
  australianPrudentialRegulation: APRACompliance;
  australianCompetitionConsumer: ACCCCompliance;
  australianTaxOffice: ATOCompliance;
  workplaceSafety: WorkplaceSafetyCompliance;
  environmentalRegulation: EnvironmentalCompliance;
  consumerProtection: ConsumerProtectionCompliance;
  financialServicesLicensing: AFSLCompliance;
}

export interface PrivacyActCompliance {
  australianPrivacyPrinciples: APPCompliance[];
  notifiableDataBreaches: NotifiableDataBreachCompliance;
  consentManagement: ConsentManagementCompliance;
  dataSubjectRights: DataSubjectRightsCompliance;
  crossBorderTransfers: CrossBorderTransferCompliance;
  privacyImpactAssessments: PIACompliance;
  complaintHandling: ComplaintHandlingCompliance;
  recordKeeping: RecordKeepingCompliance;
}

export interface APPCompliance {
  principleNumber: number;
  principleTitle: string;
  complianceStatus: ComplianceStatus;
  requirements: APPRequirement[];
  controls: ComplianceControl[];
  evidence: ComplianceEvidence[];
  lastAssessment: Date;
  nextReview: Date;
  riskLevel: RiskLevel;
}

export interface APPRequirement {
  requirementId: string;
  description: string;
  mandatoryActions: string[];
  implementationStatus: ImplementationStatus;
  responsibleParty: string;
  dueDate: Date;
  evidence: Evidence[];
  exceptions: ComplianceException[];
}

export interface ComplianceException {
  id: string;
  reason: string;
  approvedBy: string;
  approvalDate: Date;
  reviewDate: Date;
  conditions: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: EvidenceType;
  description: string;
  location: string;
  classification: DataClassification;
  retentionPeriod: string;
}

export interface NotifiableDataBreachCompliance {
  breachDetection: BreachDetectionCompliance;
  riskAssessment: BreachRiskAssessment;
  notification: BreachNotificationCompliance;
  remediation: BreachRemediationCompliance;
  reporting: BreachReportingCompliance;
}

export interface BreachDetectionCompliance {
  detectionMechanisms: DetectionMechanism[];
  monitoringCoverage: MonitoringCoverage;
  alertingSystems: AlertingSystem[];
  responseTime: ResponseTimeMetrics;
  automatedDetection: boolean;
}

export interface DetectionMechanism {
  type: DetectionType;
  coverage: string[];
  sensitivity: SensitivityLevel;
  accuracy: AccuracyMetrics;
  automationLevel: AutomationLevel;
}

export type DetectionType = 
  | 'technical_monitoring'
  | 'access_logging'
  | 'behavior_analytics'
  | 'data_loss_prevention'
  | 'intrusion_detection'
  | 'manual_reporting'
  | 'third_party_notification';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AccuracyMetrics {
  truePositiveRate: number;
  falsePositiveRate: number;
  trueNegativeRate: number;
  falseNegativeRate: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export type AutomationLevel = 'manual' | 'semi_automated' | 'fully_automated' | 'ai_enhanced';

export interface MonitoringCoverage {
  dataTypes: DataType[];
  systems: SystemCoverage[];
  processes: ProcessCoverage[];
  geographicScope: GeographicScope[];
  temporalCoverage: TemporalCoverage;
}

export interface DataType {
  category: DataCategory;
  sensitivity: DataSensitivity;
  volume: DataVolume;
  criticality: DataCriticality;
  retentionPeriod: string;
}

export type DataCategory = 
  | 'personal_information'
  | 'sensitive_information'
  | 'health_information'
  | 'financial_information'
  | 'biometric_information'
  | 'location_information'
  | 'behavioral_information';

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface DataVolume {
  recordCount: number;
  dataSize: string;
  growthRate: number;
  peakUsage: PeakUsageMetrics;
}

export interface PeakUsageMetrics {
  peakTime: string;
  peakVolume: number;
  averageVolume: number;
  variability: number;
}

export type DataCriticality = 'low' | 'medium' | 'high' | 'critical' | 'mission_critical';

export interface SystemCoverage {
  systemId: string;
  systemType: SystemType;
  monitoringLevel: MonitoringLevel;
  coverage: CoverageLevel;
  integration: IntegrationLevel;
}

export type SystemType = 
  | 'database'
  | 'application'
  | 'file_system'
  | 'network'
  | 'cloud_service'
  | 'mobile_application
