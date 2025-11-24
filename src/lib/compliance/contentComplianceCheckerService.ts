/**
 * Content Compliance Checker Service
 * Phase 93: Run preflight compliance checks on content
 */

import { getActivePolicies } from './policyRegistryService';
import type {
  ComplianceCheckResult,
  PolicyViolation,
  CompliancePolicy
} from './complianceTypes';

interface CheckContentParams {
  text: string;
  mediaMeta?: Record<string, unknown>;
  regionSlug: string;
  platform: string;
}

/**
 * Run compliance check on content
 */
export async function checkContent(
  params: CheckContentParams
): Promise<ComplianceCheckResult> {
  const { text, regionSlug, platform } = params;

  // Get active policies for this region/platform
  const policies = await getActivePolicies(regionSlug, platform);

  const violations: PolicyViolation[] = [];
  const warnings: string[] = [];

  // Check text against each policy's patterns
  for (const policy of policies) {
    const matches = checkPatterns(text, policy.examplePatterns);

    if (matches.length > 0) {
      const confidence = calculateConfidence(matches, text.length);

      violations.push({
        policyCode: policy.policyCode,
        severity: policy.severity,
        matchedPatterns: matches,
        confidence,
        description: getViolationDescription(policy, matches),
      });
    }
  }

  // Determine if content should be blocked
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  const highViolations = violations.filter(
    v => v.severity === 'high' && v.confidence > 0.7
  );

  const blockedReason =
    criticalViolations.length > 0
      ? `Critical policy violation: ${criticalViolations[0].policyCode}`
      : highViolations.length > 0
      ? `High-severity violation with high confidence: ${highViolations[0].policyCode}`
      : null;

  // Add warnings for medium/low severity or low confidence
  for (const violation of violations) {
    if (violation.severity === 'medium' || violation.confidence < 0.5) {
      warnings.push(
        `Potential ${violation.severity} issue: ${violation.policyCode} - Review recommended`
      );
    }
  }

  // Add general warning if no policies found
  if (policies.length === 0) {
    warnings.push(
      `No compliance policies found for region '${regionSlug}' and platform '${platform}'. ` +
      `Content not validated - proceed with caution.`
    );
  }

  return {
    passed: blockedReason === null,
    violations,
    warnings,
    blockedReason,
    regionSlug,
    platform,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Summarise violations for display
 */
export function summariseViolations(violations: PolicyViolation[]): string {
  if (violations.length === 0) {
    return 'No compliance issues detected.';
  }

  const lines = [
    '**Compliance Check Results**\n',
    `Found ${violations.length} potential issue(s):\n`,
  ];

  for (const v of violations) {
    const severityEmoji = {
      critical: '🚫',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️',
    }[v.severity];

    lines.push(
      `${severityEmoji} **${v.policyCode}** (${v.severity}, ${Math.round(v.confidence * 100)}% confidence)`
    );
    lines.push(`   Matched: ${v.matchedPatterns.join(', ')}`);
    lines.push(`   ${v.description}\n`);
  }

  lines.push(
    '\n*Note: This is an automated check and not legal advice. ' +
    'Consult qualified professionals for critical compliance decisions.*'
  );

  return lines.join('\n');
}

/**
 * Check text against patterns
 */
function checkPatterns(text: string, patterns: string[]): string[] {
  const matched: string[] = [];
  const lowerText = text.toLowerCase();

  for (const pattern of patterns) {
    // Check if pattern is a regex (starts and ends with /)
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1), 'gi');
        if (regex.test(text)) {
          matched.push(pattern);
        }
      } catch {
        // Invalid regex, skip
      }
    } else {
      // Simple substring match
      if (lowerText.includes(pattern.toLowerCase())) {
        matched.push(pattern);
      }
    }
  }

  return matched;
}

/**
 * Calculate confidence based on matches and context
 */
function calculateConfidence(matches: string[], textLength: number): number {
  // Base confidence from number of matches
  let confidence = Math.min(matches.length * 0.3, 0.9);

  // Adjust based on text length (longer text with few matches = lower confidence)
  if (textLength > 500 && matches.length === 1) {
    confidence *= 0.7;
  }

  // Multiple matches increase confidence
  if (matches.length >= 3) {
    confidence = Math.min(confidence + 0.2, 0.95);
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Generate violation description
 */
function getViolationDescription(
  policy: CompliancePolicy,
  matches: string[]
): string {
  const matchList = matches.slice(0, 3).join(', ');
  const moreCount = matches.length > 3 ? ` and ${matches.length - 3} more` : '';

  return (
    `Content contains potentially restricted terms (${matchList}${moreCount}) ` +
    `that may violate ${policy.policyCode} policy for ${policy.regionSlug}/${policy.platform}. ` +
    `Review and modify if needed.`
  );
}

/**
 * Quick check if content has any issues
 */
export async function hasComplianceIssues(
  text: string,
  regionSlug: string,
  platform: string
): Promise<boolean> {
  const result = await checkContent({ text, regionSlug, platform });
  return !result.passed || result.warnings.length > 0;
}
