/**
 * Alert Email Service - Phase 8 Week 23
 *
 * Sends email notifications for anomalies and scheduled reports.
 */

import { sendEmail } from "@/lib/email/email-service";
import { getSupabaseServer } from "@/lib/supabase";
import type { Anomaly } from "./anomalyDetector";
import type { JobExecutionResult } from "./schedulingEngine";

// =============================================================
// Types
// =============================================================

export type EmailType =
  | "ANOMALY_ALERT"
  | "WEEKLY_DIGEST"
  | "MONTHLY_REPORT"
  | "JOB_COMPLETED"
  | "JOB_FAILED";

export interface EmailLogEntry {
  log_id: string;
  email_type: EmailType;
  client_id: string;
  recipient: string;
  subject: string;
  sent_at: string;
  status: "SENT" | "FAILED" | "BOUNCED";
  error_message: string | null;
}

// =============================================================
// Alert Email Service Class
// =============================================================

export class AlertEmailService {
  /**
   * Send anomaly alert email
   */
  static async sendAnomalyAlert(
    anomaly: Anomaly,
    recipientEmail: string,
    clientName: string
  ): Promise<boolean> {
    const subject = `[${anomaly.severity}] SEO Anomaly Detected - ${clientName}`;

    const html = this.generateAnomalyAlertHTML(anomaly, clientName);
    const text = this.generateAnomalyAlertText(anomaly, clientName);

    try {
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
      });

      // Log the email
      await this.logEmail({
        email_type: "ANOMALY_ALERT",
        client_id: anomaly.client_id,
        recipient: recipientEmail,
        subject,
        status: result.success ? "SENT" : "FAILED",
        error_message: result.error || null,
      });

      return result.success;
    } catch (error) {
      console.error("[AlertEmailService] Failed to send anomaly alert:", error);
      return false;
    }
  }

  /**
   * Send weekly digest email
   */
  static async sendWeeklyDigest(
    clientId: string,
    recipientEmail: string,
    clientName: string,
    healthScore: number,
    changes: Record<string, any>
  ): Promise<boolean> {
    const subject = `Weekly SEO Digest - ${clientName}`;

    const html = this.generateWeeklyDigestHTML(clientName, healthScore, changes);
    const text = this.generateWeeklyDigestText(clientName, healthScore, changes);

    try {
      const result = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
      });

      await this.logEmail({
        email_type: "WEEKLY_DIGEST",
        client_id: clientId,
        recipient: recipientEmail,
        subject,
        status: result.success ? "SENT" : "FAILED",
        error_message: result.error || null,
      });

      return result.success;
    } catch (error) {
      console.error("[AlertEmailService] Failed to send weekly digest:", error);
      return false;
    }
  }

  /**
   * Send job completion email
   */
  static async sendJobCompletionEmail(
    result: JobExecutionResult,
    recipientEmail: string,
    clientName: string
  ): Promise<boolean> {
    const status = result.success ? "Completed" : "Failed";
    const subject = `SEO ${result.job_type.replace(/_/g, " ")} ${status} - ${clientName}`;

    const html = result.success
      ? this.generateJobSuccessHTML(result, clientName)
      : this.generateJobFailureHTML(result, clientName);

    const text = result.success
      ? this.generateJobSuccessText(result, clientName)
      : this.generateJobFailureText(result, clientName);

    try {
      const emailResult = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
      });

      await this.logEmail({
        email_type: result.success ? "JOB_COMPLETED" : "JOB_FAILED",
        client_id: result.client_id,
        recipient: recipientEmail,
        subject,
        status: emailResult.success ? "SENT" : "FAILED",
        error_message: emailResult.error || null,
      });

      return emailResult.success;
    } catch (error) {
      console.error("[AlertEmailService] Failed to send job email:", error);
      return false;
    }
  }

  /**
   * Generate anomaly alert HTML
   */
  private static generateAnomalyAlertHTML(
    anomaly: Anomaly,
    clientName: string
  ): string {
    const severityColors = {
      LOW: "#3B82F6",
      MEDIUM: "#F59E0B",
      HIGH: "#EF4444",
      CRITICAL: "#7C3AED",
    };

    const color = severityColors[anomaly.severity];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: ${color}; padding: 20px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">${anomaly.severity} Alert: ${anomaly.anomaly_type.replace(/_/g, " ")}</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${clientName}</p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">${anomaly.message}</p>

      <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #6b7280; text-transform: uppercase;">Metrics</h3>
        <div style="display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 12px; color: #6b7280;">Previous</div>
            <div style="font-size: 24px; font-weight: 600; color: #374151;">${anomaly.previous_value}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Current</div>
            <div style="font-size: 24px; font-weight: 600; color: ${anomaly.change_percent < 0 ? "#EF4444" : "#10B981"};">${anomaly.current_value}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Change</div>
            <div style="font-size: 24px; font-weight: 600; color: ${anomaly.change_percent < 0 ? "#EF4444" : "#10B981"};">${anomaly.change_percent.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">Recommendations</h3>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
        ${anomaly.recommendations.map((r) => `<li style="margin-bottom: 8px;">${r}</li>`).join("")}
      </ul>
    </div>

    <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This alert was generated automatically by Unite-Hub SEO Intelligence.
        <br>Detected at: ${new Date(anomaly.detected_at).toLocaleString()}
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate anomaly alert plain text
   */
  private static generateAnomalyAlertText(
    anomaly: Anomaly,
    clientName: string
  ): string {
    return `
${anomaly.severity} ALERT: ${anomaly.anomaly_type.replace(/_/g, " ")}
Client: ${clientName}

${anomaly.message}

Metrics:
- Previous: ${anomaly.previous_value}
- Current: ${anomaly.current_value}
- Change: ${anomaly.change_percent.toFixed(1)}%

Recommendations:
${anomaly.recommendations.map((r) => `- ${r}`).join("\n")}

Detected at: ${new Date(anomaly.detected_at).toLocaleString()}
`.trim();
  }

  /**
   * Generate weekly digest HTML
   */
  private static generateWeeklyDigestHTML(
    clientName: string,
    healthScore: number,
    changes: Record<string, any>
  ): string {
    const scoreColor =
      healthScore >= 80
        ? "#10B981"
        : healthScore >= 60
        ? "#F59E0B"
        : "#EF4444";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1f2937; padding: 20px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">Weekly SEO Digest</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${clientName}</p>
    </div>

    <div style="padding: 24px; text-align: center;">
      <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; border: 8px solid ${scoreColor}; line-height: 104px;">
        <span style="font-size: 36px; font-weight: 700; color: ${scoreColor};">${healthScore}</span>
      </div>
      <p style="margin: 12px 0 0; color: #6b7280;">Health Score</p>
    </div>

    <div style="padding: 0 24px 24px;">
      <h3 style="margin: 0 0 12px; font-size: 14px; color: #374151;">This Week's Changes</h3>
      <div style="background: #f9fafb; border-radius: 6px; padding: 16px;">
        ${
          changes.keywords_improved
            ? `<div style="margin-bottom: 8px;">Keywords Improved: <strong style="color: #10B981;">+${changes.keywords_improved}</strong></div>`
            : ""
        }
        ${
          changes.keywords_declined
            ? `<div style="margin-bottom: 8px;">Keywords Declined: <strong style="color: #EF4444;">-${changes.keywords_declined}</strong></div>`
            : ""
        }
        ${
          changes.backlinks_gained
            ? `<div style="margin-bottom: 8px;">New Backlinks: <strong style="color: #10B981;">+${changes.backlinks_gained}</strong></div>`
            : ""
        }
        ${
          changes.traffic_change
            ? `<div>Traffic Change: <strong style="color: ${changes.traffic_change >= 0 ? "#10B981" : "#EF4444"};">${changes.traffic_change >= 0 ? "+" : ""}${changes.traffic_change}%</strong></div>`
            : ""
        }
      </div>
    </div>

    <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This digest was generated automatically by Unite-Hub SEO Intelligence.
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate weekly digest plain text
   */
  private static generateWeeklyDigestText(
    clientName: string,
    healthScore: number,
    changes: Record<string, any>
  ): string {
    return `
Weekly SEO Digest - ${clientName}

Health Score: ${healthScore}/100

This Week's Changes:
${changes.keywords_improved ? `- Keywords Improved: +${changes.keywords_improved}` : ""}
${changes.keywords_declined ? `- Keywords Declined: -${changes.keywords_declined}` : ""}
${changes.backlinks_gained ? `- New Backlinks: +${changes.backlinks_gained}` : ""}
${changes.traffic_change ? `- Traffic Change: ${changes.traffic_change >= 0 ? "+" : ""}${changes.traffic_change}%` : ""}
`.trim();
  }

  /**
   * Generate job success HTML
   */
  private static generateJobSuccessHTML(
    result: JobExecutionResult,
    clientName: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    <div style="background: #10B981; padding: 20px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">Job Completed Successfully</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${result.job_type.replace(/_/g, " ")} - ${clientName}</p>
    </div>
    <div style="padding: 24px;">
      <p>Duration: ${(result.duration_ms / 1000).toFixed(1)}s</p>
      ${result.result_summary.health_score ? `<p>Health Score: ${result.result_summary.health_score}</p>` : ""}
      ${result.result_summary.audit_id ? `<p>Audit ID: ${result.result_summary.audit_id}</p>` : ""}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate job success plain text
   */
  private static generateJobSuccessText(
    result: JobExecutionResult,
    clientName: string
  ): string {
    return `
Job Completed Successfully
${result.job_type.replace(/_/g, " ")} - ${clientName}

Duration: ${(result.duration_ms / 1000).toFixed(1)}s
${result.result_summary.health_score ? `Health Score: ${result.result_summary.health_score}` : ""}
${result.result_summary.audit_id ? `Audit ID: ${result.result_summary.audit_id}` : ""}
`.trim();
  }

  /**
   * Generate job failure HTML
   */
  private static generateJobFailureHTML(
    result: JobExecutionResult,
    clientName: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    <div style="background: #EF4444; padding: 20px; color: white;">
      <h1 style="margin: 0; font-size: 20px;">Job Failed</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">${result.job_type.replace(/_/g, " ")} - ${clientName}</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #EF4444;">${result.error || "Unknown error"}</p>
      <p>Duration before failure: ${(result.duration_ms / 1000).toFixed(1)}s</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate job failure plain text
   */
  private static generateJobFailureText(
    result: JobExecutionResult,
    clientName: string
  ): string {
    return `
Job Failed
${result.job_type.replace(/_/g, " ")} - ${clientName}

Error: ${result.error || "Unknown error"}
Duration before failure: ${(result.duration_ms / 1000).toFixed(1)}s
`.trim();
  }

  /**
   * Log email to database
   */
  private static async logEmail(entry: Omit<EmailLogEntry, "log_id" | "sent_at">): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from("email_log").insert({
      log_id: crypto.randomUUID(),
      ...entry,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[AlertEmailService] Failed to log email:", error);
    }
  }

  /**
   * Get email history for a client
   */
  static async getEmailHistory(
    clientId: string,
    limit: number = 20
  ): Promise<EmailLogEntry[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("email_log")
      .select("*")
      .eq("client_id", clientId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get email history: ${error.message}`);
    }

    return data || [];
  }
}

export default AlertEmailService;
