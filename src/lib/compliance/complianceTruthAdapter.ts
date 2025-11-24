/**
 * Compliance Truth Adapter
 * Phase 93: Integrate compliance with Truth Layer and enforce legal disclaimers
 */

import type { ComplianceCheckResult } from './complianceTypes';

const LEGAL_DISCLAIMER =
  '\n\n---\n*⚠️ This compliance check is an automated aid and does not constitute legal advice. ' +
  'Platform policies and regulations change frequently. For critical compliance decisions, ' +
  'consult qualified legal professionals in your jurisdiction.*';

/**
 * Annotate compliance summary with proper framing
 */
export function annotateComplianceSummary(
  checkResult: ComplianceCheckResult
): string {
  const lines: string[] = [];

  // Header
  lines.push(`## Compliance Check Summary\n`);
  lines.push(`**Region**: ${checkResult.regionSlug.toUpperCase()}`);
  lines.push(`**Platform**: ${checkResult.platform}`);
  lines.push(`**Status**: ${checkResult.passed ? '✅ Passed' : '❌ Issues Found'}`);
  lines.push(`**Checked**: ${new Date(checkResult.checkedAt).toLocaleString()}\n`);

  // Violations
  if (checkResult.violations.length > 0) {
    lines.push(`### Potential Issues\n`);

    for (const v of checkResult.violations) {
      const severityEmoji = {
        critical: '🚫',
        high: '⚠️',
        medium: '⚡',
        low: 'ℹ️',
      }[v.severity];

      lines.push(`${severityEmoji} **${v.policyCode}**`);
      lines.push(`- Severity: ${v.severity}`);
      lines.push(`- Confidence: ${Math.round(v.confidence * 100)}%`);
      lines.push(`- Matched patterns: ${v.matchedPatterns.join(', ')}`);
      lines.push(`- ${v.description}\n`);
    }
  }

  // Warnings
  if (checkResult.warnings.length > 0) {
    lines.push(`### Warnings\n`);
    for (const warning of checkResult.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  // Blocked reason
  if (checkResult.blockedReason) {
    lines.push(`### 🛑 Blocked\n`);
    lines.push(`Content blocked due to: **${checkResult.blockedReason}**\n`);
    lines.push(
      `This content cannot proceed without manual review and modification.\n`
    );
  }

  // Truth Layer compliance note
  lines.push(`### About This Check\n`);
  lines.push(
    `This automated check compares your content against known policy patterns for ` +
    `${checkResult.regionSlug.toUpperCase()}/${checkResult.platform}. It identifies ` +
    `*potential* issues but cannot guarantee compliance or catch all violations.\n`
  );
  lines.push(
    `Pattern matching has inherent limitations - context matters. A matched term ` +
    `may be perfectly acceptable in your specific use case.\n`
  );

  return lines.join('\n');
}

/**
 * Enforce legal disclaimer on any compliance-related markdown
 */
export function enforceLegalDisclaimer(markdown: string): string {
  // Check if disclaimer already present
  if (markdown.includes('does not constitute legal advice')) {
    return markdown;
  }

  return markdown + LEGAL_DISCLAIMER;
}

/**
 * Format a single violation for display
 */
export function formatViolation(violation: {
  policyCode: string;
  severity: string;
  matchedPatterns: string[];
  description: string;
}): string {
  return (
    `**${violation.policyCode}** (${violation.severity})\n` +
    `Matched: ${violation.matchedPatterns.join(', ')}\n` +
    `${violation.description}`
  );
}

/**
 * Get risk level description
 */
export function getRiskLevelDescription(severity: string): string {
  const descriptions: Record<string, string> = {
    critical:
      'This issue may result in account suspension, legal action, or significant penalties. ' +
      'Do not proceed without professional review.',
    high:
      'This issue has a high likelihood of policy violation or regulatory non-compliance. ' +
      'Review carefully before proceeding.',
    medium:
      'This issue warrants attention but may be acceptable depending on context. ' +
      'Consider reviewing and modifying.',
    low:
      'This is a minor flag that may not require action. ' +
      'Review for awareness.',
  };

  return descriptions[severity] || 'Unknown risk level.';
}

/**
 * Create a human-readable compliance report
 */
export function createComplianceReport(
  checkResult: ComplianceCheckResult
): string {
  const summary = annotateComplianceSummary(checkResult);
  return enforceLegalDisclaimer(summary);
}

/**
 * Check if result requires immediate attention
 */
export function requiresImmediateAttention(
  checkResult: ComplianceCheckResult
): boolean {
  return (
    !checkResult.passed ||
    checkResult.violations.some(v => v.severity === 'critical') ||
    checkResult.violations.some(v => v.severity === 'high' && v.confidence > 0.8)
  );
}
