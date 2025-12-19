/**
 * M1 Service Mesh
 *
 * Service-to-service communication management with traffic control, observability, and resilience
 * Implements mTLS, traffic policies, and distributed tracing integration
 *
 * Version: v2.7.0
 * Phase: 13B - Service Mesh
 */

export type MutualTLSMode = 'STRICT' | 'PERMISSIVE' | 'DISABLED';
export type TrafficPolicyType = 'CIRCUIT_BREAKER' | 'RETRY' | 'TIMEOUT' | 'LOAD_BALANCING';
export type ServiceState = 'available' | 'degraded' | 'unavailable';

/**
 * Virtual service configuration
 */
export interface VirtualService {
  id: string;
  name: string;
  namespace: string;
  hosts: string[];
  http: HTTPRoute[];
  tls: TLSRoute[];
  tcp: TCPRoute[];
  createdAt: number;
  updatedAt: number;
}

/**
 * HTTP route configuration
 */
export interface HTTPRoute {
  name: string;
  match?: {
    uri?: { exact?: string; prefix?: string; regex?: string };
    headers?: Record<string, string>;
    sourceLabels?: Record<string, string>;
  };
  route: {
    destination: {
      host: string;
      port?: { number: number; name?: string };
      subset?: string;
    };
    weight?: number;
  }[];
  timeout?: string; // e.g., "10s"
  retries?: {
    attempts: number;
    perTryTimeout: string;
  };
}

/**
 * TLS route configuration
 */
export interface TLSRoute {
  match: { port: number; sniHosts?: string[] };
  route: {
    destination: {
      host: string;
      port?: { number: number };
      subset?: string;
    };
    weight?: number;
  }[];
}

/**
 * TCP route configuration
 */
export interface TCPRoute {
  match: { port: number };
  route: {
    destination: {
      host: string;
      port?: { number: number };
      subset?: string;
    };
    weight?: number;
  }[];
}

/**
 * Destination rule
 */
export interface DestinationRule {
  id: string;
  name: string;
  namespace: string;
  host: string;
  trafficPolicy?: TrafficPolicy;
  subsets?: {
    name: string;
    labels: Record<string, string>;
    trafficPolicy?: TrafficPolicy;
  }[];
  exportTo?: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Traffic policy
 */
export interface TrafficPolicy {
  connectionPool?: {
    tcp?: { maxConnections: number };
    http?: { http1MaxPendingRequests: number; maxRequestsPerConnection: number };
  };
  loadBalancer?: {
    simple: 'ROUND_ROBIN' | 'LEAST_REQUEST' | 'RANDOM' | 'PASSTHROUGH';
  };
  outlierDetection?: {
    consecutive5xxErrors: number;
    interval: string; // e.g., "30s"
    baseEjectionTime: string; // e.g., "30s"
    maxEjectionPercent: number;
    minEjectionDuration: string; // e.g., "30s"
  };
  tls?: {
    mode: MutualTLSMode;
    clientCertificate?: string;
    privateKey?: string;
    caCertificates?: string;
    sni?: string;
  };
}

/**
 * Service entry for external services
 */
export interface ServiceEntry {
  id: string;
  name: string;
  namespace: string;
  hosts: string[];
  addresses?: string[];
  ports: { name: string; number: number; protocol: string }[];
  location: 'MESH_INTERNAL' | 'MESH_EXTERNAL';
  resolution: 'NONE' | 'STATIC' | 'DNS';
  createdAt: number;
  updatedAt: number;
}

/**
 * Service health status
 */
export interface ServiceHealth {
  serviceId: string;
  state: ServiceState;
  readyEndpoints: number;
  totalEndpoints: number;
  lastProbeTime: number;
  conditions: { name: string; status: boolean; message: string }[];
}

/**
 * Service Mesh
 */
export class ServiceMesh {
  private virtualServices: Map<string, VirtualService> = new Map();
  private destinationRules: Map<string, DestinationRule> = new Map();
  private serviceEntries: Map<string, ServiceEntry> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private mtlsConfig: Map<string, MutualTLSMode> = new Map();
  private trafficMetrics: TrafficMetric[] = [];

  /**
   * Register virtual service
   */
  registerVirtualService(config: Omit<VirtualService, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `vs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const virtualService: VirtualService = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.virtualServices.set(id, virtualService);
    return id;
  }

  /**
   * Get virtual service
   */
  getVirtualService(id: string): VirtualService | null {
    return this.virtualServices.get(id) || null;
  }

  /**
   * Update virtual service
   */
  updateVirtualService(id: string, updates: Partial<VirtualService>): boolean {
    const vs = this.virtualServices.get(id);
    if (!vs) {
return false;
}

    Object.assign(vs, updates, { updatedAt: Date.now() });
    this.virtualServices.set(id, vs);
    return true;
  }

  /**
   * Delete virtual service
   */
  deleteVirtualService(id: string): boolean {
    return this.virtualServices.delete(id);
  }

  /**
   * Register destination rule
   */
  registerDestinationRule(
    config: Omit<DestinationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): string {
    const id = `dr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const destinationRule: DestinationRule = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.destinationRules.set(id, destinationRule);
    return id;
  }

  /**
   * Get destination rule
   */
  getDestinationRule(id: string): DestinationRule | null {
    return this.destinationRules.get(id) || null;
  }

  /**
   * Update destination rule
   */
  updateDestinationRule(id: string, updates: Partial<DestinationRule>): boolean {
    const dr = this.destinationRules.get(id);
    if (!dr) {
return false;
}

    Object.assign(dr, updates, { updatedAt: Date.now() });
    this.destinationRules.set(id, dr);
    return true;
  }

  /**
   * Register service entry (external service)
   */
  registerServiceEntry(config: Omit<ServiceEntry, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `se_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const serviceEntry: ServiceEntry = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.serviceEntries.set(id, serviceEntry);
    return id;
  }

  /**
   * Get service entry
   */
  getServiceEntry(id: string): ServiceEntry | null {
    return this.serviceEntries.get(id) || null;
  }

  /**
   * Enable mTLS for namespace
   */
  enableMTLS(namespace: string, mode: MutualTLSMode): void {
    this.mtlsConfig.set(namespace, mode);
  }

  /**
   * Get mTLS configuration
   */
  getMTLSMode(namespace: string): MutualTLSMode {
    return this.mtlsConfig.get(namespace) || 'PERMISSIVE';
  }

  /**
   * Update service health
   */
  updateServiceHealth(serviceId: string, health: Omit<ServiceHealth, 'serviceId'>): void {
    this.serviceHealth.set(serviceId, {
      serviceId,
      ...health,
    });
  }

  /**
   * Get service health
   */
  getServiceHealth(serviceId: string): ServiceHealth | null {
    return this.serviceHealth.get(serviceId) || null;
  }

  /**
   * Record traffic metric
   */
  recordTrafficMetric(metric: TrafficMetric): void {
    this.trafficMetrics.push(metric);
  }

  /**
   * Get traffic metrics for service
   */
  getTrafficMetrics(serviceId: string, limit: number = 100): TrafficMetric[] {
    return this.trafficMetrics
      .filter((m) => m.sourceService === serviceId || m.destinationService === serviceId)
      .slice(-limit);
  }

  /**
   * Get service graph
   */
  getServiceGraph(): ServiceGraph {
    const services = new Map<string, string[]>();

    for (const metric of this.trafficMetrics) {
      if (!services.has(metric.sourceService)) {
        services.set(metric.sourceService, []);
      }

      const destinations = services.get(metric.sourceService)!;
      if (!destinations.includes(metric.destinationService)) {
        destinations.push(metric.destinationService);
      }
    }

    return {
      services: Array.from(services.keys()),
      edges: Array.from(services.entries()).flatMap(([source, destinations]) =>
        destinations.map((destination) => ({ source, destination }))
      ),
    };
  }

  /**
   * Get mesh statistics
   */
  getStatistics(): Record<string, unknown> {
    const metrics = this.trafficMetrics;

    const totalRequests = metrics.length;
    const successCount = metrics.filter((m) => m.responseTime > 0).length;
    const errorCount = metrics.filter((m) => m.error).length;
    const avgLatency =
      metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length : 0;

    return {
      virtualServices: this.virtualServices.size,
      destinationRules: this.destinationRules.size,
      serviceEntries: this.serviceEntries.size,
      totalRequests,
      successCount,
      errorCount,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      avgLatency,
      mtlsEnabled: this.mtlsConfig.size > 0,
    };
  }

  /**
   * Cleanup old metrics
   */
  cleanupOldMetrics(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    const initialLength = this.trafficMetrics.length;

    this.trafficMetrics = this.trafficMetrics.filter((m) => m.timestamp > cutoff);

    return initialLength - this.trafficMetrics.length;
  }
}

/**
 * Traffic metric for service-to-service communication
 */
export interface TrafficMetric {
  id: string;
  sourceService: string;
  destinationService: string;
  protocol: string;
  responseTime: number; // milliseconds
  bytesSent: number;
  bytesReceived: number;
  error?: string;
  statusCode?: number;
  timestamp: number;
}

/**
 * Service graph
 */
export interface ServiceGraph {
  services: string[];
  edges: { source: string; destination: string }[];
}

// Export singleton
export const serviceMesh = new ServiceMesh();
