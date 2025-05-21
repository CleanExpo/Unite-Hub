import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real application, you would fetch projects from your database
    // For now, we'll return sample data
    const projects = [
      {
        id: "ARCH-1a2b3c",
        name: "E-commerce Platform Redesign",
        status: "completed",
        createdAt: "2023-10-15T09:30:00Z",
        updatedAt: "2023-11-01T14:20:00Z",
        meetingDate: "2023-10-18T10:00:00Z",
        totalPoints: 89,
        totalHours: 445,
        budget: 75000,
      },
      {
        id: "ARCH-4d5e6f",
        name: "Mobile App MVP",
        status: "in_progress",
        createdAt: "2023-11-05T11:45:00Z",
        updatedAt: "2023-11-10T16:30:00Z",
        meetingDate: "2023-11-08T14:00:00Z",
        totalPoints: 42,
        totalHours: 210,
        budget: 35000,
      },
      {
        id: "ARCH-7g8h9i",
        name: "Internal Dashboard",
        status: "paid",
        createdAt: "2023-11-12T08:15:00Z",
        updatedAt: "2023-11-12T08:15:00Z",
        meetingDate: "2023-11-15T10:00:00Z",
      },
      {
        id: "ARCH-0j1k2l",
        name: "Customer Portal",
        status: "draft",
        createdAt: "2023-11-14T15:20:00Z",
        updatedAt: "2023-11-14T15:20:00Z",
      },
    ]

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching architecture projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
