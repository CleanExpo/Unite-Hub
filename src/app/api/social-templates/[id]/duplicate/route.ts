import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const { id } = await params;
    const newTemplateId = await fetchMutation(api.socialTemplates.duplicateTemplate, {
      templateId: id as any,
    });

    return NextResponse.json({ success: true, templateId: newTemplateId });
  } catch (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
