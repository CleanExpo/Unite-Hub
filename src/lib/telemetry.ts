import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;

export function initTelemetry() {
  if (sdk) return sdk;

  // Only initialize in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_TELEMETRY !== 'true') {
    console.log('📊 Telemetry disabled (set ENABLE_TELEMETRY=true to enable in dev)');
    return null;
  }

  const prometheusExporter = new PrometheusExporter({
    port: 9464, // Prometheus exporter port
  }, () => {
    console.log('📊 Prometheus exporter started on port 9464');
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'unite-hub',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Customize which instrumentations to enable
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log('✅ OpenTelemetry initialized');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    try {
      await sdk?.shutdown();
      console.log('✅ OpenTelemetry shut down successfully');
    } catch (error) {
      console.error('❌ Error shutting down OpenTelemetry', error);
    }
  });

  return sdk;
}

// Export for manual instrumentation
export { trace, context, SpanStatusCode } from '@opentelemetry/api';
