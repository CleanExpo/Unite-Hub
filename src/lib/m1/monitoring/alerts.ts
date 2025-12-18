/**
 * M1 Alert System
 *
 * Manages alerts for policy violations, errors, and anomalies.
 * Provides alert aggregation and notification capabilities.
 */

import { v4 as generateUUID } from "uuid";

/**
 * Alert severity levels
 */
export type AlertLevel = "info" | "warning" | "critical";

/**
 * Alert categories
 */
export type AlertCategory =
  | "policy_violation"
  | "execution_error"
  | "high_error_rate"
  | "approval_denied"
  | "token_expired"
  | "cost_threshold"
  | "performance"
  | "other";

/**
 * Alert record
 */
export interface Alert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  resolved?: boolean;
  resolvedAt?: number;
}

/**
 * Alert callback function
 */
export type AlertCallback = (alert: Alert) => void | Promise<void>;

/**
 * Alert manager
 */
export class AlertManager {
  private alerts: Alert[] = [];
  private callbacks: Map<string, AlertCallback[]> = new Map();
  private alertCounts: Map<AlertCategory, number> = new Map();

  /**
   * Register alert callback for specific category or all alerts
   */
  onAlert(callback: AlertCallback, category?: AlertCategory): void {
    const key = category || "all";
    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, []);
    }
    this.callbacks.get(key)!.push(callback);
  }

  /**
   * Create and trigger an alert
   */
  alert(
    level: AlertLevel,
    category: AlertCategory,
    message: string,
    metadata?: Record<string, unknown>
  ): Alert {
    const alert: Alert = {
      id: generateUUID(),
      level,
      category,
      message,
      timestamp: Date.now(),
      metadata,
      resolved: false,
    };

    this.alerts.push(alert);

    // Update counts
    const count = this.alertCounts.get(category) || 0;
    this.alertCounts.set(category, count + 1);

    // Notify category-specific callbacks
    const categoryCallbacks = this.callbacks.get(category) || [];
    for (const callback of categoryCallbacks) {
      try {
        Promise.resolve(callback(alert)).catch((error) => {
          console.error("Alert callback error:", error);
        });
      } catch (error) {
        console.error("Alert callback error:", error);
      }
    }

    // Notify global callbacks
    const globalCallbacks = this.callbacks.get("all") || [];
    for (const callback of globalCallbacks) {
      try {
        Promise.resolve(callback(alert)).catch((error) => {
          console.error("Alert callback error:", error);
        });
      } catch (error) {
        console.error("Alert callback error:", error);
      }
    }

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
    }
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(category?: AlertCategory): Alert[] {
    return this.alerts.filter((a) => {
      if (a.resolved) {
return false;
}
      if (category && a.category !== category) {
return false;
}
      return true;
    });
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50, category?: AlertCategory): Alert[] {
    const filtered = this.alerts.filter((a) => {
      if (category && a.category !== category) {
return false;
}
      return true;
    });

    return filtered.slice(-limit);
  }

  /**
   * Get alert count by category
   */
  getAlertCounts(): Record<AlertCategory, number> {
    const result: Record<string, number> = {};
    for (const [category, count] of this.alertCounts.entries()) {
      result[category] = count;
    }
    return result as Record<AlertCategory, number>;
  }

  /**
   * Get alerts by level
   */
  getAlertsByLevel(level: AlertLevel): Alert[] {
    return this.alerts.filter((a) => a.level === level);
  }

  /**
   * Clear all alerts (for testing)
   */
  clear(): void {
    this.alerts = [];
    this.alertCounts.clear();
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Get alert statistics
   */
  getStats(): {
    total: number;
    unresolved: number;
    critical: number;
    warning: number;
    info: number;
    byCategory: Record<AlertCategory, number>;
  } {
    const critical = this.getAlertsByLevel("critical").length;
    const warning = this.getAlertsByLevel("warning").length;
    const info = this.getAlertsByLevel("info").length;
    const unresolved = this.getUnresolvedAlerts().length;

    return {
      total: this.alerts.length,
      unresolved,
      critical,
      warning,
      info,
      byCategory: this.getAlertCounts(),
    };
  }
}

/**
 * Global alert manager instance
 */
export const alertManager = new AlertManager();

/**
 * Create a policy violation alert
 */
export function alertPolicyViolation(
  toolName: string,
  reason: string,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert("warning", "policy_violation", `Policy violation: ${toolName}`, {
    toolName,
    reason,
    ...metadata,
  });
}

/**
 * Create a tool execution error alert
 */
export function alertExecutionError(
  toolName: string,
  error: string,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert("warning", "execution_error", `Tool execution error: ${toolName}`, {
    toolName,
    error,
    ...metadata,
  });
}

/**
 * Create a high error rate alert
 */
export function alertHighErrorRate(
  errorRate: number,
  threshold: number,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert(
    "critical",
    "high_error_rate",
    `High error rate: ${(errorRate * 100).toFixed(1)}% (threshold: ${(
      threshold * 100
    ).toFixed(1)}%)`,
    {
      errorRate,
      threshold,
      ...metadata,
    }
  );
}

/**
 * Create an approval denied alert
 */
export function alertApprovalDenied(
  toolName: string,
  reason?: string,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert("info", "approval_denied", `Approval denied: ${toolName}`, {
    toolName,
    reason,
    ...metadata,
  });
}

/**
 * Create a token expired alert
 */
export function alertTokenExpired(
  tokenId: string,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert("warning", "token_expired", "Approval token expired", {
    tokenId,
    ...metadata,
  });
}

/**
 * Create a cost threshold alert
 */
export function alertCostThreshold(
  currentCost: number,
  threshold: number,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert(
    "warning",
    "cost_threshold",
    `Cost threshold exceeded: $${currentCost.toFixed(2)} > $${threshold.toFixed(2)}`,
    {
      currentCost,
      threshold,
      ...metadata,
    }
  );
}

/**
 * Create a performance alert
 */
export function alertPerformance(
  metric: string,
  value: number,
  threshold: number,
  metadata?: Record<string, unknown>
): void {
  alertManager.alert(
    "warning",
    "performance",
    `Performance degradation: ${metric} = ${value} (threshold: ${threshold})`,
    {
      metric,
      value,
      threshold,
      ...metadata,
    }
  );
}

/**
 * Get unresolved critical alerts
 */
export function getCriticalAlerts(): Alert[] {
  return alertManager.getAlertsByLevel("critical").filter((a) => !a.resolved);
}

/**
 * Get alert stats
 */
export function getAlertStats(): {
  total: number;
  unresolved: number;
  critical: number;
  warning: number;
  info: number;
  byCategory: Record<AlertCategory, number>;
} {
  return alertManager.getStats();
}
