/**
 * Creative Quality Scorer
 * Phase 61: AI scoring for visuals, copy, and UX elements
 */

import { QualityCheck } from './creativeDirectorEngine';

export interface QualityScore {
  overall: number;
  breakdown: {
    brand_consistency: number;
    accessibility: number;
    readability: number;
    tone_accuracy: number;
    visual_balance: number;
    truth_layer: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  checks: {
    passed: QualityCheck[];
    failed: QualityCheck[];
    warnings: string[];
  };
  recommendations: string[];
}

export interface VisualMetrics {
  colors_used: string[];
  contrast_ratios: number[];
  has_text_overlay: boolean;
  image_quality: number;
  composition_score: number;
}

export interface CopyMetrics {
  word_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  readability_score: number;
  tone_keywords: string[];
  forbidden_phrases: string[];
}

export interface UXMetrics {
  load_time_ms: number;
  interaction_targets: number;
  touch_target_sizes: number[];
  focus_indicators: boolean;
  semantic_structure: boolean;
}

/**
 * Creative Quality Scorer
 * Evaluates creative assets against quality standards
 */
export class CreativeQualityScorer {
  /**
   * Score a visual asset
   */
  scoreVisual(metrics: VisualMetrics, brandColors: string[]): QualityScore {
    const breakdown = {
      brand_consistency: 0,
      accessibility: 0,
      readability: 0,
      tone_accuracy: 70, // Default for visuals
      visual_balance: 0,
      truth_layer: 100, // Assume compliant unless flagged
    };

    const passed: QualityCheck[] = [];
    const failed: QualityCheck[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Brand consistency - check color usage
    const colorsMatch = metrics.colors_used.filter((c) =>
      brandColors.some((bc) => this.colorsAreSimilar(c, bc))
    );
    breakdown.brand_consistency = Math.round((colorsMatch.length / Math.max(metrics.colors_used.length, 1)) * 100);

    if (breakdown.brand_consistency >= 70) {
      passed.push('brand_consistency');
    } else {
      failed.push('brand_consistency');
      recommendations.push('Use more colors from the brand palette');
    }

    // Accessibility - contrast ratios
    const goodContrast = metrics.contrast_ratios.filter((r) => r >= 4.5).length;
    breakdown.accessibility = Math.round((goodContrast / Math.max(metrics.contrast_ratios.length, 1)) * 100);

    if (breakdown.accessibility >= 80) {
      passed.push('web_accessibility');
      passed.push('color_contrast');
    } else {
      failed.push('color_contrast');
      recommendations.push('Improve color contrast for accessibility (aim for 4.5:1 ratio)');
    }

    // Visual balance / composition
    breakdown.visual_balance = metrics.composition_score;

    if (metrics.composition_score < 60) {
      warnings.push('Visual composition could be improved');
      recommendations.push('Consider rule of thirds or golden ratio for layout');
    }

    // Readability for text overlays
    if (metrics.has_text_overlay) {
      breakdown.readability = metrics.contrast_ratios.length > 0
        ? Math.min(...metrics.contrast_ratios) >= 4.5 ? 90 : 50
        : 70;

      if (breakdown.readability < 70) {
        failed.push('readability');
        recommendations.push('Increase contrast for text overlays');
      } else {
        passed.push('readability');
      }
    } else {
      breakdown.readability = 80;
    }

    const overall = Math.round(
      breakdown.brand_consistency * 0.3 +
      breakdown.accessibility * 0.25 +
      breakdown.visual_balance * 0.2 +
      breakdown.readability * 0.15 +
      breakdown.truth_layer * 0.1
    );

    return {
      overall,
      breakdown,
      grade: this.calculateGrade(overall),
      checks: { passed, failed, warnings },
      recommendations,
    };
  }

  /**
   * Score copy/text content
   */
  scoreCopy(
    metrics: CopyMetrics,
    toneKeywords: string[],
    forbiddenPhrases: string[]
  ): QualityScore {
    const breakdown = {
      brand_consistency: 70,
      accessibility: 0,
      readability: 0,
      tone_accuracy: 0,
      visual_balance: 70, // Not applicable for copy
      truth_layer: 100,
    };

    const passed: QualityCheck[] = [];
    const failed: QualityCheck[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Readability score (Flesch-Kincaid style)
    breakdown.readability = Math.min(100, metrics.readability_score);

    if (breakdown.readability >= 60) {
      passed.push('readability');
    } else {
      failed.push('readability');
      recommendations.push('Simplify sentence structure for better readability');
    }

    // Tone accuracy - check for tone keywords
    const toneMatches = metrics.tone_keywords.filter((k) =>
      toneKeywords.some((tk) => k.toLowerCase().includes(tk.toLowerCase()))
    );
    breakdown.tone_accuracy = Math.min(100, Math.round((toneMatches.length / Math.max(toneKeywords.length, 1)) * 100) + 50);

    if (breakdown.tone_accuracy >= 70) {
      passed.push('tone_accuracy');
    } else {
      warnings.push('Content may not match brand tone');
      recommendations.push(`Consider using tone keywords: ${toneKeywords.slice(0, 3).join(', ')}`);
    }

    // Truth layer compliance
    const hasForbidden = metrics.forbidden_phrases.some((fp) =>
      forbiddenPhrases.some((fb) => fp.toLowerCase().includes(fb.toLowerCase()))
    );

    if (hasForbidden) {
      breakdown.truth_layer = 0;
      failed.push('truth_layer_compliance');
      recommendations.push('Remove forbidden phrases that violate truth-layer guidelines');
    } else {
      passed.push('truth_layer_compliance');
    }

    // Accessibility - sentence length for cognitive accessibility
    if (metrics.avg_sentence_length <= 20) {
      breakdown.accessibility = 90;
      passed.push('web_accessibility');
    } else if (metrics.avg_sentence_length <= 30) {
      breakdown.accessibility = 70;
      warnings.push('Consider shorter sentences for better comprehension');
    } else {
      breakdown.accessibility = 50;
      failed.push('web_accessibility');
      recommendations.push('Break up long sentences (aim for under 20 words)');
    }

    const overall = Math.round(
      breakdown.readability * 0.3 +
      breakdown.tone_accuracy * 0.25 +
      breakdown.truth_layer * 0.25 +
      breakdown.accessibility * 0.2
    );

    return {
      overall,
      breakdown,
      grade: this.calculateGrade(overall),
      checks: { passed, failed, warnings },
      recommendations,
    };
  }

  /**
   * Score UX element
   */
  scoreUX(metrics: UXMetrics): QualityScore {
    const breakdown = {
      brand_consistency: 70, // Default
      accessibility: 0,
      readability: 70, // Default
      tone_accuracy: 70, // Default
      visual_balance: 0,
      truth_layer: 100, // Default
    };

    const passed: QualityCheck[] = [];
    const failed: QualityCheck[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Accessibility - touch targets
    const goodTargets = metrics.touch_target_sizes.filter((s) => s >= 44).length;
    const targetScore = Math.round((goodTargets / Math.max(metrics.touch_target_sizes.length, 1)) * 100);

    // Focus indicators
    const focusScore = metrics.focus_indicators ? 100 : 0;

    // Semantic structure
    const semanticScore = metrics.semantic_structure ? 100 : 0;

    breakdown.accessibility = Math.round((targetScore + focusScore + semanticScore) / 3);

    if (breakdown.accessibility >= 80) {
      passed.push('web_accessibility');
    } else {
      failed.push('web_accessibility');
      if (!metrics.focus_indicators) {
        recommendations.push('Add visible focus indicators for keyboard navigation');
      }
      if (!metrics.semantic_structure) {
        recommendations.push('Use semantic HTML elements');
      }
      if (targetScore < 80) {
        recommendations.push('Increase touch target sizes to at least 44x44px');
      }
    }

    // Visual balance - load time as proxy
    if (metrics.load_time_ms <= 1000) {
      breakdown.visual_balance = 100;
    } else if (metrics.load_time_ms <= 3000) {
      breakdown.visual_balance = 70;
      warnings.push('Consider optimizing for faster load times');
    } else {
      breakdown.visual_balance = 40;
      failed.push('persona_fit'); // Using as proxy for performance
      recommendations.push('Optimize assets to reduce load time below 3 seconds');
    }

    const overall = Math.round(
      breakdown.accessibility * 0.5 +
      breakdown.visual_balance * 0.3 +
      breakdown.brand_consistency * 0.2
    );

    return {
      overall,
      breakdown,
      grade: this.calculateGrade(overall),
      checks: { passed, failed, warnings },
      recommendations,
    };
  }

  /**
   * Calculate letter grade from score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Check if two colors are similar
   */
  private colorsAreSimilar(color1: string, color2: string): boolean {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return false;

    const diff = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );

    return diff < 50; // Threshold for similarity
  }
}

export default CreativeQualityScorer;
