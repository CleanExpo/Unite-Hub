/**
 * Zero-Trust Security Architecture Types
 * Unite Group - Version 13.0 Phase 1 Implementation
 */

export interface ZeroTrustFramework {
  // Identity & Access Management
  authenticateUser(credentials: AuthenticationRequest): Promise<AuthenticationResult>;
  authorizeAccess(request: AccessRequest): Promise<AuthorizationResult>;
  validateSession(sessionToken: string): Promise<SessionValidation>;
  revokeAccess(userId: string, reason: string): Promise<void>;
  
  // Device Trust & Endpoint Protection
  registerDevice(device: DeviceRegistration): Promise<DeviceRegistration>;
  assessDeviceTrust(deviceId: string): Promise<DeviceTrustScore>;
  enforceDeviceCompliance(deviceId: string): Promise<ComplianceStatus>;
  quarantineDevice(deviceId: string, reason: string): Promise<void>;
  
  // Network Segmentation & Micro-Perimeter
  createMicroPerimeter(config: MicroPerimeterConfig): Promise<NetworkSegment>;
  enforceNetworkPolicy(policy: NetworkPolicy): Promise<PolicyEnforcement>;
  monitorNetworkTraffic(segmentId: string): Promise<TrafficAnalysis>;
  detectNetworkAnomalies(segmentId: string): Promise<AnomalyDetection[]>;
  
  // Application Security & Runtime Protection
  scanApplication(appId: string, scanType: ScanType): Promise<SecurityScanResult>;
  protectRuntime(appId: string, config: RuntimeProtectionConfig): Promise<ProtectionStatus>;
  detectApplicationThreats(appId: string): Promise<ThreatDetection[]>;
  remediateVulnerability(vulnId: string, action: RemediationAction): Promise<RemediationResult>;
  
  // Data Classification & Protection
  classifyData(data: DataClassificationRequest): Promise<DataClassification>;
  encryptSensitiveData(data: SensitiveDataRequest): Promise<EncryptionResult>;
  trackDataAccess(dataId: string, userId: string): Promise<AccessLog>;
  enforceDataPolicies(dataId: string): Promise<PolicyEnforcement>;
  
  // Continuous Monitoring & Risk Assessment
  assessSecurityPosture(): Promise<SecurityPosture>;
  calculateRiskScore(entity: RiskEntity): Promise<RiskScore>;
  generateSecurityReport(filters: SecurityReportFilters): Promise<SecurityReport>;
  respondToIncident(incident: SecurityIncident): Promise<IncidentResponse>;
}

// Authentication & Identity Management
export interface AuthenticationRequest {
  username: string;
  password?: string;
  mfaToken?: string;
  biometricData?: BiometricData;
  deviceFingerprint: DeviceFingerprint;
  contextualData: AuthenticationContext;
}

export interface BiometricData {
  type: BiometricType;
  template: string;
  confidence: number;
  liveness: boolean;
}

export type BiometricType = 
  | 'fingerprint'
  | 'face_recognition'
  | 'voice_recognition'
  | 'behavioral_biometric'
  | 'retina_scan';

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareSignature: string;
  networkSignature: string;
}

export interface AuthenticationContext {
  ipAddress: string;
  geolocation: GeoLocation;
  networkType: NetworkType;
  riskFactors: RiskFactor[];
  previousSessions: SessionHistory[];
}

export interface GeoLocation {
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  vpnDetected: boolean;
  torDetected: boolean;
}

export type NetworkType = 
  | 'corporate'
  | 'home'
  | 'public_wifi'
  | 'mobile'
  | 'vpn'
  | 'unknown';

export interface RiskFactor {
  type: RiskFactorType;
  severity: RiskSeverity;
  description: string;
  confidence: number;
}

export type RiskFactorType = 
  | 'unusual_location'
  | 'new_device'
  | 'suspicious_network'
  | 'behavioral_anomaly'
  | 'threat_intelligence'
  | 'velocity_check';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SessionHistory {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  deviceId: string;
  location: GeoLocation;
  successful: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  sessionToken?: string;
  riskScore: number;
  authenticationLevel: AuthenticationLevel;
  restrictions: AccessRestriction[];
  mfaRequired: boolean;
  nextVerificationTime?: Date;
  error?: AuthenticationError;
}

export type AuthenticationLevel = 
  | 'basic'
  | 'enhanced'
  | 'high_assurance'
  | 'maximum_security';

export interface AccessRestriction {
  type: RestrictionType;
  description: string;
  duration?: number;
  conditions: string[];
}

export type RestrictionType = 
  | 'ip_restriction'
  | 'device_restriction'
  | 'time_restriction'
  | 'location_restriction'
  | 'function_restriction';

export interface AuthenticationError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  retryAllowed: boolean;
  lockoutDuration?: number;
}

// Authorization & Access Control
export interface AccessRequest {
  userId: string;
  resourceId: string;
  action: ResourceAction;
  context: AccessContext;
  sessionToken: string;
}

export type ResourceAction = 
  | 'read'
  | 'write'
  | 'delete'
  | 'execute'
  | 'admin'
  | 'share';

export interface AccessContext {
  timestamp: Date;
  sourceIp: string;
  userAgent: string;
  riskLevel: RiskLevel;
  businessJustification?: string;
}

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface AuthorizationResult {
  granted: boolean;
  permissions: Permission[];
  conditions: AccessCondition[];
  expirationTime?: Date;
  auditTrail: AuditEntry;
  reason?: string;
}

export interface Permission {
  resource: string;
  actions: ResourceAction[];
  scope: PermissionScope;
  constraints: PermissionConstraint[];
}

export interface PermissionScope {
  type: ScopeType;
  values: string[];
  inheritance: boolean;
}

export type ScopeType = 
  | 'global'
  | 'organization'
  | 'project'
  | 'resource'
  | 'user_defined';

export interface PermissionConstraint {
  type: ConstraintType;
  operator: ConstraintOperator;
  value: string;
  description: string;
}

export type ConstraintType = 
  | 'time_window'
  | 'ip_range'
  | 'device_type'
  | 'data_sensitivity'
  | 'approval_required';

export type ConstraintOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'in_range';

export interface AccessCondition {
  type: ConditionType;
  description: string;
  validation: ConditionValidation;
  enforcement: ConditionEnforcement;
}

export type ConditionType = 
  | 'time_based'
  | 'location_based'
  | 'risk_based'
  | 'approval_based'
  | 'device_based';

export interface ConditionValidation {
  required: boolean;
  frequency: ValidationFrequency;
  criteria: ValidationCriteria[];
}

export type ValidationFrequency = 
  | 'once'
  | 'per_session'
  | 'hourly'
  | 'daily'
  | 'on_risk_change';

export interface ValidationCriteria {
  parameter: string;
  expectedValue: string;
  tolerance: number;
}

export interface ConditionEnforcement {
  action: EnforcementAction;
  grace_period?: number;
  escalation: EscalationPolicy;
}

export type EnforcementAction = 
  | 'allow'
  | 'deny'
  | 'require_approval'
  | 'step_up_auth'
  | 'limit_access'
  | 'monitor_only';

export interface EscalationPolicy {
  levels: EscalationLevel[];
  automatic: boolean;
  notifications: NotificationConfig[];
}

export interface EscalationLevel {
  level: number;
  threshold: number;
  actions: EnforcementAction[];
  approvers: string[];
}

export interface NotificationConfig {
  channel: NotificationChannel;
  recipients: string[];
  template: string;
  urgency: NotificationUrgency;
}

export type NotificationChannel = 
  | 'email'
  | 'sms'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'dashboard';

export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  result: AuditResult;
  riskScore: number;
  metadata: Record<string, unknown>;
}

export type AuditResult = 'success' | 'failure' | 'partial' | 'blocked';

// Session Management
export interface SessionValidation {
  valid: boolean;
  userId: string;
  sessionData: SessionData;
  riskAssessment: SessionRiskAssessment;
  renewalRequired: boolean;
  expirationTime: Date;
}

export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  deviceId: string;
  permissions: Permission[];
  securityLevel: SecurityLevel;
}

export type SecurityLevel = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top_secret';

export interface SessionRiskAssessment {
  currentRisk: RiskLevel;
  riskFactors: SessionRiskFactor[];
  recommendations: SecurityRecommendation[];
  monitoring: MonitoringLevel;
}

export interface SessionRiskFactor {
  factor: string;
  weight: number;
  current_value: number;
  baseline_value: number;
  deviation: number;
}

export interface SecurityRecommendation {
  priority: RecommendationPriority;
  action: string;
  rationale: string;
  implementation: ImplementationGuidance;
}

export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ImplementationGuidance {
  steps: string[];
  timeline: string;
  resources: string[];
  risks: string[];
}

export type MonitoringLevel = 
  | 'standard'
  | 'enhanced'
  | 'intensive'
  | 'real_time';

// Device Trust & Endpoint Protection
export interface DeviceRegistration {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  operatingSystem: OperatingSystemInfo;
  hardwareInfo: HardwareInfo;
  securitySoftware: SecuritySoftwareInfo[];
  owner: DeviceOwner;
  registrationDate: Date;
  trustLevel: TrustLevel;
}

export type DeviceType = 
  | 'desktop'
  | 'laptop'
  | 'mobile'
  | 'tablet'
  | 'server'
  | 'iot_device'
  | 'virtual_machine';

export interface OperatingSystemInfo {
  name: string;
  version: string;
  buildNumber: string;
  patchLevel: string;
  lastUpdate: Date;
  vulnerabilities: KnownVulnerability[];
}

export interface KnownVulnerability {
  cveId: string;
  severity: VulnerabilitySeverity;
  description: string;
  patchAvailable: boolean;
  exploitAvailable: boolean;
}

export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HardwareInfo {
  manufacturer: string;
  model: string;
  serialNumber: string;
  processorInfo: ProcessorInfo;
  memoryInfo: MemoryInfo;
  storageInfo: StorageInfo[];
  securityFeatures: SecurityFeature[];
}

export interface ProcessorInfo {
  manufacturer: string;
  model: string;
  cores: number;
  architecture: string;
  securityFeatures: string[];
}

export interface MemoryInfo {
  totalRAM: number;
  availableRAM: number;
  type: string;
  encryption: boolean;
}

export interface StorageInfo {
  type: StorageType;
  capacity: number;
  encryption: EncryptionInfo;
  healthStatus: HealthStatus;
}

export type StorageType = 'ssd' | 'hdd' | 'nvme' | 'emmc' | 'network';

export interface EncryptionInfo {
  enabled: boolean;
  algorithm: string;
  keyManagement: KeyManagementType;
  compliance: ComplianceStandard[];
}

export type KeyManagementType = 
  | 'hardware_tpm'
  | 'software_based'
  | 'cloud_hsm'
  | 'external_kms';

export type ComplianceStandard = 
  | 'fips_140_2'
  | 'common_criteria'
  | 'iso_27001'
  | 'australia_irap';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'failing';

export interface SecurityFeature {
  name: string;
  enabled: boolean;
  version: string;
  effectiveness: EffectivenessRating;
}

export type EffectivenessRating = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface SecuritySoftwareInfo {
  name: string;
  vendor: string;
  version: string;
  type: SecuritySoftwareType;
  status: SoftwareStatus;
  lastUpdate: Date;
  configuration: SecurityConfiguration;
}

export type SecuritySoftwareType = 
  | 'antivirus'
  | 'anti_malware'
  | 'firewall'
  | 'edr'
  | 'dlp'
  | 'encryption'
  | 'vpn';

export type SoftwareStatus = 
  | 'active'
  | 'inactive'
  | 'outdated'
  | 'misconfigured'
  | 'disabled';

export interface SecurityConfiguration {
  policies: PolicyConfiguration[];
  exclusions: ConfigurationExclusion[];
  alertLevel: AlertLevel;
  automaticActions: AutomaticAction[];
}

export interface PolicyConfiguration {
  name: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  lastModified: Date;
}

export interface ConfigurationExclusion {
  type: ExclusionType;
  target: string;
  reason: string;
  approved: boolean;
  expiration?: Date;
}

export type ExclusionType = 
  | 'file_path'
  | 'process'
  | 'network_address'
  | 'registry_key'
  | 'certificate';

export type AlertLevel = 'silent' | 'low' | 'medium' | 'high' | 'maximum';

export interface AutomaticAction {
  trigger: ActionTrigger;
  action: ResponseAction;
  conditions: ActionCondition[];
}

export interface ActionTrigger {
  event: SecurityEvent;
  severity: RiskSeverity;
  confidence: number;
}

export type SecurityEvent = 
  | 'malware_detected'
  | 'suspicious_behavior'
  | 'unauthorized_access'
  | 'data_exfiltration'
  | 'policy_violation';

export type ResponseAction = 
  | 'quarantine'
  | 'block'
  | 'alert'
  | 'isolate'
  | 'remediate'
  | 'escalate';

export interface ActionCondition {
  parameter: string;
  operator: string;
  value: string;
}

export interface DeviceOwner {
  userId: string;
  department: string;
  role: string;
  clearanceLevel: SecurityClearanceLevel;
  contactInfo: ContactInformation;
}

export type SecurityClearanceLevel = 
  | 'public'
  | 'official'
  | 'protected'
  | 'secret'
  | 'top_secret';

export interface ContactInformation {
  email: string;
  phone: string;
  alternateContact?: string;
  emergencyContact?: string;
}

export type TrustLevel = 
  | 'untrusted'
  | 'low_trust'
  | 'medium_trust'
  | 'high_trust'
  | 'fully_trusted';

export interface DeviceTrustScore {
  deviceId: string;
  overallScore: number;
  factors: TrustFactor[];
  compliance: ComplianceStatus;
  recommendations: TrustRecommendation[];
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface TrustFactor {
  name: string;
  weight: number;
  score: number;
  status: FactorStatus;
  evidence: TrustEvidence[];
}

export type FactorStatus = 'pass' | 'fail' | 'warning' | 'unknown';

export interface TrustEvidence {
  type: EvidenceType;
  description: string;
  timestamp: Date;
  source: string;
  confidence: number;
}

export type EvidenceType = 
  | 'configuration'
  | 'behavior'
  | 'software'
  | 'hardware'
  | 'network'
  | 'user';

export interface ComplianceStatus {
  overall: ComplianceLevel;
  standards: StandardCompliance[];
  violations: ComplianceViolation[];
  remediation: RemediationPlan[];
}

export type ComplianceLevel = 
  | 'non_compliant'
  | 'partially_compliant'
  | 'compliant'
  | 'exceeds_compliance';

export interface StandardCompliance {
  standard: ComplianceStandard;
  level: ComplianceLevel;
  controls: ControlCompliance[];
  lastAudit: Date;
  nextAudit: Date;
}

export interface ControlCompliance {
  controlId: string;
  description: string;
  status: ControlStatus;
  evidence: ComplianceEvidence[];
  findings: AuditFinding[];
}

export type ControlStatus = 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';

export interface ComplianceEvidence {
  type: string;
  description: string;
  artifact: string;
  verificationDate: Date;
  verifiedBy: string;
}

export interface AuditFinding {
  severity: FindingSeverity;
  description: string;
  recommendation: string;
  deadline: Date;
  owner: string;
  status: FindingStatus;
}

export type FindingSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'accepted_risk';

export interface ComplianceViolation {
  violationId: string;
  standard: ComplianceStandard;
  control: string;
  description: string;
  severity: ViolationSeverity;
  detectedAt: Date;
  impact: ImpactAssessment;
  remediation: ViolationRemediation;
}

export type ViolationSeverity = 'minor' | 'major' | 'severe' | 'critical';

export interface ImpactAssessment {
  scope: ImpactScope;
  severity: ImpactSeverity;
  affectedSystems: string[];
  businessImpact: BusinessImpact;
  riskRating: RiskRating;
}

export type ImpactScope = 'local' | 'department' | 'organization' | 'external';
export type ImpactSeverity = 'negligible' | 'minor' | 'moderate' | 'major' | 'catastrophic';

export interface BusinessImpact {
  financial: FinancialImpact;
  operational: OperationalImpact;
  reputational: ReputationalImpact;
  regulatory: RegulatoryImpact;
}

export interface FinancialImpact {
  estimatedCost: number;
  currency: string;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: CostCategory;
  amount: number;
  description: string;
}

export type CostCategory = 
  | 'direct_costs'
  | 'indirect_costs'
  | 'opportunity_costs'
  | 'regulatory_fines'
  | 'legal_costs';

export interface OperationalImpact {
  downtime: number;
  performanceDegradation: number;
  affectedProcesses: string[];
  recoveryTime: number;
}

export interface ReputationalImpact {
  customerImpact: CustomerImpact;
  partnerImpact: PartnerImpact;
  mediaExposure: MediaExposure;
  brandDamage: BrandDamage;
}

export interface CustomerImpact {
  affectedCustomers: number;
  trustScore: number;
  churnRisk: number;
  satisfactionImpact: number;
}

export interface PartnerImpact {
  affectedPartners: number;
  relationshipImpact: PartnershipImpact;
  contractualImplications: string[];
}

export type PartnershipImpact = 'none' | 'minor' | 'moderate' | 'significant' | 'severe';

export interface MediaExposure {
  likelihood: ExposureLikelihood;
  reach: ExposureReach;
  sentiment: MediaSentiment;
  duration: number;
}

export type ExposureLikelihood = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type ExposureReach = 'local' | 'national' | 'international' | 'global';
export type MediaSentiment = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

export interface BrandDamage {
  severity: DamageSeverity;
  duration: DamageDuration;
  recoveryPlan: BrandRecoveryPlan;
}

export type DamageSeverity = 'minimal' | 'minor' | 'moderate' | 'major' | 'severe';
export type DamageDuration = 'temporary' | 'short_term' | 'medium_term' | 'long_term' | 'permanent';

export interface BrandRecoveryPlan {
  strategies: RecoveryStrategy[];
  timeline: string;
  budget: number;
  successMetrics: SuccessMetric[];
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  tactics: string[];
  timeline: string;
  budget: number;
}

export interface SuccessMetric {
  name: string;
  baseline: number;
  target: number;
  measurement: MeasurementMethod;
}

export type MeasurementMethod = 
  | 'survey'
  | 'social_media'
  | 'sales_data'
  | 'web_analytics'
  | 'brand_tracking';

export interface RegulatoryImpact {
  applicableRegulations: ApplicableRegulation[];
  potentialFines: PotentialFine[];
  reportingRequirements: ReportingRequirement[];
  complianceActions: ComplianceAction[];
}

export interface ApplicableRegulation {
  name: string;
  jurisdiction: string;
  severity: RegulatorySeverity;
  requirements: RegulatoryRequirement[];
}

export type RegulatorySeverity = 'advisory' | 'minor' | 'moderate' | 'major' | 'severe';

export interface RegulatoryRequirement {
  requirement: string;
  deadline: Date;
  penalty: string;
  status: RequirementStatus;
}

export type RequirementStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface PotentialFine {
  regulator: string;
  amount: number;
  currency: string;
  basis: string;
  likelihood: number;
}

export interface ReportingRequirement {
  regulator: string;
  reportType: string;
  deadline: Date;
  format: string;
  submitted: boolean;
}

export interface ComplianceAction {
  action: string;
  regulator: string;
  deadline: Date;
  owner: string;
  status: ActionStatus;
}

export type RiskRating = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface ViolationRemediation {
  plan: RemediationPlan[];
  priority: RemediationPriority;
  timeline: string;
  cost: number;
  success_criteria: string[];
}

export type RemediationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RemediationPlan {
  step: number;
  action: string;
  owner: string;
  deadline: Date;
  dependencies: string[];
  status: PlanStatus;
}

export type PlanStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

export interface TrustRecommendation {
  priority: RecommendationPriority;
  category: RecommendationCategory;
  description: string;
  implementation: ImplementationPlan;
  expectedImpact: ImpactProjection;
}

export type RecommendationCategory = 
  | 'configuration'
  | 'software_update'
  | 'hardware_replacement'
  | 'policy_change'
  | 'user_training';

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: string;
  resources: RequiredResource[];
  risks: ImplementationRisk[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  owner: string;
  duration: string;
  prerequisites: string[];
}

export interface RequiredResource {
  type: ResourceType;
  description: string;
  quantity: number;
  cost?: number;
}

export type ResourceType = 
  | 'personnel'
  | 'hardware'
  | 'software'
  | 'training'
  | 'external_service';

export interface ImplementationRisk {
  description: string;
  probability: number;
  impact: ImpactLevel;
  mitigation: string;
}

export type ImpactLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface ImpactProjection {
  securityImprovement: number;
  complianceImprovement: number;
  operationalImpact: OperationalImpactProjection;
  timeframe: string;
}

export interface OperationalImpactProjection {
  downtime: number;
  performanceImpact: number;
  userImpact: UserImpactLevel;
  supportLoad: SupportLoadLevel;
}

export type UserImpactLevel = 'none' | 'minimal' | 'moderate' | 'significant' | 'major';
export type SupportLoadLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

// Network Segmentation & Micro-Perimeter
export interface MicroPerimeterConfig {
  name: string;
  description: string;
  scope: NetworkScope;
  policies: NetworkPolicy[];
  monitoring: NetworkMonitoring;
  enforcement: EnforcementMode;
}

export interface NetworkScope {
  subnets: string[];
  applications: string[];
  users: string[];
  devices: string[];
  dataTypes: DataType[];
}

export type DataType = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top_secret';

export interface NetworkPolicy {
  id: string;
  name: string;
  source: NetworkEntity;
  destination: NetworkEntity;
  protocol: NetworkProtocol;
  action: PolicyAction;
  conditions: PolicyCondition[];
}

export interface NetworkEntity {
  type: EntityType;
  identifier: string;
  attributes: EntityAttribute[];
}

export type EntityType = 
  | 'ip_address'
  | 'subnet'
  | 'user'
  | 'device'
  | 'application'
  | 'service';

export interface EntityAttribute {
  name: string;
  value: string;
  operator: AttributeOperator;
}

export type AttributeOperator = 'equals' | 'not_equals' | 'contains' | 'matches' | 'in_range';

export interface NetworkProtocol {
  name: string;
  ports: PortRange[];
  encrypted: boolean;
  version?: string;
}

export interface PortRange {
  start: number;
  end: number;
  description?: string;
}

export type PolicyAction = 'allow' | 'deny' | 'log' | 'alert' | 'quarantine' | 'rate_limit';

export interface PolicyCondition {
  type: ConditionType;
  parameter: string;
  value: string;
  operator: string;
}

export interface NetworkMonitoring {
  enabled: boolean;
  level: MonitoringLevel;
  alerts: AlertConfiguration[];
  logging: LoggingConfiguration;
}

export interface AlertConfiguration {
