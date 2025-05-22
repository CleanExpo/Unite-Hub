import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { invalidateErrorStatisticsCache } from "@/lib/cache-utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const errorId = Number.parseInt(params.id)
    const body = await request.json()
    const { assignedTo, assignedBy, notes } = body

    // Validate required fields
    if (!assignedTo || !assignedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if error exists
    const { data: errorData, error: errorCheckError } = await supabase
      .from("error_logs")
      .select("id")
      .eq("id", errorId)
      .single()

    if (errorCheckError || !errorData) {
      return NextResponse.json({ error: "Error not found" }, { status: 404 })
    }

    // Create assignment record
    const { data, error } = await supabase
      .from("error_assignments")
      .insert({
        error_id: errorId,
        assigned_by: assignedBy,
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
        notes: notes || null,
        status: "pending",
      })
      .select()

    if (error) {
      console.error("Error creating assignment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache
    await invalidateErrorStatisticsCache()

    // Send email notification
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/errors/assignments/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "assignment",
            errorId,
            assignedToId: assignedTo,
            assignedById: assignedBy,
            notes,
          }),
        },
      )
    } catch (notifyError) {
      console.error("Error sending assignment notification:", notifyError)
      // Continue even if notification fails
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in assign endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const errorId = Number.parseInt(params.id)
    const body = await request.json()
    const { status, notes, updatedBy } = body

    // Validate required fields
    if (!status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current assignment status
    const { data: currentAssignment, error: currentAssignmentError } = await supabase
      .from("error_logs")
      .select("assigned_to, assignment_status")
      .eq("id", errorId)
      .single()

    if (currentAssignmentError || !currentAssignment || !currentAssignment.assigned_to) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    const previousStatus = currentAssignment.assignment_status || "pending"
    const assignedToId = currentAssignment.assigned_to

    // Update the most recent assignment for this error
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("error_assignments")
      .select("id")
      .eq("error_id", errorId)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .single()

    if (assignmentError || !assignmentData) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Update assignment status
    const { data, error } = await supabase
      .from("error_assignments")
      .update({
        status,
        notes: notes || undefined,
      })
      .eq("id", assignmentData.id)
      .select()

    if (error) {
      console.error("Error updating assignment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate cache
    await invalidateErrorStatisticsCache()

    // Send status change notification if status has changed
    if (status !== previousStatus) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL}/api/errors/assignments/notify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "status_change",
              errorId,
              assignedToId,
              assignedById: updatedBy,
              previousStatus,
              newStatus: status,
              notes,
            }),
          },
        )
      } catch (notifyError) {
        console.error("Error sending status change notification:", notifyError)
        // Continue even if notification fails
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update assignment endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
