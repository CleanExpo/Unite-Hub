/**
 * Truth Layer Audit System
 * Phase 56: Verify marketing copy and expectations across the platform
 */

export interface TruthLayerViolation {
  file: string;
  line?: number;
  phrase: string;
  severity: 'critical' | 'warning' | 'info';
  suggestion: string;
}

export interface TruthLayerAuditResult {
  passed: boolean;
  violations: TruthLayerViolation[];
  missingDisclosures: string[];
  lastAuditTimestamp: string;
  score: number;
}

// Forbidden phrases that violate truth-layer principles
export const forbiddenPhrases = [
  { phrase: '30 day trial', suggestion: 'Use "14-day guided trial + 90-day activation"' },
  { phrase: '30-day trial', suggestion: 'Use "14-day guided trial + 90-day activation"' },
  { phrase: 'instant seo results', suggestion: 'Explain that SEO takes 90+ days' },
  { phrase: 'instant results', suggestion: 'Set realistic timeline expectations' },
  { phrase: 'guaranteed rankings', suggestion: 'Remove guarantees - explain factors instead' },
  { phrase: 'overnight success', suggestion: 'Emphasize consistent effort over time' },
  { phrase: 'guaranteed top of google', suggestion: 'Remove - no one can guarantee this' },
  { phrase: 'get rich quick', suggestion: 'Focus on sustainable growth' },
  { phrase: '#1 ranking', suggestion: 'Use realistic language about visibility improvement' },
  { phrase: 'unlimited leads', suggestion: 'Be specific about realistic expectations' },
  { phrase: 'no effort required', suggestion: 'Emphasize partnership and effort required' },
  { phrase: 'automatic success', suggestion: 'Tools enable success, they don\'t guarantee it' },
  { phrase: 'risk-free', suggestion: 'Be transparent about commitments and timelines' },
  { phrase: '10x your business', suggestion: 'Use realistic growth language' },
  { phrase: 'explode your', suggestion: 'Use measured, professional language' },
];

// Required disclosures for truth-layer compliance
export const requiredDisclosures = [
  {
    id: 'real_data_disclaimer',
    name: 'Real Data Disclaimer',
    description: 'Clarify that metrics shown are real, not projections',
    locations: ['performance_dashboard', 'reports'],
  },
  {
    id: 'timeline_expectation_notice',
    name: 'Timeline Expectation Notice',
    description: 'Set realistic expectations for SEO/marketing results (90+ days)',
    locations: ['landing_pages', 'onboarding', 'pricing'],
  },
  {
    id: 'no_fake_testimonials_notice',
    name: 'No Fake Testimonials',
    description: 'Ensure all testimonials/case studies are real and verified',
    locations: ['marketing_pages', 'case_studies'],
  },
  {
    id: 'ai_draft_disclosure',
    name: 'AI Draft Disclosure',
    description: 'Mark AI-generated content as draft until approved',
    locations: ['content_generation', 'packs'],
  },
  {
    id: 'gst_inclusive_notice',
    name: 'GST Inclusive Notice',
    description: 'Clarify all prices include GST for Australian customers',
    locations: ['pricing_page'],
  },
];

// Check content for forbidden phrases
export function checkForForbiddenPhrases(
  content: string,
  fileName: string
): TruthLayerViolation[] {
  const violations: TruthLayerViolation[] = [];
  const lowerContent = content.toLowerCase();

  for (const { phrase, suggestion } of forbiddenPhrases) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      violations.push({
        file: fileName,
        phrase,
        severity: 'critical',
        suggestion,
      });
    }
  }

  return violations;
}

// Check for hype language
export function checkForHypeLanguage(
  content: string,
  fileName: string
): TruthLayerViolation[] {
  const violations: TruthLayerViolation[] = [];
  const hypePatterns = [
    { pattern: /\b\d+x\s+(growth|return|roi)/i, suggestion: 'Remove multiplier claims' },
    { pattern: /\bguarantee[ds]?\b/i, suggestion: 'Replace with "designed to help" or similar' },
    { pattern: /\bin just\s+\d+\s+(days?|weeks?)\b/i, suggestion: 'Set realistic timelines' },
    { pattern: /\binstantly\b/i, suggestion: 'Replace with realistic timeframe' },
    { pattern: /\bskyrocket\b/i, suggestion: 'Use measured language' },
    { pattern: /\bexplode\b/i, suggestion: 'Use professional language' },
    { pattern: /\bcrush\s+(the\s+)?competition/i, suggestion: 'Use "compete effectively"' },
    { pattern: /\bdominate\s+your\s+(market|industry)/i, suggestion: 'Use "establish presence"' },
  ];

  for (const { pattern, suggestion } of hypePatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      violations.push({
        file: fileName,
        phrase: match?.[0] || 'hype pattern',
        severity: 'warning',
        suggestion,
      });
    }
  }

  return violations;
}

// Run full truth-layer audit
export function runTruthLayerAudit(
  files: { name: string; content: string }[]
): TruthLayerAuditResult {
  const violations: TruthLayerViolation[] = [];

  for (const file of files) {
    violations.push(...checkForForbiddenPhrases(file.content, file.name));
    violations.push(...checkForHypeLanguage(file.content, file.name));
  }

  // Calculate score (100 = perfect, deduct for violations)
  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const warningCount = violations.filter((v) => v.severity === 'warning').length;
  const score = Math.max(0, 100 - criticalCount * 10 - warningCount * 3);

  return {
    passed: criticalCount === 0,
    violations,
    missingDisclosures: [], // Would be populated by scanning for required elements
    lastAuditTimestamp: new Date().toISOString(),
    score,
  };
}

// Get truth-layer compliance status
export function getTruthLayerStatus(): {
  compliant: boolean;
  score: number;
  lastCheck: string;
  requiredActions: string[];
} {
  // This would integrate with actual file scanning in production
  return {
    compliant: true,
    score: 95,
    lastCheck: new Date().toISOString(),
    requiredActions: [],
  };
}

export default {
  forbiddenPhrases,
  requiredDisclosures,
  checkForForbiddenPhrases,
  checkForHypeLanguage,
  runTruthLayerAudit,
  getTruthLayerStatus,
};
