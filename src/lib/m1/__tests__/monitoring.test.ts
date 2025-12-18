/**
 * M1 Monitoring Tests - Phase 7
 *
 * Comprehensive tests for monitoring, metrics, cost tracking, and alerts.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  metricsCollector,
  trackAgentRun,
  trackToolExecution,
  trackPolicyDecision,
  trackApprovalRequest,
  trackApprovalGrant,
  trackApprovalDenial,
  trackClaudeAPICall,
  setActiveRunsGauge,
  getMetrics,
  exportMetricsPrometheus,
  resetMetrics,
} from "../monitoring/metrics";
import {
  costTracker,
  trackClaudeCall,
  getTotalCost,
  getCostBreakdown,
  formatCostAsUSD,
  getEstimatedMonthlyCost,
} from "../monitoring/cost-tracking";
import {
  alertManager,
  alertPolicyViolation,
  alertExecutionError,
  alertHighErrorRate,
  alertApprovalDenied,
  alertTokenExpired,
  alertCostThreshold,
  alertPerformance,
  getCriticalAlerts,
  getAlertStats,
} from "../monitoring/alerts";
import { m1Logger, logAgentStart, logAgentComplete, logToolExecutionStart, logToolExecutionEnd } from "../logging/structured-logger";

describe("M1 Monitoring - Phase 7", () => {
  beforeEach(() => {
    resetMetrics();
    costTracker.reset();
    alertManager.clear();
  });

  describe("Metrics Collection", () => {
    it("should track agent run metrics", () => {
      trackAgentRun("run-123", 1500, "completed", 3, 3);

      const metrics = getMetrics();
      expect(metrics.counters["agent_runs_total"]).toBe(1);
      expect(metrics.counters["agent_runs_completed"]).toBe(1);
    });

    it("should track multiple agent runs by stop reason", () => {
      trackAgentRun("run-1", 1000, "completed", 2, 2);
      trackAgentRun("run-2", 2000, "completed", 3, 3);
      trackAgentRun("run-3", 500, "error", 1, 0);

      const metrics = getMetrics();
      expect(metrics.counters["agent_runs_total"]).toBe(3);
      expect(metrics.counters["agent_runs_completed"]).toBe(2);
      expect(metrics.counters["agent_runs_error"]).toBe(1);
    });

    it("should record run duration histogram", () => {
      trackAgentRun("run-1", 1000, "completed", 2, 2);
      trackAgentRun("run-2", 2000, "completed", 3, 3);

      const metrics = getMetrics();
      const durationStats = metrics.histograms["agent_run_duration_ms"];

      expect(durationStats).toBeDefined();
      expect(durationStats.count).toBe(2);
      expect(durationStats.min).toBe(1000);
      expect(durationStats.max).toBe(2000);
      expect(durationStats.avg).toBe(1500);
    });

    it("should track tool execution metrics", () => {
      trackToolExecution("tool_registry_list", 100, true, "read");
      trackToolExecution("log_agent_run", 200, true, "write");
      trackToolExecution("invalid_tool", 50, false, "execute");

      const metrics = getMetrics();
      expect(metrics.counters["tool_executions_total"]).toBe(3);
      expect(metrics.counters["tool_tool_registry_list_executions_total"]).toBe(1);
      expect(metrics.counters["tool_execution_errors_total"]).toBe(1);
      expect(metrics.counters["tool_invalid_tool_errors_total"]).toBe(1);
    });

    it("should track policy decisions", () => {
      trackPolicyDecision(true, "read");
      trackPolicyDecision(true, "write");
      trackPolicyDecision(false, "execute", "approval_required");

      const metrics = getMetrics();
      expect(metrics.counters["policy_checks_total"]).toBe(3);
      expect(metrics.counters["policy_allowed_total"]).toBe(2);
      expect(metrics.counters["policy_denied_total"]).toBe(1);
      expect(metrics.counters["policy_denial_approval_required"]).toBe(1);
    });

    it("should track approval flow metrics", () => {
      trackApprovalRequest("execute");
      trackApprovalRequest("write");
      trackApprovalGrant();
      trackApprovalGrant();
      trackApprovalDenial();

      const metrics = getMetrics();
      expect(metrics.counters["approval_requests_total"]).toBe(2);
      expect(metrics.counters["approval_execute_requests_total"]).toBe(1);
      expect(metrics.counters["approval_grants_total"]).toBe(2);
      expect(metrics.counters["approval_denials_total"]).toBe(1);
    });

    it("should track Claude API call metrics", () => {
      trackClaudeAPICall(1000, 500);
      trackClaudeAPICall(1500, 750);

      const metrics = getMetrics();
      expect(metrics.counters["claude_api_calls_total"]).toBe(2);

      const inputTokens = metrics.histograms["claude_input_tokens"];
      expect(inputTokens.count).toBe(2);
      expect(inputTokens.sum).toBe(2500);

      const outputTokens = metrics.histograms["claude_output_tokens"];
      expect(outputTokens.count).toBe(2);
      expect(outputTokens.sum).toBe(1250);
    });

    it("should set active runs gauge", () => {
      setActiveRunsGauge(5);

      const metrics = getMetrics();
      expect(metrics.gauges["active_runs"]).toBe(5);

      setActiveRunsGauge(3);
      const updated = getMetrics();
      expect(updated.gauges["active_runs"]).toBe(3);
    });

    it("should export metrics in Prometheus format", () => {
      trackAgentRun("run-1", 1000, "completed", 2, 2);
      trackToolExecution("test_tool", 100, true, "read");
      setActiveRunsGauge(5);

      const prometheus = exportMetricsPrometheus();

      // Check that prometheus format contains expected metrics
      expect(prometheus).toBeTruthy();
      expect(prometheus.includes("agent_runs")).toBe(true);
      expect(prometheus.includes("tool_executions")).toBe(true);
      expect(prometheus.includes("m1_active_runs 5")).toBe(true);
      // Verify Prometheus format: metric_name value
      expect(prometheus.match(/m1_\w+ \d+/)).toBeTruthy();
    });

    it("should calculate histogram percentiles", () => {
      for (let i = 1; i <= 100; i++) {
        metricsCollector.recordHistogram("test_metric", i * 10);
      }

      const metrics = getMetrics();
      const stats = metrics.histograms["test_metric"];

      expect(stats.count).toBe(100);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(1000);
      expect(stats.p50).toBeGreaterThan(450);
      expect(stats.p50).toBeLessThan(550);
      expect(stats.p95).toBeGreaterThan(900);
      expect(stats.p99).toBeGreaterThan(950);
    });
  });

  describe("Cost Tracking", () => {
    it("should track API call costs", () => {
      const cost1 = trackClaudeCall(
        "claude-haiku-4-5-20251001",
        1000,
        500
      );
      const cost2 = trackClaudeCall(
        "claude-sonnet-4-20250514",
        2000,
        1000
      );

      expect(cost1).toBeGreaterThan(0);
      expect(cost2).toBeGreaterThan(0);
      expect(cost2).toBeGreaterThan(cost1); // Sonnet is more expensive
    });

    it("should calculate total cost", () => {
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500);
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500);

      const total = getTotalCost();
      expect(total).toBeGreaterThan(0);
    });

    it("should provide cost breakdown by model", () => {
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500);
      trackClaudeCall("claude-sonnet-4-20250514", 2000, 1000);
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500);

      const breakdown = getCostBreakdown();
      expect(breakdown.callCount).toBe(3);
      expect(breakdown.byModel["claude-haiku-4-5-20251001"]).toBeGreaterThan(0);
      expect(breakdown.byModel["claude-sonnet-4-20250514"]).toBeGreaterThan(0);
      expect(breakdown.byModel["claude-sonnet-4-20250514"]).toBeGreaterThan(
        breakdown.byModel["claude-haiku-4-5-20251001"]
      );
    });

    it("should format cost as USD", () => {
      const formatted = formatCostAsUSD(0.1234);
      expect(formatted).toBe("$0.1234");

      const formatted2 = formatCostAsUSD(1.5);
      expect(formatted2).toBe("$1.5000");
    });

    it("should get cost by time range", () => {
      const now = Date.now();
      costTracker.trackAPICall("claude-haiku-4-5-20251001", 1000, 500);

      const range = costTracker.getCostByTimeRange(now - 10000, now + 10000);
      expect(range.callCount).toBe(1);
      expect(range.cost).toBeGreaterThan(0);
    });

    it("should get all cost records", () => {
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500);
      trackClaudeCall("claude-sonnet-4-20250514", 2000, 1000);

      const records = costTracker.getAllRecords();
      expect(records).toHaveLength(2);
      expect(records[0].model).toBe("claude-haiku-4-5-20251001");
      expect(records[1].model).toBe("claude-sonnet-4-20250514");
    });

    it("should handle unknown models gracefully", () => {
      const cost = trackClaudeCall("unknown-model", 1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe("Alert System", () => {
    it("should create policy violation alerts", () => {
      alertPolicyViolation("restricted_tool", "Tool not allowed");

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("policy_violation");
      expect(alerts[0].level).toBe("warning");
      expect(alerts[0].metadata?.toolName).toBe("restricted_tool");
    });

    it("should create execution error alerts", () => {
      alertExecutionError("test_tool", "Connection timeout");

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("execution_error");
      expect(alerts[0].metadata?.error).toBe("Connection timeout");
    });

    it("should create high error rate alerts", () => {
      alertHighErrorRate(0.25, 0.1);

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].level).toBe("critical");
      expect(alerts[0].category).toBe("high_error_rate");
    });

    it("should create approval denied alerts", () => {
      alertApprovalDenied("sensitive_tool", "User not authorized");

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("approval_denied");
      expect(alerts[0].level).toBe("info");
    });

    it("should create token expiration alerts", () => {
      alertTokenExpired("token-123");

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("token_expired");
    });

    it("should create cost threshold alerts", () => {
      alertCostThreshold(50.0, 25.0);

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("cost_threshold");
      expect(alerts[0].level).toBe("warning");
    });

    it("should create performance alerts", () => {
      alertPerformance("response_time_ms", 2500, 1000);

      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].category).toBe("performance");
    });

    it("should get unresolved alerts", () => {
      alertPolicyViolation("tool1", "violation");
      alertExecutionError("tool2", "error");

      const unresolved = alertManager.getUnresolvedAlerts();
      expect(unresolved).toHaveLength(2);

      alertManager.resolveAlert(unresolved[0].id);

      const stillUnresolved = alertManager.getUnresolvedAlerts();
      expect(stillUnresolved).toHaveLength(1);
    });

    it("should get recent alerts with limit", () => {
      for (let i = 0; i < 10; i++) {
        alertPolicyViolation(`tool${i}`, "violation");
      }

      const recent = alertManager.getRecentAlerts(5);
      expect(recent).toHaveLength(5);
    });

    it("should get alert statistics", () => {
      alertPolicyViolation("tool1", "violation");
      alertHighErrorRate(0.25, 0.1);
      alertApprovalDenied("tool2", "unauthorized");
      alertExecutionError("tool3", "error");

      const stats = getAlertStats();
      expect(stats.total).toBe(4);
      expect(stats.critical).toBe(1); // high_error_rate
      expect(stats.warning).toBe(2); // policy_violation, execution_error
      expect(stats.info).toBe(1); // approval_denied
    });

    it("should filter alerts by category", () => {
      alertPolicyViolation("tool1", "violation");
      alertPolicyViolation("tool2", "violation");
      alertExecutionError("tool3", "error");

      const policyAlerts = alertManager.getUnresolvedAlerts("policy_violation");
      expect(policyAlerts).toHaveLength(2);

      const errorAlerts = alertManager.getUnresolvedAlerts("execution_error");
      expect(errorAlerts).toHaveLength(1);
    });

    it("should get critical alerts", () => {
      alertPolicyViolation("tool1", "violation");
      alertHighErrorRate(0.25, 0.1);
      alertExecutionError("tool2", "error");

      const critical = getCriticalAlerts();
      expect(critical).toHaveLength(1);
      expect(critical[0].category).toBe("high_error_rate");
    });

    it("should support alert callbacks", async () => {
      let callbackTriggered = false;
      let capturedAlert: any = null;

      alertManager.onAlert((alert) => {
        callbackTriggered = true;
        capturedAlert = alert;
      });

      alertPolicyViolation("test_tool", "violation");

      expect(callbackTriggered).toBe(true);
      expect(capturedAlert.category).toBe("policy_violation");
    });

    it("should support category-specific alert callbacks", async () => {
      let policyCallbackTriggered = false;
      let errorCallbackTriggered = false;

      alertManager.onAlert((alert) => {
        policyCallbackTriggered = true;
      }, "policy_violation");

      alertManager.onAlert((alert) => {
        errorCallbackTriggered = true;
      }, "execution_error");

      alertPolicyViolation("tool1", "violation");

      expect(policyCallbackTriggered).toBe(true);
      expect(errorCallbackTriggered).toBe(false);

      alertExecutionError("tool2", "error");

      expect(errorCallbackTriggered).toBe(true);
    });
  });

  describe("Structured Logging", () => {
    it("should log agent start events", () => {
      expect(() => {
        logAgentStart({
          runId: "run-123",
          agentName: "test-agent",
          goal: "test goal",
        });
      }).not.toThrow();
    });

    it("should log agent completion events", () => {
      expect(() => {
        logAgentComplete({
          runId: "run-123",
          stopReason: "completed",
          durationMs: 1500,
          toolCallsProposed: 3,
          toolCallsExecuted: 3,
        });
      }).not.toThrow();
    });

    it("should log tool execution start", () => {
      expect(() => {
        logToolExecutionStart({
          requestId: "req-123",
          toolName: "test_tool",
          scope: "read",
        });
      }).not.toThrow();
    });

    it("should log tool execution end", () => {
      expect(() => {
        logToolExecutionEnd({
          requestId: "req-123",
          toolName: "test_tool",
          duration: 100,
          success: true,
        });
      }).not.toThrow();
    });
  });

  describe("Integration Scenarios", () => {
    it("should track complete agent execution flow", () => {
      const runId = "run-integration-1";

      // Start
      logAgentStart({
        runId,
        agentName: "orchestrator",
        goal: "List tools and check policy",
      });

      // Tool executions
      trackToolExecution("tool_registry_list", 100, true, "read");
      trackToolExecution("tool_policy_check", 150, true, "read");

      // Policies and approvals
      trackPolicyDecision(true, "read");
      trackApprovalRequest("read");
      trackApprovalGrant();

      // API calls - track both cost and metrics
      trackClaudeCall("claude-haiku-4-5-20251001", 1000, 500); // Cost tracking
      trackClaudeAPICall(1000, 500); // Metrics tracking

      // Completion
      trackAgentRun(runId, 500, "completed", 2, 2);
      logAgentComplete({
        runId,
        stopReason: "completed",
        durationMs: 500,
        toolCallsProposed: 2,
        toolCallsExecuted: 2,
      });

      // Verify metrics
      const metrics = getMetrics();
      expect(metrics.counters["agent_runs_total"]).toBe(1);
      expect(metrics.counters["tool_executions_total"]).toBe(2);
      expect(metrics.counters["approval_grants_total"]).toBe(1);
      // Claude API calls tracked in histograms via trackClaudeAPICall
      expect(metrics.histograms["claude_input_tokens"]).toBeDefined();
      expect(metrics.histograms["claude_input_tokens"].count).toBeGreaterThan(0);

      // Verify cost
      const cost = getTotalCost();
      expect(cost).toBeGreaterThan(0);
    });

    it("should track error scenarios with alerts", () => {
      // Tool execution error
      trackToolExecution("problematic_tool", 50, false);
      alertExecutionError("problematic_tool", "Timeout after 50ms");

      // Policy violation
      trackPolicyDecision(false, "execute", "approval_required");
      alertPolicyViolation("restricted_tool", "approval_required");

      // Error rate alert
      alertHighErrorRate(0.3, 0.1);

      // Verify alerts
      const alerts = alertManager.getAllAlerts();
      expect(alerts).toHaveLength(3);

      const critical = getCriticalAlerts();
      expect(critical).toHaveLength(1);

      // Verify metrics
      const metrics = getMetrics();
      expect(metrics.counters["tool_execution_errors_total"]).toBe(1);
      expect(metrics.counters["policy_denied_total"]).toBe(1);
    });
  });
});
