/**
 * SOC 2 Compliance Types and Framework
 * Unite Group Enterprise Security System
 */

// SOC 2 Trust Service Criteria
export enum TrustServiceCriteria {
  SECURITY = 'CC6', // Common Criteria 6 - Security
  AVAILABILITY = 'A1', // Availability
  PROCESSING_INTEGRITY = 'PI1', // Processing Integrity
  CONFIDENTIALITY = 'C1', // Confidentiality
  PRIVACY = 'P1' // Privacy
}

// Control Categories
export interface ControlCategory {
  id: string;
  name: string;
  description: string;
  criteria: TrustServiceCriteria[];
  controls: SecurityControl[];
}

// Security Control Definition
export interface SecurityControl {
  id: string;
  category_id: string;
  name: string;
  description: string;
  criteria: TrustServiceCriteria;
  control_type: ControlType;
  frequency: ControlFrequency;
  owner: string;
  status: ControlStatus;
  evidence_requirements: string[];
  automated: boolean;
  last_tested: string | null;
  next_test_date: string;
  created_at: string;
  updated_at: string;
}

export enum ControlType {
  PREVENTIVE = 'preventive',
  DETECTIVE = 'detective',
  CORRECTIVE = 'corrective',
  COMPENSATING = 'compensating'
}

export enum ControlFrequency {
  CONTINUOUS = 'continuous',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ON_DEMAND = 'on_demand'
}

export enum ControlStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
  REMEDIATION = 'remediation',
  NOT_APPLICABLE = 'not_applicable'
}

// Evidence Management
export interface ControlEvidence {
  id: string;
  control_id: string;
  evidence_type: EvidenceType;
  description: string;
  file_path?: string;
  file_hash?: string;
  collected_by: string;
  collection_date: string;
  testing_period_start: string;
  testing_period_end: string;
  status: EvidenceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export enum EvidenceType {
  SCREENSHOT = 'screenshot',
  LOG_FILE = 'log_file',
  CONFIGURATION = 'configuration',
  POLICY_DOCUMENT = 'policy_document',
  PROCEDURE_DOCUMENT = 'procedure_document',
  TRAINING_RECORD = 'training_record',
  VULNERABILITY_SCAN = 'vulnerability_scan',
  PENETRATION_TEST = 'penetration_test',
  BACKUP_VERIFICATION = 'backup_verification',
  ACCESS_REVIEW = 'access_review',
  CHANGE_LOG = 'change_log',
  INCIDENT_REPORT = 'incident_report',
  MONITORING_ALERT = 'monitoring_alert',
  SYSTEM_REPORT = 'system_report'
}

export enum EvidenceStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Testing and Assessment
export interface ControlTest {
  id: string;
  control_id: string;
  test_type: TestType;
  test_procedure: string;
  tester: string;
  test_date: string;
  test_period_start: string;
  test_period_end: string;
  result: TestResult;
  findings: string[];
  recommendations: string[];
  evidence_ids: string[];
  status: TestStatus;
  created_at: string;
  updated_at: string;
}

export enum TestType {
  DESIGN_EFFECTIVENESS = 'design_effectiveness',
  OPERATING_EFFECTIVENESS = 'operating_effectiveness',
  WALKTHROUGH = 'walkthrough',
  INQUIRY = 'inquiry',
  OBSERVATION = 'observation',
  INSPECTION = 'inspection',
  REPERFORMANCE = 'reperformance'
}

export enum TestResult {
  EFFECTIVE = 'effective',
  INEFFECTIVE = 'ineffective',
  DEFICIENT = 'deficient',
  NOT_TESTED = 'not_tested'
}

export enum TestStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  APPROVED = 'approved'
}

// Risk Assessment
export interface RiskAssessment {
  id: string;
  control_id?: string;
  risk_description: string;
  risk_category: RiskCategory;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  inherent_risk_rating: RiskRating;
  mitigation_controls: string[];
  residual_risk_rating: RiskRating;
  risk_owner: string;
  review_date: string;
  status: RiskStatus;
  created_at: string;
  updated_at: string;
}

export enum RiskCategory {
  SECURITY = 'security',
  AVAILABILITY = 'availability',
  PROCESSING_INTEGRITY = 'processing_integrity',
  CONFIDENTIALITY = 'confidentiality',
  PRIVACY = 'privacy',
  COMPLIANCE = 'compliance',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  REPUTATIONAL = 'reputational'
}

export enum RiskLikelihood {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

export enum RiskImpact {
  MINIMAL = 1,
  MINOR = 2,
  MODERATE = 3,
  MAJOR = 4,
  SEVERE = 5
}

export enum RiskRating {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  CRITICAL = 5
}

export enum RiskStatus {
  IDENTIFIED = 'identified',
  ASSESSED = 'assessed',
  MITIGATED = 'mitigated',
  ACCEPTED = 'accepted',
  TRANSFERRED = 'transferred',
  AVOIDED = 'avoided',
  MONITORED = 'monitored'
}

// Remediation and Corrective Actions
export interface RemediationPlan {
  id: string;
  control_id?: string;
  risk_id?: string;
  finding_id?: string;
  description: string;
  priority: RemediationPriority;
  assigned_to: string;
  due_date: string;
  status: RemediationStatus;
  progress_notes: string[];
  completion_date?: string;
  verification_evidence?: string[];
  created_at: string;
  updated_at: string;
}

export enum RemediationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum RemediationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled'
}

// Audit and Reporting
export interface AuditReport {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  auditor: string;
  status: ReportStatus;
  summary: string;
  control_results: ControlTestSummary[];
  findings: Finding[];
  recommendations: string[];
  management_response?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export enum ReportType {
  SOC2_TYPE1 = 'soc2_type1',
  SOC2_TYPE2 = 'soc2_type2',
  INTERNAL_AUDIT = 'internal_audit',
  MANAGEMENT_REVIEW = 'management_review',
  QUARTERLY_ASSESSMENT = 'quarterly_assessment',
  ANNUAL_ASSESSMENT = 'annual_assessment'
}

export enum ReportStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  MANAGEMENT_REVIEW = 'management_review',
  FINAL = 'final',
  PUBLISHED = 'published'
}

export interface ControlTestSummary {
  control_id: string;
  control_name: string;
  test_result: TestResult;
  exceptions_count: number;
  last_test_date: string;
}

export interface Finding {
  id: string;
  finding_type: FindingType;
  severity: FindingSeverity;
  control_id?: string;
  description: string;
  impact: string;
  recommendation: string;
  management_response?: string;
  remediation_plan_id?: string;
  status: FindingStatus;
  identified_date: string;
  target_resolution_date?: string;
  actual_resolution_date?: string;
}

export enum FindingType {
  DEFICIENCY = 'deficiency',
  MATERIAL_WEAKNESS = 'material_weakness',
  SIGNIFICANT_DEFICIENCY = 'significant_deficiency',
  OBSERVATION = 'observation',
  BEST_PRACTICE = 'best_practice'
}

export enum FindingSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational'
}

export enum FindingStatus {
  OPEN = 'open',
  IN_REMEDIATION = 'in_remediation',
  PENDING_VERIFICATION = 'pending_verification',
  CLOSED = 'closed',
  DEFERRED = 'deferred'
}

// Configuration and Settings
export interface SOC2Configuration {
  organization_name: string;
  service_description: string;
  audit_period_start: string;
  audit_period_end: string;
  auditor_firm?: string;
  auditor_contact?: string;
  responsible_party: string;
  control_environment_description: string;
  trust_services_categories: TrustServiceCriteria[];
  automated_monitoring_enabled: boolean;
  evidence_retention_days: number;
  risk_assessment_frequency: ControlFrequency;
  management_review_frequency: ControlFrequency;
  created_at: string;
  updated_at: string;
}

// Monitoring and Metrics
export interface ComplianceMetrics {
  control_effectiveness_rate: number;
  evidence_collection_rate: number;
  findings_by_severity: Record<FindingSeverity, number>;
  remediation_completion_rate: number;
  average_remediation_time_days: number;
  controls_by_status: Record<ControlStatus, number>;
  risk_distribution: Record<RiskRating, number>;
  last_calculated: string;
}

export interface MonitoringAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  control_id?: string;
  message: string;
  details: Record<string, unknown>;
  status: AlertStatus;
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export enum AlertType {
  CONTROL_FAILURE = 'control_failure',
  EVIDENCE_MISSING = 'evidence_missing',
  TEST_OVERDUE = 'test_overdue',
  REMEDIATION_OVERDUE = 'remediation_overdue',
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_INCIDENT = 'security_incident',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  MANUAL_REVIEW_REQUIRED = 'manual_review_required'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

// API and Integration Types
export interface SOC2ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface CreateControlRequest {
  name: string;
  description: string;
  category_id: string;
  criteria: TrustServiceCriteria;
  control_type: ControlType;
  frequency: ControlFrequency;
  owner: string;
  evidence_requirements: string[];
  automated: boolean;
}

export interface UpdateControlRequest {
  name?: string;
  description?: string;
  control_type?: ControlType;
  frequency?: ControlFrequency;
  owner?: string;
  status?: ControlStatus;
  evidence_requirements?: string[];
  automated?: boolean;
}

export interface ControlQuery {
  category_id?: string;
  criteria?: TrustServiceCriteria;
  status?: ControlStatus;
  owner?: string;
  automated?: boolean;
  search?: string;
  sort_by?: 'name' | 'created_at' | 'last_tested' | 'next_test_date';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface EvidenceQuery {
  control_id?: string;
  evidence_type?: EvidenceType;
  status?: EvidenceStatus;
  collected_by?: string;
  collection_date_start?: string;
  collection_date_end?: string;
  limit?: number;
  offset?: number;
}

export interface TestQuery {
  control_id?: string;
  test_type?: TestType;
  result?: TestResult;
  status?: TestStatus;
  tester?: string;
  test_date_start?: string;
  test_date_end?: string;
  limit?: number;
  offset?: number;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// Pre-defined Control Categories
export const DEFAULT_CONTROL_CATEGORIES: ControlCategory[] = [
  {
    id: 'access-control',
    name: 'Access Control',
    description: 'Controls for managing user access to systems and data',
    criteria: [TrustServiceCriteria.SECURITY, TrustServiceCriteria.CONFIDENTIALITY],
    controls: []
  },
  {
    id: 'change-management',
    name: 'Change Management',
    description: 'Controls for managing changes to systems and processes',
    criteria: [TrustServiceCriteria.SECURITY, TrustServiceCriteria.AVAILABILITY],
    controls: []
  },
  {
    id: 'data-protection',
    name: 'Data Protection',
    description: 'Controls for protecting sensitive data',
    criteria: [TrustServiceCriteria.CONFIDENTIALITY, TrustServiceCriteria.PRIVACY],
    controls: []
  },
  {
    id: 'monitoring',
    name: 'Monitoring and Logging',
    description: 'Controls for monitoring system activities and maintaining logs',
    criteria: [TrustServiceCriteria.SECURITY, TrustServiceCriteria.AVAILABILITY],
    controls: []
  },
  {
    id: 'incident-response',
    name: 'Incident Response',
    description: 'Controls for responding to security incidents',
    criteria: [TrustServiceCriteria.SECURITY, TrustServiceCriteria.AVAILABILITY],
    controls: []
  },
  {
    id: 'backup-recovery',
    name: 'Backup and Recovery',
    description: 'Controls for data backup and system recovery',
    criteria: [TrustServiceCriteria.AVAILABILITY, TrustServiceCriteria.PROCESSING_INTEGRITY],
    controls: []
  }
];
