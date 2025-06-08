/**
 * Database Query Optimizer
 * 
 * This module provides tools to optimize database queries for high volume performance.
 * It includes query analysis, indexing recommendations, and performance metrics.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getCache } from '@/lib/cache';

/**
 * Query execution information
 */
export interface QueryInfo {
  query: string;
  params?: any[];
  duration: number;
  rowCount: number;
  timestamp: number;
  tableName: string;
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
  source: string;
}

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalQueries: number;
  totalRows: number;
  slowQueries: QueryInfo[];
}

/**
 * Index recommendation
 */
export interface IndexRecommendation {
  table: string;
  columns: string[];
  impact: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Query Optimizer Configuration
 */
export interface QueryOptimizerConfig {
  /**
   * Maximum number of query logs to keep
   * @default 1000
   */
  maxQueryLogs?: number;
  
  /**
   * Threshold for slow queries in milliseconds
   * @default 500
   */
  slowQueryThreshold?: number;
  
  /**
   * Supabase client instance
   * If not provided, the default client will be used
   */
  supabaseClient?: SupabaseClient;
}

// Cache keys for query metrics
const CACHE_KEYS = {
  QUERY_LOGS: 'db:query-logs',
  QUERY_METRICS: 'db:query-metrics',
  TABLE_METRICS: (table: string) => `db:table-metrics:${table}`
};

// Cache TTL for query metrics (10 minutes)
const METRICS_CACHE_TTL = 10 * 60 * 1000;

/**
 * Query Optimizer class for monitoring and optimizing database queries
 */
export class QueryOptimizer {
  private config: Required<QueryOptimizerConfig>;
  private queryLogs: QueryInfo[] = [];
  private supabase: SupabaseClient;
  
  /**
   * Create a new query optimizer
   * @param config Configuration options
   */
  constructor(config: QueryOptimizerConfig = {}) {
    this.config = {
      maxQueryLogs: config.maxQueryLogs || 1000,
      slowQueryThreshold: config.slowQueryThreshold || 500,
      supabaseClient: config.supabaseClient || null as any // Will be set later
    };
    
    this.supabase = this.config.supabaseClient;
    this.loadQueryLogs();
  }
  
  /**
   * Set the Supabase client
   * @param client Supabase client instance
   */
  setSupabaseClient(client: SupabaseClient): void {
    this.supabase = client;
    this.config.supabaseClient = client;
  }
  
  /**
   * Log a database query
   * @param query SQL query string
   * @param params Query parameters
   * @param duration Query execution duration in milliseconds
   * @param rowCount Number of rows returned or affected
   * @param source Source of the query (component/function name)
   */
  logQuery(
    query: string,
    params: any[] = [],
    duration: number,
    rowCount: number,
    source: string
  ): void {
    // Extract table name and query type
    const tableName = this.extractTableName(query);
    const queryType = this.extractQueryType(query);
    
    const queryInfo: QueryInfo = {
      query,
      params,
      duration,
      rowCount,
      timestamp: Date.now(),
      tableName,
      queryType,
      source
    };
    
    // Add to query logs
    this.queryLogs.unshift(queryInfo);
    
    // Trim logs if they exceed the maximum
    if (this.queryLogs.length > this.config.maxQueryLogs) {
      this.queryLogs = this.queryLogs.slice(0, this.config.maxQueryLogs);
    }
    
    // Save updated logs
    this.saveQueryLogs();
    
    // Invalidate metrics cache
    getCache().delete(CACHE_KEYS.QUERY_METRICS);
    if (tableName) {
      getCache().delete(CACHE_KEYS.TABLE_METRICS(tableName));
    }
  }
  
  /**
   * Get performance metrics for all queries
   * @returns Query metrics
   */
  async getQueryMetrics(): Promise<QueryMetrics> {
    // Try to get from cache first
    const cachedMetrics = await getCache().get<QueryMetrics>(CACHE_KEYS.QUERY_METRICS);
    if (cachedMetrics) {
      return cachedMetrics;
    }
    
    const metrics = this.calculateMetrics(this.queryLogs);
    
    // Cache metrics
    await getCache().set(CACHE_KEYS.QUERY_METRICS, metrics, { ttl: METRICS_CACHE_TTL });
    
    return metrics;
  }
  
  /**
   * Get performance metrics for a specific table
   * @param tableName Table name
   * @returns Query metrics for the table
   */
  async getTableMetrics(tableName: string): Promise<QueryMetrics> {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.TABLE_METRICS(tableName);
    const cachedMetrics = await getCache().get<QueryMetrics>(cacheKey);
    if (cachedMetrics) {
      return cachedMetrics;
    }
    
    // Filter logs by table name
    const tableQueries = this.queryLogs.filter(
      log => log.tableName === tableName
    );
    
    const metrics = this.calculateMetrics(tableQueries);
    
    // Cache metrics
    await getCache().set(cacheKey, metrics, { ttl: METRICS_CACHE_TTL });
    
    return metrics;
  }
  
  /**
   * Get index recommendations based on query patterns
   * @returns List of index recommendations
   */
  async getIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];
    
    // Group queries by table
    const tableQueries = new Map<string, QueryInfo[]>();
    
    for (const log of this.queryLogs) {
      if (!log.tableName) continue;
      
      if (!tableQueries.has(log.tableName)) {
        tableQueries.set(log.tableName, []);
      }
      
      tableQueries.get(log.tableName)!.push(log);
    }
    
    // Analyze each table's queries
    Array.from(tableQueries.entries()).forEach(([table, queries]) => {
      // Analyze SELECT queries
      const selectQueries = queries.filter((q: QueryInfo) => q.queryType === 'SELECT');
      const whereColumns = this.extractWhereColumns(selectQueries);
      
      // Recommend indexes for frequently used WHERE columns
      Array.from(whereColumns.entries()).forEach(([column, count]) => {
        // Only recommend for columns used in multiple queries
        if (count < 3) return;
        
        // Calculate impact based on query frequency and duration
        const queriesWithColumn = selectQueries.filter(
          (q: QueryInfo) => q.query.includes(`${table}.${column}`) || q.query.includes(`"${column}"`)
        );
        
        const avgDuration = queriesWithColumn.reduce(
          (sum: number, q: QueryInfo) => sum + q.duration, 0
        ) / queriesWithColumn.length;
        
        let impact: 'high' | 'medium' | 'low' = 'low';
        if (avgDuration > 200 && count > 10) {
          impact = 'high';
        } else if (avgDuration > 100 && count > 5) {
          impact = 'medium';
        }
        
        recommendations.push({
          table,
          columns: [column],
          impact,
          reason: `Used in ${count} queries with avg duration of ${avgDuration.toFixed(2)}ms`
        });
      });
      
      // Analyze joins
      const joinColumns = this.extractJoinColumns(selectQueries);
      
      for (const joinInfo of joinColumns) {
        // Recommend indexes for foreign keys in joins
        recommendations.push({
          table: joinInfo.table,
          columns: [joinInfo.column],
          impact: 'medium',
          reason: `Used in ${joinInfo.count} join operations`
        });
      }
    });
    
    // Sort recommendations by impact
    return recommendations.sort((a, b) => {
      const impactValue = { high: 3, medium: 2, low: 1 };
      return impactValue[b.impact] - impactValue[a.impact];
    });
  }
  
  /**
   * Get slow queries based on the configured threshold
   * @param limit Maximum number of slow queries to return
   * @returns List of slow queries
   */
  getSlowQueries(limit: number = 10): QueryInfo[] {
    return this.queryLogs
      .filter(log => log.duration > this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
  
  /**
   * Clear all query logs
   */
  clearLogs(): void {
    this.queryLogs = [];
    this.saveQueryLogs();
    
    // Invalidate all metrics caches
    getCache().delete(CACHE_KEYS.QUERY_METRICS);
    getCache().delete(CACHE_KEYS.QUERY_LOGS);
  }
  
  /**
   * Get the current slow query threshold
   * @returns Slow query threshold in milliseconds
   */
  getSlowQueryThreshold(): number {
    return this.config.slowQueryThreshold;
  }
  
  /**
   * Set the slow query threshold
   * @param threshold Threshold in milliseconds
   */
  setSlowQueryThreshold(threshold: number): void {
    this.config.slowQueryThreshold = threshold;
  }
  
  /**
   * Load query logs from persistent storage
   * @private
   */
  private async loadQueryLogs(): Promise<void> {
    const cachedLogs = await getCache().get<QueryInfo[]>(CACHE_KEYS.QUERY_LOGS);
    if (cachedLogs) {
      this.queryLogs = cachedLogs;
    }
  }
  
  /**
   * Save query logs to persistent storage
   * @private
   */
  private async saveQueryLogs(): Promise<void> {
    await getCache().set(CACHE_KEYS.QUERY_LOGS, this.queryLogs);
  }
  
  /**
   * Calculate metrics from query logs
   * @param logs Query logs to analyze
   * @returns Query metrics
   * @private
   */
  private calculateMetrics(logs: QueryInfo[]): QueryMetrics {
    if (logs.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalQueries: 0,
        totalRows: 0,
        slowQueries: []
      };
    }
    
    // Calculate duration metrics
    let totalDuration = 0;
    let minDuration = Infinity;
    let maxDuration = 0;
    let totalRows = 0;
    
    for (const log of logs) {
      totalDuration += log.duration;
      minDuration = Math.min(minDuration, log.duration);
      maxDuration = Math.max(maxDuration, log.duration);
      totalRows += log.rowCount;
    }
    
    // Find slow queries
    const slowQueries = logs
      .filter(log => log.duration > this.config.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    return {
      avgDuration: totalDuration / logs.length,
      minDuration,
      maxDuration,
      totalQueries: logs.length,
      totalRows,
      slowQueries
    };
  }
  
  /**
   * Extract table name from a SQL query
   * @param query SQL query
   * @returns Table name or empty string if not found
   * @private
   */
  private extractTableName(query: string): string {
    // Simplified table name extraction - in a real implementation,
    // this would use a SQL parser for more accurate results
    
    const normalized = query.trim().toLowerCase();
    
    // Extract from FROM clause
    const fromMatch = normalized.match(/from\s+([a-z0-9_"]+)/i);
    if (fromMatch) {
      return fromMatch[1].replace(/"/g, '');
    }
    
    // Extract from INSERT INTO
    const insertMatch = normalized.match(/insert\s+into\s+([a-z0-9_"]+)/i);
    if (insertMatch) {
      return insertMatch[1].replace(/"/g, '');
    }
    
    // Extract from UPDATE
    const updateMatch = normalized.match(/update\s+([a-z0-9_"]+)/i);
    if (updateMatch) {
      return updateMatch[1].replace(/"/g, '');
    }
    
    // Extract from DELETE FROM
    const deleteMatch = normalized.match(/delete\s+from\s+([a-z0-9_"]+)/i);
    if (deleteMatch) {
      return deleteMatch[1].replace(/"/g, '');
    }
    
    return '';
  }
  
  /**
   * Extract query type from a SQL query
   * @param query SQL query
   * @returns Query type
   * @private
   */
  private extractQueryType(query: string): QueryInfo['queryType'] {
    const normalized = query.trim().toLowerCase();
    
    if (normalized.startsWith('select')) return 'SELECT';
    if (normalized.startsWith('insert')) return 'INSERT';
    if (normalized.startsWith('update')) return 'UPDATE';
    if (normalized.startsWith('delete')) return 'DELETE';
    
    return 'OTHER';
  }
  
  /**
   * Extract columns used in WHERE clauses
   * @param queries Query logs to analyze
   * @returns Map of column names to usage count
   * @private
   */
  private extractWhereColumns(queries: QueryInfo[]): Map<string, number> {
    const whereColumns = new Map<string, number>();
    
    for (const query of queries) {
      const normalized = query.query.toLowerCase();
      
      // Look for where clauses
      const whereClause = normalized.split(/\bwhere\b/i)[1];
      if (!whereClause) continue;
      
      // Extract column names
      const columnMatches = whereClause.match(/([a-z0-9_]+)\s*(?:=|>|<|!=|<>|is|like)/gi);
      if (!columnMatches) continue;
      
      for (let column of columnMatches) {
        // Clean up column name
        column = column.split(/\s*(?:=|>|<|!=|<>|is|like)/i)[0].trim();
        
        // Remove table alias if present
        if (column.includes('.')) {
          column = column.split('.')[1];
        }
        
        // Increment count
        const count = whereColumns.get(column) || 0;
        whereColumns.set(column, count + 1);
      }
    }
    
    return whereColumns;
  }
  
  /**
   * Extract columns used in JOIN operations
   * @param queries Query logs to analyze
   * @returns List of join column information
   * @private
   */
  private extractJoinColumns(queries: QueryInfo[]): Array<{
    table: string;
    column: string;
    count: number;
  }> {
    const joinColumns = new Map<string, number>();
    
    for (const query of queries) {
      const normalized = query.query.toLowerCase();
      
      // Look for join clauses
      const joinMatches = normalized.match(/\b(inner|left|right|full|cross)?\s*join\s+([a-z0-9_"]+)\s+(?:as\s+[a-z0-9_]+\s+)?on\s+([^(]*?)(?:\(|where|group|order|limit|$)/gi);
      
      if (!joinMatches) continue;
      
      for (const joinMatch of joinMatches) {
        // Extract table and join condition
        const parts = joinMatch.split(/\s+on\s+/i);
        if (parts.length !== 2) continue;
        
        const tableMatch = parts[0].match(/join\s+([a-z0-9_"]+)/i);
        if (!tableMatch) continue;
        
        const table = tableMatch[1].replace(/"/g, '');
        
        // Extract columns from the join condition
        const conditionColumns = parts[1].match(/([a-z0-9_.]+)\s*=\s*([a-z0-9_.]+)/gi);
        if (!conditionColumns) continue;
        
        for (const columnPair of conditionColumns) {
          const [leftCol, rightCol] = columnPair.split(/\s*=\s*/);
          
          // Check if either column belongs to the joined table
          if (leftCol.startsWith(table) || leftCol.includes(`.${table}.`)) {
            const column = leftCol.split('.').pop()!;
            const key = `${table}.${column}`;
            const count = joinColumns.get(key) || 0;
            joinColumns.set(key, count + 1);
          }
          
          if (rightCol.startsWith(table) || rightCol.includes(`.${table}.`)) {
            const column = rightCol.split('.').pop()!;
            const key = `${table}.${column}`;
            const count = joinColumns.get(key) || 0;
            joinColumns.set(key, count + 1);
          }
        }
      }
    }
    
    // Convert map to array
    return Array.from(joinColumns.entries()).map(([key, count]) => {
      const [table, column] = key.split('.');
      return { table, column, count };
    });
  }
}

// Create singleton instance
let queryOptimizer: QueryOptimizer | null = null;

/**
 * Get or create the query optimizer instance
 * @param config Configuration options
 * @returns Query optimizer instance
 */
export function getQueryOptimizer(config?: QueryOptimizerConfig): QueryOptimizer {
  if (!queryOptimizer) {
    queryOptimizer = new QueryOptimizer(config);
  }
  
  return queryOptimizer;
}
