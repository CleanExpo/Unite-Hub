/**
 * M1 Observability Orchestrator
 *
 * Unified observability platform coordinating monitoring, tracing, metrics,
 * and alerting across the entire distributed system
 *
 * Version: v3.1.0
 * Phase: 18A - Advanced Observability & Orchestration
 */

import { v4 as generateUUID } from 'uuid';

export type ObservabilityLevel = 'minimal' | 'standard' | 'comprehensive' | 'debug';
export type CorrelationScope = 'request' | 'transaction' | 'session' | 'system';
export type TelemetryType = 'metric' | 'trace' | 'log' | 'event' | 'profile';

/**
 * Trace correlation context
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  samplingDecision: boolean;
  scope: CorrelationScope;
  tags: Map<string, string>;
  baggage: Map<string, string>;
}

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  id: string;
  type: TelemetryType;
  timestamp: number;
  traceContext: TraceContext;
  name: string;
  attributes: Record<string, unknown>;
  duration?: number;
  error?: {
    type: string;
    message: string;
    stackTrace?: string;
  };
}

/**
 * Service topology node
 */
export interface ServiceNode {
  id: string;
  name: string;
  version: string;
  environment: string;
  instanceId: string;
  region: string;
  tags: Map<string, string>;
  dependencies: string[]; // service IDs
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastHeartbeat: number;
}

/**
 * Dependency relationship
 */
export interface DependencyEdge {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'message' | 'cache' | 'database';
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  throughput: number;
  lastUpdated: number;
}

/**
 * Service topology
 */
export interface ServiceTopology {
  nodes: Map<string, ServiceNode>;
  edges: Map<string, DependencyEdge>;
  lastUpdated: number;
}

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  level: ObservabilityLevel;
  samplingRate: number; // 0-1
  traceContextPropagation: boolean;
  metricsRetention: number; // milliseconds
  logsRetention: number;
  tracesRetention: number;
  enableServiceTopology: boolean;
  enableCorrelation: boolean;
  maxBaggageSize: number;
}

/**
 * Observability Orchestrator
 */
export class ObservabilityOrchestrator {
  private config: ObservabilityConfig;
  private telemetryEvents: Map<string, TelemetryEvent[]> = new Map();
  private traceContexts: Map<string, TraceContext> = new Map();
  private serviceTopology: ServiceTopology = {
    nodes: new Map(),
    edges: new Map(),
    lastUpdated: Date.now(),
  };
  private correlationContexts: Map<string, Map<string, unknown>> = new Map();
  private samplingRates: Map<string, number> = new Map();
  private eventStreamBuffers: Map<string, TelemetryEvent[]> = new Map();

  constructor(config?: Partial<ObservabilityConfig>) {
    this.config = {
      level: 'standard',
      samplingRate: 0.1,
      traceContextPropagation: true,
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      logsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
      tracesRetention: 24 * 60 * 60 * 1000, // 24 hours
      enableServiceTopology: true,
      enableCorrelation: true,
      maxBaggageSize: 4096, // 4KB
      ...config,
    };
  }

  /**
   * Create trace context
   */
  createTraceContext(
    scope: CorrelationScope = 'request',
    parentTraceId?: string,
    parentSpanId?: string
  ): TraceContext {
    const samplingDecision = Math.random() < this.config.samplingRate;

    const context: TraceContext = {
      traceId: parentTraceId || `trace_${generateUUID()}`,
      spanId: `span_${generateUUID()}`,
      parentSpanId,
      samplingDecision,
      scope,
      tags: new Map(),
      baggage: new Map(),
    };

    this.traceContexts.set(context.traceId, context);
    return context;
  }

  /**
   * Add tag to trace context
   */
  addTag(traceId: string, key: string, value: string): boolean {
    const context = this.traceContexts.get(traceId);
    if (!context) {
return false;
}

    context.tags.set(key, value);
    return true;
  }

  /**
   * Add baggage item
   */
  addBaggageItem(traceId: string, key: string, value: string): boolean {
    const context = this.traceContexts.get(traceId);
    if (!context) {
return false;
}

    const currentSize = Array.from(context.baggage.entries())
      .reduce((sum, [k, v]) => sum + k.length + v.length, 0);

    if (currentSize + key.length + value.length > this.config.maxBaggageSize) {
      return false;
    }

    context.baggage.set(key, value);
    return true;
  }

  /**
   * Record telemetry event
   */
  recordEvent(
    type: TelemetryType,
    name: string,
    traceId: string,
    attributes: Record<string, unknown>,
    duration?: number,
    error?: { type: string; message: string; stackTrace?: string }
  ): string {
    const context = this.traceContexts.get(traceId);
    if (!context) {
      return '';
    }

    // Check sampling decision
    if (!context.samplingDecision && type !== 'log') {
      return '';
    }

    const event: TelemetryEvent = {
      id: `event_${generateUUID()}`,
      type,
      timestamp: Date.now(),
      traceContext: context,
      name,
      attributes,
      duration,
      error,
    };

    // Store event
    const events = this.telemetryEvents.get(traceId) || [];
    events.push(event);
    this.telemetryEvents.set(traceId, events);

    // Add to stream buffer
    const buffer = this.eventStreamBuffers.get(traceId) || [];
    buffer.push(event);
    this.eventStreamBuffers.set(traceId, buffer);

    // Keep only last 1000 events per trace
    if (events.length > 1000) {
      events.shift();
    }

    return event.id;
  }

  /**
   * Register service node
   */
  registerServiceNode(
    name: string,
    version: string,
    environment: string,
    region: string,
    tags?: Map<string, string>,
    dependencies?: string[]
  ): string {
    const id = `svc_${generateUUID()}`;
    const instanceId = `${name}_${generateUUID()}`;

    const node: ServiceNode = {
      id,
      name,
      version,
      environment,
      instanceId,
      region,
      tags: tags || new Map(),
      dependencies: dependencies || [],
      health: 'healthy',
      lastHeartbeat: Date.now(),
    };

    this.serviceTopology.nodes.set(id, node);
    return id;
  }

  /**
   * Update service health
   */
  updateServiceHealth(
    serviceId: string,
    health: ServiceNode['health']
  ): boolean {
    const node = this.serviceTopology.nodes.get(serviceId);
    if (!node) {
return false;
}

    node.health = health;
    node.lastHeartbeat = Date.now();
    return true;
  }

  /**
   * Record dependency edge
   */
  recordDependency(
    source: string,
    target: string,
    type: DependencyEdge['type'],
    latencyP50: number,
    latencyP95: number,
    latencyP99: number,
    errorRate: number,
    throughput: number
  ): boolean {
    const sourceNode = this.serviceTopology.nodes.get(source);
    const targetNode = this.serviceTopology.nodes.get(target);

    if (!sourceNode || !targetNode) {
return false;
}

    // Update dependency list
    if (!sourceNode.dependencies.includes(target)) {
      sourceNode.dependencies.push(target);
    }

    // Create or update edge
    const edgeId = `${source}:${target}`;
    const edge: DependencyEdge = {
      source,
      target,
      type,
      latencyP50,
      latencyP95,
      latencyP99,
      errorRate,
      throughput,
      lastUpdated: Date.now(),
    };

    this.serviceTopology.edges.set(edgeId, edge);
    this.serviceTopology.lastUpdated = Date.now();

    return true;
  }

  /**
   * Get service topology
   */
  getServiceTopology(): ServiceTopology {
    return this.serviceTopology;
  }

  /**
   * Detect service mesh anomalies
   */
  detectTopologyAnomalies(): Array<{
    type: string;
    description: string;
    affectedServices: string[];
    severity: 'info' | 'warning' | 'error' | 'critical';
  }> {
    const anomalies: Array<{
      type: string;
      description: string;
      affectedServices: string[];
      severity: 'info' | 'warning' | 'error' | 'critical';
    }> = [];

    // Check for unhealthy services
    const unhealthyServices: string[] = [];
    for (const [id, node] of this.serviceTopology.nodes) {
      if (node.health === 'unhealthy') {
        unhealthyServices.push(id);
      }
    }

    if (unhealthyServices.length > 0) {
      anomalies.push({
        type: 'unhealthy_services',
        description: `${unhealthyServices.length} services are unhealthy`,
        affectedServices: unhealthyServices,
        severity: 'critical',
      });
    }

    // Check for high error rates
    const highErrorEdges: string[] = [];
    for (const [edgeId, edge] of this.serviceTopology.edges) {
      if (edge.errorRate > 0.1) {
        // 10% threshold
        highErrorEdges.push(`${edge.source} → ${edge.target}`);
      }
    }

    if (highErrorEdges.length > 0) {
      anomalies.push({
        type: 'high_error_rate',
        description: `${highErrorEdges.length} service dependencies have high error rates`,
        affectedServices: highErrorEdges,
        severity: 'warning',
      });
    }

    // Check for missing heartbeats
    const now = Date.now();
    const heartbeatTimeout = 5 * 60 * 1000; // 5 minutes
    const missingHeartbeat: string[] = [];

    for (const [id, node] of this.serviceTopology.nodes) {
      if (now - node.lastHeartbeat > heartbeatTimeout) {
        missingHeartbeat.push(id);
      }
    }

    if (missingHeartbeat.length > 0) {
      anomalies.push({
        type: 'missing_heartbeat',
        description: `${missingHeartbeat.length} services missed heartbeat`,
        affectedServices: missingHeartbeat,
        severity: 'error',
      });
    }

    return anomalies;
  }

  /**
   * Create correlation context
   */
  createCorrelationContext(contextId?: string): string {
    const id = contextId || `ctx_${generateUUID()}`;
    this.correlationContexts.set(id, new Map());
    return id;
  }

  /**
   * Bind value to correlation context
   */
  bindToContext(contextId: string, key: string, value: unknown): boolean {
    const context = this.correlationContexts.get(contextId);
    if (!context) {
return false;
}

    context.set(key, value);
    return true;
  }

  /**
   * Get correlation context value
   */
  getContextValue(contextId: string, key: string): unknown {
    const context = this.correlationContexts.get(contextId);
    if (!context) {
return undefined;
}

    return context.get(key);
  }

  /**
   * Get all events for trace
   */
  getTraceEvents(traceId: string): TelemetryEvent[] {
    return this.telemetryEvents.get(traceId) || [];
  }

  /**
   * Get event stream buffer
   */
  getEventStreamBuffer(traceId: string): TelemetryEvent[] {
    const buffer = this.eventStreamBuffers.get(traceId) || [];
    // Clear buffer after retrieving
    this.eventStreamBuffers.set(traceId, []);
    return buffer;
  }

  /**
   * Calculate trace latency
   */
  calculateTraceLatency(traceId: string): { total: number; byType: Record<string, number> } {
    const events = this.telemetryEvents.get(traceId) || [];

    if (events.length === 0) {
      return { total: 0, byType: {} };
    }

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const total = lastEvent.timestamp - firstEvent.timestamp;

    const byType: Record<string, number> = {};
    for (const event of events) {
      if (event.duration) {
        byType[event.type] = (byType[event.type] || 0) + event.duration;
      }
    }

    return { total, byType };
  }

  /**
   * Get observability statistics
   */
  getStatistics(): Record<string, unknown> {
    const allEvents = Array.from(this.telemetryEvents.values()).flat();
    const errorEvents = allEvents.filter((e) => e.error);

    return {
      totalTraces: this.traceContexts.size,
      totalEvents: allEvents.length,
      totalErrors: errorEvents.length,
      errorRate: allEvents.length > 0 ? errorEvents.length / allEvents.length : 0,
      registeredServices: this.serviceTopology.nodes.size,
      serviceDependencies: this.serviceTopology.edges.size,
      correlationContexts: this.correlationContexts.size,
      eventsByType: {
        metrics: allEvents.filter((e) => e.type === 'metric').length,
        traces: allEvents.filter((e) => e.type === 'trace').length,
        logs: allEvents.filter((e) => e.type === 'log').length,
        events: allEvents.filter((e) => e.type === 'event').length,
        profiles: allEvents.filter((e) => e.type === 'profile').length,
      },
    };
  }

  /**
   * Shutdown orchestrator
   */
  shutdown(): void {
    this.telemetryEvents.clear();
    this.traceContexts.clear();
    this.correlationContexts.clear();
    this.eventStreamBuffers.clear();
  }
}

// Export singleton
export const observabilityOrchestrator = new ObservabilityOrchestrator();
