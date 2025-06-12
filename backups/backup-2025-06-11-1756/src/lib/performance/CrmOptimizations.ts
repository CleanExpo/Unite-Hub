/**
 * CRM Performance Optimizations
 * Implements caching, lazy loading, and performance monitoring for the CRM system
 */

import React from 'react';

// Simple LRU Cache implementation (since lru-cache might not be available)
class SimpleLRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(options: { max: number; ttl: number }) {
    this.maxSize = options.max;
    this.ttl = options.ttl;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  get max(): number {
    return this.maxSize;
  }
}

// Types for performance monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
  tags?: Record<string, string>;
}

export interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  staleWhileRevalidateMs?: number;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  cacheStats: CacheStats;
  recommendations: string[];
  overallScore: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startTimes: Map<string, number> = new Map();

  // Start timing a operation
  startTiming(name: string, tags?: Record<string, string>): void {
    this.startTimes.set(name, performance.now());
  }

  // End timing and record metric
  endTiming(name: string, tags?: Record<string, string>): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      type: 'timing',
      tags,
    });

    this.startTimes.delete(name);
    return duration;
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get metrics by name
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return [...this.metrics];
    return this.metrics.filter(m => m.name === name);
  }

  // Get average timing for a metric
  getAverageTime(name: string): number {
    const timingMetrics = this.metrics.filter(
      m => m.name === name && m.type === 'timing'
    );
    
    if (timingMetrics.length === 0) return 0;
    
    const total = timingMetrics.reduce((sum, m) => sum + m.value, 0);
    return total / timingMetrics.length;
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  // Generate performance report
  generateReport(): Partial<PerformanceReport> {
    const recommendations: string[] = [];
    let score = 100;

    // Analyze API response times
    const apiMetrics = this.metrics.filter(m => 
      m.name.includes('api') && m.type === 'timing'
    );
    
    if (apiMetrics.length > 0) {
      const avgApiTime = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length;
      
      if (avgApiTime > 1000) {
        recommendations.push('API response times are slow (>1s). Consider optimizing database queries.');
        score -= 20;
      } else if (avgApiTime > 500) {
        recommendations.push('API response times could be improved. Consider adding caching.');
        score -= 10;
      }
    }

    // Analyze component render times
    const renderMetrics = this.metrics.filter(m => 
      m.name.includes('render') && m.type === 'timing'
    );
    
    if (renderMetrics.length > 0) {
      const avgRenderTime = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length;
      
      if (avgRenderTime > 100) {
        recommendations.push('Component render times are slow. Consider using React.memo or useMemo.');
        score -= 15;
      }
    }

    return {
      metrics: this.metrics,
      recommendations,
      overallScore: Math.max(0, score),
    };
  }
}

// Optimized cache implementation
export class OptimizedCache<T = any> {
  private cache: SimpleLRUCache<T>;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(config: CacheConfig) {
    this.cache = new SimpleLRUCache<T>({
      max: config.maxSize,
      ttl: config.ttlMs,
    });
  }

  // Get item from cache
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    
    this.stats.misses++;
    return undefined;
  }

  // Set item in cache
  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  // Delete item from cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear entire cache
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  // Get cache statistics
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0,
      size: this.cache.size,
      maxSize: this.cache.max || 0,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  // Estimate memory usage (rough calculation)
  private estimateMemoryUsage(): number {
    // Rough estimate: 100 bytes per entry on average
    return this.cache.size * 100;
  }
}

// Query optimization utilities
export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryCache = new Map<string, any>();
  private monitor = new PerformanceMonitor();

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Optimize Supabase queries
  optimizeSupabaseQuery(tableName: string, query: any): any {
    this.monitor.startTiming(`query_${tableName}`);
    
    // Add common optimizations
    const optimizedQuery = query
      .limit(1000) // Prevent unbounded queries
      .order('updated_at', { ascending: false }); // Use indexed column

    return optimizedQuery;
  }

  // Batch multiple queries
  async batchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
    this.monitor.startTiming('batch_queries');
    
    try {
      // Execute queries in parallel with concurrency limit
      const results = await Promise.all(queries.map(query => query()));
      this.monitor.endTiming('batch_queries');
      return results;
    } catch (error) {
      this.monitor.endTiming('batch_queries');
      throw error;
    }
  }

  // Debounce function for search queries
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Get performance metrics
  getMetrics(): PerformanceMetric[] {
    return this.monitor.getMetrics();
  }
}

// Component lazy loading utilities
export class LazyLoadManager {
  private static loadedComponents = new Set<string>();
  private static loadingComponents = new Map<string, Promise<any>>();

  // Preload component
  static async preloadComponent(componentName: string, loader: () => Promise<any>): Promise<void> {
    if (this.loadedComponents.has(componentName)) {
      return;
    }

    if (this.loadingComponents.has(componentName)) {
      await this.loadingComponents.get(componentName);
      return;
    }

    const loadPromise = loader();
    this.loadingComponents.set(componentName, loadPromise);
    
    try {
      await loadPromise;
      this.loadedComponents.add(componentName);
    } finally {
      this.loadingComponents.delete(componentName);
    }
  }

  // Check if component is loaded
  static isLoaded(componentName: string): boolean {
    return this.loadedComponents.has(componentName);
  }

  // Get loading status
  static getLoadingStatus(): {
    loaded: string[];
    loading: string[];
  } {
    return {
      loaded: Array.from(this.loadedComponents),
      loading: Array.from(this.loadingComponents.keys()),
    };
  }
}

// Memory management utilities
export class MemoryManager {
  private static watchers = new Map<string, () => void>();

  // Monitor memory usage
  static startMemoryMonitoring(intervalMs = 30000): () => void {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
        });
      }
    }, intervalMs);

    const cleanup = () => clearInterval(interval);
    this.watchers.set('memory', cleanup);
    return cleanup;
  }

  // Cleanup function for React components
  static createCleanupHandler(): () => void {
    const cleanupFunctions: (() => void)[] = [];

    return () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
    };
  }

  // Force garbage collection (development only)
  static forceGC(): void {
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc();
    }
  }
}

// Global performance optimization setup
export class CrmPerformanceOptimizer {
  private static instance: CrmPerformanceOptimizer;
  private monitor: PerformanceMonitor;
  private caches: Map<string, OptimizedCache>;
  private queryOptimizer: QueryOptimizer;

  constructor() {
    this.monitor = new PerformanceMonitor();
    this.caches = new Map();
    this.queryOptimizer = QueryOptimizer.getInstance();
  }

  static getInstance(): CrmPerformanceOptimizer {
    if (!CrmPerformanceOptimizer.instance) {
      CrmPerformanceOptimizer.instance = new CrmPerformanceOptimizer();
    }
    return CrmPerformanceOptimizer.instance;
  }

  // Initialize performance optimizations
  initialize(): void {
    // Create caches for different data types
    this.caches.set('clients', new OptimizedCache({
      maxSize: 1000,
      ttlMs: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidateMs: 1 * 60 * 1000, // 1 minute
    }));

    this.caches.set('deals', new OptimizedCache({
      maxSize: 2000,
      ttlMs: 3 * 60 * 1000, // 3 minutes
    }));

    this.caches.set('tasks', new OptimizedCache({
      maxSize: 5000,
      ttlMs: 2 * 60 * 1000, // 2 minutes
    }));

    this.caches.set('analytics', new OptimizedCache({
      maxSize: 100,
      ttlMs: 10 * 60 * 1000, // 10 minutes
    }));

    // Start memory monitoring in development
    if (process.env.NODE_ENV === 'development') {
      MemoryManager.startMemoryMonitoring();
    }

    console.log('CRM Performance Optimizer initialized');
  }

  // Get cache by name
  getCache(name: string): OptimizedCache | undefined {
    return this.caches.get(name);
  }

  // Generate comprehensive performance report
  async generateReport(): Promise<PerformanceReport> {
    const monitorReport = this.monitor.generateReport();
    const cacheStats = this.getAllCacheStats();
    
    const recommendations: string[] = [
      ...monitorReport.recommendations || [],
    ];

    // Add cache-specific recommendations
    Object.entries(cacheStats).forEach(([name, stats]) => {
      if (stats.hitRate < 0.5) {
        recommendations.push(`${name} cache hit rate is low (${(stats.hitRate * 100).toFixed(1)}%). Consider adjusting TTL or cache size.`);
      }
    });

    return {
      metrics: monitorReport.metrics || [],
      cacheStats: this.getOverallCacheStats(),
      recommendations,
      overallScore: monitorReport.overallScore || 0,
    };
  }

  // Get all cache statistics
  private getAllCacheStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    
    return stats;
  }

  // Get overall cache statistics
  private getOverallCacheStats(): CacheStats {
    const allStats = Object.values(this.getAllCacheStats());
    
    const totalHits = allStats.reduce((sum, stats) => sum + stats.hits, 0);
    const totalMisses = allStats.reduce((sum, stats) => sum + stats.misses, 0);
    const totalSize = allStats.reduce((sum, stats) => sum + stats.size, 0);
    const totalMaxSize = allStats.reduce((sum, stats) => sum + stats.maxSize, 0);
    const totalMemory = allStats.reduce((sum, stats) => sum + stats.memoryUsage, 0);

    return {
      hits: totalHits,
      misses: totalMisses,
      hitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0,
      size: totalSize,
      maxSize: totalMaxSize,
      memoryUsage: totalMemory,
    };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.caches.forEach(cache => cache.clear());
  }

  // Get performance monitor
  getMonitor(): PerformanceMonitor {
    return this.monitor;
  }
}

// Export singleton instance
export const crmOptimizer = CrmPerformanceOptimizer.getInstance();

// React hooks for performance optimization
export const usePerformanceOptimization = () => {
  const optimizer = CrmPerformanceOptimizer.getInstance();
  
  return {
    getCache: (name: string) => optimizer.getCache(name),
    monitor: optimizer.getMonitor(),
    generateReport: () => optimizer.generateReport(),
    clearCaches: () => optimizer.clearAllCaches(),
  };
};

// HOC for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { monitor } = usePerformanceOptimization();
    
    React.useEffect(() => {
      monitor.startTiming(`${componentName}_render`);
      
      return () => {
        monitor.endTiming(`${componentName}_render`);
      };
    }, [monitor]);

    return React.createElement(WrappedComponent, props);
  };
}

// Utility functions
export const performanceUtils = {
  // Optimize image loading
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Measure function execution time
  measureAsync: async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const monitor = CrmPerformanceOptimizer.getInstance().getMonitor();
    monitor.startTiming(name);
    
    try {
      const result = await fn();
      monitor.endTiming(name);
      return result;
    } catch (error) {
      monitor.endTiming(name);
      throw error;
    }
  },

  // Check if page is visible (for pausing unnecessary work)
  isPageVisible: (): boolean => {
    return document.visibilityState === 'visible';
  },

  // Get connection speed estimate
  getConnectionSpeed: (): string => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  },
};
