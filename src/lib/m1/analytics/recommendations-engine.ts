/**
 * M1 Prescriptive Recommendations Engine
 *
 * AI-powered recommendations for optimization and improvements
 *
 * Version: v2.4.1
 * Phase: 11B - Advanced Analytics & ML
 */

export type RecommendationType =
  | 'performance'
  | 'cost'
  | 'reliability'
  | 'security'
  | 'scalability'
  | 'efficiency';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  impact: {
    performance: number; // 0-100
    cost: number; // 0-100 (positive = savings)
    reliability: number; // 0-100
  };
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedBenefit: string;
  confidence: number; // 0-1
  createdAt: number;
}

export interface RecommendationContext {
  metric: string;
  currentValue: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  historicalData: number[];
}

/**
 * Prescriptive Recommendations Engine
 */
export class RecommendationsEngine {
  private recommendations: Map<string, Recommendation> = new Map();
  private dismissedRecommendations: Set<string> = new Set();
  private appliedRecommendations: Set<string> = new Set();
  private recommendationCounter: number = 0;

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(contexts: RecommendationContext[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const context of contexts) {
      const newRecs = this.analyzeMetric(context);
      recommendations.push(...newRecs);
    }

    // Store recommendations
    for (const rec of recommendations) {
      this.recommendations.set(rec.id, rec);
    }

    return recommendations;
  }

  /**
   * Analyze metric and generate recommendations
   */
  private analyzeMetric(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // High value detection
    if (context.currentValue > context.threshold * 1.5 && context.trend === 'increasing') {
      recommendations.push(
        this.createRecommendation({
          type: 'performance',
          title: `Optimize ${context.metric} - High Values Detected`,
          description: `${context.metric} is 50%+ above threshold and increasing`,
          priority: 'high',
          actionItems: [
            `Review ${context.metric} configuration`,
            'Enable caching for frequently accessed data',
            'Consider horizontal scaling',
            'Analyze performance bottlenecks',
          ],
          estimatedEffort: 'medium',
          estimatedBenefit: 'Reduce latency by 30-50%',
          impact: {
            performance: 80,
            cost: 20,
            reliability: 30,
          },
          confidence: 0.92,
        })
      );
    }

    // Cost optimization
    if (context.metric.includes('cost') && context.currentValue > context.threshold) {
      recommendations.push(
        this.createRecommendation({
          type: 'cost',
          title: 'Cost Optimization Opportunity',
          description: `Current costs exceed budget by ${(((context.currentValue - context.threshold) / context.threshold) * 100).toFixed(0)}%`,
          priority: 'high',
          actionItems: [
            'Review service tier allocations',
            'Implement reserved instances',
            'Optimize database queries',
            'Reduce data transfer',
          ],
          estimatedEffort: 'medium',
          estimatedBenefit: 'Reduce costs by 20-40%',
          impact: {
            performance: 10,
            cost: 85,
            reliability: 20,
          },
          confidence: 0.88,
        })
      );
    }

    // Reliability improvements
    if (context.trend === 'increasing' && context.currentValue > context.threshold) {
      recommendations.push(
        this.createRecommendation({
          type: 'reliability',
          title: `Improve Reliability - ${context.metric} Growing`,
          description: `${context.metric} is increasing above normal thresholds`,
          priority: 'medium',
          actionItems: [
            'Add monitoring and alerting',
            'Implement circuit breakers',
            'Add retry logic',
            'Increase timeout values',
          ],
          estimatedEffort: 'low',
          estimatedBenefit: 'Improve SLO compliance by 2-5%',
          impact: {
            performance: 20,
            cost: 5,
            reliability: 75,
          },
          confidence: 0.85,
        })
      );
    }

    // Scaling recommendations
    if (context.currentValue > context.threshold * 2) {
      recommendations.push(
        this.createRecommendation({
          type: 'scalability',
          title: 'Immediate Scaling Required',
          description: `${context.metric} is 2x above critical threshold`,
          priority: 'critical',
          actionItems: [
            'Trigger horizontal scaling immediately',
            'Increase load balancer capacity',
            'Review auto-scaling policies',
            'Monitor resource utilization',
          ],
          estimatedEffort: 'high',
          estimatedBenefit: 'Prevent service degradation',
          impact: {
            performance: 95,
            cost: 30,
            reliability: 90,
          },
          confidence: 0.97,
        })
      );
    }

    return recommendations;
  }

  /**
   * Create recommendation
   */
  private createRecommendation(data: Partial<Recommendation>): Recommendation {
    const id = `rec_${++this.recommendationCounter}_${Date.now()}`;

    const recommendation: Recommendation = {
      id,
      type: data.type || 'performance',
      title: data.title || 'Recommendation',
      description: data.description || '',
      priority: data.priority || 'medium',
      impact: data.impact || { performance: 50, cost: 50, reliability: 50 },
      actionItems: data.actionItems || [],
      estimatedEffort: data.estimatedEffort || 'medium',
      estimatedBenefit: data.estimatedBenefit || 'TBD',
      confidence: data.confidence || 0.8,
      createdAt: Date.now(),
    };

    return recommendation;
  }

  /**
   * Get active recommendations
   */
  getActiveRecommendations(): Recommendation[] {
    return Array.from(this.recommendations.values()).filter(
      r => !this.dismissedRecommendations.has(r.id) && !this.appliedRecommendations.has(r.id)
    );
  }

  /**
   * Get recommendations by priority
   */
  getByPriority(priority: RecommendationPriority): Recommendation[] {
    return this.getActiveRecommendations().filter(r => r.priority === priority);
  }

  /**
   * Get recommendations by type
   */
  getByType(type: RecommendationType): Recommendation[] {
    return this.getActiveRecommendations().filter(r => r.type === type);
  }

  /**
   * Dismiss recommendation
   */
  dismissRecommendation(id: string): boolean {
    if (this.recommendations.has(id)) {
      this.dismissedRecommendations.add(id);
      return true;
    }
    return false;
  }

  /**
   * Apply recommendation
   */
  applyRecommendation(id: string): boolean {
    if (this.recommendations.has(id)) {
      this.appliedRecommendations.add(id);
      this.dismissedRecommendations.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get recommendation details
   */
  getRecommendation(id: string): Recommendation | null {
    return this.recommendations.get(id) || null;
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    active: number;
    dismissed: number;
    applied: number;
    byPriority: Record<RecommendationPriority, number>;
    byType: Record<RecommendationType, number>;
    averageConfidence: number;
  } {
    const active = this.getActiveRecommendations();
    const allRecs = Array.from(this.recommendations.values());

    const byPriority: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byType: Record<RecommendationType, number> = {
      performance: 0,
      cost: 0,
      reliability: 0,
      security: 0,
      scalability: 0,
      efficiency: 0,
    };

    for (const rec of active) {
      byPriority[rec.priority]++;
      byType[rec.type]++;
    }

    const avgConfidence = allRecs.length > 0 ? allRecs.reduce((sum, r) => sum + r.confidence, 0) / allRecs.length : 0;

    return {
      total: allRecs.length,
      active: active.length,
      dismissed: this.dismissedRecommendations.size,
      applied: this.appliedRecommendations.size,
      byPriority,
      byType,
      averageConfidence: avgConfidence,
    };
  }

  /**
   * Clear old recommendations
   */
  clearOldRecommendations(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [id, rec] of this.recommendations) {
      if (rec.createdAt < cutoff) {
        this.recommendations.delete(id);
        this.dismissedRecommendations.delete(id);
        this.appliedRecommendations.delete(id);
        cleared++;
      }
    }

    return cleared;
  }
}

// Export singleton
export const recommendationsEngine = new RecommendationsEngine();
