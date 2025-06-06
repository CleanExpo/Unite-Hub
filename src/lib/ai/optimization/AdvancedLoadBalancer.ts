/**
 * AdvancedLoadBalancer - AI-powered intelligent load balancing system
 * Part of Version 14.0: Next Generation AI & Automation Revolution
 * Phase 1 Task 11: Advanced Load Balancing AI
 */

import { RuntimeService } from '../../services/base/RuntimeService';
import { getSystemMonitor, SystemMetrics } from '../monitoring/SystemMonitor';
import { getRealTimeOptimizer } from './RealTimeOptimizer';

export interface ServerNode {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  region: string;
  zone: string;
  capacity: {
    maxConcurrentConnections: number;
    maxCpuThreshold: number;
    maxMemoryThreshold: number;
    maxBandwidth: number; // Mbps
  };
  currentLoad: {
    activeConnections: number;
    cpuUsage: number;
    memoryUsage: number;
    networkUtilization: number;
    responseTime: number; // ms
  };
  health: {
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    uptime: number; // seconds
    lastHealthCheck: Date;
    consecutiveFailures: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number; // requests/sec
    reliability: number; // 0-1
  };
  weights: {
    static: number; // 1-10
    dynamic: number; // calculated based on performance
    geographic: number; // proximity bonus
    final: number; // computed final weight
  };
  tags: string[];
  createdAt: Date;
  lastUpdate: Date;
}

export interface LoadBalancingStrategy {
  id: string;
  name: string;
  description: string;
  algorithm: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 'ip-hash' | 'ai-optimized' | 'geographic' | 'predictive';
  enabled: boolean;
  config: {
    healthCheckInterval: number; // seconds
    failureThreshold: number;
    recoveryThreshold: number;
    weightUpdateInterval: number; // seconds
    considerGeography: boolean;
    considerPerformance: boolean;
    considerPredictions: boolean;
  };
  metrics: {
    successRate: number;
    avgResponseTime: number;
    balanceEfficiency: number; // how evenly load is distributed
    failoverTime: number; // ms
  };
  createdAt: Date;
  lastUsed: Date;
}

export interface RoutingDecision {
  id: string;
  timestamp: Date;
  clientId: string;
  clientLocation?: {
    country: string;
    region: string;
    city: string;
  };
  requestType: string;
  selectedServer: string;
  alternativeServers: string[];
  strategy: string;
  factors: {
    serverLoad: number;
    networkLatency: number;
    geographic: number;
    predictedPerformance: number;
    reliability: number;
  };
  decisionTime: number; // ms to make decision
  outcome?: {
    responseTime: number;
    success: boolean;
    error?: string;
  };
}

export interface TrafficPrediction {
  timestamp: Date;
  timeHorizon: number; // minutes into future
  predictions: {
    totalRequests: number;
    requestsByRegion: Record<string, number>;
    requestsByType: Record<string, number>;
    peakLoad: number;
    averageLoad: number;
  };
  confidence: number; // 0-1
  modelUsed: string;
  factors: string[];
}

export interface LoadBalancingMetrics {
  timestamp: Date;
  totalRequests: number;
  distributionEfficiency: number; // how evenly distributed
  serverUtilization: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  failoverEvents: number;
  geographicDistribution: Record<string, number>;
  topPerformingServers: string[];
  underPerformingServers: string[];
}

export class AdvancedLoadBalancer extends RuntimeService {
  private static instance: AdvancedLoadBalancer | null = null;
  private monitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private optimizer: Awaited<ReturnType<typeof getRealTimeOptimizer>> | null = null;
  private servers: Map<string, ServerNode> = new Map();
  private strategies: Map<string, LoadBalancingStrategy> = new Map();
  private routingHistory: RoutingDecision[] = [];
  private trafficPredictions: TrafficPrediction[] = [];
  private metrics: LoadBalancingMetrics[] = [];
  
  private currentStrategy: string = 'ai-optimized';
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly METRICS_INTERVAL = 60000; // 1 minute
  private readonly PREDICTION_INTERVAL = 300000; // 5 minutes
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private predictionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeStrategies();
    this.initializeServers();
  }

  static async getInstance(): Promise<AdvancedLoadBalancer> {
    if (!this.instance) {
      this.instance = new AdvancedLoadBalancer();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('⚖️ Advanced Load Balancer initializing...');
    this.monitor = await getSystemMonitor();
    this.optimizer = await getRealTimeOptimizer();
    
    this.startHealthChecks();
    this.startMetricsCollection();
    this.startTrafficPrediction();
  }

  private initializeStrategies(): void {
    const strategies: LoadBalancingStrategy[] = [
      {
        id: 'ai-optimized',
        name: 'AI-Optimized Intelligent Routing',
        description: 'ML-powered routing that learns from patterns and predicts optimal server selection',
        algorithm: 'ai-optimized',
        enabled: true,
        config: {
          healthCheckInterval: 30,
          failureThreshold: 3,
          recoveryThreshold: 5,
          weightUpdateInterval: 60,
          considerGeography: true,
          considerPerformance: true,
          considerPredictions: true
        },
        metrics: {
          successRate: 0.98,
          avgResponseTime: 45,
          balanceEfficiency: 0.94,
          failoverTime: 250
        },
        createdAt: new Date(),
        lastUsed: new Date()
      },
      {
        id: 'weighted-round-robin',
        name: 'Weighted Round Robin',
        description: 'Classic weighted round-robin with dynamic weight adjustment',
        algorithm: 'weighted-round-robin',
        enabled: true,
        config: {
          healthCheckInterval: 60,
          failureThreshold: 5,
          recoveryThreshold: 3,
          weightUpdateInterval: 120,
          considerGeography: false,
          considerPerformance: true,
          considerPredictions: false
        },
        metrics: {
          successRate: 0.95,
          avgResponseTime: 65,
          balanceEfficiency: 0.87,
          failoverTime: 500
        },
        createdAt: new Date(),
        lastUsed: new Date()
      },
      {
        id: 'least-connections',
        name: 'Least Connections',
        description: 'Route to server with fewest active connections',
        algorithm: 'least-connections',
        enabled: true,
        config: {
          healthCheckInterval: 45,
          failureThreshold: 4,
          recoveryThreshold: 4,
          weightUpdateInterval: 90,
          considerGeography: false,
          considerPerformance: true,
          considerPredictions: false
        },
        metrics: {
          successRate: 0.93,
          avgResponseTime: 55,
          balanceEfficiency: 0.91,
          failoverTime: 300
        },
        createdAt: new Date(),
        lastUsed: new Date()
      },
      {
        id: 'geographic',
        name: 'Geographic Proximity',
        description: 'Route based on geographic proximity with performance consideration',
        algorithm: 'geographic',
        enabled: true,
        config: {
          healthCheckInterval: 60,
          failureThreshold: 3,
          recoveryThreshold: 5,
          weightUpdateInterval: 180,
          considerGeography: true,
          considerPerformance: true,
          considerPredictions: false
        },
        metrics: {
          successRate: 0.96,
          avgResponseTime: 35,
          balanceEfficiency: 0.85,
          failoverTime: 400
        },
        createdAt: new Date(),
        lastUsed: new Date()
      },
      {
        id: 'predictive',
        name: 'Predictive Load Balancing',
        description: 'Uses ML predictions to anticipate traffic patterns and pre-position resources',
        algorithm: 'predictive',
        enabled: true,
        config: {
          healthCheckInterval: 30,
          failureThreshold: 2,
          recoveryThreshold: 6,
          weightUpdateInterval: 60,
          considerGeography: true,
          considerPerformance: true,
          considerPredictions: true
        },
        metrics: {
          successRate: 0.99,
          avgResponseTime: 32,
          balanceEfficiency: 0.96,
          failoverTime: 150
        },
        createdAt: new Date(),
        lastUsed: new Date()
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  private initializeServers(): void {
    const servers: ServerNode[] = [
      {
        id: 'us-east-1-web-01',
        hostname: 'web-01.us-east-1.example.com',
        ip: '10.0.1.10',
        port: 80,
        region: 'us-east-1',
        zone: 'us-east-1a',
        capacity: {
          maxConcurrentConnections: 1000,
          maxCpuThreshold: 80,
          maxMemoryThreshold: 85,
          maxBandwidth: 1000
        },
        currentLoad: {
          activeConnections: 250,
          cpuUsage: 35,
          memoryUsage: 45,
          networkUtilization: 30,
          responseTime: 45
        },
        health: {
          status: 'healthy',
          uptime: 86400 * 30, // 30 days
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        },
        performance: {
          avgResponseTime: 42,
          errorRate: 0.02,
          throughput: 1200,
          reliability: 0.995
        },
        weights: {
          static: 8,
          dynamic: 0.85,
          geographic: 1.0,
          final: 6.8
        },
        tags: ['primary', 'web', 'high-capacity'],
        createdAt: new Date(),
        lastUpdate: new Date()
      },
      {
        id: 'us-west-2-web-01',
        hostname: 'web-01.us-west-2.example.com',
        ip: '10.0.2.10',
        port: 80,
        region: 'us-west-2',
        zone: 'us-west-2a',
        capacity: {
          maxConcurrentConnections: 800,
          maxCpuThreshold: 75,
          maxMemoryThreshold: 80,
          maxBandwidth: 800
        },
        currentLoad: {
          activeConnections: 180,
          cpuUsage: 28,
          memoryUsage: 38,
          networkUtilization: 25,
          responseTime: 38
        },
        health: {
          status: 'healthy',
          uptime: 86400 * 25,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        },
        performance: {
          avgResponseTime: 36,
          errorRate: 0.015,
          throughput: 950,
          reliability: 0.997
        },
        weights: {
          static: 7,
          dynamic: 0.92,
          geographic: 1.2,
          final: 7.7
        },
        tags: ['primary', 'web', 'high-performance'],
        createdAt: new Date(),
        lastUpdate: new Date()
      },
      {
        id: 'eu-west-1-web-01',
        hostname: 'web-01.eu-west-1.example.com',
        ip: '10.0.3.10',
        port: 80,
        region: 'eu-west-1',
        zone: 'eu-west-1a',
        capacity: {
          maxConcurrentConnections: 600,
          maxCpuThreshold: 70,
          maxMemoryThreshold: 75,
          maxBandwidth: 600
        },
        currentLoad: {
          activeConnections: 120,
          cpuUsage: 22,
          memoryUsage: 32,
          networkUtilization: 20,
          responseTime: 52
        },
        health: {
          status: 'healthy',
          uptime: 86400 * 20,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        },
        performance: {
          avgResponseTime: 48,
          errorRate: 0.025,
          throughput: 720,
          reliability: 0.992
        },
        weights: {
          static: 6,
          dynamic: 0.88,
          geographic: 0.8,
          final: 4.2
        },
        tags: ['secondary', 'web', 'eu-region'],
        createdAt: new Date(),
        lastUpdate: new Date()
      },
      {
        id: 'ap-southeast-1-web-01',
        hostname: 'web-01.ap-southeast-1.example.com',
        ip: '10.0.4.10',
        port: 80,
        region: 'ap-southeast-1',
        zone: 'ap-southeast-1a',
        capacity: {
          maxConcurrentConnections: 500,
          maxCpuThreshold: 75,
          maxMemoryThreshold: 80,
          maxBandwidth: 500
        },
        currentLoad: {
          activeConnections: 85,
          cpuUsage: 18,
          memoryUsage: 28,
          networkUtilization: 15,
          responseTime: 58
        },
        health: {
          status: 'healthy',
          uptime: 86400 * 15,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0
        },
        performance: {
          avgResponseTime: 55,
          errorRate: 0.03,
          throughput: 480,
          reliability: 0.989
        },
        weights: {
          static: 5,
          dynamic: 0.82,
          geographic: 0.6,
          final: 2.5
        },
        tags: ['secondary', 'web', 'apac-region'],
        createdAt: new Date(),
        lastUpdate: new Date()
      }
    ];

    servers.forEach(server => {
      this.servers.set(server.id, server);
    });
  }

  private startHealthChecks(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.METRICS_INTERVAL);
  }

  private startTrafficPrediction(): void {
    if (this.predictionInterval) return;

    this.predictionInterval = setInterval(() => {
      this.generateTrafficPredictions();
    }, this.PREDICTION_INTERVAL);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [serverId, server] of this.servers) {
      try {
        // Simulate health check
        const isHealthy = await this.checkServerHealth(server);
        
        if (isHealthy) {
          server.health.status = this.determineHealthStatus(server);
          server.health.consecutiveFailures = 0;
          server.health.lastHealthCheck = new Date();
        } else {
          server.health.consecutiveFailures++;
          const strategy = this.strategies.get(this.currentStrategy);
          if (strategy && server.health.consecutiveFailures >= strategy.config.failureThreshold) {
            server.health.status = 'offline';
            console.log(`⚠️ Server ${serverId} marked as offline after ${server.health.consecutiveFailures} failures`);
          }
        }

        // Update dynamic weights based on performance
        this.updateServerWeights(server);
        
      } catch (error) {
        console.error(`❌ Health check failed for server ${serverId}:`, error);
        server.health.consecutiveFailures++;
      }
    }
  }

  private async checkServerHealth(server: ServerNode): Promise<boolean> {
    // Simulate health check with 98% success rate
    const random = Math.random();
    
    // Simulate degraded performance under high load
    const loadFactor = server.currentLoad.activeConnections / server.capacity.maxConcurrentConnections;
    const healthProbability = Math.max(0.8, 0.99 - (loadFactor * 0.15));
    
    return random < healthProbability;
  }

  private determineHealthStatus(server: ServerNode): ServerNode['health']['status'] {
    const cpuUsage = server.currentLoad.cpuUsage;
    const memoryUsage = server.currentLoad.memoryUsage;
    const connectionUtilization = server.currentLoad.activeConnections / server.capacity.maxConcurrentConnections;

    if (cpuUsage > server.capacity.maxCpuThreshold || 
        memoryUsage > server.capacity.maxMemoryThreshold || 
        connectionUtilization > 0.9) {
      return 'critical';
    } else if (cpuUsage > server.capacity.maxCpuThreshold * 0.8 || 
               memoryUsage > server.capacity.maxMemoryThreshold * 0.8 || 
               connectionUtilization > 0.7) {
      return 'degraded';
    }

    return 'healthy';
  }

  private updateServerWeights(server: ServerNode): void {
    // Calculate dynamic weight based on performance metrics
    const performanceScore = this.calculatePerformanceScore(server);
    const healthScore = this.calculateHealthScore(server);
    const loadScore = this.calculateLoadScore(server);

    // Combine scores to create dynamic weight
    server.weights.dynamic = (performanceScore * 0.4 + healthScore * 0.4 + loadScore * 0.2);
    
    // Apply geographic bonus if applicable
    const strategy = this.strategies.get(this.currentStrategy);
    if (strategy?.config.considerGeography) {
      // Simplified geographic scoring - in production would use actual client location
      server.weights.geographic = 1.0 + (Math.random() * 0.4 - 0.2); // ±20% geographic variance
    }

    // Calculate final weight
    server.weights.final = server.weights.static * server.weights.dynamic * server.weights.geographic;
    server.lastUpdate = new Date();
  }

  private calculatePerformanceScore(server: ServerNode): number {
    const responseScore = Math.max(0, 1 - (server.performance.avgResponseTime - 20) / 100);
    const errorScore = Math.max(0, 1 - server.performance.errorRate * 20);
    const reliabilityScore = server.performance.reliability;
    
    return (responseScore + errorScore + reliabilityScore) / 3;
  }

  private calculateHealthScore(server: ServerNode): number {
    switch (server.health.status) {
      case 'healthy': return 1.0;
      case 'degraded': return 0.7;
      case 'critical': return 0.3;
      case 'offline': return 0.0;
      default: return 0.5;
    }
  }

  private calculateLoadScore(server: ServerNode): number {
    const connectionLoad = server.currentLoad.activeConnections / server.capacity.maxConcurrentConnections;
    const cpuLoad = server.currentLoad.cpuUsage / 100;
    const memoryLoad = server.currentLoad.memoryUsage / 100;
    
    const averageLoad = (connectionLoad + cpuLoad + memoryLoad) / 3;
    return Math.max(0, 1 - averageLoad);
  }

  async routeRequest(clientId: string, requestType: string, clientLocation?: any): Promise<RoutingDecision> {
    const startTime = Date.now();
    const strategy = this.strategies.get(this.currentStrategy);
    
    if (!strategy) {
      throw new Error(`Strategy ${this.currentStrategy} not found`);
    }

    const availableServers = Array.from(this.servers.values())
      .filter(server => server.health.status !== 'offline');

    if (availableServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    const selectedServer = this.selectOptimalServer(availableServers, strategy, clientLocation);
    const alternativeServers = this.getAlternativeServers(selectedServer, availableServers, 2);

    const decision: RoutingDecision = {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      clientId,
      clientLocation,
      requestType,
      selectedServer: selectedServer.id,
      alternativeServers: alternativeServers.map(s => s.id),
      strategy: this.currentStrategy,
      factors: {
        serverLoad: this.calculateLoadScore(selectedServer),
        networkLatency: this.estimateNetworkLatency(selectedServer, clientLocation),
        geographic: selectedServer.weights.geographic,
        predictedPerformance: this.predictServerPerformance(selectedServer),
        reliability: selectedServer.performance.reliability
      },
      decisionTime: Date.now() - startTime
    };

    // Update server load
    selectedServer.currentLoad.activeConnections++;
    
    // Store routing decision
    this.routingHistory.push(decision);
    if (this.routingHistory.length > 10000) {
      this.routingHistory = this.routingHistory.slice(-5000);
    }

    return decision;
  }

  private selectOptimalServer(
    servers: ServerNode[], 
    strategy: LoadBalancingStrategy, 
    clientLocation?: any
  ): ServerNode {
    switch (strategy.algorithm) {
      case 'ai-optimized':
        return this.selectUsingAI(servers, clientLocation);
      case 'weighted-round-robin':
        return this.selectUsingWeightedRoundRobin(servers);
      case 'least-connections':
        return this.selectLeastConnections(servers);
      case 'geographic':
        return this.selectByGeography(servers, clientLocation);
      case 'predictive':
        return this.selectUsingPredictions(servers, clientLocation);
      default:
        return servers[0];
    }
  }

  private selectUsingAI(servers: ServerNode[], clientLocation?: any): ServerNode {
    // Advanced AI selection considering multiple factors
    let bestServer = servers[0];
    let bestScore = 0;

    for (const server of servers) {
      const score = this.calculateAIScore(server, clientLocation);
      if (score > bestScore) {
        bestScore = score;
        bestServer = server;
      }
    }

    return bestServer;
  }

  private calculateAIScore(server: ServerNode, clientLocation?: any): number {
    const performanceScore = this.calculatePerformanceScore(server) * 0.3;
    const healthScore = this.calculateHealthScore(server) * 0.25;
    const loadScore = this.calculateLoadScore(server) * 0.25;
    const geographicScore = this.calculateGeographicScore(server, clientLocation) * 0.2;
    
    return performanceScore + healthScore + loadScore + geographicScore;
  }

  private calculateGeographicScore(server: ServerNode, clientLocation?: any): number {
    if (!clientLocation) return 0.5;
    
    // Simplified geographic scoring - in production would use actual distances
    const regionPriority = {
      'us-east-1': { 'US': 1.0, 'CA': 0.8, 'EU': 0.4, 'APAC': 0.2 },
      'us-west-2': { 'US': 1.0, 'CA': 0.9, 'APAC': 0.6, 'EU': 0.3 },
      'eu-west-1': { 'EU': 1.0, 'US': 0.4, 'CA': 0.3, 'APAC': 0.2 },
      'ap-southeast-1': { 'APAC': 1.0, 'US': 0.3, 'EU': 0.2, 'CA': 0.3 }
    };

    const serverRegionMap = regionPriority[server.region as keyof typeof regionPriority];
    const clientRegion = clientLocation.country || 'US';
    
    return serverRegionMap?.[clientRegion as keyof typeof serverRegionMap] || 0.5;
  }

  private selectUsingWeightedRoundRobin(servers: ServerNode[]): ServerNode {
    const totalWeight = servers.reduce((sum, server) => sum + server.weights.final, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const server of servers) {
      randomWeight -= server.weights.final;
      if (randomWeight <= 0) {
        return server;
      }
    }
    
    return servers[0];
  }

  private selectLeastConnections(servers: ServerNode[]): ServerNode {
    return servers.reduce((min, server) => 
      server.currentLoad.activeConnections < min.currentLoad.activeConnections ? server : min
    );
  }

  private selectByGeography(servers: ServerNode[], clientLocation?: any): ServerNode {
    if (!clientLocation) return this.selectLeastConnections(servers);
    
    // Sort by geographic score and select best performing in preferred region
    const scored = servers.map(server => ({
      server,
      score: this.calculateGeographicScore(server, clientLocation) * this.calculatePerformanceScore(server)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].server;
  }

  private selectUsingPredictions(servers: ServerNode[], clientLocation?: any): ServerNode {
    // Use predictions to anticipate best server performance
    const predictions = this.getPredictionsForServers(servers);
    
    let bestServer = servers[0];
    let bestPredictedScore = 0;
    
    for (const server of servers) {
      const prediction = predictions.get(server.id) || 0.5;
      const currentScore = this.calculateAIScore(server, clientLocation);
      const predictedScore = currentScore * 0.7 + prediction * 0.3;
      
      if (predictedScore > bestPredictedScore) {
        bestPredictedScore = predictedScore;
        bestServer = server;
      }
    }
    
    return bestServer;
  }

  private getPredictionsForServers(servers: ServerNode[]): Map<string, number> {
    const predictions = new Map<string, number>();
    
    for (const server of servers) {
      const predictedScore = this.predictServerPerformance(server);
      predictions.set(server.id, predictedScore);
    }
    
    return predictions;
  }

  private predictServerPerformance(server: ServerNode): number {
    // Simplified prediction based on recent trends
    const basePerformance = this.calculatePerformanceScore(server);
    const loadTrend = this.estimateLoadTrend(server);
    const healthTrend = server.health.consecutiveFailures === 0 ? 0.1 : -0.1;
    
    return Math.max(0, Math.min(1, basePerformance + loadTrend + healthTrend));
  }

  private estimateLoadTrend(server: ServerNode): number {
    // Simulate load trend analysis
    const currentUtilization = server.currentLoad.activeConnections / server.capacity.maxConcurrentConnections;
    return Math.random() * 0.2 - 0.1 - (currentUtilization * 0.1);
  }

  private estimateNetworkLatency(server: ServerNode, clientLocation?: any): number {
    // Simplified latency estimation
    const baseLatency = server.performance.avgResponseTime;
    const geographicPenalty = clientLocation ? 
      this.calculateGeographicScore(server, clientLocation) * 50 : 0;
    
    return baseLatency + geographicPenalty;
  }

  private getAlternativeServers(selected: ServerNode, available: ServerNode[], count: number): ServerNode[] {
    return available
      .filter(server => server.id !== selected.id)
      .sort((a, b) => this.calculateAIScore(b) - this.calculateAIScore(a))
      .slice(0, count);
  }

  private async collectMetrics(): Promise<void> {
    const servers = Array.from(this.servers.values());
    const totalRequests = this.routingHistory.length;
    
    // Calculate distribution efficiency
    const serverRequestCounts = new Map<string, number>();
    for (const decision of this.routingHistory) {
      const count = serverRequestCounts.get(decision.selectedServer) || 0;
      serverRequestCounts.set(decision.selectedServer, count + 1);
    }
    
    const requestCounts = Array.from(serverRequestCounts.values());
    const avgRequests = requestCounts.reduce((sum, count) => sum + count, 0) / requestCounts.length;
    const variance = requestCounts.reduce((sum, count) => sum + Math.pow(count - avgRequests, 2), 0) / requestCounts.length;
    const distributionEfficiency = Math.max(0, 1 - (Math.sqrt(variance) / avgRequests));

    // Calculate server utilization
    const serverUtilization: Record<string, number> = {};
    for (const server of servers) {
      serverUtilization[server.id] = server.currentLoad.activeConnections / server.capacity.maxConcurrentConnections;
    }

    // Calculate average response time
    const recentDecisions = this.routingHistory.slice(-1000);
    const avgResponseTime = recentDecisions
      .filter(d => d.outcome?.responseTime)
      .reduce((sum, d) => sum + (d.outcome?.responseTime || 0), 0) / recentDecisions.length;

    // Calculate error rate
    const errorRate = recentDecisions
      .filter(d => d.outcome && !d.outcome.success).length / recentDecisions.length;

    // Geographic distribution
    const geographicDistribution: Record<string, number> = {};
    for (const decision of recentDecisions) {
      const region = decision.clientLocation?.region || 'unknown';
      geographicDistribution[region] = (geographicDistribution[region] || 0) + 1;
    }

    // Top and underperforming servers
    const performanceScores = servers.map(s => ({
      id: s.id,
      score: this.calculatePerformanceScore(s)
    }));
    performanceScores.sort((a, b) => b.score - a.score);

    const metrics: LoadBalancingMetrics = {
      timestamp: new Date(),
      totalRequests,
      distributionEfficiency,
      serverUtilization,
      averageResponseTime: avgResponseTime || 0,
      errorRate: errorRate || 0,
      failoverEvents: 0, // Would track actual failover events
      geographicDistribution,
      topPerformingServers: performanceScores.slice(0, 3).map(s => s.id),
      underPerformingServers: performanceScores.slice(-2).map(s => s.id)
    };

    this.metrics.push(metrics);
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  private async generateTrafficPredictions(): Promise<void> {
    const now = new Date();
    const recentHistory = this.routingHistory.slice(-1000);
    
    // Simple prediction model based on recent patterns
    const hourlyPattern = this.analyzeHourlyPattern(recentHistory);
    const regionalPattern = this.analyzeRegionalPattern(recentHistory);
    const typePattern = this.analyzeTypePattern(recentHistory);

    const prediction: TrafficPrediction = {
      timestamp: now,
      timeHorizon: 60, // 1 hour prediction
      predictions: {
        totalRequests: this.predictTotalRequests(hourlyPattern),
        requestsByRegion: this.predictRequestsByRegion(regionalPattern),
        requestsByType: this.predictRequestsByType(typePattern),
        peakLoad: this.predictPeakLoad(hourlyPattern),
        averageLoad: this.predictAverageLoad(hourlyPattern)
      },
      confidence: 0.75, // Simplified confidence score
      modelUsed: 'pattern-analysis-v1',
      factors: ['hourly-pattern', 'regional-distribution', 'request-types']
    };

    this.trafficPredictions.push(prediction);
    if (this.trafficPredictions.length > 100) {
      this.trafficPredictions = this.trafficPredictions.slice(-50);
    }
  }

  private analyzeHourlyPattern(history: RoutingDecision[]): number[] {
    const hourlyCount = new Array(24).fill(0);
    for (const decision of history) {
      const hour = decision.timestamp.getHours();
      hourlyCount[hour]++;
    }
    return hourlyCount;
  }

  private analyzeRegionalPattern(history: RoutingDecision[]): Record<string, number> {
    const regionalCount: Record<string, number> = {};
    for (const decision of history) {
      const region = decision.clientLocation?.region || 'unknown';
      regionalCount[region] = (regionalCount[region] || 0) + 1;
    }
    return regionalCount;
  }

  private analyzeTypePattern(history: RoutingDecision[]): Record<string, number> {
    const typeCount: Record<string, number> = {};
    for (const decision of history) {
      typeCount[decision.requestType] = (typeCount[decision.requestType] || 0) + 1;
    }
    return typeCount;
  }

  private predictTotalRequests(hourlyPattern: number[]): number {
    const currentHour = new Date().getHours();
    const nextHour = (currentHour + 1) % 24;
    return Math.round(hourlyPattern[nextHour] * 1.1); // 10% growth estimate
  }

  private predictRequestsByRegion(regionalPattern: Record<string, number>): Record<string, number> {
    const predictions: Record<string, number> = {};
    for (const [region, count] of Object.entries(regionalPattern)) {
      predictions[region] = Math.round(count * 1.05); // 5% growth per region
    }
    return predictions;
  }

  private predictRequestsByType(typePattern: Record<string, number>): Record<string, number> {
    const predictions: Record<string, number> = {};
    for (const [type, count] of Object.entries(typePattern)) {
      predictions[type] = Math.round(count * 1.08); // 8% growth per type
    }
    return predictions;
  }

  private predictPeakLoad(hourlyPattern: number[]): number {
    return Math.max(...hourlyPattern) * 1.2; // 20% buffer for peak
  }

  private predictAverageLoad(hourlyPattern: number[]): number {
    return hourlyPattern.reduce((sum, count) => sum + count, 0) / hourlyPattern.length;
  }

  // Public API methods
  async getServerHealth(): Promise<ServerNode[]> {
    return Array.from(this.servers.values())
      .sort((a, b) => this.calculatePerformanceScore(b) - this.calculatePerformanceScore(a));
  }

  async getLoadBalancingStrategies(): Promise<LoadBalancingStrategy[]> {
    return Array.from(this.strategies.values());
  }

  async switchStrategy(strategyId: string): Promise<boolean> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy || !strategy.enabled) {
      return false;
    }
    
    this.currentStrategy = strategyId;
    strategy.lastUsed = new Date();
    console.log(`🔄 Switched to load balancing strategy: ${strategy.name}`);
    return true;
  }

  async getRoutingHistory(limit: number = 100): Promise<RoutingDecision[]> {
    return this.routingHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getTrafficPredictions(): Promise<TrafficPrediction[]> {
    return this.trafficPredictions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMetrics(limit: number = 50): Promise<LoadBalancingMetrics[]> {
    return this.metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async addServer(server: Omit<ServerNode, 'createdAt' | 'lastUpdate'>): Promise<boolean> {
    const newServer: ServerNode = {
      ...server,
      createdAt: new Date(),
      lastUpdate: new Date()
    };
    
    this.servers.set(server.id, newServer);
    console.log(`➕ Added new server: ${server.id}`);
    return true;
  }

  async removeServer(serverId: string): Promise<boolean> {
    if (this.servers.has(serverId)) {
      this.servers.delete(serverId);
      console.log(`➖ Removed server: ${serverId}`);
      return true;
    }
    return false;
  }

  async getLoadBalancingStats(): Promise<{
    totalServers: number;
    healthyServers: number;
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    distributionEfficiency: number;
    currentStrategy: string;
  }> {
    const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.health.status === 'healthy').length;
    const recentDecisions = this.routingHistory.slice(-1000);
    
    const successfulRequests = recentDecisions.filter(d => d.outcome?.success).length;
    const avgResponseTime = recentDecisions
      .filter(d => d.outcome?.responseTime)
      .reduce((sum, d) => sum + (d.outcome?.responseTime || 0), 0) / recentDecisions.length;

    const latestMetrics = this.metrics[this.metrics.length - 1];

    return {
      totalServers: servers.length,
      healthyServers,
      totalRequests: this.routingHistory.length,
      averageResponseTime: avgResponseTime || 0,
      successRate: recentDecisions.length > 0 ? successfulRequests / recentDecisions.length : 1,
      distributionEfficiency: latestMetrics?.distributionEfficiency || 0,
      currentStrategy: this.currentStrategy
    };
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
      this.predictionInterval = null;
    }
    
    this.servers.clear();
    this.strategies.clear();
    this.routingHistory = [];
    this.trafficPredictions = [];
    this.metrics = [];
    AdvancedLoadBalancer.instance = null;
  }
}

// Export singleton getter
export const getAdvancedLoadBalancer = () => AdvancedLoadBalancer.getInstance();
