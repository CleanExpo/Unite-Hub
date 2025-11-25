/**
 * Founder Risk Engine
 *
 * Scores risk for agent outputs before approval/routing.
 * Used by truth layer enforcement and approval workflow.
 *
 * Risk Scoring:
 * - 0-19: Low (auto-approve)
 * - 20-39: Medium (content review required)
 * - 40-69: High (manual approval required)
 * - 70+: Critical (always manual + escalation)
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import { brandPositioningMap } from '@/lib/brands/brandPositioningMap';

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  requiresApproval: boolean;
  suggestedAction: 'auto_approve' | 'content_review' | 'manual_approval' | 'escalate';
}

export interface RiskScoringInput {
  brand: BrandId;
  claim: string;
  context: 'marketing' | 'email' | 'public' | 'internal';
  contentType?: 'social' | 'email' | 'landing_page' | 'blog' | 'video';
  includesMedical?: boolean;
  includesLegal?: boolean;
  includesFinancialPromise?: boolean;
  mentionedRisks?: string[];
}

/**
 * Score risk for a piece of content or claim
 * Returns assessment with reasons and suggested action
 */
export function scoreRisk(input: RiskScoringInput): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  // Critical risk factors (automatic escalation)
  if (input.includesFinancialPromise) {
    score += 50;
    reasons.push('🚫 Financial outcome promised (not allowed - legal/compliance risk)');
  }

  if (input.includesMedical) {
    score += 50;
    reasons.push('🚫 Medical/health claim detected (not allowed - regulatory risk)');
  }

  if (input.includesLegal) {
    score += 40;
    reasons.push('⚠️ Legal claim or legal advice detected (requires founder review)');
  }

  // Context-based risk factors
  if (input.context === 'public') {
    score += 15;
    reasons.push('📢 Public-facing content (higher scrutiny required)');
  } else if (input.context === 'marketing') {
    score += 10;
    reasons.push('📊 Marketing content (brand reputation at stake)');
  }

  // Brand risk flags from positioning map
  const positioning = brandPositioningMap[input.brand];
  if (positioning && positioning.riskFlags && positioning.riskFlags.length > 0) {
    const lowerClaim = input.claim.toLowerCase();
    positioning.riskFlags.forEach((flag) => {
      if (flag.includes('guarantee') && lowerClaim.includes('guarantee')) {
        score += 25;
        reasons.push(`⚠️ Risk flag triggered: "${flag}"`);
      }
      if (flag.includes('medical') && (lowerClaim.includes('heal') || lowerClaim.includes('cure'))) {
        score += 30;
        reasons.push(`⚠️ Risk flag triggered: "${flag}"`);
      }
      if (flag.includes('insurance') && lowerClaim.includes('insurance')) {
        score += 20;
        reasons.push(`⚠️ Risk flag triggered: "${flag}"`);
      }
    });
  }

  // Mentioned risks
  if (input.mentionedRisks && input.mentionedRisks.length > 0) {
    score += input.mentionedRisks.length * 5;
    reasons.push(`⚠️ ${input.mentionedRisks.length} potential risks flagged in input`);
  }

  // Content type risk adjustments
  if (input.contentType === 'landing_page') {
    score += 10;
    reasons.push('📄 Landing page content (conversion-focused, higher legal exposure)');
  }

  // Determine level and action
  let level: 'low' | 'medium' | 'high' | 'critical';
  let suggestedAction: 'auto_approve' | 'content_review' | 'manual_approval' | 'escalate';

  if (score >= 70) {
    level = 'critical';
    suggestedAction = 'escalate';
  } else if (score >= 40) {
    level = 'high';
    suggestedAction = 'manual_approval';
  } else if (score >= 20) {
    level = 'medium';
    suggestedAction = 'content_review';
  } else {
    level = 'low';
    suggestedAction = 'auto_approve';
  }

  return {
    score,
    level,
    reasons,
    requiresApproval: level !== 'low',
    suggestedAction,
  };
}

/**
 * Quick check if content is likely safe
 * Returns true if score is low, false otherwise
 */
export function isSafeContent(input: RiskScoringInput): boolean {
  return scoreRisk(input).level === 'low';
}

/**
 * Get human-readable risk summary
 */
export function getRiskSummary(assessment: RiskAssessment): string {
  const levelEmoji = {
    low: '✅',
    medium: '⚠️',
    high: '🚨',
    critical: '🛑',
  };

  return `${levelEmoji[assessment.level]} Risk Level: ${assessment.level.toUpperCase()} (Score: ${assessment.score}/100)\n${assessment.reasons.join('\n')}`;
}
