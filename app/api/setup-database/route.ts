import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin (you might want to implement this check)
    const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profileData || profileData.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Read SQL files
    const schemaSQL = fs.readFileSync(path.join(process.cwd(), "database/schema.sql"), "utf8")
    const rlsPoliciesSQL = fs.readFileSync(path.join(process.cwd(), "database/rls_policies.sql"), "utf8")
    const authTriggersSQL = fs.readFileSync(path.join(process.cwd(), "database/auth_triggers.sql"), "utf8")

    // Execute schema SQL
    const { error: schemaError } = await supabase.rpc("exec_sql", { sql: schemaSQL })
    if (schemaError) {
      return NextResponse.json({ error: `Schema error: ${schemaError.message}` }, { status: 500 })
    }

    // Execute RLS policies SQL
    const { error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsPoliciesSQL })
    if (rlsError) {
      return NextResponse.json({ error: `RLS error: ${rlsError.message}` }, { status: 500 })
    }

    // Execute auth triggers SQL
    const { error: triggersError } = await supabase.rpc("exec_sql", { sql: authTriggersSQL })
    if (triggersError) {
      return NextResponse.json({ error: `Triggers error: ${triggersError.message}` }, { status: 500 })
    }

    // Update the current user's profile to be an admin
    const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: `Profile update error: ${updateError.message}` }, { status: 500 })
    }

    // Read and execute seed data SQL (replace the UUID with the current user's ID)
    let seedDataSQL = fs.readFileSync(path.join(process.cwd(), "database/seed_data.sql"), "utf8")
    seedDataSQL = seedDataSQL.replace(/00000000-0000-0000-0000-000000000000/g, user.id)

    const { error: seedError } = await supabase.rpc("exec_sql", { sql: seedDataSQL })
    if (seedError) {
      return NextResponse.json({ error: `Seed data error: ${seedError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error: any) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        error: "Failed to set up database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
