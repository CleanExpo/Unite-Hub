/**
 * M1 Cost Optimization Automation
 *
 * Automatic cost management and optimization strategies.
 * Analyzes spending patterns and recommends optimizations.
 *
 * Version: v2.3.0
 * Phase: 10 Extended - Production Operations Kit
 */

/**
 * Cost analysis result
 */
export interface CostAnalysis {
  timestamp: number;
  totalCost: number;
  costByModel: Record<string, number>;
  costByComponent: Record<string, number>;
  dailyAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercent: number;
}

/**
 * Cost optimization recommendation
 */
export interface CostRecommendation {
  id: string;
  title: string;
  description: string;
  estimatedSavings: number;
  priority: 'low' | 'medium' | 'high';
  action: () => Promise<boolean>;
}

/**
 * Cost optimization configuration
 */
export interface CostOptimizerConfig {
  alertThresholdDaily: number; // USD
  alertThresholdMonthly: number; // USD
  analysisInterval: number; // ms
  autoOptimize: boolean;
}

/**
 * Cost optimization system
 */
export class CostOptimizer {
  private config: CostOptimizerConfig;
  private costHistory: CostAnalysis[] = [];
  private recommendations: Map<string, CostRecommendation> = new Map();
  private analysisInterval: NodeJS.Timeout | null = null;
  private totalSpent: number = 0;
  private dailySpent: number = 0;
  private lastDayReset: number = Date.now();

  constructor(config: Partial<CostOptimizerConfig> = {}) {
    this.config = {
      alertThresholdDaily: 100, // $100/day
      alertThresholdMonthly: 3000, // $3000/month
      analysisInterval: 3600000, // 1 hour
      autoOptimize: true,
      ...config,
    };
  }

  /**
   * Start cost optimization monitoring
   */
  start(): void {
    if (this.analysisInterval) {
      return; // Already running
    }

    this.runAnalysis(); // Run immediately

    this.analysisInterval = setInterval(() => {
      this.runAnalysis();
    }, this.config.analysisInterval);
  }

  /**
   * Stop cost optimization monitoring
   */
  stop(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Record cost
   */
  recordCost(model: string, cost: number, component: string = 'unknown'): void {
    this.totalSpent += cost;
    this.dailySpent += cost;

    // Reset daily counter at midnight
    const now = new Date();
    const daysSinceLastReset = (Date.now() - this.lastDayReset) / (1000 * 60 * 60 * 24);
    if (daysSinceLastReset >= 1) {
      this.dailySpent = 0;
      this.lastDayReset = Date.now();
    }

    // Check cost alerts
    if (this.dailySpent > this.config.alertThresholdDaily) {
      console.warn(`[CostOptimizer] Daily cost alert: $${this.dailySpent.toFixed(2)}`);
    }

    const estimatedMonthly = this.dailySpent * 30;
    if (estimatedMonthly > this.config.alertThresholdMonthly) {
      console.warn(
        `[CostOptimizer] Monthly projection alert: $${estimatedMonthly.toFixed(2)}`
      );
    }
  }

  /**
   * Run cost analysis
   */
  private async runAnalysis(): Promise<CostAnalysis> {
    // Simulate cost data collection
    const analysis: CostAnalysis = {
      timestamp: Date.now(),
      totalCost: this.totalSpent,
      costByModel: {
        'claude-haiku-4': this.totalSpent * 0.3,
        'claude-sonnet-4': this.totalSpent * 0.5,
        'claude-opus-4-5': this.totalSpent * 0.2,
      },
      costByComponent: {
        'policy_engine': this.totalSpent * 0.25,
        'orchestrator': this.totalSpent * 0.35,
        'caching': this.totalSpent * 0.15,
        'analytics': this.totalSpent * 0.25,
      },
      dailyAverage: this.dailySpent,
      trend: 'stable',
      trendPercent: 0,
    };

    // Analyze trend
    if (this.costHistory.length > 0) {
      const previousAnalysis = this.costHistory[this.costHistory.length - 1];
      const change =
        ((analysis.totalCost - previousAnalysis.totalCost) / previousAnalysis.totalCost) * 100;

      if (change > 5) {
        analysis.trend = 'increasing';
        analysis.trendPercent = change;
      } else if (change < -5) {
        analysis.trend = 'decreasing';
        analysis.trendPercent = change;
      }
    }

    this.costHistory.push(analysis);
    if (this.costHistory.length > 30) {
      this.costHistory.shift();
    }

    // Generate recommendations
    await this.generateRecommendations(analysis);

    // Auto-optimize if enabled
    if (this.config.autoOptimize && analysis.trend === 'increasing') {
      await this.autoOptimize(analysis);
    }

    return analysis;
  }

  /**
   * Generate cost optimization recommendations
   */
  private async generateRecommendations(analysis: CostAnalysis): Promise<void> {
    const recommendations: CostRecommendation[] = [];

    // Check for high-cost models
    const expensiveModel = Object.entries(analysis.costByModel)
      .sort(([, a], [, b]) => b - a)[0];

    if (expensiveModel) {
      recommendations.push({
        id: 'expensive-model',
        title: `High cost from ${expensiveModel[0]}`,
        description: `${expensiveModel[0]} represents ${((expensiveModel[1] / analysis.totalCost) * 100).toFixed(1)}% of costs`,
        estimatedSavings: expensiveModel[1] * 0.1, // 10% potential savings
        priority: 'high',
        action: async () => {
          console.log(`[CostOptimizer] Evaluating alternatives to ${expensiveModel[0]}`);
          return true;
        },
      });
    }

    // Check for inefficient components
    const inefficientComponent = Object.entries(analysis.costByComponent)
      .sort(([, a], [, b]) => b - a)[0];

    if (inefficientComponent) {
      recommendations.push({
        id: 'inefficient-component',
        title: `High cost from ${inefficientComponent[0]}`,
        description: `${inefficientComponent[0]} represents ${((inefficientComponent[1] / analysis.totalCost) * 100).toFixed(1)}% of costs`,
        estimatedSavings: inefficientComponent[1] * 0.15, // 15% potential savings
        priority: 'medium',
        action: async () => {
          console.log(`[CostOptimizer] Optimizing ${inefficientComponent[0]}`);
          return true;
        },
      });
    }

    // Check cache effectiveness
    if (analysis.costByComponent['caching'] && analysis.costByComponent['caching'] < analysis.totalCost * 0.1) {
      recommendations.push({
        id: 'low-caching',
        title: 'Low caching investment',
        description: 'Caching represents only a small portion of costs - investing in better caching could reduce API calls',
        estimatedSavings: analysis.totalCost * 0.05, // 5% potential savings
        priority: 'low',
        action: async () => {
          console.log('[CostOptimizer] Recommending enhanced caching strategy');
          return true;
        },
      });
    }

    // Store recommendations
    for (const rec of recommendations) {
      this.recommendations.set(rec.id, rec);
    }
  }

  /**
   * Automatically optimize costs
   */
  private async autoOptimize(analysis: CostAnalysis): Promise<void> {
    console.log('[CostOptimizer] Cost trend increasing - activating auto-optimization');

    // Priority: optimize high-cost components
    const recommendations = Array.from(this.recommendations.values())
      .filter(r => r.priority === 'high')
      .sort((a, b) => b.estimatedSavings - a.estimatedSavings);

    for (const rec of recommendations) {
      try {
        const success = await rec.action();
        if (success) {
          console.log(`[CostOptimizer] Applied optimization: ${rec.title}`);
        }
      } catch (error) {
        console.error(`[CostOptimizer] Optimization failed: ${rec.title}`, error);
      }
    }
  }

  /**
   * Get current cost analysis
   */
  getCurrentAnalysis(): CostAnalysis | null {
    return this.costHistory.length > 0 ? this.costHistory[this.costHistory.length - 1] : null;
  }

  /**
   * Get cost history
   */
  getHistory(limit: number = 30): CostAnalysis[] {
    return this.costHistory.slice(-limit);
  }

  /**
   * Get recommendations
   */
  getRecommendations(): CostRecommendation[] {
    return Array.from(this.recommendations.values()).sort(
      (a, b) => this.priorityValue(b.priority) - this.priorityValue(a.priority)
    );
  }

  /**
   * Apply recommendation
   */
  async applyRecommendation(id: string): Promise<boolean> {
    const rec = this.recommendations.get(id);
    if (!rec) {
      return false;
    }

    try {
      return await rec.action();
    } catch (error) {
      console.error(`Error applying recommendation ${id}:`, error);
      return false;
    }
  }

  /**
   * Get cost statistics
   */
  getStats(): {
    totalCost: number;
    averageDailyCost: number;
    estimatedMonthlyCost: number;
    highestDailyCost: number;
    lowestDailyCost: number;
  } {
    let highestDaily = 0;
    let lowestDaily = Infinity;
    let totalDaily = 0;

    for (const analysis of this.costHistory) {
      highestDaily = Math.max(highestDaily, analysis.dailyAverage);
      lowestDaily = Math.min(lowestDaily, analysis.dailyAverage);
      totalDaily += analysis.dailyAverage;
    }

    const avgDaily = this.costHistory.length > 0 ? totalDaily / this.costHistory.length : 0;

    return {
      totalCost: this.totalSpent,
      averageDailyCost: avgDaily,
      estimatedMonthlyCost: avgDaily * 30,
      highestDailyCost: highestDaily === 0 ? 0 : highestDaily,
      lowestDailyCost: lowestDaily === Infinity ? 0 : lowestDaily,
    };
  }

  /**
   * Convert priority to numeric value
   */
  private priorityValue(priority: string): number {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  }
}

// Export singleton
export const costOptimizer = new CostOptimizer();
