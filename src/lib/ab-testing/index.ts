/**
 * A/B Testing Framework
 *
 * Statistical analysis and winner selection for campaign A/B tests
 *
 * @module ab-testing
 */

// Statistical Analysis
export {
  analyzeABTest,
  calculateRequiredSampleSize,
  type VariantMetrics,
  type StatisticalTestResult,
  type ABTestAnalysis,
} from './StatisticalAnalysis';

// A/B Test Manager
export {
  calculateVariantMetrics,
  analyzeTest,
  declareWinner,
  updateTestMetrics,
  autoCheckAndDeclareWinner,
  getTestResults,
  type ABTestMetrics,
  type WinnerSelection,
} from './ABTestManager';
