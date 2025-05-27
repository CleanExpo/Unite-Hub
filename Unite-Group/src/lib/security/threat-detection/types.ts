/**
 * Advanced Threat Detection & Response Types
 * Unite Group - Version 13.0 Phase 2 Implementation
 */

export interface ThreatDetectionFramework {
  // AI-Powered Threat Intelligence
  analyzeThreatIntelligence(sources: ThreatIntelligenceSources): Promise<ThreatIntelligenceReport>;
  detectBehavioralAnomalies(entity: MonitoredEntity): Promise<AnomalyDetection[]>;
  classifyThreat(threat: ThreatData): Promise<ThreatClassification>;
  updateThreatSignatures(signatures: ThreatSignature[]): Promise<SignatureUpdateResult>;
  
  // Security Orchestration & Automated Response (SOAR)
  createPlaybook(playbook: PlaybookDefinition): Promise<Playbook>;
  executePlaybook(playbookId: string, context: ExecutionContext): Promise<PlaybookExecution>;
  updatePlaybook(playbookId: string, updates: Partial<PlaybookDefinition>): Promise<Playbook>;
  monitorPlaybookExecution(executionId: string): Promise<ExecutionStatus>;
  
  // Advanced Persistent Threat (APT) Detection
  detectAPTCampaign(indicators: APTIndicator[]): Promise<APTDetectionResult>;
  trackAPTProgression(campaignId: string): Promise<APTProgressionAnalysis>;
  generateAPTReport(campaignId: string): Promise<APTReport>;
  mitigateAPTThreat(campaignId: string, strategy: MitigationStrategy): Promise<MitigationResult>;
  
  // Vulnerability Management
  scanVulnerabilities(target: ScanTarget): Promise<VulnerabilityReport>;
  prioritizeVulnerabilities(vulnerabilities: Vulnerability[]): Promise<VulnerabilityPriority[]>;
  schedulePatching(patches: PatchSchedule[]): Promise<PatchingPlan>;
  validatePatching(patchId: string): Promise<PatchValidationResult>;
  
  // Incident Response Automation
  createIncident(incident: IncidentData): Promise<SecurityIncident>;
  escalateIncident(incidentId: string, escalation: EscalationLevel): Promise<IncidentEscalation>;
  coordinateResponse(incidentId: string, teams: ResponseTeam[]): Promise<ResponseCoordination>;
  generateForensicReport(incidentId: string): Promise<ForensicReport>;
  
  // Real-Time Monitoring & Analytics
  streamThreatData(filters: ThreatDataFilters): Promise<ThreatDataStream>;
  generateThreatMetrics(timeframe: string): Promise<ThreatMetrics>;
  createThreatDashboard(config: DashboardConfig): Promise<ThreatDashboard>;
  analyzeThreatTrends(period: AnalysisPeriod): Promise<ThreatTrendAnalysis>;
}

// Threat Intelligence
export interface ThreatIntelligenceSources {
  commercial: CommercialThreatFeed[];
  government: GovernmentThreatFeed[];
  openSource: OpenSourceThreatFeed[];
  internal: InternalThreatData[];
  community: CommunityThreatFeed[];
}

export interface CommercialThreatFeed {
  provider: ThreatIntelProvider;
  feedType: FeedType;
  apiEndpoint: string;
  apiKey: string;
  refreshInterval: number;
  dataQuality: QualityRating;
  coverage: ThreatCoverage;
}

export type ThreatIntelProvider = 
  | 'crowdstrike'
  | 'mandiant'
  | 'recorded_future'
  | 'anomali'
  | 'threatconnect'
  | 'microsoft_defender'
  | 'palo_alto_unit42';

export type FeedType = 
  | 'ioc_feed'
  | 'malware_signatures'
  | 'attack_patterns'
  | 'vulnerability_data'
  | 'threat_actor_profiles'
  | 'campaign_tracking';

export type QualityRating = 'low' | 'medium' | 'high' | 'premium';

export interface ThreatCoverage {
  regions: string[];
  industries: string[];
  threatTypes: ThreatType[];
  confidence: number;
}

export type ThreatType = 
  | 'malware'
  | 'phishing'
  | 'ransomware'
  | 'apt'
  | 'insider_threat'
  | 'supply_chain'
  | 'zero_day'
  | 'ddos'
  | 'data_exfiltration';

export interface GovernmentThreatFeed {
  agency: GovernmentAgency;
  classification: SecurityClassification;
  accessLevel: AccessLevel;
  alertTypes: AlertType[];
  australianContext: boolean;
}

export type GovernmentAgency = 
  | 'acsc' // Australian Cyber Security Centre
  | 'cisa' // US Cybersecurity and Infrastructure Security Agency
  | 'ncsc' // UK National Cyber Security Centre
  | 'cert_au' // CERT Australia
  | 'asd' // Australian Signals Directorate
  | 'dfat'; // Department of Foreign Affairs and Trade

export type SecurityClassification = 
  | 'unclassified'
  | 'official'
  | 'protected'
  | 'secret'
  | 'top_secret';

export type AccessLevel = 'public' | 'registered' | 'partner' | 'government' | 'classified';

export type AlertType = 
  | 'threat_advisory'
  | 'vulnerability_bulletin'
  | 'incident_report'
  | 'malware_alert'
  | 'sector_warning'
  | 'critical_infrastructure_alert';

export interface OpenSourceThreatFeed {
  source: OpenSourceProvider;
  license: LicenseType;
  updateFrequency: UpdateFrequency;
  dataFormat: DataFormat;
  reliability: ReliabilityScore;
}

export type OpenSourceProvider = 
  | 'misp'
  | 'otx_alienvault'
  | 'threatminer'
  | 'virustotal'
  | 'abuse_ch'
  | 'emergingthreats'
  | 'spamhaus';

export type LicenseType = 'public_domain' | 'creative_commons' | 'open_source' | 'attribution_required';
export type UpdateFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type DataFormat = 'stix' | 'json' | 'xml' | 'csv' | 'yara' | 'snort';
export type ReliabilityScore = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface InternalThreatData {
  source: InternalDataSource;
  dataType: InternalDataType;
  sensitivity: DataSensitivity;
  retention: RetentionPolicy;
  access: AccessControl;
}

export type InternalDataSource = 
  | 'siem_logs'
  | 'network_traffic'
  | 'endpoint_telemetry'
  | 'application_logs'
  | 'user_behavior'
  | 'security_incidents'
  | 'vulnerability_scans';

export type InternalDataType = 
  | 'indicators'
  | 'patterns'
  | 'signatures'
  | 'behaviors'
  | 'artifacts'
  | 'relationships';

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface RetentionPolicy {
  duration: string;
  archiveAfter: string;
  deleteAfter: string;
  compliance: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  standard: string;
  jurisdiction: string;
  requirement: string;
  impact: ComplianceImpact;
}

export type ComplianceImpact = 'low' | 'medium' | 'high' | 'critical';

export interface AccessControl {
  clearanceRequired: SecurityClassification;
  needToKnow: boolean;
  organizationalAccess: OrganizationalAccess[];
  auditLogging: boolean;
}

export interface OrganizationalAccess {
  department: string;
  role: string;
  purpose: AccessPurpose;
  restrictions: AccessRestriction[];
}

export type AccessPurpose = 
  | 'threat_hunting'
  | 'incident_response'
  | 'vulnerability_management'
  | 'risk_assessment'
  | 'compliance_reporting'
  | 'research_analysis';

export interface AccessRestriction {
  type: RestrictionType;
  condition: string;
  enforcement: EnforcementLevel;
}

export type RestrictionType = 
  | 'time_based'
  | 'location_based'
  | 'purpose_based'
  | 'data_classification'
  | 'approval_required';

export type EnforcementLevel = 'advisory' | 'mandatory' | 'blocking' | 'escalating';

export interface CommunityThreatFeed {
  community: ThreatCommunity;
  participationLevel: ParticipationLevel;
  sharingAgreement: SharingAgreement;
  trustLevel: CommunityTrustLevel;
}

export type ThreatCommunity = 
  | 'isac' // Information Sharing and Analysis Center
  | 'first' // Forum of Incident Response and Security Teams
  | 'enisa' // European Union Agency for Cybersecurity
  | 'apwg' // Anti-Phishing Working Group
  | 'industry_specific'
  | 'regional_cert';

export type ParticipationLevel = 'observer' | 'contributor' | 'active_member' | 'steering_committee';

export interface SharingAgreement {
  type: SharingType;
  reciprocity: ReciprocityRequirement;
  attribution: AttributionRequirement;
  restrictions: SharingRestriction[];
}

export type SharingType = 'one_way' | 'bidirectional' | 'community_wide' | 'selective';
export type ReciprocityRequirement = 'none' | 'encouraged' | 'required' | 'balanced';
export type AttributionRequirement = 'anonymous' | 'pseudonymous' | 'attributed' | 'verified';

export interface SharingRestriction {
  scope: RestrictionScope;
  condition: string;
  duration: string;
  penalty: string;
}

export type RestrictionScope = 
  | 'internal_only'
  | 'community_only'
  | 'no_public_disclosure'
  | 'government_only'
  | 'law_enforcement_only';

export type CommunityTrustLevel = 'untrusted' | 'low' | 'medium' | 'high' | 'verified';

export interface ThreatIntelligenceReport {
  id: string;
  timestamp: Date;
  sources: ThreatIntelligenceSourceSummary[];
  threats: ThreatSummary[];
  indicators: ThreatIndicator[];
  recommendations: ThreatRecommendation[];
  confidence: ConfidenceLevel;
  australianContext: AustralianThreatContext;
}

export interface ThreatIntelligenceSourceSummary {
  source: string;
  type: FeedType;
  lastUpdate: Date;
  recordCount: number;
  quality: QualityRating;
  relevance: RelevanceScore;
}

export type RelevanceScore = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface ThreatSummary {
  threatId: string;
  type: ThreatType;
  severity: ThreatSeverity;
  confidence: ConfidenceLevel;
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  prevalence: PrevalenceLevel;
  attribution: ThreatAttribution;
}

export type ThreatSeverity = 'informational' | 'low' | 'medium' | 'high' | 'critical';
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type PrevalenceLevel = 'rare' | 'uncommon' | 'moderate' | 'common' | 'widespread';

export interface ThreatAttribution {
  actor: ThreatActor;
  confidence: ConfidenceLevel;
  evidence: AttributionEvidence[];
  geopoliticalContext: GeopoliticalContext;
}

export interface ThreatActor {
  name: string;
  aliases: string[];
  type: ActorType;
  sophistication: SophisticationLevel;
  motivation: ActorMotivation[];
  geography: ActorGeography;
}

export type ActorType = 
  | 'nation_state'
  | 'criminal_group'
  | 'hacktivist'
  | 'insider'
  | 'terrorist'
  | 'script_kiddie'
  | 'unknown';

export type SophisticationLevel = 'basic' | 'intermediate' | 'advanced' | 'expert' | 'nation_state_level';

export type ActorMotivation = 
  | 'financial'
  | 'espionage'
  | 'sabotage'
  | 'activism'
  | 'terrorism'
  | 'personal'
  | 'unknown';

export interface ActorGeography {
  primaryLocation: string;
  operatingRegions: string[];
  targetRegions: string[];
  infrastructure: InfrastructureLocation[];
}

export interface InfrastructureLocation {
  country: string;
  purpose: InfrastructurePurpose;
  confidence: ConfidenceLevel;
}

export type InfrastructurePurpose = 
  | 'command_control'
  | 'malware_hosting'
  | 'data_exfiltration'
  | 'attack_staging'
  | 'money_laundering'
  | 'communication';

export interface AttributionEvidence {
  type: EvidenceType;
  description: string;
  confidence: ConfidenceLevel;
  source: string;
  timestamp: Date;
}

export type EvidenceType = 
  | 'technical_artifacts'
  | 'tactics_techniques'
  | 'language_analysis'
  | 'timezone_analysis'
  | 'infrastructure_reuse'
  | 'code_similarity'
  | 'target_selection';

export interface GeopoliticalContext {
  tensions: PoliticalTension[];
  sanctions: Sanction[];
  conflicts: Conflict[];
  economicFactors: EconomicFactor[];
}

export interface PoliticalTension {
  countries: string[];
  description: string;
  intensity: TensionIntensity;
  duration: string;
  cyberImplications: string;
}

export type TensionIntensity = 'low' | 'moderate' | 'high' | 'critical';

export interface Sanction {
  imposedBy: string[];
  targetCountries: string[];
  type: SanctionType;
  cyberRelevance: string;
  effectiveness: EffectivenessLevel;
}

export type SanctionType = 'economic' | 'diplomatic' | 'technological' | 'military' | 'cyber';
export type EffectivenessLevel = 'ineffective' | 'limited' | 'moderate' | 'significant' | 'severe';

export interface Conflict {
  type: ConflictType;
  parties: string[];
  region: string;
  cyberDimension: CyberConflictDimension;
  spilloverRisk: SpilloverRisk;
}

export type ConflictType = 'territorial' | 'resource' | 'ideological' | 'proxy' | 'cyber';

export interface CyberConflictDimension {
  present: boolean;
  intensity: ConflictIntensity;
  targets: ConflictTarget[];
  collateralRisk: CollateralRisk;
}

export type ConflictIntensity = 'minimal' | 'limited' | 'moderate' | 'extensive' | 'total';

export interface ConflictTarget {
  sector: CriticalSector;
  countries: string[];
  likelihood: ProbabilityLevel;
}

export type CriticalSector = 
  | 'government'
  | 'defense'
  | 'finance'
  | 'energy'
  | 'telecommunications'
  | 'transportation'
  | 'healthcare'
  | 'water'
  | 'food'
  | 'manufacturing';

export type CollateralRisk = 'negligible' | 'low' | 'medium' | 'high' | 'severe';
export type SpilloverRisk = 'contained' | 'regional' | 'global' | 'cascading';
export type ProbabilityLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface EconomicFactor {
  type: EconomicFactorType;
  impact: EconomicImpact;
  duration: string;
  cyberImplications: string[];
}

export type EconomicFactorType = 
  | 'recession'
  | 'inflation'
  | 'trade_war'
  | 'currency_manipulation'
  | 'market_volatility'
  | 'supply_chain_disruption';

export interface EconomicImpact {
  magnitude: ImpactMagnitude;
  sectors: CriticalSector[];
  regions: string[];
  timeline: ImpactTimeline;
}

export type ImpactMagnitude = 'minimal' | 'minor' | 'moderate' | 'major' | 'severe';

export interface ImpactTimeline {
  immediate: boolean;
  shortTerm: boolean; // < 1 year
  mediumTerm: boolean; // 1-3 years
  longTerm: boolean; // > 3 years
}

export interface ThreatIndicator {
  id: string;
  type: IndicatorType;
  value: string;
  context: IndicatorContext;
  confidence: ConfidenceLevel;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
  relationships: IndicatorRelationship[];
}

export type IndicatorType = 
  | 'ip_address'
  | 'domain'
  | 'url'
  | 'file_hash'
  | 'email_address'
  | 'registry_key'
  | 'file_path'
  | 'user_agent'
  | 'certificate'
  | 'vulnerability'
  | 'attack_pattern'
  | 'malware_family';

export interface IndicatorContext {
  threatType: ThreatType;
  campaign: string;
  actor: string;
  malwareFamily: string;
  attackPhase: AttackPhase;
  targetSectors: CriticalSector[];
}

export type AttackPhase = 
  | 'reconnaissance'
  | 'initial_access'
  | 'execution'
  | 'persistence'
  | 'privilege_escalation'
  | 'defense_evasion'
  | 'credential_access'
  | 'discovery'
  | 'lateral_movement'
  | 'collection'
  | 'command_control'
  | 'exfiltration'
  | 'impact';

export interface IndicatorRelationship {
  relatedIndicator: string;
  relationshipType: RelationshipType;
  confidence: ConfidenceLevel;
  description: string;
}

export type RelationshipType = 
  | 'associated_with'
  | 'variant_of'
  | 'communicates_with'
  | 'downloads_from'
  | 'drops'
  | 'exploits'
  | 'indicates'
  | 'targets'
  | 'uses';

export interface ThreatRecommendation {
  priority: RecommendationPriority;
  category: RecommendationCategory;
  action: string;
  rationale: string;
  implementation: ImplementationGuidance;
  timeline: string;
  resources: RequiredResource[];
  success_metrics: SuccessMetric[];
}

export type RecommendationPriority = 'informational' | 'low' | 'medium' | 'high' | 'critical';

export type RecommendationCategory = 
  | 'threat_hunting'
  | 'detection_rules'
  | 'preventive_controls'
  | 'monitoring_enhancement'
  | 'incident_response'
  | 'vulnerability_mitigation'
  | 'awareness_training'
  | 'policy_update';

export interface ImplementationGuidance {
  prerequisites: string[];
  steps: ImplementationStep[];
  testing: TestingRequirement[];
  rollback: RollbackProcedure;
}

export interface ImplementationStep {
  order: number;
  phase: ImplementationPhase;
  description: string;
  duration: string;
  dependencies: string[];
  risks: ImplementationRisk[];
  validation: ValidationStep[];
}

export type ImplementationPhase = 
  | 'planning'
  | 'development'
  | 'testing'
  | 'deployment'
  | 'validation'
  | 'monitoring';

export interface ImplementationRisk {
  description: string;
  likelihood: ProbabilityLevel;
  impact: ImpactMagnitude;
  mitigation: MitigationAction[];
}

export interface MitigationAction {
  action: string;
  responsibility: string;
  timeline: string;
  cost: CostEstimate;
}

export interface CostEstimate {
  amount: number;
  currency: string;
  confidence: ConfidenceLevel;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: CostCategory;
  amount: number;
  description: string;
}

export type CostCategory = 
  | 'personnel'
  | 'technology'
  | 'infrastructure'
  | 'training'
  | 'external_services'
  | 'compliance'
  | 'testing';

export interface ValidationStep {
  name: string;
  method: ValidationMethod;
  criteria: ValidationCriteria;
  tools: ValidationTool[];
}

export type ValidationMethod = 
  | 'automated_testing'
  | 'manual_verification'
  | 'penetration_testing'
  | 'red_team_exercise'
  | 'tabletop_exercise'
  | 'compliance_audit';

export interface ValidationCriteria {
  metric: string;
  target: ValidationTarget;
  tolerance: number;
  measurement: MeasurementMethod;
}

export interface ValidationTarget {
  type: TargetType;
  value: number;
  unit: string;
}

export type TargetType = 'minimum' | 'maximum' | 'exact' | 'range';
export type MeasurementMethod = 'quantitative' | 'qualitative' | 'binary' | 'percentage';

export interface ValidationTool {
  name: string;
  type: ToolType;
  version: string;
  configuration: ToolConfiguration;
}

export type ToolType = 
  | 'security_scanner'
  | 'monitoring_tool'
  | 'testing_framework'
  | 'analysis_platform'
  | 'compliance_checker';

export interface ToolConfiguration {
  parameters: ConfigurationParameter[];
  profiles: ConfigurationProfile[];
  integrations: ToolIntegration[];
}

export interface ConfigurationParameter {
  name: string;
  value: string;
  description: string;
  required: boolean;
}

export interface ConfigurationProfile {
  name: string;
  description: string;
  settings: Record<string, unknown>;
  use_case: string;
}

export interface ToolIntegration {
  targetSystem: string;
  integrationType: IntegrationType;
  configuration: IntegrationConfiguration;
}

export type IntegrationType = 'api' | 'webhook' | 'file_export' | 'database' | 'message_queue';

export interface IntegrationConfiguration {
  endpoint: string;
  authentication: AuthenticationMethod;
  dataFormat: DataFormat;
  frequency: UpdateFrequency;
}

export type AuthenticationMethod = 
  | 'api_key'
  | 'oauth2'
  | 'certificate'
  | 'username_password'
  | 'token_based'
  | 'mutual_tls';

export interface TestingRequirement {
  type: TestingType;
  scope: TestingScope;
  environment: TestingEnvironment;
  acceptance_criteria: AcceptanceCriteria[];
}

export type TestingType = 
  | 'unit_testing'
  | 'integration_testing'
  | 'system_testing'
  | 'performance_testing'
  | 'security_testing'
  | 'user_acceptance_testing';

export interface TestingScope {
  components: string[];
  interfaces: string[];
  data_flows: string[];
  use_cases: string[];
}

export type TestingEnvironment = 'development' | 'staging' | 'pre_production' | 'production' | 'isolated';

export interface AcceptanceCriteria {
  requirement: string;
  test_method: TestMethod;
  expected_result: string;
  pass_criteria: string;
}

export type TestMethod = 
  | 'automated'
  | 'manual'
  | 'exploratory'
  | 'scenario_based'
  | 'data_driven'
  | 'risk_based';

export interface RollbackProcedure {
  triggers: RollbackTrigger[];
  steps: RollbackStep[];
  validation: RollbackValidation[];
  communication: CommunicationPlan;
}

export interface RollbackTrigger {
  condition: string;
  threshold: ThresholdDefinition;
  automatic: boolean;
  approval_required: boolean;
}

export interface ThresholdDefinition {
  metric: string;
  operator: ComparisonOperator;
  value: number;
  duration: string;
}

export type ComparisonOperator = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';

export interface RollbackStep {
  order: number;
  action: string;
  responsibility: string;
  duration: string;
  dependencies: string[];
  validation: string[];
}

export interface RollbackValidation {
  checkpoint: string;
  validation_method: ValidationMethod;
  success_criteria: string[];
  failure_action: string;
}

export interface CommunicationPlan {
  stakeholders: Stakeholder[];
  channels: CommunicationChannel[];
  templates: MessageTemplate[];
  escalation: EscalationPath[];
}

export interface Stakeholder {
  role: StakeholderRole;
  name: string;
  contact: ContactMethod[];
  notification_preference: NotificationPreference;
}

export type StakeholderRole = 
  | 'incident_commander'
  | 'technical_lead'
  | 'security_team'
  | 'management'
  | 'legal'
  | 'communications'
  | 'customers'
  | 'partners';

export interface ContactMethod {
  type: ContactType;
  value: string;
  priority: ContactPriority;
  availability: AvailabilityWindow;
}

export type ContactType = 'email' | 'phone' | 'sms' | 'slack' | 'teams' | 'pager';
export type ContactPriority = 'primary' | 'secondary' | 'backup' | 'emergency';

export interface AvailabilityWindow {
  timezone: string;
  business_hours: BusinessHours;
  on_call_schedule: OnCallSchedule;
}

export interface BusinessHours {
  days: WeekDay[];
  start_time: string;
  end_time: string;
  holidays: Holiday[];
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Holiday {
  date: string;
  name: string;
  country: string;
  impact: HolidayImpact;
}

export type HolidayImpact = 'none' | 'reduced_availability' | 'emergency_only' | 'unavailable';

export interface OnCallSchedule {
  rotation_type: RotationType;
  rotation_duration: string;
  participants: string[];
  backup_schedule: BackupSchedule;
}

export type RotationType = 'weekly' | 'daily' | 'shift_based' | 'follow_the_sun';

export interface BackupSchedule {
  primary_backup: string;
  secondary_backup: string;
  escalation_time: string;
}

export interface NotificationPreference {
  urgency_threshold: UrgencyLevel;
  preferred_channels: ContactType[];
  frequency_limit: FrequencyLimit;
  acknowledgment_required: boolean;
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical' | 'emergency';

export interface FrequencyLimit {
  max_per_hour: number;
  max_per_day: number;
  aggregation_window: string;
}

export interface CommunicationChannel {
  type: ChannelType;
  configuration: ChannelConfiguration;
  audience: ChannelAudience;
  content_rules: ContentRule[];
}

export type ChannelType = 
  | 'email_list'
  | 'slack_channel'
  | 'teams_channel'
  | 'status_page'
  | 'dashboard'
  | 'api_webhook'
  | 'sms_broadcast'
  | 'phone_tree';

export interface ChannelConfiguration {
  endpoint: string;
  authentication: AuthenticationMethod;
  retry_policy: RetryPolicy;
  rate_limit: RateLimit;
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: BackoffStrategy;
  retry_conditions: RetryCondition[];
}

export type BackoffStrategy = 'linear' | 'exponential' | 'fixed' | 'custom';

export interface RetryCondition {
  error_type: string;
  retry_after: string;
  max_retries: number;
}

export interface RateLimit {
  requests_per_minute: number;
  burst_capacity: number;
  throttling_strategy: ThrottlingStrategy;
}

export type Th
