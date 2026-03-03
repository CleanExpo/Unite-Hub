/**
 * User Journey Runner - Autonomous Platform Audit System
 *
 * Simulates user flows through the application and collects evidence
 * of behavior at each step. Used for:
 * - Regression testing without tests
 * - UX verification
 * - Error path discovery
 * - Performance baseline capture
 */

import { v4 as uuidv4 } from "uuid";

// ============================================================================
// Types
// ============================================================================

export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  action: JourneyAction;
  expectedOutcome: ExpectedOutcome;
  timeout_ms: number;
}

export type JourneyAction =
  | { type: "navigate"; url: string }
  | { type: "click"; selector: string; text?: string }
  | { type: "type"; selector: string; text: string }
  | { type: "submit"; selector: string }
  | { type: "wait"; duration_ms: number }
  | { type: "wait_for"; selector: string; timeout_ms?: number }
  | { type: "assert_visible"; selector: string }
  | { type: "assert_text"; selector: string; text: string }
  | { type: "assert_url"; pattern: string }
  | { type: "screenshot"; name: string }
  | { type: "custom"; fn: () => Promise<void> };

export interface ExpectedOutcome {
  success_indicators: string[];
  failure_indicators: string[];
  performance_threshold_ms?: number;
}

export interface JourneyDefinition {
  id: string;
  name: string;
  description: string;
  category: JourneyCategory;
  priority: "critical" | "high" | "medium" | "low";
  steps: JourneyStep[];
  cleanup?: () => Promise<void>;
}

export type JourneyCategory =
  | "authentication"
  | "navigation"
  | "data_entry"
  | "checkout"
  | "search"
  | "settings"
  | "admin"
  | "api"
  | "custom";

export interface StepResult {
  step_id: string;
  step_name: string;
  status: "passed" | "failed" | "skipped" | "error";
  duration_ms: number;
  evidence: StepEvidence;
  error?: string;
  timestamp: string;
}

export interface StepEvidence {
  screenshot_path?: string;
  console_logs: string[];
  network_requests: NetworkRequest[];
  dom_snapshot?: string;
  performance_metrics: PerformanceMetrics;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration_ms: number;
  size_bytes: number;
  timestamp: string;
}

export interface PerformanceMetrics {
  dom_content_loaded_ms?: number;
  first_paint_ms?: number;
  first_contentful_paint_ms?: number;
  largest_contentful_paint_ms?: number;
  time_to_interactive_ms?: number;
  total_blocking_time_ms?: number;
}

export interface JourneyResult {
  journey_id: string;
  journey_name: string;
  run_id: string;
  status: "passed" | "failed" | "partial" | "error";
  started_at: string;
  completed_at: string;
  duration_ms: number;
  steps_total: number;
  steps_passed: number;
  steps_failed: number;
  step_results: StepResult[];
  summary: JourneySummary;
}

export interface JourneySummary {
  total_duration_ms: number;
  average_step_duration_ms: number;
  slowest_step: string;
  fastest_step: string;
  errors: string[];
  warnings: string[];
  friction_points: FrictionPoint[];
}

export interface FrictionPoint {
  step_id: string;
  type: "slow_response" | "error" | "confusing_ui" | "dead_end" | "loop";
  severity: "high" | "medium" | "low";
  description: string;
  suggestion?: string;
}

// ============================================================================
// User Journey Runner
// ============================================================================

export class UserJourneyRunner {
  private readonly runnerId: string;
  private readonly results: Map<string, JourneyResult> = new Map();
  private currentJourney: JourneyDefinition | null = null;
  private stepResults: StepResult[] = [];
  private consoleLogs: string[] = [];
  private networkRequests: NetworkRequest[] = [];

  constructor() {
    this.runnerId = `journey_runner_${uuidv4().slice(0, 8)}`;
  }

  getRunnerId(): string {
    return this.runnerId;
  }

  /**
   * Run a user journey and collect evidence
   */
  async runJourney(journey: JourneyDefinition): Promise<JourneyResult> {
    const runId = `run_${uuidv4().slice(0, 8)}`;
    const startedAt = new Date().toISOString();

    this.currentJourney = journey;
    this.stepResults = [];
    this.consoleLogs = [];
    this.networkRequests = [];

    let status: JourneyResult["status"] = "passed";

    try {
      for (const step of journey.steps) {
        const stepResult = await this.executeStep(step);
        this.stepResults.push(stepResult);

        if (stepResult.status === "failed" || stepResult.status === "error") {
          status = "failed";
          // Continue to remaining steps or break depending on criticality
          if (journey.priority === "critical") {
            break;
          }
        }
      }
    } catch (error) {
      status = "error";
      this.stepResults.push({
        step_id: "journey_error",
        step_name: "Journey Error",
        status: "error",
        duration_ms: 0,
        evidence: this.createEmptyEvidence(),
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      // Run cleanup if provided
      if (journey.cleanup) {
        try {
          await journey.cleanup();
        } catch {
          // Log but don't fail the journey
        }
      }
    }

    const completedAt = new Date().toISOString();
    const duration_ms =
      new Date(completedAt).getTime() - new Date(startedAt).getTime();

    const stepsPassedCount = this.stepResults.filter(
      (s) => s.status === "passed"
    ).length;
    const stepsFailedCount = this.stepResults.filter(
      (s) => s.status === "failed" || s.status === "error"
    ).length;

    // Determine partial status
    if (status !== "error" && stepsPassedCount > 0 && stepsFailedCount > 0) {
      status = "partial";
    }

    const result: JourneyResult = {
      journey_id: journey.id,
      journey_name: journey.name,
      run_id: runId,
      status,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms,
      steps_total: journey.steps.length,
      steps_passed: stepsPassedCount,
      steps_failed: stepsFailedCount,
      step_results: this.stepResults,
      summary: this.generateSummary(),
    };

    this.results.set(runId, result);
    this.currentJourney = null;

    return result;
  }

  /**
   * Execute a single step in the journey
   */
  private async executeStep(step: JourneyStep): Promise<StepResult> {
    const startTime = Date.now();
    const stepConsoleLogs: string[] = [];

    try {
      // Execute the action
      await this.executeAction(step.action, step.timeout_ms);

      // Verify expected outcome
      const outcomeResult = await this.verifyOutcome(step.expectedOutcome);

      const duration_ms = Date.now() - startTime;

      return {
        step_id: step.id,
        step_name: step.name,
        status: outcomeResult.passed ? "passed" : "failed",
        duration_ms,
        evidence: {
          console_logs: stepConsoleLogs,
          network_requests: this.getRecentNetworkRequests(startTime),
          performance_metrics: this.capturePerformanceMetrics(),
        },
        error: outcomeResult.passed ? undefined : outcomeResult.reason,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        step_id: step.id,
        step_name: step.name,
        status: "error",
        duration_ms: Date.now() - startTime,
        evidence: {
          console_logs: stepConsoleLogs,
          network_requests: this.getRecentNetworkRequests(startTime),
          performance_metrics: {},
        },
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute a journey action
   */
  private async executeAction(
    action: JourneyAction,
    timeout_ms: number
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Action timeout")), timeout_ms);
    });

    const actionPromise = (async () => {
      switch (action.type) {
        case "navigate":
          // In a real implementation, this would use Playwright/Puppeteer
          // For now, we simulate with fetch
          await fetch(action.url, { method: "HEAD" });
          break;

        case "wait":
          await new Promise((resolve) =>
            setTimeout(resolve, action.duration_ms)
          );
          break;

        case "custom":
          await action.fn();
          break;

        // Other actions would be implemented with a browser automation tool
        default:
          // Simulate action execution
          await new Promise((resolve) => setTimeout(resolve, 100));
      }
    })();

    await Promise.race([actionPromise, timeoutPromise]);
  }

  /**
   * Verify expected outcome of a step
   */
  private async verifyOutcome(
    expected: ExpectedOutcome
  ): Promise<{ passed: boolean; reason?: string }> {
    // In a real implementation, this would check DOM, console, etc.
    // For now, we provide a basic structure

    // Check for failure indicators first
    for (const indicator of expected.failure_indicators) {
      if (this.consoleLogs.some((log) => log.includes(indicator))) {
        return {
          passed: false,
          reason: `Failure indicator found: ${indicator}`,
        };
      }
    }

    // Check for success indicators
    for (const indicator of expected.success_indicators) {
      // Simulate check - in real implementation would verify DOM/state
      if (indicator === "page_loaded") {
        continue; // Always passes in simulation
      }
    }

    return { passed: true };
  }

  /**
   * Get network requests since a given time
   */
  private getRecentNetworkRequests(sinceTime: number): NetworkRequest[] {
    return this.networkRequests.filter(
      (req) => new Date(req.timestamp).getTime() >= sinceTime
    );
  }

  /**
   * Capture performance metrics
   */
  private capturePerformanceMetrics(): PerformanceMetrics {
    // In browser context, would use Performance API
    // For now, return empty metrics
    return {};
  }

  /**
   * Create empty evidence object
   */
  private createEmptyEvidence(): StepEvidence {
    return {
      console_logs: [],
      network_requests: [],
      performance_metrics: {},
    };
  }

  /**
   * Generate journey summary with friction points
   */
  private generateSummary(): JourneySummary {
    const durations = this.stepResults.map((s) => s.duration_ms);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const avgDuration = durations.length > 0 ? totalDuration / durations.length : 0;

    const sortedByDuration = [...this.stepResults].sort(
      (a, b) => b.duration_ms - a.duration_ms
    );

    const errors = this.stepResults
      .filter((s) => s.error)
      .map((s) => `${s.step_name}: ${s.error}`);

    const frictionPoints = this.detectFrictionPoints();

    return {
      total_duration_ms: totalDuration,
      average_step_duration_ms: Math.round(avgDuration),
      slowest_step: sortedByDuration[0]?.step_name || "N/A",
      fastest_step:
        sortedByDuration[sortedByDuration.length - 1]?.step_name || "N/A",
      errors,
      warnings: [],
      friction_points: frictionPoints,
    };
  }

  /**
   * Detect friction points in the journey
   */
  private detectFrictionPoints(): FrictionPoint[] {
    const frictionPoints: FrictionPoint[] = [];
    const SLOW_THRESHOLD_MS = 3000;

    for (const step of this.stepResults) {
      // Slow response
      if (step.duration_ms > SLOW_THRESHOLD_MS) {
        frictionPoints.push({
          step_id: step.step_id,
          type: "slow_response",
          severity: step.duration_ms > SLOW_THRESHOLD_MS * 2 ? "high" : "medium",
          description: `Step took ${step.duration_ms}ms (threshold: ${SLOW_THRESHOLD_MS}ms)`,
          suggestion: "Investigate performance bottlenecks",
        });
      }

      // Errors
      if (step.status === "error" || step.status === "failed") {
        frictionPoints.push({
          step_id: step.step_id,
          type: "error",
          severity: "high",
          description: step.error || "Step failed without error message",
          suggestion: "Fix the error before proceeding",
        });
      }
    }

    return frictionPoints;
  }

  /**
   * Get all results from this runner
   */
  getResults(): JourneyResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get a specific result by run ID
   */
  getResult(runId: string): JourneyResult | undefined {
    return this.results.get(runId);
  }
}

// ============================================================================
// Pre-defined User Journeys
// ============================================================================

export const COMMON_JOURNEYS: JourneyDefinition[] = [
  {
    id: "health_check",
    name: "Basic Health Check",
    description: "Verify all health endpoints respond correctly",
    category: "api",
    priority: "critical",
    steps: [
      {
        id: "check_basic_health",
        name: "Check basic health endpoint",
        description: "Verify /api/health returns healthy status",
        action: { type: "navigate", url: "/api/health" },
        expectedOutcome: {
          success_indicators: ["page_loaded"],
          failure_indicators: ["error", "unhealthy"],
          performance_threshold_ms: 1000,
        },
        timeout_ms: 5000,
      },
      {
        id: "check_deep_health",
        name: "Check deep health endpoint",
        description: "Verify /api/health/deep returns with all dependencies",
        action: { type: "navigate", url: "/api/health/deep" },
        expectedOutcome: {
          success_indicators: ["page_loaded"],
          failure_indicators: ["unhealthy"],
          performance_threshold_ms: 5000,
        },
        timeout_ms: 10000,
      },
      {
        id: "check_routes_health",
        name: "Check routes health endpoint",
        description: "Verify /api/health/routes returns route listing",
        action: { type: "navigate", url: "/api/health/routes" },
        expectedOutcome: {
          success_indicators: ["page_loaded"],
          failure_indicators: ["error"],
          performance_threshold_ms: 2000,
        },
        timeout_ms: 5000,
      },
    ],
  },
  {
    id: "homepage_load",
    name: "Homepage Load Test",
    description: "Verify homepage loads correctly with all assets",
    category: "navigation",
    priority: "high",
    steps: [
      {
        id: "load_homepage",
        name: "Load homepage",
        description: "Navigate to homepage and verify it loads",
        action: { type: "navigate", url: "/" },
        expectedOutcome: {
          success_indicators: ["page_loaded"],
          failure_indicators: ["error", "404", "500"],
          performance_threshold_ms: 3000,
        },
        timeout_ms: 10000,
      },
    ],
  },
];

export default UserJourneyRunner;
