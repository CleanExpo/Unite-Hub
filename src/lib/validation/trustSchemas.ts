/**
 * Trust & Autonomy Validation Schemas - Phase 9
 *
 * Zod schemas for Trusted Mode and autonomy operations.
 */

import { z } from "zod";

// =============================================================
// Enums and Constants
// =============================================================

export const TrustedModeStatusSchema = z.enum([
  "PENDING_IDENTITY",
  "PENDING_OWNERSHIP",
  "PENDING_SIGNATURE",
  "ACTIVE",
  "REJECTED",
  "REVOKED",
]);
export type TrustedModeStatus = z.infer<typeof TrustedModeStatusSchema>;

export const DomainScopeSchema = z.enum(["SEO", "CONTENT", "ADS", "CRO"]);
export type DomainScope = z.infer<typeof DomainScopeSchema>;

export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ProposalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXECUTING",
  "EXECUTED",
  "FAILED",
  "ROLLED_BACK",
]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ExecutorTypeSchema = z.enum(["SYSTEM", "HUMAN", "HYBRID"]);
export type ExecutorType = z.infer<typeof ExecutorTypeSchema>;

export const RollbackTypeSchema = z.enum([
  "SOFT_UNDO",
  "HARD_UNDO",
  "ESCALATED_RESTORE",
]);
export type RollbackType = z.infer<typeof RollbackTypeSchema>;

export const ApprovalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "AUTO_APPROVED_TRUSTED_MODE",
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

export const SignatureProviderSchema = z.enum([
  "docusign",
  "hellosign",
  "manual",
]);
export type SignatureProvider = z.infer<typeof SignatureProviderSchema>;

// =============================================================
// Scope Configuration Schemas
// =============================================================

export const SEOScopeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowed_changes: z.array(z.string()).default([]),
  forbidden_changes: z.array(z.string()).default([]),
  max_title_change_percent: z.number().min(0).max(100).default(20),
  max_meta_change_percent: z.number().min(0).max(100).default(30),
  auto_fix_technical: z.boolean().default(false),
  auto_fix_canonical: z.boolean().default(false),
  auto_internal_linking: z.boolean().default(false),
});
export type SEOScopeConfig = z.infer<typeof SEOScopeConfigSchema>;

export const ContentScopeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowed_changes: z.array(z.string()).default([]),
  forbidden_changes: z.array(z.string()).default([]),
  auto_create_blogs: z.boolean().default(false),
  auto_update_stats: z.boolean().default(false),
  auto_add_faq: z.boolean().default(false),
  auto_alt_text: z.boolean().default(false),
  approved_categories: z.array(z.string()).default([]),
});
export type ContentScopeConfig = z.infer<typeof ContentScopeConfigSchema>;

export const AdsScopeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowed_changes: z.array(z.string()).default([]),
  forbidden_changes: z.array(z.string()).default([]),
  max_bid_change_percent: z.number().min(0).max(100).default(15),
  max_budget_increase_percent: z.number().min(0).max(100).default(10),
  draft_only: z.boolean().default(true),
  auto_negative_keywords: z.boolean().default(false),
});
export type AdsScopeConfig = z.infer<typeof AdsScopeConfigSchema>;

export const CROScopeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  allowed_changes: z.array(z.string()).default([]),
  forbidden_changes: z.array(z.string()).default([]),
  auto_create_tests: z.boolean().default(false),
  require_accessibility_check: z.boolean().default(true),
  max_concurrent_tests: z.number().min(1).max(10).default(3),
});
export type CROScopeConfig = z.infer<typeof CROScopeConfigSchema>;

// =============================================================
// Identity & Ownership Verification Schemas
// =============================================================

export const IdentityVerificationResultSchema = z.object({
  verified: z.boolean(),
  method: z.enum(["ABN_ACN", "DNS", "MANUAL"]),
  abn_acn: z.string().optional(),
  legal_name: z.string().optional(),
  trading_name: z.string().optional(),
  verified_at: z.string().datetime().optional(),
  verification_source: z.string().optional(),
  notes: z.string().optional(),
});
export type IdentityVerificationResult = z.infer<typeof IdentityVerificationResultSchema>;

export const OwnershipVerificationResultSchema = z.object({
  verified: z.boolean(),
  method: z.enum(["GSC", "DNS_TXT", "HTML_FILE", "META_TAG", "MANUAL"]),
  domain: z.string(),
  verified_at: z.string().datetime().optional(),
  gsc_property_id: z.string().optional(),
  dns_record: z.string().optional(),
  verification_code: z.string().optional(),
  notes: z.string().optional(),
});
export type OwnershipVerificationResult = z.infer<typeof OwnershipVerificationResultSchema>;

// =============================================================
// Trusted Mode Request Schemas
// =============================================================

export const TrustedModeRequestSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  status: TrustedModeStatusSchema,
  identity_verification_result: IdentityVerificationResultSchema.optional(),
  ownership_verification_result: OwnershipVerificationResultSchema.optional(),
  signature_document_id: z.string().optional(),
  signature_provider: SignatureProviderSchema.optional(),
  signed_at: z.string().datetime().optional(),
  signer_ip: z.string().optional(),
  signer_email: z.string().email().optional(),
  scopes_config_json: z.record(z.any()).optional(),
  restore_email: z.string().email().optional(),
  emergency_phone: z.string().optional(),
  nightly_backup_enabled: z.boolean().default(true),
  backup_retention_days: z.number().min(7).max(365).default(30),
  initiated_by: z.string().uuid(),
  rejected_reason: z.string().optional(),
  revoked_reason: z.string().optional(),
  revoked_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type TrustedModeRequest = z.infer<typeof TrustedModeRequestSchema>;

// =============================================================
// Autonomy Scopes Schema
// =============================================================

export const AutonomyScopesSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  seo_scope_json: SEOScopeConfigSchema,
  content_scope_json: ContentScopeConfigSchema,
  ads_scope_json: AdsScopeConfigSchema,
  cro_scope_json: CROScopeConfigSchema,
  max_daily_actions: z.number().min(1).max(100).default(10),
  max_risk_level_allowed: RiskLevelSchema.default("LOW"),
  execution_window_start: z.string().default("09:00:00"),
  execution_window_end: z.string().default("17:00:00"),
  execution_timezone: z.string().default("Australia/Brisbane"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type AutonomyScopes = z.infer<typeof AutonomyScopesSchema>;

// =============================================================
// Autonomy Proposal Schemas
// =============================================================

export const AutonomyProposalSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  report_id: z.string().uuid().optional(),
  audit_id: z.string().uuid().optional(),
  recommendation_id: z.string().uuid().optional(),
  domain_scope: DomainScopeSchema,
  change_type: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  risk_level: RiskLevelSchema,
  risk_explanation: z.string().optional(),
  proposed_diff: z.record(z.any()),
  proposed_diff_path: z.string().optional(),
  target_url: z.string().url().optional(),
  target_element: z.string().optional(),
  status: ProposalStatusSchema,
  requires_approval: z.boolean().default(true),
  auto_approved: z.boolean().default(false),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().datetime().optional(),
  rejection_reason: z.string().optional(),
  executed_by: z.string().optional(),
  executed_at: z.string().datetime().optional(),
  execution_error: z.string().optional(),
  rollback_token_id: z.string().uuid(),
  rollback_deadline: z.string().datetime().optional(),
  rolled_back_at: z.string().datetime().optional(),
  rolled_back_by: z.string().uuid().optional(),
  created_by: z.string().default("SYSTEM"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type AutonomyProposal = z.infer<typeof AutonomyProposalSchema>;

// =============================================================
// Autonomy Execution Schemas
// =============================================================

export const AutonomyExecutionSchema = z.object({
  id: z.string().uuid(),
  proposal_id: z.string().uuid(),
  client_id: z.string().uuid(),
  executor_type: ExecutorTypeSchema,
  executor_id: z.string().optional(),
  agent_name: z.string().optional(),
  before_snapshot_path: z.string().optional(),
  after_snapshot_path: z.string().optional(),
  execution_logs_path: z.string().optional(),
  change_summary: z.string().optional(),
  affected_urls: z.array(z.string()).optional(),
  affected_elements: z.record(z.any()).optional(),
  rollback_token_id: z.string().uuid(),
  rollback_type: RollbackTypeSchema.optional(),
  rollback_available_until: z.string().datetime().optional(),
  success: z.boolean(),
  error_message: z.string().optional(),
  duration_ms: z.number().optional(),
  executed_at: z.string().datetime(),
});
export type AutonomyExecution = z.infer<typeof AutonomyExecutionSchema>;

// =============================================================
// Audit Log Schema
// =============================================================

export const AutonomyAuditLogSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  action_type: z.string(),
  domain_scope: DomainScopeSchema.optional(),
  source: z.string(),
  actor_type: z.enum(["SYSTEM", "HUMAN"]),
  actor_id: z.string().optional(),
  risk_level: RiskLevelSchema.optional(),
  approval_status: ApprovalStatusSchema.optional(),
  proposal_id: z.string().uuid().optional(),
  execution_id: z.string().uuid().optional(),
  rollback_token_id: z.string().uuid().optional(),
  before_snapshot_path: z.string().optional(),
  after_snapshot_path: z.string().optional(),
  details: z.record(z.any()).default({}),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  timestamp_utc: z.string().datetime(),
});
export type AutonomyAuditLog = z.infer<typeof AutonomyAuditLogSchema>;

// =============================================================
// API Request/Response Schemas
// =============================================================

export const InitTrustedModeRequestSchema = z.object({
  client_id: z.string().uuid(),
  restore_email: z.string().email(),
  emergency_phone: z.string().optional(),
  nightly_backup_enabled: z.boolean().default(true),
});

export const VerifyIdentityRequestSchema = z.object({
  client_id: z.string().uuid(),
  method: z.enum(["ABN_ACN", "DNS", "MANUAL"]),
  abn_acn: z.string().optional(),
  legal_name: z.string().optional(),
  notes: z.string().optional(),
});

export const VerifyOwnershipRequestSchema = z.object({
  client_id: z.string().uuid(),
  method: z.enum(["GSC", "DNS_TXT", "HTML_FILE", "META_TAG", "MANUAL"]),
  domain: z.string(),
  verification_code: z.string().optional(),
  gsc_property_id: z.string().optional(),
});

export const ConfigureScopesRequestSchema = z.object({
  client_id: z.string().uuid(),
  seo_scope: SEOScopeConfigSchema.optional(),
  content_scope: ContentScopeConfigSchema.optional(),
  ads_scope: AdsScopeConfigSchema.optional(),
  cro_scope: CROScopeConfigSchema.optional(),
  max_daily_actions: z.number().min(1).max(100).optional(),
  max_risk_level_allowed: RiskLevelSchema.optional(),
  execution_window_start: z.string().optional(),
  execution_window_end: z.string().optional(),
  execution_timezone: z.string().optional(),
});

export const ProposeChangeRequestSchema = z.object({
  client_id: z.string().uuid(),
  audit_id: z.string().uuid().optional(),
  recommendation_id: z.string().uuid().optional(),
  domain_scope: DomainScopeSchema,
  change_type: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  proposed_diff: z.record(z.any()),
  target_url: z.string().url().optional(),
  target_element: z.string().optional(),
});

export const ApproveChangeRequestSchema = z.object({
  proposal_id: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const RollbackRequestSchema = z.object({
  rollback_token_id: z.string().uuid(),
  reason: z.string(),
  rollback_type: RollbackTypeSchema.optional(),
});

export const TrustStatusResponseSchema = z.object({
  client_id: z.string().uuid(),
  trusted_mode_status: TrustedModeStatusSchema,
  identity_verified: z.boolean(),
  ownership_verified: z.boolean(),
  signature_complete: z.boolean(),
  scopes_configured: z.boolean(),
  enabled_domains: z.array(DomainScopeSchema),
  max_risk_level: RiskLevelSchema,
  pending_proposals: z.number(),
  executed_today: z.number(),
  last_execution: z.string().datetime().optional(),
});
export type TrustStatusResponse = z.infer<typeof TrustStatusResponseSchema>;
