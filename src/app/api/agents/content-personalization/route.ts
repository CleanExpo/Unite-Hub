import { NextRequest, NextResponse } from "next/server";
import {
  generatePersonalizedContent,
  generateBulkContent,
  getPersonalizationMetrics,
} from "@/lib/agents/content-personalization";
import { getHotLeads } from "@/lib/agents/contact-intelligence";

export async function POST(req: NextRequest) {
  try {
    const { action, contactId, contentType, workspaceId } = await req.json();

    if (action === "generate" && contactId && contentType) {
      const content = await generatePersonalizedContent(
        contactId,
        contentType
      );
      return NextResponse.json({ success: true, content });
    }

    if (action === "generate_bulk" && workspaceId && contentType) {
      const hotLeads = await getHotLeads(workspaceId);
      const result = await generateBulkContent(hotLeads, contentType);
      return NextResponse.json({ success: true, result });
    }

    if (action === "metrics" && workspaceId) {
      const metrics = await getPersonalizationMetrics(workspaceId);
      return NextResponse.json({ success: true, metrics });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
