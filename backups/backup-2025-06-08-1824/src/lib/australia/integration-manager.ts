/**
 * Australian Integration Manager
 * Unite Group - Integration Layer for Australian Operations
 */

import type {
  AustralianServiceConfig,
  AustralianIntegrationEvent,
  AustralianAPIResponse
} from './types';

export interface AustralianEventHandler {
  (event: AustralianIntegrationEvent): Promise<void>;
}

export interface AustralianIntegrationEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  enabled: boolean;
}

export class AustralianIntegrationManager {
  private config: AustralianServiceConfig;
  private eventHandlers: Map<string, AustralianEventHandler[]>;
  private endpoints: Map<string, AustralianIntegrationEndpoint>;
  private eventQueue: AustralianIntegrationEvent[];
  private processing: boolean;

  constructor(config: AustralianServiceConfig) {
    this.config = config;
    this.eventHandlers = new Map();
    this.endpoints = new Map();
    this.eventQueue = [];
    this.processing = false;
    
    this.initializeDefaultEndpoints();
    this.startEventProcessor();
  }

  /**
   * Register event handler for specific event types
   */
  onEvent(eventType: AustralianIntegrationEvent['type'], handler: AustralianEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Emit integration event
   */
  async emitEvent(event: AustralianIntegrationEvent): Promise<void> {
    // Add to queue for processing
    this.eventQueue.push(event);
    
    // Process immediately if not already processing
    if (!this.processing) {
      await this.processEventQueue();
    }
  }

  /**
   * Register integration endpoint
   */
  registerEndpoint(endpoint: AustralianIntegrationEndpoint): void {
    this.endpoints.set(endpoint.name, endpoint);
  }

  /**
   * Send data to external integration endpoint
   */
  async sendToEndpoint(
    endpointName: string,
    data: unknown
  ): Promise<AustralianAPIResponse<unknown>> {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      return {
        success: false,
        error: `Endpoint '${endpointName}' not found`,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }

    if (!endpoint.enabled) {
      return {
        success: false,
        error: `Endpoint '${endpointName}' is disabled`,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }

    try {
      const startTime = Date.now();
      
      // Prepare request
      const requestInit: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Unite-Group-Australian-Integration/1.0',
          ...endpoint.headers
        }
      };

      if (['POST', 'PUT'].includes(endpoint.method)) {
        requestInit.body = JSON.stringify(data);
      }

      // Send request
      const response = await fetch(endpoint.url, requestInit);
      const responseData = await response.json();

      return {
        success: response.ok,
        data: responseData,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Integration request failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  /**
   * Sync Australian business data with external systems
   */
  async syncWithExternalSystems(data: {
    userProfiles?: unknown[];
    marketData?: unknown;
    businessMetrics?: unknown;
  }): Promise<AustralianAPIResponse<{ syncResults: Record<string, boolean> }>> {
    const syncResults: Record<string, boolean> = {};
    
    try {
      // Sync with CRM system
      if (data.userProfiles && this.endpoints.has('crm')) {
        const crmResult = await this.sendToEndpoint('crm', {
          type: 'user_profiles',
          data: data.userProfiles,
          timestamp: new Date().toISOString(),
          source: 'australian-business-intelligence'
        });
        syncResults.crm = crmResult.success;
      }

      // Sync with analytics platform
      if (data.businessMetrics && this.endpoints.has('analytics')) {
        const analyticsResult = await this.sendToEndpoint('analytics', {
          type: 'business_metrics',
          data: data.businessMetrics,
          timestamp: new Date().toISOString(),
          source: 'australian-business-intelligence'
        });
        syncResults.analytics = analyticsResult.success;
      }

      // Sync with marketing automation
      if (data.marketData && this.endpoints.has('marketing')) {
        const marketingResult = await this.sendToEndpoint('marketing', {
          type: 'market_insights',
          data: data.marketData,
          timestamp: new Date().toISOString(),
          source: 'australian-business-intelligence'
        });
        syncResults.marketing = marketingResult.success;
      }

      return {
        success: true,
        data: { syncResults },
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync operation failed',
        metadata: {
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          processingTime: 0
        }
      };
    }
  }

  /**
   * Health check for integration services
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if event processing is working
      const testEvent: AustralianIntegrationEvent = {
        type: 'market_update',
        timestamp: new Date(),
        source: 'health-check',
        data: { test: true },
        processed: false
      };

      await this.emitEvent(testEvent);
      
      // Check endpoint connectivity (if any are configured)
      let endpointsHealthy = true;
      for (const [, endpoint] of this.endpoints.entries()) {
        if (endpoint.enabled && endpoint.method === 'GET') {
          try {
            const response = await fetch(endpoint.url, { 
              method: 'HEAD',
              headers: endpoint.headers 
            });
            if (!response.ok) {
              endpointsHealthy = false;
              break;
            }
          } catch {
            endpointsHealthy = false;
            break;
          }
        }
      }

      return endpointsHealthy;
    } catch {
      return false;
    }
  }

  /**
   * Get integration metrics
   */
  getMetrics(): {
    eventsProcessed: number;
    activeEndpoints: number;
    queueSize: number;
    lastProcessedEvent?: Date;
  } {
    return {
      eventsProcessed: this.getProcessedEventCount(),
      activeEndpoints: Array.from(this.endpoints.values()).filter(e => e.enabled).length,
      queueSize: this.eventQueue.length,
      lastProcessedEvent: this.getLastProcessedEventTime()
    };
  }

  /**
   * Private helper methods
   */
  private initializeDefaultEndpoints(): void {
    // Default Australian business integration endpoints
    this.registerEndpoint({
      name: 'australian-business-registry',
      url: 'https://abr.business.gov.au/json/',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      enabled: false // Disabled by default, enable when API key is available
    });

    this.registerEndpoint({
      name: 'australia-post-api',
      url: 'https://digitalapi.auspost.com.au/postcode/search.json',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      enabled: false // Disabled by default
    });

    // Internal integration endpoints
    this.registerEndpoint({
      name: 'unite-group-crm',
      url: process.env.UNITE_GROUP_CRM_ENDPOINT || 'http://localhost:3001/api/crm',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UNITE_GROUP_API_KEY || ''}`,
        'Accept': 'application/json'
      },
      enabled: !!process.env.UNITE_GROUP_CRM_ENDPOINT
    });

    this.registerEndpoint({
      name: 'unite-group-analytics',
      url: process.env.UNITE_GROUP_ANALYTICS_ENDPOINT || 'http://localhost:3001/api/analytics',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UNITE_GROUP_API_KEY || ''}`,
        'Accept': 'application/json'
      },
      enabled: !!process.env.UNITE_GROUP_ANALYTICS_ENDPOINT
    });
  }

  private async processEventQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (!event) continue;

        await this.processEvent(event);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processEvent(event: AustralianIntegrationEvent): Promise<void> {
    try {
      // Get handlers for this event type
      const handlers = this.eventHandlers.get(event.type) || [];
      
      // Execute all handlers
      await Promise.all(handlers.map(handler => handler(event)));
      
      // Mark as processed
      event.processed = true;
      
      // Emit to external integrations if needed
      await this.emitToExternalSystems(event);
    } catch (error) {
      console.error(`Error processing event ${event.type}:`, error);
    }
  }

  private async emitToExternalSystems(event: AustralianIntegrationEvent): Promise<void> {
    // Send to relevant external systems based on event type
    switch (event.type) {
      case 'market_update':
        if (this.endpoints.has('unite-group-analytics')) {
          await this.sendToEndpoint('unite-group-analytics', {
            type: 'australian-market-update',
            event
          });
        }
        break;
      
      case 'user_profile_change':
        if (this.endpoints.has('unite-group-crm')) {
          await this.sendToEndpoint('unite-group-crm', {
            type: 'australian-user-profile',
            event
          });
        }
        break;
      
      case 'communication_sent':
        // Log communication events for compliance
        break;
    }
  }

  private startEventProcessor(): void {
    // Process events every 100ms
    setInterval(async () => {
      if (!this.processing && this.eventQueue.length > 0) {
        await this.processEventQueue();
      }
    }, 100);
  }

  private getProcessedEventCount(): number {
    // In a real implementation, this would be persisted
    return 0;
  }

  private getLastProcessedEventTime(): Date | undefined {
    // In a real implementation, this would be persisted
    return undefined;
  }

  private generateRequestId(): string {
    return `integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AustralianIntegrationManager;
