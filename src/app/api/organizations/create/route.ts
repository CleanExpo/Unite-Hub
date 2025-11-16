import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const authResult = await authenticateRequest(req);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, email, phone, website, teamSize, industry } = await req.json();

    // Create organization
    const org = await db.organizations.create({
      name,
      email: email || session.user.email,
      phone,
      website,
      team_size: teamSize,
      industry,
      plan: "starter",
      status: "trial",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    // Create default workspace
    const workspace = await db.workspaces.create({
      org_id: org.id,
      name: name,
      description: "Default workspace",
    });

    return NextResponse.json({ org, workspace });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
