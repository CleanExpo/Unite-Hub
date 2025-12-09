/**
 * Error Boundary Instrumentation for Distributed Tracing
 *
 * React error boundaries with automatic trace instrumentation:
 * - Capture React component errors with full stack traces
 * - Automatic span creation for error context
 * - Error categorization and severity assessment
 * - Performance impact tracking
 * - Recovery strategy support (retry, fallback, reset)
 *
 * Integrates with:
 * - Trace context propagation (workspace/user context)
 * - Span instrumentation for error operations
 * - Error metrics collection
 * - Graceful error handling and recovery
 *
 * @module lib/tracing/error-boundary
 */

 
/* global process, console */

import React, { ReactNode, ReactElement } from 'react';
import {
  getTraceContext,
  addBaggage,
} from './trace-context';
import {
  createSpan,
  finalizeSpan,
  recordSpanEvent,
  Span,
} from './instrumentation-utilities';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Recovery strategy for error boundaries
 */
export type RecoveryStrategy = 'retry' | 'fallback' | 'reset' | 'none';

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /**
   * Component display name for logging
   */
  name?: string;

  /**
   * Recovery strategy when error occurs
   */
  recoveryStrategy?: RecoveryStrategy;

  /**
   * Maximum retry attempts
   */
  maxRetries?: number;

  /**
   * Custom fallback component
   */
  fallbackComponent?: ReactElement;

  /**
   * Callback when error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo, span: Span) => void;

  /**
   * Callback before recovery
   */
  onRecovery?: (strategy: RecoveryStrategy) => void;

  /**
   * Enable automatic error reporting
   */
  reportErrors?: boolean;

  /**
   * Workspace ID for context isolation
   */
  workspaceId?: string;
}

/**
 * Captured error with context
 */
export interface CapturedError {
  message: string;
  stack?: string;
  componentStack?: string;
  severity: ErrorSeverity;
  timestamp: number;
  span: Span;
  context?: Record<string, string | number | boolean>;
}

/**
 * Error boundary state management
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  capturedErrors: CapturedError[];
}

/**
 * Determine error severity from error properties
 */
function determineErrorSeverity(error: Error, errorInfo: React.ErrorInfo): ErrorSeverity {
  // Check for critical patterns in stack trace
  if (errorInfo.componentStack?.includes('render') || error.message.includes('render')) {
    return 'critical';
  }

  // Check for known high-severity patterns
  if (
    error instanceof TypeError ||
    error.message.includes('Cannot read') ||
    error.message.includes('undefined')
  ) {
    return 'high';
  }

  // Check for medium-severity patterns
  if (error instanceof ReferenceError || error.message.includes('is not defined')) {
    return 'medium';
  }

  // Default to low severity
  return 'low';
}

/**
 * Format component stack for readability
 */
function formatComponentStack(componentStack: string): string {
  return componentStack
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 5) // Limit to first 5 frames
    .join('\n');
}

/**
 * React Error Boundary Component with Tracing
 *
 * QUALITY GATE 1: Must capture all error information
 * QUALITY GATE 2: Must propagate trace context to error spans
 * QUALITY GATE 3: Must implement recovery strategies
 * QUALITY GATE 4: Must never throw in error boundary
 * QUALITY GATE 5: Must track error metrics
 * QUALITY GATE 6: Must preserve original error for logging
 * QUALITY GATE 7: Must handle componentDidCatch properly
 * QUALITY GATE 8: Must support custom fallback UI
 */
export class ErrorBoundary extends React.Component<
  { children: ReactNode; config?: ErrorBoundaryConfig },
  ErrorBoundaryState
> {
  private config: Required<ErrorBoundaryConfig>;

  constructor(props: { children: ReactNode; config?: ErrorBoundaryConfig }) {
    super(props);

    // Initialize configuration with defaults
    this.config = {
      name: props.config?.name || 'ErrorBoundary',
      recoveryStrategy: props.config?.recoveryStrategy || 'fallback',
      maxRetries: props.config?.maxRetries || 3,
      fallbackComponent:
        props.config?.fallbackComponent ||
        (
          <div
            style={{
              padding: '20px',
              backgroundColor: '#fee',
              border: '1px solid #f99',
              borderRadius: '4px',
            }}
          >
            <h2>Something went wrong</h2>
            <p>Please try refreshing the page.</p>
          </div>
        ),
      onError: props.config?.onError || (() => {}),
      onRecovery: props.config?.onRecovery || (() => {}),
      reportErrors: props.config?.reportErrors !== false,
      workspaceId: props.config?.workspaceId || 'default',
    };

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      capturedErrors: [],
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Handle error with tracing and recovery
   *
   * QUALITY GATE 4: This must never throw
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    try {
      // Create span for error event
      const span = createSpan({
        operationName: 'error.boundary',
        attributes: {
          'error.boundary.name': this.config.name,
          'component.stack.length': errorInfo.componentStack?.length || 0,
          'error.severity': determineErrorSeverity(error, errorInfo),
        },
      });

      // Get trace context for baggage
      const context = getTraceContext();
      if (context?.workspaceId) {
        addBaggage('error.workspace_id', context.workspaceId);
      }
      if (context?.userId) {
        addBaggage('error.user_id', context.userId);
      }

      // Record error event
      recordSpanEvent(span, 'error_caught', {
        error_type: error.name,
        error_message: error.message,
        has_stack: !!error.stack,
        recovery_strategy: this.config.recoveryStrategy,
      });

      // Determine error severity
      const severity = determineErrorSeverity(error, errorInfo);

      // Create captured error object
      const capturedError: CapturedError = {
        message: error.message,
        stack: error.stack,
        componentStack: formatComponentStack(errorInfo.componentStack || ''),
        severity,
        timestamp: Date.now(),
        span: finalizeSpan(span, 'error', error),
        context: {
          boundary_name: this.config.name,
          workspace_id: this.config.workspaceId,
        },
      };

      // Update state
      this.setState((prevState) => ({
        errorInfo,
        retryCount: 0,
        capturedErrors: [...prevState.capturedErrors, capturedError],
      }));

      // Record to global metrics
      getErrorMetrics().recordError(capturedError);

      // Call user's error handler
      this.config.onError(error, errorInfo, span);

      // Log error for debugging
      console.error(
        `[ErrorBoundary ${this.config.name}] Error caught:`,
        error,
        `\nComponent Stack:\n${formatComponentStack(errorInfo.componentStack || '')}`
      );
    } catch {
      // QUALITY GATE 4: Ensure error handler itself doesn't throw
      // Silently log and don't re-throw to prevent cascading failures
    }
  }

  /**
   * Attempt recovery based on configured strategy
   */
  private attemptRecovery = (): void => {
    const { retryCount } = this.state;

    if (this.config.recoveryStrategy === 'retry' && retryCount < this.config.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      this.config.onRecovery('retry');
      return;
    }

    if (this.config.recoveryStrategy === 'reset') {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
      });

      this.config.onRecovery('reset');
      return;
    }

    // Fallback strategy: show fallback UI (state remains hasError: true)
    this.config.onRecovery('fallback');
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, retryCount } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    // Show fallback UI
    return (
      <div role="alert" data-testid="error-boundary-fallback">
        {this.config.fallbackComponent}

        {/* Retry button if strategy supports it */}
        {this.config.recoveryStrategy === 'retry' && retryCount < this.config.maxRetries && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={this.attemptRecovery}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry ({retryCount + 1}/{this.config.maxRetries})
            </button>
          </div>
        )}

        {/* Reset button if strategy supports it */}
        {this.config.recoveryStrategy === 'reset' && (
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={this.attemptRecovery}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        )}

        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details style={{ marginTop: '12px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            <summary>Error Details</summary>
            <div style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              <strong>Message:</strong> {error.message}
              <br />
              <strong>Stack:</strong>
              {error.stack}
              <br />
              <strong>Component Stack:</strong>
              {errorInfo?.componentStack}
            </div>
          </details>
        )}
      </div>
    );
  }
}

/**
 * Error tracking metrics
 */
export interface ErrorMetrics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByType: Record<string, number>;
  averageRecoveryTime: number;
  activeErrors: number;
}

/**
 * Error metrics collector (global state)
 */
class ErrorMetricsCollector {
  private errorCounts: Map<ErrorSeverity, number> = new Map();
  private errorTypeCount: Map<string, number> = new Map();
  private capturedErrors: CapturedError[] = [];
  private maxCaptures: number = 1000;

  constructor() {
    const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];
    for (const severity of severities) {
      this.errorCounts.set(severity, 0);
    }
  }

  /**
   * Record captured error
   */
  recordError(error: CapturedError): void {
    // Update severity count
    const currentCount = this.errorCounts.get(error.severity) || 0;
    this.errorCounts.set(error.severity, currentCount + 1);

    // Update type count
    const errorType = error.span.attributes['error_type'] as string || 'Unknown';
    const typeCount = this.errorTypeCount.get(errorType) || 0;
    this.errorTypeCount.set(errorType, typeCount + 1);

    // Store error (bounded)
    this.capturedErrors.push(error);
    if (this.capturedErrors.length > this.maxCaptures) {
      this.capturedErrors = this.capturedErrors.slice(-this.maxCaptures);
    }
  }

  /**
   * Get error metrics snapshot
   */
  getMetrics(): ErrorMetrics {
    return {
      totalErrors: this.capturedErrors.length,
      errorsBySeverity: {
        low: this.errorCounts.get('low') || 0,
        medium: this.errorCounts.get('medium') || 0,
        high: this.errorCounts.get('high') || 0,
        critical: this.errorCounts.get('critical') || 0,
      },
      errorsByType: Object.fromEntries(this.errorTypeCount),
      averageRecoveryTime: this.capturedErrors.length > 0
        ? this.capturedErrors
            .filter((e) => e.span.duration !== undefined)
            .reduce((sum, e) => sum + (e.span.duration || 0), 0) / this.capturedErrors.length
        : 0,
      activeErrors: this.capturedErrors.filter(
        (e) => Date.now() - e.timestamp < 300000 // 5 minute window
      ).length,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): CapturedError[] {
    return this.capturedErrors.slice(-limit);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];
    for (const severity of severities) {
      this.errorCounts.set(severity, 0);
    }
    this.errorTypeCount.clear();
    this.capturedErrors = [];
  }
}

/**
 * Global error metrics collector instance
 */
let errorMetricsCollector: ErrorMetricsCollector | null = null;

/**
 * Initialize error metrics collector
 */
export function initializeErrorMetrics(): ErrorMetricsCollector {
  if (!errorMetricsCollector) {
    errorMetricsCollector = new ErrorMetricsCollector();
  }
  return errorMetricsCollector;
}

/**
 * Get error metrics collector
 */
export function getErrorMetrics(): ErrorMetricsCollector {
  if (!errorMetricsCollector) {
    errorMetricsCollector = new ErrorMetricsCollector();
  }
  return errorMetricsCollector;
}

/**
 * Get current error metrics snapshot
 */
export function getErrorMetricsSnapshot(): ErrorMetrics {
  return getErrorMetrics().getMetrics();
}

/**
 * Get recent errors
 */
export function getRecentErrors(limit?: number): CapturedError[] {
  return getErrorMetrics().getRecentErrors(limit);
}

/**
 * Reset error metrics
 */
export function resetErrorMetrics(): void {
  getErrorMetrics().reset();
}
