/**
 * Metrics Ingestion Module
 * Unified exports for webhook processing, attribution, and metrics aggregation
 */

export {
  type MetricsProvider,
  type MetricsEventType,
  type AttributionStatus,
  type MetricsChannel,
  type WebhookEvent,
  type AttributionMap,
  type MetricsRollup,
  type BackfillJob,
  type NormalizedEvent,
  type AttributionInput,
  type ProviderConfig,
  type VerificationResult,
  type RollupFilters,
  type AttributionHealthSummary,
  type MetricsSummary,
  type BackfillRequest,
  type BackfillResponse,
  DEFAULT_METRICS_GUARDRAILS,
  PROVIDER_WEBHOOK_HEADERS,
  PROVIDER_EVENT_MAPPINGS,
} from './metrics-types';

export {
  verifyWebhookSignature,
  getProviderSecret,
} from './metrics-signatures';

export {
  normalizeProviderEvent,
  upsertAttributionMap,
  findAttributionMapping,
  getAttributionHealth,
  hashEmail,
  normalizeProviderEvents,
} from './metrics-attribution';

export {
  applyEventToRollups,
  computeDerivedMetrics,
  getRollups,
  getRollupSummary,
  recalculateDerivedMetrics,
  applyEventsToRollups,
} from './metrics-rollup';

export {
  ingestWebhookEvent,
  ingestWebhookEvents,
  reprocessUnprocessedWebhooks,
  enqueueBackfill,
  markForReprocessing,
  getIngestionHealth,
} from './metrics-ingestion';
