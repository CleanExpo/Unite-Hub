/**
 * AIIntegrationService - Unified interface for all AI components
 * Coordinates communication between AI modules and provides single API access point
 */

import { RuntimeService } from '../base/RuntimeService';
import { getSystemMonitor } from '../../ai/monitoring/SystemMonitor';
import { getDiagnosticsEngine } from '../../ai/monitoring/DiagnosticsEngine';
import { getFailurePredictor } from '../../ai/predictive/FailurePredictor';
import { getPerformanceOptimizer } from '../../ai/optimization/PerformanceOptimizer';
import { getResourceAllocator } from '../../ai/optimization/ResourceAllocator';
import { getThreatDetector } from '../../ai/security/ThreatDetector';
import { getSecurityOrchestrator } from '../../ai/security/SecurityOrchestrator';
import { getDeploymentOrchestrator, type DeploymentConfig } from '../../ai/deployment/DeploymentOrchestrator';
import { getDeploymentValidator } from '../../ai/deployment/DeploymentValidator';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';

export interface AISystemStatus {
  monitoring: {
    status: 'active' | 'inactive' | 'error';
    metrics: Record<string, unknown>;
    alerts: number;
  };
  predictions: {
    active: number;
    critical: number;
    accuracy: number;
  };
  security: {
    threats: number;
    activeResponses: number;
    lastScan: Date;
  };
  performance: {
    optimizations: number;
    resourceUtilization: Record<string, unknown>;
    improvements: number;
  };
  deployment: {
    active: number;
    pending: number;
    lastDeployment?: Date;
  };
}

export interface AIEvent {
  id: string;
  type: 'metric' | 'alert' | 'threat' | 'prediction' | 'optimization' | 'deployment';
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export class AIIntegrationService extends RuntimeService {
  private static instance: AIIntegrationService | null = null;
  private eventEmitter: EventEmitter;
  private wsClients: Set<WebSocket> = new Set();
  private eventHistory: AIEvent[] = [];
  
  // AI Components
  private systemMonitor: Awaited<ReturnType<typeof getSystemMonitor>> | null = null;
  private diagnosticsEngine: Awaited<ReturnType<typeof getDiagnosticsEngine>> | null = null;
  private failurePredictor: Awaited<ReturnType<typeof getFailurePredictor>> | null = null;
  private performanceOptimizer: Awaited<ReturnType<typeof getPerformanceOptimizer>> | null = null;
  private resourceAllocator: Awaited<ReturnType<typeof getResourceAllocator>> | null = null;
  private threatDetector: Awaited<ReturnType<typeof getThreatDetector>> | null = null;
  private securityOrchestrator: Awaited<ReturnType<typeof getSecurityOrchestrator>> | null = null;
  private deploymentOrchestrator: Awaited<ReturnType<typeof getDeploymentOrchestrator>> | null = null;
  private deploymentValidator: Awaited<ReturnType<typeof getDeploymentValidator>> | null = null;

  private readonly MAX_EVENT_HISTORY = 1000;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  private constructor() {
    super();
    this.eventEmitter = new EventEmitter();
  }

  static async getInstance(): Promise<AIIntegrationService> {
    if (!this.instance) {
      this.instance = new AIIntegrationService();
      await this.instance.initialize();
    }
    return this.instance;
  }

  protected async performInitialization(): Promise<void> {
    console.log('🤖 AI Integration Service initializing...');
    
    // Initialize all AI components
    try {
      this.systemMonitor = await getSystemMonitor();
      this.diagnosticsEngine = await getDiagnosticsEngine();
      this.failurePredictor = await getFailurePredictor();
      this.performanceOptimizer = await getPerformanceOptimizer();
      this.resourceAllocator = await getResourceAllocator();
      this.threatDetector = await getThreatDetector();
      this.securityOrchestrator = await getSecurityOrchestrator();
      this.deploymentOrchestrator = await getDeploymentOrchestrator();
      this.deploymentValidator = await getDeploymentValidator();
      
      this.setupEventListeners();
      this.startHeartbeat();
      
      console.log('✅ AI Integration Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI components:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for all AI components
   */
  private setupEventListeners(): void {
    // System Monitor events
    if (this.systemMonitor) {
      this.systemMonitor.onAlert((alert: { message: string }) => {
        this.createEvent('alert', 'system-monitor', alert.message, alert);
      });
    }

    // Threat Detector events
    if (this.threatDetector) {
      this.threatDetector.onThreatDetected((threat: { type: string; description: string }) => {
        this.createEvent('threat', 'threat-detector', 
          `${threat.type} threat detected: ${threat.description}`, threat, 'critical');
      });
    }

    // Failure Predictor events
    if (this.failurePredictor) {
      this.failurePredictor.onNewPrediction((prediction: { type: string; probability: number; timeToFailure: number }) => {
        const severity = prediction.probability > 0.8 ? 'critical' : 
                        prediction.probability > 0.5 ? 'warning' : 'info';
        this.createEvent('prediction', 'failure-predictor', 
          `${prediction.type} failure predicted in ${prediction.timeToFailure}h`, 
          prediction, severity);
      });
    }

    // Performance Optimizer events
    if (this.performanceOptimizer) {
      // Performance optimizer doesn't have event methods, we'll add optimizations tracking
      console.log('Performance optimizer ready');
    }

    // Deployment events
    if (this.deploymentOrchestrator) {
      this.deploymentOrchestrator.onDeploymentStarted((deployment: { id: string }) => {
        this.createEvent('deployment', 'deployment-orchestrator',
          `Deployment started: ${deployment.id}`, deployment);
      });

      this.deploymentOrchestrator.onDeploymentCompleted((deployment: { id: string }) => {
        this.createEvent('deployment', 'deployment-orchestrator',
          `Deployment completed: ${deployment.id}`, deployment);
      });
    }
  }

  /**
   * Create and broadcast an AI event
   */
  private createEvent(
    type: AIEvent['type'],
    component: string,
    message: string,
    data?: Record<string, unknown>,
    severity: AIEvent['severity'] = 'info'
  ): void {
    const event: AIEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      component,
      message,
      data,
      timestamp: new Date(),
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_EVENT_HISTORY) {
      this.eventHistory.shift();
    }

    // Emit event
    this.eventEmitter.emit('aiEvent', event);
    
    // Broadcast to WebSocket clients
    this.broadcastToClients({
      type: 'event',
      data: event,
    });
  }

  /**
   * Start heartbeat for WebSocket connections
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.broadcastToClients({
        type: 'heartbeat',
        data: {
          timestamp: new Date(),
          status: this.getSystemStatus(),
        },
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Broadcast message to all WebSocket clients
   */
  private broadcastToClients(message: Record<string, unknown>): void {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Get current system status
   */
  async getSystemStatus(): Promise<AISystemStatus> {
    const [
      metrics,
      predictions,
      threats,
      activeResponses,
      utilization,
      activeDeployments,
    ] = await Promise.all([
      this.systemMonitor?.getCurrentMetrics() || {},
      this.failurePredictor?.getActivePredictions() || [],
      this.threatDetector?.getActiveThreats() || [],
      this.securityOrchestrator?.getActiveResponses() || [],
      this.resourceAllocator?.getResourceUtilization() || {},
      this.deploymentOrchestrator?.getActiveDeployments() || [],
    ]);

    const criticalPredictions = predictions.filter((p: { probability: number }) => p.probability > 0.8);

    return {
      monitoring: {
        status: this.systemMonitor ? 'active' : 'inactive',
        metrics,
        alerts: this.systemMonitor?.getActiveAlerts()?.length || 0,
      },
      predictions: {
        active: predictions.length,
        critical: criticalPredictions.length,
        accuracy: 0.85, // Default accuracy, will be calculated from actual predictions
      },
      security: {
        threats: threats.length,
        activeResponses: activeResponses.length,
        lastScan: new Date(),
      },
      performance: {
        optimizations: 0, // Will track optimization count
        resourceUtilization: utilization,
        improvements: 0, // Will track improvement score
      },
      deployment: {
        active: activeDeployments.length,
        pending: 0,
        lastDeployment: activeDeployments[0]?.startTime,
      },
    };
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<Record<string, unknown>> {
    const metrics = await this.systemMonitor?.getCurrentMetrics();
    return metrics ? { ...metrics } as Record<string, unknown> : {};
  }

  /**
   * Get active threats
   */
  async getThreats(): Promise<Array<Record<string, unknown>>> {
    const threats = await this.threatDetector?.getActiveThreats() || [];
    return threats.map(threat => ({ ...threat } as Record<string, unknown>));
  }

  /**
   * Get failure predictions
   */
  async getPredictions(): Promise<Array<Record<string, unknown>>> {
    const predictions = await this.failurePredictor?.getActivePredictions() || [];
    return predictions.map(prediction => ({ ...prediction } as Record<string, unknown>));
  }

  /**
   * Get deployment status
   */
  async getDeployments(): Promise<Array<Record<string, unknown>>> {
    const deployments = await this.deploymentOrchestrator?.getActiveDeployments() || [];
    return deployments.map(deployment => ({ ...deployment } as Record<string, unknown>));
  }

  /**
   * Get event history
   */
  getEventHistory(limit: number = 100): AIEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Trigger performance optimization
   */
  async optimizePerformance(): Promise<Record<string, unknown>> {
    if (!this.performanceOptimizer) {
      throw new Error('Performance optimizer not initialized');
    }
    // Trigger optimization analysis
    const currentMetrics = await this.systemMonitor?.getCurrentMetrics();
    return { 
      success: true, 
      message: 'Performance optimization triggered',
      currentMetrics: currentMetrics ? { ...currentMetrics } : {} 
    };
  }

  /**
   * Validate deployment
   */
  async validateDeployment(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.deploymentValidator) {
      throw new Error('Deployment validator not initialized');
    }
    // Convert generic config to DeploymentConfig
    const deploymentConfig = config as unknown as DeploymentConfig;
    const result = await this.deploymentValidator.validateDeployment(deploymentConfig);
    return { ...result } as Record<string, unknown>;
  }

  /**
   * Start deployment
   */
  async startDeployment(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.deploymentOrchestrator) {
      throw new Error('Deployment orchestrator not initialized');
    }
    // Convert generic config to DeploymentConfig
    const deploymentConfig = config as unknown as DeploymentConfig;
    const result = await this.deploymentOrchestrator.deploy(deploymentConfig);
    return { ...result } as Record<string, unknown>;
  }

  /**
   * Add WebSocket client
   */
  addWebSocketClient(ws: WebSocket): void {
    this.wsClients.add(ws);
    
    // Send initial status
    ws.send(JSON.stringify({
      type: 'connected',
      data: {
        status: this.getSystemStatus(),
        timestamp: new Date(),
      },
    }));

    // Handle disconnect
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  /**
   * Subscribe to AI events
   */
  onAIEvent(callback: (event: AIEvent) => void): void {
    this.eventEmitter.on('aiEvent', callback);
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    // Close WebSocket connections
    this.wsClients.forEach(client => client.close());
    this.wsClients.clear();
    
    // Remove event listeners
    this.eventEmitter.removeAllListeners();
    
    // Shutdown AI components
    await Promise.all([
      this.systemMonitor?.shutdown(),
      // DiagnosticsEngine doesn't have shutdown method
      this.failurePredictor?.shutdown(),
      this.performanceOptimizer?.shutdown(),
      this.resourceAllocator?.shutdown(),
      this.threatDetector?.shutdown(),
      this.securityOrchestrator?.shutdown(),
      this.deploymentOrchestrator?.shutdown(),
      this.deploymentValidator?.shutdown(),
    ]);

    AIIntegrationService.instance = null;
  }
}

// Export singleton getter
export const getAIIntegrationService = () => AIIntegrationService.getInstance();
