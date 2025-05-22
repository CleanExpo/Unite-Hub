// Update the import path to the correct location
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { generateErrorNotificationEmail } from "@/lib/email-templates/error-notification"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { errorId, message, severity, category, stackTrace, context, url, timestamp } = body

    // Validate required fields
    if (!errorId || !message || !severity || !category || !timestamp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Only send emails for critical errors
    if (severity !== "critical") {
      return NextResponse.json({ success: true, message: "Not a critical error, no email sent" })
    }

    // Get admin users with email notifications enabled
    const supabase = createClient()
    const { data: adminSettings, error: settingsError } = await supabase
      .from("admin_notification_settings")
      .select("user_id")
      .eq("email_notifications", true)
      .eq("email_critical_only", true)

    if (settingsError) {
      console.error("Error fetching admin notification settings:", settingsError)
      return NextResponse.json({ error: "Failed to fetch admin notification settings" }, { status: 500 })
    }

    if (!adminSettings || adminSettings.length === 0) {
      return NextResponse.json({ success: true, message: "No admins with email notifications enabled" })
    }

    // Get admin emails
    const userIds = adminSettings.map((setting) => setting.user_id)
    const { data: adminUsers, error: usersError } = await supabase.from("auth.users").select("email").in("id", userIds)

    if (usersError) {
      console.error("Error fetching admin users:", usersError)
      return NextResponse.json({ error: "Failed to fetch admin users" }, { status: 500 })
    }

    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No admin emails found" })
    }

    const adminEmails = adminUsers.map((user) => user.email).filter(Boolean) as string[]

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: true, message: "No valid admin emails found" })
    }

    // Generate email content
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const { html, text } = generateErrorNotificationEmail({
      errorId,
      message,
      severity,
      category,
      timestamp,
      stackTrace,
      context,
      url,
      appUrl,
    })

    // Send email to all admins
    const result = await sendEmail({
      to: adminEmails,
      subject: `[CRITICAL ERROR] ${message}`,
      html,
      text,
    })

    if (!result.success) {
      console.error("Error sending email notification:", result.error)
      return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailsSent: adminEmails.length })
  } catch (error) {
    console.error("Error processing email notification:", error)
    return NextResponse.json({ error: "Failed to process email notification" }, { status: 500 })
  }
}
