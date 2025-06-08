/**
 * Load Testing and Performance Benchmarking Module
 * 
 * This module provides utilities for load testing and performance benchmarking
 * to ensure optimal performance under high traffic conditions.
 */

/**
 * Load test configuration
 */
export interface LoadTestConfig {
  /**
   * Number of virtual users
   * @default 100
   */
  virtualUsers: number;
  
  /**
   * Duration of the test in seconds
   * @default 60
   */
  duration: number;
  
  /**
   * Ramp-up period in seconds (time to reach target user count)
   * @default 10
   */
  rampUp: number;
  
  /**
   * Maximum requests per second
   * @default 0 (unlimited)
   */
  maxRps: number;
  
  /**
   * URLs to test
   */
  urls: string[];
  
  /**
   * Authentication settings
   */
  auth?: {
    /**
     * Type of authentication
     */
    type: 'none' | 'basic' | 'bearer' | 'custom';
    
    /**
     * Username for basic auth
     */
    username?: string;
    
    /**
     * Password for basic auth
     */
    password?: string;
    
    /**
     * Token for bearer auth
     */
    token?: string;
    
    /**
     * Headers for custom auth
     */
    headers?: Record<string, string>;
  };
  
  /**
   * Thresholds for test success
   */
  thresholds?: {
    /**
     * Maximum response time in ms
     */
    maxResponseTime?: number;
    
    /**
     * Maximum error rate (0-1)
     */
    maxErrorRate?: number;
    
    /**
     * Minimum requests per second
     */
    minRps?: number;
  };
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  /**
   * Name of the metric
   */
  name: string;
  
  /**
   * Value of the metric
   */
  value: number;
  
  /**
   * Unit of the metric
   */
  unit: string;
  
  /**
   * Timestamp when the metric was collected
   */
  timestamp: number;
  
  /**
   * Target value for the metric (if applicable)
   */
  target?: number;
  
  /**
   * Whether the metric meets the target
   */
  meetsTarget?: boolean;
}

/**
 * Load test result summary
 */
export interface LoadTestResult {
  /**
   * ID of the test
   */
  id: string;
  
  /**
   * Start time of the test
   */
  startTime: number;
  
  /**
   * End time of the test
   */
  endTime: number;
  
  /**
   * Duration of the test in seconds
   */
  duration: number;
  
  /**
   * Total number of requests
   */
  requestCount: number;
  
  /**
   * Number of successful requests
   */
  successCount: number;
  
  /**
   * Number of failed requests
   */
  failCount: number;
  
  /**
   * Average response time in ms
   */
  avgResponseTime: number;
  
  /**
   * Median response time in ms
   */
  medianResponseTime: number;
  
  /**
   * 95th percentile response time in ms
   */
  p95ResponseTime: number;
  
  /**
   * 99th percentile response time in ms
   */
  p99ResponseTime: number;
  
  /**
   * Maximum response time in ms
   */
  maxResponseTime: number;
  
  /**
   * Minimum response time in ms
   */
  minResponseTime: number;
  
  /**
   * Average requests per second
   */
  rps: number;
  
  /**
   * Error rate (0-1)
   */
  errorRate: number;
  
  /**
   * Results by URL
   */
  urlResults: Record<string, {
    /**
     * Number of requests
     */
    requestCount: number;
    
    /**
     * Number of successful requests
     */
    successCount: number;
    
    /**
     * Number of failed requests
     */
    failCount: number;
    
    /**
     * Average response time in ms
     */
    avgResponseTime: number;
    
    /**
     * Error rate (0-1)
     */
    errorRate: number;
  }>;
  
  /**
   * Whether the test passed all thresholds
   */
  passed: boolean;
  
  /**
   * Failed thresholds
   */
  failedThresholds: Array<{
    /**
     * Name of the threshold
     */
    name: string;
    
    /**
     * Actual value
     */
    actual: number;
    
    /**
     * Target value
     */
    target: number;
  }>;
}

/**
 * Performance benchmark configuration
 */
export interface BenchmarkConfig {
  /**
   * ID of the benchmark
   */
  id: string;
  
  /**
   * Name of the benchmark
   */
  name: string;
  
  /**
   * Description of the benchmark
   */
  description?: string;
  
  /**
   * URLs to benchmark
   */
  urls: string[];
  
  /**
   * Number of runs to perform
   * @default 3
   */
  runs: number;
  
  /**
   * Whether to run in headless mode
   * @default true
   */
  headless: boolean;
  
  /**
   * Device to emulate
   * @default 'desktop'
   */
  device: 'desktop' | 'mobile';
  
  /**
   * Network throttling configuration
   */
  network?: {
    /**
     * Download speed in Kbps
     */
    download?: number;
    
    /**
     * Upload speed in Kbps
     */
    upload?: number;
    
    /**
     * Latency in ms
     */
    latency?: number;
  };
  
  /**
   * CPU throttling multiplier (1 = no throttling, 4 = 4x slower)
   */
  cpuThrottling?: number;
  
  /**
   * Metrics to collect
   */
  metrics: Array<'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'TTI' | 'TBT' | 'SI'>;
}

/**
 * Performance benchmark result
 */
export interface BenchmarkResult {
  /**
   * ID of the benchmark
   */
  id: string;
  
  /**
   * Start time of the benchmark
   */
  startTime: number;
  
  /**
   * End time of the benchmark
   */
  endTime: number;
  
  /**
   * URL that was benchmarked
   */
  url: string;
  
  /**
   * Results for each run
   */
  runs: Array<{
    /**
     * Run number
     */
    run: number;
    
    /**
     * Metrics collected
     */
    metrics: {
      /**
       * First Contentful Paint in ms
       */
      FCP?: number;
      
      /**
       * Largest Contentful Paint in ms
       */
      LCP?: number;
      
      /**
       * Cumulative Layout Shift
       */
      CLS?: number;
      
      /**
       * First Input Delay in ms
       */
      FID?: number;
      
      /**
       * Time to First Byte in ms
       */
      TTFB?: number;
      
      /**
       * Time to Interactive in ms
       */
      TTI?: number;
      
      /**
       * Total Blocking Time in ms
       */
      TBT?: number;
      
      /**
       * Speed Index in ms
       */
      SI?: number;
    };
  }>;
  
  /**
   * Average metrics across all runs
   */
  averages: {
    /**
     * First Contentful Paint in ms
     */
    FCP?: number;
    
    /**
     * Largest Contentful Paint in ms
     */
    LCP?: number;
    
    /**
     * Cumulative Layout Shift
     */
    CLS?: number;
    
    /**
     * First Input Delay in ms
     */
    FID?: number;
    
    /**
     * Time to First Byte in ms
     */
    TTFB?: number;
    
    /**
     * Time to Interactive in ms
     */
    TTI?: number;
    
    /**
     * Total Blocking Time in ms
     */
    TBT?: number;
    
    /**
     * Speed Index in ms
     */
    SI?: number;
  };
  
  /**
   * Lighthouse score (0-100)
   */
  lighthouseScore?: {
    /**
     * Performance score
     */
    performance?: number;
    
    /**
     * Accessibility score
     */
    accessibility?: number;
    
    /**
     * Best practices score
     */
    bestPractices?: number;
    
    /**
     * SEO score
     */
    seo?: number;
    
    /**
     * PWA score
     */
    pwa?: number;
  };
}

/**
 * Default load test configuration
 */
export const defaultLoadTestConfig: LoadTestConfig = {
  virtualUsers: 100,
  duration: 60,
  rampUp: 10,
  maxRps: 0,
  urls: [],
  auth: {
    type: 'none',
  },
  thresholds: {
    maxResponseTime: 1000,
    maxErrorRate: 0.01,
    minRps: 50,
  },
};

/**
 * Default benchmark configuration
 */
export const defaultBenchmarkConfig: BenchmarkConfig = {
  id: 'default-benchmark',
  name: 'Default Benchmark',
  urls: [],
  runs: 3,
  headless: true,
  device: 'desktop',
  network: {
    download: 5000,
    upload: 2000,
    latency: 28,
  },
  metrics: ['FCP', 'LCP', 'CLS', 'TTFB', 'TTI'],
};

/**
 * Collection of commonly used performance metrics
 */
export const PERFORMANCE_METRICS = {
  // Core Web Vitals
  LCP: {
    name: 'Largest Contentful Paint',
    unit: 'ms',
    good: 2500,
    needsImprovement: 4000,
  },
  FID: {
    name: 'First Input Delay',
    unit: 'ms',
    good: 100,
    needsImprovement: 300,
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    unit: '',
    good: 0.1,
    needsImprovement: 0.25,
  },
  
  // Other important metrics
  FCP: {
    name: 'First Contentful Paint',
    unit: 'ms',
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    name: 'Time to First Byte',
    unit: 'ms',
    good: 800,
    needsImprovement: 1800,
  },
  TTI: {
    name: 'Time to Interactive',
    unit: 'ms',
    good: 3800,
    needsImprovement: 7300,
  },
  TBT: {
    name: 'Total Blocking Time',
    unit: 'ms',
    good: 200,
    needsImprovement: 600,
  },
  SI: {
    name: 'Speed Index',
    unit: 'ms',
    good: 3400,
    needsImprovement: 5800,
  },
};

/**
 * Format a performance metric value with unit
 * @param value Metric value
 * @param unit Metric unit
 * @returns Formatted metric value
 */
export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'ms') {
    return `${value.toFixed(0)}ms`;
  } else if (unit === 's') {
    return `${value.toFixed(2)}s`;
  } else if (unit === '') {
    return value.toFixed(3);
  } else {
    return `${value.toFixed(2)}${unit}`;
  }
}

/**
 * Get the score range for a metric value
 * @param metricKey Metric key
 * @param value Metric value
 * @returns Score range ('good', 'needs-improvement', or 'poor')
 */
export function getMetricScoreRange(metricKey: keyof typeof PERFORMANCE_METRICS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const metric = PERFORMANCE_METRICS[metricKey];
  
  if (value <= metric.good) {
    return 'good';
  } else if (value <= metric.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Generate a URL-friendly ID from a string
 * @param str String to convert to ID
 * @returns URL-friendly ID
 */
export function generateId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Calculate average values for benchmark metrics
 * @param runs Benchmark runs with metrics
 * @returns Average values for each metric
 */
export function calculateAverageMetrics(runs: BenchmarkResult['runs']): BenchmarkResult['averages'] {
  const metrics = [
    'FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'TTI', 'TBT', 'SI'
  ] as const;
  
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  
  // Sum up all metrics across runs
  for (const run of runs) {
    for (const metric of metrics) {
      const value = run.metrics[metric];
      if (value !== undefined) {
        totals[metric] = (totals[metric] || 0) + value;
        counts[metric] = (counts[metric] || 0) + 1;
      }
    }
  }
  
  // Calculate averages
  const averages: Record<string, number | undefined> = {};
  for (const metric of metrics) {
    if (counts[metric]) {
      averages[metric] = totals[metric] / counts[metric];
    } else {
      averages[metric] = undefined;
    }
  }
  
  return averages as BenchmarkResult['averages'];
}

/**
 * Get color for a metric score range
 * @param scoreRange Score range
 * @returns Color hex code
 */
export function getMetricScoreColor(scoreRange: 'good' | 'needs-improvement' | 'poor'): string {
  switch (scoreRange) {
    case 'good':
      return '#0cce6b'; // Green
    case 'needs-improvement':
      return '#ffa400'; // Orange
    case 'poor':
      return '#ff4e42'; // Red
    default:
      return '#999999'; // Gray
  }
}
