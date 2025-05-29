/**
 * Advanced Partner & Integration Ecosystem Types
 * Unite Group - Version 12.0 Implementation
 */

export interface PartnerEcosystem {
  // Partner management
  registerPartner(partner: PartnerRegistration): Promise<Partner>;
  updatePartner(partnerId: string, updates: Partial<Partner>): Promise<Partner>;
  getPartner(partnerId: string): Promise<Partner | null>;
  searchPartners(criteria: PartnerSearchCriteria): Promise<Partner[]>;
  deactivatePartner(partnerId: string): Promise<void>;
  
  // Integration management
  createIntegration(integration: IntegrationConfig): Promise<Integration>;
  updateIntegration(integrationId: string, updates: Partial<IntegrationConfig>): Promise<Integration>;
  getIntegration(integrationId: string): Promise<Integration | null>;
  listIntegrations(filters?: IntegrationFilters): Promise<Integration[]>;
  testIntegration(integrationId: string): Promise<IntegrationTestResult>;
  
  // API marketplace
  publishAPI(api: APISpecification): Promise<PublishedAPI>;
  discoverAPIs(filters: APIDiscoveryFilters): Promise<PublishedAPI[]>;
  subscribeToAPI(apiId: string, subscription: APISubscription): Promise<APISubscriptionResult>;
  revokeAPIAccess(apiId: string, subscriberId: string): Promise<void>;
  
  // White-label solutions
  createWhiteLabelSolution(config: WhiteLabelConfig): Promise<WhiteLabelSolution>;
  customizeWhiteLabel(solutionId: string, customizations: WhiteLabelCustomization): Promise<WhiteLabelSolution>;
  deployWhiteLabel(solutionId: string, deployment: WhiteLabelDeployment): Promise<DeploymentResult>;
  
  // Performance monitoring
  getPartnerPerformance(partnerId: string, timeframe: string): Promise<PartnerPerformance>;
  getIntegrationMetrics(integrationId: string, timeframe: string): Promise<IntegrationMetrics>;
  generateEcosystemReport(filters: EcosystemReportFilters): Promise<EcosystemReport>;
}

// API Specification and Marketplace Types
export interface APISpecification {
  name: string;
  version: string;
  description: string;
  category: APICategory;
  endpoints: APIEndpoint[];
  authentication: APIAuthentication;
  rateLimit: APIRateLimit;
  pricing: APIPricing;
  documentation: APIDocumentation;
  sla: ServiceLevelAgreement;
  supportedFormats: string[];
  sdks: APISDKInfo[];
}

export type APICategory = 
  | 'data_analytics'
  | 'artificial_intelligence' 
  | 'customer_management'
  | 'financial_services'
  | 'communication'
  | 'integration'
  | 'security'
  | 'productivity'
  | 'e_commerce'
  | 'utilities';

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  examples: APIExample[];
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  value: string;
  message: string;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: ResponseSchema;
  headers?: Record<string, string>;
}

export interface ResponseSchema {
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: string;
  description: string;
  example?: string;
}

export interface APIExample {
  title: string;
  description: string;
  request: ExampleRequest;
  response: ExampleResponse;
}

export interface ExampleRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface ExampleResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: Record<string, unknown>;
}

export interface APIAuthentication {
  type: 'api_key' | 'oauth2' | 'jwt' | 'basic' | 'none';
  description: string;
  parameters?: AuthParameter[];
}

export interface AuthParameter {
  name: string;
  location: 'header' | 'query' | 'body';
  description: string;
}

export interface APIRateLimit {
  requestsPerSecond: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface APIPricing {
  model: APIPricingModel;
  tiers: PricingTier[];
  currency: string;
  billing: BillingInfo;
}

export type APIPricingModel = 'free' | 'freemium' | 'subscription' | 'pay_per_use' | 'enterprise';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  limits: APILimits;
  features: string[];
}

export interface BillingInfo {
  cycle: 'monthly' | 'quarterly' | 'annually';
  trialPeriod?: number;
  setupFee?: number;
}

export interface APIDocumentation {
  overview: string;
  gettingStarted: string;
  endpoints: EndpointDocumentation[];
  examples: CodeExample[];
  sdks: SDKDocumentation[];
  changelog: ChangelogEntry[];
}

export interface EndpointDocumentation {
  endpoint: string;
  description: string;
  useCases: string[];
  bestPractices: string[];
  troubleshooting: TroubleshootingGuide[];
}

export interface TroubleshootingGuide {
  issue: string;
  solution: string;
  preventive: string[];
}

export interface CodeExample {
  language: string;
  title: string;
  description: string;
  code: string;
}

export interface SDKDocumentation {
  language: string;
  installation: string;
  quickStart: string;
  examples: CodeExample[];
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: ChangeDescription[];
}

export interface ChangeDescription {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
}

export interface ServiceLevelAgreement {
  availability: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  penalties: SLAPenalty[];
  escalation: SLAEscalation[];
}

export interface SLAPenalty {
  metric: string;
  threshold: number;
  penaltyType: 'financial' | 'service_credit' | 'termination_right';
  amount: number;
}

export interface SLAEscalation {
  trigger: string;
  timeline: number;
  contacts: EscalationContact[];
  actions: string[];
}

export interface EscalationContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  priority: number;
}

export interface APISDKInfo {
  language: string;
  version: string;
  downloadUrl: string;
  documentation: string;
  examples: string[];
}

export interface PublishedAPI {
  id: string;
  specification: APISpecification;
  publisher: APIPublisher;
  status: 'active' | 'deprecated' | 'maintenance';
  metrics: APIMetrics;
  reviews: APIReview[];
  subscriptions: APISubscriptionSummary;
  publishedDate: Date;
  lastUpdated: Date;
}

export interface APIPublisher {
  id: string;
  name: string;
  type: 'internal' | 'partner' | 'external';
  reputation: number;
  apiCount: number;
  totalSubscribers: number;
}

export interface APIMetrics {
  totalRequests: number;
  uniqueUsers: number;
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  popularEndpoints: EndpointUsage[];
}

export interface EndpointUsage {
  endpoint: string;
  requests: number;
  responseTime: number;
  errorRate: number;
  popularity: number;
}

export interface APIReview {
  id: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  date: Date;
  helpful: number;
  verified: boolean;
}

export interface APISubscriptionSummary {
  totalSubscribers: number;
  activeSubscribers: number;
  tierDistribution: Record<string, number>;
  monthlyGrowth: number;
  churnRate: number;
  averageRating: number;
}

// Integration Types
export type IntegrationType = 
  | 'data_sync'
  | 'api_integration'
  | 'webhook'
  | 'file_transfer'
  | 'message_queue'
  | 'database_connection'
  | 'real_time_streaming';

export type IntegrationStatus = 'active' | 'inactive' | 'testing' | 'failed' | 'maintenance';

export interface IntegrationEndpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  timeout: number;
  retries: number;
}

export interface AuthenticationConfig {
  type: string;
  credentials: Record<string, string>;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: TransformationRule;
  validation?: ValidationRule;
}

export interface TransformationRule {
  type: 'format' | 'calculate' | 'lookup' | 'conditional';
  parameters: Record<string, unknown>;
}

export interface ErrorHandlingConfig {
  retryPolicy: RetryPolicy;
  fallbackAction: string;
  notifications: NotificationConfig[];
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  recipients: string[];
  conditions: string[];
}

export interface IntegrationMonitoring {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
  logging: LoggingConfig;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  action: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: string;
  retention: number;
}

// Partner Types
export interface PartnerSearchCriteria {
  type?: PartnerType[];
  tier?: PartnerTier[];
  status?: PartnerStatus[];
  capabilities?: string[];
  location?: string[];
  rating?: { min: number; max: number };
  certifications?: string[];
}

export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  partnerId: string;
  configuration: IntegrationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  name: string;
  type: IntegrationType;
  endpoints: IntegrationEndpoint[];
  authentication: AuthenticationConfig;
  dataMapping: DataMapping[];
  errorHandling: ErrorHandlingConfig;
  monitoring: IntegrationMonitoring;
}

export interface IntegrationFilters {
  type?: IntegrationType[];
  status?: IntegrationStatus[];
  partnerId?: string[];
  lastUpdated?: { from: Date; to: Date };
}

export interface IntegrationTestResult {
  integrationId: string;
  success: boolean;
  timestamp: Date;
  results: TestResult[];
  overallScore: number;
  recommendations: string[];
}

export interface TestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

export interface APIDiscoveryFilters {
  category?: APICategory[];
  pricing?: APIPricingModel[];
  rating?: { min: number; max: number };
  publisher?: string[];
  keywords?: string[];
}

export interface APISubscription {
  tierId: string;
  billingCycle: 'monthly' | 'quarterly' | 'annually';
  features: string[];
  limits: APILimits;
}

export interface APILimits {
  requestsPerMonth: number;
  rateLimitPerSecond: number;
  dataRetentionDays: number;
  supportLevel: string;
}

export interface APISubscriptionResult {
  subscriptionId: string;
  status: 'active' | 'pending' | 'failed';
  apiKey: string;
  activationDate: Date;
  expirationDate: Date;
  limits: APILimits;
}

// Simplified remaining types to avoid file size issues
export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  tier: PartnerTier;
  registrationDate: Date;
  lastActivity: Date;
  contactInfo: PartnerContactInfo;
  businessInfo: PartnerBusinessInfo;
  capabilities: PartnerCapability[];
  services: PartnerService[];
  certifications: PartnerCertification[];
  performanceMetrics: PartnerPerformanceMetrics;
  reputationScore: number;
  customerRating: number;
  integrations: PartnerIntegration[];
  apiKeys: PartnerAPIKey[];
  webhooks: PartnerWebhook[];
  revenueShare: number;
  commissionStructure: CommissionStructure;
  contractTerms: ContractTerms;
  complianceStatus: ComplianceStatus;
  securityClearance: SecurityClearanceLevel;
  auditHistory: AuditRecord[];
}

export type PartnerType = 
  | 'technology_provider'
  | 'service_provider'
  | 'system_integrator'
  | 'consultant'
  | 'reseller'
  | 'distributor'
  | 'developer'
  | 'marketplace_vendor';

export type PartnerStatus = 
  | 'active'
  | 'pending_approval'
  | 'suspended'
  | 'terminated'
  | 'under_review';

export type PartnerTier = 
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'strategic';

export interface PartnerRegistration {
  name: string;
  type: PartnerType;
  contactInfo: PartnerContactInfo;
  businessInfo: PartnerBusinessInfo;
  capabilities: string[];
  proposedServices: ServiceProposal[];
  referencesAndPortfolio: PartnerReference[];
  complianceDocuments: ComplianceDocument[];
}

// Simplified interfaces to avoid complexity
export interface PartnerContactInfo {
  primaryContact: ContactPerson;
  technicalContact: ContactPerson;
  businessContact: ContactPerson;
  supportContact: ContactPerson;
  address: BusinessAddress;
  communicationPreferences: CommunicationPreferences;
}

export interface ContactPerson {
  name: string;
  title: string;
  email: string;
  phone: string;
  timezone: string;
  availabilityHours: AvailabilityWindow;
}

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  region: string;
  timeZone: string;
}

export interface AvailabilityWindow {
  startTime: string;
  endTime: string;
  days: string[];
  timezone: string;
}

export interface CommunicationPreferences {
  preferredChannels: string[];
  notificationFrequency: string;
  escalationProcedure: EscalationStep[];
}

export interface EscalationStep {
  level: number;
  timeoutMinutes: number;
  contacts: string[];
  channels: string[];
}

export interface PartnerBusinessInfo {
  legalName: string;
  businessRegistrationNumber: string;
  taxId: string;
  establishedYear: number;
  employeeCount: number;
  annualRevenue: number;
  currency: string;
  industries: string[];
  geographicCoverage: string[];
  businessModel: string;
  targetMarkets: string[];
  keyDifferentiators: string[];
  partnerships: ExistingPartnership[];
}

export interface ExistingPartnership {
  partnerName: string;
  relationship: string;
  duration: string;
  description: string;
  reference?: ContactPerson;
}

// Additional core types with simplified structures
export interface ServiceProposal {
  name: string;
  description: string;
  category: ServiceCategory;
  timeline: string;
  pricing: ServicePricing;
  deliverables: string[];
  requirements: string[];
}

export type ServiceCategory = 'development' | 'consulting' | 'integration' | 'support' | 'training';

export interface ServicePricing {
  model: 'fixed' | 'hourly' | 'monthly' | 'project_based';
  amount: number;
  currency: string;
}

export interface PartnerReference {
  clientName: string;
  contactPerson: ContactPerson;
  projectDescription: string;
  duration: string;
  value: number;
  outcome: string;
  rating: number;
}

export interface ComplianceDocument {
  name: string;
  type: string;
  url: string;
  issueDate: Date;
  expirationDate?: Date;
  verificationStatus: string;
}

// Core simplified types for the remaining interfaces
export interface PartnerCapability {
  id: string;
  name: string;
  category: string;
  description: string;
  proficiencyLevel: string;
}

export interface PartnerService {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: ServicePricing;
}

export interface PartnerCertification {
  name: string;
  issuer: string;
  issueDate: Date;
  expirationDate?: Date;
  verificationUrl?: string;
}

export interface PartnerPerformanceMetrics {
  overallScore: number;
  reliability: number;
  quality: number;
  responsiveness: number;
  customerSatisfaction: number;
}

export interface PartnerIntegration {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface PartnerAPIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  status: string;
}

export interface PartnerWebhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  createdAt: Date;
}

export interface CommissionStructure {
  type: string;
  rates: CommissionRate[];
  paymentSchedule: string;
  minimumPayout: number;
  currency: string;
}

export interface CommissionRate {
  threshold: number;
  rate: number;
  description: string;
}

export interface ContractTerms {
  startDate: Date;
  endDate?: Date;
  renewalTerms: RenewalTerms;
  terminationClauses: TerminationClause[];
  governingLaw: string;
  disputeResolution: string;
}

export interface RenewalTerms {
  autoRenewal: boolean;
  renewalPeriod: string;
  noticePeriod: string;
}

export interface TerminationClause {
  condition: string;
  noticePeriod: string;
  consequences: string[];
}

export interface ComplianceStatus {
  overall: string;
  standards: ComplianceStandard[];
  lastAudit: Date;
  nextAudit: Date;
  issues: ComplianceIssue[];
}

export interface ComplianceStandard {
  name: string;
  status: string;
  lastChecked: Date;
}

export interface ComplianceIssue {
  id: string;
  severity: string;
  description: string;
  remediation: string[];
  dueDate: Date;
}

export type SecurityClearanceLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface AuditRecord {
  id: string;
  type: string;
  date: Date;
  auditor: string;
  scope: string[];
  findings: AuditFinding[];
  status: string;
}

export interface AuditFinding {
  severity: string;
  category: string;
  description: string;
  evidence: string[];
  impact: string;
}

// White-label and performance monitoring types
export interface WhiteLabelConfig {
  name: string;
  description: string;
  features: string[];
  branding: BrandingConfig;
  deployment: DeploymentConfig;
}

export interface BrandingConfig {
  logo: string;
  colors: ColorScheme;
  fonts: FontConfig;
  domain: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface FontConfig {
  heading: string;
  body: string;
}

export interface DeploymentConfig {
  environment: string;
  region: string;
  scalingPolicy: ScalingPolicy;
}

export interface ScalingPolicy {
  minInstances: number;
  maxInstances: number;
  autoScaling: boolean;
}

export interface WhiteLabelSolution {
  id: string;
  name: string;
  config: WhiteLabelConfig;
  status: string;
  deployments: WhiteLabelDeployment[];
  customizations: WhiteLabelCustomization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelCustomization {
  type: string;
  changes: Record<string, unknown>;
  appliedAt: Date;
  appliedBy: string;
}

export interface WhiteLabelDeployment {
  id: string;
  environment: string;
  url: string;
  status: string;
  deployedAt: Date;
  version: string;
}

export interface DeploymentResult {
  deploymentId: string;
  status: string;
  url?: string;
  error?: string;
  logs: DeploymentLog[];
  duration: number;
}

export interface DeploymentLog {
  timestamp: Date;
  level: string;
  message: string;
}

export interface PartnerPerformance {
  partnerId: string;
  timeframe: string;
  metrics: PerformanceMetric[];
  trends: PerformanceTrend[];
  lastUpdated: Date;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: string;
}

export interface PerformanceTrend {
  metric: string;
  direction: string;
  confidence: number;
}

export interface IntegrationMetrics {
  integrationId: string;
  timeframe: string;
  availability: number;
  responseTime: number;
  errorRate: number;
  successRate: number;
}

export interface EcosystemReportFilters {
  timeframe: string;
  partners?: string[];
  integrations?: string[];
  format: string;
}

export interface EcosystemReport {
  id: string;
  title: string;
  generatedAt: Date;
  timeframe: string;
  filters: EcosystemReportFilters;
  summary: EcosystemSummary;
  trends: EcosystemTrend[];
  recommendations: EcosystemRecommendation[];
}

export interface EcosystemSummary {
  totalPartners: number;
  activeIntegrations: number;
  totalRevenue: number;
  growthRate: number;
  customerSatisfaction: number;
  systemHealth: number;
}

export interface EcosystemTrend {
  name: string;
  description: string;
  type: string;
  direction: string;
  strength: number;
}

export interface EcosystemRecommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
  expectedOutcomes: string[];
}
