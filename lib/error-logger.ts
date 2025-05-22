// Update the import path to the correct location
import { createClient } from "@/lib/supabase/client"
import { invalidateErrorStatisticsCache } from "@/lib/cache-utils"

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
}

export async function logError({ message, severity, category, stackTrace, context, url }: LogErrorOptions) {
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
        user_agent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
        ip_address: null, // This would be set server-side
        url: url || (typeof window !== "undefined" ? window.location.pathname : undefined),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        resolved: false,
      })
      .select()

    if (error) {
      console.error("Failed to log error:", error)
      return { success: false }
    }

    const timestamp = new Date().toISOString()
    const errorId = data?.[0]?.id

    // Invalidate the error statistics cache
    await invalidateErrorStatisticsCache()

    // If it's a critical error, notify the server to broadcast to all connected clients
    if (severity === "critical" && errorId) {
      try {
        // Send WebSocket notification
        await fetch("/api/errors/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            errorId,
            message,
            severity,
            category,
            timestamp,
          }),
        })

        // Send email notification
        await fetch("/api/errors/notify-email", {
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
        console.error("Failed to send notification:", notifyError)
      }
    }

    return { success: true, errorId }
  } catch (err) {
    console.error("Error in logError function:", err)
    return { success: false }
  }
}

export async function resolveError(id: number, notes: string) {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("error_logs")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    // Invalidate the error statistics cache
    await invalidateErrorStatisticsCache()

    return { success: !error }
  } catch (err) {
    console.error("Error in resolveError function:", err)
    return { success: false }
  }
}
