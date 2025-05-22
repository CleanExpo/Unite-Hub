import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if all required tables exist
    const requiredTables = ["profiles", "projects", "project_members", "tasks", "comments", "task_attachments"]

    const missingTables = []
    const existingTables = []

    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select("count").limit(1)

        if (error) {
          missingTables.push(table)
        } else {
          existingTables.push(table)
        }
      } catch (error) {
        missingTables.push(table)
      }
    }

    // Check if the current user has a profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const hasProfile = !profileError && profile

    // Check if the database stats function exists
    let hasStatsFunction = false
    try {
      const { data, error } = await supabase.rpc("get_database_stats")
      hasStatsFunction = !error
    } catch (error) {
      hasStatsFunction = false
    }

    // Check if the exec_sql function exists
    let hasExecSqlFunction = false
    try {
      // We can't directly test this without executing SQL, so we'll just check if we get a specific error
      const { error } = await supabase.rpc("exec_sql", { sql: "SELECT 1" })
      hasExecSqlFunction =
        error?.message?.includes("permission denied") || error?.message?.includes("function exec_sql")
    } catch (error) {
      hasExecSqlFunction = false
    }

    // Determine the database status
    const allTablesExist = missingTables.length === 0
    const databaseStatus = allTablesExist && hasProfile ? "complete" : allTablesExist ? "partial" : "missing"

    return NextResponse.json({
      status: databaseStatus,
      hasProfile,
      hasStatsFunction,
      hasExecSqlFunction,
      existingTables,
      missingTables,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Database verification error:", error)
    return NextResponse.json(
      {
        error: "Failed to verify database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
