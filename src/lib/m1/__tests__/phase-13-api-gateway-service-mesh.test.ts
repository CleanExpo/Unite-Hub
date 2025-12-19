/**
 * M1 Phase 13: Advanced API Gateway & Service Mesh Tests
 *
 * Comprehensive test suite for API routing, traffic management,
 * and service mesh capabilities
 *
 * Version: v2.7.0
 * Phase: 13 - Advanced API Gateway & Service Mesh
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { APIGateway } from '../gateway/api-gateway';
import { ServiceMesh } from '../gateway/service-mesh';

describe('Phase 13: Advanced API Gateway & Service Mesh', () => {
  let apiGateway: APIGateway;
  let serviceMesh: ServiceMesh;

  beforeEach(() => {
    apiGateway = new APIGateway();
    serviceMesh = new ServiceMesh();
  });

  // ===== API Gateway Tests (13A) =====

  describe('API Gateway (15 tests)', () => {
    it('should register API route', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        method: 'GET',
        serviceId: 'user-service',
        timeout: 5000,
        retries: 3,
      });

      expect(routeId).toBeDefined();
      expect(routeId).toContain('route_');

      const route = apiGateway.getRoute(routeId);
      expect(route?.path).toBe('/api/users');
      expect(route?.method).toBe('GET');
    });

    it('should register upstream service', () => {
      const serviceId = apiGateway.registerService({
        name: 'user-service',
        urls: ['http://localhost:3000', 'http://localhost:3001'],
        loadBalancing: 'round-robin',
        timeout: 10000,
      });

      expect(serviceId).toBeDefined();
      expect(serviceId).toContain('svc_');

      const service = apiGateway.getService(serviceId);
      expect(service?.name).toBe('user-service');
      expect(service?.urls.length).toBe(2);
    });

    it('should find matching route', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        method: 'GET',
        serviceId: 'user-service',
        timeout: 5000,
      });

      const route = apiGateway.findRoute('GET', '/api/users');
      expect(route).toBeDefined();
      expect(route?.path).toBe('/api/users');
    });

    it('should support regex patterns in routes', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        pattern: '^/api/users/[0-9]+$',
        method: 'GET',
        serviceId: 'user-service',
        timeout: 5000,
      });

      const route = apiGateway.findRoute('GET', '/api/users/123');
      expect(route).toBeDefined();
    });

    it('should update route configuration', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        method: 'GET',
        serviceId: 'user-service',
        timeout: 5000,
      });

      const updated = apiGateway.updateRoute(routeId, {
        timeout: 10000,
        retries: 5,
      });

      expect(updated).toBe(true);

      const route = apiGateway.getRoute(routeId);
      expect(route?.timeout).toBe(10000);
      expect(route?.retries).toBe(5);
    });

    it('should delete route', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        method: 'GET',
        serviceId: 'user-service',
        timeout: 5000,
      });

      const deleted = apiGateway.deleteRoute(routeId);
      expect(deleted).toBe(true);

      const route = apiGateway.getRoute(routeId);
      expect(route).toBeNull();
    });

    it('should support multiple load balancing strategies', () => {
      const serviceId1 = apiGateway.registerService({
        name: 'service-rr',
        urls: ['http://host1:3000', 'http://host2:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const serviceId2 = apiGateway.registerService({
        name: 'service-ip-hash',
        urls: ['http://host1:3000', 'http://host2:3000'],
        loadBalancing: 'ip-hash',
        timeout: 5000,
      });

      expect(apiGateway.getService(serviceId1)?.loadBalancing).toBe('round-robin');
      expect(apiGateway.getService(serviceId2)?.loadBalancing).toBe('ip-hash');
    });

    it('should route request to service', () => {
      const serviceId = apiGateway.registerService({
        name: 'user-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const routeId = apiGateway.registerRoute({
        path: '/api/users',
        method: 'GET',
        serviceId,
        timeout: 5000,
      });

      const routed = apiGateway.routeRequest('GET', '/api/users', {}, '127.0.0.1');
      expect(routed).toBeDefined();
      expect(routed?.serviceId).toBe(serviceId);
    });

    it('should support rate limiting', () => {
      const serviceId = apiGateway.registerService({
        name: 'limited-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
        rateLimit: {
          enabled: true,
          strategy: 'token-bucket',
          requests: 100,
          window: 60000, // 1 minute
        },
      });

      const routeId = apiGateway.registerRoute({
        path: '/api/limited',
        method: 'GET',
        serviceId,
        timeout: 5000,
      });

      expect(apiGateway.getService(serviceId)?.rateLimit?.enabled).toBe(true);
    });

    it('should support circuit breaker', () => {
      const serviceId = apiGateway.registerService({
        name: 'fragile-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
        circuitBreaker: {
          enabled: true,
          failureThreshold: 50,
          successThreshold: 5,
          timeout: 30000,
          halfOpenRequests: 3,
        },
      });

      const service = apiGateway.getService(serviceId);
      expect(service?.circuitBreaker?.enabled).toBe(true);
      expect(apiGateway.getCircuitBreakerState(serviceId)).toBe('closed');
    });

    it('should record request metrics', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/test',
        method: 'GET',
        serviceId: 'test-service',
        timeout: 5000,
      });

      apiGateway.recordMetrics(
        routeId,
        'test-service',
        'GET',
        '/api/test',
        200,
        150,
        256,
        1024
      );

      const history = apiGateway.getRequestHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should calculate gateway statistics', () => {
      apiGateway.registerService({
        name: 'service1',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      apiGateway.registerRoute({
        path: '/api/test',
        method: 'GET',
        serviceId: 'test-service',
        timeout: 5000,
      });

      const stats = apiGateway.getStatistics();
      expect(stats.routes).toBeGreaterThanOrEqual(1);
      expect(stats.services).toBeGreaterThanOrEqual(1);
    });

    it('should support header transformations', () => {
      const serviceId = apiGateway.registerService({
        name: 'transform-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const routeId = apiGateway.registerRoute({
        path: '/api/test',
        method: 'GET',
        serviceId,
        timeout: 5000,
        policies: [
          {
            id: 'transform-1',
            type: 'transform',
            enabled: true,
            config: {
              headerTransformations: [
                { operation: 'add', header: 'X-Custom-Header', value: 'custom-value' },
              ],
            },
          },
        ],
      });

      const routed = apiGateway.routeRequest('GET', '/api/test', {}, '127.0.0.1');
      expect(routed).toBeDefined();
    });

    it('should strip path prefix when configured', () => {
      const serviceId = apiGateway.registerService({
        name: 'prefix-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const routeId = apiGateway.registerRoute({
        path: '/api',
        method: 'GET',
        serviceId,
        stripPath: true,
        timeout: 5000,
      });

      const route = apiGateway.getRoute(routeId);
      expect(route?.stripPath).toBe(true);
    });
  });

  // ===== Service Mesh Tests (13B) =====

  describe('Service Mesh (15 tests)', () => {
    it('should register virtual service', () => {
      const vsId = serviceMesh.registerVirtualService({
        name: 'users',
        namespace: 'default',
        hosts: ['users', 'users.default', 'users.default.svc.cluster.local'],
        http: [
          {
            name: 'users-route',
            route: [
              {
                destination: {
                  host: 'users',
                  port: { number: 8080 },
                },
              },
            ],
          },
        ],
        tls: [],
        tcp: [],
      });

      expect(vsId).toBeDefined();
      expect(vsId).toContain('vs_');

      const vs = serviceMesh.getVirtualService(vsId);
      expect(vs?.name).toBe('users');
    });

    it('should register destination rule', () => {
      const drId = serviceMesh.registerDestinationRule({
        name: 'users-dr',
        namespace: 'default',
        host: 'users',
        trafficPolicy: {
          loadBalancer: {
            simple: 'ROUND_ROBIN',
          },
        },
      });

      expect(drId).toBeDefined();
      expect(drId).toContain('dr_');

      const dr = serviceMesh.getDestinationRule(drId);
      expect(dr?.host).toBe('users');
    });

    it('should register service entry for external service', () => {
      const seId = serviceMesh.registerServiceEntry({
        name: 'external-api',
        namespace: 'default',
        hosts: ['api.example.com'],
        addresses: ['1.2.3.4'],
        ports: [{ name: 'https', number: 443, protocol: 'HTTPS' }],
        location: 'MESH_EXTERNAL',
        resolution: 'DNS',
      });

      expect(seId).toBeDefined();
      expect(seId).toContain('se_');

      const se = serviceMesh.getServiceEntry(seId);
      expect(se?.location).toBe('MESH_EXTERNAL');
    });

    it('should enable mTLS for namespace', () => {
      serviceMesh.enableMTLS('default', 'STRICT');
      serviceMesh.enableMTLS('production', 'PERMISSIVE');

      expect(serviceMesh.getMTLSMode('default')).toBe('STRICT');
      expect(serviceMesh.getMTLSMode('production')).toBe('PERMISSIVE');
    });

    it('should update virtual service', () => {
      const vsId = serviceMesh.registerVirtualService({
        name: 'users',
        namespace: 'default',
        hosts: ['users'],
        http: [],
        tls: [],
        tcp: [],
      });

      const updated = serviceMesh.updateVirtualService(vsId, {
        hosts: ['users', 'users.default'],
      });

      expect(updated).toBe(true);

      const vs = serviceMesh.getVirtualService(vsId);
      expect(vs?.hosts.length).toBe(2);
    });

    it('should update destination rule', () => {
      const drId = serviceMesh.registerDestinationRule({
        name: 'users-dr',
        namespace: 'default',
        host: 'users',
      });

      const updated = serviceMesh.updateDestinationRule(drId, {
        trafficPolicy: {
          loadBalancer: {
            simple: 'LEAST_REQUEST',
          },
        },
      });

      expect(updated).toBe(true);

      const dr = serviceMesh.getDestinationRule(drId);
      expect(dr?.trafficPolicy?.loadBalancer?.simple).toBe('LEAST_REQUEST');
    });

    it('should delete virtual service', () => {
      const vsId = serviceMesh.registerVirtualService({
        name: 'users',
        namespace: 'default',
        hosts: ['users'],
        http: [],
        tls: [],
        tcp: [],
      });

      const deleted = serviceMesh.deleteVirtualService(vsId);
      expect(deleted).toBe(true);

      const vs = serviceMesh.getVirtualService(vsId);
      expect(vs).toBeNull();
    });

    it('should track service health', () => {
      const health = {
        state: 'available' as const,
        readyEndpoints: 3,
        totalEndpoints: 3,
        lastProbeTime: Date.now(),
        conditions: [{ name: 'Ready', status: true, message: 'All endpoints healthy' }],
      };

      serviceMesh.updateServiceHealth('users-service', health);

      const retrieved = serviceMesh.getServiceHealth('users-service');
      expect(retrieved?.state).toBe('available');
      expect(retrieved?.readyEndpoints).toBe(3);
    });

    it('should record traffic metrics', () => {
      serviceMesh.recordTrafficMetric({
        id: 'metric-1',
        sourceService: 'api-gateway',
        destinationService: 'users-service',
        protocol: 'HTTP/1.1',
        responseTime: 125,
        bytesSent: 512,
        bytesReceived: 2048,
        statusCode: 200,
        timestamp: Date.now(),
      });

      serviceMesh.recordTrafficMetric({
        id: 'metric-2',
        sourceService: 'users-service',
        destinationService: 'database',
        protocol: 'TCP',
        responseTime: 45,
        bytesSent: 256,
        bytesReceived: 1024,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const metrics = serviceMesh.getTrafficMetrics('users-service');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should generate service graph', () => {
      serviceMesh.recordTrafficMetric({
        id: 'metric-1',
        sourceService: 'frontend',
        destinationService: 'api-gateway',
        protocol: 'HTTP/1.1',
        responseTime: 50,
        bytesSent: 256,
        bytesReceived: 1024,
        statusCode: 200,
        timestamp: Date.now(),
      });

      serviceMesh.recordTrafficMetric({
        id: 'metric-2',
        sourceService: 'api-gateway',
        destinationService: 'users-service',
        protocol: 'HTTP/1.1',
        responseTime: 75,
        bytesSent: 512,
        bytesReceived: 2048,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const graph = serviceMesh.getServiceGraph();
      expect(graph.services.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('should calculate mesh statistics', () => {
      serviceMesh.registerVirtualService({
        name: 'test-vs',
        namespace: 'default',
        hosts: ['test'],
        http: [],
        tls: [],
        tcp: [],
      });

      serviceMesh.recordTrafficMetric({
        id: 'metric-1',
        sourceService: 'source',
        destinationService: 'dest',
        protocol: 'HTTP',
        responseTime: 100,
        bytesSent: 256,
        bytesReceived: 1024,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const stats = serviceMesh.getStatistics();
      expect(stats.virtualServices).toBeGreaterThanOrEqual(1);
      expect(typeof stats.totalRequests).toBe('number');
    });

    it('should support outlier detection configuration', () => {
      const drId = serviceMesh.registerDestinationRule({
        name: 'outlier-detection-dr',
        namespace: 'default',
        host: 'fault-service',
        trafficPolicy: {
          outlierDetection: {
            consecutive5xxErrors: 5,
            interval: '30s',
            baseEjectionTime: '30s',
            maxEjectionPercent: 50,
            minEjectionDuration: '30s',
          },
        },
      });

      const dr = serviceMesh.getDestinationRule(drId);
      expect(dr?.trafficPolicy?.outlierDetection?.consecutive5xxErrors).toBe(5);
    });

    it('should support mTLS configuration', () => {
      const drId = serviceMesh.registerDestinationRule({
        name: 'mtls-dr',
        namespace: 'default',
        host: 'secure-service',
        trafficPolicy: {
          tls: {
            mode: 'STRICT',
            sni: 'secure-service.default.svc.cluster.local',
          },
        },
      });

      const dr = serviceMesh.getDestinationRule(drId);
      expect(dr?.trafficPolicy?.tls?.mode).toBe('STRICT');
    });

    it('should cleanup old metrics', () => {
      for (let i = 0; i < 100; i++) {
        serviceMesh.recordTrafficMetric({
          id: `metric-${i}`,
          sourceService: `source-${i}`,
          destinationService: `dest-${i}`,
          protocol: 'HTTP',
          responseTime: Math.random() * 200,
          bytesSent: 256,
          bytesReceived: 1024,
          statusCode: 200,
          timestamp: Date.now(),
        });
      }

      const cleaned = serviceMesh.cleanupOldMetrics(0);
      expect(typeof cleaned).toBe('number');
    });
  });

  // ===== Integration Tests =====

  describe('API Gateway & Service Mesh Integration (10 tests)', () => {
    it('should coordinate API Gateway with Service Mesh', () => {
      const serviceId = apiGateway.registerService({
        name: 'integrated-service',
        urls: ['http://localhost:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const vsId = serviceMesh.registerVirtualService({
        name: 'integrated-service',
        namespace: 'default',
        hosts: ['integrated-service'],
        http: [
          {
            name: 'route',
            route: [
              {
                destination: {
                  host: 'integrated-service',
                  port: { number: 3000 },
                },
              },
            ],
          },
        ],
        tls: [],
        tcp: [],
      });

      expect(serviceId).toBeDefined();
      expect(vsId).toBeDefined();
    });

    it('should handle traffic routing across multiple zones', () => {
      const zone1ServiceId = apiGateway.registerService({
        name: 'zone1-service',
        urls: ['http://zone1.example.com:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      const zone2ServiceId = apiGateway.registerService({
        name: 'zone2-service',
        urls: ['http://zone2.example.com:3000'],
        loadBalancing: 'round-robin',
        timeout: 5000,
      });

      expect(apiGateway.getService(zone1ServiceId)?.name).toBe('zone1-service');
      expect(apiGateway.getService(zone2ServiceId)?.name).toBe('zone2-service');
    });

    it('should track end-to-end latency', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/data',
        method: 'GET',
        serviceId: 'data-service',
        timeout: 5000,
      });

      apiGateway.recordMetrics(routeId, 'data-service', 'GET', '/api/data', 200, 250, 512, 4096);
      serviceMesh.recordTrafficMetric({
        id: 'metric-1',
        sourceService: 'api-gateway',
        destinationService: 'data-service',
        protocol: 'HTTP',
        responseTime: 200,
        bytesSent: 256,
        bytesReceived: 4096,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const stats = apiGateway.getStatistics();
      const meshStats = serviceMesh.getStatistics();

      expect(typeof stats.avgResponseTime).toBe('number');
      expect(typeof meshStats.avgLatency).toBe('number');
    });

    it('should manage fault tolerance with circuit breaker and outlier detection', () => {
      const serviceId = apiGateway.registerService({
        name: 'fault-tolerant-service',
        urls: ['http://localhost:3000', 'http://localhost:3001'],
        loadBalancing: 'round-robin',
        timeout: 5000,
        circuitBreaker: {
          enabled: true,
          failureThreshold: 50,
          successThreshold: 3,
          timeout: 30000,
          halfOpenRequests: 2,
        },
      });

      const drId = serviceMesh.registerDestinationRule({
        name: 'fault-tolerant-dr',
        namespace: 'default',
        host: 'fault-tolerant-service',
        trafficPolicy: {
          outlierDetection: {
            consecutive5xxErrors: 5,
            interval: '30s',
            baseEjectionTime: '30s',
            maxEjectionPercent: 50,
            minEjectionDuration: '30s',
          },
        },
      });

      expect(apiGateway.getService(serviceId)?.circuitBreaker?.enabled).toBe(true);
      expect(
        serviceMesh.getDestinationRule(drId)?.trafficPolicy?.outlierDetection?.consecutive5xxErrors
      ).toBe(5);
    });

    it('should support canary deployments', () => {
      const vsId = serviceMesh.registerVirtualService({
        name: 'app',
        namespace: 'default',
        hosts: ['app'],
        http: [
          {
            name: 'canary-route',
            route: [
              {
                destination: {
                  host: 'app',
                  subset: 'v1',
                },
                weight: 90,
              },
              {
                destination: {
                  host: 'app',
                  subset: 'v2-canary',
                },
                weight: 10,
              },
            ],
          },
        ],
        tls: [],
        tcp: [],
      });

      const vs = serviceMesh.getVirtualService(vsId);
      expect(vs?.http[0].route.length).toBe(2);
      expect(vs?.http[0].route[0].weight).toBe(90);
      expect(vs?.http[0].route[1].weight).toBe(10);
    });

    it('should enforce mTLS across services', () => {
      serviceMesh.enableMTLS('production', 'STRICT');

      const drId = serviceMesh.registerDestinationRule({
        name: 'secure-dr',
        namespace: 'production',
        host: 'secure-service',
        trafficPolicy: {
          tls: {
            mode: 'STRICT',
          },
        },
      });

      expect(serviceMesh.getMTLSMode('production')).toBe('STRICT');
      expect(serviceMesh.getDestinationRule(drId)?.trafficPolicy?.tls?.mode).toBe('STRICT');
    });

    it('should measure success rate across service graph', () => {
      serviceMesh.recordTrafficMetric({
        id: 'metric-1',
        sourceService: 'frontend',
        destinationService: 'api',
        protocol: 'HTTP',
        responseTime: 100,
        bytesSent: 256,
        bytesReceived: 1024,
        statusCode: 200,
        timestamp: Date.now(),
      });

      serviceMesh.recordTrafficMetric({
        id: 'metric-2',
        sourceService: 'api',
        destinationService: 'backend',
        protocol: 'HTTP',
        responseTime: 150,
        bytesSent: 512,
        bytesReceived: 2048,
        statusCode: 200,
        timestamp: Date.now(),
      });

      serviceMesh.recordTrafficMetric({
        id: 'metric-3',
        sourceService: 'backend',
        destinationService: 'database',
        protocol: 'TCP',
        responseTime: 50,
        bytesSent: 256,
        bytesReceived: 1024,
        statusCode: 500,
        timestamp: Date.now(),
        error: 'Connection timeout',
      });

      const stats = serviceMesh.getStatistics();
      expect(stats.successRate).toBeLessThanOrEqual(100);
    });

    it('should support traffic mirroring for testing', () => {
      const vsId = serviceMesh.registerVirtualService({
        name: 'mirrored-app',
        namespace: 'default',
        hosts: ['mirrored-app'],
        http: [
          {
            name: 'mirror-route',
            route: [
              {
                destination: {
                  host: 'app',
                  subset: 'production',
                },
              },
            ],
          },
        ],
        tls: [],
        tcp: [],
      });

      const vs = serviceMesh.getVirtualService(vsId);
      expect(vs?.name).toBe('mirrored-app');
    });

    it('should handle external service integration', () => {
      const externalServiceId = serviceMesh.registerServiceEntry({
        name: 'external-payment-api',
        namespace: 'default',
        hosts: ['payment.external.com'],
        addresses: ['1.2.3.4', '1.2.3.5'],
        ports: [{ name: 'https', number: 443, protocol: 'HTTPS' }],
        location: 'MESH_EXTERNAL',
        resolution: 'DNS',
      });

      const se = serviceMesh.getServiceEntry(externalServiceId);
      expect(se?.location).toBe('MESH_EXTERNAL');
      expect(se?.resolution).toBe('DNS');
    });

    it('should correlate API metrics with service mesh metrics', () => {
      const routeId = apiGateway.registerRoute({
        path: '/api/complex',
        method: 'POST',
        serviceId: 'complex-service',
        timeout: 10000,
      });

      apiGateway.recordMetrics(routeId, 'complex-service', 'POST', '/api/complex', 200, 500, 1024, 8192);
      apiGateway.recordMetrics(routeId, 'complex-service', 'POST', '/api/complex', 200, 450, 1024, 8192);
      apiGateway.recordMetrics(routeId, 'complex-service', 'POST', '/api/complex', 502, 1000, 1024, 256);

      serviceMesh.recordTrafficMetric({
        id: 'mesh-metric-1',
        sourceService: 'api-gateway',
        destinationService: 'complex-service',
        protocol: 'HTTP/1.1',
        responseTime: 475,
        bytesSent: 1024,
        bytesReceived: 8192,
        statusCode: 200,
        timestamp: Date.now(),
      });

      const apiStats = apiGateway.getStatistics();
      const meshStats = serviceMesh.getStatistics();

      expect(apiStats.totalRequests).toBe(3);
      expect(meshStats.totalRequests).toBeGreaterThan(0);
    });
  });
});
