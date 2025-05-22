import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const role = searchParams.get("role")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    // Build query to get users with profiles
    let query = supabase
      .from("user_profiles")
      .select(
        `
        user_id,
        first_name,
        last_name,
        avatar_url,
        user_roles (
          role_id,
          roles (
            id,
            name
          )
        )
      `,
      )
      .limit(limit)

    // Apply role filter if specified
    if (role) {
      query = query.eq("user_roles.roles.name", role)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the response
    const formattedData = data.map((user) => ({
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      roles: user.user_roles.map((ur: any) => ur.roles.name),
    }))

    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error("Error in users endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
