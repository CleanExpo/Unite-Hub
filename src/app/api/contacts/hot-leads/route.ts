import { NextRequest, NextResponse } from "next/server";
import { getHotLeads } from "@/lib/agents/contact-intelligence";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Get hot leads (composite score >= 70)
    const hotLeads = await getHotLeads(workspaceId, limit);

    return NextResponse.json({
      success: true,
      count: hotLeads.length,
      leads: hotLeads,
    });
  } catch (error: any) {
    console.error("Hot leads retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve hot leads" },
      { status: 500 }
    );
  }
}
