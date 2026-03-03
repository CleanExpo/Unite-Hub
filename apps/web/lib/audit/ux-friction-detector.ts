/**
 * UX Friction Detector - Autonomous Platform Audit System
 *
 * Analyzes user experience patterns and detects friction points:
 * - Slow interactions
 * - Confusing navigation
 * - Dead ends
 * - Error states without recovery
 * - Accessibility issues
 * - Mobile/responsive problems
 */

import { v4 as uuidv4 } from 'uuid';
import type { JourneyResult, StepResult, FrictionPoint } from './user-journey-runner';

// ============================================================================
// Types
// ============================================================================

export interface FrictionAnalysis {
  analysis_id: string;
  timestamp: string;
  source: 'journey' | 'manual' | 'automated';
  friction_points: DetailedFrictionPoint[];
  metrics: FrictionMetrics;
  recommendations: Recommendation[];
  severity_distribution: SeverityDistribution;
}

export interface DetailedFrictionPoint extends FrictionPoint {
  category: FrictionCategory;
  impact: FrictionImpact;
  evidence: FrictionEvidence;
  reproducible: boolean;
  affected_users_estimate: 'all' | 'most' | 'some' | 'few';
}

export type FrictionCategory =
  | 'performance'
  | 'usability'
  | 'accessibility'
  | 'error_handling'
  | 'navigation'
  | 'content'
  | 'visual'
  | 'mobile'
  | 'security';

export interface FrictionImpact {
  user_impact: 'blocking' | 'frustrating' | 'annoying' | 'minor';
  business_impact: 'critical' | 'high' | 'medium' | 'low';
  conversion_impact: number; // -100 to 0 (percentage impact on conversion)
}

export interface FrictionEvidence {
  type: 'screenshot' | 'video' | 'log' | 'metric' | 'user_report';
  data: string;
  captured_at: string;
}

export interface FrictionMetrics {
  total_friction_points: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  average_resolution_time_estimate: string;
  friction_score: number; // 0-100, lower is better
}

export interface Recommendation {
  id: string;
  friction_point_id: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  expected_improvement: string;
  effort_estimate: 'trivial' | 'small' | 'medium' | 'large' | 'major';
  tags: string[];
}

export interface SeverityDistribution {
  blocking: number;
  frustrating: number;
  annoying: number;
  minor: number;
}

export interface FrictionRule {
  id: string;
  name: string;
  description: string;
  category: FrictionCategory;
  check: (data: RuleCheckData) => FrictionRuleResult;
}

export interface RuleCheckData {
  step?: StepResult;
  journey?: JourneyResult;
  pageMetrics?: PageMetrics;
  domSnapshot?: string;
}

export interface FrictionRuleResult {
  triggered: boolean;
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion?: string;
}

export interface PageMetrics {
  load_time_ms: number;
  time_to_interactive_ms: number;
  cumulative_layout_shift: number;
  largest_contentful_paint_ms: number;
  first_input_delay_ms: number;
  total_blocking_time_ms: number;
  dom_size: number;
  resource_count: number;
  total_resource_size_bytes: number;
}

// ============================================================================
// Friction Detection Rules
// ============================================================================

const FRICTION_RULES: FrictionRule[] = [
  // Performance Rules
  {
    id: 'slow_page_load',
    name: 'Slow Page Load',
    description: 'Page takes too long to load',
    category: 'performance',
    check: (data) => {
      const threshold = 3000;
      const loadTime = data.step?.duration_ms || 0;
      return {
        triggered: loadTime > threshold,
        severity: loadTime > threshold * 2 ? 'high' : 'medium',
        description: `Page load time (${loadTime}ms) exceeds threshold (${threshold}ms)`,
        suggestion: 'Optimize bundle size, use code splitting, enable caching',
      };
    },
  },
  {
    id: 'slow_interaction',
    name: 'Slow Interaction Response',
    description: 'User interaction takes too long to respond',
    category: 'performance',
    check: (data) => {
      const threshold = 100;
      const responseTime = data.pageMetrics?.first_input_delay_ms || 0;
      return {
        triggered: responseTime > threshold,
        severity: responseTime > 300 ? 'high' : 'medium',
        description: `Interaction response (${responseTime}ms) is slow`,
        suggestion: 'Reduce JavaScript execution time, defer non-critical scripts',
      };
    },
  },
  {
    id: 'layout_shift',
    name: 'Unexpected Layout Shift',
    description: 'Page content shifts unexpectedly',
    category: 'visual',
    check: (data) => {
      const threshold = 0.1;
      const cls = data.pageMetrics?.cumulative_layout_shift || 0;
      return {
        triggered: cls > threshold,
        severity: cls > 0.25 ? 'high' : 'medium',
        description: `Cumulative Layout Shift (${cls.toFixed(3)}) exceeds threshold`,
        suggestion: 'Reserve space for dynamic content, specify image dimensions',
      };
    },
  },
  // Error Handling Rules
  {
    id: 'unhandled_error',
    name: 'Unhandled Error',
    description: 'Error occurs without user-friendly handling',
    category: 'error_handling',
    check: (data) => {
      const hasError = data.step?.status === 'error' || data.step?.status === 'failed';
      const errorLogs =
        data.step?.evidence.console_logs.filter(
          (log: string) =>
            log.includes('Error') || log.includes('error') || log.includes('Exception')
        ) || [];
      return {
        triggered: hasError || errorLogs.length > 0,
        severity: 'high',
        description: `Error detected: ${data.step?.error || errorLogs[0] || 'Unknown'}`,
        suggestion: 'Implement error boundary with user-friendly message and recovery option',
      };
    },
  },
  {
    id: 'no_error_recovery',
    name: 'No Error Recovery Path',
    description: 'Error state without clear recovery action',
    category: 'error_handling',
    check: (data) => {
      // Check if error message includes recovery guidance
      const errorMessage = data.step?.error || '';
      const hasRecoveryGuidance =
        errorMessage.includes('try again') ||
        errorMessage.includes('contact support') ||
        errorMessage.includes('go back');
      return {
        triggered: data.step?.status === 'error' && !hasRecoveryGuidance,
        severity: 'medium',
        description: 'Error state does not provide recovery guidance',
        suggestion: 'Add "Try again" button or clear next steps for users',
      };
    },
  },
  // Navigation Rules
  {
    id: 'dead_end',
    name: 'Navigation Dead End',
    description: 'User reaches a state with no clear next action',
    category: 'navigation',
    check: (_data) => {
      // This would be detected by analyzing DOM for clickable elements
      // Simplified check for now
      return {
        triggered: false, // Would need DOM analysis
        severity: 'medium',
        description: 'Page has no clear call-to-action or navigation',
        suggestion: 'Add clear navigation options or call-to-action buttons',
      };
    },
  },
  // Accessibility Rules
  {
    id: 'missing_alt_text',
    name: 'Missing Alt Text',
    description: 'Images without alternative text',
    category: 'accessibility',
    check: (data) => {
      // Would analyze DOM for images without alt attributes
      const hasIssue =
        data.domSnapshot?.includes('<img src="') && !data.domSnapshot?.includes('alt="');
      return {
        triggered: hasIssue || false,
        severity: 'medium',
        description: 'Images found without alt text',
        suggestion: 'Add descriptive alt text to all meaningful images',
      };
    },
  },
  {
    id: 'low_contrast',
    name: 'Low Color Contrast',
    description: 'Text does not have sufficient contrast with background',
    category: 'accessibility',
    check: () => {
      // Would need color analysis
      return {
        triggered: false,
        severity: 'medium',
        description: 'Text contrast ratio is below WCAG requirements',
        suggestion: 'Increase contrast ratio to at least 4.5:1 for normal text',
      };
    },
  },
  // Mobile Rules
  {
    id: 'small_touch_target',
    name: 'Small Touch Target',
    description: 'Interactive elements too small for touch',
    category: 'mobile',
    check: () => {
      // Would analyze DOM for element sizes
      return {
        triggered: false,
        severity: 'medium',
        description: 'Touch targets smaller than 44x44px',
        suggestion: 'Increase interactive element size to at least 44x44px',
      };
    },
  },
];

// ============================================================================
// UX Friction Detector
// ============================================================================

export class UXFrictionDetector {
  private readonly detectorId: string;
  private readonly customRules: FrictionRule[] = [];
  private analyses: Map<string, FrictionAnalysis> = new Map();

  constructor() {
    this.detectorId = `friction_detector_${uuidv4().slice(0, 8)}`;
  }

  getDetectorId(): string {
    return this.detectorId;
  }

  /**
   * Add a custom friction detection rule
   */
  addRule(rule: FrictionRule): void {
    this.customRules.push(rule);
  }

  /**
   * Analyze a journey result for friction points
   */
  analyzeJourney(journey: JourneyResult): FrictionAnalysis {
    const frictionPoints: DetailedFrictionPoint[] = [];

    // Analyze each step
    for (const step of journey.step_results) {
      const stepFriction = this.analyzeStep(step, journey);
      frictionPoints.push(...stepFriction);
    }

    // Add friction points from journey summary
    for (const fp of journey.summary.friction_points) {
      frictionPoints.push(this.enhanceFrictionPoint(fp));
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(frictionPoints);

    // Calculate metrics
    const metrics = this.calculateMetrics(frictionPoints);

    const analysis: FrictionAnalysis = {
      analysis_id: `analysis_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      source: 'journey',
      friction_points: frictionPoints,
      metrics,
      recommendations,
      severity_distribution: this.calculateSeverityDistribution(frictionPoints),
    };

    this.analyses.set(analysis.analysis_id, analysis);
    return analysis;
  }

  /**
   * Analyze a single step for friction
   */
  private analyzeStep(step: StepResult, journey: JourneyResult): DetailedFrictionPoint[] {
    const points: DetailedFrictionPoint[] = [];
    const allRules = [...FRICTION_RULES, ...this.customRules];

    for (const rule of allRules) {
      const result = rule.check({
        step,
        journey,
      });

      if (result.triggered) {
        points.push({
          step_id: step.step_id,
          type: this.mapCategoryToType(rule.category),
          severity: result.severity,
          description: result.description,
          suggestion: result.suggestion,
          category: rule.category,
          impact: this.estimateImpact(result.severity, rule.category),
          evidence: {
            type: 'log',
            data: JSON.stringify({
              step_name: step.step_name,
              duration_ms: step.duration_ms,
              status: step.status,
              error: step.error,
            }),
            captured_at: step.timestamp,
          },
          reproducible: true,
          affected_users_estimate: this.estimateAffectedUsers(rule.category),
        });
      }
    }

    return points;
  }

  /**
   * Enhance a basic friction point with detailed information
   */
  private enhanceFrictionPoint(fp: FrictionPoint): DetailedFrictionPoint {
    return {
      ...fp,
      category: this.inferCategory(fp.type),
      impact: this.estimateImpact(fp.severity, this.inferCategory(fp.type)),
      evidence: {
        type: 'metric',
        data: fp.description,
        captured_at: new Date().toISOString(),
      },
      reproducible: true,
      affected_users_estimate: 'most',
    };
  }

  /**
   * Map friction category to simplified type
   */
  private mapCategoryToType(category: FrictionCategory): FrictionPoint['type'] {
    switch (category) {
      case 'performance':
        return 'slow_response';
      case 'error_handling':
        return 'error';
      case 'navigation':
        return 'dead_end';
      case 'usability':
        return 'confusing_ui';
      default:
        return 'confusing_ui';
    }
  }

  /**
   * Infer category from friction type
   */
  private inferCategory(type: FrictionPoint['type']): FrictionCategory {
    switch (type) {
      case 'slow_response':
        return 'performance';
      case 'error':
        return 'error_handling';
      case 'dead_end':
        return 'navigation';
      case 'confusing_ui':
        return 'usability';
      case 'loop':
        return 'navigation';
      default:
        return 'usability';
    }
  }

  /**
   * Estimate impact based on severity and category
   */
  private estimateImpact(
    severity: 'high' | 'medium' | 'low',
    category: FrictionCategory
  ): FrictionImpact {
    const userImpactMap: Record<FrictionCategory, Record<string, FrictionImpact['user_impact']>> = {
      performance: { high: 'frustrating', medium: 'annoying', low: 'minor' },
      error_handling: { high: 'blocking', medium: 'frustrating', low: 'annoying' },
      accessibility: { high: 'blocking', medium: 'frustrating', low: 'annoying' },
      navigation: { high: 'blocking', medium: 'frustrating', low: 'annoying' },
      usability: { high: 'frustrating', medium: 'annoying', low: 'minor' },
      content: { high: 'annoying', medium: 'minor', low: 'minor' },
      visual: { high: 'annoying', medium: 'minor', low: 'minor' },
      mobile: { high: 'frustrating', medium: 'annoying', low: 'minor' },
      security: { high: 'blocking', medium: 'blocking', low: 'frustrating' },
    };

    const businessImpactMap: Record<string, FrictionImpact['business_impact']> = {
      high: 'high',
      medium: 'medium',
      low: 'low',
    };

    const conversionImpactMap: Record<string, number> = {
      blocking: -50,
      frustrating: -20,
      annoying: -5,
      minor: -1,
    };

    const userImpact = userImpactMap[category]?.[severity] || 'minor';

    return {
      user_impact: userImpact,
      business_impact: businessImpactMap[severity] || 'low',
      conversion_impact: conversionImpactMap[userImpact] || 0,
    };
  }

  /**
   * Estimate affected users based on category
   */
  private estimateAffectedUsers(
    category: FrictionCategory
  ): DetailedFrictionPoint['affected_users_estimate'] {
    switch (category) {
      case 'performance':
        return 'all';
      case 'mobile':
        return 'some'; // ~50% on mobile
      case 'accessibility':
        return 'some'; // ~15-20% have some accessibility needs
      default:
        return 'all';
    }
  }

  /**
   * Generate recommendations for friction points
   */
  private generateRecommendations(points: DetailedFrictionPoint[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const point of points) {
      if (!point.suggestion) continue;

      recommendations.push({
        id: `rec_${uuidv4().slice(0, 8)}`,
        friction_point_id: point.step_id,
        priority: this.getPriority(point.impact),
        action: point.suggestion,
        expected_improvement: this.estimateImprovement(point),
        effort_estimate: this.estimateEffort(point.category),
        tags: [point.category, point.severity, point.type],
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const order = { immediate: 0, short_term: 1, long_term: 2 };
      return order[a.priority] - order[b.priority];
    });
  }

  /**
   * Get priority based on impact
   */
  private getPriority(impact: FrictionImpact): Recommendation['priority'] {
    if (impact.user_impact === 'blocking' || impact.business_impact === 'critical') {
      return 'immediate';
    }
    if (impact.user_impact === 'frustrating' || impact.business_impact === 'high') {
      return 'short_term';
    }
    return 'long_term';
  }

  /**
   * Estimate improvement from fixing a friction point
   */
  private estimateImprovement(point: DetailedFrictionPoint): string {
    const impactPercent = Math.abs(point.impact.conversion_impact);
    return `Up to ${impactPercent}% improvement in conversion/engagement`;
  }

  /**
   * Estimate effort to fix
   */
  private estimateEffort(category: FrictionCategory): Recommendation['effort_estimate'] {
    const effortMap: Record<FrictionCategory, Recommendation['effort_estimate']> = {
      content: 'trivial',
      visual: 'small',
      accessibility: 'small',
      usability: 'medium',
      navigation: 'medium',
      performance: 'medium',
      error_handling: 'medium',
      mobile: 'medium',
      security: 'large',
    };
    return effortMap[category] || 'medium';
  }

  /**
   * Calculate friction metrics
   */
  private calculateMetrics(points: DetailedFrictionPoint[]): FrictionMetrics {
    const critical = points.filter((p) => p.impact.user_impact === 'blocking').length;
    const high = points.filter((p) => p.severity === 'high').length;
    const medium = points.filter((p) => p.severity === 'medium').length;
    const low = points.filter((p) => p.severity === 'low').length;

    // Friction score: weighted sum (lower is better)
    const frictionScore = Math.min(100, critical * 30 + high * 15 + medium * 5 + low * 1);

    return {
      total_friction_points: points.length,
      critical_count: critical,
      high_count: high,
      medium_count: medium,
      low_count: low,
      average_resolution_time_estimate: this.estimateResolutionTime(points),
      friction_score: frictionScore,
    };
  }

  /**
   * Estimate total resolution time
   */
  private estimateResolutionTime(points: DetailedFrictionPoint[]): string {
    // Rough estimates per effort level
    const effortHours: Record<string, number> = {
      trivial: 0.5,
      small: 2,
      medium: 8,
      large: 24,
      major: 80,
    };

    let totalHours = 0;
    for (const point of points) {
      const effort = this.estimateEffort(point.category);
      totalHours += effortHours[effort] || 8;
    }

    if (totalHours < 8) {
      return `~${Math.ceil(totalHours)} hours`;
    } else if (totalHours < 40) {
      return `~${Math.ceil(totalHours / 8)} days`;
    } else {
      return `~${Math.ceil(totalHours / 40)} weeks`;
    }
  }

  /**
   * Calculate severity distribution
   */
  private calculateSeverityDistribution(points: DetailedFrictionPoint[]): SeverityDistribution {
    return {
      blocking: points.filter((p) => p.impact.user_impact === 'blocking').length,
      frustrating: points.filter((p) => p.impact.user_impact === 'frustrating').length,
      annoying: points.filter((p) => p.impact.user_impact === 'annoying').length,
      minor: points.filter((p) => p.impact.user_impact === 'minor').length,
    };
  }

  /**
   * Get all analyses
   */
  getAnalyses(): FrictionAnalysis[] {
    return Array.from(this.analyses.values());
  }

  /**
   * Get a specific analysis
   */
  getAnalysis(analysisId: string): FrictionAnalysis | undefined {
    return this.analyses.get(analysisId);
  }
}

export default UXFrictionDetector;
