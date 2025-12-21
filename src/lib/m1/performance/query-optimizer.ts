/**
 * M1 Query Optimizer
 *
 * Query execution plan analysis, index recommendation engine,
 * and optimization suggestions
 *
 * Version: v1.0.0
 * Phase: 22 - Advanced Caching & Performance Optimization
 */

import { v4 as generateUUID } from 'uuid';

/**
 * Query execution plan
 */
export interface QueryPlan {
  planId: string;
  query: string;
  estimatedCost: number; // Relative cost units
  estimatedRows: number;
  executionTime?: number; // Actual time if executed
  steps: QueryStep[];
}

/**
 * Query execution step
 */
export interface QueryStep {
  stepId: string;
  operator: string; // 'scan', 'filter', 'join', 'sort', 'aggregate'
  table?: string;
  condition?: string;
  indexUsed?: string;
  estimatedRows: number;
  estimatedCost: number;
}

/**
 * Index recommendation
 */
export interface IndexRecommendation {
  id: string;
  table: string;
  columns: string[];
  type: 'single' | 'composite' | 'fulltext';
  estimatedImprovementPercent: number;
  impactedQueries: string[];
  reason: string;
}

/**
 * Query optimization suggestion
 */
export interface OptimizationSuggestion {
  id: string;
  queryId: string;
  category: 'index' | 'join' | 'cache' | 'statistics' | 'rewrite';
  priority: 'low' | 'medium' | 'high';
  description: string;
  estimatedImprovement: number; // percentage
  implementation: string;
}

/**
 * Query statistics
 */
export interface QueryStatistics {
  queryHash: string;
  query: string;
  executionCount: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  lastExecutedAt: number;
}

/**
 * Query optimizer
 */
export class QueryOptimizer {
  private queryPlans: Map<string, QueryPlan> = new Map();
  private queryStatistics: Map<string, QueryStatistics> = new Map();
  private indexRecommendations: Map<string, IndexRecommendation> = new Map();
  private tableStatistics: Map<string, { rowCount: number; columnStats: Record<string, unknown> }> = new Map();

  /**
   * Analyze query plan
   */
  analyzeQuery(query: string): QueryPlan {
    const planId = `plan_${generateUUID()}`;

    // Simplified query plan analysis
    const plan: QueryPlan = {
      planId,
      query,
      estimatedCost: this.estimateQueryCost(query),
      estimatedRows: this.estimateRowsReturned(query),
      steps: this.generateExecutionSteps(query),
    };

    this.queryPlans.set(planId, plan);
    return plan;
  }

  /**
   * Estimate query cost (simplified heuristic)
   */
  private estimateQueryCost(query: string): number {
    const upperQuery = query.toUpperCase();
    let cost = 1;

    // Base cost increase for operations
    if (upperQuery.includes('JOIN')) {
      cost *= 3; // Joins are expensive
    }
    if (upperQuery.includes('GROUP BY')) {
      cost *= 2; // Aggregations cost
    }
    if (upperQuery.includes('ORDER BY')) {
      cost *= 1.5; // Sorting cost
    }
    if (upperQuery.includes('HAVING')) {
      cost *= 1.5; // Filter cost
    }
    if (upperQuery.includes('UNION')) {
      cost *= 2;
    }

    // Subqueries increase cost
    const subqueryCount = (query.match(/\(SELECT/gi) || []).length;
    cost *= Math.pow(1.5, subqueryCount);

    return Math.round(cost * 100) / 100;
  }

  /**
   * Estimate rows returned (simplified)
   */
  private estimateRowsReturned(query: string): number {
    const upperQuery = query.toUpperCase();

    // Very simplified estimation
    if (upperQuery.includes('SELECT *')) {
      return 1000; // Assume full table scan
    }

    if (upperQuery.includes('LIMIT')) {
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        return parseInt(limitMatch[1]);
      }
    }

    return 100; // Default estimate
  }

  /**
   * Generate execution steps for query
   */
  private generateExecutionSteps(query: string): QueryStep[] {
    const steps: QueryStep[] = [];
    const upperQuery = query.toUpperCase();

    // Extract table name (simplified)
    const tableMatch = query.match(/FROM\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : 'unknown';

    // Step 1: Table scan
    steps.push({
      stepId: `step_${generateUUID()}`,
      operator: 'scan',
      table,
      estimatedRows: 1000,
      estimatedCost: 10,
    });

    // Step 2: Filtering
    if (upperQuery.includes('WHERE')) {
      steps.push({
        stepId: `step_${generateUUID()}`,
        operator: 'filter',
        table,
        estimatedRows: 100,
        estimatedCost: 5,
      });
    }

    // Step 3: Joining
    if (upperQuery.includes('JOIN')) {
      steps.push({
        stepId: `step_${generateUUID()}`,
        operator: 'join',
        estimatedRows: 50,
        estimatedCost: 20,
      });
    }

    // Step 4: Sorting
    if (upperQuery.includes('ORDER BY')) {
      steps.push({
        stepId: `step_${generateUUID()}`,
        operator: 'sort',
        estimatedRows: 50,
        estimatedCost: 15,
      });
    }

    // Step 5: Aggregation
    if (upperQuery.includes('GROUP BY')) {
      steps.push({
        stepId: `step_${generateUUID()}`,
        operator: 'aggregate',
        estimatedRows: 10,
        estimatedCost: 12,
      });
    }

    return steps;
  }

  /**
   * Record query execution
   */
  recordQueryExecution(query: string, executionTimeMs: number): void {
    const queryHash = Buffer.from(query).toString('base64');

    if (!this.queryStatistics.has(queryHash)) {
      this.queryStatistics.set(queryHash, {
        queryHash,
        query,
        executionCount: 0,
        totalTimeMs: 0,
        avgTimeMs: 0,
        minTimeMs: Infinity,
        maxTimeMs: 0,
        lastExecutedAt: Date.now(),
      });
    }

    const stats = this.queryStatistics.get(queryHash)!;
    stats.executionCount++;
    stats.totalTimeMs += executionTimeMs;
    stats.avgTimeMs = stats.totalTimeMs / stats.executionCount;
    stats.minTimeMs = Math.min(stats.minTimeMs, executionTimeMs);
    stats.maxTimeMs = Math.max(stats.maxTimeMs, executionTimeMs);
    stats.lastExecutedAt = Date.now();
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations(query: string): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];

    // Simplified recommendation logic
    const upperQuery = query.toUpperCase();

    // Recommendation 1: Index for WHERE conditions
    if (upperQuery.includes('WHERE')) {
      const whereMatch = query.match(/WHERE\s+(\w+)\s*=/i);
      if (whereMatch) {
        const column = whereMatch[1];

        recommendations.push({
          id: `idx_rec_${generateUUID()}`,
          table: 'main_table', // Placeholder
          columns: [column],
          type: 'single',
          estimatedImprovementPercent: 30,
          impactedQueries: [query],
          reason: `Frequent filtering on ${column} column`,
        });
      }
    }

    // Recommendation 2: Composite index for JOIN
    if (upperQuery.includes('JOIN')) {
      recommendations.push({
        id: `idx_rec_${generateUUID()}`,
        table: 'main_table',
        columns: ['id', 'foreign_key'],
        type: 'composite',
        estimatedImprovementPercent: 40,
        impactedQueries: [query],
        reason: 'JOIN operations benefit from composite indexes',
      });
    }

    // Recommendation 3: Index for ORDER BY
    if (upperQuery.includes('ORDER BY')) {
      const orderMatch = query.match(/ORDER\s+BY\s+(\w+)/i);
      if (orderMatch) {
        const column = orderMatch[1];

        recommendations.push({
          id: `idx_rec_${generateUUID()}`,
          table: 'main_table',
          columns: [column],
          type: 'single',
          estimatedImprovementPercent: 25,
          impactedQueries: [query],
          reason: `Sorting on ${column} can be optimized with index`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(query: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const plan = this.analyzeQuery(query);
    const queryId = plan.planId;

    // Suggestion 1: High-cost query
    if (plan.estimatedCost > 10) {
      suggestions.push({
        id: `sug_${generateUUID()}`,
        queryId,
        category: 'cache',
        priority: 'high',
        description: 'Query has high estimated cost; consider caching results',
        estimatedImprovement: 50,
        implementation: 'Add query result caching with TTL',
      });
    }

    // Suggestion 2: Multiple JOINs
    const joinCount = (query.match(/JOIN/gi) || []).length;
    if (joinCount > 2) {
      suggestions.push({
        id: `sug_${generateUUID()}`,
        queryId,
        category: 'rewrite',
        priority: 'high',
        description: `Query has ${joinCount} JOINs; consider denormalization`,
        estimatedImprovement: 40,
        implementation: 'Evaluate denormalization or materialized views',
      });
    }

    // Suggestion 3: No index hints
    const indexRecommendations = this.getIndexRecommendations(query);
    if (indexRecommendations.length > 0) {
      suggestions.push({
        id: `sug_${generateUUID()}`,
        queryId,
        category: 'index',
        priority: 'medium',
        description: `${indexRecommendations.length} index recommendations available`,
        estimatedImprovement: 30,
        implementation: `Create recommended indexes: ${indexRecommendations.map((r) => r.columns.join(',')).join('; ')}`,
      });
    }

    // Suggestion 4: Sort without index
    if (query.toUpperCase().includes('ORDER BY')) {
      suggestions.push({
        id: `sug_${generateUUID()}`,
        queryId,
        category: 'index',
        priority: 'medium',
        description: 'ORDER BY clause could benefit from index',
        estimatedImprovement: 25,
        implementation: 'Create index on ORDER BY columns',
      });
    }

    return suggestions;
  }

  /**
   * Get query statistics
   */
  getQueryStatistics(query: string): QueryStatistics | null {
    const queryHash = Buffer.from(query).toString('base64');
    return this.queryStatistics.get(queryHash) || null;
  }

  /**
   * Get all query statistics
   */
  getAllQueryStatistics(): QueryStatistics[] {
    return Array.from(this.queryStatistics.values());
  }

  /**
   * Get slow queries
   */
  getSlowQueries(thresholdMs: number = 100): QueryStatistics[] {
    return this.getAllQueryStatistics().filter((stat) => stat.avgTimeMs > thresholdMs);
  }

  /**
   * Compare execution plans
   */
  compareExecutionPlans(query1: string, query2: string): {
    plan1: QueryPlan;
    plan2: QueryPlan;
    costDifference: number;
    recommendation: string;
  } {
    const plan1 = this.analyzeQuery(query1);
    const plan2 = this.analyzeQuery(query2);

    const costDifference = plan1.estimatedCost - plan2.estimatedCost;
    const recommendation =
      costDifference > 0
        ? `Query 2 is ${Math.round((costDifference / plan1.estimatedCost) * 100)}% more efficient`
        : `Query 1 is ${Math.round((Math.abs(costDifference) / plan2.estimatedCost) * 100)}% more efficient`;

    return {
      plan1,
      plan2,
      costDifference,
      recommendation,
    };
  }

  /**
   * Get top queries by execution time
   */
  getTopQueriesByTime(limit: number = 10): QueryStatistics[] {
    return this.getAllQueryStatistics()
      .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
      .slice(0, limit);
  }

  /**
   * Get top queries by execution count
   */
  getTopQueriesByCount(limit: number = 10): QueryStatistics[] {
    return this.getAllQueryStatistics()
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, limit);
  }

  /**
   * Generate optimization report
   */
  generateReport(): {
    timestamp: number;
    totalQueries: number;
    slowQueries: QueryStatistics[];
    topQueriesByTime: QueryStatistics[];
    topQueriesByCount: QueryStatistics[];
    averageQueryTime: number;
  } {
    const allStats = this.getAllQueryStatistics();
    const totalTime = allStats.reduce((sum, s) => sum + s.totalTimeMs, 0);
    const avgTime = allStats.length > 0 ? totalTime / allStats.length : 0;

    return {
      timestamp: Date.now(),
      totalQueries: allStats.length,
      slowQueries: this.getSlowQueries(100),
      topQueriesByTime: this.getTopQueriesByTime(5),
      topQueriesByCount: this.getTopQueriesByCount(5),
      averageQueryTime: Math.round(avgTime * 100) / 100,
    };
  }

  /**
   * Clear statistics
   */
  clear(): void {
    this.queryPlans.clear();
    this.queryStatistics.clear();
    this.indexRecommendations.clear();
    this.tableStatistics.clear();
  }
}

// Export singleton
export const queryOptimizer = new QueryOptimizer();
