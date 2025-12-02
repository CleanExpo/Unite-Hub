/**
 * Trace Export and Sampling
 *
 * Handles exporting traces to monitoring backends and implements sampling strategies:
 * - Head-based sampling: Sampling decision made at trace initiation
 * - Tail-based sampling: Sampling decision made after trace completion
 * - Per-operation sampling: Different sampling rates for different operation types
 * - Adaptive sampling: Adjusts rates based on error rates and latency
 *
 * Integrates with:
 * - OpenTelemetry Collector
 * - APM platforms (Datadog, New Relic, etc.)
 * - Performance metrics system
 * - Trace context propagation
 *
 * @module lib/tracing/trace-export
 */

/* eslint-disable no-console, no-undef */
/* global process, setInterval, clearInterval */

import { getTraceContext } from './trace-context';
import { getPerformanceMetrics } from './performance-metrics';

/**
 * Trace sample decision
 */
export interface TraceSampleDecision {
  sampled: boolean;
  reason: string; // Why this trace was sampled or not
  samplingRate: number; // Applied sampling rate (0-1)
}

/**
 * Exported trace record for backend ingestion
 */
export interface ExportedTrace {
  traceId: string;
  spanId: string;
  requestId: string;
  operationType: string;
  operationName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
  tags: Record<string, string | number | boolean>;
  metrics: {
    latency: number;
    errorRate: number;
    memoryMb: number;
  };
  sampleDecision: TraceSampleDecision;
  timestamp: number;
}

/**
 * Sampling strategy configuration
 */
export interface SamplingConfig {
  /**
   * Base sampling rate (0-1)
   * Default: 0.1 (10% of traces)
   */
  baseRate: number;

  /**
   * Always sample traces with errors
   * Default: true
   */
  alwaysSampleErrors: boolean;

  /**
   * Always sample slow operations (> latencyThreshold)
   * Default: true
   */
  alwaysSampleSlow: boolean;

  /**
   * Latency threshold for mandatory sampling (milliseconds)
   * Default: 1000ms
   */
  latencyThreshold: number;

  /**
   * Per-operation sampling rates
   * Can override baseRate for specific operations
   */
  operationRates: Record<string, number>;

  /**
   * Enable adaptive sampling based on health
   * Default: true
   */
  adaptiveMode: boolean;

  /**
   * Adaptive sampling: multiply rate when system is unhealthy
   * Default: 2.0 (double sampling rate if health < 70)
   */
  adaptiveMultiplier: number;

  /**
   * Environment name for filtering/tagging
   * Default: process.env.NODE_ENV
   */
  environment: string;

  /**
   * Service name for backend identification
   * Default: 'unite-hub'
   */
  serviceName: string;
}

/**
 * Default sampling configuration
 */
const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  baseRate: 0.1,
  alwaysSampleErrors: true,
  alwaysSampleSlow: true,
  latencyThreshold: 1000,
  operationRates: {
    'http.request': 0.1,
    'db.query': 0.05,
    'error.boundary': 0.5, // Higher rate for errors
  },
  adaptiveMode: true,
  adaptiveMultiplier: 2.0,
  environment: process.env.NODE_ENV || 'development',
  serviceName: 'unite-hub',
};

/**
 * Trace export backend interface
 */
export interface TraceExportBackend {
  name: string;
  export(trace: ExportedTrace): Promise<boolean>;
  isHealthy(): Promise<boolean>;
}

/**
 * In-memory trace buffer with batch export
 */
class TraceExporter {
  private config: SamplingConfig;
  private backends: TraceExportBackend[] = [];
  private traceBuffer: ExportedTrace[] = [];
  private maxBufferSize: number = 1000;
  private batchSize: number = 100;
  private exportInterval: number = 30000; // 30 seconds
  private exportTimer: NodeJS.Timeout | null = null;
  private totalExported: number = 0;
  private totalDropped: number = 0;

  constructor(config: Partial<SamplingConfig> = {}) {
    this.config = { ...DEFAULT_SAMPLING_CONFIG, ...config };
  }

  /**
   * Register a trace export backend
   *
   * QUALITY GATE 1: Must support multiple backends for redundancy
   */
  registerBackend(backend: TraceExportBackend): void {
    try {
      this.backends.push(backend);
      console.log(`[TraceExport] Registered backend: ${backend.name}`);
    } catch (error) {
      console.error('[TraceExport] Error registering backend:', error);
    }
  }

  /**
   * Make head-based sampling decision at trace initiation
   *
   * QUALITY GATE 2: Decision must be made consistently based on trace ID
   */
  makeHeadSamplingDecision(
    operationType: string,
    _operationName: string
  ): TraceSampleDecision {
    try {
      const context = getTraceContext();
      if (!context) {
        return {
          sampled: false,
          reason: 'no_trace_context',
          samplingRate: 0,
        };
      }

      // Check operation-specific rate
      const operationRate = this.config.operationRates[operationType] ?? this.config.baseRate;
      const hash = this.hashTraceId(context.traceId);
      const isSampled = hash < operationRate;

      return {
        sampled: isSampled,
        reason: 'head_sampling',
        samplingRate: operationRate,
      };
    } catch (error) {
      console.error('[TraceExport] Error making sampling decision:', error);
      return {
        sampled: false,
        reason: 'error',
        samplingRate: 0,
      };
    }
  }

  /**
   * Make tail-based sampling decision after trace completion
   *
   * QUALITY GATE 3: Must factor in error status and latency
   */
  makeTailSamplingDecision(
    operationType: string,
    operationName: string,
    status: 'success' | 'error',
    latency: number
  ): TraceSampleDecision {
    try {
      const context = getTraceContext();
      if (!context) {
        return {
          sampled: false,
          reason: 'no_trace_context',
          samplingRate: 0,
        };
      }

      let samplingRate = this.config.operationRates[operationType] ?? this.config.baseRate;

      // Always sample errors if configured
      if (status === 'error' && this.config.alwaysSampleErrors) {
        return {
          sampled: true,
          reason: 'error_trace',
          samplingRate: 1.0,
        };
      }

      // Always sample slow operations if configured
      if (latency > this.config.latencyThreshold && this.config.alwaysSampleSlow) {
        return {
          sampled: true,
          reason: 'slow_operation',
          samplingRate: 1.0,
        };
      }

      // Adaptive sampling based on system health
      if (this.config.adaptiveMode) {
        const health = getPerformanceMetrics().calculateHealthScore();
        if (health.overall < 70) {
          samplingRate = Math.min(1.0, samplingRate * this.config.adaptiveMultiplier);
        }
      }

      const hash = this.hashTraceId(context.traceId);
      const isSampled = hash < samplingRate;

      return {
        sampled: isSampled,
        reason: 'tail_sampling',
        samplingRate: samplingRate,
      };
    } catch (error) {
      console.error('[TraceExport] Error in tail sampling:', error);
      return {
        sampled: false,
        reason: 'error',
        samplingRate: 0,
      };
    }
  }

  /**
   * Export a completed trace
   *
   * QUALITY GATE 4: Must handle buffer overflow and batch processing
   * QUALITY GATE 5: Must never throw during export
   */
  exportTrace(
    operationType: string,
    operationName: string,
    startTime: number,
    endTime: number,
    status: 'success' | 'error',
    statusCode?: number,
    errorMessage?: string,
    tags: Record<string, string | number | boolean> = {}
  ): void {
    try {
      const context = getTraceContext();
      if (!context) {
        return;
      }

      const latency = endTime - startTime;
      const sampleDecision = this.makeTailSamplingDecision(
        operationType,
        operationName,
        status,
        latency
      );

      // Skip if not sampled
      if (!sampleDecision.sampled) {
        this.totalDropped++;
        return;
      }

      const metrics = getPerformanceMetrics().getSnapshot();

      const trace: ExportedTrace = {
        traceId: context.traceId,
        spanId: context.spanId,
        requestId: context.requestId,
        operationType,
        operationName,
        startTime,
        endTime,
        durationMs: latency,
        status,
        statusCode,
        errorMessage,
        tags: {
          ...tags,
          environment: this.config.environment,
          service: this.config.serviceName,
        },
        metrics: {
          latency,
          errorRate: metrics.health.errorRate,
          memoryMb: metrics.resourceUsage.memoryMb,
        },
        sampleDecision,
        timestamp: Date.now(),
      };

      // Add to buffer
      this.traceBuffer.push(trace);

      // Handle buffer overflow
      if (this.traceBuffer.length > this.maxBufferSize) {
        this.traceBuffer = this.traceBuffer.slice(-this.maxBufferSize);
      }

      // Auto-export if batch size reached
      if (this.traceBuffer.length >= this.batchSize) {
        this.flushBuffer().catch((error) => {
          console.error('[TraceExport] Error flushing buffer:', error);
        });
      }
    } catch (error) {
      // QUALITY GATE 5: Never throw
      console.error('[TraceExport] Error exporting trace:', error);
    }
  }

  /**
   * Flush buffered traces to all backends
   */
  async flushBuffer(): Promise<boolean> {
    try {
      if (this.traceBuffer.length === 0) {
        return true;
      }

      const tracesToExport = this.traceBuffer.splice(0, this.batchSize);
      let successCount = 0;

      for (const backend of this.backends) {
        try {
          const isHealthy = await backend.isHealthy();
          if (!isHealthy) {
            console.warn(`[TraceExport] Backend ${backend.name} is unhealthy`);
            continue;
          }

          for (const trace of tracesToExport) {
            const success = await backend.export(trace);
            if (success) {
              successCount++;
              this.totalExported++;
            }
          }
        } catch (error) {
          console.error(`[TraceExport] Error exporting to ${backend.name}:`, error);
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('[TraceExport] Error flushing buffer:', error);
      return false;
    }
  }

  /**
   * Start periodic export
   */
  startPeriodicExport(): void {
    try {
      if (this.exportTimer) {
        return; // Already running
      }

      this.exportTimer = setInterval(() => {
        this.flushBuffer().catch((error) => {
          console.error('[TraceExport] Error in periodic export:', error);
        });
      }, this.exportInterval);

      console.log('[TraceExport] Periodic export started');
    } catch (error) {
      console.error('[TraceExport] Error starting periodic export:', error);
    }
  }

  /**
   * Stop periodic export
   */
  stopPeriodicExport(): void {
    try {
      if (this.exportTimer) {
        clearInterval(this.exportTimer);
        this.exportTimer = null;
        console.log('[TraceExport] Periodic export stopped');
      }
    } catch (error) {
      console.error('[TraceExport] Error stopping periodic export:', error);
    }
  }

  /**
   * Get exporter metrics
   */
  getMetrics() {
    return {
      bufferedTraces: this.traceBuffer.length,
      totalExported: this.totalExported,
      totalDropped: this.totalDropped,
      backends: this.backends.map((b) => b.name),
      droppedRate: this.totalDropped / (this.totalExported + this.totalDropped || 1),
    };
  }

  /**
   * Hash trace ID to determine sampling (0-1 range)
   * Ensures consistent sampling across requests
   */
  private hashTraceId(traceId: string): number {
    let hash = 0;
    for (let i = 0; i < Math.min(traceId.length, 8); i++) {
      const char = traceId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 100) / 100; // Return 0-1
  }

  /**
   * Reset metrics for testing
   */
  reset(): void {
    this.traceBuffer = [];
    this.totalExported = 0;
    this.totalDropped = 0;
  }
}

/**
 * Global trace exporter instance
 */
let traceExporter: TraceExporter | null = null;

/**
 * Initialize trace exporter
 */
export function initializeTraceExporter(
  config?: Partial<SamplingConfig>
): TraceExporter {
  if (!traceExporter) {
    traceExporter = new TraceExporter(config);
  }
  return traceExporter;
}

/**
 * Get trace exporter instance
 */
export function getTraceExporter(): TraceExporter {
  if (!traceExporter) {
    traceExporter = new TraceExporter();
  }
  return traceExporter;
}

/**
 * Export a trace
 */
export function exportTrace(
  operationType: string,
  operationName: string,
  startTime: number,
  endTime: number,
  status: 'success' | 'error',
  statusCode?: number,
  errorMessage?: string,
  tags?: Record<string, string | number | boolean>
): void {
  getTraceExporter().exportTrace(
    operationType,
    operationName,
    startTime,
    endTime,
    status,
    statusCode,
    errorMessage,
    tags
  );
}

/**
 * Flush pending traces
 */
export async function flushTraces(): Promise<boolean> {
  return getTraceExporter().flushBuffer();
}

/**
 * Start periodic trace export
 */
export function startTraceExport(): void {
  getTraceExporter().startPeriodicExport();
}

/**
 * Stop periodic trace export
 */
export function stopTraceExport(): void {
  getTraceExporter().stopPeriodicExport();
}

/**
 * Get exporter health
 */
export function getTraceExporterMetrics() {
  return getTraceExporter().getMetrics();
}

/**
 * Reset exporter (for testing)
 */
export function resetTraceExporter(): void {
  getTraceExporter().reset();
}
