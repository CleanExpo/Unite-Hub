/**
 * Agent Output Quality Verification (Agents Protocol v1.0)
 *
 * Every agent MUST verify its own work before reporting results.
 * The verification step is NOT optional -- it is the difference
 * between reliable and unreliable agent systems.
 *
 * Quality dimensions:
 * - Completeness: Are all required fields/sections present?
 * - Coherence:    Is the output internally consistent?
 * - Relevance:    Does the output match the original task?
 * - Safety:       Does the output pass safety checks?
 *
 * Confidence scoring (0-1):
 * - 0.9-1.0: High confidence — verified and cross-checked → Deliver
 * - 0.7-0.89: Moderate — likely correct, unverified edges → Deliver with caveats
 * - 0.5-0.69: Low — uncertain about key aspects → Flag for review
 * - <0.5: Very low — significant uncertainty → Escalate before delivering
 */

// ============================================================================
// Types
// ============================================================================

export type QualityDimension =
  | 'completeness'
  | 'coherence'
  | 'relevance'
  | 'safety';

export interface QualityScore {
  /** Quality dimension being scored */
  dimension: QualityDimension;
  /** Score (0-100) */
  score: number;
  /** Weight for this dimension (0-1, all weights should sum to 1) */
  weight: number;
  /** Details about the scoring */
  details: string;
  /** Specific issues found */
  issues: string[];
}

export interface VerificationResult {
  /** Weighted overall score (0-100) */
  overallScore: number;
  /** Confidence level (0-1, derived from overallScore) */
  confidence: number;
  /** Individual dimension scores */
  dimensionScores: QualityScore[];
  /** Whether output passes minimum quality threshold */
  passed: boolean;
  /** All issues found across dimensions */
  issues: string[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Timestamp of verification */
  verifiedAt: string;
  /** Agent ID that produced the output */
  agentId: string;
}

export interface VerificationConfig {
  /** Minimum overall score to pass (0-100, default: 60) */
  minimumScore: number;
  /** Dimension weights (must sum to 1) */
  weights: Record<QualityDimension, number>;
  /** Expected fields in the output (for completeness check) */
  expectedFields?: string[];
  /** Minimum output length (characters) */
  minimumOutputLength?: number;
  /** Maximum output length (characters) */
  maximumOutputLength?: number;
  /** Keywords that MUST appear in output (for relevance) */
  requiredKeywords?: string[];
  /** Keywords that MUST NOT appear in output (for safety) */
  blockedKeywords?: string[];
  /** Custom validation function */
  customValidator?: (output: unknown) => { valid: boolean; issues: string[] };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: VerificationConfig = {
  minimumScore: 60,
  weights: {
    completeness: 0.3,
    coherence: 0.25,
    relevance: 0.3,
    safety: 0.15,
  },
  minimumOutputLength: 10,
  maximumOutputLength: 500_000,
};

// ============================================================================
// Output Verifier
// ============================================================================

export class OutputVerifier {
  private config: VerificationConfig;

  constructor(config?: Partial<VerificationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Verify an agent's output across all quality dimensions
   */
  verify(
    agentId: string,
    output: unknown,
    taskDescription: string,
    options?: Partial<VerificationConfig>
  ): VerificationResult {
    const config = { ...this.config, ...options };
    const dimensionScores: QualityScore[] = [];

    // Score each dimension
    dimensionScores.push(this.scoreCompleteness(output, config));
    dimensionScores.push(this.scoreCoherence(output, config));
    dimensionScores.push(this.scoreRelevance(output, taskDescription, config));
    dimensionScores.push(this.scoreSafety(output, config));

    // Run custom validator if provided
    if (config.customValidator) {
      const custom = config.customValidator(output);
      if (!custom.valid) {
        // Reduce all scores proportionally
        for (const score of dimensionScores) {
          score.issues.push(...custom.issues);
          score.score = Math.max(0, score.score - 10);
        }
      }
    }

    // Calculate weighted overall score
    const overallScore = dimensionScores.reduce(
      (sum, s) => sum + s.score * s.weight,
      0
    );

    // Derive confidence from overall score
    const confidence = overallScore / 100;

    // Collect all issues
    const issues = dimensionScores.flatMap((s) => s.issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dimensionScores, overallScore);

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      dimensionScores,
      passed: overallScore >= config.minimumScore,
      issues,
      recommendations,
      verifiedAt: new Date().toISOString(),
      agentId,
    };
  }

  // --- Dimension Scorers ---

  private scoreCompleteness(
    output: unknown,
    config: VerificationConfig
  ): QualityScore {
    const issues: string[] = [];
    let score = 100;

    // Check for null/undefined/empty
    if (output == null) {
      return {
        dimension: 'completeness',
        score: 0,
        weight: config.weights.completeness,
        details: 'Output is null or undefined',
        issues: ['Output is null or undefined'],
      };
    }

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Check minimum length
    if (config.minimumOutputLength && outputStr.length < config.minimumOutputLength) {
      score -= 40;
      issues.push(
        `Output too short: ${outputStr.length} chars (minimum: ${config.minimumOutputLength})`
      );
    }

    // Check maximum length
    if (config.maximumOutputLength && outputStr.length > config.maximumOutputLength) {
      score -= 20;
      issues.push(
        `Output too long: ${outputStr.length} chars (maximum: ${config.maximumOutputLength})`
      );
    }

    // Check expected fields (for object outputs)
    if (config.expectedFields && typeof output === 'object' && output !== null) {
      const obj = output as Record<string, unknown>;
      for (const field of config.expectedFields) {
        if (!(field in obj) || obj[field] == null) {
          score -= 15;
          issues.push(`Missing expected field: ${field}`);
        }
      }
    }

    // Check for placeholder content
    const placeholderPatterns = [
      /\[TODO\]/i,
      /\[INSERT\s/i,
      /\[PLACEHOLDER\]/i,
      /lorem ipsum/i,
      /\.\.\.\s*$/,
    ];
    for (const pattern of placeholderPatterns) {
      if (pattern.test(outputStr)) {
        score -= 20;
        issues.push(`Placeholder content detected: ${pattern.source}`);
      }
    }

    return {
      dimension: 'completeness',
      score: Math.max(0, score),
      weight: config.weights.completeness,
      details: issues.length === 0 ? 'Output appears complete' : `${issues.length} completeness issues found`,
      issues,
    };
  }

  private scoreCoherence(
    output: unknown,
    config: VerificationConfig
  ): QualityScore {
    const issues: string[] = [];
    let score = 100;

    if (output == null) {
      return {
        dimension: 'coherence',
        score: 0,
        weight: config.weights.coherence,
        details: 'Cannot assess coherence of null output',
        issues: ['Output is null'],
      };
    }

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

    // Check for JSON validity if output looks like JSON
    if (outputStr.trim().startsWith('{') || outputStr.trim().startsWith('[')) {
      try {
        JSON.parse(outputStr);
      } catch {
        score -= 30;
        issues.push('Output appears to be invalid JSON');
      }
    }

    // Check for contradictions (simple heuristic)
    const contradictionPatterns = [
      { positive: /\bis\b/gi, negative: /\bis not\b/gi },
      { positive: /\bshould\b/gi, negative: /\bshould not\b/gi },
      { positive: /\bcan\b/gi, negative: /\bcannot\b/gi },
    ];

    for (const pattern of contradictionPatterns) {
      const positiveCount = (outputStr.match(pattern.positive) || []).length;
      const negativeCount = (outputStr.match(pattern.negative) || []).length;
      // Simple heuristic: if both positive and negative appear many times, might be contradictory
      if (positiveCount > 5 && negativeCount > 5) {
        score -= 5;
        issues.push('Potential contradictions detected (mixed assertions)');
        break;
      }
    }

    // Check for excessive repetition
    const words = outputStr.split(/\s+/);
    if (words.length > 20) {
      const wordFreq = new Map<string, number>();
      for (const word of words) {
        const lower = word.toLowerCase();
        if (lower.length > 3) {
          wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
        }
      }

      for (const [word, count] of wordFreq) {
        if (count > words.length * 0.15 && count > 10) {
          score -= 10;
          issues.push(`Excessive repetition: "${word}" appears ${count} times`);
          break;
        }
      }
    }

    // Check for truncated output
    if (outputStr.endsWith('...') || outputStr.endsWith('…')) {
      score -= 15;
      issues.push('Output appears truncated');
    }

    return {
      dimension: 'coherence',
      score: Math.max(0, score),
      weight: config.weights.coherence,
      details: issues.length === 0 ? 'Output appears coherent' : `${issues.length} coherence issues found`,
      issues,
    };
  }

  private scoreRelevance(
    output: unknown,
    taskDescription: string,
    config: VerificationConfig
  ): QualityScore {
    const issues: string[] = [];
    let score = 100;

    if (output == null || !taskDescription) {
      return {
        dimension: 'relevance',
        score: 0,
        weight: config.weights.relevance,
        details: 'Cannot assess relevance without output and task description',
        issues: ['Missing output or task description'],
      };
    }

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
    const outputLower = outputStr.toLowerCase();
    const taskLower = taskDescription.toLowerCase();

    // Check required keywords
    if (config.requiredKeywords) {
      for (const keyword of config.requiredKeywords) {
        if (!outputLower.includes(keyword.toLowerCase())) {
          score -= 15;
          issues.push(`Missing required keyword: "${keyword}"`);
        }
      }
    }

    // Extract key terms from task description and check presence in output
    const taskWords = taskLower
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .filter((w) => !['about', 'should', 'would', 'could', 'their', 'there', 'which', 'where', 'these', 'those'].includes(w));

    const uniqueTaskWords = [...new Set(taskWords)];

    if (uniqueTaskWords.length > 0) {
      const matchingWords = uniqueTaskWords.filter((w) => outputLower.includes(w));
      const matchRatio = matchingWords.length / uniqueTaskWords.length;

      if (matchRatio < 0.2) {
        score -= 30;
        issues.push(`Low task-output relevance: only ${Math.round(matchRatio * 100)}% key terms present`);
      } else if (matchRatio < 0.4) {
        score -= 15;
        issues.push(`Moderate task-output relevance: ${Math.round(matchRatio * 100)}% key terms present`);
      }
    }

    // Check if output is generic/boilerplate
    const genericPhrases = [
      'i am an ai',
      'as an ai',
      'i cannot help',
      'i apologize',
      'i\'m sorry, but',
    ];
    for (const phrase of genericPhrases) {
      if (outputLower.includes(phrase)) {
        score -= 20;
        issues.push('Output contains generic AI refusal/apology language');
        break;
      }
    }

    return {
      dimension: 'relevance',
      score: Math.max(0, score),
      weight: config.weights.relevance,
      details: issues.length === 0 ? 'Output appears relevant to task' : `${issues.length} relevance issues found`,
      issues,
    };
  }

  private scoreSafety(
    output: unknown,
    config: VerificationConfig
  ): QualityScore {
    const issues: string[] = [];
    let score = 100;

    if (output == null) {
      return {
        dimension: 'safety',
        score: 100, // Null output is safe
        weight: config.weights.safety,
        details: 'No safety concerns (null output)',
        issues: [],
      };
    }

    const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
    const outputLower = outputStr.toLowerCase();

    // Check blocked keywords
    if (config.blockedKeywords) {
      for (const keyword of config.blockedKeywords) {
        if (outputLower.includes(keyword.toLowerCase())) {
          score -= 25;
          issues.push(`Blocked keyword found: "${keyword}"`);
        }
      }
    }

    // Check for potential sensitive data exposure
    const sensitivePatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN-like pattern' },
      { pattern: /\b\d{16}\b/, name: 'Credit card-like number' },
      { pattern: /password\s*[:=]\s*\S+/i, name: 'Exposed password' },
      { pattern: /api[_-]?key\s*[:=]\s*\S+/i, name: 'Exposed API key' },
      { pattern: /secret\s*[:=]\s*\S+/i, name: 'Exposed secret' },
      { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i, name: 'Exposed bearer token' },
    ];

    for (const { pattern, name } of sensitivePatterns) {
      if (pattern.test(outputStr)) {
        score -= 30;
        issues.push(`Potential sensitive data: ${name}`);
      }
    }

    // Check for script injection
    if (/<script\b/i.test(outputStr)) {
      score -= 40;
      issues.push('Script tag detected in output');
    }

    return {
      dimension: 'safety',
      score: Math.max(0, score),
      weight: config.weights.safety,
      details: issues.length === 0 ? 'No safety concerns detected' : `${issues.length} safety issues found`,
      issues,
    };
  }

  // --- Recommendations ---

  private generateRecommendations(
    scores: QualityScore[],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    for (const score of scores) {
      if (score.score < 50) {
        switch (score.dimension) {
          case 'completeness':
            recommendations.push('Ensure all required fields are populated and output meets minimum length requirements');
            break;
          case 'coherence':
            recommendations.push('Review output for internal consistency; consider regenerating with clearer instructions');
            break;
          case 'relevance':
            recommendations.push('Output may not address the original task; consider refining the prompt with task-specific context');
            break;
          case 'safety':
            recommendations.push('Review output for sensitive data exposure; sanitize before delivering');
            break;
        }
      }
    }

    if (overallScore < 50) {
      recommendations.push('Overall quality is below threshold; consider escalating to a higher-tier model or human review');
    }

    return recommendations;
  }
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Quick verification of agent output with default settings
 */
export function verifyAgentOutput(
  agentId: string,
  output: unknown,
  taskDescription: string,
  options?: Partial<VerificationConfig>
): VerificationResult {
  const verifier = new OutputVerifier(options);
  return verifier.verify(agentId, output, taskDescription);
}
