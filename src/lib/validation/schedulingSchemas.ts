/**
 * Scheduling & Alert Validation Schemas - Phase 8 Week 23
 *
 * Zod schemas for scheduling engine and anomaly detection.
 */

import { z } from "zod";

// =============================================================
// Scheduling Schemas
// =============================================================

export const JobTypeSchema = z.enum([
  "WEEKLY_SNAPSHOT",
  "MONTHLY_FULL_AUDIT",
  "ANOMALY_CHECK",
]);

export type JobType = z.infer<typeof JobTypeSchema>;

export const FrequencySchema = z.enum([
  "DAILY",
  "WEEKLY",
  "FORTNIGHTLY",
  "MONTHLY",
]);

export type Frequency = z.infer<typeof FrequencySchema>;

export const JobStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "SKIPPED",
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ClientScheduleSchema = z.object({
  schedule_id: z.string().uuid(),
  client_id: z.string().uuid(),
  job_type: JobTypeSchema,
  frequency: FrequencySchema,
  enabled: z.boolean(),
  last_run_at: z.string().datetime().nullable(),
  next_run_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  client_consent: z.boolean(),
});

export type ClientSchedule = z.infer<typeof ClientScheduleSchema>;

export const ScheduleLogSchema = z.object({
  log_id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  client_id: z.string().uuid(),
  job_type: JobTypeSchema,
  status: JobStatusSchema,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
  duration_ms: z.number().nullable(),
  result_summary: z.record(z.any()),
  error_message: z.string().nullable(),
});

export type ScheduleLog = z.infer<typeof ScheduleLogSchema>;

export const CreateScheduleRequestSchema = z.object({
  client_id: z.string().uuid(),
  job_type: JobTypeSchema,
  frequency: FrequencySchema,
  client_consent: z.boolean().optional().default(false),
});

// =============================================================
// Anomaly Schemas
// =============================================================

export const AnomalyTypeSchema = z.enum([
  "HEALTH_SCORE_DROP",
  "HEALTH_SCORE_SPIKE",
  "TRAFFIC_DROP",
  "TRAFFIC_SPIKE",
  "BACKLINKS_LOST",
  "BACKLINKS_SPIKE",
  "POSITION_DROP",
  "TOXIC_BACKLINKS",
  "CRAWL_ERRORS",
  "INDEX_DROP",
]);

export type AnomalyType = z.infer<typeof AnomalyTypeSchema>;

export const SeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export type Severity = z.infer<typeof SeveritySchema>;

export const AnomalySchema = z.object({
  anomaly_id: z.string().uuid(),
  client_id: z.string().uuid(),
  anomaly_type: AnomalyTypeSchema,
  severity: SeveritySchema,
  detected_at: z.string().datetime(),
  metric_name: z.string(),
  previous_value: z.number(),
  current_value: z.number(),
  change_percent: z.number(),
  threshold_exceeded: z.number(),
  message: z.string(),
  recommendations: z.array(z.string()),
  acknowledged: z.boolean(),
});

export type Anomaly = z.infer<typeof AnomalySchema>;

export const AnomalyThresholdsSchema = z.object({
  health_score_drop: z.number().min(0).max(100).default(15),
  health_score_spike: z.number().min(0).max(100).default(25),
  traffic_drop: z.number().min(0).max(100).default(30),
  traffic_spike: z.number().min(0).max(100).default(50),
  backlinks_lost_percent: z.number().min(0).max(100).default(20),
  backlinks_spike_percent: z.number().min(0).max(200).default(100),
  position_drop: z.number().min(0).max(100).default(5),
  toxic_score_threshold: z.number().min(0).max(100).default(30),
  crawl_errors_threshold: z.number().min(0).default(10),
  index_drop_percent: z.number().min(0).max(100).default(20),
});

export type AnomalyThresholds = z.infer<typeof AnomalyThresholdsSchema>;

// =============================================================
// Email Schemas
// =============================================================

export const EmailTypeSchema = z.enum([
  "ANOMALY_ALERT",
  "WEEKLY_DIGEST",
  "MONTHLY_REPORT",
  "JOB_COMPLETED",
  "JOB_FAILED",
]);

export type EmailType = z.infer<typeof EmailTypeSchema>;

export const EmailLogEntrySchema = z.object({
  log_id: z.string().uuid(),
  email_type: EmailTypeSchema,
  client_id: z.string().uuid(),
  recipient: z.string().email(),
  subject: z.string(),
  sent_at: z.string().datetime(),
  status: z.enum(["SENT", "FAILED", "BOUNCED"]),
  error_message: z.string().nullable(),
});

export type EmailLogEntry = z.infer<typeof EmailLogEntrySchema>;

// =============================================================
// API Request/Response Schemas
// =============================================================

export const GetSchedulesRequestSchema = z.object({
  client_id: z.string().uuid().optional(),
  enabled: z.boolean().optional(),
});

export const AcknowledgeAnomalyRequestSchema = z.object({
  anomaly_id: z.string().uuid(),
});

export const UpdateThresholdsRequestSchema = z.object({
  client_id: z.string().uuid(),
  thresholds: AnomalyThresholdsSchema.partial(),
});

export const CronExecutionResultSchema = z.object({
  message: z.string(),
  executed: z.number(),
  successful: z.number().optional(),
  failed: z.number().optional(),
  results: z.array(
    z.object({
      client_id: z.string().uuid(),
      job_type: JobTypeSchema,
      success: z.boolean(),
      duration_ms: z.number(),
      error: z.string().optional(),
    })
  ).optional(),
  timestamp: z.string().datetime(),
});

export type CronExecutionResult = z.infer<typeof CronExecutionResultSchema>;
