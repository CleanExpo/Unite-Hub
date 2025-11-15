import { NextRequest, NextResponse } from "next/server";
import { getOutlookAuthUrl } from "@/lib/integrations/outlook";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await req.json();

    // Create state with orgId
    const state = Buffer.from(orgId).toString("base64");

    // Get auth URL
    const authUrl = await getOutlookAuthUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Outlook connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
