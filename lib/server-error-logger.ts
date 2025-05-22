// Update the import path to the correct location
import { createClient } from "@/lib/supabase/server"

export type ErrorSeverity = "critical" | "error" | "warning" | "info" | "debug"
export type ErrorCategory =
  | "auth"
  | "db"
  | "api"
  | "network"
  | "validation"
  | "business"
  | "external"
  | "security"
  | "performance"
  | "system"
  | "ui"
  | "pdf"

interface LogErrorOptions {
  message: string
  severity: ErrorSeverity
  category: ErrorCategory
  stackTrace?: string
  context?: Record<string, any>
  url?: string
  ipAddress?: string
  userAgent?: string
}

export async function logServerError({
  message,
  severity,
  category,
  stackTrace,
  context,
  url,
  ipAddress,
  userAgent,
}: LogErrorOptions) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("error_logs")
      .insert({
        message,
        severity,
        category,
        stack_trace: stackTrace,
        context,
        user_agent: userAgent,
        ip_address: ipAddress,
        url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved: false,
      })
      .select()

    if (error) {
      console.error("Failed to log server error:", error)
      return { success: false }
    }

    const timestamp = new Date().toISOString()
    const errorId = data?.[0]?.id

    // If it's a critical error, send notifications
    if (severity === "critical" && errorId) {
      try {
        // Send email notification
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/errors/notify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            errorId,
            message,
            severity,
            category,
            stackTrace,
            context,
            url,
            timestamp,
          }),
        })
      } catch (notifyError) {
        console.error("Failed to send server notification:", notifyError)
      }
    }

    return { success: true, errorId }
  } catch (err) {
    console.error("Error in logServerError function:", err)
    return { success: false }
  }
}
