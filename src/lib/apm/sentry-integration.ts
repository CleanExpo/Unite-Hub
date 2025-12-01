/**
 * Sentry SDK Integration for Error Tracking and Performance Monitoring
 *
 * This module provides comprehensive Sentry integration for:
 * - Exception capture with full context
 * - Performance monitoring and transaction tracking
 * - Release tracking and version correlation
 * - User feedback collection
 * - Breadcrumb tracking for debugging
 * - Custom error contexts
 *
 * @module lib/apm/sentry-integration
 */

/* eslint-disable no-undef, no-console, @typescript-eslint/no-unused-vars */


import * as Sentry from '@sentry/nextjs';
import type {
  User,
  Breadcrumb,
  SeverityLevel,
  Transaction,
  Span,
} from '@sentry/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  debug: boolean;
  enabled: boolean;
}

export interface SentryUser {
  id: string;
  email?: string;
  username?: string;
  workspaceId?: string;
  organizationId?: string;
  ip_address?: string;
}

export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
  fingerprint?: string[];
}

export interface PerformanceContext {
  name: string;
  op: string;
  tags?: Record<string, string>;
  data?: Record<string, unknown>;
}

// ============================================================================
// SENTRY INTEGRATION CLASS
// ============================================================================

class SentryIntegration {
  private static instance: SentryIntegration;
  private config: SentryConfig | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): SentryIntegration {
    if (!SentryIntegration.instance) {
      SentryIntegration.instance = new SentryIntegration();
    }
    return SentryIntegration.instance;
  }

  /**
   * Initialize Sentry SDK
   * Should be called once on application startup
   */
  public initialize(config: SentryConfig): void {
    if (this.initialized) {
      console.warn('[Sentry] Already initialized');
      return;
    }

    if (!config.enabled || !config.dsn) {
      console.warn('[Sentry] Disabled or missing DSN - skipping initialization');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.tracesSampleRate,
        debug: config.debug,

        // Enable session replay
        replaysSessionSampleRate: config.replaysSessionSampleRate,
        replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

        // Integration configuration
        integrations: [
          // Automatically instrument fetch and XHR requests
          new Sentry.BrowserTracing({
            // Trace navigation
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.unite-hub\.com/],
          }),
          // Session replay for debugging
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],

        // Before send hook - filter sensitive data
        beforeSend: (event, _hint) => { // eslint-disable-line
          // Filter out sensitive information
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          // Filter sensitive cookies
          if (event.request?.cookies) {
            const filteredCookies: Record<string, string> = {};
            Object.entries(event.request.cookies).forEach(([key, value]) => {
              if (!key.toLowerCase().includes('session') && !key.toLowerCase().includes('token')) {
                filteredCookies[key] = value;
              }
            });
            event.request.cookies = filteredCookies;
          }

          return event;
        },

        // Before breadcrumb hook - filter PII
        beforeBreadcrumb: (breadcrumb, _hint) => { // eslint-disable-line
          // Filter sensitive data from breadcrumbs
          if (breadcrumb.data && breadcrumb.data.url) {
            // Remove query parameters that might contain sensitive data
            try {
              const url = new URL(breadcrumb.data.url);
              const sensitiveParams = ['token', 'api_key', 'password', 'secret'];
              sensitiveParams.forEach((param) => {
                if (url.searchParams.has(param)) {
                  url.searchParams.set(param, '[FILTERED]');
                }
              });
              breadcrumb.data.url = url.toString();
            } catch (error) { // eslint-disable-line
              // Invalid URL, skip filtering
            }
          }

          return breadcrumb;
        },

        // Ignore certain errors
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          'Can\'t find variable: ZiteReader',
          'jigsaw is not defined',
          'ComcastViasatDataTierWatcher',
          // Network errors
          'NetworkError',
          'Network request failed',
          // Cancelled requests
          'AbortError',
          'The operation was aborted',
        ],
      });

      this.config = config;
      this.initialized = true;

      console.log('[Sentry] Initialized successfully', {
        environment: config.environment,
        release: config.release,
      });

      // Track initialization
      this.captureMessage('Sentry initialized', 'info');
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if Sentry is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): SentryConfig | null {
    return this.config;
  }

  /**
   * Set user context for error correlation
   */
  public setUser(user: SentryUser): void {
    if (!this.initialized) {
      console.warn('[Sentry] Not initialized - user context not set');
      return;
    }

    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        workspaceId: user.workspaceId,
        organizationId: user.organizationId,
        ip_address: user.ip_address,
      } as User);

      console.log('[Sentry] User context set:', user.id);
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to set user context:', error);
    }
  }

  /**
   * Clear user context (on logout)
   */
  public clearUser(): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setUser(null);
      console.log('[Sentry] User context cleared');
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to clear user context:', error);
    }
  }

  /**
   * Capture exception with context
   */
  public captureException(error: Error, context?: ErrorContext): string {
    if (!this.initialized) {
      console.warn('[Sentry] Not initialized - exception not captured');
      console.error(error);
      return '';
    }

    try {
      const eventId = Sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'error',
        fingerprint: context?.fingerprint,
      });

      console.debug('[Sentry] Exception captured:', eventId);
      return eventId;
    } catch (err) {
      console.error('[Sentry] Failed to capture exception:', err);
      return '';
    }
  }

  /**
   * Capture message with severity level
   */
  public captureMessage(message: string, level: SeverityLevel = 'info'): string {
    if (!this.initialized) {
      console.warn('[Sentry] Not initialized - message not captured');
      return '';
    }

    try {
      const eventId = Sentry.captureMessage(message, level);
      console.debug('[Sentry] Message captured:', message);
      return eventId;
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to capture message:', error);
      return '';
    }
  }

  /**
   * Add breadcrumb for debugging trail
   */
  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.addBreadcrumb(breadcrumb);
      console.debug('[Sentry] Breadcrumb added:', breadcrumb.message);
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to add breadcrumb:', error);
    }
  }

  /**
   * Set tag for filtering and grouping
   */
  public setTag(key: string, value: string): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to set tag:', error);
    }
  }

  /**
   * Set multiple tags at once
   */
  public setTags(tags: Record<string, string>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setTags(tags);
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to set tags:', error);
    }
  }

  /**
   * Set context for additional debugging info
   */
  public setContext(name: string, context: Record<string, unknown>): void {
    if (!this.initialized) {
      return;
    }

    try {
      Sentry.setContext(name, context);
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to set context:', error);
    }
  }

  /**
   * Start performance transaction
   */
  public startTransaction(context: PerformanceContext): Transaction {
    if (!this.initialized) {
      throw new Error('[Sentry] Not initialized - cannot start transaction');
    }

    try {
      const transaction = Sentry.startTransaction({
        name: context.name,
        op: context.op,
        tags: context.tags,
        data: context.data,
      });

      console.debug('[Sentry] Transaction started:', context.name);
      return transaction;
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to start transaction:', error);
      throw error;
    }
  }

  /**
   * Start child span for nested operations
   */
  public startSpan(
    transaction: Transaction,
    op: string,
    description?: string
  ): Span | undefined {
    if (!this.initialized) {
      return undefined;
    }

    try {
      const span = transaction.startChild({
        op,
        description,
      });

      console.debug('[Sentry] Span started:', description || op);
      return span;
    } catch (error) { // eslint-disable-line
      console.error('[Sentry] Failed to start span:', error);
      return undefined;
    }
  }

  /**
   * Wrap async function with performance tracking
   */
  public async withPerformanceTracking<T>(
    name: string,
    op: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.initialized) {
      return fn();
    }

    const transaction = this.startTransaction({ name, op });

    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) { // eslint-disable-line
      transaction.setStatus('internal_error');
      this.captureException(error as Error, {
        tags: { transaction_name: name },
      });
      throw error;
    } finally {
      transaction.finish();
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const sentryIntegration = SentryIntegration.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Initialize Sentry with environment-based configuration
 */
export function initializeSentry(): void {
  const config: SentryConfig = {
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION || undefined,
    tracesSampleRate: getTracesSampleRate(),
    replaysSessionSampleRate: getReplaySessionSampleRate(),
    replaysOnErrorSampleRate: getReplayErrorSampleRate(),
    debug: process.env.NODE_ENV === 'development',
    enabled: process.env.SENTRY_ENABLED !== 'false',
  };

  sentryIntegration.initialize(config);
}

/**
 * Get traces sample rate based on environment
 */
function getTracesSampleRate(): number {
  const env = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return 0.1; // 10% sampling in production
    case 'staging':
      return 1.0; // 100% sampling in staging
    case 'development':
      return 0.0; // No sampling in development
    default:
      return 0.1;
  }
}

/**
 * Get replay session sample rate based on environment
 */
function getReplaySessionSampleRate(): number {
  const env = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return 0.05; // 5% replay sampling in production
    case 'staging':
      return 1.0; // 100% replay sampling in staging
    case 'development':
      return 0.0; // No replay sampling in development
    default:
      return 0.05;
  }
}

/**
 * Get replay on error sample rate based on environment
 */
function getReplayErrorSampleRate(): number {
  const env = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

  switch (env) {
    case 'production':
      return 1.0; // 100% replay on errors in production
    case 'staging':
      return 1.0; // 100% replay on errors in staging
    case 'development':
      return 0.0; // No replay in development
    default:
      return 1.0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default sentryIntegration;
