import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { generateAssignmentNotificationEmail } from "@/lib/email-templates/assignment-notification"
import { generateStatusChangeNotificationEmail } from "@/lib/email-templates/status-change-notification"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, errorId, assignedToId, assignedById, previousStatus, newStatus, notes } = body

    // Validate required fields
    if (!type || !errorId || !assignedToId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Get error details
    const { data: errorData, error: errorError } = await supabase
      .from("error_logs")
      .select("*")
      .eq("id", errorId)
      .single()

    if (errorError || !errorData) {
      console.error("Error fetching error details:", errorError)
      return NextResponse.json({ error: "Error not found" }, { status: 404 })
    }

    // Get assignee details
    const { data: assigneeData, error: assigneeError } = await supabase
      .from("user_profiles")
      .select("user_id, first_name, last_name")
      .eq("user_id", assignedToId)
      .single()

    if (assigneeError || !assigneeData) {
      console.error("Error fetching assignee details:", assigneeError)
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 })
    }

    // Get assignee email
    const { data: assigneeUserData, error: assigneeUserError } = await supabase
      .from("auth.users")
      .select("email")
      .eq("id", assignedToId)
      .single()

    if (assigneeUserError || !assigneeUserData || !assigneeUserData.email) {
      console.error("Error fetching assignee email:", assigneeUserError)
      return NextResponse.json({ error: "Assignee email not found" }, { status: 404 })
    }

    // Get assigner details if provided
    let assignerData = null
    let assignerUserData = null

    if (assignedById) {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .eq("user_id", assignedById)
        .single()

      if (!error && data) {
        assignerData = data

        // Get assigner email
        const { data: userData, error: userError } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", assignedById)
          .single()

        if (!userError && userData && userData.email) {
          assignerUserData = userData
        }
      }
    }

    // Prepare email data
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const timestamp = new Date().toISOString()

    let emailHtml = ""
    let emailText = ""
    let emailSubject = ""

    if (type === "assignment") {
      // Generate assignment notification email
      const { html, text } = generateAssignmentNotificationEmail({
        errorId,
        errorMessage: errorData.message,
        errorSeverity: errorData.severity,
        errorCategory: errorData.category,
        assignedBy: {
          name: assignerData ? `${assignerData.first_name} ${assignerData.last_name}` : "System",
          email: assignerUserData?.email || "system@example.com",
        },
        assignedTo: {
          name: `${assigneeData.first_name} ${assigneeData.last_name}`,
          email: assigneeUserData.email,
        },
        notes,
        timestamp,
        appUrl,
      })

      emailHtml = html
      emailText = text
      emailSubject = `Error Assignment: ${errorData.severity.toUpperCase()} - ${errorData.category}`
    } else if (type === "status_change") {
      // Validate status change fields
      if (!previousStatus || !newStatus) {
        return NextResponse.json({ error: "Missing status change fields" }, { status: 400 })
      }

      // Generate status change notification email
      const { html, text } = generateStatusChangeNotificationEmail({
        errorId,
        errorMessage: errorData.message,
        errorSeverity: errorData.severity,
        errorCategory: errorData.category,
        assignedTo: {
          name: `${assigneeData.first_name} ${assigneeData.last_name}`,
          email: assigneeUserData.email,
        },
        updatedBy: assignerData
          ? {
              name: `${assignerData.first_name} ${assignerData.last_name}`,
              email: assignerUserData?.email || "",
            }
          : undefined,
        previousStatus,
        newStatus,
        notes,
        timestamp,
        appUrl,
      })

      emailHtml = html
      emailText = text
      emailSubject = `Assignment Status Update: ${newStatus.toUpperCase()}`
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    // Send email
    const result = await sendEmail({
      to: assigneeUserData.email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    if (!result.success) {
      console.error("Error sending email notification:", result.error)
      return NextResponse.json({ error: "Failed to send email notification" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing assignment notification:", error)
    return NextResponse.json({ error: "Failed to process notification" }, { status: 500 })
  }
}
