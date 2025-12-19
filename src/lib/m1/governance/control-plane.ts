/**
 * M1 Control Plane
 *
 * Centralized management and orchestration platform for M1 services
 * Handles service coordination, configuration distribution, and state management
 *
 * Version: v2.8.0
 * Phase: 15B - Control Plane
 */

export type ServiceState = 'healthy' | 'degraded' | 'unhealthy' | 'offline';
export type DeploymentStrategy = 'rolling' | 'blue_green' | 'canary' | 'shadow';
export type ConfigScope = 'global' | 'regional' | 'service' | 'instance';

/**
 * Service registration
 */
export interface ServiceRegistration {
  id: string;
  name: string;
  namespace: string;
  version: string;
  endpoint: string;
  port: number;
  protocol: 'http' | 'grpc' | 'websocket';
  healthCheckUrl?: string;
  healthCheckInterval?: number; // milliseconds
  tags: string[];
  metadata: Record<string, unknown>;
  registeredAt: number;
  lastHeartbeat: number;
}

/**
 * Service instance health
 */
export interface ServiceHealth {
  serviceId: string;
  serviceName: string;
  state: ServiceState;
  lastCheck: number;
  responseTime: number; // milliseconds
  successRate: number; // 0-1
  errorCount: number;
  requestCount: number;
  metrics: {
    cpuUsage: number; // 0-1
    memoryUsage: number; // 0-1
    diskUsage: number; // 0-1
  };
}

/**
 * Configuration object
 */
export interface Configuration {
  id: string;
  key: string;
  value: unknown;
  scope: ConfigScope;
  targetService?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

/**
 * Deployment plan
 */
export interface DeploymentPlan {
  id: string;
  serviceId: string;
  serviceName: string;
  newVersion: string;
  currentVersion: string;
  strategy: DeploymentStrategy;
  status: 'planning' | 'approved' | 'in_progress' | 'completed' | 'rolled_back' | 'failed';
  canaryPercentage?: number; // For canary deployments
  maxConcurrentUpdates?: number; // For rolling deployments
  stages: DeploymentStage[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  rollbackReason?: string;
}

/**
 * Deployment stage
 */
export interface DeploymentStage {
  id: string;
  name: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  targetInstances: string[];
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

/**
 * Control Plane
 */
export class ControlPlane {
  private services: Map<string, ServiceRegistration> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private configurations: Map<string, Configuration> = new Map();
  private deployments: Map<string, DeploymentPlan> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timer> = new Map();
  private configVersions: Map<string, number> = new Map(); // key -> latest version

  /**
   * Register service
   */
  registerService(
    name: string,
    namespace: string,
    version: string,
    endpoint: string,
    port: number,
    protocol: 'http' | 'grpc' | 'websocket' = 'http',
    healthCheckUrl?: string,
    tags: string[] = [],
    metadata: Record<string, unknown> = {}
  ): string {
    const id = `svc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const service: ServiceRegistration = {
      id,
      name,
      namespace,
      version,
      endpoint,
      port,
      protocol,
      healthCheckUrl: healthCheckUrl || `/health`,
      healthCheckInterval: 30000, // 30 seconds
      tags,
      metadata,
      registeredAt: now,
      lastHeartbeat: now,
    };

    this.services.set(id, service);

    // Initialize health
    this.initializeServiceHealth(id, name);

    // Start health checks if interval is configured
    if (service.healthCheckInterval && service.healthCheckUrl) {
      this.startHealthChecks(id);
    }

    return id;
  }

  /**
   * Get service
   */
  getService(serviceId: string): ServiceRegistration | null {
    return this.services.get(serviceId) || null;
  }

  /**
   * Find services by name
   */
  findServicesByName(name: string): ServiceRegistration[] {
    return Array.from(this.services.values()).filter((s) => s.name === name);
  }

  /**
   * Get service health
   */
  getServiceHealth(serviceId: string): ServiceHealth | null {
    return this.serviceHealth.get(serviceId) || null;
  }

  /**
   * Get all healthy services
   */
  getHealthyServices(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values()).filter((h) => h.state === 'healthy');
  }

  /**
   * Update service health
   */
  updateServiceHealth(
    serviceId: string,
    state: ServiceState,
    responseTime: number,
    metrics: { cpuUsage: number; memoryUsage: number; diskUsage: number }
  ): void {
    const health = this.serviceHealth.get(serviceId);
    if (!health) {
return;
}

    const now = Date.now();
    health.state = state;
    health.lastCheck = now;
    health.responseTime = responseTime;
    health.metrics = metrics;

    // Update success rate
    health.requestCount++;
    if (state === 'healthy' || state === 'degraded') {
      health.successRate = (health.requestCount - health.errorCount) / health.requestCount;
    } else {
      health.errorCount++;
      health.successRate = (health.requestCount - health.errorCount) / health.requestCount;
    }

    this.serviceHealth.set(serviceId, health);
  }

  /**
   * Deregister service
   */
  deregisterService(serviceId: string): boolean {
    // Stop health checks
    const interval = this.healthCheckIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serviceId);
    }

    return this.services.delete(serviceId) && this.serviceHealth.delete(serviceId);
  }

  /**
   * Set configuration
   */
  setConfiguration(
    key: string,
    value: unknown,
    scope: ConfigScope = 'global',
    createdBy: string,
    targetService?: string
  ): string {
    const id = `config_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();
    const currentVersion = (this.configVersions.get(key) || 0) + 1;

    const config: Configuration = {
      id,
      key,
      value,
      scope,
      targetService,
      version: currentVersion,
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    this.configurations.set(id, config);
    this.configVersions.set(key, currentVersion);

    return id;
  }

  /**
   * Get configuration
   */
  getConfiguration(key: string, scope: ConfigScope = 'global'): Configuration | null {
    for (const config of this.configurations.values()) {
      if (config.key === key && config.scope === scope) {
        return config;
      }
    }
    return null;
  }

  /**
   * Get all configurations for scope
   */
  getConfigurationsByScope(scope: ConfigScope): Configuration[] {
    return Array.from(this.configurations.values()).filter((c) => c.scope === scope);
  }

  /**
   * Create deployment plan
   */
  createDeploymentPlan(
    serviceId: string,
    newVersion: string,
    strategy: DeploymentStrategy = 'rolling',
    canaryPercentage: number = 10,
    maxConcurrentUpdates: number = 1
  ): string | null {
    const service = this.services.get(serviceId);
    if (!service) {
return null;
}

    const id = `deploy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const plan: DeploymentPlan = {
      id,
      serviceId,
      serviceName: service.name,
      newVersion,
      currentVersion: service.version,
      strategy,
      status: 'planning',
      canaryPercentage: strategy === 'canary' ? canaryPercentage : undefined,
      maxConcurrentUpdates: strategy === 'rolling' ? maxConcurrentUpdates : undefined,
      stages: this.createDeploymentStages(strategy),
      createdAt: now,
    };

    this.deployments.set(id, plan);
    return id;
  }

  /**
   * Get deployment plan
   */
  getDeploymentPlan(deploymentId: string): DeploymentPlan | null {
    return this.deployments.get(deploymentId) || null;
  }

  /**
   * Approve deployment
   */
  approveDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'planning') {
return false;
}

    deployment.status = 'approved';
    return true;
  }

  /**
   * Start deployment
   */
  startDeployment(deploymentId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment || deployment.status !== 'approved') {
return false;
}

    const now = Date.now();
    deployment.status = 'in_progress';
    deployment.startedAt = now;

    // Start first stage
    if (deployment.stages.length > 0) {
      deployment.stages[0].status = 'in_progress';
      deployment.stages[0].startedAt = now;
    }

    return true;
  }

  /**
   * Complete deployment stage
   */
  completeDeploymentStage(deploymentId: string, stageId: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
return false;
}

    const stageIndex = deployment.stages.findIndex((s) => s.id === stageId);
    if (stageIndex === -1) {
return false;
}

    const stage = deployment.stages[stageIndex];
    const now = Date.now();

    stage.status = 'completed';
    stage.completedAt = now;
    stage.duration = now - (stage.startedAt || now);

    // Start next stage
    if (stageIndex + 1 < deployment.stages.length) {
      const nextStage = deployment.stages[stageIndex + 1];
      nextStage.status = 'in_progress';
      nextStage.startedAt = now;
    } else {
      // All stages complete
      deployment.status = 'completed';
      deployment.completedAt = now;

      // Update service version
      const service = this.services.get(deployment.serviceId);
      if (service) {
        service.version = deployment.newVersion;
      }
    }

    return true;
  }

  /**
   * Rollback deployment
   */
  rollbackDeployment(deploymentId: string, reason: string): boolean {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
return false;
}

    const now = Date.now();
    deployment.status = 'rolled_back';
    deployment.rollbackReason = reason;
    deployment.completedAt = now;

    // Revert service version
    const service = this.services.get(deployment.serviceId);
    if (service) {
      service.version = deployment.currentVersion;
    }

    return true;
  }

  /**
   * Get active deployments
   */
  getActiveDeployments(): DeploymentPlan[] {
    return Array.from(this.deployments.values()).filter(
      (d) => d.status === 'planning' || d.status === 'approved' || d.status === 'in_progress'
    );
  }

  /**
   * Get control plane statistics
   */
  getStatistics(): Record<string, unknown> {
    const services = Array.from(this.services.values());
    const health = Array.from(this.serviceHealth.values());

    const healthyCount = health.filter((h) => h.state === 'healthy').length;
    const degradedCount = health.filter((h) => h.state === 'degraded').length;
    const unhealthyCount = health.filter((h) => h.state === 'unhealthy').length;
    const offlineCount = health.filter((h) => h.state === 'offline').length;

    const avgResponseTime = health.length > 0 ? health.reduce((sum, h) => sum + h.responseTime, 0) / health.length : 0;

    const deployments = Array.from(this.deployments.values());
    const completedDeployments = deployments.filter((d) => d.status === 'completed').length;
    const failedDeployments = deployments.filter((d) => d.status === 'failed').length;
    const rolledBackDeployments = deployments.filter((d) => d.status === 'rolled_back').length;

    return {
      registeredServices: services.length,
      serviceHealth: {
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount,
        offline: offlineCount,
      },
      avgResponseTime,
      activeDeployments: this.getActiveDeployments().length,
      totalDeployments: deployments.length,
      completedDeployments,
      failedDeployments,
      rolledBackDeployments,
      configurations: this.configurations.size,
    };
  }

  /**
   * Start health checks for service
   */
  private startHealthChecks(serviceId: string): void {
    const service = this.services.get(serviceId);
    if (!service) {
return;
}

    const interval = setInterval(() => {
      // Simulate health check
      const responseTime = Math.random() * 500; // 0-500ms
      const state: ServiceState = responseTime < 100 ? 'healthy' : responseTime < 300 ? 'degraded' : 'unhealthy';

      this.updateServiceHealth(serviceId, state, responseTime, {
        cpuUsage: Math.random(),
        memoryUsage: Math.random(),
        diskUsage: Math.random(),
      });
    }, service.healthCheckInterval || 30000);

    this.healthCheckIntervals.set(serviceId, interval);
  }

  /**
   * Initialize service health
   */
  private initializeServiceHealth(serviceId: string, serviceName: string): void {
    const health: ServiceHealth = {
      serviceId,
      serviceName,
      state: 'healthy',
      lastCheck: Date.now(),
      responseTime: 0,
      successRate: 1.0,
      errorCount: 0,
      requestCount: 0,
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
      },
    };

    this.serviceHealth.set(serviceId, health);
  }

  /**
   * Create deployment stages based on strategy
   */
  private createDeploymentStages(strategy: DeploymentStrategy): DeploymentStage[] {
    const now = Date.now();

    switch (strategy) {
      case 'rolling':
        return [
          {
            id: `stage_${Date.now()}_1`,
            name: 'Rolling Update - Batch 1',
            order: 1,
            status: 'pending',
            targetInstances: [],
          },
          {
            id: `stage_${Date.now()}_2`,
            name: 'Rolling Update - Batch 2',
            order: 2,
            status: 'pending',
            targetInstances: [],
          },
        ];

      case 'blue_green':
        return [
          {
            id: `stage_${Date.now()}_1`,
            name: 'Deploy to Green',
            order: 1,
            status: 'pending',
            targetInstances: [],
          },
          {
            id: `stage_${Date.now()}_2`,
            name: 'Switch Traffic',
            order: 2,
            status: 'pending',
            targetInstances: [],
          },
        ];

      case 'canary':
        return [
          {
            id: `stage_${Date.now()}_1`,
            name: 'Deploy Canary',
            order: 1,
            status: 'pending',
            targetInstances: [],
          },
          {
            id: `stage_${Date.now()}_2`,
            name: 'Monitor Metrics',
            order: 2,
            status: 'pending',
            targetInstances: [],
          },
          {
            id: `stage_${Date.now()}_3`,
            name: 'Gradual Rollout',
            order: 3,
            status: 'pending',
            targetInstances: [],
          },
        ];

      case 'shadow':
        return [
          {
            id: `stage_${Date.now()}_1`,
            name: 'Deploy Shadow',
            order: 1,
            status: 'pending',
            targetInstances: [],
          },
          {
            id: `stage_${Date.now()}_2`,
            name: 'Shadow Traffic Routing',
            order: 2,
            status: 'pending',
            targetInstances: [],
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Shutdown control plane
   */
  shutdown(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }
}

// Export singleton
export const controlPlane = new ControlPlane();
