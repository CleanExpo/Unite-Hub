import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usageCount = await fetchMutation(api.socialTemplates.trackUsage, {
      templateId: id as any,
    });

    return NextResponse.json({ success: true, usageCount });
  } catch (error) {
    console.error("Error tracking usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
