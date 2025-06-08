/**
 * Optimized Database Client
 * 
 * This module provides an optimized wrapper around the Supabase client,
 * incorporating performance monitoring, query optimization, and caching.
 */

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { getQueryOptimizer } from './query-optimizer';
import { getCache } from '@/lib/cache';

/**
 * Optimized client configuration
 */
export interface OptimizedClientConfig {
  /**
   * Supabase URL
   */
  supabaseUrl: string;
  
  /**
   * Supabase API key
   */
  supabaseKey: string;
  
  /**
   * Enable query tracking
   * @default true
   */
  trackQueries?: boolean;
  
  /**
   * Cache configuration
   */
  cache?: {
    /**
     * Enable result caching
     * @default true
     */
    enabled?: boolean;
    
    /**
     * Default TTL for cached results in milliseconds
     * @default 60000 (1 minute)
     */
    defaultTtl?: number;
  };
}

/**
 * Cache configuration for a specific query
 */
export interface QueryCacheOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;
  
  /**
   * Cache tags for invalidation
   */
  tags?: string[];
  
  /**
   * Skip cache and force a fresh query
   */
  skipCache?: boolean;
}

// Performance markers
interface PerformanceMarker {
  start: number;
  table?: string;
  source?: string;
}

/**
 * Optimized database client that wraps Supabase with performance enhancements
 */
export class OptimizedClient {
  private supabase: SupabaseClient;
  private config: OptimizedClientConfig;
  private performanceMarkers: Map<string, PerformanceMarker> = new Map();
  
  /**
   * Create a new optimized database client
   * @param config Client configuration
   */
  constructor(config: OptimizedClientConfig) {
    this.config = {
      ...config,
      trackQueries: config.trackQueries !== false,
      cache: {
        enabled: config.cache?.enabled !== false,
        defaultTtl: config.cache?.defaultTtl || 60000
      }
    };
    
    // Create Supabase client
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    // Initialize query optimizer
    const queryOptimizer = getQueryOptimizer();
    queryOptimizer.setSupabaseClient(this.supabase);
  }
  
  /**
   * Get the raw Supabase client
   * @returns Supabase client
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }
  
  /**
   * Execute a SELECT query with result caching
   * @param table Table name
   * @param queryFn Query function that receives a Supabase query builder and returns a query
   * @param cacheOptions Cache options
   * @returns Query result
   */
  async selectWithCache<T = any>(
    table: string,
    queryFn: (queryBuilder: any) => any,
    cacheOptions: QueryCacheOptions = {}
  ): Promise<T[]> {
    const isCachingEnabled = this.config.cache?.enabled && !cacheOptions.skipCache;
    
    if (isCachingEnabled) {
      // Generate cache key based on table and function toString()
      const cacheKey = `db:${table}:${queryFn.toString()}`;
      
      // Try to get from cache first
      const cachedResult = await getCache().get<T[]>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Execute query
    const marker = this.markQueryStart(table, 'selectWithCache');
    const query = queryFn(this.supabase.from(table));
    const result = await query;
    
    // Get row count for metrics
    let rowCount = 0;
    if (result.data && Array.isArray(result.data)) {
      rowCount = (result.data as any[]).length;
    }
    
    this.markQueryEnd(marker, 'SELECT', rowCount);
    
    // Handle error
    if (result.error) {
      throw result.error;
    }
    
    // Convert to array if needed
    const data = result.data || [];
    
    // Cache result if caching is enabled
    if (isCachingEnabled) {
      const cacheKey = `db:${table}:${queryFn.toString()}`;
      const ttl = cacheOptions.ttl || this.config.cache?.defaultTtl;
      const tags = [...(cacheOptions.tags || []), `table:${table}`];
      
      await getCache().set(cacheKey, data, { ttl, tags });
    }
    
    return data as T[];
  }
  
  /**
   * Insert data into a table and invalidate relevant caches
   * @param table Table name
   * @param values Data to insert
   * @returns Inserted data
   */
  async insert<T = any>(
    table: string,
    values: any | any[]
  ): Promise<T[]> {
    const marker = this.markQueryStart(table, 'insert');
    
    const result = await this.supabase
      .from(table)
      .insert(values);
    
    // Get row count for metrics
    let rowCount = 0;
    if (result.data && Array.isArray(result.data)) {
      rowCount = (result.data as any[]).length;
    } else if (result.data) {
      rowCount = 1;
    }
    
    this.markQueryEnd(marker, 'INSERT', rowCount);
    
    // Handle error
    if (result.error) {
      throw result.error;
    }
    
    // Invalidate cache for this table
    await getCache().invalidateTags([`table:${table}`]);
    
    // Convert to array if needed
    return (Array.isArray(result.data) ? result.data : (result.data ? [result.data] : [])) as T[];
  }
  
  /**
   * Update data in a table and invalidate relevant caches
   * @param table Table name
   * @param values Data to update
   * @param queryFn Function to build the query with conditions
   * @returns Updated data
   */
  async update<T = any>(
    table: string,
    values: any,
    queryFn: (queryBuilder: any) => any
  ): Promise<T[]> {
    const marker = this.markQueryStart(table, 'update');
    
    const updateQuery = this.supabase.from(table).update(values);
    const query = queryFn(updateQuery);
    const result = await query;
    
    // Get row count for metrics
    let rowCount = 0;
    if (result.data && Array.isArray(result.data)) {
      rowCount = result.data.length;
    } else if (result.data) {
      rowCount = 1;
    }
    
    this.markQueryEnd(marker, 'UPDATE', rowCount);
    
    // Handle error
    if (result.error) {
      throw result.error;
    }
    
    // Invalidate cache for this table
    await getCache().invalidateTags([`table:${table}`]);
    
    // Convert to array if needed
    return (Array.isArray(result.data) ? result.data : (result.data ? [result.data] : [])) as T[];
  }
  
  /**
   * Delete data from a table and invalidate relevant caches
   * @param table Table name
   * @param queryFn Function to build the query with conditions
   * @returns Deleted data
   */
  async delete<T = any>(
    table: string,
    queryFn: (queryBuilder: any) => any
  ): Promise<T[]> {
    const marker = this.markQueryStart(table, 'delete');
    
    const deleteQuery = this.supabase.from(table).delete();
    const query = queryFn(deleteQuery);
    const result = await query;
    
    // Get row count for metrics
    let rowCount = 0;
    if (result.data && Array.isArray(result.data)) {
      rowCount = result.data.length;
    } else if (result.data) {
      rowCount = 1;
    }
    
    this.markQueryEnd(marker, 'DELETE', rowCount);
    
    // Handle error
    if (result.error) {
      throw result.error;
    }
    
    // Invalidate cache for this table
    await getCache().invalidateTags([`table:${table}`]);
    
    // Convert to array if needed
    return (Array.isArray(result.data) ? result.data : (result.data ? [result.data] : [])) as T[];
  }
  
  /**
   * Count rows in a table with caching
   * @param table Table name
   * @param queryFn Function to build the query with conditions
   * @param cacheOptions Cache options
   * @returns Row count
   */
  async count(
    table: string,
    queryFn?: (queryBuilder: any) => any,
    cacheOptions: QueryCacheOptions = {}
  ): Promise<number> {
    const isCachingEnabled = this.config.cache?.enabled && !cacheOptions.skipCache;
    
    if (isCachingEnabled) {
      // Generate cache key
      const queryString = queryFn ? queryFn.toString() : 'all';
      const cacheKey = `db:${table}:count:${queryString}`;
      
      // Try to get from cache
      const cachedResult = await getCache().get<number>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }
    
    // Execute query
    const marker = this.markQueryStart(table, 'count');
    
    let query = this.supabase.from(table).select('*', { count: 'exact', head: true });
    if (queryFn) {
      query = queryFn(query);
    }
    
    const result = await query;
    this.markQueryEnd(marker, 'SELECT', 0);
    
    // Handle error
    if (result.error) {
      throw result.error;
    }
    
    const count = typeof result.count === 'number' ? result.count : 0;
    
    // Cache result if caching is enabled
    if (isCachingEnabled) {
      const queryString = queryFn ? queryFn.toString() : 'all';
      const cacheKey = `db:${table}:count:${queryString}`;
      const ttl = cacheOptions.ttl || this.config.cache?.defaultTtl;
      const tags = [...(cacheOptions.tags || []), `table:${table}`];
      
      await getCache().set(cacheKey, count, { ttl, tags });
    }
    
    return count;
  }
  
  /**
   * Clear all caches related to database queries
   */
  async clearCache(): Promise<void> {
    await getCache().invalidateTags(['table:']);
  }
  
  /**
   * Get database performance metrics
   * @returns Performance metrics
   */
  async getPerformanceMetrics() {
    const queryOptimizer = getQueryOptimizer();
    return queryOptimizer.getQueryMetrics();
  }
  
  /**
   * Get index recommendations for database optimization
   * @returns Index recommendations
   */
  async getIndexRecommendations() {
    const queryOptimizer = getQueryOptimizer();
    return queryOptimizer.getIndexRecommendations();
  }
  
  /**
   * Get slow queries
   * @param limit Maximum number of slow queries to return
   * @returns Slow queries
   */
  getSlowQueries(limit: number = 10) {
    const queryOptimizer = getQueryOptimizer();
    return queryOptimizer.getSlowQueries(limit);
  }
  
  /**
   * Create a performance marker for a query
   * @param table Table name
   * @param source Source of the query
   * @returns Marker ID
   * @private
   */
  private markQueryStart(table?: string, source?: string): string {
    if (!this.config.trackQueries) {
      return '';
    }
    
    const markerId = Math.random().toString(36).substring(2, 15);
    
    this.performanceMarkers.set(markerId, {
      start: performance.now(),
      table,
      source
    });
    
    return markerId;
  }
  
  /**
   * Mark the end of a query and log performance metrics
   * @param markerId Marker ID
   * @param queryType Query type
   * @param rowCount Number of rows affected
   * @param sql Raw SQL query (optional)
   * @param params Query parameters (optional)
   * @private
   */
  private markQueryEnd(
    markerId: string,
    queryType: string,
    rowCount: number,
    sql?: string,
    params?: any[]
  ): void {
    if (!this.config.trackQueries || !markerId) {
      return;
    }
    
    const marker = this.performanceMarkers.get(markerId);
    if (!marker) {
      return;
    }
    
    // Calculate duration
    const duration = performance.now() - marker.start;
    
    // Clean up marker
    this.performanceMarkers.delete(markerId);
    
    // Log to query optimizer
    const queryOptimizer = getQueryOptimizer();
    
    // Use the SQL query if provided, otherwise construct a placeholder
    const query = sql || `${queryType} ${marker.table ? `FROM ${marker.table}` : ''}`;
    
    queryOptimizer.logQuery(
      query,
      params || [],
      duration,
      rowCount,
      marker.source || 'unknown'
    );
  }
}

// Create singleton instance
let optimizedClient: OptimizedClient | null = null;

/**
 * Get or create the optimized client instance
 * @param config Client configuration
 * @returns Optimized client instance
 */
export function getOptimizedClient(config?: OptimizedClientConfig): OptimizedClient {
  if (!optimizedClient && config) {
    optimizedClient = new OptimizedClient(config);
  }
  
  if (!optimizedClient) {
    throw new Error('Optimized client not initialized. Provide configuration first.');
  }
  
  return optimizedClient;
}

/**
 * Initialize the optimized client
 * @param config Client configuration
 */
export function initializeOptimizedClient(config: OptimizedClientConfig): void {
  optimizedClient = new OptimizedClient(config);
}
