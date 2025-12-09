/**
 * No Bluff Content Policy Guardrails for Synthex.social
 *
 * Enforces ethical content generation standards:
 * - No fake scarcity tactics
 * - No unverifiable claims
 * - Must cite data sources (DataForSEO/Semrush)
 * - No dark patterns
 * - Transparency required
 *
 * Usage:
 * ```typescript
 * const content = "Ranked #3 for SEO intelligence (per DataForSEO)";
 * const result = validateContent(content);
 *
 * if (!result.passed) {
 *   console.error('Policy violations:', result.violations);
 * }
 *
 * // Or throw on violation
 * enforceNoBluFFPolicy(content); // Throws if invalid
 * ```
 */

export type ContentPolicy = {
  name: string;
  description: string;
  severity: 'warning' | 'error';
  check: (content: string) => boolean;
  message: string;
  example: string;
};

export const noBluFFPolicies: ContentPolicy[] = [
  {
    name: 'NO_FAKE_SCARCITY',
    description: 'Prohibit artificial urgency/scarcity claims',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /only \d+ (slots|spots|seats) left/i,
        /limited time offer/i,
        /expires (today|tomorrow|soon)/i,
        /\d+% off.*last chance/i,
        /act now or miss out/i,
        /once in a lifetime/i,
        /don't miss this/i,
        /hurry.*limited/i,
        /selling fast/i,
        /almost sold out/i,
      ];
      return !patterns.some(p => p.test(content));
    },
    message: 'Content contains fake scarcity tactics',
    example: 'BANNED: "Only 3 slots left - this offer expires today"',
  },

  {
    name: 'NO_UNVERIFIABLE_CLAIMS',
    description: 'Only claim results backed by data',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /guaranteed \d+x/i,
        /guaranteed results/i,
        /best-in-class/i,
        /award-winning(?! .*(2024|2025|per|according to))/i, // Allow if year or source cited
        /proven to work/i,
        /\d+% guaranteed/i,
        /instant results/i,
        /overnight success/i,
        /revolutionary breakthrough/i,
        /never seen before/i,
        /world.?s (best|leading|top)/i,
      ];
      return !patterns.some(p => p.test(content));
    },
    message: 'Content makes unverifiable claims',
    example: 'BANNED: "Guaranteed 10x rankings in 30 days"',
  },

  {
    name: 'MUST_CITE_DATA_SOURCE',
    description: 'All metrics must reference DataForSEO or Semrush',
    severity: 'warning',
    check: (content) => {
      // If content mentions rankings/positions/keywords, must cite source
      const hasSeoMetrics = /ranking|position|keyword|visibility|SERP|top \d+/i.test(content);

      if (hasSeoMetrics) {
        const hasCitation = /(DataForSEO|Semrush|verified|data-backed|according to|per |as of \d{4})/i.test(content);
        return hasCitation;
      }

      return true; // No SEO metrics = no citation needed
    },
    message: 'Metric claims must cite DataForSEO or Semrush as source',
    example: 'REQUIRES CITATION: "Ranked #3 for SEO intelligence (per DataForSEO)"',
  },

  {
    name: 'NO_DARK_PATTERNS',
    description: 'No misleading UI/UX tricks',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /hidden.*fee/i,
        /misleading.*button/i,
        /dark pattern/i,
        /trick.*into/i,
        /bait and switch/i,
        /fake.*countdown/i,
        /false.*urgency/i,
      ];
      return !patterns.some(p => p.test(content));
    },
    message: 'Content contains dark pattern references',
    example: 'BANNED: References to hidden fees or misleading buttons',
  },

  {
    name: 'TRANSPARENCY_REQUIRED',
    description: 'Methodology and limitations must be disclosed',
    severity: 'warning',
    check: (content) => {
      // Long-form content should disclose methodology
      if (content.length > 500) {
        const hasDisclosure = /(methodology|how.*work|limitation|caveat|important|note:|disclaimer)/i.test(content);
        return hasDisclosure;
      }
      return true; // Short content doesn't need disclosure
    },
    message: 'Long-form content should disclose methodology and limitations',
    example: 'GOOD: "Rankings tracked via DataForSEO. Results vary by market and competition."',
  },

  {
    name: 'NO_FAKE_SOCIAL_PROOF',
    description: 'No fabricated testimonials or fake reviews',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /(\d{3,}|\d{1,2}k\+?)\s*(happy|satisfied)\s*customers/i, // Unless specific source cited
        /trusted by (thousands|millions)/i,
        /(\d+)\s*5-star reviews/i, // Unless specific platform cited
        /as seen on (TV|Forbes|TechCrunch)(?! in \d{4})/i, // Allow if year cited
      ];

      // Allow if specific attribution is present
      const hasAttribution = /(source:|verified on|according to|as of \d{4})/i.test(content);

      if (hasAttribution) {
return true;
}

      return !patterns.some(p => p.test(content));
    },
    message: 'Content contains unverified social proof claims',
    example: 'BANNED: "10,000+ happy customers" (unless verified source cited)',
  },

  {
    name: 'NO_EXAGGERATED_COMPARISONS',
    description: 'No misleading competitor comparisons',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /\d+x (better|faster|cheaper) than/i,
        /(destroy|crush|demolish).*competition/i,
        /(far|way) superior to/i,
        /makes.*obsolete/i,
      ];
      return !patterns.some(p => p.test(content));
    },
    message: 'Content contains exaggerated competitor comparisons',
    example: 'BANNED: "10x better than Semrush" (use specific, verifiable metrics instead)',
  },

  {
    name: 'NO_MISLEADING_PRICING',
    description: 'Pricing must be clear and accurate',
    severity: 'error',
    check: (content) => {
      const patterns = [
        /\$\d+.*forever/i, // "Forever" pricing claims
        /free.*no credit card/i, // Unless truly free tier exists
        /cancel anytime.*no fees/i, // Unless verified
      ];

      // These are only allowed if content explicitly clarifies terms
      const hasClarification = /(terms apply|see pricing page|conditions|while supplies last)/i.test(content);

      if (hasClarification) {
return true;
}

      return !patterns.some(p => p.test(content));
    },
    message: 'Pricing claims must include clear terms and conditions',
    example: 'GOOD: "Free tier available (no credit card required). Terms apply."',
  },
];

export type ContentValidationResult = {
  passed: boolean;
  violations: Array<{
    policy: string;
    severity: 'warning' | 'error';
    message: string;
  }>;
  warnings: string[];
  score: number; // 0-100, must be 100 for publication
};

/**
 * Validate content against No Bluff policies
 *
 * @param content - Content to validate
 * @returns Validation result with violations and score
 *
 * @example
 * ```typescript
 * const result = validateContent("Get 10x rankings guaranteed!");
 * console.log(result.passed); // false
 * console.log(result.violations); // [{ policy: 'NO_UNVERIFIABLE_CLAIMS', ... }]
 * console.log(result.score); // 50 (1 error = -50 points)
 * ```
 */
export function validateContent(content: string): ContentValidationResult {
  const violations: Array<{
    policy: string;
    severity: 'warning' | 'error';
    message: string;
  }> = [];

  for (const policy of noBluFFPolicies) {
    const passed = policy.check(content);
    if (!passed) {
      violations.push({
        policy: policy.name,
        severity: policy.severity,
        message: policy.message,
      });
    }
  }

  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;

  const score = Math.max(0, 100 - errorCount * 50 - warningCount * 10);

  return {
    passed: score >= 100,
    violations,
    warnings: violations.filter(v => v.severity === 'warning').map(v => v.message),
    score,
  };
}

/**
 * Enforce No Bluff policy (throws on violation)
 *
 * @param content - Content to validate
 * @throws Error if content violates policy
 *
 * @example
 * ```typescript
 * try {
 *   enforceNoBluFFPolicy("Limited time offer - only 3 spots left!");
 * } catch (error) {
 *   console.error(error.message); // "Content violates No Bluff Policy..."
 * }
 * ```
 */
export function enforceNoBluFFPolicy(content: string): void {
  const result = validateContent(content);

  if (!result.passed) {
    const errors = result.violations
      .filter(v => v.severity === 'error')
      .map(v => `❌ ${v.message}`)
      .join('\n');

    throw new Error(
      `Content violates No Bluff Policy:\n${errors}\n\nScore: ${result.score}/100`
    );
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ No Bluff Policy Warnings:', result.warnings);
  }
}

/**
 * Get a report of all policy violations
 *
 * @param content - Content to analyze
 * @returns Formatted report string
 */
export function getPolicyReport(content: string): string {
  const result = validateContent(content);

  let report = `No Bluff Content Policy Report\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Score: ${result.score}/100\n`;
  report += `Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n\n`;

  if (result.violations.length === 0) {
    report += `✅ No policy violations found.\n`;
  } else {
    report += `Violations Found: ${result.violations.length}\n\n`;

    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');

    if (errors.length > 0) {
      report += `ERRORS (${errors.length}):\n`;
      for (const error of errors) {
        report += `  ❌ ${error.policy}: ${error.message}\n`;
      }
      report += `\n`;
    }

    if (warnings.length > 0) {
      report += `WARNINGS (${warnings.length}):\n`;
      for (const warning of warnings) {
        report += `  ⚠️ ${warning.policy}: ${warning.message}\n`;
      }
      report += `\n`;
    }
  }

  return report;
}

/**
 * Get examples of content that passes/fails each policy
 *
 * @returns Map of policy examples
 */
export function getPolicyExamples(): Map<string, { good: string; bad: string }> {
  const examples = new Map<string, { good: string; bad: string }>();

  examples.set('NO_FAKE_SCARCITY', {
    good: 'Our onboarding slots fill up quickly. Check availability on our booking page.',
    bad: 'Only 3 slots left! This offer expires today!',
  });

  examples.set('NO_UNVERIFIABLE_CLAIMS', {
    good: 'Ranked #3 for "SEO intelligence" (per DataForSEO, Nov 2025)',
    bad: 'Guaranteed 10x rankings in 30 days',
  });

  examples.set('MUST_CITE_DATA_SOURCE', {
    good: 'Tracking 12 keywords with avg position 15.3 (DataForSEO, updated daily)',
    bad: 'We rank in the top 10 for all our target keywords',
  });

  examples.set('NO_DARK_PATTERNS', {
    good: 'Transparent pricing. Cancel anytime via account settings.',
    bad: 'Free trial (hidden $99 fee if you forget to cancel)',
  });

  examples.set('TRANSPARENCY_REQUIRED', {
    good: 'Rankings tracked via DataForSEO. Results vary by market and competition.',
    bad: 'Our system will boost your rankings dramatically.',
  });

  examples.set('NO_FAKE_SOCIAL_PROOF', {
    good: '500+ clients (verified on our case studies page)',
    bad: '10,000+ happy customers',
  });

  examples.set('NO_EXAGGERATED_COMPARISONS', {
    good: 'More cost-effective than traditional SEO tools (see pricing comparison)',
    bad: '10x better than Semrush - destroys the competition',
  });

  examples.set('NO_MISLEADING_PRICING', {
    good: 'Free tier available. No credit card required. See pricing page for limits.',
    bad: '$49/month forever - locked in pricing',
  });

  return examples;
}

export default {
  validateContent,
  enforceNoBluFFPolicy,
  getPolicyReport,
  getPolicyExamples,
  noBluFFPolicies,
};
