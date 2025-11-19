/**
 * Scheduling Engine - Phase 8 Week 23
 *
 * Manages recurring SEO audit jobs with scheduling, execution, and logging.
 */

import { getSupabaseServer } from "@/lib/supabase";

// =============================================================
// Types
// =============================================================

export type JobType = "WEEKLY_SNAPSHOT" | "MONTHLY_FULL_AUDIT" | "ANOMALY_CHECK";
export type Frequency = "DAILY" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface ClientSchedule {
  schedule_id: string;
  client_id: string;
  job_type: JobType;
  frequency: Frequency;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string;
  client_consent: boolean;
}

export interface ScheduleLog {
  log_id: string;
  schedule_id: string;
  client_id: string;
  job_type: JobType;
  status: JobStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  result_summary: Record<string, any>;
  error_message: string | null;
}

export interface ScheduleConfig {
  client_id: string;
  job_type: JobType;
  frequency: Frequency;
  created_by: string;
  client_consent?: boolean;
}

export interface JobExecutionResult {
  success: boolean;
  job_type: JobType;
  client_id: string;
  duration_ms: number;
  result_summary: Record<string, any>;
  error?: string;
}

// =============================================================
// Scheduling Engine Class
// =============================================================

export class SchedulingEngine {
  /**
   * Create a new schedule for a client
   */
  static async createSchedule(config: ScheduleConfig): Promise<ClientSchedule> {
    const supabase = await getSupabaseServer();

    const nextRunAt = this.calculateNextRun(config.frequency, new Date());

    const { data, error } = await supabase
      .from("client_schedules")
      .upsert(
        {
          client_id: config.client_id,
          job_type: config.job_type,
          frequency: config.frequency,
          enabled: true,
          next_run_at: nextRunAt.toISOString(),
          created_by: config.created_by,
          client_consent: config.client_consent ?? false,
        },
        {
          onConflict: "client_id,job_type",
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all schedules due for execution
   */
  static async getDueSchedules(): Promise<ClientSchedule[]> {
    const supabase = await getSupabaseServer();

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("client_schedules")
      .select("*")
      .eq("enabled", true)
      .eq("client_consent", true)
      .lte("next_run_at", now)
      .order("next_run_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to get due schedules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get schedules for a specific client
   */
  static async getClientSchedules(clientId: string): Promise<ClientSchedule[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("client_schedules")
      .select("*")
      .eq("client_id", clientId);

    if (error) {
      throw new Error(`Failed to get client schedules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update schedule after execution
   */
  static async markScheduleCompleted(
    scheduleId: string,
    frequency: Frequency
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const now = new Date();
    const nextRunAt = this.calculateNextRun(frequency, now);

    const { error } = await supabase
      .from("client_schedules")
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRunAt.toISOString(),
      })
      .eq("schedule_id", scheduleId);

    if (error) {
      throw new Error(`Failed to update schedule: ${error.message}`);
    }
  }

  /**
   * Disable a schedule
   */
  static async disableSchedule(scheduleId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("client_schedules")
      .update({ enabled: false })
      .eq("schedule_id", scheduleId);

    if (error) {
      throw new Error(`Failed to disable schedule: ${error.message}`);
    }
  }

  /**
   * Log job execution
   */
  static async logExecution(
    schedule: ClientSchedule,
    status: JobStatus,
    result: Partial<JobExecutionResult>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from("schedule_log").insert({
      schedule_id: schedule.schedule_id,
      client_id: schedule.client_id,
      job_type: schedule.job_type,
      status,
      started_at: new Date().toISOString(),
      completed_at: result.success ? new Date().toISOString() : null,
      duration_ms: result.duration_ms || null,
      result_summary: result.result_summary || {},
      error_message: result.error || null,
    });

    if (error) {
      console.error("[SchedulingEngine] Failed to log execution:", error);
    }
  }

  /**
   * Get execution history for a schedule
   */
  static async getExecutionHistory(
    scheduleId: string,
    limit: number = 10
  ): Promise<ScheduleLog[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("schedule_log")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get execution history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate next run time based on frequency
   */
  private static calculateNextRun(frequency: Frequency, from: Date): Date {
    const next = new Date(from);

    switch (frequency) {
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "FORTNIGHTLY":
        next.setDate(next.getDate() + 14);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
    }

    // Set to 3 AM to avoid peak hours
    next.setHours(3, 0, 0, 0);

    return next;
  }

  /**
   * Execute a scheduled job
   */
  static async executeJob(schedule: ClientSchedule): Promise<JobExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(
        `[SchedulingEngine] Executing ${schedule.job_type} for client ${schedule.client_id}`
      );

      let result: Record<string, any> = {};

      switch (schedule.job_type) {
        case "WEEKLY_SNAPSHOT":
          result = await this.executeWeeklySnapshot(schedule.client_id);
          break;
        case "MONTHLY_FULL_AUDIT":
          result = await this.executeMonthlyAudit(schedule.client_id);
          break;
        case "ANOMALY_CHECK":
          result = await this.executeAnomalyCheck(schedule.client_id);
          break;
      }

      const duration = Date.now() - startTime;

      // Update schedule
      await this.markScheduleCompleted(schedule.schedule_id, schedule.frequency);

      // Log success
      const executionResult: JobExecutionResult = {
        success: true,
        job_type: schedule.job_type,
        client_id: schedule.client_id,
        duration_ms: duration,
        result_summary: result,
      };

      await this.logExecution(schedule, "COMPLETED", executionResult);

      return executionResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const executionResult: JobExecutionResult = {
        success: false,
        job_type: schedule.job_type,
        client_id: schedule.client_id,
        duration_ms: duration,
        result_summary: {},
        error: errorMessage,
      };

      await this.logExecution(schedule, "FAILED", executionResult);

      return executionResult;
    }
  }

  /**
   * Execute weekly snapshot job
   */
  private static async executeWeeklySnapshot(
    clientId: string
  ): Promise<Record<string, any>> {
    // Import report engine dynamically to avoid circular deps
    const { ReportEngine } = await import("@/server/reportEngine");

    const supabase = await getSupabaseServer();

    // Get client profile
    const { data: client } = await supabase
      .from("seo_client_profiles")
      .select("domain, client_slug")
      .eq("client_id", clientId)
      .single();

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Generate snapshot audit
    const auditId = crypto.randomUUID();
    const engine = new ReportEngine({
      clientId,
      clientSlug: client.client_slug,
      auditId,
      auditType: "snapshot",
      formats: ["json"],
    });

    // Run minimal data collection for snapshot
    const result = await engine.generateReports(
      {
        auditId,
        clientId,
        auditType: "snapshot",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "success",
      },
      {} // DataSources will be fetched by engine
    );

    return {
      audit_id: auditId,
      health_score: result.healthScore,
      formats_generated: Object.keys(result.formats),
    };
  }

  /**
   * Execute monthly full audit job
   */
  private static async executeMonthlyAudit(
    clientId: string
  ): Promise<Record<string, any>> {
    const { ReportEngine } = await import("@/server/reportEngine");

    const supabase = await getSupabaseServer();

    // Get client profile
    const { data: client } = await supabase
      .from("seo_client_profiles")
      .select("domain, client_slug")
      .eq("client_id", clientId)
      .single();

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Generate full audit with all formats
    const auditId = crypto.randomUUID();
    const engine = new ReportEngine({
      clientId,
      clientSlug: client.client_slug,
      auditId,
      auditType: "full",
      formats: ["html", "csv", "json", "md", "pdf"],
      includeImages: true,
    });

    const result = await engine.generateReports(
      {
        auditId,
        clientId,
        auditType: "full",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "success",
      },
      {}
    );

    return {
      audit_id: auditId,
      health_score: result.healthScore,
      formats_generated: Object.keys(result.formats),
      files_created: Object.values(result.formats).filter(Boolean).length,
    };
  }

  /**
   * Execute anomaly check job
   */
  private static async executeAnomalyCheck(
    clientId: string
  ): Promise<Record<string, any>> {
    const { AnomalyDetector } = await import("./anomalyDetector");

    const detector = new AnomalyDetector();
    const anomalies = await detector.detectAnomalies(clientId);

    return {
      anomalies_detected: anomalies.length,
      anomalies,
      checked_at: new Date().toISOString(),
    };
  }
}

export default SchedulingEngine;
