import { NextRequest, NextResponse } from "next/server";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await request.json();
    const {
      name,
      email,
      company,
      phone,
      job_title,
      workspace_id,
      status = "prospect",
      tags = [],
    } = body;

    // Validate required fields
    if (!name || !email || !workspace_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, workspace_id" },
        { status: 400 }
      );
    }

    // Validate user authentication and workspace access
    const user = await validateUserAndWorkspace(request, workspace_id);

    // Create client (contact)
    const client = await db.contacts.create({
      workspace_id,
      name,
      email,
      company,
      phone,
      job_title,
      status,
      tags,
      ai_score: 0.5,
      created_by: user.userId,
      last_interaction: new Date(),
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
