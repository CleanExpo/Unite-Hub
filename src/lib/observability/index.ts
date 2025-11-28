/**
 * Observability Module Index
 *
 * Export all observability utilities for easy import
 */

// ML Detector
export {
  mlDetector,
  startTiming,
  withObservability as withObservabilityWrapper,
  type RequestMetrics,
  type AnomalyDetection,
  type HealthScore,
} from './mlDetector';

// Middleware
export {
  withObservability,
  withMetrics,
  // Error helpers
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  // Success helpers
  ok,
  created,
  noContent,
  type ObservabilityOptions,
  type RouteHandler,
  type AuthenticatedRouteHandler,
} from './middleware';
