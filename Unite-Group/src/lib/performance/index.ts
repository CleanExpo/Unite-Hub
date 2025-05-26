/**
 * Performance Module
 * 
 * This is the main entry point for performance optimization functionality.
 * It exports all performance-related configurations, utilities, and components.
 */

// Export resource optimization
export type {
  Resource,
  ResourceType,
  ResourcePriority,
  LoadingStrategy,
  ResourceOptimizerConfig
} from './resource-optimizer';

export {
  defaultResourceOptimizerConfig,
  getResourceOptimizerConfig,
  setResourceOptimizerConfig,
  generateResourceHints,
  generateScriptTags,
  generateStyleTags,
  generateFontOptimizations,
  generateOptimizedResources,
  isMobileUserAgent,
  filterResourcesByConditions
} from './resource-optimizer';

// Export load testing and benchmarking
export type {
  LoadTestConfig,
  PerformanceMetric,
  LoadTestResult,
  BenchmarkConfig,
  BenchmarkResult
} from './load-testing';

export {
  defaultLoadTestConfig,
  defaultBenchmarkConfig,
  PERFORMANCE_METRICS,
  formatMetricValue,
  getMetricScoreRange,
  getMetricScoreColor,
  generateId,
  calculateAverageMetrics
} from './load-testing';

// Export bundle optimization
export type {
  BundleOptimizerConfig,
  DynamicComponentImport
} from './bundle-optimizer';

export {
  defaultBundleOptimizerConfig,
  getBundleOptimizerConfig,
  setBundleOptimizerConfig,
  dynamicImport,
  generateDifferentialLoadingTags,
  generateRoutePrefetchTags,
  createBundleSplitPoint,
  preloadComponent,
  shouldDynamicImport,
  shouldIncludeInMainBundle
} from './bundle-optimizer';

// Re-export components
export { default as ResourceOptimizer } from '../../components/performance/ResourceOptimizer';
export { 
  createResource, 
  COMMON_RESOURCES, 
  getMainSiteResources, 
  getDashboardResources,
  DEFAULT_ROUTE_RESOURCES
} from '../../components/performance/ResourceOptimizer';

export { default as BenchmarkResults } from '../../components/performance/BenchmarkResults';
