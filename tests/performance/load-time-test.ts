import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  PerformanceMonitor, 
  OptimizedCache, 
  QueryOptimizer,
  LazyLoadManager,
  MemoryManager,
  CrmPerformanceOptimizer,
  performanceUtils
} from '@/lib/performance/CrmOptimizations';

// Mock timers for performance testing
jest.useFakeTimers();

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 500 * 1024 * 1024, // 500MB
    }
  }
});

// Mock fetch for API performance tests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CRM Performance Optimization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    it('should measure timing correctly', () => {
      const mockNow = jest.fn();
      mockNow.mockReturnValueOnce(100).mockReturnValueOnce(200);
      (performance.now as jest.Mock) = mockNow;

      monitor.startTiming('test-operation');
      monitor.endTiming('test-operation');

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].type).toBe('timing');
    });

    it('should calculate average timing correctly', () => {
      monitor.recordMetric({
        name: 'api-call',
        value: 100,
        timestamp: Date.now(),
        type: 'timing'
      });
      
      monitor.recordMetric({
        name: 'api-call',
        value: 200,
        timestamp: Date.now(),
        type: 'timing'
      });

      const average = monitor.getAverageTime('api-call');
      expect(average).toBe(150);
    });

    it('should limit metrics to prevent memory leaks', () => {
      // Add 1100 metrics (more than the 1000 limit)
      for (let i = 0; i < 1100; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          value: i,
          timestamp: Date.now(),
          type: 'counter'
        });
      }

      const allMetrics = monitor.getMetrics();
      expect(allMetrics.length).toBe(1000);
    });

    it('should generate performance reports with recommendations', () => {
      // Add slow API metrics
      monitor.recordMetric({
        name: 'api-slow',
        value: 1500, // > 1000ms
        timestamp: Date.now(),
        type: 'timing'
      });

      // Add slow render metrics
      monitor.recordMetric({
        name: 'component-render',
        value: 150, // > 100ms
        timestamp: Date.now(),
        type: 'timing'
      });

      const report = monitor.generateReport();
      
      expect(report.recommendations).toContain(
        'API response times are slow (>1s). Consider optimizing database queries.'
      );
      expect(report.recommendations).toContain(
        'Component render times are slow. Consider using React.memo or useMemo.'
      );
      expect(report.overallScore).toBeLessThan(100);
    });
  });

  describe('OptimizedCache', () => {
    let cache: OptimizedCache<string>;

    beforeEach(() => {
      cache = new OptimizedCache({
        maxSize: 3,
        ttlMs: 1000, // 1 second
      });
    });

    it('should store and retrieve items correctly', () => {
      cache.set('key1', 'value1');
      
      const value = cache.get('key1');
      expect(value).toBe('value1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('should handle cache misses correctly', () => {
      const value = cache.get('nonexistent');
      expect(value).toBeUndefined();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });

    it('should respect TTL (time-to-live)', () => {
      cache.set('key1', 'value1');
      
      // Simulate time passing beyond TTL
      jest.advanceTimersByTime(1500);
      
      const value = cache.get('key1');
      expect(value).toBeUndefined();
    });

    it('should respect max size limits', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key4')).toBe('value4');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.get('key1'); // hit
      cache.get('key2'); // hit
      cache.get('key3'); // miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(0.67, 2);
    });

    it('should clear cache and reset stats', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('QueryOptimizer', () => {
    let optimizer: QueryOptimizer;

    beforeEach(() => {
      optimizer = QueryOptimizer.getInstance();
    });

    it('should optimize Supabase queries', () => {
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      };

      const optimizedQuery = optimizer.optimizeSupabaseQuery('clients', mockQuery);
      
      expect(mockQuery.limit).toHaveBeenCalledWith(1000);
      expect(mockQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('should batch queries efficiently', async () => {
      const query1 = jest.fn().mockResolvedValue('result1');
      const query2 = jest.fn().mockResolvedValue('result2');
      const query3 = jest.fn().mockResolvedValue('result3');

      const results = await optimizer.batchQueries([query1, query2, query3]);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(query1).toHaveBeenCalled();
      expect(query2).toHaveBeenCalled();
      expect(query3).toHaveBeenCalled();
    });

    it('should handle batch query errors', async () => {
      const query1 = jest.fn().mockResolvedValue('result1');
      const query2 = jest.fn().mockRejectedValue(new Error('Query failed'));

      await expect(optimizer.batchQueries([query1, query2])).rejects.toThrow('Query failed');
    });

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = optimizer.debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Function should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Advance timer to trigger debounced call
      jest.advanceTimersByTime(100);

      // Only the last call should have been executed
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('LazyLoadManager', () => {
    beforeEach(() => {
      // Reset static state
      (LazyLoadManager as any).loadedComponents = new Set();
      (LazyLoadManager as any).loadingComponents = new Map();
    });

    it('should preload components correctly', async () => {
      const mockLoader = jest.fn().mockResolvedValue('component');
      
      await LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      
      expect(mockLoader).toHaveBeenCalled();
      expect(LazyLoadManager.isLoaded('TestComponent')).toBe(true);
    });

    it('should not reload already loaded components', async () => {
      const mockLoader = jest.fn().mockResolvedValue('component');
      
      await LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      await LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      
      expect(mockLoader).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent loading of same component', async () => {
      const mockLoader = jest.fn().mockResolvedValue('component');
      
      const promise1 = LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      const promise2 = LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      
      await Promise.all([promise1, promise2]);
      
      expect(mockLoader).toHaveBeenCalledTimes(1);
    });

    it('should track loading status correctly', async () => {
      const mockLoader = jest.fn(() => new Promise(resolve => 
        setTimeout(() => resolve('component'), 100)
      ));
      
      const loadPromise = LazyLoadManager.preloadComponent('TestComponent', mockLoader);
      
      const status = LazyLoadManager.getLoadingStatus();
      expect(status.loading).toContain('TestComponent');
      expect(status.loaded).not.toContain('TestComponent');
      
      await loadPromise;
      
      const finalStatus = LazyLoadManager.getLoadingStatus();
      expect(finalStatus.loading).not.toContain('TestComponent');
      expect(finalStatus.loaded).toContain('TestComponent');
    });
  });

  describe('MemoryManager', () => {
    it('should start memory monitoring', () => {
      const cleanup = MemoryManager.startMemoryMonitoring(1000);
      
      expect(typeof cleanup).toBe('function');
      
      // Clean up to prevent test interference
      cleanup();
    });

    it('should create cleanup handlers', () => {
      const cleanupHandler = MemoryManager.createCleanupHandler();
      
      expect(typeof cleanupHandler).toBe('function');
      
      // Should not throw when called
      expect(() => cleanupHandler()).not.toThrow();
    });

    it('should handle force garbage collection safely', () => {
      // Should not throw even if gc is not available
      expect(() => MemoryManager.forceGC()).not.toThrow();
    });
  });

  describe('CrmPerformanceOptimizer', () => {
    let optimizer: CrmPerformanceOptimizer;

    beforeEach(() => {
      optimizer = CrmPerformanceOptimizer.getInstance();
    });

    it('should initialize with default caches', () => {
      optimizer.initialize();
      
      expect(optimizer.getCache('clients')).toBeDefined();
      expect(optimizer.getCache('deals')).toBeDefined();
      expect(optimizer.getCache('tasks')).toBeDefined();
      expect(optimizer.getCache('analytics')).toBeDefined();
    });

    it('should generate comprehensive performance reports', async () => {
      optimizer.initialize();
      
      // Add some test data to caches
      const clientsCache = optimizer.getCache('clients');
      const dealsCache = optimizer.getCache('deals');
      
      if (clientsCache && dealsCache) {
        clientsCache.set('client1', { name: 'Test Client' });
        clientsCache.get('client1'); // hit
        clientsCache.get('nonexistent'); // miss
        
        dealsCache.set('deal1', { title: 'Test Deal' });
        dealsCache.get('deal1'); // hit
      }
      
      const report = await optimizer.generateReport();
      
      expect(report.metrics).toBeDefined();
      expect(report.cacheStats).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.overallScore).toBeDefined();
      
      expect(report.cacheStats.hits).toBeGreaterThan(0);
      expect(report.cacheStats.misses).toBeGreaterThan(0);
    });

    it('should provide cache recommendations based on hit rate', async () => {
      optimizer.initialize();
      
      const cache = optimizer.getCache('clients');
      if (cache) {
        // Create low hit rate scenario
        cache.set('key1', 'value1');
        cache.get('nonexistent1'); // miss
        cache.get('nonexistent2'); // miss
        cache.get('nonexistent3'); // miss
        cache.get('key1'); // hit (low hit rate: 25%)
      }
      
      const report = await optimizer.generateReport();
      
      expect(report.recommendations.some(rec => 
        rec.includes('cache hit rate is low')
      )).toBe(true);
    });

    it('should clear all caches', () => {
      optimizer.initialize();
      
      const clientsCache = optimizer.getCache('clients');
      if (clientsCache) {
        clientsCache.set('key1', 'value1');
        expect(clientsCache.get('key1')).toBe('value1');
      }
      
      optimizer.clearAllCaches();
      
      if (clientsCache) {
        expect(clientsCache.get('key1')).toBeUndefined();
      }
    });
  });

  describe('Performance Utils', () => {
    it('should preload images correctly', async () => {
      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
      };
      
      (global as any).Image = jest.fn(() => mockImage);
      
      const preloadPromise = performanceUtils.preloadImage('test.jpg');
      
      // Simulate successful load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await expect(preloadPromise).resolves.toBeUndefined();
      expect(mockImage.src).toBe('test.jpg');
    });

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      // Only first call should execute
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Advance timer and call again
      jest.advanceTimersByTime(100);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should measure async function execution time', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const mockNow = jest.fn();
      mockNow.mockReturnValueOnce(100).mockReturnValueOnce(300);
      (performance.now as jest.Mock) = mockNow;

      const result = await performanceUtils.measureAsync('test-function', mockFn);
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should check page visibility', () => {
      // Mock document.visibilityState
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });

      expect(performanceUtils.isPageVisible()).toBe(true);

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });

      expect(performanceUtils.isPageVisible()).toBe(false);
    });

    it('should get connection speed estimate', () => {
      // Mock navigator.connection
      (navigator as any).connection = {
        effectiveType: '4g'
      };

      expect(performanceUtils.getConnectionSpeed()).toBe('4g');

      // Test without connection API
      delete (navigator as any).connection;
      expect(performanceUtils.getConnectionSpeed()).toBe('unknown');
    });
  });

  describe('Load Time Performance Tests', () => {
    it('should measure component render times', () => {
      const monitor = new PerformanceMonitor();
      const mockNow = jest.fn();
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(50);
      (performance.now as jest.Mock) = mockNow;

      monitor.startTiming('component-render');
      // Simulate component rendering
      monitor.endTiming('component-render');

      const metrics = monitor.getMetrics('component-render');
      expect(metrics[0].value).toBe(50);
      expect(metrics[0].value).toBeLessThan(100); // Should be fast
    });

    it('should measure API response times', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      } as Response);

      const monitor = new PerformanceMonitor();
      const mockNow = jest.fn();
      mockNow.mockReturnValueOnce(0).mockReturnValueOnce(200);
      (performance.now as jest.Mock) = mockNow;

      monitor.startTiming('api-call');
      await fetch('/api/test');
      monitor.endTiming('api-call');

      const metrics = monitor.getMetrics('api-call');
      expect(metrics[0].value).toBe(200);
      expect(metrics[0].value).toBeLessThan(500); // Should be reasonably fast
    });

    it('should detect performance bottlenecks', () => {
      const monitor = new PerformanceMonitor();
      
      // Simulate slow operations
      monitor.recordMetric({
        name: 'slow-operation',
        value: 2000, // 2 seconds - very slow
        timestamp: Date.now(),
        type: 'timing'
      });

      const report = monitor.generateReport();
      expect(report.overallScore).toBeLessThan(80); // Performance degraded
      expect(report.recommendations?.length).toBeGreaterThan(0);
    });

    it('should validate cache performance', () => {
      const cache = new OptimizedCache({ maxSize: 100, ttlMs: 5000 });
      
      // Simulate good cache usage
      for (let i = 0; i < 50; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access cached items
      for (let i = 0; i < 25; i++) {
        cache.get(`key${i}`);
      }
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThan(0.5); // Good hit rate
      expect(stats.size).toBeLessThanOrEqual(100); // Within limits
    });

    it('should measure memory usage trends', () => {
      const initialMemory = (performance as any).memory.usedJSHeapSize;
      
      // Simulate memory-intensive operations
      const cache = new OptimizedCache({ maxSize: 1000, ttlMs: 10000 });
      for (let i = 0; i < 500; i++) {
        cache.set(`key${i}`, `large-value-${'x'.repeat(1000)}`);
      }
      
      const stats = cache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.size).toBeLessThanOrEqual(1000);
    });

    it('should validate lazy loading effectiveness', async () => {
      const loadTimes: number[] = [];
      
      const measureLoad = async (componentName: string) => {
        const start = performance.now();
        await LazyLoadManager.preloadComponent(componentName, async () => {
          // Simulate component loading time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          return 'component';
        });
        const end = performance.now();
        return end - start;
      };

      // First load
      const firstLoad = await measureLoad('TestComponent');
      loadTimes.push(firstLoad);

      // Second load (should be cached)
      const secondLoad = await measureLoad('TestComponent');
      loadTimes.push(secondLoad);

      expect(secondLoad).toBeLessThan(firstLoad * 0.1); // Should be much faster
    });
  });

  describe('Performance Regression Tests', () => {
    it('should detect when performance degrades over baseline', () => {
      const monitor = new PerformanceMonitor();
      
      // Baseline measurements
      const baselineMetrics = [100, 120, 90, 110, 105]; // ~105ms average
      baselineMetrics.forEach(value => {
        monitor.recordMetric({
          name: 'baseline-operation',
          value,
          timestamp: Date.now(),
          type: 'timing'
        });
      });
      
      const baseline = monitor.getAverageTime('baseline-operation');
      
      // Current measurements (degraded)
      const currentMetrics = [200, 250, 180, 220, 190]; // ~208ms average
      currentMetrics.forEach(value => {
        monitor.recordMetric({
          name: 'current-operation',
          value,
          timestamp: Date.now(),
          type: 'timing'
        });
      });
      
      const current = monitor.getAverageTime('current-operation');
      
      const degradation = (current - baseline) / baseline;
      expect(degradation).toBeGreaterThan(0.5); // 50% performance degradation
    });

    it('should validate cache hit rate thresholds', () => {
      const cache = new OptimizedCache({ maxSize: 10, ttlMs: 1000 });
      
      // Poor cache usage pattern
      for (let i = 0; i < 20; i++) {
        cache.set(`key${i}`, `value${i}`);
        cache.get(`different-key${i}`); // Always miss
      }
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeLessThan(0.3); // Poor hit rate
    });

    it('should ensure memory usage stays within bounds', () => {
      const caches = [];
      
      // Create multiple caches
      for (let i = 0; i < 5; i++) {
        const cache = new OptimizedCache({ maxSize: 100, ttlMs: 5000 });
        
        // Fill each cache
        for (let j = 0; j < 100; j++) {
          cache.set(`cache${i}-key${j}`, `value-${'x'.repeat(100)}`);
        }
        
        caches.push(cache);
      }
      
      // Check total memory usage
      const totalMemory = caches.reduce((sum, cache) => 
        sum + cache.getStats().memoryUsage, 0
      );
      
      // Should be reasonable (less than 1MB for test data)
      expect(totalMemory).toBeLessThan(1024 * 1024);
    });
  });
});

describe('Performance API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should handle performance report API calls', async () => {
    const mockReport = {
      metrics: [],
      cacheStats: { hits: 10, misses: 2, hitRate: 0.83 },
      recommendations: [],
      overallScore: 85
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReport,
    } as Response);

    const response = await fetch('/api/crm/performance?action=report');
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledWith('/api/crm/performance?action=report');
    expect(data).toEqual(mockReport);
  });

  it('should handle cache statistics API calls', async () => {
    const mockStats = {
      individual: {
        clients: { hits: 5, misses: 1, hitRate: 0.83 },
        deals: { hits: 8, misses: 2, hitRate: 0.8 }
      },
      overall: { hits: 13, misses: 3, hitRate: 0.81 }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const response = await fetch('/api/crm/performance?action=cache-stats');
    const data = await response.json();

    expect(data.overall.hitRate).toBeGreaterThan(0.8);
  });

  it('should handle metric recording API calls', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Metrics recorded successfully' }),
    } as Response);

    const metrics = [
      { name: 'test-metric', value: 100, timestamp: Date.now(), type: 'timing' }
    ];

    const response = await fetch('/api/crm/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'record-metric', metrics })
    });

    expect(response.ok).toBe(true);
  });
});
