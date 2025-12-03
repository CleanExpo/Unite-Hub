/**
 * Report Accuracy Checker - V2.1
 * Task-007: Verification System - Phased Implementation
 *
 * Verifies AI-generated reports for:
 * - Accuracy against source data (claim info, images)
 * - Hallucination detection (claims without evidence)
 * - Discrepancy identification
 * - Missing image references
 * - Internal consistency
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VerificationResult,
  ReportVerificationResult,
  ReportDiscrepancy,
  ReportHallucination,
  VerificationError,
  ClaimData,
  ImageValidationResult,
} from './types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Accuracy thresholds
const MIN_ACCURACY_SCORE = 85; // Reports below this need review
const CRITICAL_ACCURACY_THRESHOLD = 70; // Reports below this are rejected

// ============================================================================
// Source Data Types
// ============================================================================

interface ReportSourceData {
  claim: ClaimData;
  images: Array<{
    id: string;
    filename: string;
    validation: ImageValidationResult;
    description?: string;
  }>;
  site_notes?: string;
  assessor_observations?: string[];
}

interface GeneratedReport {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  summary?: string;
  recommendations?: string[];
  scope_items?: string[];
  full_text: string;
}

// ============================================================================
// Verification Functions
// ============================================================================

/**
 * Extract factual claims from report text
 */
async function extractFactualClaims(
  reportText: string
): Promise<Array<{ claim: string; section: string; requires_evidence: boolean }>> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Extract all factual claims from this property damage assessment report. For each claim, determine if it requires photographic or documented evidence.

Report:
${reportText}

Respond with JSON array only (no markdown):
[
  {
    "claim": "The factual statement",
    "section": "Section where it appears",
    "requires_evidence": true/false
  }
]

Focus on:
- Damage observations (water damage, mould, structural issues)
- Measurements and quantities
- Location descriptions
- Condition assessments
- Recommendations and scope items`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Check claims against source data
 */
async function verifyClaims(
  claims: Array<{ claim: string; section: string; requires_evidence: boolean }>,
  sourceData: ReportSourceData
): Promise<{
  verified: Array<{ claim: string; evidence: string }>;
  unverified: Array<{ claim: string; reason: string }>;
  hallucinations: ReportHallucination[];
}> {
  const sourceContext = buildSourceContext(sourceData);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Verify each claim against the source data. For claims requiring evidence, check if source data supports them.

Claims to verify:
${JSON.stringify(claims, null, 2)}

Source data (claim information, image analysis, site notes):
${sourceContext}

Respond with JSON only (no markdown):
{
  "verified": [
    {"claim": "...", "evidence": "Source: image/claim data that supports this"}
  ],
  "unverified": [
    {"claim": "...", "reason": "Why this couldn't be verified"}
  ],
  "hallucinations": [
    {
      "claim": "...",
      "evidence_missing": true,
      "severity": "critical" or "warning",
      "suggestion": "What should be done"
    }
  ]
}

Hallucination criteria:
- CRITICAL: Specific measurements, damage assessments, or costs not in source data
- WARNING: General observations that may be reasonable inferences but lack direct evidence`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { verified: [], unverified: [], hallucinations: [] };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { verified: [], unverified: [], hallucinations: [] };
  }
}

/**
 * Build context string from source data
 */
function buildSourceContext(sourceData: ReportSourceData): string {
  const parts: string[] = [];

  // Claim data
  parts.push('CLAIM INFORMATION:');
  parts.push(`- Property: ${sourceData.claim.property_address}, ${sourceData.claim.property_suburb} ${sourceData.claim.property_state} ${sourceData.claim.property_postcode}`);
  parts.push(`- Property Type: ${sourceData.claim.property_type}`);
  parts.push(`- Damage Type: ${sourceData.claim.damage_type}`);
  parts.push(`- Date of Loss: ${sourceData.claim.date_of_loss}`);
  if (sourceData.claim.damage_description) {
    parts.push(`- Description: ${sourceData.claim.damage_description}`);
  }

  // Image analysis
  if (sourceData.images.length > 0) {
    parts.push('\nIMAGE ANALYSIS:');
    for (const img of sourceData.images) {
      parts.push(`- Image ${img.id} (${img.filename}):`);
      parts.push(`  - Valid property photo: ${img.validation.is_property_photo}`);
      parts.push(`  - Shows damage: ${img.validation.shows_damage}`);
      if (img.validation.damage_type !== 'none') {
        parts.push(`  - Damage type: ${img.validation.damage_type}`);
      }
      if (img.validation.damage_severity) {
        parts.push(`  - Severity: ${img.validation.damage_severity}`);
      }
      if (img.description) {
        parts.push(`  - Description: ${img.description}`);
      }
      if (img.validation.detected_elements) {
        const elements = Object.entries(img.validation.detected_elements)
          .filter(([_, v]) => v)
          .map(([k]) => k.replace(/_/g, ' '));
        if (elements.length > 0) {
          parts.push(`  - Detected: ${elements.join(', ')}`);
        }
      }
    }
  }

  // Site notes
  if (sourceData.site_notes) {
    parts.push('\nSITE NOTES:');
    parts.push(sourceData.site_notes);
  }

  // Assessor observations
  if (sourceData.assessor_observations && sourceData.assessor_observations.length > 0) {
    parts.push('\nASSESSOR OBSERVATIONS:');
    for (const obs of sourceData.assessor_observations) {
      parts.push(`- ${obs}`);
    }
  }

  return parts.join('\n');
}

/**
 * Check for discrepancies between report and source data
 */
async function findDiscrepancies(
  report: GeneratedReport,
  sourceData: ReportSourceData
): Promise<ReportDiscrepancy[]> {
  const sourceContext = buildSourceContext(sourceData);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Compare the report against source data and identify any discrepancies.

REPORT:
${report.full_text}

SOURCE DATA:
${sourceContext}

Respond with JSON array only (no markdown):
[
  {
    "field": "What data point has discrepancy",
    "expected": "Value from source data",
    "actual": "Value in report",
    "severity": "critical" | "major" | "minor",
    "location": "Section/paragraph in report"
  }
]

Check for:
- Address/location mismatches
- Damage type inconsistencies
- Date errors
- Property type mismatches
- Severity assessment inconsistencies with images`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Check for missing image references
 */
function findMissingImageReferences(
  report: GeneratedReport,
  images: Array<{ id: string; filename: string }>
): string[] {
  const reportText = report.full_text.toLowerCase();
  const missing: string[] = [];

  for (const img of images) {
    // Check if image is referenced by ID or filename
    const idLower = img.id.toLowerCase();
    const filenameLower = img.filename.toLowerCase();
    const filenameNoExt = filenameLower.replace(/\.[^.]+$/, '');

    const isReferenced =
      reportText.includes(idLower) ||
      reportText.includes(filenameLower) ||
      reportText.includes(filenameNoExt) ||
      reportText.includes(`image ${images.indexOf(img) + 1}`) ||
      reportText.includes(`photo ${images.indexOf(img) + 1}`) ||
      reportText.includes(`figure ${images.indexOf(img) + 1}`);

    if (!isReferenced) {
      missing.push(img.filename);
    }
  }

  return missing;
}

/**
 * Check report internal consistency
 */
async function checkConsistency(report: GeneratedReport): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Check this property damage report for internal consistency issues.

REPORT:
${report.full_text}

Respond with JSON array only (no markdown):
["Issue 1", "Issue 2", ...]

Check for:
- Contradictory statements
- Inconsistent damage descriptions
- Summary not matching body content
- Recommendations not aligned with findings
- Scope items not matching damage assessment`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Calculate accuracy score
 */
function calculateAccuracyScore(
  verified: number,
  unverified: number,
  hallucinations: ReportHallucination[],
  discrepancies: ReportDiscrepancy[],
  missingReferences: string[],
  consistencyIssues: string[]
): number {
  const totalClaims = verified + unverified;
  if (totalClaims === 0) return 50; // Can't assess without claims

  // Base score from verified claims
  let score = (verified / totalClaims) * 100;

  // Deductions
  const criticalHallucinations = hallucinations.filter((h) => h.severity === 'critical').length;
  const warningHallucinations = hallucinations.filter((h) => h.severity === 'warning').length;

  const criticalDiscrepancies = discrepancies.filter((d) => d.severity === 'critical').length;
  const majorDiscrepancies = discrepancies.filter((d) => d.severity === 'major').length;
  const minorDiscrepancies = discrepancies.filter((d) => d.severity === 'minor').length;

  // Critical issues: -15 points each
  score -= criticalHallucinations * 15;
  score -= criticalDiscrepancies * 15;

  // Major issues: -8 points each
  score -= warningHallucinations * 5;
  score -= majorDiscrepancies * 8;

  // Minor issues: -3 points each
  score -= minorDiscrepancies * 3;
  score -= missingReferences.length * 2;
  score -= consistencyIssues.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Verify a generated report against source data
 */
export async function verifyReport(
  report: GeneratedReport,
  sourceData: ReportSourceData,
  options: {
    strict_mode?: boolean;
    min_accuracy?: number;
  } = {}
): Promise<VerificationResult<ReportVerificationResult>> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const minAccuracy = options.min_accuracy || MIN_ACCURACY_SCORE;

  try {
    // Step 1: Extract factual claims from report
    const claims = await extractFactualClaims(report.full_text);

    // Step 2: Verify claims against source data
    const { verified, unverified, hallucinations } = await verifyClaims(claims, sourceData);

    // Step 3: Find discrepancies
    const discrepancies = await findDiscrepancies(report, sourceData);

    // Step 4: Check for missing image references
    const missingReferences = findMissingImageReferences(report, sourceData.images);

    // Step 5: Check internal consistency
    const consistencyIssues = await checkConsistency(report);

    // Step 6: Calculate accuracy score
    const accuracyScore = calculateAccuracyScore(
      verified.length,
      unverified.length,
      hallucinations,
      discrepancies,
      missingReferences,
      consistencyIssues
    );

    // Build recommendations
    if (hallucinations.length > 0) {
      recommendations.push(
        `Review ${hallucinations.length} potential hallucination(s) and add supporting evidence or remove unsupported claims`
      );
    }
    if (discrepancies.length > 0) {
      recommendations.push(
        `Correct ${discrepancies.length} discrepancy(ies) between report and source data`
      );
    }
    if (missingReferences.length > 0) {
      recommendations.push(
        `Add references to ${missingReferences.length} image(s) not mentioned in the report`
      );
    }
    if (consistencyIssues.length > 0) {
      recommendations.push(`Address ${consistencyIssues.length} internal consistency issue(s)`);
    }

    // Determine approval status
    const criticalIssues =
      hallucinations.filter((h) => h.severity === 'critical').length +
      discrepancies.filter((d) => d.severity === 'critical').length;

    const approved =
      accuracyScore >= minAccuracy &&
      criticalIssues === 0 &&
      (!options.strict_mode || consistencyIssues.length === 0);

    // Add errors/warnings
    if (criticalIssues > 0) {
      errors.push({
        code: 'CRITICAL_ACCURACY_ISSUES',
        message: `Report has ${criticalIssues} critical accuracy issue(s)`,
        severity: 'critical',
      });
    }
    if (accuracyScore < CRITICAL_ACCURACY_THRESHOLD) {
      errors.push({
        code: 'LOW_ACCURACY_SCORE',
        message: `Accuracy score (${accuracyScore}%) is below critical threshold (${CRITICAL_ACCURACY_THRESHOLD}%)`,
        severity: 'critical',
      });
    } else if (accuracyScore < minAccuracy) {
      warnings.push(
        `Accuracy score (${accuracyScore}%) is below required threshold (${minAccuracy}%)`
      );
    }
    if (missingReferences.length > 0) {
      warnings.push(`${missingReferences.length} image(s) not referenced in report`);
    }

    const result: ReportVerificationResult = {
      accuracy_score: accuracyScore,
      approved,
      discrepancies,
      hallucinations,
      missing_references: missingReferences,
      consistency_issues: consistencyIssues,
      recommendations,
    };

    return {
      status: approved ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      passed: approved,
      message: approved
        ? `Report verified with ${accuracyScore}% accuracy`
        : `Report requires review: ${accuracyScore}% accuracy`,
      data: result,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: recommendations.length > 0 ? recommendations : undefined,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Report verification error:', error);
    return {
      status: 'failed',
      passed: false,
      message: 'Report verification failed due to an internal error',
      errors: [
        {
          code: 'VERIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'critical',
        },
      ],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Quick report check (basic validation only)
 */
export function quickCheckReport(report: GeneratedReport): {
  has_summary: boolean;
  has_recommendations: boolean;
  word_count: number;
  section_count: number;
} {
  return {
    has_summary: !!report.summary && report.summary.length > 50,
    has_recommendations: !!report.recommendations && report.recommendations.length > 0,
    word_count: report.full_text.split(/\s+/).length,
    section_count: report.sections.length,
  };
}

export default {
  verifyReport,
  quickCheckReport,
};
