/**
 * M1 Advanced API Gateway
 *
 * Sophisticated API routing, rate limiting, circuit breaking, and traffic management
 * Supports path-based and service-based routing with advanced policies
 *
 * Version: v2.7.0
 * Phase: 13A - Advanced API Gateway
 */

export type RateLimitStrategy = 'token-bucket' | 'sliding-window' | 'fixed-window';
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';
export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
export type HeaderTransformation = 'add' | 'remove' | 'replace' | 'append';

/**
 * API route configuration
 */
export interface APIRoute {
  id: string;
  path: string;
  pattern?: string; // regex pattern
  method?: string; // GET, POST, etc or empty for all
  serviceId: string;
  stripPath?: boolean;
  timeout?: number;
  retries?: number;
  middlewares?: string[];
  policies?: RoutePolicy[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Route policy for access control and transformations
 */
export interface RoutePolicy {
  id: string;
  type: 'auth' | 'ratelimit' | 'cors' | 'transform' | 'cache';
  enabled: boolean;
  config: Record<string, unknown>;
}

/**
 * Upstream service
 */
export interface UpstreamService {
  id: string;
  name: string;
  urls: string[];
  healthCheck?: {
    enabled: boolean;
    path: string;
    interval: number; // ms
    timeout: number; // ms
  };
  loadBalancing: LoadBalancingStrategy;
  circuitBreaker?: CircuitBreakerConfig;
  rateLimit?: RateLimitConfig;
  timeout: number;
  createdAt: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  strategy: RateLimitStrategy;
  requests: number; // per window
  window: number; // milliseconds
  headers?: {
    limit: string;
    remaining: string;
    reset: string;
  };
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number; // % of failures to open circuit
  successThreshold: number; // # of successes to close circuit
  timeout: number; // ms before half-open
  halfOpenRequests: number; // max requests in half-open state
}

/**
 * Request context
 */
export interface RequestContext {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: Record<string, unknown>;
  sourceIp: string;
  timestamp: number;
}

/**
 * Request metrics
 */
export interface RequestMetrics {
  id: string;
  routeId: string;
  serviceId: string;
  method: string;
  path: string;
  statusCode?: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: number;
}

/**
 * API Gateway
 */
export class APIGateway {
  private routes: Map<string, APIRoute> = new Map();
  private services: Map<string, UpstreamService> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private requestMetrics: RequestMetrics[] = [];
  private routeCounter: number = 0;

  /**
   * Register route
   */
  registerRoute(config: Omit<APIRoute, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `route_${++this.routeCounter}_${Date.now()}`;
    const now = Date.now();

    const route: APIRoute = {
      id,
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    this.routes.set(id, route);
    return id;
  }

  /**
   * Get route by ID
   */
  getRoute(routeId: string): APIRoute | null {
    return this.routes.get(routeId) || null;
  }

  /**
   * Find matching route for request
   */
  findRoute(method: string, path: string): APIRoute | null {
    for (const route of this.routes.values()) {
      if (route.method && route.method !== method) {
continue;
}

      if (route.pattern) {
        const regex = new RegExp(route.pattern);
        if (!regex.test(path)) {
continue;
}
      } else {
        if (!path.startsWith(route.path)) {
continue;
}
      }

      return route;
    }

    return null;
  }

  /**
   * Update route
   */
  updateRoute(routeId: string, updates: Partial<APIRoute>): boolean {
    const route = this.routes.get(routeId);
    if (!route) {
return false;
}

    Object.assign(route, updates, { updatedAt: Date.now() });
    this.routes.set(routeId, route);
    return true;
  }

  /**
   * Delete route
   */
  deleteRoute(routeId: string): boolean {
    return this.routes.delete(routeId);
  }

  /**
   * Register upstream service
   */
  registerService(config: Omit<UpstreamService, 'createdAt'>): string {
    const id = `svc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const service: UpstreamService = {
      id,
      ...config,
      createdAt: Date.now(),
    };

    this.services.set(id, service);

    // Initialize circuit breaker
    if (service.circuitBreaker?.enabled) {
      this.circuitBreakers.set(id, 'closed');
    }

    // Initialize rate limiter
    if (service.rateLimit?.enabled) {
      this.rateLimiters.set(id, new RateLimiter(service.rateLimit));
    }

    return id;
  }

  /**
   * Get service
   */
  getService(serviceId: string): UpstreamService | null {
    return this.services.get(serviceId) || null;
  }

  /**
   * Route request to service
   */
  routeRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    sourceIp: string
  ): { serviceId: string; url: string; headers: Record<string, string> } | null {
    const route = this.findRoute(method, path);
    if (!route) {
return null;
}

    const service = this.services.get(route.serviceId);
    if (!service) {
return null;
}

    // Check circuit breaker
    if (service.circuitBreaker?.enabled) {
      const state = this.circuitBreakers.get(service.id);
      if (state === 'open') {
        return null; // Circuit open, reject request
      }
    }

    // Check rate limit
    if (service.rateLimit?.enabled) {
      const limiter = this.rateLimiters.get(service.id);
      if (limiter && !limiter.allowRequest(sourceIp)) {
        return null; // Rate limit exceeded
      }
    }

    // Select upstream URL using load balancing
    const url = this.selectUpstreamUrl(service, sourceIp);
    if (!url) {
return null;
}

    // Apply header transformations
    const transformedHeaders = this.applyHeaderTransformations(headers, route);

    // Apply path transformation
    let targetPath = path;
    if (route.stripPath) {
      targetPath = path.substring(route.path.length);
    }

    return {
      serviceId: service.id,
      url: `${url}${targetPath}`,
      headers: transformedHeaders,
    };
  }

  /**
   * Select upstream URL based on load balancing strategy
   */
  private selectUpstreamUrl(service: UpstreamService, sourceIp: string): string | null {
    if (service.urls.length === 0) {
return null;
}

    switch (service.loadBalancing) {
      case 'round-robin':
        const index = Math.floor(Math.random() * service.urls.length);
        return service.urls[index];

      case 'least-connections':
        // In production: track connection counts
        return service.urls[0];

      case 'weighted':
        // In production: use weights
        return service.urls[0];

      case 'ip-hash':
        const hash = this.hashSourceIp(sourceIp);
        return service.urls[hash % service.urls.length];

      default:
        return service.urls[0];
    }
  }

  /**
   * Hash source IP for IP-hash load balancing
   */
  private hashSourceIp(ip: string): number {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Apply header transformations
   */
  private applyHeaderTransformations(
    headers: Record<string, string>,
    route: APIRoute
  ): Record<string, string> {
    const transformed = { ...headers };

    if (route.policies) {
      for (const policy of route.policies) {
        if (policy.type === 'transform' && policy.enabled) {
          const config = policy.config as any;
          if (config.headerTransformations) {
            for (const transform of config.headerTransformations) {
              switch (transform.operation) {
                case 'add':
                  transformed[transform.header] = transform.value;
                  break;
                case 'remove':
                  delete transformed[transform.header];
                  break;
                case 'replace':
                  if (transform.header in transformed) {
                    transformed[transform.header] = transform.value;
                  }
                  break;
                case 'append':
                  transformed[transform.header] = `${transformed[transform.header] || ''}${transform.value}`;
                  break;
              }
            }
          }
        }
      }
    }

    return transformed;
  }

  /**
   * Record request metrics
   */
  recordMetrics(
    routeId: string,
    serviceId: string,
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    requestSize: number,
    responseSize: number
  ): void {
    const metric: RequestMetrics = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      routeId,
      serviceId,
      method,
      path,
      statusCode,
      responseTime,
      requestSize,
      responseSize,
      timestamp: Date.now(),
    };

    this.requestMetrics.push(metric);
  }

  /**
   * Get gateway statistics
   */
  getStatistics(): Record<string, unknown> {
    const metrics = this.requestMetrics;

    const avgResponseTime =
      metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length : 0;

    const errorCount = metrics.filter((m) => m.statusCode && m.statusCode >= 400).length;
    const successCount = metrics.filter((m) => m.statusCode && m.statusCode < 400).length;

    return {
      routes: this.routes.size,
      services: this.services.size,
      totalRequests: metrics.length,
      successCount,
      errorCount,
      errorRate: metrics.length > 0 ? (errorCount / metrics.length) * 100 : 0,
      avgResponseTime,
      p95ResponseTime: this.calculatePercentile(
        metrics.map((m) => m.responseTime),
        95
      ),
      p99ResponseTime: this.calculatePercentile(
        metrics.map((m) => m.responseTime),
        99
      ),
    };
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) {
return 0;
}

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get request history
   */
  getRequestHistory(limit: number = 100): RequestMetrics[] {
    return this.requestMetrics.slice(-limit);
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(serviceId: string, state: CircuitBreakerState): void {
    this.circuitBreakers.set(serviceId, state);
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(serviceId: string): CircuitBreakerState | null {
    return this.circuitBreakers.get(serviceId) || null;
  }
}

/**
 * Rate Limiter
 */
class RateLimiter {
  private config: RateLimitConfig;
  private buckets: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  allowRequest(identifier: string): boolean {
    if (!this.config.enabled) {
return true;
}

    const now = Date.now();
    const bucket = this.buckets.get(identifier);

    if (!bucket || bucket.resetTime < now) {
      this.buckets.set(identifier, {
        count: 1,
        resetTime: now + this.config.window,
      });
      return true;
    }

    if (bucket.count < this.config.requests) {
      bucket.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string): number {
    const bucket = this.buckets.get(identifier);
    if (!bucket) {
return this.config.requests;
}

    return Math.max(0, this.config.requests - bucket.count);
  }
}

// Export singleton
export const apiGateway = new APIGateway();
