/**
 * Database Client Instrumentation for Distributed Tracing
 *
 * Wraps Supabase PostgreSQL client to automatically trace:
 * - Query execution with prepared statement details
 * - Query duration and performance metrics
 * - Row counts (selected, affected, inserted)
 * - Connection pool status
 * - Query errors and exceptions
 * - Database latency histograms
 *
 * Integrates with:
 * - Trace context propagation (workspaceId, userId)
 * - Span instrumentation for database operations
 * - Performance monitoring with percentile tracking
 *
 * @module lib/tracing/database-client
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getTraceContext,
  addBaggage,
} from './trace-context';
import {
  instrumentDatabaseQuery,
  recordDatabaseResult,
} from './instrumentation-utilities';

/**
 * Configuration for database client instrumentation
 */
export interface DatabaseClientConfig {
  /**
   * Whether to trace query parameters (be careful with sensitive data)
   * Default: false
   */
  traceParams?: boolean;

  /**
   * Whether to trace query results (sensitive data in responses)
   * Default: false
   */
  traceResults?: boolean;

  /**
   * Enable query normalization (removes specific values for aggregation)
   * Default: true
   */
  normalizeQueries?: boolean;

  /**
   * Maximum query text length to store
   * Default: 500 characters
   */
  maxQueryLength?: number;

  /**
   * Maximum number of query samples to keep in memory
   * Default: 1000
   */
  maxSampleSize?: number;

  /**
   * Percentiles to track for latency histograms
   * Default: [50, 75, 90, 95, 99]
   */
  percentiles?: number[];
}

/**
 * Default database instrumentation configuration
 */
const DEFAULT_CONFIG: Required<DatabaseClientConfig> = {
  traceParams: false,
  traceResults: false,
  normalizeQueries: true,
  maxQueryLength: 500,
  maxSampleSize: 1000,
  percentiles: [50, 75, 90, 95, 99],
};

/**
 * Database operation types
 */
export type DatabaseOperationType =
  | 'select'
  | 'insert'
  | 'update'
  | 'delete'
  | 'upsert'
  | 'rpc'
  | 'auth'
  | 'other';

/**
 * Detect operation type from Supabase method
 */
function detectOperationType(method: string): DatabaseOperationType {
  const lowerMethod = method.toLowerCase();

  if (lowerMethod.includes('select')) {
    return 'select';
  }
  if (lowerMethod.includes('insert')) {
    return 'insert';
  }
  if (lowerMethod.includes('update')) {
    return 'update';
  }
  if (lowerMethod.includes('delete')) {
    return 'delete';
  }
  if (lowerMethod.includes('upsert')) {
    return 'upsert';
  }
  if (lowerMethod.includes('rpc')) {
    return 'rpc';
  }
  if (lowerMethod.includes('auth')) {
    return 'auth';
  }

  return 'other';
}

/**
 * Normalize query for aggregation (remove specific values)
 */
function normalizeQuery(query: string, config: Required<DatabaseClientConfig>): string {
  if (!config.normalizeQueries) {
    return query.substring(0, config.maxQueryLength);
  }

  // Remove quoted string literals for aggregation
  let normalized = query.replace(/'[^']*'/g, "'?'");
  // Remove numeric literals
  normalized = normalized.replace(/\b\d+\b/g, '?');
  // Remove UUIDs
  normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '?');

  return normalized.substring(0, config.maxQueryLength);
}

/**
 * Latency histogram for tracking query performance
 */
class LatencyHistogram {
  private samples: number[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  record(latency: number): void {
    this.samples.push(latency);
    // Keep memory bounded
    if (this.samples.length > this.maxSize) {
      this.samples = this.samples.slice(this.samples.length - this.maxSize);
    }
  }

  percentile(p: number): number {
    if (this.samples.length === 0) {
return 0;
}

    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  mean(): number {
    if (this.samples.length === 0) {
return 0;
}
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }

  stdDev(): number {
    if (this.samples.length <= 1) {
return 0;
}
    const mean = this.mean();
    const squaredDiffs = this.samples.map((s) => Math.pow(s - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (this.samples.length - 1);
    return Math.sqrt(variance);
  }

  count(): number {
    return this.samples.length;
  }

  reset(): void {
    this.samples = [];
  }
}

/**
 * Database client instrumentation manager
 */
class DatabaseClientInstrumenter {
  private config: Required<DatabaseClientConfig>;
  private histograms: Map<string, LatencyHistogram> = new Map();
  private operationCounts: Map<DatabaseOperationType, number> = new Map();
  private errorCounts: Map<string, number> = new Map();

  constructor(config: DatabaseClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize operation counters
    const operationTypes: DatabaseOperationType[] = [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'rpc',
      'auth',
      'other',
    ];
    for (const opType of operationTypes) {
      this.operationCounts.set(opType, 0);
    }
  }

  /**
   * Instrument a database query and return wrapped function
   * QUALITY GATE 1: Must not modify query behavior
   * QUALITY GATE 2: Must always record latency metrics
   */
  wrapQuery<T>(
    table: string,
    method: string,
    queryFn: () => Promise<{ data: T; error: any }>
  ): Promise<{ data: T; error: any }> {
    const operationType = detectOperationType(method);
    const startTime = Date.now();

    // Get current trace context
    const context = getTraceContext();
    const queryNormalized = normalizeQuery(method, this.config);

    // Create database span
    const span = instrumentDatabaseQuery(
      table,
      operationType,
      queryNormalized
    );

    // Add baggage for downstream operations
    if (context?.workspaceId) {
      addBaggage('db.workspace_id', context.workspaceId);
    }
    if (context?.userId) {
      addBaggage('db.user_id', context.userId);
    }

    return queryFn()
      .then((result) => {
        const latency = Date.now() - startTime;

        // Record result (row counts, status)
        const rowCount = Array.isArray(result.data)
          ? result.data.length
          : result.data
            ? 1
            : 0;

        recordDatabaseResult(
          span,
          rowCount, // rowsAffected
          rowCount, // resultCount
          result.error instanceof Error ? result.error : undefined
        );

        // Update metrics
        this.recordMetrics(operationType, latency, queryNormalized, !result.error);

        return result;
      })
      .catch((error) => {
        const latency = Date.now() - startTime;

        // Record error
        recordDatabaseResult(
          span,
          0, // rowsAffected
          0, // resultCount
          error instanceof Error ? error : new Error(String(error))
        );

        // Update metrics
        this.recordMetrics(operationType, latency, queryNormalized, false);
        this.recordError(error);

        // Re-throw to maintain original error handling
        throw error;
      });
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(
    operationType: DatabaseOperationType,
    latency: number,
    query: string,
    success: boolean
  ): void {
    // Update operation counters
    const currentCount = this.operationCounts.get(operationType) || 0;
    this.operationCounts.set(operationType, currentCount + 1);

    // Record latency histogram
    const histogramKey = `${operationType}:${query}`;
    let histogram = this.histograms.get(histogramKey);
    if (!histogram) {
      histogram = new LatencyHistogram(this.config.maxSampleSize);
      this.histograms.set(histogramKey, histogram);
    }
    histogram.record(latency);

    // If not successful, count error
    if (!success) {
      const errorKey = `${operationType}:${query}`;
      const errorCount = this.errorCounts.get(errorKey) || 0;
      this.errorCounts.set(errorKey, errorCount + 1);
    }
  }

  /**
   * Record error occurrence
   */
  private recordError(error: any): void {
    const errorType = error instanceof Error ? error.name : 'Unknown';
    const errorKey = `${errorType}:${error.message || 'unknown'}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);
  }

  /**
   * Get database metrics snapshot
   * Returns current performance statistics
   */
  getMetrics() {
    const queryMetrics: Record<
      string,
      {
        count: number;
        mean: number;
        stdDev: number;
        percentiles: Record<number, number>;
      }
    > = {};

    for (const [queryKey, histogram] of this.histograms.entries()) {
      const percentiles: Record<number, number> = {};
      for (const p of this.config.percentiles) {
        percentiles[p] = histogram.percentile(p);
      }

      queryMetrics[queryKey] = {
        count: histogram.count(),
        mean: histogram.mean(),
        stdDev: histogram.stdDev(),
        percentiles,
      };
    }

    return {
      operationCounts: Object.fromEntries(this.operationCounts),
      errorCounts: Object.fromEntries(this.errorCounts),
      queryMetrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Health check for database instrumentation
   */
  getHealth() {
    const totalOperations = Array.from(this.operationCounts.values()).reduce(
      (a, b) => a + b,
      0
    );
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);

    const errorRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;

    return {
      active: totalOperations > 0,
      totalOperations,
      totalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      querySamples: this.histograms.size,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.histograms.clear();
    this.operationCounts.forEach((_, key) => this.operationCounts.set(key, 0));
    this.errorCounts.clear();
  }
}

/**
 * Global database instrumentation instance
 */
let instrumenter: DatabaseClientInstrumenter | null = null;

/**
 * Initialize database client instrumentation
 *
 * QUALITY GATE 3: Singleton pattern ensures single instrumenter instance
 */
export function initializeDatabaseInstrumentation(
  config?: DatabaseClientConfig
): DatabaseClientInstrumenter {
  if (!instrumenter) {
    instrumenter = new DatabaseClientInstrumenter(config);
  }
  return instrumenter;
}

/**
 * Get database instrumentation instance
 * Returns initialized instrumenter or creates default instance
 */
export function getDatabaseInstrumenter(): DatabaseClientInstrumenter {
  if (!instrumenter) {
    instrumenter = new DatabaseClientInstrumenter();
  }
  return instrumenter;
}

/**
 * Wrap Supabase client to add automatic query instrumentation
 *
 * Usage:
 * ```typescript
 * const supabase = createClient(URL, KEY);
 * const instrumentedClient = wrapSupabaseClient(supabase);
 * // All queries now automatically traced
 * ```
 *
 * QUALITY GATE 4: Must preserve all Supabase client functionality
 * QUALITY GATE 5: Must handle all query types (select, insert, update, delete, rpc)
 */
export function wrapSupabaseClient<T extends SupabaseClient>(
  client: T,
  config?: DatabaseClientConfig
): T {
  const inst = initializeDatabaseInstrumentation(config);

  // Create proxy for the from() method to instrument all queries
  const originalFrom = client.from.bind(client);

  client.from = function (table: string) {
    const queryBuilder = originalFrom(table);
    const wrappedBuilder = new Proxy(queryBuilder, {
      get(target: any, prop: string) {
        const value = target[prop];

        // Wrap query execution methods
        if (
          typeof value === 'function' &&
          ['select', 'insert', 'update', 'delete', 'upsert'].includes(prop)
        ) {
          return function (...args: any[]) {
            const queryBuilderWithMethod = value.apply(target, args);

            // Wrap the final execution methods (then, catch, finally)
            return new Proxy(queryBuilderWithMethod, {
              get(innerTarget: any, innerProp: string) {
                const innerValue = innerTarget[innerProp];

                if (innerProp === 'then') {
                  return function (onFulfilled?: any, onRejected?: any) {
                    const promise = innerValue.call(innerTarget);

                    // Wrap the promise
                    return inst
                      .wrapQuery(table, prop, () => promise)
                      .then(onFulfilled, onRejected);
                  };
                }

                return innerValue;
              },
            });
          };
        }

        return value;
      },
    }) as any;

    return wrappedBuilder;
  } as any;

  return client;
}

/**
 * Get current database metrics
 */
export function getDatabaseMetrics() {
  return getDatabaseInstrumenter().getMetrics();
}

/**
 * Get database health status
 */
export function getDatabaseHealth() {
  return getDatabaseInstrumenter().getHealth();
}

/**
 * Reset database metrics
 */
export function resetDatabaseMetrics(): void {
  getDatabaseInstrumenter().reset();
}
