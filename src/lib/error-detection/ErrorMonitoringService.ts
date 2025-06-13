import { DetectedIssue } from '../autonomous/monitoring/types.js';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'runtime' | 'build' | 'development';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  component?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorReports: ErrorReport[] = [];
  private readonly MAX_REPORTS = 1000;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'runtime',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        component: event.filename,
        metadata: {
          lineNumber: event.lineno,
          columnNumber: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'runtime',
        severity: 'high',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        metadata: {
          reason: event.reason,
        },
      });
    });
  }

  public reportError(error: Omit<ErrorReport, 'id' | 'timestamp'>): void {
    const report: ErrorReport = {
      ...error,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.errorReports.push(report);
    
    // Maintain maximum report limit
    if (this.errorReports.length > this.MAX_REPORTS) {
      this.errorReports = this.errorReports.slice(-this.MAX_REPORTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', report);
    }

    // TODO: Implement error reporting to backend service
    this.sendToBackend(report);
  }

  private async sendToBackend(report: ErrorReport): Promise<void> {
    try {
      // TODO: Implement actual backend reporting
      // await fetch('/api/error-reporting', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (error) {
      console.error('Failed to send error report to backend:', error);
    }
  }

  public getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorReports.slice(-limit);
  }

  public getErrorsBySeverity(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errorReports.filter(report => report.severity === severity);
  }

  public getErrorsByType(type: ErrorReport['type']): ErrorReport[] {
    return this.errorReports.filter(report => report.type === type);
  }

  public clearErrors(): void {
    this.errorReports = [];
  }
} 