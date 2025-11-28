/**
 * Sandbox Configuration
 *
 * Runtime sandbox constraints for the auto-action engine.
 * Enforces safety boundaries, rate limits, and allowed operations.
 */

import { autoActionConfig } from '@config/autoAction.config';

// ============================================================================
// TYPES
// ============================================================================

export interface SandboxState {
  sessionId: string;
  startedAt: Date;
  stepCount: number;
  lastActionAt: Date | null;
  actionsInCurrentMinute: number;
  minuteWindowStart: Date;
  isActive: boolean;
  violations: SandboxViolation[];
}

export interface SandboxViolation {
  type: 'rate_limit' | 'blocked_action' | 'blocked_origin' | 'max_steps' | 'timeout';
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface SandboxValidationResult {
  allowed: boolean;
  violation?: SandboxViolation;
  remainingSteps: number;
  remainingActionsThisMinute: number;
  sessionTimeRemaining: number;
}

// ============================================================================
// SANDBOX MANAGER CLASS
// ============================================================================

export class SandboxManager {
  private sessions: Map<string, SandboxState> = new Map();
  private hourlySessionCounts: Map<string, { count: number; hourStart: Date }> = new Map();

  /**
   * Create a new sandbox session
   */
  createSession(sessionId: string, userId: string): SandboxState {
    // Check hourly session limit
    const userHourlyKey = `${userId}_hourly`;
    const hourlyData = this.hourlySessionCounts.get(userHourlyKey);
    const now = new Date();

    if (hourlyData) {
      const hourElapsed = now.getTime() - hourlyData.hourStart.getTime() > 3600000;
      if (hourElapsed) {
        this.hourlySessionCounts.set(userHourlyKey, { count: 1, hourStart: now });
      } else if (hourlyData.count >= autoActionConfig.sandbox.rateLimit.maxSessionsPerHour) {
        throw new Error('Hourly session limit exceeded');
      } else {
        hourlyData.count++;
      }
    } else {
      this.hourlySessionCounts.set(userHourlyKey, { count: 1, hourStart: now });
    }

    const state: SandboxState = {
      sessionId,
      startedAt: now,
      stepCount: 0,
      lastActionAt: null,
      actionsInCurrentMinute: 0,
      minuteWindowStart: now,
      isActive: true,
      violations: [],
    };

    this.sessions.set(sessionId, state);
    return state;
  }

  /**
   * Validate whether an action can proceed
   */
  validateAction(
    sessionId: string,
    actionType: string,
    targetUrl?: string
  ): SandboxValidationResult {
    const state = this.sessions.get(sessionId);

    if (!state || !state.isActive) {
      return {
        allowed: false,
        violation: {
          type: 'timeout',
          message: 'Session not active or not found',
          timestamp: new Date(),
        },
        remainingSteps: 0,
        remainingActionsThisMinute: 0,
        sessionTimeRemaining: 0,
      };
    }

    const now = new Date();
    const config = autoActionConfig.sandbox;

    // Check session timeout
    const sessionElapsed = now.getTime() - state.startedAt.getTime();
    if (sessionElapsed >= config.sessionTimeoutMs) {
      const violation: SandboxViolation = {
        type: 'timeout',
        message: 'Session timeout exceeded',
        timestamp: now,
        details: { elapsed: sessionElapsed, limit: config.sessionTimeoutMs },
      };
      state.violations.push(violation);
      state.isActive = false;
      return {
        allowed: false,
        violation,
        remainingSteps: 0,
        remainingActionsThisMinute: 0,
        sessionTimeRemaining: 0,
      };
    }

    // Check max steps
    if (state.stepCount >= config.maxSteps) {
      const violation: SandboxViolation = {
        type: 'max_steps',
        message: `Maximum steps (${config.maxSteps}) exceeded`,
        timestamp: now,
        details: { steps: state.stepCount, limit: config.maxSteps },
      };
      state.violations.push(violation);
      return {
        allowed: false,
        violation,
        remainingSteps: 0,
        remainingActionsThisMinute: this.getRemainingActionsThisMinute(state, now),
        sessionTimeRemaining: config.sessionTimeoutMs - sessionElapsed,
      };
    }

    // Check blocked actions
    if (config.blockedActions.includes(actionType)) {
      const violation: SandboxViolation = {
        type: 'blocked_action',
        message: `Action "${actionType}" is blocked`,
        timestamp: now,
        details: { action: actionType },
      };
      state.violations.push(violation);
      return {
        allowed: false,
        violation,
        remainingSteps: config.maxSteps - state.stepCount,
        remainingActionsThisMinute: this.getRemainingActionsThisMinute(state, now),
        sessionTimeRemaining: config.sessionTimeoutMs - sessionElapsed,
      };
    }

    // Check allowed origins
    if (targetUrl && !this.isOriginAllowed(targetUrl)) {
      const violation: SandboxViolation = {
        type: 'blocked_origin',
        message: `Origin not in allowed list`,
        timestamp: now,
        details: { url: targetUrl, allowedOrigins: config.allowedOrigins },
      };
      state.violations.push(violation);
      return {
        allowed: false,
        violation,
        remainingSteps: config.maxSteps - state.stepCount,
        remainingActionsThisMinute: this.getRemainingActionsThisMinute(state, now),
        sessionTimeRemaining: config.sessionTimeoutMs - sessionElapsed,
      };
    }

    // Check rate limit (actions per minute)
    this.updateMinuteWindow(state, now);
    if (state.actionsInCurrentMinute >= config.rateLimit.maxActionsPerMinute) {
      const violation: SandboxViolation = {
        type: 'rate_limit',
        message: `Rate limit (${config.rateLimit.maxActionsPerMinute}/min) exceeded`,
        timestamp: now,
        details: {
          actions: state.actionsInCurrentMinute,
          limit: config.rateLimit.maxActionsPerMinute,
        },
      };
      state.violations.push(violation);
      return {
        allowed: false,
        violation,
        remainingSteps: config.maxSteps - state.stepCount,
        remainingActionsThisMinute: 0,
        sessionTimeRemaining: config.sessionTimeoutMs - sessionElapsed,
      };
    }

    // All checks passed
    return {
      allowed: true,
      remainingSteps: config.maxSteps - state.stepCount - 1,
      remainingActionsThisMinute: config.rateLimit.maxActionsPerMinute - state.actionsInCurrentMinute - 1,
      sessionTimeRemaining: config.sessionTimeoutMs - sessionElapsed,
    };
  }

  /**
   * Record an action execution
   */
  recordAction(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    const now = new Date();
    this.updateMinuteWindow(state, now);

    state.stepCount++;
    state.lastActionAt = now;
    state.actionsInCurrentMinute++;
  }

  /**
   * End a session
   */
  endSession(sessionId: string): SandboxState | undefined {
    const state = this.sessions.get(sessionId);
    if (state) {
      state.isActive = false;
    }
    return state;
  }

  /**
   * Get session state
   */
  getSession(sessionId: string): SandboxState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): SandboxState[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  /**
   * Check if origin is allowed
   */
  isOriginAllowed(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return autoActionConfig.sandbox.allowedOrigins.some((allowed) =>
        hostname.includes(allowed.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  /**
   * Get configuration summary
   */
  getConfigSummary(): Record<string, unknown> {
    return {
      maxSteps: autoActionConfig.sandbox.maxSteps,
      stepTimeoutMs: autoActionConfig.sandbox.stepTimeoutMs,
      sessionTimeoutMs: autoActionConfig.sandbox.sessionTimeoutMs,
      maxActionsPerMinute: autoActionConfig.sandbox.rateLimit.maxActionsPerMinute,
      maxSessionsPerHour: autoActionConfig.sandbox.rateLimit.maxSessionsPerHour,
      allowedOrigins: autoActionConfig.sandbox.allowedOrigins,
      blockedActions: autoActionConfig.sandbox.blockedActions,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private updateMinuteWindow(state: SandboxState, now: Date): void {
    const minuteElapsed = now.getTime() - state.minuteWindowStart.getTime() > 60000;
    if (minuteElapsed) {
      state.minuteWindowStart = now;
      state.actionsInCurrentMinute = 0;
    }
  }

  private getRemainingActionsThisMinute(state: SandboxState, now: Date): number {
    const minuteElapsed = now.getTime() - state.minuteWindowStart.getTime() > 60000;
    if (minuteElapsed) {
      return autoActionConfig.sandbox.rateLimit.maxActionsPerMinute;
    }
    return Math.max(
      0,
      autoActionConfig.sandbox.rateLimit.maxActionsPerMinute - state.actionsInCurrentMinute
    );
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let sandboxInstance: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!sandboxInstance) {
    sandboxInstance = new SandboxManager();
  }
  return sandboxInstance;
}

export default SandboxManager;
