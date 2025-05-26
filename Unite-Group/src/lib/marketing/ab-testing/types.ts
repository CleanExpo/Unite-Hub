/**
 * A/B Testing Types
 * Type definitions for A/B testing functionality
 */

/**
 * Test variation identifier
 */
export type VariationId = 'control' | 'variant' | string;

/**
 * A/B test status
 */
export type TestStatus = 'draft' | 'running' | 'paused' | 'completed';

/**
 * Metric type for measuring test results
 */
export type MetricType = 
  | 'pageview'
  | 'click'
  | 'conversion'
  | 'engagement'
  | 'custom';

/**
 * Configuration for a test variation
 */
export interface TestVariation {
  id: VariationId;
  name: string;
  description?: string;
  weight?: number; // Traffic allocation (0-100)
  isControl?: boolean;
}

/**
 * Configuration for a test metric
 */
export interface TestMetric {
  id: string;
  name: string;
  type: MetricType;
  selector?: string; // CSS selector for click metrics
  eventName?: string; // Custom event name
  goal?: number; // Target value
  primary?: boolean; // Is this the primary metric?
}

/**
 * Test audience targeting options
 */
export interface TestAudience {
  newVisitors?: boolean;
  returningVisitors?: boolean;
  deviceTypes?: ('desktop' | 'tablet' | 'mobile')[];
  browserTypes?: string[];
  locationCountries?: string[];
  customSegment?: string;
  urlPattern?: string;
  referrerPattern?: string;
}

/**
 * A/B Test configuration
 */
export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: TestStatus;
  variations: TestVariation[];
  metrics: TestMetric[];
  audience?: TestAudience;
  startDate?: string;
  endDate?: string;
  minSampleSize?: number;
  confidenceLevel?: number; // e.g., 0.95 for 95% confidence
  createdAt: string;
  updatedAt: string;
}

/**
 * Metric results for a variation
 */
export interface VariationMetricResult {
  metricId: string;
  count: number;
  conversionRate: number;
  improvement?: number; // Relative to control
  confidence?: number; // Statistical confidence (0-1)
  hasReachedSignificance?: boolean;
}

/**
 * Results for a single variation
 */
export interface VariationResult {
  variationId: VariationId;
  visitors: number;
  metrics: Record<string, VariationMetricResult>;
}

/**
 * Results for an A/B test
 */
export interface ABTestResult {
  testId: string;
  status: TestStatus;
  startDate: string;
  endDate?: string;
  totalVisitors: number;
  hasReachedSampleSize: boolean;
  winner?: VariationId;
  variations: Record<VariationId, VariationResult>;
  lastUpdated: string;
}

/**
 * Assignment of a user to a variation
 */
export interface VariationAssignment {
  testId: string;
  variationId: VariationId;
  assignedAt: string;
  visitorId: string;
  anonymous: boolean;
  metadata?: Record<string, any>;
}

/**
 * Event tracking for metrics
 */
export interface MetricEvent {
  testId: string;
  variationId: VariationId;
  metricId: string;
  visitorId: string;
  eventType: MetricType;
  value?: number;
  timestamp: string;
  url?: string;
  metadata?: Record<string, any>;
}
