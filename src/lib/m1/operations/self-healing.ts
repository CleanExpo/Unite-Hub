/**
 * M1 Self-Healing Handler
 *
 * Automatic remediation of common issues with intelligent escalation.
 * Detects problems and attempts fixes with fallback options.
 *
 * Version: v2.3.0
 * Phase: 10 Extended - Production Operations Kit
 */

/**
 * Self-healing action type
 */
export type HealingActionType =
  | 'restart_cache'
  | 'clear_cache'
  | 'reload_policy'
  | 'reset_connection'
  | 'restart_service'
  | 'escalate';

/**
 * Self-healing action result
 */
export interface HealingAction {
  type: HealingActionType;
  component: string;
  timestamp: number;
  success: boolean;
  details?: string;
  escalated?: boolean;
}

/**
 * Healing history entry
 */
export interface HealingHistoryEntry {
  timestamp: number;
  issue: string;
  actions: HealingAction[];
  resolved: boolean;
  escalatedAt?: number;
}

/**
 * Self-healing policy
 */
export interface HealingPolicy {
  component: string;
  maxRetries: number;
  escalateAfter: number; // consecutive failures
  cooldownMs: number; // wait before retrying
}

/**
 * Self-healing system
 */
export class SelfHealingHandler {
  private history: HealingHistoryEntry[] = [];
  private failureCounters: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, number> = new Map();
  private escalationCallbacks: Array<(issue: string) => Promise<void>> = [];

  private readonly policies: Map<string, HealingPolicy> = new Map([
    [
      'cache',
      {
        component: 'cache',
        maxRetries: 3,
        escalateAfter: 5,
        cooldownMs: 5000,
      },
    ],
    [
      'policy_engine',
      {
        component: 'policy_engine',
        maxRetries: 2,
        escalateAfter: 3,
        cooldownMs: 10000,
      },
    ],
    [
      'database',
      {
        component: 'database',
        maxRetries: 5,
        escalateAfter: 10,
        cooldownMs: 15000,
      },
    ],
    [
      'redis',
      {
        component: 'redis',
        maxRetries: 3,
        escalateAfter: 5,
        cooldownMs: 10000,
      },
    ],
  ]);

  /**
   * Register escalation callback
   */
  onEscalation(callback: (issue: string) => Promise<void>): void {
    this.escalationCallbacks.push(callback);
  }

  /**
   * Attempt to heal a component
   */
  async heal(component: string, issue: string): Promise<boolean> {
    const actions: HealingAction[] = [];
    let resolved = false;

    try {
      const policy = this.policies.get(component);
      if (!policy) {
        console.warn(`No healing policy for component: ${component}`);
        return false;
      }

      // Check cooldown
      const lastAttempt = this.lastAttemptTime.get(component) || 0;
      if (Date.now() - lastAttempt < policy.cooldownMs) {
        return false;
      }

      // Increment failure counter
      const failureCount = (this.failureCounters.get(component) || 0) + 1;
      this.failureCounters.set(component, failureCount);

      // Try healing actions
      for (let i = 0; i < policy.maxRetries; i++) {
        const action = await this.attemptHealing(component, issue);
        actions.push(action);

        if (action.success) {
          resolved = true;
          this.failureCounters.set(component, 0);
          break;
        }

        if (i < policy.maxRetries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, policy.cooldownMs));
        }
      }

      // Check if escalation needed
      if (failureCount >= policy.escalateAfter) {
        await this.escalate(component, issue, actions);
      }
    } finally {
      this.lastAttemptTime.set(component, Date.now());
      this.recordHealing(issue, actions, resolved);
    }

    return resolved;
  }

  /**
   * Attempt a specific healing action
   */
  private async attemptHealing(component: string, issue: string): Promise<HealingAction> {
    const timestamp = Date.now();

    try {
      let actionType: HealingActionType;

      if (component === 'cache') {
        // Try progressive cache healing
        if (issue.includes('performance')) {
          actionType = 'clear_cache';
        } else if (issue.includes('connection')) {
          actionType = 'restart_cache';
        } else {
          actionType = 'reset_connection';
        }
      } else if (component === 'policy_engine') {
        // Reload policy configuration
        actionType = 'reload_policy';
        // In production: would reload policy from database
      } else if (component === 'database') {
        // Reset database connection
        actionType = 'reset_connection';
        // In production: would reset actual connection pool
      } else if (component === 'redis') {
        // Reset Redis connection
        actionType = 'reset_connection';
        // In production: would reset actual Redis connection
      } else {
        actionType = 'restart_service';
      }

      // Execute healing action
      const success = await this.executeAction(actionType, component);

      return {
        type: actionType,
        component,
        timestamp,
        success,
        details: success ? 'Action completed successfully' : 'Action failed',
      };
    } catch (error) {
      return {
        type: 'restart_service',
        component,
        timestamp,
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a healing action
   */
  private async executeAction(actionType: HealingActionType, component: string): Promise<boolean> {
    try {
      switch (actionType) {
        case 'restart_cache':
          console.log(`[Healing] Restarting cache layer for ${component}`);
          // In production: would call actual cache restart
          return true;

        case 'clear_cache':
          console.log(`[Healing] Clearing cache for ${component}`);
          // In production: would call actual cache clear
          return true;

        case 'reload_policy':
          console.log(`[Healing] Reloading policy for ${component}`);
          // In production: would reload policy from database
          return true;

        case 'reset_connection':
          console.log(`[Healing] Resetting connection for ${component}`);
          // In production: would reset actual connection
          return true;

        case 'restart_service':
          console.log(`[Healing] Restarting service for ${component}`);
          // In production: would trigger service restart
          return true;

        case 'escalate':
          console.log(`[Healing] Escalating issue for ${component}`);
          return false; // Escalation handled separately

        default:
          return false;
      }
    } catch (error) {
      console.error(`[Healing] Action ${actionType} failed:`, error);
      return false;
    }
  }

  /**
   * Escalate unresolved issue
   */
  private async escalate(component: string, issue: string, actions: HealingAction[]): Promise<void> {
    console.warn(`[Healing] Escalating ${component}: ${issue}`);

    const escalatedAction: HealingAction = {
      type: 'escalate',
      component,
      timestamp: Date.now(),
      success: false,
      escalated: true,
      details: `Auto-healing failed after ${actions.length} attempts. Manual intervention required.`,
    };

    actions.push(escalatedAction);

    // Call escalation callbacks
    for (const callback of this.escalationCallbacks) {
      try {
        await callback(`Component ${component}: ${issue}`);
      } catch (error) {
        console.error('Escalation callback failed:', error);
      }
    }
  }

  /**
   * Record healing attempt
   */
  private recordHealing(issue: string, actions: HealingAction[], resolved: boolean): void {
    const entry: HealingHistoryEntry = {
      timestamp: Date.now(),
      issue,
      actions,
      resolved,
      escalatedAt: actions.find(a => a.escalated) ? Date.now() : undefined,
    };

    this.history.push(entry);

    // Keep last 100 entries
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Get healing history
   */
  getHistory(limit: number = 20): HealingHistoryEntry[] {
    return this.history.slice(-limit);
  }

  /**
   * Get failure counter for component
   */
  getFailureCount(component: string): number {
    return this.failureCounters.get(component) || 0;
  }

  /**
   * Reset failure counter
   */
  resetFailureCount(component: string): void {
    this.failureCounters.delete(component);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalHealingAttempts: number;
    successfulHeals: number;
    failedHeals: number;
    escalatedIssues: number;
    avgActionsPerIssue: number;
  } {
    const totalAttempts = this.history.length;
    const successful = this.history.filter(h => h.resolved).length;
    const failed = this.history.filter(h => !h.resolved).length;
    const escalated = this.history.filter(h => h.escalatedAt).length;
    const avgActions = totalAttempts > 0
      ? this.history.reduce((sum, h) => sum + h.actions.length, 0) / totalAttempts
      : 0;

    return {
      totalHealingAttempts: totalAttempts,
      successfulHeals: successful,
      failedHeals: failed,
      escalatedIssues: escalated,
      avgActionsPerIssue: Math.round(avgActions * 100) / 100,
    };
  }
}

// Export singleton
export const selfHealingHandler = new SelfHealingHandler();
