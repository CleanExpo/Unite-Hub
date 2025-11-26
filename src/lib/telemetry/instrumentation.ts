/**
 * OpenTelemetry Instrumentation
 * Enterprise-grade distributed tracing and APM
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const {
  NODE_ENV = 'development',
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_SERVICE_NAME = 'unite-hub',
  OTEL_SERVICE_VERSION = '1.0.0',
  ENABLE_TELEMETRY = 'true',
} = process.env;

const telemetryEnabled = ENABLE_TELEMETRY === 'true' && (NODE_ENV === 'production' || OTEL_EXPORTER_OTLP_ENDPOINT);

let sdk: NodeSDK | null = null;

export function initializeTelemetry() {
  if (!telemetryEnabled) {
    console.log('[Telemetry] Disabled');
    return;
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: OTEL_SERVICE_VERSION,
        environment: NODE_ENV,
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingPaths: ['/api/health', '/healthz', '/_next'],
          },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
    console.log('[Telemetry] OpenTelemetry initialized');
  } catch (error) {
    console.error('[Telemetry] Failed to initialize:', error);
  }
}

export async function shutdownTelemetry() {
  if (sdk) {
    await sdk.shutdown();
  }
}

if (typeof window === 'undefined') {
  initializeTelemetry();
}
