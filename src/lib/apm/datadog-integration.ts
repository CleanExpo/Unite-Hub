/**
 * Datadog RUM (Real User Monitoring) and APM Integration
 *
 * This module provides comprehensive Datadog integration for:
 * - Real User Monitoring (RUM) for browser performance
 * - Custom metrics and events tracking
 * - User session correlation
 * - Error tracking with full context
 * - Performance monitoring hooks
 *
 * @module lib/apm/datadog-integration
 */

 


import type { RumInitConfiguration, RumGlobal } from '@datadog/browser-rum';

// ============================================================================
// TYPES
// ============================================================================

export interface DatadogConfig {
  applicationId: string;
  clientToken: string;
  site: string;
  service: string;
  env: string;
  version: string;
  sessionSampleRate: number;
  sessionReplaySampleRate: number;
  trackUserInteractions: boolean;
  trackResources: boolean;
  trackLongTasks: boolean;
  defaultPrivacyLevel: 'mask' | 'mask-user-input' | 'allow';
}

export interface DatadogUser {
  id: string;
  name?: string;
  email?: string;
  workspaceId?: string;
  organizationId?: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface CustomEvent {
  name: string;
  attributes?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  pageLoadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  type: string;
  source: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// DATADOG RUM CLIENT
// ============================================================================

class DatadogIntegration {
  private static instance: DatadogIntegration;
  private config: DatadogConfig | null = null;
  private initialized = false;
  private rum: RumGlobal | null = null;

  private constructor() {}

  public static getInstance(): DatadogIntegration {
    if (!DatadogIntegration.instance) {
      DatadogIntegration.instance = new DatadogIntegration();
    }
    return DatadogIntegration.instance;
  }

  /**
   * Initialize Datadog RUM client
   * Should be called once on application startup (client-side only)
   */
  public async initialize(config: DatadogConfig): Promise<void> {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      console.warn('[Datadog] Skipping initialization - not in browser environment');
      return;
    }

    if (this.initialized) {
      console.warn('[Datadog] Already initialized');
      return;
    }

    try {
      // Dynamically import Datadog RUM browser SDK
      const { datadogRum } = await import('@datadog/browser-rum');

      this.config = config;
      this.rum = datadogRum;

      // Initialize RUM
      datadogRum.init({
        applicationId: config.applicationId,
        clientToken: config.clientToken,
        site: config.site,
        service: config.service,
        env: config.env,
        version: config.version,
        sessionSampleRate: config.sessionSampleRate,
        sessionReplaySampleRate: config.sessionReplaySampleRate,
        trackUserInteractions: config.trackUserInteractions,
        trackResources: config.trackResources,
        trackLongTasks: config.trackLongTasks,
        defaultPrivacyLevel: config.defaultPrivacyLevel,
        // Collect performance metrics
        trackViewsManually: false,
        // Enable advanced tracking
        trackSessionAcrossSubdomains: true,
        useSecureSessionCookie: true,
        useCrossSiteSessionCookie: true,
        // Error tracking
        forwardErrorsToLogs: true,
        forwardConsoleLogs: ['error', 'warn'],
        silentMultipleInit: true,
      } as RumInitConfiguration);

      // Start RUM session
      datadogRum.startSessionReplayRecording();

      this.initialized = true;

      console.log('[Datadog] Initialized successfully', {
        service: config.service,
        env: config.env,
        version: config.version,
      });

      // Track initialization event
      this.trackEvent({
        name: 'datadog_initialized',
        attributes: {
          env: config.env,
          version: config.version,
        },
      });
    } catch (error) {
      console.error('[Datadog] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if Datadog is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): DatadogConfig | null {
    return this.config;
  }

  /**
   * Set user context for session correlation
   * All subsequent events will be tagged with this user info
   */
  public setUser(user: DatadogUser): void {
    if (!this.initialized || !this.rum) {
      console.warn('[Datadog] Not initialized - user context not set');
      return;
    }

    try {
      this.rum.setUser({
        id: user.id,
        name: user.name,
        email: user.email,
        workspaceId: user.workspaceId,
        organizationId: user.organizationId,
      });

      console.log('[Datadog] User context set:', user.id);
    } catch (error) {
      console.error('[Datadog] Failed to set user context:', error);
    }
  }

  /**
   * Clear user context (on logout)
   */
  public clearUser(): void {
    if (!this.initialized || !this.rum) {
      return;
    }

    try {
      this.rum.clearUser();
      console.log('[Datadog] User context cleared');
    } catch (error) {
      console.error('[Datadog] Failed to clear user context:', error);
    }
  }

  /**
   * Track custom event
   */
  public trackEvent(event: CustomEvent): void {
    if (!event || !this.initialized || !this.rum) {
      if (event) {
        console.warn('[Datadog] Not initialized - event not tracked:', event.name);
      }
      return;
    }

    try {
      this.rum.addAction(event.name, event.attributes);
      console.debug('[Datadog] Event tracked:', event.name);
    } catch (error) {
      console.error('[Datadog] Failed to track event:', error);
    }
  }

  /**
   * Track custom metric
   */
  public trackMetric(metric: CustomMetric): void {
    if (!this.initialized || !this.rum) {
      console.warn('[Datadog] Not initialized - metric not tracked:', metric.name);
      return;
    }

    try {
      // Track as custom action with metric value
      this.rum.addAction(metric.name, {
        value: metric.value,
        ...metric.tags,
        timestamp: metric.timestamp || Date.now(),
      });
      console.debug('[Datadog] Metric tracked:', metric.name, metric.value);
    } catch (error) {
      console.error('[Datadog] Failed to track metric:', error);
    }
  }

  /**
   * Track error with full context
   */
  public trackError(error: ErrorEvent): void {
    if (!this.initialized || !this.rum) {
      console.warn('[Datadog] Not initialized - error not tracked');
      return;
    }

    try {
      this.rum.addError(new Error(error.message), {
        type: error.type,
        source: error.source,
        stack: error.stack,
        ...error.metadata,
      });
      console.debug('[Datadog] Error tracked:', error.message);
    } catch (err) {
      console.error('[Datadog] Failed to track error:', err);
    }
  }

  /**
   * Track page view manually (if trackViewsManually is enabled)
   */
  public trackPageView(routeName: string, routeParams?: Record<string, unknown>): void {
    if (!this.initialized || !this.rum) {
      console.warn('[Datadog] Not initialized - page view not tracked');
      return;
    }

    try {
      this.rum.startView({
        name: routeName,
        ...routeParams,
      });
      console.debug('[Datadog] Page view tracked:', routeName);
    } catch (error) {
      console.error('[Datadog] Failed to track page view:', error);
    }
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metrics: PerformanceMetrics): void {
    if (!this.initialized) {
      return;
    }

    // Track each metric as a custom action
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        this.trackMetric({
          name: `performance.${key}`,
          value: value as number,
          tags: {
            metric_type: 'performance',
          },
        });
      }
    });
  }

  /**
   * Add global context that applies to all events
   */
  public addGlobalContext(key: string, value: unknown): void {
    if (!this.initialized || !this.rum) {
      return;
    }

    try {
      this.rum.setGlobalContextProperty(key, value);
      console.debug('[Datadog] Global context added:', key);
    } catch (error) {
      console.error('[Datadog] Failed to add global context:', error);
    }
  }

  /**
   * Remove global context
   */
  public removeGlobalContext(key: string): void {
    if (!this.initialized || !this.rum) {
      return;
    }

    try {
      this.rum.removeGlobalContextProperty(key);
      console.debug('[Datadog] Global context removed:', key);
    } catch (error) {
      console.error('[Datadog] Failed to remove global context:', error);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const datadogIntegration = DatadogIntegration.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize Datadog RUM with environment-based configuration
 */
export async function initializeDatadog(): Promise<void> {
  const config: DatadogConfig = {
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || '',
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || '',
    site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com',
    service: process.env.NEXT_PUBLIC_DATADOG_SERVICE || 'unite-hub',
    env: process.env.NEXT_PUBLIC_DATADOG_ENV || process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    sessionSampleRate: getSessionSampleRate(),
    sessionReplaySampleRate: getSessionReplaySampleRate(),
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  };

  // Only initialize if required environment variables are present
  if (!config.applicationId || !config.clientToken) {
    console.warn('[Datadog] Missing required environment variables - skipping initialization');
    return;
  }

  await datadogIntegration.initialize(config);
}

/**
 * Get session sample rate based on environment
 */
function getSessionSampleRate(): number {
  const env = process.env.NEXT_PUBLIC_DATADOG_ENV || process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return 10; // 10% sampling in production
    case 'staging':
      return 100; // 100% sampling in staging
    case 'development':
      return 0; // No sampling in development
    default:
      return 10;
  }
}

/**
 * Get session replay sample rate based on environment
 */
function getSessionReplaySampleRate(): number {
  const env = process.env.NEXT_PUBLIC_DATADOG_ENV || process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return 5; // 5% replay sampling in production
    case 'staging':
      return 100; // 100% replay sampling in staging
    case 'development':
      return 0; // No replay sampling in development
    default:
      return 5;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default datadogIntegration;
