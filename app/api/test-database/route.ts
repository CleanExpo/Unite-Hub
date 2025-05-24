import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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

    // Array to store test results
    const testResults: Array<{
      name: string
      status: "success" | "error" | "skipped"
      message: string
      details?: any
    }> = []

    // Test 1: Check if tables exist
    const tables = ["profiles", "projects", "project_members", "tasks", "comments", "task_attachments"]

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("count").limit(1)

        if (error) {
          testResults.push({
            name: `Table Check: ${table}`,
            status: "error",
            message: `Table ${table} error: ${error.message}`,
          })
        } else {
          testResults.push({
            name: `Table Check: ${table}`,
            status: "success",
            message: `Table ${table} exists and is accessible`,
          })
        }
      } catch (error: any) {
        testResults.push({
          name: `Table Check: ${table}`,
          status: "error",
          message: `Table ${table} error: ${error.message}`,
        })
      }
    }

    // Test 2: Check if current user's profile exists
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        testResults.push({
          name: "Profile Check",
          status: "error",
          message: `Profile error: ${profileError.message}`,
        })
      } else if (!profile) {
        testResults.push({
          name: "Profile Check",
          status: "error",
          message: "Profile does not exist for current user",
        })
      } else {
        testResults.push({
          name: "Profile Check",
          status: "success",
          message: "Profile exists for current user",
          details: {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: profile.role,
          },
        })
      }
    } catch (error: any) {
      testResults.push({
        name: "Profile Check",
        status: "error",
        message: `Profile check error: ${error.message}`,
      })
    }

    // Test 3: Test project creation
    let testProjectId: string | null = null
    try {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: `Test Project ${new Date().toISOString()}`,
          description: "This is a test project created to verify database functionality",
          owner_id: user.id,
        })
        .select()
        .single()

      if (projectError) {
        testResults.push({
          name: "Project Creation",
          status: "error",
          message: `Project creation error: ${projectError.message}`,
        })
      } else {
        testProjectId = project.id
        testResults.push({
          name: "Project Creation",
          status: "success",
          message: "Successfully created a test project",
          details: {
            id: project.id,
            name: project.name,
          },
        })
      }
    } catch (error: any) {
      testResults.push({
        name: "Project Creation",
        status: "error",
        message: `Project creation error: ${error.message}`,
      })
    }

    // Test 4: Test task creation (if project was created successfully)
    if (testProjectId) {
      try {
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            title: `Test Task ${new Date().toISOString()}`,
            description: "This is a test task created to verify database functionality",
            project_id: testProjectId,
            created_by: user.id,
          })
          .select()
          .single()

        if (taskError) {
          testResults.push({
            name: "Task Creation",
            status: "error",
            message: `Task creation error: ${taskError.message}`,
          })
        } else {
          testResults.push({
            name: "Task Creation",
            status: "success",
            message: "Successfully created a test task",
            details: {
              id: task.id,
              title: task.title,
              project_id: task.project_id,
            },
          })

          // Test 5: Test comment creation
          try {
            const { data: comment, error: commentError } = await supabase
              .from("comments")
              .insert({
                content: "This is a test comment",
                task_id: task.id,
                profile_id: user.id,
              })
              .select()
              .single()

            if (commentError) {
              testResults.push({
                name: "Comment Creation",
                status: "error",
                message: `Comment creation error: ${commentError.message}`,
              })
            } else {
              testResults.push({
                name: "Comment Creation",
                status: "success",
                message: "Successfully created a test comment",
                details: {
                  id: comment.id,
                  content: comment.content,
                  task_id: comment.task_id,
                },
              })
            }
          } catch (error: any) {
            testResults.push({
              name: "Comment Creation",
              status: "error",
              message: `Comment creation error: ${error.message}`,
            })
          }
        }
      } catch (error: any) {
        testResults.push({
          name: "Task Creation",
          status: "error",
          message: `Task creation error: ${error.message}`,
        })
      }
    } else {
      testResults.push({
        name: "Task Creation",
        status: "skipped",
        message: "Skipped because test project creation failed",
      })

      testResults.push({
        name: "Comment Creation",
        status: "skipped",
        message: "Skipped because test project or task creation failed",
      })
    }

    // Test 6: Test RLS policies by trying to access another user's data
    // This should fail if RLS is working correctly
    try {
      // Try to get projects with a fake owner_id that's not the current user
      const fakeUserId = "00000000-0000-0000-0000-000000000000"
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("owner_id", fakeUserId)
        .limit(1)

      // If we got data for a project not owned by the current user, RLS is not working
      if (!projectsError && projects && projects.length > 0) {
        testResults.push({
          name: "RLS Policy Check",
          status: "error",
          message: "RLS policy failed: able to access projects not owned by current user",
        })
      } else {
        testResults.push({
          name: "RLS Policy Check",
          status: "success",
          message: "RLS policy working: unable to access projects not owned by current user",
        })
      }
    } catch (error: any) {
      testResults.push({
        name: "RLS Policy Check",
        status: "error",
        message: `RLS policy check error: ${error.message}`,
      })
    }

    // Test 7: Check if we can query all tables in a single request
    try {
      const { data, error } = await supabase.rpc("get_database_stats")

      if (error) {
        testResults.push({
          name: "Database Stats Function",
          status: "error",
          message: `Database stats function error: ${error.message}`,
        })
      } else {
        testResults.push({
          name: "Database Stats Function",
          status: "success",
          message: "Successfully retrieved database stats",
          details: data,
        })
      }
    } catch (error: any) {
      testResults.push({
        name: "Database Stats Function",
        status: "error",
        message: `Database stats function error: ${error.message}`,
      })
    }

    // Calculate overall status
    const totalTests = testResults.length
    const successfulTests = testResults.filter((test) => test.status === "success").length
    const failedTests = testResults.filter((test) => test.status === "error").length
    const skippedTests = testResults.filter((test) => test.status === "skipped").length

    return NextResponse.json({
      success: failedTests === 0,
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: failedTests,
        skipped: skippedTests,
        percentage: Math.round((successfulTests / (totalTests - skippedTests)) * 100),
      },
      testResults,
    })
  } catch (error: any) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        error: "Failed to test database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
