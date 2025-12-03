/**
 * Verification System Types
 * Task-007: Verification System - Phased Implementation
 *
 * Shared types for all verification agents
 */

// ============================================================================
// Common Types
// ============================================================================

export type VerificationStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export interface VerificationResult<T = unknown> {
  status: VerificationStatus;
  passed: boolean;
  message: string;
  data?: T;
  errors?: VerificationError[];
  warnings?: string[];
  suggestions?: string[];
  timestamp: string;
  duration_ms: number;
}

export interface VerificationError {
  code: string;
  field?: string;
  message: string;
  severity: 'critical' | 'error' | 'warning';
}

// ============================================================================
// Phase 1: Input Verification Types
// ============================================================================

// V1.1 Image Validation
export type DamageType =
  | 'water'
  | 'fire'
  | 'mould'
  | 'structural'
  | 'biohazard'
  | 'storm'
  | 'unknown'
  | 'none';

export type ImageQuality = 'high' | 'acceptable' | 'poor' | 'unusable';

export interface ImageValidationResult {
  is_valid_image: boolean;
  is_property_photo: boolean;
  shows_damage: boolean;
  damage_type: DamageType;
  damage_severity?: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  image_quality: ImageQuality;
  confidence: number; // 0-1
  rejection_reason: string | null;
  suggestions: string[];
  detected_elements?: {
    building: boolean;
    interior: boolean;
    exterior: boolean;
    water_damage: boolean;
    fire_damage: boolean;
    mould_visible: boolean;
    structural_damage: boolean;
  };
}

// V1.2 Claim Validation
export type AustralianState = 'QLD' | 'NSW' | 'VIC' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

export type PropertyType =
  | 'residential_house'
  | 'residential_unit'
  | 'commercial'
  | 'industrial'
  | 'retail'
  | 'other';

export interface ClaimData {
  // Contact
  contact_name: string;
  contact_email: string;
  contact_phone: string;

  // Property
  property_address: string;
  property_suburb: string;
  property_state: AustralianState;
  property_postcode: string;
  property_type: PropertyType;

  // Claim Details
  date_of_loss: string; // ISO date
  date_reported?: string; // ISO date
  damage_type: DamageType;
  damage_description?: string;

  // Optional
  insurance_company?: string;
  claim_number?: string;
  policy_number?: string;
  abn?: string; // For commercial
}

export interface ClaimValidationResult {
  is_valid: boolean;
  field_validations: {
    [K in keyof ClaimData]?: {
      valid: boolean;
      message?: string;
      formatted_value?: string;
    };
  };
  missing_fields: (keyof ClaimData)[];
  invalid_fields: (keyof ClaimData)[];
  warnings: string[];
  formatted_data?: Partial<ClaimData>; // Cleaned/formatted version
}

// V1.3 Contact Validation
export interface ContactValidationResult {
  email: {
    valid: boolean;
    format_valid: boolean;
    domain_exists: boolean;
    is_disposable: boolean;
    message?: string;
  };
  phone: {
    valid: boolean;
    format_valid: boolean;
    formatted: string; // Normalized format
    type: 'mobile' | 'landline' | 'unknown';
    message?: string;
  };
  abn?: {
    valid: boolean;
    format_valid: boolean;
    verified: boolean; // ABR lookup
    business_name?: string;
    message?: string;
  };
  overall_valid: boolean;
}

// ============================================================================
// Phase 2: Output Verification Types
// ============================================================================

// V2.1 Report Verification
export interface ReportVerificationResult {
  accuracy_score: number; // 0-100
  approved: boolean;
  discrepancies: ReportDiscrepancy[];
  hallucinations: ReportHallucination[];
  missing_references: string[]; // Images not referenced
  consistency_issues: string[];
  recommendations: string[];
}

export interface ReportDiscrepancy {
  field: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'major' | 'minor';
  location?: string; // Section/paragraph reference
}

export interface ReportHallucination {
  claim: string;
  evidence_missing: boolean;
  severity: 'critical' | 'warning';
  suggestion: string;
}

// V2.2 Scope Verification
export interface ScopeVerificationResult {
  is_valid: boolean;
  completeness_score: number; // 0-100
  duplicate_items: ScopeItem[];
  missing_items: ScopeItem[];
  sequence_issues: SequenceIssue[];
  safety_items_present: boolean;
  missing_safety_items: string[];
  recommendations: string[];
}

export interface ScopeItem {
  id: string;
  description: string;
  category: string;
  area?: string;
}

export interface SequenceIssue {
  item_a: string;
  item_b: string;
  reason: string;
  correct_order: 'a_before_b' | 'b_before_a';
}

// V2.3 Content Safety
export interface ContentSafetyResult {
  is_safe: boolean;
  pii_detected: PIIDetection[];
  inappropriate_content: string[];
  competitor_mentions: string[];
  tone_issues: string[];
  redacted_content?: string; // Content with PII removed
}

export interface PIIDetection {
  type: 'email' | 'phone' | 'address' | 'abn' | 'tfn' | 'credit_card' | 'bank_account' | 'name';
  value: string;
  masked: string;
  location: { start: number; end: number };
}

// ============================================================================
// Phase 3: System Audit Types
// ============================================================================

export type AuditCategory =
  | 'architecture'
  | 'backend'
  | 'frontend'
  | 'api_integrations'
  | 'data_integrity'
  | 'security'
  | 'compliance';

export interface SystemAuditResult {
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  pass_rate: number; // Percentage
  categories: {
    [K in AuditCategory]: CategoryAuditResult;
  };
  critical_failures: AuditCheck[];
  remediation_tasks: RemediationTask[];
  last_run: string; // ISO timestamp
  duration_ms: number;
}

export interface CategoryAuditResult {
  name: string;
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: AuditCheck[];
}

export interface AuditCheck {
  id: string;
  name: string;
  category: AuditCategory;
  status: VerificationStatus;
  message: string;
  details?: string;
  documentation_url?: string;
  auto_fixable: boolean;
}

export interface RemediationTask {
  check_id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_effort: 'minutes' | 'hours' | 'days';
  auto_fix_available: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface VerificationConfig {
  enabled: boolean;
  strict_mode: boolean;
  log_results: boolean;
  fail_fast: boolean;
}

export interface VerificationContext {
  workspace_id?: string;
  user_id?: string;
  request_id?: string;
  environment: 'development' | 'staging' | 'production';
}
