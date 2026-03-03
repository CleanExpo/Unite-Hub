/**
 * Scheduled Audit Runner - Autonomous Platform Audit System
 *
 * Orchestrates and schedules audits:
 * - Cron-based scheduling
 * - On-demand audit execution
 * - Result aggregation
 * - Alert triggering
 */

import { v4 as uuidv4 } from 'uuid';
import { UserJourneyRunner, COMMON_JOURNEYS, type JourneyResult } from './user-journey-runner';
import { UXFrictionDetector, type FrictionAnalysis } from './ux-friction-detector';
import { EvidenceCollector } from './evidence-collector';
import { APIRouteAuditor, type AuditReport } from './api-route-auditor';

// ============================================================================
// Types
// ============================================================================

export interface AuditSchedule {
  id: string;
  name: string;
  type: AuditType;
  cron: string;
  enabled: boolean;
  config: AuditConfig;
  last_run?: string;
  next_run?: string;
}

export type AuditType =
  | 'health_check'
  | 'journey_run'
  | 'route_audit'
  | 'friction_analysis'
  | 'full_audit';

export interface AuditConfig {
  journeys?: string[];
  routes?: string[];
  threshold_score?: number;
  alert_on_failure?: boolean;
  evidence_retention_days?: number;
}

export interface ScheduledAuditResult {
  schedule_id: string;
  run_id: string;
  type: AuditType;
  started_at: string;
  completed_at: string;
  status: 'success' | 'partial' | 'failure' | 'error';
  results: AuditResults;
  alerts: Alert[];
}

export interface AuditResults {
  health?: HealthCheckResult;
  journeys?: JourneyResult[];
  routes?: AuditReport;
  friction?: FrictionAnalysis;
  [key: string]: unknown;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  latency_ms: number;
  message?: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: AlertType;
  title: string;
  message: string;
  triggered_at: string;
  acknowledged?: boolean;
}

export type AlertType =
  | 'health_degraded'
  | 'journey_failed'
  | 'route_failed'
  | 'friction_high'
  | 'performance_degraded'
  | 'error';

export interface RunnerOptions {
  baseUrl?: string;
  apiDir?: string;
  evidenceStorage?: string;
}

// ============================================================================
// Scheduled Audit Runner
// ============================================================================

export class ScheduledAuditRunner {
  private readonly runnerId: string;
  private readonly journeyRunner: UserJourneyRunner;
  private readonly frictionDetector: UXFrictionDetector;
  private readonly evidenceCollector: EvidenceCollector;
  private readonly routeAuditor: APIRouteAuditor;
  private readonly baseUrl: string;
  private readonly apiDir: string;

  private schedules: Map<string, AuditSchedule> = new Map();
  private results: Map<string, ScheduledAuditResult> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options?: RunnerOptions) {
    this.runnerId = `scheduled_runner_${uuidv4().slice(0, 8)}`;
    this.baseUrl = options?.baseUrl || 'http://localhost:3000';
    this.apiDir = options?.apiDir || './app/api';

    this.journeyRunner = new UserJourneyRunner();
    this.frictionDetector = new UXFrictionDetector();
    this.evidenceCollector = new EvidenceCollector({
      localStoragePath: options?.evidenceStorage,
    });
    this.routeAuditor = new APIRouteAuditor({ baseUrl: this.baseUrl });
  }

  getRunnerId(): string {
    return this.runnerId;
  }

  /**
   * Add a new audit schedule
   */
  addSchedule(schedule: Omit<AuditSchedule, 'id'>): AuditSchedule {
    const id = `schedule_${uuidv4().slice(0, 8)}`;
    const newSchedule: AuditSchedule = {
      ...schedule,
      id,
      next_run: this.calculateNextRun(schedule.cron),
    };

    this.schedules.set(id, newSchedule);

    if (schedule.enabled) {
      this.startSchedule(newSchedule);
    }

    return newSchedule;
  }

  /**
   * Remove a schedule
   */
  removeSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    this.stopSchedule(scheduleId);
    this.schedules.delete(scheduleId);
    return true;
  }

  /**
   * Enable/disable a schedule
   */
  toggleSchedule(scheduleId: string, enabled: boolean): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    schedule.enabled = enabled;
    if (enabled) {
      this.startSchedule(schedule);
    } else {
      this.stopSchedule(scheduleId);
    }

    return true;
  }

  /**
   * Run an audit immediately
   */
  async runAudit(type: AuditType, config?: AuditConfig): Promise<ScheduledAuditResult> {
    const runId = `run_${uuidv4().slice(0, 8)}`;
    const startedAt = new Date().toISOString();
    const results: AuditResults = {};
    const alerts: Alert[] = [];

    try {
      switch (type) {
        case 'health_check':
          results.health = await this.runHealthCheck();
          if (results.health.status !== 'healthy') {
            alerts.push(
              this.createAlert(
                'health_degraded',
                `Health check: ${results.health.status}`,
                `System health is ${results.health.status}`,
                results.health.status === 'unhealthy' ? 'critical' : 'high'
              )
            );
          }
          break;

        case 'journey_run':
          results.journeys = await this.runJourneys(config?.journeys);
          const failedJourneys = results.journeys.filter(
            (j) => j.status === 'failed' || j.status === 'error'
          );
          for (const journey of failedJourneys) {
            alerts.push(
              this.createAlert(
                'journey_failed',
                `Journey failed: ${journey.journey_name}`,
                `Journey ${journey.journey_name} failed with status ${journey.status}`,
                'high'
              )
            );
          }
          break;

        case 'route_audit':
          await this.routeAuditor.discoverRoutes(this.apiDir);
          results.routes = await this.routeAuditor.auditAll();
          if (results.routes.average_score < (config?.threshold_score || 70)) {
            alerts.push(
              this.createAlert(
                'route_failed',
                `Route audit score: ${results.routes.average_score}`,
                `Average route score ${results.routes.average_score} is below threshold`,
                results.routes.average_score < 50 ? 'critical' : 'high'
              )
            );
          }
          break;

        case 'friction_analysis':
          const journeyResults = await this.runJourneys(config?.journeys);
          results.journeys = journeyResults;
          for (const journeyResult of journeyResults) {
            results.friction = this.frictionDetector.analyzeJourney(journeyResult);
          }
          if (results.friction && results.friction.metrics.friction_score > 50) {
            alerts.push(
              this.createAlert(
                'friction_high',
                `High friction score: ${results.friction.metrics.friction_score}`,
                `Friction score ${results.friction.metrics.friction_score} indicates UX issues`,
                results.friction.metrics.friction_score > 70 ? 'high' : 'medium'
              )
            );
          }
          break;

        case 'full_audit':
          // Run all audit types
          results.health = await this.runHealthCheck();
          results.journeys = await this.runJourneys(config?.journeys);
          await this.routeAuditor.discoverRoutes(this.apiDir);
          results.routes = await this.routeAuditor.auditAll();
          if (results.journeys.length > 0) {
            results.friction = this.frictionDetector.analyzeJourney(results.journeys[0]);
          }
          // Generate alerts for any failures
          if (results.health?.status !== 'healthy') {
            alerts.push(
              this.createAlert(
                'health_degraded',
                `Health: ${results.health?.status}`,
                'System health degraded',
                'high'
              )
            );
          }
          break;
      }

      // Collect evidence
      await this.evidenceCollector.collect(
        'report',
        'scheduled',
        alerts.length > 0 ? 'warning' : 'pass',
        results,
        { tags: [type] }
      );

      const completedAt = new Date().toISOString();
      const status = this.determineStatus(results, alerts);

      const result: ScheduledAuditResult = {
        schedule_id: '',
        run_id: runId,
        type,
        started_at: startedAt,
        completed_at: completedAt,
        status,
        results,
        alerts,
      };

      this.results.set(runId, result);
      return result;
    } catch (error) {
      const completedAt = new Date().toISOString();

      alerts.push(
        this.createAlert(
          'error',
          `Audit error: ${type}`,
          error instanceof Error ? error.message : 'Unknown error',
          'critical'
        )
      );

      const result: ScheduledAuditResult = {
        schedule_id: '',
        run_id: runId,
        type,
        started_at: startedAt,
        completed_at: completedAt,
        status: 'error',
        results,
        alerts,
      };

      this.results.set(runId, result);
      return result;
    }
  }

  /**
   * Run health check
   */
  private async runHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];
    let overallStatus: HealthCheckResult['status'] = 'healthy';

    // Check basic health endpoint
    const basicCheck = await this.checkEndpoint('/api/health', 'Basic Health');
    checks.push(basicCheck);
    if (basicCheck.status === 'fail') overallStatus = 'unhealthy';

    // Check deep health endpoint
    const deepCheck = await this.checkEndpoint('/api/health/deep', 'Deep Health');
    checks.push(deepCheck);
    if (deepCheck.status === 'fail') {
      overallStatus = overallStatus === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check a single endpoint
   */
  private async checkEndpoint(path: string, name: string): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      return {
        name,
        status: response.ok ? 'pass' : 'fail',
        latency_ms: Date.now() - start,
        message: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        latency_ms: Date.now() - start,
        message: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Run user journeys
   */
  private async runJourneys(journeyIds?: string[]): Promise<JourneyResult[]> {
    const journeysToRun = journeyIds
      ? COMMON_JOURNEYS.filter((j) => journeyIds.includes(j.id))
      : COMMON_JOURNEYS;

    const results: JourneyResult[] = [];

    for (const journey of journeysToRun) {
      const result = await this.journeyRunner.runJourney(journey);
      results.push(result);
    }

    return results;
  }

  /**
   * Create an alert
   */
  private createAlert(
    type: AlertType,
    title: string,
    message: string,
    severity: Alert['severity']
  ): Alert {
    return {
      id: `alert_${uuidv4().slice(0, 8)}`,
      severity,
      type,
      title,
      message,
      triggered_at: new Date().toISOString(),
    };
  }

  /**
   * Determine overall status from results
   */
  private determineStatus(results: AuditResults, alerts: Alert[]): ScheduledAuditResult['status'] {
    if (alerts.some((a) => a.severity === 'critical')) {
      return 'failure';
    }
    if (alerts.some((a) => a.severity === 'high')) {
      return 'partial';
    }
    if (alerts.length > 0) {
      return 'partial';
    }
    return 'success';
  }

  /**
   * Start a schedule timer
   */
  private startSchedule(schedule: AuditSchedule): void {
    this.stopSchedule(schedule.id);

    const interval = this.cronToInterval(schedule.cron);
    if (interval <= 0) return;

    const timer = setInterval(async () => {
      schedule.last_run = new Date().toISOString();
      schedule.next_run = this.calculateNextRun(schedule.cron);

      const result = await this.runAudit(schedule.type, schedule.config);
      result.schedule_id = schedule.id;
    }, interval);

    this.timers.set(schedule.id, timer);
  }

  /**
   * Stop a schedule timer
   */
  private stopSchedule(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(scheduleId);
    }
  }

  /**
   * Convert cron expression to interval (simplified)
   */
  private cronToInterval(cron: string): number {
    // Simplified cron parsing - supports common intervals
    const intervals: Record<string, number> = {
      '* * * * *': 60 * 1000, // Every minute
      '*/5 * * * *': 5 * 60 * 1000, // Every 5 minutes
      '*/15 * * * *': 15 * 60 * 1000, // Every 15 minutes
      '*/30 * * * *': 30 * 60 * 1000, // Every 30 minutes
      '0 * * * *': 60 * 60 * 1000, // Every hour
      '0 */6 * * *': 6 * 60 * 60 * 1000, // Every 6 hours
      '0 0 * * *': 24 * 60 * 60 * 1000, // Daily
    };

    return intervals[cron] || 60 * 60 * 1000; // Default to hourly
  }

  /**
   * Calculate next run time from cron
   */
  private calculateNextRun(cron: string): string {
    const interval = this.cronToInterval(cron);
    const next = new Date(Date.now() + interval);
    return next.toISOString();
  }

  /**
   * Get all schedules
   */
  getSchedules(): AuditSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get all results
   */
  getResults(): ScheduledAuditResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get results for a specific schedule
   */
  getScheduleResults(scheduleId: string): ScheduledAuditResult[] {
    return Array.from(this.results.values()).filter((r) => r.schedule_id === scheduleId);
  }

  /**
   * Stop all schedules (cleanup)
   */
  stopAll(): void {
    for (const scheduleId of this.timers.keys()) {
      this.stopSchedule(scheduleId);
    }
  }
}

export default ScheduledAuditRunner;
