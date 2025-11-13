import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/persona/history - Get persona version history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, fetch persona history from database
    // For now, return mock history
    const history = [
      {
        id: crypto.randomUUID(),
        client_id: id,
        version: 1,
        status: "active",
        created_at: new Date(),
        changes_summary: "Initial persona generation",
      },
    ];

    return NextResponse.json({
      history,
      total: history.length,
    });
  } catch (error) {
    console.error("Error fetching persona history:", error);
    return NextResponse.json(
      { error: "Failed to fetch persona history" },
      { status: 500 }
    );
  }
}
