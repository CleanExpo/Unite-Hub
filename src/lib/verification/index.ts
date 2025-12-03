/**
 * Verification System - Main Export
 * Task-007: Verification System - Phased Implementation
 *
 * Philosophy: "Verification-first architecture - nothing leaves
 * the system without evidence of correctness"
 *
 * Three-phase verification:
 * - Phase 1: Input Verification (V1.1-V1.3)
 * - Phase 2: Output Verification (V2.1-V2.3)
 * - Phase 3: System Audit (70+ automated checks)
 */

// ============================================================================
// Types
// ============================================================================

export * from './types';

// ============================================================================
// Phase 1: Input Verification
// ============================================================================

// V1.1 Image Validation
export { validateImage, validateImageBatch, quickValidateImage } from './image-validator';

// V1.2 Claim Data Validation
export { validateClaimData, quickValidateClaim, formatClaimData } from './claim-validator';

// V1.3 Contact Verification
export { validateContact, quickValidateContact } from './contact-validator';

// ============================================================================
// Phase 2: Output Verification
// ============================================================================

// V2.1 Report Accuracy Checker
export { verifyReport, quickCheckReport } from './report-verifier';

// V2.2 Scope of Work Validator
export { validateScope, quickCheckScope } from './scope-validator';

// V2.3 Content Safety Filter
export { checkContentSafety, quickPIICheck, redactAllPII } from './content-safety';

// ============================================================================
// Phase 3: System Audit
// ============================================================================

export {
  runSystemAudit,
  runCategoryAudit,
  runQuickHealthCheck,
  formatAuditSummary,
  allChecks,
  checksByCategory,
} from './system-audit';

// ============================================================================
// Convenience Functions
// ============================================================================

import { validateImage } from './image-validator';
import { validateClaimData } from './claim-validator';
import { validateContact } from './contact-validator';
import { verifyReport } from './report-verifier';
import { validateScope } from './scope-validator';
import { checkContentSafety } from './content-safety';
import { runSystemAudit, runQuickHealthCheck } from './system-audit';
import type { VerificationResult, ClaimData, DamageType } from './types';

/**
 * Run all input verifications for a claim submission
 */
export async function verifyClaimSubmission(input: {
  claim: Partial<ClaimData>;
  images?: Array<{ data: string | Buffer; mimeType: string }>;
  contact: { email: string; phone: string; abn?: string };
}): Promise<{
  claim: VerificationResult<unknown>;
  contact: VerificationResult<unknown>;
  images?: VerificationResult<unknown>[];
  overall_valid: boolean;
}> {
  // Validate claim data
  const claimResult = validateClaimData(input.claim);

  // Validate contact
  const contactResult = await validateContact(input.contact);

  // Validate images if provided
  let imageResults: VerificationResult<unknown>[] | undefined;
  if (input.images && input.images.length > 0) {
    imageResults = await Promise.all(
      input.images.map((img) => validateImage(img.data, img.mimeType))
    );
  }

  // Calculate overall validity
  const overallValid =
    claimResult.passed &&
    contactResult.passed &&
    (!imageResults || imageResults.every((r) => r.passed));

  return {
    claim: claimResult,
    contact: contactResult,
    images: imageResults,
    overall_valid: overallValid,
  };
}

/**
 * Run all output verifications for a generated report
 */
export async function verifyReportOutput(input: {
  report: {
    title: string;
    sections: Array<{ heading: string; content: string }>;
    summary?: string;
    recommendations?: string[];
    scope_items?: string[];
    full_text: string;
  };
  sourceData: {
    claim: ClaimData;
    images: Array<{
      id: string;
      filename: string;
      validation: { is_property_photo: boolean; shows_damage: boolean; damage_type: DamageType };
    }>;
    site_notes?: string;
  };
  scopeText?: string;
}): Promise<{
  report: VerificationResult<unknown>;
  scope?: VerificationResult<unknown>;
  safety: VerificationResult<unknown>;
  overall_valid: boolean;
}> {
  // Verify report accuracy
  const reportResult = await verifyReport(input.report, input.sourceData as never);

  // Validate scope if provided
  let scopeResult: VerificationResult<unknown> | undefined;
  if (input.scopeText) {
    scopeResult = await validateScope(input.scopeText, {
      damage_type: input.sourceData.claim.damage_type,
    });
  }

  // Check content safety
  const safetyResult = await checkContentSafety(input.report.full_text);

  // Calculate overall validity
  const overallValid =
    reportResult.passed &&
    safetyResult.passed &&
    (!scopeResult || scopeResult.passed);

  return {
    report: reportResult,
    scope: scopeResult,
    safety: safetyResult,
    overall_valid: overallValid,
  };
}

/**
 * Run a quick system health check
 */
export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  timestamp: string;
}> {
  const result = await runQuickHealthCheck();
  return {
    ...result,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run a full system audit
 */
export async function runFullSystemAudit(): Promise<VerificationResult<unknown>> {
  return runSystemAudit();
}
