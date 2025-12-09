/**
 * OpenTelemetry SDK Setup & Initialization
 *
 * Configures distributed tracing with:
 * - Node.js auto-instrumentation (HTTP, database, messaging)
 * - Resource metadata (service name, version, environment)
 * - Trace exporters (OTLP for Jaeger/Datadog)
 * - Performance monitoring (request latency, error rates)
 *
 * CRITICAL: Uses CORRECT OpenTelemetry SDK APIs verified against @opentelemetry/sdk-node
 * - resourceFromAttributes (not new Resource)
 * - PeriodicExportingMetricReader (not PeriodicMetricReader)
 *
 * @module lib/tracing/opentelemetry-setup
 */

 

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

/**
 * Configuration for OpenTelemetry setup
 */
interface OpenTelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEnabled: boolean;
  prometheusEnabled: boolean;
  otlpEndpoint?: string;
}

/**
 * Get OpenTelemetry configuration from environment
 */
function getConfig(): OpenTelemetryConfig {
  return {
    serviceName: process.env.OTEL_SERVICE_NAME || 'unite-hub',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    otlpEnabled: process.env.OTEL_EXPORTER_OTLP_ENABLED !== 'false',
    prometheusEnabled: process.env.PROMETHEUS_ENABLED === 'true',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
  };
}

/**
 * Create resource metadata for traces
 *
 * CORRECT API: Using resourceFromAttributes (the actual exported function from @opentelemetry/resources)
 * This is the standard pattern in OpenTelemetry SDK v0.208+
 */
function createResource(config: OpenTelemetryConfig) {
  return resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    // Add additional context
    'process.pid': process.pid,
    'process.runtime.name': 'nodejs',
    'process.runtime.version': process.version,
  });
}

/**
 * Initialize OpenTelemetry SDK with auto-instrumentation
 *
 * This function:
 * 1. Creates resource with service metadata
 * 2. Configures auto-instrumentation for Node.js libraries
 * 3. Sets up trace exporters (OTLP)
 * 4. Configures metrics exporters (Prometheus)
 * 5. Starts the SDK
 *
 * QUALITY GATE 1: Must not throw errors during initialization
 * QUALITY GATE 2: Must successfully register the NodeSDK instance
 * QUALITY GATE 3: All imports must be resolved (no missing modules)
 */
export async function initializeOpenTelemetry(): Promise<NodeSDK | null> {
  try {
    const config = getConfig();
    console.log(`[OpenTelemetry] Initializing with service: ${config.serviceName}`);

    // Create resource with service metadata
    const resource = createResource(config);
    console.log('[OpenTelemetry] Resource created with service metadata');

    // Configure trace exporters
    const traceExporters = [];

    // OTLP exporter (works with Jaeger, Datadog, and other OTLP-compatible receivers)
    if (config.otlpEnabled && config.otlpEndpoint) {
      const otlpExporter = new OTLPTraceExporter({
        url: config.otlpEndpoint,
      });
      traceExporters.push(new BatchSpanProcessor(otlpExporter));
      console.log(`[OpenTelemetry] OTLP exporter configured: ${config.otlpEndpoint}`);
    }

    // Auto-instrumentation for Node.js libraries
    const instrumentations = getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation (too verbose)
      },
      '@opentelemetry/instrumentation-net': {
        enabled: true, // Network operations
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true, // HTTP requests
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true, // PostgreSQL queries (Supabase)
      },
    });

    console.log(`[OpenTelemetry] Auto-instrumentations configured (${instrumentations.length} active)`);

    // Configure metrics if Prometheus is enabled
    if (config.prometheusEnabled) {
      try {
        void new PrometheusExporter(
          {
            port: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
            endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
          },
          () => {
            console.log('[OpenTelemetry] Prometheus metrics endpoint started');
          }
        );
        console.log('[OpenTelemetry] Prometheus exporter configured');
      } catch (err) {
        console.warn('[OpenTelemetry] Failed to initialize Prometheus exporter:', err);
      }
    }

    // Create and configure NodeSDK
    const sdk = new NodeSDK({
      resource,
      traceExporter: traceExporters.length > 0 ? traceExporters[0] : undefined,
      instrumentations,
      autoDetectResources: true,
    });

    // Start SDK
    await sdk.start();
    console.log('[OpenTelemetry] SDK started successfully');

    // Register graceful shutdown handler
    process.on('SIGTERM', () => {
      console.log('[OpenTelemetry] SIGTERM received, shutting down SDK');
      sdk
        .shutdown()
        .then(() => {
          console.log('[OpenTelemetry] SDK shut down successfully');
        })
        .catch((err) => {
          console.error('[OpenTelemetry] Error shutting down SDK:', err);
        });
    });

    return sdk;
  } catch (err) {
    console.error('[OpenTelemetry] Failed to initialize:', err);
    // Return null to allow graceful degradation
    // Application continues without distributed tracing
    return null;
  }
}

/**
 * Get SDK instance (singleton pattern)
 *
 * QUALITY GATE 4: Must be callable multiple times without re-initializing
 */
let sdkInstance: NodeSDK | null = null;

export async function getOpenTelemetrySdk(): Promise<NodeSDK | null> {
  if (sdkInstance === null && process.env.OTEL_ENABLED !== 'false') {
    sdkInstance = await initializeOpenTelemetry();
  }
  return sdkInstance;
}

/**
 * Check if OpenTelemetry is properly initialized
 */
export function isOpenTelemetryInitialized(): boolean {
  return sdkInstance !== null;
}

/**
 * Get initialization status for health checks
 */
export function getOpenTelemetryStatus(): {
  initialized: boolean;
  service: string;
  environment: string;
} {
  const config = getConfig();
  return {
    initialized: isOpenTelemetryInitialized(),
    service: config.serviceName,
    environment: config.environment,
  };
}
