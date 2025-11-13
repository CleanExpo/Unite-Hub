import { NextRequest, NextResponse } from "next/server";
import { handleSeedRequest, getTemplateCounts } from "@/lib/social-templates/seedTemplates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;
    const body = await req.json();
    const { platform, category, limit } = body;

    const result = await handleSeedRequest(clientId, {
      platform,
      category,
      limit,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        count: result.count,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error seeding templates:", error);
    return NextResponse.json(
      { error: "Failed to seed templates" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const counts = getTemplateCounts();
    return NextResponse.json({ counts });
  } catch (error) {
    console.error("Error getting template counts:", error);
    return NextResponse.json(
      { error: "Failed to get template counts" },
      { status: 500 }
    );
  }
}
