/**
 * Session Logger
 *
 * Comprehensive logging and audit trail for auto-action sessions.
 * Tracks all actions, approvals, and outcomes for debugging and compliance.
 */

import { autoActionConfig } from '@config/autoAction.config';
import { FaraAction } from './faraClient';
import { CriticalPoint } from './criticalPointGuard';
import { SandboxViolation } from './sandboxConfig';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEventType =
  | 'session_start'
  | 'session_end'
  | 'action_planned'
  | 'action_executed'
  | 'action_failed'
  | 'critical_point_detected'
  | 'approval_requested'
  | 'approval_received'
  | 'approval_timeout'
  | 'sandbox_violation'
  | 'screenshot_captured'
  | 'task_progress'
  | 'task_complete'
  | 'error';

export interface LogEntry {
  id: string;
  sessionId: string;
  timestamp: Date;
  level: LogLevel;
  eventType: LogEventType;
  message: string;
  data?: Record<string, unknown>;
  screenshotBase64?: string;
  action?: FaraAction;
  criticalPoint?: CriticalPoint;
  violation?: SandboxViolation;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface SessionLog {
  sessionId: string;
  userId: string;
  workspaceId: string;
  flowType: 'client_onboarding' | 'staff_onboarding' | 'crm_autofill' | 'custom';
  task: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  stepCount: number;
  criticalPointCount: number;
  approvedCount: number;
  rejectedCount: number;
  entries: LogEntry[];
  outcome?: {
    success: boolean;
    summary: string;
    fieldsCompleted?: number;
    errors?: string[];
  };
}

export interface LogExport {
  exportedAt: Date;
  sessions: SessionLog[];
  format: 'json' | 'csv';
  filtered: boolean;
  filters?: {
    userId?: string;
    workspaceId?: string;
    flowType?: string;
    startDate?: Date;
    endDate?: Date;
  };
}

// ============================================================================
// SESSION LOGGER CLASS
// ============================================================================

export class SessionLogger {
  private sessions: Map<string, SessionLog> = new Map();
  private logLevel: LogLevel;
  private includeScreenshots: boolean;
  private retentionDays: number;

  constructor() {
    this.logLevel = autoActionConfig.logging.level;
    this.includeScreenshots = autoActionConfig.logging.includeScreenshots;
    this.retentionDays = autoActionConfig.logging.retentionDays;
  }

  /**
   * Start logging a new session
   */
  startSession(
    sessionId: string,
    userId: string,
    workspaceId: string,
    flowType: SessionLog['flowType'],
    task: string
  ): SessionLog {
    const session: SessionLog = {
      sessionId,
      userId,
      workspaceId,
      flowType,
      task,
      startedAt: new Date(),
      status: 'active',
      stepCount: 0,
      criticalPointCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      entries: [],
    };

    this.sessions.set(sessionId, session);

    this.log(sessionId, 'info', 'session_start', `Session started: ${task}`, {
      flowType,
      userId,
      workspaceId,
    });

    return session;
  }

  /**
   * End a session
   */
  endSession(
    sessionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    outcome?: SessionLog['outcome']
  ): SessionLog | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.endedAt = new Date();
    session.status = status;
    session.outcome = outcome;

    this.log(sessionId, 'info', 'session_end', `Session ${status}: ${outcome?.summary || ''}`, {
      duration: session.endedAt.getTime() - session.startedAt.getTime(),
      stepCount: session.stepCount,
      criticalPoints: session.criticalPointCount,
      approvals: session.approvedCount,
      rejections: session.rejectedCount,
    });

    return session;
  }

  /**
   * Log an action being planned
   */
  logActionPlanned(sessionId: string, action: FaraAction, reasoning: string): void {
    this.log(sessionId, 'debug', 'action_planned', `Planning action: ${action.type}`, {
      action,
      reasoning,
    });
  }

  /**
   * Log an action execution
   */
  logActionExecuted(
    sessionId: string,
    action: FaraAction,
    success: boolean,
    screenshotBase64?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.stepCount++;
    }

    this.log(
      sessionId,
      success ? 'info' : 'warn',
      success ? 'action_executed' : 'action_failed',
      `Action ${success ? 'completed' : 'failed'}: ${action.type}`,
      { action, success },
      this.includeScreenshots ? screenshotBase64 : undefined
    );
  }

  /**
   * Log a critical point detection
   */
  logCriticalPointDetected(sessionId: string, criticalPoint: CriticalPoint): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.criticalPointCount++;
    }

    this.log(
      sessionId,
      'warn',
      'critical_point_detected',
      `Critical point detected: ${criticalPoint.category}`,
      { criticalPoint }
    );
  }

  /**
   * Log approval request
   */
  logApprovalRequested(sessionId: string, criticalPoint: CriticalPoint): void {
    this.log(
      sessionId,
      'info',
      'approval_requested',
      `Approval requested for: ${criticalPoint.description}`,
      {
        criticalPointId: criticalPoint.id,
        category: criticalPoint.category,
        risk: criticalPoint.risk,
      }
    );
  }

  /**
   * Log approval response
   */
  logApprovalReceived(
    sessionId: string,
    criticalPoint: CriticalPoint,
    approved: boolean,
    respondedBy: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (approved) {
        session.approvedCount++;
      } else {
        session.rejectedCount++;
      }
    }

    this.log(
      sessionId,
      approved ? 'info' : 'warn',
      'approval_received',
      `Approval ${approved ? 'granted' : 'denied'} by ${respondedBy}`,
      {
        criticalPointId: criticalPoint.id,
        approved,
        respondedBy,
      }
    );
  }

  /**
   * Log approval timeout
   */
  logApprovalTimeout(sessionId: string, criticalPoint: CriticalPoint): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.rejectedCount++;
    }

    this.log(sessionId, 'warn', 'approval_timeout', `Approval timed out: ${criticalPoint.id}`, {
      criticalPointId: criticalPoint.id,
      timeoutMs: autoActionConfig.criticalPoints.approvalTimeoutMs,
    });
  }

  /**
   * Log sandbox violation
   */
  logSandboxViolation(sessionId: string, violation: SandboxViolation): void {
    this.log(sessionId, 'error', 'sandbox_violation', violation.message, {
      violation,
    });
  }

  /**
   * Log task progress
   */
  logTaskProgress(sessionId: string, progress: number, message: string): void {
    this.log(sessionId, 'info', 'task_progress', message, { progress });
  }

  /**
   * Log task completion
   */
  logTaskComplete(sessionId: string, success: boolean, summary: string): void {
    this.log(
      sessionId,
      success ? 'info' : 'warn',
      'task_complete',
      summary,
      { success }
    );
  }

  /**
   * Log error
   */
  logError(sessionId: string, error: Error, context?: Record<string, unknown>): void {
    this.log(sessionId, 'error', 'error', error.message, {
      ...context,
      errorName: error.name,
      errorStack: error.stack,
    });
  }

  /**
   * Get session log
   */
  getSession(sessionId: string): SessionLog | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): SessionLog[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  /**
   * Get all sessions for a workspace
   */
  getWorkspaceSessions(workspaceId: string): SessionLog[] {
    return Array.from(this.sessions.values()).filter((s) => s.workspaceId === workspaceId);
  }

  /**
   * Export logs
   */
  exportLogs(filters?: LogExport['filters']): LogExport {
    let sessions = Array.from(this.sessions.values());

    if (filters) {
      if (filters.userId) {
        sessions = sessions.filter((s) => s.userId === filters.userId);
      }
      if (filters.workspaceId) {
        sessions = sessions.filter((s) => s.workspaceId === filters.workspaceId);
      }
      if (filters.flowType) {
        sessions = sessions.filter((s) => s.flowType === filters.flowType);
      }
      if (filters.startDate) {
        sessions = sessions.filter((s) => s.startedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        sessions = sessions.filter((s) => s.startedAt <= filters.endDate!);
      }
    }

    return {
      exportedAt: new Date(),
      sessions,
      format: 'json',
      filtered: !!filters,
      filters,
    };
  }

  /**
   * Clean up old logs based on retention policy
   */
  cleanup(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    let removed = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.startedAt < cutoffDate && session.status !== 'active') {
        this.sessions.delete(sessionId);
        removed++;
      }
    }

    return removed;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private log(
    sessionId: string,
    level: LogLevel,
    eventType: LogEventType,
    message: string,
    data?: Record<string, unknown>,
    screenshotBase64?: string
  ): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const entry: LogEntry = {
      id: this.generateId(),
      sessionId,
      timestamp: new Date(),
      level,
      eventType,
      message,
      data,
      screenshotBase64,
    };

    // Extract structured data if present
    if (data?.action) {
      entry.action = data.action as FaraAction;
    }
    if (data?.criticalPoint) {
      entry.criticalPoint = data.criticalPoint as CriticalPoint;
    }
    if (data?.violation) {
      entry.violation = data.violation as SandboxViolation;
    }
    if (data?.errorName && data?.errorStack) {
      entry.error = {
        name: data.errorName as string,
        message,
        stack: data.errorStack as string,
      };
    }

    session.entries.push(entry);

    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleMethod(`[AutoAction] ${level.toUpperCase()} [${sessionId}] ${message}`);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configIndex = levels.indexOf(this.logLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= configIndex;
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let loggerInstance: SessionLogger | null = null;

export function getSessionLogger(): SessionLogger {
  if (!loggerInstance) {
    loggerInstance = new SessionLogger();
  }
  return loggerInstance;
}

export default SessionLogger;
