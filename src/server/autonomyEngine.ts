/**
 * Autonomy Engine
 * Phase 6: Autonomous Operations Engine
 *
 * Core scheduler and workflow engine for zero-staff autonomous operations:
 * - Signup tier triggers (automatic first audit)
 * - Weekly snapshot generation and delivery
 * - Daily health checks
 * - Post-audit recommendations
 * - Addon task execution
 * - Credential rotation scheduling
 * - Error recovery and retry logic
 *
 * Technologies:
 * - BullMQ (Redis-backed task queues)
 * - Vercel Cron (scheduled triggers)
 * - Rate-limited execution (prevents API abuse)
 * - Priority queuing (enterprise > pro > starter > free)
 */

import { Queue, Worker, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { supabaseAdmin } from "@/lib/supabase";
import AuditEngine from "./auditEngine";
import TierLogic from "./tierLogic";
import ClientDataManager from "./clientDataManager";
import GeoTargeting from "@/lib/seo/geoTargeting";
import type { AuditTier, AuditConfig } from "@/lib/seo/auditTypes";

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

// Task types
export type TaskType =
  | "signup_audit"
  | "weekly_snapshot"
  | "daily_healthcheck"
  | "addon_activation"
  | "credential_rotation"
  | "error_recovery";

export interface TaskPayload {
  taskId: string;
  organizationId: string;
  seoProfileId: string;
  tier: AuditTier;
  type: TaskType;
  metadata?: any;
  retryCount?: number;
}

export interface AutomationTrigger {
  type: "signup" | "addon_purchase" | "schedule" | "manual";
  tier: AuditTier;
  organizationId: string;
  seoProfileId: string;
  metadata?: any;
}

// Queue configurations
const QUEUE_CONFIG = {
  free: { priority: 4, rateLimit: { max: 10, duration: 3600000 } }, // 10/hour
  starter: { priority: 3, rateLimit: { max: 20, duration: 3600000 } }, // 20/hour
  pro: { priority: 2, rateLimit: { max: 50, duration: 3600000 } }, // 50/hour
  enterprise: { priority: 1, rateLimit: { max: 100, duration: 3600000 } }, // 100/hour
};

export class AutonomyEngine {
  private auditQueue: Queue;
  private snapshotQueue: Queue;
  private healthcheckQueue: Queue;
  private queueEvents: QueueEvents;

  constructor() {
    // Initialize queues
    this.auditQueue = new Queue("audit-queue", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 86400, // 24 hours
        },
        removeOnFail: {
          count: 500,
          age: 604800, // 7 days
        },
      },
    });

    this.snapshotQueue = new Queue("snapshot-queue", {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 10000,
        },
      },
    });

    this.healthcheckQueue = new Queue("healthcheck-queue", {
      connection,
      defaultJobOptions: {
        attempts: 1, // Health checks don't retry
      },
    });

    this.queueEvents = new QueueEvents("audit-queue", { connection });

    // Initialize workers
    this.initializeWorkers();
  }

  /**
   * Initialize BullMQ workers for processing tasks
   */
  private initializeWorkers(): void {
    // Audit worker
    new Worker(
      "audit-queue",
      async (job) => {
        const payload: TaskPayload = job.data;
        console.log(`[AutonomyEngine] Processing audit task: ${payload.taskId}`);

        try {
          const config = await TierLogic.buildAuditConfig(payload.seoProfileId, payload.organizationId);

          if (!config) {
            throw new Error("Failed to build audit configuration");
          }

          const engine = new AuditEngine();
          const result = await engine.runAudit(config);

          // Post-audit actions
          await this.postAuditActions(result);

          return { success: true, auditId: result.id, healthScore: result.healthScore };
        } catch (error) {
          console.error("[AutonomyEngine] Audit task failed:", error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5, // Process 5 audits concurrently
        limiter: {
          max: 10,
          duration: 60000, // 10 audits per minute
        },
      }
    );

    // Snapshot worker
    new Worker(
      "snapshot-queue",
      async (job) => {
        const payload: TaskPayload = job.data;
        console.log(`[AutonomyEngine] Processing snapshot task: ${payload.taskId}`);

        try {
          // TODO: Implement snapshot generation
          // 1. Fetch latest audit
          // 2. Generate plain-English report
          // 3. Send email via SendGrid
          // 4. Log delivery

          return { success: true };
        } catch (error) {
          console.error("[AutonomyEngine] Snapshot task failed:", error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 10, // Snapshots are lightweight
      }
    );

    // Healthcheck worker
    new Worker(
      "healthcheck-queue",
      async (job) => {
        const payload: TaskPayload = job.data;
        console.log(`[AutonomyEngine] Processing healthcheck task: ${payload.taskId}`);

        try {
          // TODO: Implement daily health check
          // 1. Check API connectivity (GSC, Bing, Brave, DataForSEO)
          // 2. Verify credential validity
          // 3. Check queue health
          // 4. Alert staff if critical issues

          return { success: true };
        } catch (error) {
          console.error("[AutonomyEngine] Healthcheck task failed:", error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 1, // Sequential health checks
      }
    );
  }

  /**
   * Trigger automation based on event
   */
  async trigger(trigger: AutomationTrigger): Promise<{ success: boolean; taskIds?: string[]; error?: string }> {
    try {
      console.log(`[AutonomyEngine] Trigger: ${trigger.type} for ${trigger.tier} tier`);

      const taskIds: string[] = [];

      switch (trigger.type) {
        case "signup":
          taskIds.push(...(await this.handleSignupTrigger(trigger)));
          break;

        case "addon_purchase":
          taskIds.push(...(await this.handleAddonPurchaseTrigger(trigger)));
          break;

        case "schedule":
          taskIds.push(...(await this.handleScheduleTrigger(trigger)));
          break;

        case "manual":
          taskIds.push(...(await this.handleManualTrigger(trigger)));
          break;
      }

      return { success: true, taskIds };
    } catch (error) {
      console.error("[AutonomyEngine] Trigger failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Trigger failed",
      };
    }
  }

  /**
   * Handle signup trigger
   */
  private async handleSignupTrigger(trigger: AutomationTrigger): Promise<string[]> {
    const taskIds: string[] = [];

    // Queue initial audit
    const auditTaskId = await this.queueAudit(trigger.organizationId, trigger.seoProfileId, trigger.tier);
    taskIds.push(auditTaskId);

    // Schedule weekly snapshots based on tier
    if (trigger.tier !== "free") {
      const snapshotTaskId = await this.scheduleWeeklySnapshot(
        trigger.organizationId,
        trigger.seoProfileId,
        trigger.tier
      );
      taskIds.push(snapshotTaskId);
    }

    return taskIds;
  }

  /**
   * Handle addon purchase trigger
   */
  private async handleAddonPurchaseTrigger(trigger: AutomationTrigger): Promise<string[]> {
    const taskIds: string[] = [];

    // Upgrade audit configuration and run new audit
    const auditTaskId = await this.queueAudit(trigger.organizationId, trigger.seoProfileId, trigger.tier);
    taskIds.push(auditTaskId);

    // Adjust queue priorities
    await this.adjustQueuePriority(trigger.organizationId, trigger.tier);

    return taskIds;
  }

  /**
   * Handle scheduled trigger (cron jobs)
   */
  private async handleScheduleTrigger(trigger: AutomationTrigger): Promise<string[]> {
    const taskIds: string[] = [];

    // This is called by Vercel Cron or BullMQ scheduled jobs
    // Fetch all profiles that need snapshots today

    const { data: profiles, error } = await supabaseAdmin
      .from("seo_profiles")
      .select("*, subscriptions(tier)")
      .eq("snapshot_enabled", true);

    if (error || !profiles) {
      console.error("[AutonomyEngine] Failed to fetch profiles for scheduled snapshot");
      return taskIds;
    }

    for (const profile of profiles) {
      const tier = (profile.subscriptions?.tier as AuditTier) || "free";

      // Check if snapshot is due based on tier frequency
      const isDue = await this.isSnapshotDue(profile.id, tier);

      if (isDue) {
        const snapshotTaskId = await this.queueSnapshot(profile.organization_id, profile.id, tier);
        taskIds.push(snapshotTaskId);
      }
    }

    return taskIds;
  }

  /**
   * Handle manual trigger
   */
  private async handleManualTrigger(trigger: AutomationTrigger): Promise<string[]> {
    const taskIds: string[] = [];

    // Check if user can run audit
    const eligibility = await TierLogic.canRunAudit(trigger.seoProfileId);

    if (!eligibility.allowed) {
      throw new Error(`Audit not allowed: ${eligibility.reason}`);
    }

    // Queue audit with high priority
    const auditTaskId = await this.queueAudit(trigger.organizationId, trigger.seoProfileId, trigger.tier, 1);
    taskIds.push(auditTaskId);

    return taskIds;
  }

  /**
   * Queue an audit task
   */
  async queueAudit(
    organizationId: string,
    seoProfileId: string,
    tier: AuditTier,
    priority?: number
  ): Promise<string> {
    const taskId = `audit-${seoProfileId}-${Date.now()}`;
    const config = QUEUE_CONFIG[tier];

    const payload: TaskPayload = {
      taskId,
      organizationId,
      seoProfileId,
      tier,
      type: "signup_audit",
    };

    await this.auditQueue.add("audit", payload, {
      priority: priority || config.priority,
      jobId: taskId,
    });

    console.log(`[AutonomyEngine] Queued audit: ${taskId} (priority: ${priority || config.priority})`);

    return taskId;
  }

  /**
   * Queue a snapshot task
   */
  async queueSnapshot(organizationId: string, seoProfileId: string, tier: AuditTier): Promise<string> {
    const taskId = `snapshot-${seoProfileId}-${Date.now()}`;

    const payload: TaskPayload = {
      taskId,
      organizationId,
      seoProfileId,
      tier,
      type: "weekly_snapshot",
    };

    await this.snapshotQueue.add("snapshot", payload, {
      jobId: taskId,
    });

    console.log(`[AutonomyEngine] Queued snapshot: ${taskId}`);

    return taskId;
  }

  /**
   * Schedule weekly snapshot (recurring)
   */
  async scheduleWeeklySnapshot(organizationId: string, seoProfileId: string, tier: AuditTier): Promise<string> {
    const frequency = TierLogic.getTierConfig(tier).frequency;

    // Convert frequency to cron pattern
    let cronPattern: string;
    switch (frequency) {
      case "daily":
        cronPattern = "0 8 * * *"; // 8 AM daily
        break;
      case "twice_weekly":
        cronPattern = "0 8 * * 1,4"; // Monday and Thursday
        break;
      case "weekly":
        cronPattern = "0 8 * * 1"; // Monday
        break;
      case "every_7_days":
        cronPattern = "0 8 * * 1"; // Monday (simplified)
        break;
    }

    const taskId = `snapshot-recurring-${seoProfileId}`;

    await this.snapshotQueue.add(
      "snapshot",
      {
        taskId,
        organizationId,
        seoProfileId,
        tier,
        type: "weekly_snapshot",
      },
      {
        repeat: {
          pattern: cronPattern,
        },
        jobId: taskId,
      }
    );

    console.log(`[AutonomyEngine] Scheduled weekly snapshot: ${taskId} (${cronPattern})`);

    return taskId;
  }

  /**
   * Check if snapshot is due
   */
  private async isSnapshotDue(seoProfileId: string, tier: AuditTier): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from("seo_audit_snapshots")
      .select("timestamp")
      .eq("seo_profile_id", seoProfileId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return true; // No previous snapshot, due immediately
    }

    const lastSnapshotTime = new Date(data.timestamp);
    const now = new Date();
    const hoursSinceLastSnapshot = (now.getTime() - lastSnapshotTime.getTime()) / (1000 * 60 * 60);

    const tierConfig = TierLogic.getTierConfig(tier);

    switch (tierConfig.frequency) {
      case "daily":
        return hoursSinceLastSnapshot >= 24;
      case "twice_weekly":
        return hoursSinceLastSnapshot >= 84; // 3.5 days
      case "weekly":
      case "every_7_days":
        return hoursSinceLastSnapshot >= 168; // 7 days
      default:
        return false;
    }
  }

  /**
   * Post-audit actions (send recommendations, update health score, etc.)
   */
  private async postAuditActions(auditResult: any): Promise<void> {
    try {
      // Update SEO profile with latest health score
      await supabaseAdmin
        .from("seo_profiles")
        .update({
          last_audit_health_score: auditResult.healthScore,
          last_audit_at: auditResult.timestamp,
        })
        .eq("id", auditResult.seoProfileId);

      // Queue snapshot generation if health score is critical
      if (auditResult.healthScore < 40) {
        console.log("[AutonomyEngine] Critical health score detected, queueing immediate snapshot");
        // TODO: Send urgent alert email
      }
    } catch (error) {
      console.error("[AutonomyEngine] Post-audit actions failed:", error);
    }
  }

  /**
   * Adjust queue priority based on tier upgrade
   */
  private async adjustQueuePriority(organizationId: string, newTier: AuditTier): Promise<void> {
    // TODO: Update priority for pending jobs for this organization
    console.log(`[AutonomyEngine] Adjusting queue priority for ${organizationId} to ${newTier}`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const auditCounts = await this.auditQueue.getJobCounts("waiting", "active", "completed", "failed");
    const snapshotCounts = await this.snapshotQueue.getJobCounts("waiting", "active", "completed", "failed");
    const healthcheckCounts = await this.healthcheckQueue.getJobCounts("waiting", "active", "completed", "failed");

    return {
      audit: auditCounts,
      snapshot: snapshotCounts,
      healthcheck: healthcheckCounts,
    };
  }

  /**
   * Clear failed jobs (maintenance)
   */
  async clearFailedJobs(): Promise<void> {
    await this.auditQueue.clean(0, 1000, "failed");
    await this.snapshotQueue.clean(0, 1000, "failed");
    await this.healthcheckQueue.clean(0, 1000, "failed");

    console.log("[AutonomyEngine] Cleared failed jobs");
  }
}

export default AutonomyEngine;
